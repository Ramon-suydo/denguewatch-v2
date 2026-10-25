"""Conservative rendered-pixel contrast: test every background pixel in each text rectangle."""
from pathlib import Path
from PIL import Image
import json,sys,math
folder=Path('.artifacts/redesign/contrast');results=[]
def luminance(rgb):
 c=[v/255 for v in rgb[:3]];c=[v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in c];return .2126*c[0]+.7152*c[1]+.0722*c[2]
for sample in [(w,l) for w in [360,768,1440] for l in ['en','fil']]:
 width,language=sample
 image=Image.open(folder/f'background-{width}-{language}.png').convert('RGB');targets=json.loads((folder/f'text-{width}-{language}.json').read_text(encoding='utf-8'))
 for target in targets:
  foreground=luminance(target['color']);minimum=3 if target['large'] else 4.5;ratios=[]
  for rect in target['rects']:
   left=max(0,math.floor(rect['x']));right=min(image.width,math.ceil(rect['x']+rect['width']));top=max(0,math.floor(rect['y']));bottom=min(image.height,math.ceil(rect['y']+rect['height']))
   assert right>left and bottom>top,(width,target['text'])
   for rgb in image.crop((left,top,right,bottom)).get_flattened_data():
    bg=luminance(rgb);ratios.append((max(foreground,bg)+.05)/(min(foreground,bg)+.05))
  worst=min(ratios);results.append({'width':width,'language':language,'text':target['text'],'minimum_required':minimum,'worst_measured_ratio':worst,'pixels_sampled':len(ratios),'passed':worst>=minimum})
report={'method':'Actual browser-rendered background with text colour/shadow hidden but layout and overlays preserved. Every pixel in every DOM text-range rectangle is tested, a conservative superset of glyph pixels; computed foreground and large-text threshold follow WCAG AA. Includes 360/768/1440 widths in English and Filipino.','results':results,'passed':all(r['passed'] for r in results)};Path('docs/evidence/hero-contrast.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8');print(json.dumps(report,indent=2));sys.exit(0 if report['passed'] else 1)
