"""Inventory the installed dependency closure of the declared evaluation/build environment."""
import importlib.metadata as metadata,json,re,sys
from pathlib import Path
from packaging.requirements import Requirement
from packaging.utils import canonicalize_name
roots=[Requirement(line) for line in Path(sys.argv[1] if len(sys.argv)>1 else 'requirements-environment.txt').read_text().splitlines() if line and not line.startswith('#')]
root_names={canonicalize_name(r.name) for r in roots};queue=list(roots);seen={};edges={}
while queue:
 requirement=queue.pop(0);name=canonicalize_name(requirement.name)
 if name in seen:continue
 dist=metadata.distribution(requirement.name);assert not requirement.specifier or requirement.specifier.contains(dist.version,prereleases=True),(name,dist.version)
 deps=[Requirement(value) for value in dist.requires or []];deps=[value for value in deps if value.marker is None or value.marker.evaluate({'extra':''})]
 notices=[]
 for file in dist.files or []:
  if re.match(r'^(licen[cs]e(?:[._-].*)?|copying(?:[._-].*)?|notice(?:[._-].*)?)$',Path(str(file)).name,re.I) and Path(str(file)).suffix.lower() not in ['.py','.pyc','.dll','.pyd','.so']:
   candidate=dist.locate_file(file)
   if candidate.is_file():notices.append(str(file)+'\n'+candidate.read_text(encoding='utf-8',errors='replace'))
 seen[name]={'name':dist.metadata['Name'],'canonical_name':name,'version':dist.version,'expression':dist.metadata.get('License-Expression'),'notice':'\n\n'.join(dict.fromkeys(notices)) or dist.metadata.get('License') or '', 'source_url':dist.metadata.get('Home-page') or '', 'direct_requirement':name in root_names,'dependencies':sorted({canonicalize_name(value.name) for value in deps})};queue.extend(deps)
print(json.dumps([seen[name] for name in sorted(seen)]))
