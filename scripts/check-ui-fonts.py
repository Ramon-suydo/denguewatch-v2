from pathlib import Path
import sys
sys.path.insert(0,str(Path('.artifacts/ui-overhaul/font-tools').resolve()))
from fontTools.ttLib import TTFont
import json,hashlib
rows=[]
for family,weights in [('fraunces',[600]),('figtree',[400,500,600,700])]:
 for weight in weights:
  path=Path(f'node_modules/@fontsource/{family}/files/{family}-latin-{weight}-normal.woff2');font=TTFont(path);cmap=font.getBestCmap();assert all(code in cmap for code in [0x00f1,0x00d1]),f'Missing Filipino characters in {path}';rows.append({'path':str(path).replace('\\','/'),'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'contains_enye_lower_and_upper':True})
Path('docs/evidence/ui-fonts.json').write_text(json.dumps({'font_display':'swap, from the imported Fontsource subset CSS','fonts':rows,'passed':True},indent=2)+'\n',encoding='utf8');print(json.dumps({'fonts':len(rows),'contains_enye_lower_and_upper':True,'passed':True}))
