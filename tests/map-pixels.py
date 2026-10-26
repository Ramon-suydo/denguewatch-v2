"""Read-only rendered-image assertion on five city-interior patches, away from outlines/labels."""
import sys,json
from PIL import Image
image=Image.open(sys.argv[1]).convert('RGB');points=json.loads(sys.argv[2]);level=int(sys.argv[3]);patches=[]
assert len(points)==5
for point in points:
 x,y=int(point['x']),int(point['y']);matched=0
 for dy in range(-1,2):
  for dx in range(-1,2):
   assert 0<=x+dx<image.width and 0<=y+dy<image.height
   r,g,b=image.getpixel((x+dx,y+dy))
   correct=(g>r*1.12 and g>b*1.08) if level==0 else (r>g*1.12 and r>b*1.12) if level==3 else (r>g*1.12 and g>b*1.12) if level==2 else (r>=g and g>.83*r and b<.8*g)
   matched+=int(correct)
 patches.append(matched)
passed=sum(n>=6 for n in patches)>=3
print(json.dumps({'level':level,'matching_pixels_per_9_pixel_patch':patches,'passed':passed}));assert passed,'Expected fill color was not rendered in a majority of actual city-interior patches'
