"""Strict earlier-year rolling-origin national ranking benchmark; no live case forecast."""
import csv,json,pathlib,datetime,hashlib,collections,warnings
import numpy as np
from scipy.stats import rankdata,spearmanr
root=pathlib.Path.cwd();raw=(root/'data/raw/doh-epi-dengue-data-2016-2021.csv').read_bytes();source=list(csv.DictReader(raw.decode('utf-8-sig').splitlines()));cw=json.loads((root/'data/geo/national-crosswalk.json').read_text());units=cw['case_units'];observations={}
for r in source:
 if r['loc'].startswith('#'):continue
 name=r['loc'].strip().upper();day=datetime.datetime.strptime(r['date'],'%m/%d/%Y').date();value=int(r['cases']);assert value>=0
 key=(name,day);assert key not in observations,key;observations[key]=value
by_unit={n:[(d,v) for (u,d),v in observations.items() if u==n] for n in units}
weeks=sorted({d for n,d in observations if d.year<=2020});weather={};forecast={};receipts=[]
for p in sorted((root/'data/external/map-weather').glob('*.provenance.json')):
 receipt=json.loads(p.read_text());data=json.loads(p.with_suffix('').with_suffix('.json').read_text());data=data if isinstance(data,list) else [data];assert receipt['sha256']==hashlib.sha256(p.with_suffix('').with_suffix('.json').read_bytes()).hexdigest();receipts.append({'file':str(p.relative_to(root)).replace('\\','/'),'sha256':receipt['sha256'],'retrieved_utc':receipt['retrieved_utc']})
 for unit,item in zip(receipt['case_units'],data):
  target=weather if receipt['kind']=='history' else forecast;target[unit]={date:(temp,rain) for date,temp,rain in zip(item['daily']['time'],item['daily']['temperature_2m_mean'],item['daily']['precipitation_sum'])}
def seasonal(unit,year,woy):
 values=[v for d,v in by_unit[unit] if d.year<year and d.year>=2016];mean=float(np.mean(values)) if values else None
 neighbors=[v for d,v in by_unit[unit] if 2016<=d.year<year and min(abs(d.isocalendar().week-woy),53-abs(d.isocalendar().week-woy))<=2];return mean,float(np.mean(neighbors)) if neighbors else None
# Cache earlier-year features, including for inner training years. No held-out targets enter the fit.
profiles={(unit,year,w):(seasonal(unit,year,w)) for year in range(2017,2022) for unit in units for w in range(1,54)}
def weather_features(unit,date):
 values=[weather.get(unit,{}).get((date-datetime.timedelta(days=lag)).isoformat()) for lag in range(14,28)]
 if any(v is None or any(x is None for x in v) for v in values):return None
 return [float(np.mean([x[0] for x in values])),float(np.log1p(sum(x[1] for x in values)))]
def features(unit,date,with_weather):
 burden,season=profiles[(unit,date.year,date.isocalendar().week)]
 if burden is None or season is None:return None
 base=[np.log1p(burden),np.log1p(season)]
 if with_weather:
  extra=weather_features(unit,date)
  if extra is None:return None
  base+=extra
 return base
def fit(train,targets):
 X=np.array(train);y=np.log1p(targets);mu=X.mean(axis=0);sd=X.std(axis=0);sd[sd==0]=1;Z=np.column_stack([np.ones(len(X)),(X-mu)/sd]);penalty=np.eye(Z.shape[1])*10;penalty[0,0]=0;beta=np.linalg.solve(Z.T@Z+penalty,Z.T@y)
 return lambda x:float(max(0,np.expm1(np.clip(np.r_[1,(np.array(x)-mu)/sd]@beta,-10,15))))
def metrics(actual,pred):
 if len(actual)<10:return None
 a=rankdata(actual);b=rankdata(pred);correlation=float(spearmanr(a,b).statistic) if np.std(a)>0 and np.std(b)>0 else None
 # Average ranks handle ties; deterministic unit order breaks top-ten boundary ties explicitly.
 topa=set(sorted(range(len(actual)),key=lambda i:(-actual[i],i))[:10]);topb=set(sorted(range(len(pred)),key=lambda i:(-pred[i],i))[:10]);return {'spearman':correlation,'top10_hit_rate':len(topa&topb)/10,'normalized_rank_error':float(np.mean(np.abs(a-b))/(len(a)-1)),'units':len(a)}
