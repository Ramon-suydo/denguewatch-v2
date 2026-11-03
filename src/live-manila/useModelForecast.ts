import {useEffect,useState} from 'react';
import type {LiveData} from './model';

// Random Forest forecast (ml/manila_count.py) + paper extras (ml/manila_extras.py): DOH-style alert levels,
// MAPE, Seasonal Average and SARIMA baselines. Both files are static aggregates; no 2026 model runs in the browser.
export type AlertLevel='Low'|'Medium'|'High';
export type Thresholds={years:number[];values:number[];alert:number;epidemic:number};
export type ExtrasMetric={label:string;model:string;n:number;mae:number;rmse:number;mape:number};
export type ExtrasHorizon={horizon:number;test_period:[string,string];metrics:ExtrasMetric[];
 rf_minus_sarima?:{mae_difference:number;ci95:[number,number];first_closer_weeks:number;weeks:number};
 sharp_change?:{threshold_percent:number;weeks:number;mae:Record<string,number>};
 forecast_range?:{low:number;high:number;test_coverage_percent:number}|null;
 calibrated?:{adopted:boolean;low:number;high:number;loo_coverage_percent:number;previous_coverage_percent:number;chance_adopted:boolean;chance_high_percent?:number;high_detection_2023:{actual_high_weeks:number;hard_label:{caught:number;false_alarms:number};chance_50:{caught:number;false_alarms:number}}};
 alert_test:{weeks:number;agreement_percent:number;actual_levels:Record<AlertLevel,number>};
 forecast:{origin:string;target:string;model:string;predicted:number;thresholds:Thresholds|null;alert_level:AlertLevel|null}};
export type LogEntry={origin_week_end:string;target_week_end:string;recorded_on:string;random_forest:number;sarima:number;average:number;naive:number;actual:number|null};
export type Extras={version:string;horizons:ExtrasHorizon[];alert_rule:{note:string};
 recent_2026_check?:{horizon:number;weeks:number;rf_mae:number;naive_mae:number;rf_mape:number;rf_mean_bias:number}[];
 feature_importance:{available:boolean;model?:string;features?:{feature:string;importance:number}[]}};
type Expanded={version:string;latest_week_end:string;recent_input:{week_end:string;cases:number;estimated:boolean}[];
 horizons:{horizon:number;forecast:{origin:string;target:string;predicted:number;model:string}}[]};

export function useModelForecast(){
 const [expanded,setExpanded]=useState<Expanded|null>(null),[extras,setExtras]=useState<Extras|null>(null),[log,setLog]=useState<LogEntry[]|null>(null);
 useEffect(()=>{const controller=new AbortController();
  const get=(url:string)=>fetch(url,{signal:controller.signal}).then(r=>{if(!r.ok)throw Error('Unavailable');return r.json();});
  void get('/research/manila-expanded.json').then((d:Expanded)=>{if(d.version==='manila-count-expanded-v1')setExpanded(d);}).catch(()=>{});
  void get('/research/manila-extras.json').then((d:Extras)=>{if(d.version==='manila-count-extras-v1')setExtras(d);}).catch(()=>{});
  void get('/research/manila-forecast-log.json').then((d:{version:string;entries:LogEntry[]})=>{if(d.version==='manila-forecast-log-v1')setLog(d.entries);}).catch(()=>{});
  return()=>controller.abort();},[]);
 return {expanded,extras,log};
}

/** The saved Random Forest forecast is shown only when it was computed from exactly the weeks the page shows. */
export function forecastMatches(expanded:Expanded|null,live:LiveData|null){
 if(!expanded||!live||expanded.recent_input.length!==live.rows.length)return false;
 return expanded.recent_input.every((r,i)=>{const row=live.rows[i];return r.week_end===row.week_end&&r.cases===row.weekly_new_cases&&r.estimated===row.weekly_is_estimate;});
}

/** After a newer week is uploaded, compare the earlier forecast with what was later reported. */
export function forecastChecks(expanded:Expanded|null,live:LiveData|null){
 if(!expanded||!live)return [];
 return expanded.horizons.flatMap(h=>{const row=live.rows.find(r=>r.week_end===h.forecast.target);return row?[{horizon:h.horizon,target:h.forecast.target,predicted:Math.round(h.forecast.predicted),actual:row.weekly_new_cases,estimated:row.weekly_is_estimate}]:[];});
}
