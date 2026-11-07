"""Rebuild the local Protomaps extract. Requires the official pmtiles CLI on PATH."""
import argparse,datetime,hashlib,json,os,pathlib,re,shutil,subprocess,urllib.request
root=pathlib.Path(__file__).resolve().parents[1];parser=argparse.ArgumentParser();parser.add_argument('--maxzoom',type=int,default=13,choices=range(9,15));args=parser.parse_args()
cli=os.environ.get('PMTILES_BIN') or shutil.which('pmtiles')
if not cli:
 local=root/'.artifacts/ml/pmtiles/pmtiles.exe'
 if local.exists():cli=str(local)
if not cli:raise SystemExit('Install the official pmtiles CLI: https://github.com/protomaps/go-pmtiles/releases')
def get(url):
 with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0 DengueWatch-research','Referer':'https://maps.protomaps.com/'}),timeout=60) as response:return response.read()
builds=json.loads(get('https://build-metadata.protomaps.dev/builds.json'));build=max((b for b in builds if re.fullmatch(r'[0-9]{8}\.pmtiles',b.get('key',''))),key=lambda b:b['key']);url='https://build.protomaps.com/'+build['key']
geo=json.loads((root/'public/geo/ncr-cities.geojson').read_text(encoding='utf-8'));points=[]
def walk(a):
 if isinstance(a[0],(int,float)):points.append(a)
 else:
  for item in a:walk(item)
for feature in geo['features']:walk(feature['geometry']['coordinates'])
bbox=[round(min(p[0] for p in points)-.005,6),round(min(p[1] for p in points)-.005,6),round(max(p[0] for p in points)+.005,6),round(max(p[1] for p in points)+.005,6)]
work=(root/'.artifacts/basemap-build').resolve();assert work.is_relative_to(root);work.mkdir(parents=True,exist_ok=True);candidate=(work/'metro-manila.pmtiles').resolve();assert candidate.parent==work
if candidate.exists():candidate.unlink()
command=[cli,'extract',url,str(candidate),'--bbox='+','.join(map(str,bbox)),'--maxzoom='+str(args.maxzoom),'--download-threads=2'];print(json.dumps({'command':command,'source_metadata':build}),flush=True);subprocess.run(command,check=True)
if candidate.stat().st_size>=50000000:raise SystemExit('Extract exceeds 50 MB. Retry with --maxzoom 12; existing committed basemap is unchanged.')
out=root/'public/basemap';out.mkdir(parents=True,exist_ok=True);target=out/'metro-manila.pmtiles';os.replace(candidate,target);assets=[]
for remote,local in [('fonts/Noto%20Sans%20Regular/0-255.pbf','glyphs/Noto Sans Regular/0-255.pbf'),('sprites/v4/light.json','sprites/light.json'),('sprites/v4/light.png','sprites/light.png'),('sprites/v4/light@2x.json','sprites/light@2x.json'),('sprites/v4/light@2x.png','sprites/light@2x.png')]:
 source='https://protomaps.github.io/basemaps-assets/'+remote;body=get(source);p=out/local;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(body);assets.append({'path':p.relative_to(root).as_posix(),'source_url':source,'bytes':len(body),'sha256':hashlib.sha256(body).hexdigest()})
receipt={'retrieved_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'source_url':url,'build_metadata':build,'bbox':bbox,'maxzoom':args.maxzoom,'bytes':target.stat().st_size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'whole_planet_digest_verified':False,'digest_note':'Region extracted using HTTP ranges; whole-planet digest is metadata only, not a claim of downloading/verifying the entire planet.','attribution':'Protomaps styles BSD-3-Clause; OpenStreetMap ODbL produced work; Noto glyphs OFL-1.1; sprites derived from tangrams/icons MIT.','assets':assets};(root/'data/external/ml-basemap.provenance.json').write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf-8');(out/'config.json').write_text(json.dumps({'available':True,'url':'/basemap/metro-manila.pmtiles','bbox':bbox,'maxzoom':args.maxzoom,'sha256':receipt['sha256']})+'\n',encoding='utf-8');print(json.dumps({'bytes':receipt['bytes'],'sha256':receipt['sha256']}))
