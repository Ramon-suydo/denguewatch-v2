import {useState} from 'react';
import {useRedesignLanguage} from '../redesign/Language';
import type {AlertLevel,Thresholds} from './useModelForecast';
import type {LiveData} from './model';

type T=(en:string,fl:string)=>string;
// Recommended response per alert level. Wording follows DOH 4S / search-and-destroy guidance used in Manila.
function actions(level:AlertLevel,t:T){
 const routine=[t('Search and destroy breeding sites at home weekly (4S).','Hanapin at sirain ang pinamumugaran ng lamok linggo-linggo (4S).'),t('Keep water containers covered; clean gutters and drains.','Takpan ang imbakan ng tubig; linisin ang alulod at kanal.'),t('See a doctor early for fever lasting 2 days or more.','Magpatingin agad kung may lagnat nang 2 araw o higit pa.')];
 if(level==='Low')return routine;
 const medium=[t('Barangays: hold clean-up drives in areas with past cases.','Barangay: magsagawa ng clean-up drive sa mga lugar na may dating kaso.'),t('Health centers: remind residents through posts and announcements.','Health center: paalalahanan ang mga residente sa post at anunsiyo.'),t('Check schools and public places for standing water.','Suriin ang mga paaralan at pampublikong lugar para sa naipong tubig.')];
 if(level==='Medium')return [...medium,...routine.slice(0,1)];
 return [t('Activate dengue fast lanes in district hospitals and health centers.','Buksan ang dengue fast lane sa mga district hospital at health center.'),t('Target misting and larviciding in barangays with clustered cases.','Mag-misting at larviciding sa mga barangay na may kumpol ng kaso.'),t('Prepare beds, IV fluids and blood supply for more admissions.','Ihanda ang kama, IV fluid at dugo para sa mas maraming pasyente.'),...medium.slice(0,2)];
}

export function AlertActions({level}:{level:AlertLevel}){
 const {t}=useRedesignLanguage(),list=actions(level,t);
 return <div className={'alert-actions level-'+level.toLowerCase()} data-alert-actions={level}>
  <h3>{level==='High'?t('What to do now (High alert)','Ano ang gagawin ngayon (Mataas)'):level==='Medium'?t('What to do now (Medium alert)','Ano ang gagawin ngayon (Katamtaman)'):t('What to keep doing (Low alert)','Ano ang ipagpapatuloy (Mababa)')}</h3>
  <ul>{list.map((item,i)=><li key={item} style={{animationDelay:`${120+i*70}ms`}}><span aria-hidden="true">✓</span>{item}</li>)}</ul>
 </div>;
}

export function SameWeekCompare({thresholds,current}:{thresholds:Thresholds;current:number}){
 const {t}=useRedesignLanguage(),max=Math.max(current,...thresholds.values,1);
 const rows=[...thresholds.years.map((y,i)=>({label:String(y),value:thresholds.values[i],now:false})),{label:t('2026 forecast','Pagtataya 2026'),value:current,now:true}];
 return <div className="same-week" data-same-week>
  <h3>{t('Same week in earlier years','Parehong linggo sa mga nakaraang taon')}</h3>
  <ul>{rows.map((r,i)=><li key={r.label} className={r.now?'now':''}><span>{r.label}</span><span className="same-week-track"><span className="same-week-fill" style={{width:`${Math.max(3,Math.round(r.value/max*100))}%`,animationDelay:`${i*90}ms`}}/></span><strong>{r.value}</strong></li>)}</ul>
 </div>;
}

export function downloadCsv(data:LiveData){
 const header='week_start,week_end,weekly_cases,total_since_jan1,estimated';
 const lines=data.rows.map(r=>[r.week_start,r.week_end,r.weekly_new_cases,r.total_since_jan1,r.weekly_is_estimate?'yes':'no'].join(','));
 const blob=new Blob([[header,...lines].join('\n')+'\n'],{type:'text/csv'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=`manila-dengue-weekly-${data.metadata.last_week_end}.csv`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}

// Opens the forecast card alone in a clean window (same styles) so the printout is one tidy bulletin.
export function printBulletin(){
 const card=document.querySelector('.forecast-card');
 const w=card?window.open('','_blank','width=960,height=1200'):null;
 if(!card||!w){window.print();return;}
 const styles=[...document.querySelectorAll('link[rel="stylesheet"],style')].map(node=>node.outerHTML).join('');
 const theme=document.documentElement.getAttribute('data-theme')??'';
 w.document.open();
 w.document.write(`<!doctype html><html lang="${document.documentElement.lang||'en'}" data-theme="${theme==='night'?'day':theme}" style="background:#fff"><head><meta charset="utf-8"><title>DengueWatch AI weekly bulletin</title><base href="${location.origin}/">${styles}</head><body class="bulletin-window">${card.outerHTML}</body></html>`);
 w.document.close();
 const go=()=>{w.focus();w.print();};
 if(w.document.readyState==='complete')setTimeout(go,400);else w.addEventListener('load',()=>setTimeout(go,400));
}

export function CardTools({data}:{data:LiveData}){
 const {t}=useRedesignLanguage();
 return <div className="card-tools no-print">
  <button type="button" className="ui-button ui-button-primary" onClick={printBulletin}>{t('Print weekly bulletin','I-print ang lingguhang bulletin')}</button>
  <button type="button" className="ui-button ui-button-secondary" onClick={()=>downloadCsv(data)}>{t('Download data (CSV)','I-download ang datos (CSV)')}</button>
 </div>;
}

const KEY='denguewatch-guide-dismissed';
export function ReadingGuide(){
 const {t}=useRedesignLanguage();
 const [hidden,setHidden]=useState(()=>{try{return localStorage.getItem(KEY)==='1';}catch{return false;}});
 if(hidden)return null;
 const steps=[[t('The number','Ang bilang'),t('cases expected next week','inaasahang kaso sa susunod na linggo')],[t('The alert','Ang antas'),t('Low, Medium or High vs. the usual level','Mababa, Katamtaman o Mataas kumpara sa karaniwan')],[t('The actions','Ang gagawin'),t('what to do at that level','ano ang gagawin sa antas na iyon')]];
 return <aside className="reading-guide no-print" aria-label={t('How to read this page','Paano basahin ang pahinang ito')}>
  <ol>{steps.map(([title,text],i)=><li key={title}><span className="guide-step">{i+1}</span><span><strong>{title}</strong> {text}</span></li>)}</ol>
  <button type="button" className="guide-close" onClick={()=>{setHidden(true);try{localStorage.setItem(KEY,'1');}catch{/* private mode: hide for this visit only */}}}>{t('Got it','Sige')}</button>
 </aside>;
}
