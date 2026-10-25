"""Reproducible, time-ordered 17-city outbreak classification. No hosted writes."""
import os
for key in ['OMP_NUM_THREADS','OPENBLAS_NUM_THREADS','MKL_NUM_THREADS']:os.environ[key]='1'
import sys,json,math,hashlib,itertools,datetime,unittest
from pathlib import Path
import numpy as np
import sklearn,joblib
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import TimeSeriesSplit,train_test_split
from sklearn.metrics import accuracy_score,balanced_accuracy_score,precision_score,recall_score,f1_score,roc_auc_score,average_precision_score,brier_score_loss,confusion_matrix
from sklearn.calibration import calibration_curve
from data import dataset,load,at,ROOT
SEED=20261026;WORK=ROOT/'.artifacts/ml';OUT=ROOT/'data/processed/ml';PUBLIC=ROOT/'public/ml';DOCS=ROOT/'docs'
for p in [WORK,OUT,PUBLIC,DOCS/'evidence/ml']:p.mkdir(parents=True,exist_ok=True)
NAMES=['majority','persistence','seasonal','DT','RF']

def dump(path,obj):path.write_text(json.dumps(obj,separators=(',',':'),allow_nan=False)+'\n',encoding='utf-8')
def fitmodel(name,params):
    cls=DecisionTreeClassifier if name=='DT' else RandomForestClassifier
    return cls(random_state=SEED,**params)
def grid(name):
    if name=='DT':return [dict(max_depth=d,min_samples_leaf=l,class_weight='balanced') for d,l in itertools.product(range(3,9),[5,15])]
    return [dict(n_estimators=n,max_depth=d,min_samples_leaf=l,class_weight='balanced_subsample',n_jobs=2) for n,d,l in itertools.product([100,200,300],[4,8],[5,15])]
def raw(name,model,X,rows,prior):
    if name in ['DT','RF']:return model.predict_proba(X)[:,list(model.classes_).index(1)]
    if name=='majority':return np.full(len(rows),prior)
    return np.array([r[name+'_raw'] for r in rows])
def calfit(p,y):
    if len(np.unique(y))<2:return [0.,float(np.log((sum(y)+1)/(len(y)-sum(y)+1)))]
    m=LogisticRegression(C=1000,random_state=SEED,max_iter=2000).fit(np.asarray(p).reshape(-1,1),y)
    return [float(m.coef_[0,0]),float(m.intercept_[0])]
def calibrate(p,ab):return 1/(1+np.exp(-np.clip(ab[0]*np.asarray(p)+ab[1],-700,700)))
def classes(name,p,threshold,raw_values=None):
    if name=='majority':return (np.asarray(raw_values)>=.5).astype(int)
    if name in ['persistence','seasonal']:return (np.asarray(raw_values)>.5).astype(int)
    return (p>=threshold).astype(int)
def folds(rows):
    weeks=sorted({r['target'] for r in rows})
    for tr,va in TimeSeriesSplit(n_splits=3).split(weeks):
        train={weeks[i] for i in tr};valid={weeks[i] for i in va}
        a=np.array([i for i,r in enumerate(rows) if r['target'] in train]);b=np.array([i for i,r in enumerate(rows) if r['target'] in valid])
        assert max(rows[i]['target'] for i in a)<=min(rows[i]['origin'] for i in b)
        yield a,b

