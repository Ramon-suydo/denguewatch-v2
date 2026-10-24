import json,pathlib
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from datetime import datetime, timedelta
import math
root=pathlib.Path('docs/figures');root.mkdir(parents=True,exist_ok=True)
data=json.loads(pathlib.Path('data/processed/evaluation.json').read_text(encoding='utf-8'))
plt.rcParams.update({'font.size':10,'axes.spines.top':False,'axes.spines.right':False,'figure.dpi':140})
fig,axes=plt.subplots(2,1,figsize=(12,7),layout='constrained')
for ax,scenario in zip(axes,['Z','M']):
 rows=[r for r in data['evidence'] if r['scenario']==scenario and r['model']=='naive' and r['horizon']==1 and r['target'].startswith('2023')]
 by_date={datetime.fromisoformat(r['target']):r for r in rows}
 dates=[]
 if rows:
  cursor=min(by_date)
  while cursor<=max(by_date): dates.append(cursor);cursor+=timedelta(days=7)
 values=lambda key:[by_date.get(d,{}).get(key,math.nan) for d in dates]
 ax.plot(dates,values('actual'),label='Recorded/scenario target',color='#14233e',marker='.',lw=1.6)
 ax.plot(dates,values('predicted'),label='Last-week persistence forecast',color='#2153ab',ls='--',lw=1.6)
 if rows:ax.fill_between(dates,values('low80'),values('high80'),alpha=.12,color='#2153ab',label='Nominal 80% interval')
 ax.set(title=f'Scenario {scenario} · 2023 paired common-support targets (gaps not filled)',ylabel='Weekly cases');ax.legend(loc='upper right',fontsize=8)
fig.suptitle('Manila · historical one-week forecast versus actual',fontweight='bold')
fig.savefig(root/'forecast-vs-actual.png');plt.close(fig)
fig,axes=plt.subplots(1,2,figsize=(11,4.8),layout='constrained')
for ax,scenario in zip(axes,['Z','M']):
 for model,label,style in [('naive','Last week','o-'),('ridge-cases','Ridge: cases','s--'),('ridge-weather','Ridge: weather','^:')]:
  rows=sorted([r for r in data['summaries'] if r['scenario']==scenario and r['model']==model and r['fold']=='test-2018-2023'],key=lambda r:r['horizon'])
  ax.plot([r['horizon'] for r in rows],[r['mae'] for r in rows],style,label=label)
 ax.set(title=f'Scenario {scenario}',xlabel='Forecast horizon (weeks)',ylabel='MAE (cases)',xticks=[1,2,4]);ax.axvspan(3,4.2,color='#f3eedf',alpha=.5);ax.legend(fontsize=8)
fig.suptitle('2018–2023 paired evaluation · four weeks exploratory',fontweight='bold');fig.savefig(root/'error-by-horizon.png');plt.close(fig)
print('Wrote forecast-vs-actual.png and error-by-horizon.png from saved evidence.')
