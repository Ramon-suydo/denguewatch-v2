import json, zipfile, hashlib, pathlib
archive=pathlib.Path('.artifacts/geo/full-resolution.zip')
manifest=json.loads(pathlib.Path('data/geo/boundary-source.json').read_text(encoding='utf-8-sig'))
h=hashlib.sha256()
with archive.open('rb') as f:
 for chunk in iter(lambda:f.read(1024*1024),b''): h.update(chunk)
assert h.hexdigest()==manifest['sourceZipSha256'], 'Existing HDX archive checksum differs'
result=[]; decoder=json.JSONDecoder()
with zipfile.ZipFile(archive) as z, z.open('phl_admin3.geojson') as raw:
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
  if feature['properties'].get('adm1_pcode')=='PH13':result.append(feature)
assert len(result)==17, len(result)
path=pathlib.Path('data/geo/ncr-boundaries.geojson')
path.write_text(json.dumps({'type':'FeatureCollection','features':result},separators=(',',':'))+'\n',encoding='utf-8')
source={**manifest,'selection':'Exact adm1_pcode PH13, all 17 administrative level 3 city/municipal features; no boundaries invented. Boundary vintage 2025-02-13 is not proof of 2016-2021 boundaries.','reused_verified_local_archive':True,'output_sha256':hashlib.sha256(path.read_bytes()).hexdigest()}
pathlib.Path('data/geo/ncr-source.json').write_text(json.dumps(source,indent=2)+'\n',encoding='utf-8')
print('NCR boundaries:',len(result),path.stat().st_size,'bytes'); print([f['properties']['adm3_name'] for f in result])
