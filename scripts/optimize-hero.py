"""Optimize only the owner-supplied photograph; preserve its original bytes."""
from pathlib import Path
from PIL import Image
import hashlib,json,shutil
folder=Path('public/img');dest=folder/'source';dest.mkdir(exist_ok=True);original=next(iter(dest.glob('*.png')),None)
if original is None:
 original=next(folder.glob('*.png'));target=dest/original.name;assert target.resolve().parent==dest.resolve();shutil.move(str(original),str(target));original=target
before=hashlib.sha256(original.read_bytes()).hexdigest();image=Image.open(original).convert('RGB');assert image.size==(1672,941);rows=[]
for width in [640,960,1280,1672]:
 height=round(image.height*width/image.width);resized=image.resize((width,height),Image.Resampling.LANCZOS)
 for ext,quality in [('webp',72),('avif',52)]:
  path=folder/f'manila-{width}.{ext}';resized.save(path,quality=quality);rows.append({'path':str(path).replace('\\','/'),'width':width,'height':height,'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
assert next(r for r in rows if r['width']==1672 and r['path'].endswith('webp'))['bytes']<250000
assert hashlib.sha256(original.read_bytes()).hexdigest()==before
Path('docs/evidence/hero-assets.json').write_text(json.dumps({'original_sha256':before,'original_dimensions':[1672,941],'original_unchanged':True,'assets':rows},indent=2)+'\n',encoding='utf-8');print(json.dumps(rows))
