from pathlib import Path
import subprocess,zipfile,json,hashlib,re
root=Path.cwd().resolve();manifest_path=root/'docs/evidence/ui-command-manifest.json';manifest=json.loads(manifest_path.read_text(encoding='utf8'))
required={'build','budget','lint','typecheck','unit','contrast','database','browser-1','browser-2','browser-3','production','pwa','visual-baselines','visual-compare','compat','audit','zap','secrets'}
assert required.issubset({r['name'] for r in manifest['results']}),'Final gates incomplete'
assert all(r['exit_code']==0 or r['name']=='secrets' and r['owner_blocked'] for r in manifest['results']),'Unexpected gate failure'
source_commit=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
protected=subprocess.check_output(['git','diff','--name-only','5d9bdb4','--','ml','data','public/ml','public/api','public/geo','supabase','src/lib/signals.ts','src/ml/scorer.ts','src/ml/live.ts','src/ml/live-scorer.ts'],text=True);assert not protected.strip(),'Protected model/data/security files changed'

files=subprocess.check_output(['git','ls-files','--cached','--others','--exclude-standard','-z']).decode('utf8').split('\0');entries={};integrity=[]
def sha(data):return hashlib.sha256(data).hexdigest()
def text_bytes(path):
 data=path.read_bytes()
 if data.startswith(b'\xff\xfe'):return data.decode('utf-16')
 return data.decode('utf-8-sig',errors='replace')
def sanitize(text):
 text=re.sub(r'\x1b\[[0-?]*[ -/]*[@-~]','',text)
 for value in [str(root),str(root).replace('\\','/'),str(Path.home()),str(Path.home()).replace('\\','/')]:text=text.replace(value,'<REPOSITORY>' if 'denguewatch' in value.lower() else '<USER>')
 text=re.sub(r'\b[A-Za-z0-9._%+-]+@gmail[.]com\b','[personal contact withheld]',text,flags=re.I)
 text=re.sub(r'DW2-[A-F0-9]{32}','[local test withdrawal code]',text)
 return text
roots={'README.md','CONTRIBUTING.md','AGENTS.md','package.json','package-lock.json','index.html','tsconfig.json','tsconfig.node.json','vite.config.ts','playwright.config.ts','playwright.production.config.ts','playwright.research.config.ts','playwright.visual.config.ts','THIRD_PARTY_LICENSES.md','vercel.json','requirements-environment.txt'}
for name in sorted(set(files)):
 if not name:continue
 path=(root/name).resolve()
 if not path.is_file() or root not in path.parents:continue
 dest=None
 if name.startswith(('src/','scripts/','.github/','ml/')) or name in roots:dest='source/'+name
 elif name.startswith('tests/') and not name.startswith('tests/visual/baselines/'):dest='source/'+name
 elif name.startswith('supabase/migrations/'):dest='sql/'+Path(name).name
 elif name.startswith('docs/') and path.suffix.lower() in {'.md','.json','.png','.txt','.html'}:dest=name
 elif name.startswith(('public/ml/','data/processed/ml/')):dest=name
 elif name.startswith('data/') and ('ml-' in name and name.endswith('.json')):dest=name
 elif name.startswith('public/api/v2/') and path.suffix=='.json':dest=name
 elif name in {'public/geo/ncr-cities.geojson','public/geo/philippines.geojson','public/SECURITY.md','public/THIRD_PARTY_LICENSES.md','public/hero-preload.js','public/icon.svg','public/manifest.webmanifest'}:dest=name
 elif name.startswith('public/img/') and '/source/' not in name and path.suffix in {'.avif','.webp','.svg'}:dest=name
 if not dest:continue
 data=path.read_bytes();original=sha(data)
 if name.startswith('docs/') and path.suffix=='.md':data=sanitize(text_bytes(path)).encode('utf8')
 entries[dest]=data;integrity.append({'source':name,'copy':dest,'source_sha256':original,'copy_sha256':sha(data),'sanitized':original!=sha(data)})
