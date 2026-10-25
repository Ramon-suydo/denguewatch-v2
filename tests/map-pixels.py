"""Read-only rendered-image color assertion. Never manufactures a screenshot."""
import sys,json,math
from PIL import Image
image=Image.open(sys.argv[1]).convert('RGB');x,y=int(float(sys.argv[2])),int(float(sys.argv[3]));level=int(sys.argv[4]);matched=0;samples=0
for dy in range(-22,23):
 for dx in range(-22,23):
  if not 8<=math.hypot(dx,dy)<=22 or not(0<=x+dx<image.width and 0<=y+dy<image.height):continue
  r,g,b=image.getpixel((x+dx,y+dy));samples+=1
  correct=(g>r*1.12 and g>b*1.08) if level==0 else (r>g*1.12 and r>b*1.12) if level==3 else (r>g*1.12 and g>b*1.12) if level==2 else (r>=g and g>.83*r and b<.8*g)
  if correct:matched+=1
print(json.dumps({'level':level,'sampled':samples,'matching_pixels':matched,'passed':matched>=8}));assert matched>=8,'Expected traffic color was not rendered near the measured city interior'
