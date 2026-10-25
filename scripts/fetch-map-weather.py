"""Server-side public weather cache; never included in browser requests."""
import urllib.request,urllib.parse,json,pathlib,datetime,time,hashlib,concurrent.futures,subprocess,re,sys
root=pathlib.Path.cwd();cache=root/'data/external/map-weather';cache.mkdir(parents=True,exist_ok=True);rows=[r for r in json.loads((root/'data/geo/national-crosswalk.json').read_text())['rows'] if r['case_name']];now=datetime.datetime.now(datetime.timezone.utc);receipts=[]
def request(kind,batch,index):
 path=cache/(kind+'-'+str(index).zfill(2)+'.json');manifest=path.with_suffix('.provenance.json')
 if path.exists() and manifest.exists() and (kind=='history' or json.loads(manifest.read_text())['retrieved_utc'][:10]==now.date().isoformat()):return {'kind':kind,'file':str(path.relative_to(root)).replace('\\','/'),'cached':True}
 common={'latitude':','.join(str(r['latitude']) for r in batch),'longitude':','.join(str(r['longitude']) for r in batch),'daily':'temperature_2m_mean,precipitation_sum','timezone':'Asia/Manila'}
 if kind=='history':common.update({'start_date':'2016-01-01','end_date':'2020-12-31','models':'era5'});base='https://archive-api.open-meteo.com/v1/archive'
 else:common.update({'forecast_days':'8'});base='https://api.open-meteo.com/v1/forecast'
 url=base+'?'+urllib.parse.urlencode(common)
 for attempt in range(3):
  try:
   raw=subprocess.check_output(['node','scripts/lib/fetch-public.mjs',url],stderr=subprocess.PIPE);obj=json.loads(raw);obj=obj if isinstance(obj,list) else [obj];assert len(obj)==len(batch)
   for item in obj:
    daily=item['daily'];assert len(daily['time'])==len(daily['temperature_2m_mean'])==len(daily['precipitation_sum']);assert all(x is None or isinstance(x,(int,float)) for k,v in daily.items() if k!='time' for x in v)
   path.write_bytes(raw);record={'url':url,'retrieved_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'sha256':hashlib.sha256(raw).hexdigest(),'license':'CC BY 4.0; free hosted API restricted to non-commercial fair use','attribution':'Weather data by Open-Meteo; historical reanalysis by Copernicus C3S / ECMWF ERA5','case_units':[r['case_name'] for r in batch],'kind':kind,'transport':'Node standard TLS validation; no bypass','units':obj[0].get('daily_units')};manifest.write_text(json.dumps(record,indent=2)+'\n');return {'kind':kind,'file':str(path.relative_to(root)).replace('\\','/'),'cached':False,'units':len(batch)}
  except Exception as error:
   code=getattr(error,'code',type(error).__name__);status=re.search(r'Provider HTTP (\d+)',getattr(error,'stderr',b'').decode(errors='replace'));code='HTTP '+status[1] if status else code
   if attempt<2:time.sleep((15 if str(code)=='HTTP 429' else 3)*(attempt+1))
 return {'kind':kind,'status':'unavailable','error_kind':str(code),'units':len(batch)}
jobs=[(kind,rows[i:i+8],i//8) for kind in (['forecast'] if '--forecast-only' in sys.argv else ['history','forecast']) for i in range(0,len(rows),8)]
# Low concurrency and bounded retry; public calls contain centroid coordinates only.
with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
 for record in pool.map(lambda args:request(*args),jobs):receipts.append(record);print(json.dumps(record),flush=True)
(root/'data/external/map-weather-fetch.json').write_text(json.dumps({'utc':now.isoformat(),'requests':receipts,'resolution_limit':'About 11-50 km grid cells; centroids are coarse area proxies, not household conditions.','browser_calls':False},indent=2)+'\n')

context={};used=[]
for receipt in cache.glob('forecast-*.provenance.json'):
 meta=json.loads(receipt.read_text());age=now-datetime.datetime.fromisoformat(meta['retrieved_utc'])
 if age.total_seconds()>36*3600:continue
 data=json.loads(receipt.with_suffix('').with_suffix('.json').read_text());data=data if isinstance(data,list) else [data]
 for name,item in zip(meta['case_units'],data):context[name]={date:(temp,rain) for date,temp,rain in zip(item['daily']['time'],item['daily']['temperature_2m_mean'],item['daily']['precipitation_sum'])}
 used.append({'sha256':meta['sha256'],'retrieved_utc':meta['retrieved_utc']})
(root/'public/api/v2/outlook-weather.json').write_text(json.dumps({'status':'available-context-only' if context else 'unavailable','issued_at':max((r['retrieved_utc'] for r in used),default=now.isoformat()),'units':context,'receipts':used,'weather_used_in_index':False,'source':'Weather data by Open-Meteo; forecast context only, not a dengue input'},separators=(',',':'))+'\n',encoding='utf-8')
