import json,unicodedata,csv,hashlib,pathlib
from shapely.geometry import shape,mapping
root=pathlib.Path.cwd();src=root/'data/geo/ncr-boundaries.geojson';data=json.loads(src.read_text(encoding='utf-8'));units=sorted({r['loc'] for r in csv.DictReader((root/'data/raw/doh-epi-dengue-data-2016-2021.csv').read_text(encoding='utf-8-sig').splitlines()) if r['Region']=='NATIONAL CAPITAL REGION'})
def canon(s):return ''.join(c for c in unicodedata.normalize('NFD',s.upper()) if unicodedata.category(c)!='Mn')
features=[];crosswalk=[]
for f in data['features']:
 p=f['properties'];original=p['adm3_name'];name=canon(original);name=name.replace('CITY OF ','')+' CITY' if name.startswith('CITY OF ') else name
 match=name if name in units else None;g=shape(f['geometry']).simplify(.0001,preserve_topology=True);assert g.is_valid
 point=g.representative_point();identifier=p['adm3_pcode'];properties={'id':identifier,'city':match,'name':original,'center':[point.x,point.y]};features.append({'type':'Feature','id':identifier,'properties':properties,'geometry':mapping(g)})
 crosswalk.append({'id':identifier,'boundary_name':original,'doh_name':match,'normalization':'Uppercase/diacritics; explicit CITY OF X to X CITY; PATEROS unchanged. No fuzzy match.','catchment_equivalence':'Needs source-owner confirmation; name agreement alone is not catchment verification.'})
assert len(features)==17 and {r['doh_name'] for r in crosswalk}==set(units)
(root/'public/geo/ncr-cities.geojson').write_text(json.dumps({'type':'FeatureCollection','features':features},separators=(',',':'))+'\n',encoding='utf-8');(root/'src/content/ncr-cities.json').write_text(json.dumps(units)+'\n');(root/'data/geo/ncr-ml-crosswalk.json').write_text(json.dumps({'source':str(src.relative_to(root)),'source_sha256':hashlib.sha256(src.read_bytes()).hexdigest(),'licence':'CC BY 3.0 IGO; source NAMRIA/PSA/OCHA; see existing LICENSE-boundaries.txt','rows':crosswalk,'unmatched':[]},indent=2)+'\n');print(json.dumps({'features':len(features),'matched':len(units),'unmatched':[],'bytes':(root/'public/geo/ncr-cities.geojson').stat().st_size}))

import math
points=[]
def flat(coordinates):
 if isinstance(coordinates[0],(int,float)):points.append(coordinates)
 else:
  for child in coordinates:flat(child)
for feature in features:flat(feature['geometry']['coordinates'])
left=min(v[0] for v in points);right=max(v[0] for v in points);bottom=min(v[1] for v in points);top=max(v[1] for v in points)
def ring(values):return 'M'+' L'.join(f'{12+(x-left)/(right-left)*236:.3f},{12+(top-y)/(top-bottom)*276:.3f}' for x,y,*rest in values)+' Z'
paths=[]
for f in features:
 polygons=[f['geometry']['coordinates']] if f['geometry']['type']=='Polygon' else f['geometry']['coordinates']
 paths.append('<path d="'+ ' '.join(ring(r) for polygon in polygons for r in polygon)+'" fill="#b8dad4" stroke="#173c4c" stroke-width="1" fill-rule="evenodd"/>')
(root/'public/img/metro-example.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" width="260" height="300" viewBox="0 0 260 300"><title>Metro Manila city boundaries; no risk values encoded</title>'+''.join(paths)+'</svg>\n',encoding='utf-8')
