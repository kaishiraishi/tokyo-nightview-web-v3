import sys
from PIL import Image
im=Image.open(sys.argv[1]).convert('RGB'); w,h=im.size; k=w/393
pts=[(x,y) for y in range(int(150*k),int(h-200*k),3) for x in range(0,int(w-80*k),3) if (lambda p: 90<p[0]<130 and p[1]<60 and p[2]>190)(im.getpixel((x,y)))]
if not pts: print('none'); sys.exit()
mx=min(p[0] for p in pts); sel=[p for p in pts if p[0]<mx+25*k]
xs=sorted(p[0] for p in sel); ys=sorted(p[1] for p in sel)
print(int((xs[len(xs)//2]+12*k)/k), int(ys[len(ys)//2]/k))
