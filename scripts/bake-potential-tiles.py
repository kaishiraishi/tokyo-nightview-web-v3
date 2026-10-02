#!/usr/bin/env python3
"""Bake the displayed threshold into the potential tiles and write lossless WebP.

Why: the client used to read every raster tile, reverse-look-up the potential value for all
65,536 pixels, drop the ones under the threshold and re-encode a PNG on the main thread
(about 77 ms per tile on an M2, several times that on a phone). Doing it once here makes the
client a plain raster source, and the lossless WebP is about 1/8 the size of the PNG.

Keep in sync with src/lib/potentialSampler.ts (POTENTIAL_COLOR_RAMP, MAX_POTENTIAL_VALUE,
POTENTIAL_THRESHOLD) and scripts/make-potential-tiles.sh (color ramp).

Usage:
  python3 scripts/bake-potential-tiles.py [--src tiles-work/potential-png]
                                          [--dst public/NightViewPotential_tiles]
                                          [--threshold 0.006]
Requires numpy and Pillow built with WebP support.
"""
from __future__ import annotations

import argparse
import io
import shutil
import sys
from pathlib import Path

import numpy as np
from PIL import Image

MAX_POTENTIAL_VALUE = 0.1635
DEFAULT_THRESHOLD = 0.006
# (value, RGBA). Same stops as POTENTIAL_COLOR_RAMP in src/lib/potentialSampler.ts.
COLOR_RAMP = [
    (0.0, (20, 18, 30, 40)),
    (2.58e-13, (38, 25, 74, 90)),
    (0.000397, (86, 35, 102, 140)),
    (0.0482, (190, 75, 70, 200)),
    (0.1635, (255, 166, 0, 235)),
    (0.8848, (255, 239, 120, 255)),
]
ZOOM_DIRS = ("10", "11", "12", "13", "14", "15", "16")


def potential_values(rgba: np.ndarray) -> np.ndarray:
    """Vectorised potentialValueFromPixel(): nearest point on the color-ramp polyline."""
    pixels = rgba.astype(np.float64)
    best_value = np.zeros(pixels.shape[:2])
    best_error = np.full(pixels.shape[:2], np.inf)
    for (v0, c0), (v1, c1) in zip(COLOR_RAMP, COLOR_RAMP[1:]):
        start = np.array(c0, dtype=np.float64)
        vector = np.array(c1, dtype=np.float64) - start
        offset = pixels - start
        denominator = float((vector * vector).sum())
        projection = np.clip((offset * vector).sum(axis=-1) / denominator, 0.0, 1.0)
        error = ((offset - vector * projection[..., None]) ** 2).sum(axis=-1)
        closer = error < best_error
        best_error[closer] = error[closer]
        best_value[closer] = (v0 + (v1 - v0) * projection)[closer]
    values = np.clip(best_value, 0.0, MAX_POTENTIAL_VALUE)
    values[pixels[..., 3] < 8] = 0.0
    return values


def encode_webp(image: Image.Image) -> bytes:
    buffer = io.BytesIO()
    image.save(buffer, format="WEBP", lossless=True, method=6)
    return buffer.getvalue()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--src", default="tiles-work/potential-png", type=Path)
    parser.add_argument("--dst", default="public/NightViewPotential_tiles", type=Path)
    parser.add_argument("--threshold", default=DEFAULT_THRESHOLD, type=float)
    args = parser.parse_args()

    sources = sorted(path for zoom in ZOOM_DIRS for path in (args.src / zoom).glob("*/*.png"))
    if not sources:
        print(f"No PNG tiles found under {args.src}", file=sys.stderr)
        return 1

    for zoom in ZOOM_DIRS:
        shutil.rmtree(args.dst / zoom, ignore_errors=True)

    # Tiles that end up fully transparent are still written. A missing tile (404) makes MapLibre
    # fall back to the parent tile, which would paint coarse data over an area that should be empty.
    transparent = encode_webp(Image.new("RGBA", (256, 256), (0, 0, 0, 0)))
    empty = 0
    total_bytes = 0
    for source in sources:
        zoom, x = source.parent.parent.name, source.parent.name
        target = args.dst / zoom / x / f"{source.stem}.webp"
        target.parent.mkdir(parents=True, exist_ok=True)

        rgba = np.array(Image.open(source).convert("RGBA"))
        rgba[potential_values(rgba) < args.threshold, 3] = 0
        if not rgba[..., 3].any():
            data = transparent
            empty += 1
        else:
            data = encode_webp(Image.fromarray(rgba))
        target.write_bytes(data)
        total_bytes += len(data)

    print(f"Baked {len(sources)} tiles (threshold {args.threshold}): {empty} fully transparent, "
          f"{total_bytes / 1048576:.2f} MB -> {args.dst}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
