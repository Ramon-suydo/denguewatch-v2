import json, zipfile, hashlib, pathlib
archive=pathlib.Path('.artifacts/geo/full-resolution.zip')
manifest=json.loads(pathlib.Path('data/geo/boundary-source.json').read_text(encoding='utf-8-sig'))
h=hashlib.sha256()
with archive.open('rb') as f:
 for chunk in iter(lambda:f.read(1024*1024),b''): h.update(chunk)
assert h.hexdigest()==manifest['sourceZipSha256'], 'Existing HDX archive checksum differs'
result=[]; decoder=json.JSONDecoder()
with zipfile.ZipFile(archive) as z, z.open('phl_admin4.geojson') as raw:
 import io
 f=io.TextIOWrapper(raw,encoding='utf-8-sig'); buffer=''
 while True:
  buffer+=f.read(1024*1024)
  index=buffer.find('"features"')
  if index>=0:
   index=buffer.find('[',index)
   if index>=0: buffer=buffer[index+1:];break
  assert len(buffer)<10*1024*1024
 eof=False
 while True:
  buffer=buffer.lstrip(' \t\r\n,')
  if buffer.startswith(']'):break
  try: feature,end=decoder.raw_decode(buffer)
  except json.JSONDecodeError:
   chunk=f.read(1024*1024)
   if not chunk: raise
   buffer+=chunk;continue
  buffer=buffer[end:]
  if feature['properties'].get('adm3_pcode')=='PH1303901':
   p=feature['properties'];result.append({'code':p['adm4_pcode']+'|'+p['adm4_name'],'label':p['adm4_name'],'source_pcode':p['adm4_pcode']})

assert len(result)>=258
assert len({r['code'] for r in result})==len(result)
quarantined=[r for r in result if not __import__('re').fullmatch(r'Barangay [0-9]+[A-Za-z]?',r['label'])]
result=[r for r in result if r not in quarantined]
result=sorted(result,key=lambda r:(int(''.join(c for c in r['label'] if c.isdigit()) or '999999'),r['label']))
output={'version':1,'source':manifest['source'],'url':manifest['url'],'license':manifest['license'],'source_zip_sha256':manifest['sourceZipSha256'],'valid_on':manifest['validOn'],'identity_note':'Composite source PCODE and exact label, not an inferred PSGC replacement. City-only selection allowed when an area is not listed. No case counts are assigned to these areas.','quarantined_non_barangay_features':quarantined,'rows':result}
pathlib.Path('data/geo/manila-barangays.json').write_text(json.dumps(output,indent=2)+'\n',encoding='utf-8')
pathlib.Path('public/api/v2/barangays.json').write_text(json.dumps(output,separators=(',',':'))+'\n',encoding='utf-8')
print('Verified source labels:',len(result))