for row in manifest['results']:
 path=root/row['log'];log_text=text_bytes(path)
 if row['name']=='secrets':
  summaries=[]
  for line in log_text.splitlines():
   try:
    item=json.loads(line)
    if isinstance(item,dict) and 'current_findings' in item:summaries.append(item)
   except json.JSONDecodeError:pass
  assert summaries,'Missing actual secret-audit summary'
  audit=summaries[-1];assert audit['private_guard_configured'] and audit['current_findings']==0 and audit['unexpected_historical_findings']==0,'Current/unexpected secret issue blocks bundle'
  if row['exit_code']!=0:assert audit['historical_findings']==44 and audit['rotation_status']=='NEEDS OWNER','Unexpected audit failure is not an owner exception'
 entries['logs/'+path.name]=sanitize(log_text).encode('utf8')
for name in ['repro.log','leakage.log','lighthouse-final.log','browser-first.log','browser-second.log','overhaul-first.log','overhaul-second.log','pixels.log','transitions.log','geography.log','diagnostic-skiplink.log','diagnostic-pre-anchor.json','diagnostic-visual-fonts.log','diagnostic-night-contrast.json','diagnostic-document-reload.log','diagnostic-visual-readiness.log','night-state-audit.json']:
 path=root/'.artifacts/ui-overhaul'/name
 if path.exists():entries[('logs/' if name in ['repro.log','leakage.log','lighthouse-final.log'] else 'diagnostics/')+name]=sanitize(text_bytes(path)).encode('utf8')
for name in ['diagnostic-old-headings.log','diagnostic-restart-production.log','diagnostic-worker-restart.json','diagnostic-visual-selection.json','diagnostic-pre-refresh-compare.log']:
 path=root/'.artifacts/manila-focus'/name
 if path.exists():entries['diagnostics/manila-focus/'+name]=sanitize(text_bytes(path)).encode('utf8')
baselines=[]
for path in sorted((root/'tests/visual/baselines').glob('*.png')):baselines.append({'path':path.relative_to(root).as_posix(),'sha256':sha(path.read_bytes()),'bytes':path.stat().st_size})
assert len(baselines)==80,'Expected 80 visual baselines'
assert sum(name.startswith('docs/evidence/ui-overhaul/') and name.endswith('.png') for name in entries)==20,'Expected 20 review screenshots'
entries['VISUAL_BASELINES.json']=(json.dumps(baselines,indent=2)+'\n').encode()
entries['COPY_INTEGRITY.json']=(json.dumps(integrity,indent=2)+'\n').encode()
entries['COMMAND_MANIFEST.json']=(json.dumps(manifest,indent=2)+'\n').encode()
entries['BUNDLE_SOURCE.json']=(json.dumps({'source_commit':source_commit,'ui_baseline':'5d9bdb4','presentation_baseline':'1ed560a','branch':'feat/ui-overhaul','not_pushed':True,'protected_files':'ML pipeline, generated data/models, schema and submission/security APIs unchanged relative to UI baseline.','scope':'Source/review evidence, not a complete runnable clone. Raw inputs and large basemap tiles stay in the repository. Log paths/contact/test codes are sanitized; final logs and retained attempt diagnostics are included.'},indent=2)+'\n').encode()
entries['00_INDEX.md']=b'# DengueWatch UI review\n\nStart with docs/evidence/manila-focus-checks.md and docs/evidence/ui-overhaul-checks.md, docs/BRAND.md, docs/DESIGN_SYSTEM.md, docs/MOTION.md and docs/UX_DECISIONS.md. Screenshots at 360/1280 px in both themes are under docs/evidence/ui-overhaul/. All 80 baseline hashes are in VISUAL_BASELINES.json; the actual baselines are committed in the repository.\n\nCOMMAND_MANIFEST.json contains real final command results. Historical secret rotation, approved contact, photo permission, Filipino review, DPO/hosted/human checks remain owner work. This is not deployment clearance. No push or hosted write occurred.\n'
for name in entries:
 assert not name.startswith('/') and '..' not in Path(name).parts
 assert not any(part in {'.git','.env','node_modules','certs'} for part in Path(name).parts)
assert not any(n.startswith('data/raw/') for n in entries)
archive=root/'review_bundle.zip'
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as bundle:
 for name,data in sorted(entries.items()):bundle.writestr(name,data)
with zipfile.ZipFile(archive) as bundle:assert bundle.testzip() is None
checksum=sha(archive.read_bytes());(root/'review_bundle.zip.sha256').write_text(checksum+'  review_bundle.zip\n',encoding='utf8')
print(json.dumps({'files':len(entries),'bytes':archive.stat().st_size,'sha256':checksum,'source_commit':source_commit,'archive_integrity':True}))
