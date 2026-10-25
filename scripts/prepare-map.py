"""Local national display boundaries and explicit, auditable name crosswalk. No fuzzy matches."""
import pathlib,json,csv,hashlib,unicodedata,datetime
from shapely.geometry import shape,mapping
root=pathlib.Path.cwd();source=root/'data/external/redesign-phl-adm2.json';raw=list(csv.DictReader((root/'data/raw/doh-epi-dengue-data-2016-2021.csv').open(encoding='utf-8-sig')));units=sorted({r['loc'].strip().upper() for r in raw if not r['loc'].startswith('#')})
def canon(name):return ''.join(c for c in unicodedata.normalize('NFD',name.upper().strip()) if unicodedata.category(c)!='Mn')
features=json.loads(source.read_text(encoding='utf-8'))['features'];ncr=json.loads((root/'data/geo/ncr-boundaries.geojson').read_text(encoding='utf-8'))['features'];output=[];crosswalk=[]
for f in features+ncr:
 p=f['properties'];national='shapeName' in p;name=p['shapeName'] if national else p['adm3_name'];identifier=p['shapeID'] if national else p['adm3_pcode'];candidate=canon(name)
 # Explicit source-name transformations, recorded per row; never fuzzy spelling or administrative reassignment.
 aliases={'CITY OF ISABELA':'ISABELA CITY'}
 if not national:
  candidate=candidate.replace('CITY OF ','')+' CITY' if candidate.startswith('CITY OF ') else candidate
  if candidate=='PATEROS':candidate='PATEROS'
 else:candidate=aliases.get(candidate,candidate)
 matched=candidate if candidate in units else None
 geom=shape(f['geometry']);assert geom.is_valid,identifier
 simple=geom.simplify(.008 if national else .001,preserve_topology=True);assert simple.is_valid and not simple.is_empty
 center=geom.centroid;entry={'boundary_id':identifier,'boundary_name':name,'case_name':matched,'match':'explicit crosswalk' if matched else 'unmatched: no data','boundary_source':'geoBoundaries PHL ADM2 2020' if national else 'NAMRIA/PSA OCHA NCR ADM3 2025','normalization':'case/diacritics/trim; City of X -> X CITY only for named NCR cities; explicit City of Isabela alias','longitude':round(center.x,6),'latitude':round(center.y,6),'weather_point_method':'geometric polygon centroid; may lie offshore; provider selects its grid cell','boundary_scope_verified':False,'scope_note':'Reporting-unit/boundary equivalence and independently reported city exclusions need source-owner confirmation; exact names alone do not verify scope.'}
 crosswalk.append(entry);output.append({'type':'Feature','id':identifier,'properties':{'id':identifier,'name':name,'case_name':matched},'geometry':mapping(simple)})
path=root/'data/geo/national-crosswalk.json';path.write_text(json.dumps({'version':1,'case_units':units,'rows':crosswalk,'unmatched_case_units':sorted(set(units)-{x['case_name'] for x in crosswalk if x['case_name']}),'name_matching_policy':'No fuzzy matching; ambiguous renamed units and district/city mismatches remain unmatched. Polygon/reporting-area equivalence is not established by a name match.'},indent=2)+'\n',encoding='utf-8');out=root/'public/geo/philippines.geojson';out.write_text(json.dumps({'type':'FeatureCollection','features':output},separators=(',',':'))+'\n',encoding='utf-8')
print(json.dumps({'features':len(output),'matched':sum(x['case_name'] is not None for x in crosswalk),'unmatched_boundaries':[x['boundary_name'] for x in crosswalk if x['case_name'] is None],'unmatched_case_units':json.loads(path.read_text())['unmatched_case_units'],'geojson_bytes':out.stat().st_size,'source_sha256':hashlib.sha256(source.read_bytes()).hexdigest()}))
