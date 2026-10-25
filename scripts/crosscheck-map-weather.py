"""A disclosed geographic sample cross-check; not national weather certification."""
import pathlib,json,urllib.parse,subprocess,datetime,hashlib,collections
import numpy as np
root=pathlib.Path.cwd();cache=root/'data/external/map-weather';entries=json.loads((root/'data/geo/national-crosswalk.json').read_text())['rows'];wanted=['MANILA CITY','ALBAY','CEBU','DAVAO DEL SUR'];results=[]
for name in wanted:
 point=next(r for r in entries if r['case_name']==name);path=cache/('nasa-'+name.lower().replace(' ','-')+'.json');params={'parameters':'T2M,PRECTOTCORR','community':'AG','longitude':str(point['longitude']),'latitude':str(point['latitude']),'start':'20180101','end':'20201231','format':'JSON','time-standard':'UTC'};url='https://power.larc.nasa.gov/api/temporal/daily/point?'+urllib.parse.urlencode(params)
 try:
  if not path.exists():
   raw=subprocess.check_output(['node','scripts/lib/fetch-public.mjs',url],stderr=subprocess.PIPE);json.loads(raw);path.write_bytes(raw);path.with_suffix('.receipt.json').write_text(json.dumps({'url':url,'retrieved_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'sha256':hashlib.sha256(raw).hexdigest(),'case_unit':name,'point_method':'geometric polygon centroid','source':'NASA POWER; NASA Langley Research Center ASDC; NASA Earth Science Applied Sciences','weather_role':'Cross-check only, not an outlook input'},indent=2)+'\n')
  nasa=json.loads(path.read_text())['properties']['parameter'];era=None
  for receipt in cache.glob('history-*.provenance.json'):
   meta=json.loads(receipt.read_text())
   if name in meta['case_units']:era=json.loads(receipt.with_suffix('').with_suffix('.json').read_text())[meta['case_units'].index(name)]['daily'];break
  if era is None:raise ValueError('No matching ERA5 cache')
  monthly=collections.defaultdict(lambda:{'era_temp':[],'era_rain':[],'nasa_temp':[],'nasa_rain':[]})
  for date,temp,rain in zip(era['time'],era['temperature_2m_mean'],era['precipitation_sum']):
   key=date.replace('-','');nt=nasa['T2M'].get(key);nr=nasa['PRECTOTCORR'].get(key)
   if not date.startswith(('2018','2019','2020')) or any(v is None or v<=-990 for v in [temp,rain,nt,nr]):continue
   m=monthly[date[:7]]
   for field,value in [('era_temp',temp),('era_rain',rain),('nasa_temp',nt),('nasa_rain',nr)]:m[field].append(value)
  rows=[{'month':date,'n':len(m['era_temp']),'temperature_bias_c':float(np.mean(m['era_temp'])-np.mean(m['nasa_temp'])),'precipitation_total_difference_mm':float(sum(m['era_rain'])-sum(m['nasa_rain']))} for date,m in sorted(monthly.items())];results.append({'unit':name,'status':'cross-checked','months':rows});print(json.dumps({'unit':name,'months':len(rows),'status':'cross-checked'}),flush=True)
 except Exception as error:results.append({'unit':name,'status':'unavailable','error_kind':type(error).__name__});print(json.dumps(results[-1]),flush=True)
(root/'data/processed/map_weather_crosscheck.json').write_text(json.dumps({'scope':'Four named centroid sample, not all provinces. Monthly aggregation reduces but does not eliminate UTC versus Asia/Manila daily-boundary mismatch. Products/grid cells differ; disagreement is retained, not corrected into source cases.','resolution':'ERA5 about 28 km; POWER meteorology roughly 0.5 x 0.625 degrees (about 55-70 km). No household exposure estimate.','results':results},indent=2)+'\n',encoding='utf-8')
