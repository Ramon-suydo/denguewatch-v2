from pathlib import Path
from PIL import Image
import hashlib,json
source=Path('public/img/source/Twilight Skyline with Curving Light Trails.png');image=Image.open(source).convert('RGB');rows=[]
for width in [640,960,1280,1672]:
 target=Path(f'public/img/manila-{width}.avif');height=round(image.height*width/image.width);image.resize((width,height),Image.Resampling.LANCZOS).save(target,format='AVIF',quality=45,speed=6);rows.append({'path':str(target).replace('\\','/'),'width':width,'height':height,'bytes':target.stat().st_size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()})
report={'source':str(source).replace('\\','/'),'source_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'credit':'Background photograph by Sumarie Slabber.','operation':'Resize original photograph with Lanczos, AVIF quality 45/speed 6. No generated image or content edit. Existing WebP fallbacks retained.','assets':rows};Path('docs/evidence/ui-hero-assets.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8');print(json.dumps(rows))

manifest_path=Path('docs/evidence/hero-assets.json');manifest=json.loads(manifest_path.read_text(encoding='utf8'));assert manifest['original_sha256']==report['source_sha256'],'Original photograph changed';updates={row['path']:row for row in rows};manifest['assets']=[updates.get(row['path'],row) for row in manifest['assets']];manifest['avif_encoding']='Pillow AVIF quality 45 / speed 6; original and WebP files unchanged';manifest_path.write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf8')