rows=[];details=[]
for year in [2018,2019,2020]:
 training=[(n,d,v) for (n,d),v in observations.items() if 2017<=d.year<year];fits={}
 for label,with_weather in [('season-ridge',False),('lagged-weather',True)]:
  examples=[(features(n,d,with_weather),v) for n,d,v in training];examples=[(x,y) for x,y in examples if x is not None]
  if len(examples)>=100:fits[label]=fit([x for x,y in examples],[y for x,y in examples])
 for day in [d for d in weeks if d.year==year]:
  common=[n for n in units if (n,day) in observations and all(x is not None for x in profiles[(n,year,day.isocalendar().week)])];actual=[observations[(n,day)] for n in common]
  for model,index in [('burden-only',0),('season-burden',1)]:
   m=metrics(actual,[profiles[(n,year,day.isocalendar().week)][index] for n in common]);details.append({'year':year,'week':day.isoformat(),'model':model,**m})
  matched=[n for n in common if features(n,day,True) is not None]
  if len(matched)>=10 and 'lagged-weather' in fits:
   for model in ['season-burden','season-ridge','lagged-weather']:
    pred=[profiles[(n,year,day.isocalendar().week)][1] if model=='season-burden' else fits[model](features(n,day,model=='lagged-weather')) for n in matched];m=metrics([observations[(n,day)] for n in matched],pred);details.append({'year':year,'week':day.isoformat(),'model':model+'-weather-cohort',**m})
 for model in sorted({r['model'] for r in details if r['year']==year}):
  selected=[r for r in details if r['year']==year and r['model']==model];rows.append({'test_year':year,'train_years':list(range(2016,year)),'model':model,'weeks':len(selected),'min_units':min(r['units'] for r in selected),**{k:float(np.mean([r[k] for r in selected if r[k] is not None])) if any(r[k] is not None for r in selected) else None for k in ['spearman','top10_hit_rate','normalized_rank_error']}})
weather_evaluated=all(any(r['test_year']==year and r['model']=='lagged-weather-weather-cohort' for r in rows) for year in [2018,2019,2020]);weather_improved=False
if weather_evaluated:
 weather_improved=all(all((lambda w,b:w['spearman']>b['spearman'] and w['top10_hit_rate']>b['top10_hit_rate'] and w['normalized_rank_error']<b['normalized_rank_error'])(next(r for r in rows if r['test_year']==year and r['model']=='lagged-weather-weather-cohort'),next(r for r in rows if r['test_year']==year and r['model']==baseline+'-weather-cohort')) for baseline in ['season-burden','season-ridge']) for year in [2018,2019,2020])
# This is a seasonal outlook, never a current epidemic-risk probability. Forecast-weather transfer is a separate gate.
profile={n:{str(w):{'burden':profiles[(n,2021,w)][0],'seasonal':profiles[(n,2021,w)][1],'seasonal_ratio':profiles[(n,2021,w)][1]/profiles[(n,2021,w)][0] if profiles[(n,2021,w)][0] else None} for w in range(1,54)} for n in units}
summary={'version':1,'evaluation_date':datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=8))).date().isoformat(),'case_data_as_of':'2021-01-10','train_end':'2020-12-31','source_sha256':hashlib.sha256(raw).hexdigest(),'evaluation_scope':'Retrospective count-based province/city ranking, not population risk, not a next-week case forecast. Held-out years train on strictly earlier years; missing units are excluded, never zero-filled.','population_status':'Unit-aligned PSA denominators unverified. Count rankings are confounded by population size; no per-100,000 or individual-risk claim.','boundary_scope':'Exact crosswalk name matches do not establish administrative/reporting catchment equivalence. Independently reported cities may have unmatched polygons.','models':rows,'weather_evaluated':weather_evaluated,'lagged_weather_improved_all_folds_and_metrics':weather_improved,'weather_used_in_index':False,'weather_reason':('Lagged weather did not consistently beat both seasonal-only baselines across held-out years and all three metrics.' if weather_evaluated and not weather_improved else 'Lagged-weather validation unavailable; no weather contribution.' if not weather_evaluated else 'Retrospective lagged-weather gain found, but transfer to forecast-weather features is unverified; weather excluded.'),'weather_receipts':receipts,'metric_definitions':{'spearman':'Mean per-week Spearman correlation; tied average ranks.','top10_hit_rate':'Intersection of actual/predicted top ten divided by ten; alphabetical unit order resolves boundary ties.','normalized_rank_error':'Mean absolute rank difference divided by number of units minus one; lower is better.'},'hyperparameters':'Fixed ridge penalty 10; log1p counts/features; training-only standardization. Seasonal mean uses circular 53-slot ISO week-of-year +/-2, training years only. Weather is observed ERA5 mean temperature and total precipitation at source polygon geometric centroid, lagged 14-27 days before target source-date label (availability buffer). No future weather or case target enters features.','profiles':profile,'unmatched_case_units':cw['unmatched_case_units'],'community_included':False,'last_case_date':{n:max(d for u,d in observations if u==n).isoformat() for n in units},'history':{n:[{'date':d.isoformat(),'cases':v} for (u,d),v in observations.items() if u==n and d.year<=2020] for n in units}}
(root/'data/processed/map_evaluation.json').write_text(json.dumps({k:v for k,v in summary.items() if k not in ['profiles','history','daily_forecast_context']},indent=2)+'\n',encoding='utf-8');(root/'data/processed/map_validation_weeks.json').write_text(json.dumps(details,indent=2)+'\n',encoding='utf-8');(root/'public/api/v2/outlook.json').write_text(json.dumps(summary,separators=(',',':'))+'\n',encoding='utf-8');print(json.dumps({k:v for k,v in summary.items() if k in ['models','weather_evaluated','weather_used_in_index','weather_reason','population_status']},indent=2))
