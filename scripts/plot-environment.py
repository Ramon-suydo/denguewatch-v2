import json,pathlib,math
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
read=lambda p:json.loads(pathlib.Path(p).read_text(encoding='utf-8'))
design=read('data/processed/environment_design.json');data=read('data/processed/environment_evaluation.json')
fig,axes=plt.subplots(1,3,figsize=(13,4),layout='constrained')
for ax,driver in zip(axes,['rainfall_mm','temperature_c','humidity_percent']):
 for scenario,marker in [('Z','o'),('M','x')]:
  rows=[r for r in design['lags'][scenario]['correlations'] if r['driver']==driver]
  ax.plot([r['lag'] for r in rows],[r['r'] for r in rows],marker=marker,label=scenario)
 ax.axhline(0,color='gray',linewidth=.6);ax.set_xticks(range(1,9));ax.set_xlabel('Weather lag before forecast origin (weeks)');ax.set_ylabel('Pearson r with log(1 + next-week cases)');ax.set_title(driver);ax.legend()
fig.suptitle('Training only: 2016-2017; no test-year lag selection; descriptive, season-confounded')
fig.savefig('docs/figures/weather-lag-correlations.png',dpi=150);plt.close(fig)
fig,axes=plt.subplots(1,2,figsize=(12,4),layout='constrained')
for ax,scenario in zip(axes,['Z','M']):
 rows=[r for r in design['profile'] if r['scenario']==scenario]
 ax.plot([r['month'] for r in rows],[r['mean_cases'] for r in rows],marker='o',label='Scorable scenario weeks')
 ax.plot([r['month'] for r in rows],[r['complete_mean_cases'] for r in rows],marker='x',linestyle='--',label='Reliable complete-row subset')
 ax.axvspan(6,11,color='#eeeeee');ax.set_xticks(range(1,13));ax.set_xlabel('Month of Sunday week ending');ax.set_ylabel('Mean recorded cases per week');ax.set_title('Scenario '+scenario);ax.legend(fontsize=8)
fig.suptitle('Manila 2016-2023 monthly profile; descriptive history, not a seasonal forecast')
fig.savefig('docs/figures/monthly-case-profile.png',dpi=150);plt.close(fig)
fig,axes=plt.subplots(1,2,figsize=(12,4),layout='constrained')
models=['naive','env-ar','env-season','env-weather','env-season-weather','env-season-weather-no-engineered']
for ax,scenario in zip(axes,['Z','M']):
 for model in models:
  rows=sorted([r for r in data['summaries'] if r['scenario']==scenario and r['model']==model and r['fold']=='test-2018-2023'],key=lambda r:r['horizon'])
  ax.plot([r['horizon'] for r in rows],[r['mae'] for r in rows],marker='o',label=model)
 ax.set_xticks([1,2,4]);ax.set_xlabel('Horizon (weeks); 4 exploratory');ax.set_ylabel('Matched-support MAE (cases)');ax.set_title('Scenario '+scenario);ax.legend(fontsize=7)
fig.suptitle('Environment ablation, expanding origins 2018-2023; no environmental promotion')
fig.savefig('docs/figures/environment-ablation.png',dpi=150);plt.close(fig)
print('Saved training-only lag, monthly profile and matched ablation figures.')
