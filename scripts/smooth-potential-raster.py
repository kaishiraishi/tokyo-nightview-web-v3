#!/usr/bin/env python3
"""Mask-aware Gaussian smoothing for the potential raster.

Blurs the 90m source grid so the heatmap reads as a continuous field
instead of visible square cells, without bleeding valid values into
nodata (out-of-coverage) areas.

Usage: smooth-potential-raster.py <in.tif> <out.tif> [sigma_in_pixels]
"""
import sys

import numpy as np
from osgeo import gdal
from scipy.ndimage import gaussian_filter

gdal.UseExceptions()


def main() -> None:
    in_path, out_path = sys.argv[1], sys.argv[2]
    sigma = float(sys.argv[3]) if len(sys.argv) > 3 else 1.2

    src = gdal.Open(in_path)
    band = src.GetRasterBand(1)
    nodata = band.GetNoDataValue()
    values = band.ReadAsArray().astype(np.float64)

    mask = np.ones_like(values) if nodata is None else (values != nodata).astype(np.float64)
    filled = np.where(mask > 0, values, 0.0)

    blurred_values = gaussian_filter(filled, sigma=sigma)
    blurred_mask = gaussian_filter(mask, sigma=sigma)

    with np.errstate(invalid="ignore", divide="ignore"):
        smoothed = blurred_values / blurred_mask

    out_nodata = nodata if nodata is not None else -9999.0
    smoothed = np.where(blurred_mask > 0.05, smoothed, out_nodata)

    driver = gdal.GetDriverByName("GTiff")
    out = driver.Create(
        out_path,
        src.RasterXSize,
        src.RasterYSize,
        1,
        gdal.GDT_Float32,
        options=["COMPRESS=DEFLATE"],
    )
    out.SetGeoTransform(src.GetGeoTransform())
    out.SetProjection(src.GetProjection())
    out_band = out.GetRasterBand(1)
    out_band.WriteArray(smoothed.astype(np.float32))
    out_band.SetNoDataValue(out_nodata)
    out_band.FlushCache()
    out = None
    src = None


if __name__ == "__main__":
    main()
