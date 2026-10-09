import sys, glob, os
# Apple の Product Bezels（iPhone 16）の PNG があるフォルダ。リポジトリには入れない（Apple のライセンスのため）
FRAME_DIR = os.environ.get('FRAME_DIR', os.path.expanduser('~/Downloads/Bezel-iPhone-16/PNG/iPhone 16'))
from PIL import Image, ImageDraw, ImageFilter
frame = Image.open(os.path.join(FRAME_DIR, 'iPhone 16 - Black - Portrait.png')).convert('RGBA')
W, H = frame.size
a = frame.split()[3]
bw = a.point(lambda v: 255 if v < 128 else 0)  # transparent -> white
ImageDraw.floodfill(bw, (W // 2, H // 2), 128)
mask = bw.point(lambda v: 255 if v == 128 else 0)
# include pixels under semi-transparent edge: dilate 2px so no gap at the inner bezel edge (frame drawn on top anyway)
mask = mask.filter(ImageFilter.MaxFilter(5))
def landscape(path, out):
    lf = Image.open(os.path.join(FRAME_DIR, 'iPhone 16 - Black - Landscape.png')).convert('RGBA')
    lw, lh = lf.size
    m = lf.split()[3].point(lambda v: 255 if v < 128 else 0)
    ImageDraw.floodfill(m, (lw // 2, lh // 2), 128)
    m = m.point(lambda v: 255 if v == 128 else 0).filter(ImageFilter.MaxFilter(5))
    layer = Image.new('RGBA', (lw, lh)); layer.paste(Image.open(path).convert('RGBA'), (90, 90))
    c = Image.new('RGBA', (lw, lh)); c.paste(layer, (0, 0), m); c.alpha_composite(lf)
    c.save(os.path.join(out, os.path.basename(path)), optimize=True)

src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
for f in sorted(glob.glob(os.path.join(src, '*.png'))):
    shot = Image.open(f).convert('RGBA')
    if shot.size == (2556, 1179):
        landscape(f, out); continue
    if shot.size != (1179, 2556):
        print('skip', os.path.basename(f), shot.size); continue
    canvas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    layer.paste(shot, (90, 90))
    canvas.paste(layer, (0, 0), mask)
    canvas.alpha_composite(frame)
    canvas.save(os.path.join(out, os.path.basename(f)), optimize=True)
print('done')