def train_protocol(rows,X,y,params_fixed=None):
    cv=list(folds(rows));packages={};tuning=[]
    for name in NAMES:
        options=([params_fixed[name]] if params_fixed else grid(name)) if name in ['DT','RF'] else [None]
        candidates=[]
        for params in options:
            ps=[];ys=[];ids=[];scores=[]
            for a,b in cv:
                m=fitmodel(name,params).fit(X[a],y[a]) if params else None
                p=raw(name,m,X[b],[rows[i] for i in b],float(y[a].mean()))
                pred=(p>.5).astype(int) if name in ['persistence','seasonal'] else (p>=.5).astype(int)
                scores.append(float(balanced_accuracy_score(y[b],pred)));ps.extend(p.tolist());ys.extend(y[b].tolist());ids.extend(b.tolist())
            candidates.append((float(np.mean(scores)),params,np.array(ps),np.array(ys),ids))
            tuning.append({'model':name,'params':params,'mean_validation_balanced_accuracy':float(np.mean(scores))})
        score,params,p,v,ids=max(candidates,key=lambda x:x[0]);prior=float(y.mean());ab=[0.,float(np.log(prior/(1-prior)))] if name=='majority' else calfit(p,v);cp=p if name=='majority' else calibrate(p,ab)
        if name in ['persistence','seasonal']:threshold=float(calibrate([.5],ab)[0])
        elif name=='majority':threshold=.5
        else:threshold=max(np.linspace(.05,.95,91),key=lambda t:(balanced_accuracy_score(v,cp>=t),-abs(t-.5)))
        m=fitmodel(name,params).fit(X,y) if params else None
        validation=metrics(v,cp,classes(name,cp,threshold,p))
        packages[name]={'model':m,'params':params,'calibration':ab,'operating_point':float(threshold),'prior':float(y.mean()),'validation':validation,'validation_probabilities':cp.tolist(),'validation_labels':v.tolist(),'validation_indices':ids}
        print(json.dumps({'trained':name,'validation_balanced_accuracy':validation['balanced_accuracy'],'params':params}),flush=True)
    chosen=max(NAMES,key=lambda n:(packages[n]['validation']['balanced_accuracy'],-NAMES.index(n)))
    # Empirical validation quantiles choose bands before any held-out outcomes are read.
    edges=np.quantile(packages[chosen]['validation_probabilities'],[.5,.75,.9]).tolist()
    return {'packages':packages,'chosen':chosen,'bands':edges,'tuning':tuning,'cv':[{'train_end':rows[a[-1]]['target'],'validation_start':rows[b[0]]['target'],'validation_end':rows[b[-1]]['target']} for a,b in cv]}

def metrics(y,p,pred):
    y=np.asarray(y);p=np.asarray(p);pred=np.asarray(pred);both=len(np.unique(y))==2
    return {'n':len(y),'positives':int(y.sum()),'accuracy':float(accuracy_score(y,pred)),'balanced_accuracy':float(balanced_accuracy_score(y,pred)) if both else None,'precision':float(precision_score(y,pred,zero_division=0)),'recall':float(recall_score(y,pred,zero_division=0)),'f1':float(f1_score(y,pred,zero_division=0)),'roc_auc':float(roc_auc_score(y,p)) if both else None,'pr_auc':float(average_precision_score(y,p)) if both else None,'brier':float(brier_score_loss(y,p)),'confusion_matrix':confusion_matrix(y,pred,labels=[0,1]).tolist()}
def predictions(protocol,rows,X,y):
    out={}
    for name,pkg in protocol['packages'].items():
        rp=raw(name,pkg['model'],X,rows,pkg['prior']);p=calibrate(rp,pkg['calibration']);pred=classes(name,p,pkg['operating_point'],rp)
        out[name]={'probabilities':p,'classes':pred,'metrics':metrics(y,p,pred)}
    return out

def bootstrap(rows,y,p,pred,reps=400):
    weeks=sorted({r['target'] for r in rows});groups=[np.array([i for i,r in enumerate(rows) if r['target']==w]) for w in weeks];rng=np.random.default_rng(SEED);samples={k:[] for k in ['accuracy','balanced_accuracy','precision','recall','f1','roc_auc','pr_auc','brier']}
    for _ in range(reps):
        starts=rng.integers(0,len(weeks),size=math.ceil(len(weeks)/4));order=[(int(s)+j)%len(weeks) for s in starts for j in range(4)][:len(weeks)];idx=np.concatenate([groups[j] for j in order]);m=metrics(y[idx],p[idx],pred[idx])
        for k in samples:
            if m[k] is not None:samples[k].append(m[k])
    return {k:np.quantile(v,[.025,.975]).tolist() if v else [None,None] for k,v in samples.items()}
