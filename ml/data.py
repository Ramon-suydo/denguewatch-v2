"""Past-only NCR labels/features. Raw input is never written."""
import csv,datetime as dt,hashlib,json,math
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'data/raw/doh-epi-dengue-data-2016-2021.csv'
FEATURES=['cases_t','cases_t_minus_1','cases_t_minus_2','cases_t_minus_3','mean_4','mean_8','growth_ratio','threshold_ratio','week_of_year','rest_ncr_cases','rest_ncr_mean_4']

def load():
    records=[]
    for r in csv.DictReader(SOURCE.read_text(encoding='utf-8-sig').splitlines()):
        if r['Region']!='NATIONAL CAPITAL REGION':continue
        day=dt.datetime.strptime(r['date'],'%m/%d/%Y').date()
        if day>dt.date(2020,12,27):continue
        if day.weekday()!=6:raise ValueError('Expected Sunday weekly labels')
        if r['cases']=='':raise ValueError('Missing cases: no zero fill permitted')
        value=int(r['cases'])
        if value<0:raise ValueError('Negative count')
        records.append((day.isoformat(),r['loc'],value))
    cities=sorted({r[1] for r in records});weeks=sorted({r[0] for r in records})
    assert len(cities)==17 and weeks[0]=='2016-01-10' and weeks[-1]=='2020-12-27'
    assert len(records)==len(weeks)*17 and len({r[:2] for r in records})==len(records)
    first=dt.date.fromisoformat(weeks[0]);last=dt.date.fromisoformat(weeks[-1]);weeks=[(first+dt.timedelta(days=7*i)).isoformat() for i in range((last-first).days//7+1)]
    lookup={(d,c):v for d,c,v in records};values=np.array([[lookup.get((d,c),np.nan) for c in cities] for d in weeks],dtype=float)
    return cities,weeks,values

def at(values,weeks,i,c,sd=1.,minimum=10):
    """Only values[:i+1] may influence features, threshold, or current outbreak."""
    past=values[:i+1];own=past[:,c];mean4=float(own[-4:].mean());threshold=max(float(np.nanmean(own)+sd*np.nanstd(own,ddof=1)),minimum)
    rest=past.sum(axis=1)-own
    x=[*own[-4:][::-1],mean4,float(own[-8:].mean()),float(own[-1])/max(mean4,1.),float(own[-1])/threshold,dt.date.fromisoformat(weeks[i]).isocalendar().week,float(rest[-1]),float(rest[-4:].mean()),*[float(c==j) for j in range(values.shape[1])]]
    # Prior-year seasonal mean around the target ISO week; no future labels or counts.
    target=dt.date.fromisoformat(weeks[i])+dt.timedelta(days=7);tw=target.isocalendar().week
    seasonal=[own[j] for j,d in enumerate(weeks[:i+1]) if np.isfinite(own[j]) and dt.date.fromisoformat(d).year<target.year and min(abs(dt.date.fromisoformat(d).isocalendar().week-tw),53-abs(dt.date.fromisoformat(d).isocalendar().week-tw))<=2]
    expected=float(np.mean(seasonal)) if len(seasonal)>=5 else float(np.nanmean(own))
    return np.array(x,dtype=float),threshold,float(expected/(expected+threshold))

def dataset(sd=1.,minimum=10):
    cities,weeks,values=load();rows=[];features=[]
    for i in range(26,len(weeks)-1):
        if not np.isfinite(values[i-7:i+2]).all():continue
        for c,city in enumerate(cities):
            x,threshold,seasonal=at(values,weeks,i,c,sd,minimum)
            rows.append({'city':city,'city_id':c,'origin':weeks[i],'target':weeks[i+1],'cases':int(values[i,c]),'actual_cases':int(values[i+1,c]),'threshold':threshold,'currently_above':bool(values[i,c]>threshold),'label':int(values[i+1,c]>threshold),'seasonal_raw':seasonal,'persistence_raw':float(x[7]/(1+x[7])),'history':values[max(0,i-7):i+1,c].astype(int).tolist()})
            features.append(x)
    return rows,np.array(features),np.array([r['label'] for r in rows]),{'cities':cities,'source_sha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'source_weeks':len(weeks),'source_start':weeks[0],'source_end':weeks[-1],'excluded_after':'2020-12-27','raw_final_date':'2021-01-10','features':FEATURES+['city_'+c for c in cities],'burn_in_weeks':26,'sd_ddof':1,'missing_calendar_weeks':[weeks[i] for i in range(len(weeks)) if not np.isfinite(values[i]).all()],'gap_policy':'No imputation. Exclude samples whose 8-week calendar feature window or next-week target crosses a missing week; expanding threshold uses observed past weeks only.'}
