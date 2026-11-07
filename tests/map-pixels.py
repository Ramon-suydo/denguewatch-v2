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
   expected=[(237,243,220),(184,211,205),(66,110,136),(69,53,94)][level]
   correct=max(abs(actual-target) for actual,target in zip((r,g,b),expected))<=12
   matched+=int(correct)
 patches.append(matched)
passed=sum(n>=6 for n in patches)>=3
print(json.dumps({'level':level,'matching_pixels_per_9_pixel_patch':patches,'passed':passed}));assert passed,'Expected fill color was not rendered in a majority of actual city-interior patches'