def report(protocol,rows,X,y,reps=400,per_city=True):
    result=predictions(protocol,rows,X,y);summary={}
    mask=np.array([not r['currently_above'] for r in rows])
    for name,item in result.items():
        p=item['probabilities'];pred=item['classes'];summary[name]={'main':item['metrics'],'ci95':bootstrap(rows,y,p,pred,reps),'operating_point':protocol['packages'][name]['operating_point']}
        if mask.any():summary[name]['onset']={**metrics(y[mask],p[mask],pred[mask]),'ci95':bootstrap([r for i,r in enumerate(rows) if mask[i]],y[mask],p[mask],pred[mask],reps)}
        true,prob=calibration_curve(y,p,n_bins=10,strategy='uniform');summary[name]['calibration_curve']={'predicted_mean':prob.tolist(),'observed_fraction':true.tolist()}
        if per_city:
            summary[name]['per_city']={}
            for city in sorted({r['city'] for r in rows}):
                ix=np.array([i for i,r in enumerate(rows) if r['city']==city]);summary[name]['per_city'][city]={**metrics(y[ix],p[ix],pred[ix]),'ci95':bootstrap([rows[i] for i in ix],y[ix],p[ix],pred[ix],200)}
    return summary,result

def split(rows):
    weeks=sorted({r['target'] for r in rows});cut=int(len(weeks)*.7);first=weeks[cut]
    a=np.array([i for i,r in enumerate(rows) if r['target']<first]);b=np.array([i for i,r in enumerate(rows) if r['target']>=first]);assert max(rows[i]['target'] for i in a)<=min(rows[i]['origin'] for i in b)
    return a,b,{'train_weeks':cut,'test_weeks':len(weeks)-cut,'train_start':weeks[0],'train_end':weeks[cut-1],'test_start':first,'test_end':weeks[-1],'train_rows':len(a),'test_rows':len(b),'split_axis':'distinct target weeks; all 17 cities share the same boundary'}
def train():
    rows,X,y,meta=dataset();a,b,boundary=split(rows);protocol=train_protocol([rows[i] for i in a],X[a],y[a]);bundle={'protocol':protocol,'meta':meta,'split':boundary,'sklearn_version':sklearn.__version__,'seed':SEED}
    joblib.dump(bundle,WORK/'trained.joblib');dump(OUT/'training.json',{k:v for k,v in bundle.items() if k!='protocol'}|{'chosen_by_validation':protocol['chosen'],'bands':protocol['bands'],'tuning':protocol['tuning'],'cv':protocol['cv']});print(json.dumps({'split':boundary,'chosen':protocol['chosen'],'source_sha256':meta['source_sha256']}))
