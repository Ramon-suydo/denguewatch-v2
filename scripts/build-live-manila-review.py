"""Package local review evidence; never raw inputs, owner screenshots or credentials."""
from pathlib import Path
import hashlib, json, re, subprocess, zipfile

root = Path.cwd().resolve()
def sha(data): return hashlib.sha256(data).hexdigest()
protected = json.loads((root/'data/live-manila/protected-hashes.json').read_text(encoding='utf8'))
for name, expected in protected.items():
    assert sha((root/name).read_bytes()) == expected, 'Protected artifact changed: '+name
manifest = json.loads((root/'.artifacts/live-manila/checks.json').read_text(encoding='utf8'))
latest = {r['name']:r for r in manifest['results']}
required = ['ingestion','typecheck','lint','unit','live-data-validation','data-validation','credits','contrast','hero-contrast','build','prerender','pwa-build','budget','browser','production','pwa','visual','compat','lighthouse','zap','npm-audit','secrets']
for name in required:
    assert name in latest, 'Missing current check: '+name
    if name != 'secrets': assert latest[name]['exit_code'] == 0, 'Check failed: '+name
secret_log = (root/latest['secrets']['log']).read_text(encoding='utf8-sig')
summaries=[]
for line in secret_log.splitlines():
    try:
        item=json.loads(line)
        if isinstance(item,dict) and 'current_findings' in item: summaries.append(item)
    except json.JSONDecodeError: pass
assert summaries, 'Missing actual secret audit summary'
audit=summaries[-1]
assert audit['current_findings']==0 and audit['unexpected_historical_findings']==0
if latest['secrets']['exit_code'] != 0:
    assert audit['historical_findings']==44 and audit['rotation_status']=='NEEDS OWNER'

def sanitize(text):
    text=re.sub(r'\x1b\[[0-?]*[ -/]*[@-~]','',text)
    for value,label in [(str(root),'<REPOSITORY>'),(str(root).replace('\\','/'),'<REPOSITORY>'),(str(Path.home()),'<USER>'),(str(Path.home()).replace('\\','/'),'<USER>')]: text=text.replace(value,label)
    text=re.sub(r'\b[A-Za-z0-9._%+-]+@gmail[.]com\b','[personal contact withheld]',text,flags=re.I)
    return re.sub(r'DW2-[A-F0-9]{32}','[local test withdrawal code]',text)

names=subprocess.check_output(['git','ls-files','--cached','--others','--exclude-standard','-z']).decode('utf8').split('\0')
entries={}; integrity=[]
roots={'README.md','CONTRIBUTING.md','AGENTS.md','package.json','package-lock.json','index.html','tsconfig.json','tsconfig.node.json','vite.config.ts','eslint.config.mjs','playwright.config.ts','playwright.production.config.ts','playwright.research.config.ts','playwright.visual.config.ts','THIRD_PARTY_LICENSES.md','vercel.json','requirements-environment.txt'}
for name in sorted(set(names)):
    if not name or name.startswith(('data/raw/','docs/evidence/live-manila/')): continue
    path=(root/name).resolve()
    if not path.is_file() or root not in path.parents: continue
    dest=None
    if name.startswith(('src/','scripts/','.github/','ml/')) or name in roots: dest='source/'+name
    elif name.startswith('tests/') and not name.startswith('tests/visual/baselines/'): dest='source/'+name
    elif name.startswith('supabase/migrations/'): dest='sql/'+path.name
    elif name.startswith('docs/') and path.suffix.lower() in {'.md','.json','.png','.txt','.html'}: dest=name
    elif name.startswith(('public/ml/','data/processed/ml/','data/live-manila/','public/live-manila/')): dest=name
    elif name=='data/processed/manila_live_weekly.json': dest=name
    elif name.startswith('public/api/v2/') and path.suffix=='.json': dest=name
    elif name in {'public/live-manila-append-template.csv','public/geo/ncr-cities.geojson','public/geo/philippines.geojson','public/SECURITY.md','public/THIRD_PARTY_LICENSES.md','public/hero-preload.js','public/icon.svg','public/manifest.webmanifest'}: dest=name
    elif name.startswith('public/img/') and '/source/' not in name and path.suffix in {'.avif','.webp','.svg'}: dest=name
    if not dest: continue
    data=path.read_bytes(); original=sha(data)
    if name.startswith('docs/') and path.suffix in {'.md','.json','.txt','.html'}: data=sanitize(data.decode('utf8-sig')).encode('utf8')
    entries[dest]=data;integrity.append({'source':name,'copy':dest,'source_sha256':original,'copy_sha256':sha(data),'sanitized':original!=sha(data)})
for row in manifest['results']:
    if row.get('log') and (root/row['log']).is_file():
        text=(root/row['log']).read_text(encoding='utf8-sig',errors='replace')
        entries['logs/'+Path(row['log']).name]=sanitize(text).encode('utf8')
manifest_copy=json.loads(sanitize(json.dumps(manifest,indent=2)))
entries['COMMAND_MANIFEST.json']=(json.dumps(manifest_copy,indent=2)+'\n').encode()
entries['COPY_INTEGRITY.json']=(json.dumps(integrity,indent=2)+'\n').encode()
baselines=[{'path':p.relative_to(root).as_posix(),'sha256':sha(p.read_bytes()),'bytes':p.stat().st_size} for p in sorted((root/'tests/visual/baselines').glob('*.png'))]
assert len(baselines)==80
entries['VISUAL_BASELINES.json']=(json.dumps(baselines,indent=2)+'\n').encode()
source_commit=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
entries['BUNDLE_SOURCE.json']=(json.dumps({'source_commit':source_commit,'branch':'feat/live-manila','prerequisite_commit':'11daef80725e0d024daf48b18d519ca1dc0b0995','protected_artifacts_unchanged':len(protected),'secrets':audit,'scope':'Source and local review evidence; not a complete runnable clone or hosted certification. No raw data, owner source screenshots, credentials, node_modules or large basemap tiles. The 2026 aggregates are unverified.','not_pushed':True},indent=2)+'\n').encode()
entries['00_INDEX.md']=b'# Live Manila review\n\nStart with docs/LIVE_MANILA.md and docs/evidence/live-manila-checks.md. Public UI captures are under docs/evidence/live-manila-ui/. COMMAND_MANIFEST.json contains actual commands and exit codes; earlier failed/superseded attempts remain identified. Baseline hashes are in VISUAL_BASELINES.json; actual baseline images remain in Git.\n\nThe new schema is locally tested only. Source post verification, republication permission, adviser/Filipino review and historical credential rotation remain owner actions. Community reporting remains closed. Nothing was pushed or deployed.\n'
for name in entries:
    assert not name.startswith('/') and '..' not in Path(name).parts
    assert not any(part in {'.git','.env','node_modules','certs'} for part in Path(name).parts)
    assert not name.startswith(('data/raw/','docs/evidence/live-manila/'))
archive=root/'review_bundle.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as bundle:
    for name,data in sorted(entries.items()): bundle.writestr(name,data)
with zipfile.ZipFile(archive) as bundle: assert bundle.testzip() is None
digest=sha(archive.read_bytes());(root/'review_bundle.zip.sha256').write_text(digest+'  review_bundle.zip\n',encoding='utf8')
print(json.dumps({'files':len(entries),'bytes':archive.stat().st_size,'sha256':digest,'source_commit':source_commit,'protected_artifacts_unchanged':len(protected),'archive_integrity':True}))
