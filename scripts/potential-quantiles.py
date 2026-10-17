#!/usr/bin/env python3
"""Build src/lib/potentialQuantiles.ts from the baked potential tiles.

デバッグモードの「上位 何% か」表示用。z14 タイルの、光っている画素（閾値 0.006 以上）の値の
分布（0.1% 刻みの分位点）を書き出す。値は potentialSampler.ts の potentialValueFromPixel と
同じ方法（色ランプの逆引き）で復元する。タイルや色ランプ・閾値を変えたら再実行してコミットする。

Usage: python3 scripts/potential-quantiles.py [tiles_dir] [out_ts]
"""
import glob
import sys

import numpy as np
from PIL import Image

# scripts/make-potential-tiles.sh / bake-potential-tiles.py / potentialSampler.ts と同期する
RAMP = [
    (0.0, (20, 18, 30, 40)),
    (6.75e-16, (38, 25, 74, 90)),
    (0.001501, (86, 35, 102, 140)),
    (0.068621, (190, 75, 70, 200)),
    (0.161529, (255, 166, 0, 235)),
    (0.704804, (255, 239, 120, 255)),
]
MAX_VALUE = 0.161529
ZOOM = 14
STEPS = 1000


def invert(pixels: np.ndarray) -> np.ndarray:
    best_err = np.full(len(pixels), np.inf)
    best_val = np.zeros(len(pixels))
    for (v0, c0), (v1, c1) in zip(RAMP, RAMP[1:]):
        start = np.array(c0, float)
        vec = np.array(c1, float) - start
        point = pixels - start
        t = np.clip((point @ vec) / (vec @ vec), 0, 1)
        err = ((point - t[:, None] * vec) ** 2).sum(axis=1)
        better = err < best_err
        best_err = np.where(better, err, best_err)
        best_val = np.where(better, v0 + (v1 - v0) * t, best_val)
    return np.clip(best_val, 0, MAX_VALUE)


def main() -> None:
    tiles_dir = sys.argv[1] if len(sys.argv) > 1 else "public/NightViewPotential_tiles"
    out_path = sys.argv[2] if len(sys.argv) > 2 else "src/lib/potentialQuantiles.ts"
    chunks = []
    for path in glob.glob(f"{tiles_dir}/{ZOOM}/*/*.webp"):
        rgba = np.array(Image.open(path).convert("RGBA")).reshape(-1, 4).astype(float)
        lit = rgba[rgba[:, 3] >= 8]  # potentialValueFromPixel と同じ（アルファ 8 未満は 0 扱い）
        if len(lit):
            chunks.append(invert(lit))
    values = np.concatenate(chunks)
    quantiles = np.quantile(values, np.linspace(0, 1, STEPS + 1))
    body = ", ".join(f"{q:.5f}" for q in quantiles)
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(
            "// scripts/potential-quantiles.py で生成（手で編集しない）。\n"
            f"// z{ZOOM} タイルの、光っている画素（閾値以上）{len(values)} 個の値の分位点。\n"
            "// 配列の i 番目 = 下位 i/1000 の位置の値。タイルや色ランプ・閾値を変えたら再生成する。\n"
            f"export const POTENTIAL_QUANTILE_PIXELS = {len(values)};\n"
            f"export const POTENTIAL_QUANTILES: readonly number[] = [{body}];\n"
        )
    print(f"{len(values)} pixels -> {out_path}")
    for q in (0.5, 0.9, 0.99):
        print(f"  p{q * 100:g} = {np.quantile(values, q):.4f}")


if __name__ == "__main__":
    main()