def evaluate():
    bundle=joblib.load(WORK/'trained.joblib');rows,X,y,meta=dataset();assert bundle['meta']==meta and bundle['sklearn_version']==sklearn.__version__;a,b,boundary=split(rows);protocol=bundle['protocol'];test=[rows[i] for i in b]
    headline,pred=report(protocol,test,X[b],y[b]);fixed={n:protocol['packages'][n]['params'] for n in ['DT','RF']}
    # Predeclared sensitivity definitions, refitted/calibrated only on each training split.
    sensitivities=[]
    for sd,minimum in itertools.product([.5,1.,1.5],[5,10,20]):
        if sd==1 and minimum==10:summary=headline
        else:
            rs,xs,ys,_=dataset(sd,minimum);aa,bb,_=split(rs);pr=train_protocol([rs[i] for i in aa],xs[aa],ys[aa],fixed);summary,_=report(pr,[rs[i] for i in bb],xs[bb],ys[bb],100,False)
        sensitivities.append({'sd':sd,'minimum_cases':minimum,'models':summary})
    yearly=[]
    for year in [2018,2019,2020]:
        aa=np.array([i for i,r in enumerate(rows) if r['target']<str(year)]);bb=np.array([i for i,r in enumerate(rows) if r['target'].startswith(str(year))]);pr=train_protocol([rows[i] for i in aa],X[aa],y[aa]);summary,_=report(pr,[rows[i] for i in bb],X[bb],y[bb],200,False);yearly.append({'year':year,'train_end':rows[aa[-1]]['target'],'models':summary})
    # Separate, explicitly optimistic/random comparison. No random-test labels select parameters/calibration/thresholds.
    aa,bb=train_test_split(np.arange(len(rows)),test_size=.3,stratify=y,random_state=SEED);ta,va=train_test_split(aa,test_size=.25,stratify=y[aa],random_state=SEED);random_protocol={'packages':{}}
    for name in NAMES:
        params=fixed.get(name);model=fitmodel(name,params).fit(X[ta],y[ta]) if params else None;vp=raw(name,model,X[va],[rows[i] for i in va],float(y[ta].mean()));prior=float(y[aa].mean());ab=[0.,float(np.log(prior/(1-prior)))] if name=='majority' else calfit(vp,y[va]);cp=calibrate(vp,ab)
        threshold=float(calibrate([.5],ab)[0]) if name in ['persistence','seasonal'] else .5 if name=='majority' else float(max(np.linspace(.05,.95,91),key=lambda t:(balanced_accuracy_score(y[va],cp>=t),-abs(t-.5))))
        random_protocol['packages'][name]={'model':fitmodel(name,params).fit(X[aa],y[aa]) if params else None,'calibration':ab,'operating_point':threshold,'prior':float(y[aa].mean())}
    random_result,_=report(random_protocol,[rows[i] for i in bb],X[bb],y[bb],200,False)
    # Paired block bootstrap of RF-minus-rule F1; identical week resamples across methods.
    rng=np.random.default_rng(SEED);weeks=sorted({r['target'] for r in test});groups=[np.array([i for i,r in enumerate(test) if r['target']==w]) for w in weeks];deltas=[]
    for _ in range(400):
        starts=rng.integers(0,len(weeks),math.ceil(len(weeks)/4));ids=np.concatenate([groups[(int(s)+j)%len(weeks)] for s in starts for j in range(4)])[:len(test)];deltas.append(float(f1_score(y[b][ids],pred['RF']['classes'][ids],zero_division=0)-f1_score(y[b][ids],pred['persistence']['classes'][ids],zero_division=0)))
    delta=np.quantile(deltas,[.025,.975]).tolist();conclusion='RF clearly improves F1 over persistence in this comparison.' if delta[0]>0 else 'Persistence clearly improves F1 over RF in this comparison.' if delta[1]<0 else 'RF is not clearly better than the persistence rule on held-out F1.'
    result={'meta':meta,'split':boundary,'seed':SEED,'sklearn_version':sklearn.__version__,'headline':headline,'random_stratified_70_30':random_result,'sensitivity':sensitivities,'yearly':yearly,'rf_minus_persistence_f1_ci95':delta,'conclusion':conclusion,'chosen_by_validation':protocol['chosen'],'bands':protocol['bands'],'weather':'Not included; optional weather experiment deferred. No weather benefit claimed.','study_citation':'Owner-supplied IEEE document 9357035: Sarma et al., Dengue Prediction using Machine Learning Algorithms, IEEE R10-HTC 2020, DOI 10.1109/R10-HTC49770.2020.9357035. Citation metadata verified with Crossref; IEEE full text blocked by access challenge. Protocol details remain owner-described, not independently verified from full text. No accuracy transfer.'}
    dump(OUT/'evaluation.json',result);dump(OUT/'test-predictions.json',[r|{'models':{n:{'probability':float(it['probabilities'][j]),'class':int(it['classes'][j])} for n,it in pred.items()}} for j,r in enumerate(test)]);make_docs(result);print(json.dumps({'headline':{n:v['main'] for n,v in headline.items()},'conclusion':conclusion,'onset_positives':headline['RF']['onset']['positives']}))

