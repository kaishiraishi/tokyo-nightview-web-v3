#!/usr/bin/env bash
set -euo pipefail

# ---- INPUTS ----
IN_TIF="/Users/kaishiraishi/Desktop/PLATEAU_AWARD/plateau_tokyo_DSM_v2/temp/nightview_potential_full.tif"

# ---- OUTPUT ----
OUT_DIR="./public/NightViewPotential_tiles"
WORK="./public/NightViewPotential_tiles/work"
mkdir -p "$WORK"

# ---- PARAMS ----
MINZ="10"
MAXZ="14"

# -----------------------------
# 1. Reproject to EPSG:3857
# -----------------------------
echo "[1/4] Reprojecting to EPSG:3857..."
gdalwarp -t_srs EPSG:3857 \
  -r bilinear \
  -dstnodata -9999 \
  -co COMPRESS=DEFLATE \
  "$IN_TIF" "$WORK/potential_3857.tif" -overwrite

# -----------------------------
# 2. Smooth the 90m grid so it reads as a continuous heatmap
#    instead of visible square cells (mask-aware Gaussian blur;
#    nodata / out-of-coverage areas stay untouched).
# -----------------------------
echo "[2/5] Smoothing raster..."
MINICONDA_PY="/Users/kaishiraishi/miniconda3/bin/python"
"$MINICONDA_PY" "$(dirname "$0")/smooth-potential-raster.py" \
  "$WORK/potential_3857.tif" "$WORK/potential_3857_smooth.tif" 1.2

# -----------------------------
# 3. Create Color Ramp (0 - 0.8848, MAX_POTENTIAL_VALUE = 0.1635)
# Glow style: alpha rises with value so near-zero cells fade into the
# basemap instead of painting a solid flat field.
# Keep in sync with src/lib/potentialSampler.ts COLOR_RAMP / MAX_POTENTIAL_VALUE.
# -----------------------------
echo "[3/5] Creating color ramp..."
RAMP="$WORK/ramp.txt"
cat << EOF > "$RAMP"
nv 0 0 0 0
0 20 18 30 40
2.58e-13 38 25 74 90
0.000397 86 35 102 140
0.0482 190 75 70 200
0.1635 255 166 0 235
0.8848 255 239 120 255
EOF

# -----------------------------
# 4. Colorize
# -----------------------------
echo "[4/5] Colorizing..."
gdaldem color-relief -alpha \
  "$WORK/potential_3857_smooth.tif" \
  "$RAMP" \
  "$WORK/potential_rgba.tif" -of GTiff -co COMPRESS=DEFLATE

# -----------------------------
# 5. Generate XYZ Tiles
# -----------------------------
echo "[5/5] Generating XYZ tiles..."
# Remove old tiles (only zoom dirs) to avoid confusion
rm -rf "$OUT_DIR/10" "$OUT_DIR/11" "$OUT_DIR/12" "$OUT_DIR/13" "$OUT_DIR/14" "$OUT_DIR/15" "$OUT_DIR/16"

GDAL2TILES="/Users/kaishiraishi/miniconda3/bin/gdal2tiles.py"
"$GDAL2TILES" --xyz -z "${MINZ}-${MAXZ}" \
  --resampling bilinear \
  --webviewer none \
  "$WORK/potential_rgba.tif" \
  "$OUT_DIR"

echo "✅ DONE: Tiles generated in $OUT_DIR"