def make_docs(result):
    def table(models):
        keys=['accuracy','balanced_accuracy','precision','recall','f1','roc_auc','pr_auc','brier'];lines=['|Model|N / positives|'+'|'.join(keys)+'|','|---|'+'---|'*9]
        for n,v in models.items():
            m=v['main'];lines.append('|'+n+'|'+str(m['n'])+' / '+str(m['positives'])+'|'+'|'.join('Unavailable' if m[k] is None else f"{m[k]:.4f} [{v['ci95'][k][0]:.4f}, {v['ci95'][k][1]:.4f}]" if v['ci95'][k][0] is not None else f"{m[k]:.4f}" for k in keys)+'|')
        return '\n'.join(lines)
    lines=['# ML evaluation','', 'Generated by `npm run ml:evaluate`. Fixed seed '+str(SEED)+'. Source SHA-256: `'+result['meta']['source_sha256']+'`. All numbers come from saved evaluation and predictions; no prototype metrics are copied.','', '## Chronological 70:30 headline','',json.dumps(result['split']), '',table(result['headline']),'',result['conclusion'],'RF minus persistence F1 paired 95% CI: '+json.dumps(result['rf_minus_persistence_f1_ci95'])+'. The deployed method is chosen by validation, not by test results.','', '## Onset: cities below the threshold at forecast origin','',table({n:{'main':v['onset'],'ci95':v['onset']['ci95']} for n,v in result['headline'].items()}),'', 'Few onset positives make this exploratory early-warning evidence; interval widths matter. Repeated elevated weeks are an easier task than anticipating first onset.','', '## Random stratified 70:30 comparison','',table(result['random_stratified_70_30']),'', 'This row-random comparison mixes earlier and later dates and correlated city/weeks; it is not the headline forecasting estimate. Its parameters are frozen from chronological training and calibration/operating points use a separate random-training validation subset.','', '## Rolling-origin yearly robustness','']
    for fold in result['yearly']:lines+=['### '+str(fold['year'])+'; training through '+fold['train_end'],'',table(fold['models']),'']
    lines+=['## Label sensitivity','', 'Each definition refits models and calibration on its training portion only, using frozen headline training-selected hyperparameters. These nine predeclared definitions do not select a preferred test result.','']
    for s in result['sensitivity']:lines+=['### SD multiplier '+str(s['sd'])+'; minimum '+str(s['minimum_cases']),'',table(s['models']),'']
    lines+=['## Per-city results (Manila included)','']
    for city in result['meta']['cities']:lines+=['### '+city,'',table({n:{'main':v['per_city'][city],'ci95':v['per_city'][city]['ci95']} for n,v in result['headline'].items()}),'']
    lines+=['## Confusion matrices and calibration','', 'Matrix order is [[true negative, false positive], [false negative, true positive]]. Curves and full per-city metrics are in data/processed/ml/evaluation.json.','']
    for n,v in result['headline'].items():lines+=['- '+n+': '+json.dumps(v['main']['confusion_matrix'])]
    lines+=['', '![Confusion matrices](evidence/ml/confusion.png)','', '![Calibration](evidence/ml/calibration.png)','', '## Limits','', '- Operational outbreak labels are research thresholds, not official DOH outbreak declarations or diagnoses.','- All 17-city input weeks are historical. Replay is the default; no current forecast is implied.','- The expanding mean/SD threshold includes data through origin t, and never includes target t+1. No missing values are zero-filled.','- Bootstrap intervals use circular four-week blocks, retaining all cities per sampled week: 400 headline/onset draws, 200 per-city/random/yearly, 100 sensitivity. Sparse one-class samples cannot estimate AUC.','- Calibration and operating points are fitted from out-of-fold chronological training predictions. Calibration may shift across time/cities; no guarantee of operational reliability.','- Quantile risk bands are chosen from validation probabilities, before test outcomes. Displayed reliability is measured from held-out predictions, with sample counts.','- Baseline decision rules are preserved even when their scores are calibrated. Majority uses training prevalence.','- '+result['weather'],'- '+result['study_citation'],'- Administrative shape agreement does not prove catchment equivalence. Population, reporting practices, missing recent surveillance and uncertain week semantics limit generalization.','- No claim that our metrics reproduce patient-level Bangladesh classification; its 79% is not our accuracy.','']
    (DOCS/'ML_EVALUATION.md').write_text('\n'.join(lines),encoding='utf-8')
    import matplotlib;matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    fig,axes=plt.subplots(1,5,figsize=(14,3))
    for ax,(n,v) in zip(axes,result['headline'].items()):
        matrix=np.array(v['main']['confusion_matrix']);ax.imshow(matrix,cmap='Blues');ax.set_title(n);ax.set_xlabel('Predicted');ax.set_ylabel('Actual')
        for (i,j),value in np.ndenumerate(matrix):ax.text(j,i,str(value),ha='center',va='center',color='white' if value>matrix.max()/2 else 'black')
    fig.tight_layout();fig.savefig(DOCS/'evidence/ml/confusion.png',dpi=140);plt.close(fig)
    fig,ax=plt.subplots(figsize=(6,4));ax.plot([0,1],[0,1],'k--',label='Ideal')
    for n,v in result['headline'].items():ax.plot(v['calibration_curve']['predicted_mean'],v['calibration_curve']['observed_fraction'],'o-',label=n)
    ax.set(xlabel='Predicted probability',ylabel='Observed fraction');ax.legend();fig.tight_layout();fig.savefig(DOCS/'evidence/ml/calibration.png',dpi=140);plt.close(fig)

def tree_json(model):
    t=model.tree_;values=t.value[:,0,:];positive=list(model.classes_).index(1)
    return {'left':t.children_left.tolist(),'right':t.children_right.tolist(),'feature':t.feature.tolist(),'threshold':t.threshold.tolist(),'probability':(values[:,positive]/values.sum(axis=1)).tolist()}
def export():
    bundle=joblib.load(WORK/'trained.joblib');result=json.loads((OUT/'evaluation.json').read_text());rows,X,y,meta=dataset();assert meta==bundle['meta']==result['meta'];protocol=bundle['protocol'];exports={}
    for n,pkg in protocol['packages'].items():
        m=pkg['model'];exports[n]={'kind':'forest' if n=='RF' else 'tree' if n=='DT' else n,'trees':[tree_json(t) for t in m.estimators_] if n=='RF' else [tree_json(m)] if n=='DT' else [],'calibration':pkg['calibration'],'operating_point':pkg['operating_point'],'prior':pkg['prior'],'params':pkg['params'],'feature_importances':dict(zip(meta['features'],m.feature_importances_.tolist())) if m is not None else {}}
    signature=hashlib.sha256(json.dumps({'source':meta['source_sha256'],'seed':SEED,'models':exports},sort_keys=True).encode()).hexdigest();model={'version':signature[:16],'feature_spec':meta['features'],'source_sha256':meta['source_sha256'],'training_window':bundle['split'],'chosen':protocol['chosen'],'bands':protocol['bands'],'models':exports,'float_input':'float32 before each tree comparison, matching scikit-learn'};dump(PUBLIC/'models.json',model)
    predictions_data=json.loads((OUT/'test-predictions.json').read_text());chosen=protocol['chosen'];reliability=[]
    for level in range(4):
        group=[r for r in predictions_data if int(np.searchsorted(protocol['bands'],r['models'][chosen]['probability'],side='right'))==level];reliability.append({'level':level,'n':len(group),'outbreaks':sum(r['label'] for r in group),'observed_fraction':sum(r['label'] for r in group)/len(group) if group else None})
    compact=[{k:r[k] for k in ['city','city_id','origin','target','cases','actual_cases','threshold','currently_above','label','history']}|{'probability':r['models'][chosen]['probability'],'predicted_class':r['models'][chosen]['class']} for r in predictions_data]
    cities,weeks,counts=load();known={(r['target'],r['city']) for r in compact};calendar=[w for w in weeks if w>=bundle['split']['test_start']]
    for target in calendar:
        ti=weeks.index(target);origin=weeks[ti-1]
        for c,city in enumerate(cities):
            if (target,city) in known:continue
            _,threshold,_=at(counts,weeks,ti-1,c)
            compact.append({'city':city,'city_id':c,'origin':origin,'target':target,'cases':int(counts[ti-1,c]) if np.isfinite(counts[ti-1,c]) else None,'actual_cases':int(counts[ti,c]) if np.isfinite(counts[ti,c]) else None,'threshold':threshold,'currently_above':bool(counts[ti-1,c]>threshold) if np.isfinite(counts[ti-1,c]) else None,'label':int(counts[ti,c]>threshold) if np.isfinite(counts[ti,c]) else None,'history':[int(v) if np.isfinite(v) else None for v in counts[max(0,ti-8):ti,c]],'probability':None,'predicted_class':None,'reason':'Missing lag or target week; no prediction invented.'})
    compact.sort(key=lambda r:(r['target'],r['city']))
    dump(PUBLIC/'history.json',[{'city':city,'week_ending':week,'cases':int(counts[i,c])} for i,week in enumerate(weeks) for c,city in enumerate(cities) if np.isfinite(counts[i,c])])
    dump(PUBLIC/'replay.json',{'version':model['version'],'mode':'Replay','data_as_of':meta['source_end'],'chosen':chosen,'bands':protocol['bands'],'weeks':calendar,'rows':compact,'reliability':reliability,'metrics':{n:v['main'] for n,v in result['headline'].items()},'conclusion':result['conclusion'],'definition':'Next week exceeds the past-only city mean plus one SD, with a minimum threshold of 10 cases. Research definition, not an official outbreak declaration.'})
    # Deterministic cross-split sample, includes equality-sensitive and varied feature rows.
    ids=np.linspace(0,len(rows)-1,600,dtype=int);items=[]
    for i in ids:
        rr=[rows[i]];xx=X[i:i+1];items.append({'features':X[i].tolist(),'persistence_raw':rows[i]['persistence_raw'],'seasonal_raw':rows[i]['seasonal_raw'],'expected':{n:{'raw':float(raw(n,pkg['model'],xx,rr,pkg['prior'])[0]),'probability':float(calibrate(raw(n,pkg['model'],xx,rr,pkg['prior']),pkg['calibration'])[0]),'class':int(classes(n,calibrate(raw(n,pkg['model'],xx,rr,pkg['prior']),pkg['calibration']),pkg['operating_point'],raw(n,pkg['model'],xx,rr,pkg['prior']))[0])} for n,pkg in protocol['packages'].items()}})
    dump(ROOT/'tests/fixtures/ml-parity.json',{'version':model['version'],'rows':items});dump(PUBLIC/'summary.json',{'version':model['version'],'chosen':chosen,'data_as_of':meta['source_end'],'training_window':bundle['split'],'bands':protocol['bands'],'reliability':reliability,'metrics':{n:v['main'] for n,v in result['headline'].items()},'conclusion':result['conclusion'],'preview_week':bundle['split']['test_start'],'preview':[r for r in compact if r['target']==bundle['split']['test_start']]});print(json.dumps({'exported_models':len(exports),'parity_rows':len(items),'replay_rows':len(compact),'version':model['version'],'chosen':chosen}))

class LeakageTests(unittest.TestCase):
    def test_future_values_cannot_change_features_or_threshold(self):
        cities,weeks,v=load();i=100
        for c in range(17):
            x,t,s=at(v,weeks,i,c);altered=v.copy();altered[i+1:]=999999;x2,t2,s2=at(altered,weeks,i,c);np.testing.assert_array_equal(x,x2);self.assertEqual(t,t2);self.assertEqual(s,s2)
    def test_label_definition_and_sensitivity_are_past_only(self):
        rows,X,y,meta=dataset();cities,weeks,v=load();r=rows[0];i=weeks.index(r['origin']);c=cities.index(r['city']);self.assertEqual(r['threshold'],max(np.nanmean(v[:i+1,c])+np.nanstd(v[:i+1,c],ddof=1),10));self.assertEqual(r['label'],int(v[i+1,c]>r['threshold']));self.assertEqual(len(meta['features']),X.shape[1])
    def test_shared_split_and_folds_mature_labels(self):
        rows,X,y,_=dataset();a,b,boundary=split(rows);self.assertEqual(len({rows[i]['city'] for i in b}),17);self.assertLessEqual(max(rows[i]['target'] for i in a),min(rows[i]['origin'] for i in b));self.assertEqual(boundary['train_weeks'],int((boundary['train_weeks']+boundary['test_weeks'])*.7));self.assertEqual(len(list(folds([rows[i] for i in a]))),3)
    def test_no_missing_duplicate_or_partial_week(self):
        cities,weeks,v=load();self.assertEqual([weeks[i] for i in range(len(weeks)) if not np.isfinite(v[i]).all()],['2016-11-13','2019-01-06','2020-11-15']);self.assertTrue(np.isfinite(dataset()[1]).all());self.assertEqual(weeks[-1],'2020-12-27');self.assertEqual(v.shape[1],17)
if __name__=='__main__':
    command=sys.argv[1] if len(sys.argv)>1 else 'evaluate'
    if command=='test':unittest.main(argv=[sys.argv[0]])
    else:{'train':train,'evaluate':evaluate,'export':export}[command]()
