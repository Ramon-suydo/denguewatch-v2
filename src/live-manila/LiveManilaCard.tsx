import {manilaToday} from '../ml/live';
import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {useRedesignLanguage} from '../redesign/Language';
import {CountUp} from '../ml/CountUp';
import type {LiveData} from './model';
import {useModelForecast,forecastMatches,forecastChecks,type AlertLevel,type Thresholds} from './useModelForecast';
import {AlertActions,SameWeekCompare,CardTools} from './ForecastExtras';

const MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const day=(iso:string)=>`${MONTHS[Number(iso.slice(5,7))-1]} ${Number(iso.slice(8,10))}`;
const span=(start:string,end:string)=>`${day(start)} – ${day(end)}, ${end.slice(0,4)}`;
// Phones get the most recent 8 weeks at a readable size instead of a cropped, sideways-scrolling chart.
function useNarrow(){
 const query='(max-width: 640px)',[narrow,setNarrow]=useState(()=>typeof window!=='undefined'&&window.matchMedia(query).matches);
 useEffect(()=>{const list=window.matchMedia(query),update=()=>setNarrow(list.matches);update();list.addEventListener('change',update);return()=>list.removeEventListener('change',update);},[]);
 return narrow;
}
const startOf=(end:string)=>new Date(Date.parse(end+'T00:00:00Z')-6*86400000).toISOString().slice(0,10);

export function AlertBadge({level}:{level:AlertLevel|null}){
 const {t}=useRedesignLanguage();
 if(!level)return <span className="alert-badge alert-none">{t('Alert: not available','Antas: wala')}</span>;
 const name={Low:t('Low','Mababa'),Medium:t('Medium','Katamtaman'),High:t('High','Mataas')}[level];
 return <span className={'alert-badge alert-'+level.toLowerCase()} data-alert-level={level}><span aria-hidden="true">{level==='High'?'!':level==='Medium'?'▲':'○'}</span>{name} {t('alert','na antas')}</span>;
}

function alertMeaning(level:AlertLevel,th:Thresholds,t:(en:string,fl:string)=>string){
 if(level==='High')return t(`Above the epidemic threshold for this week (${Math.round(th.epidemic)} cases). Step up clean-ups and prepare health centers.`,`Lampas sa epidemic threshold para sa linggong ito (${Math.round(th.epidemic)} kaso). Paigtingin ang paglilinis at ihanda ang mga health center.`);
 if(level==='Medium')return t(`Above the usual level for this week (${Math.round(th.alert)} cases). Intensify prevention activities.`,`Mas mataas sa karaniwan para sa linggong ito (${Math.round(th.alert)} kaso). Paigtingin ang pag-iwas.`);
 return t(`Within the usual level for this week (below ${Math.round(th.alert)} cases).`,`Nasa karaniwang antas para sa linggong ito (mas mababa sa ${Math.round(th.alert)} kaso).`);
}

// Next-week forecast shared by the forecast card and the homepage hero, so both always show the same numbers.
export function useNextWeekForecast(data:LiveData){
 const {expanded,extras}=useModelForecast(),useRf=forecastMatches(expanded,data);
 const rf=[1,2].map(h=>{const e=extras?.horizons.find(x=>x.horizon===h),f=expanded?.horizons.find(x=>x.horizon===h)?.forecast;
  const same=e?.forecast.target===f?.target;
  return f?{horizon:h,target:f.target,predicted:Math.round(f.predicted),level:same?e!.forecast.alert_level:null,thresholds:same?e!.forecast.thresholds:null,range:same?(e!.calibrated?.adopted?{low:e!.calibrated.low,high:e!.calibrated.high,test_coverage_percent:e!.calibrated.loo_coverage_percent}:e!.forecast_range??null):null,
   chance:same&&e!.calibrated?.chance_adopted?e!.calibrated.chance_high_percent??null:null,shifted:same&&Boolean(e!.calibrated?.adopted)}:null;});
 const bias=extras?.recent_2026_check?.find(c=>c.horizon===1)?.rf_mean_bias??0;
 const next=useRf?rf[0]:null,later=useRf?rf[1]:null;
 const quick=data.method.ranges.find(r=>r.horizon===1)!;
 return {expanded,extras,next,later,quick,bias,checks:forecastChecks(expanded,data)};
}

// Homepage hero summary: the one number a health worker came for, visible without scrolling.
export function HeroForecast({data}:{data:LiveData}){
 const {t}=useRedesignLanguage(),{next,quick}=useNextWeekForecast(data),latest=data.rows.at(-1)!;
 const target=next?next.target:quick.target_week_end,value=next?next.predicted:quick.median;
 return <a className="hero-forecast" href="#manila-history" data-hero-forecast>
  <span className="hero-forecast-label">{t('Next week','Susunod na linggo')} · {span(startOf(target),target)}</span>
  <span className="hero-forecast-value"><strong>{value}</strong> {t('expected cases','inaasahang kaso')}</span>
  <span className="hero-forecast-meta">{next?<AlertBadge level={next.level}/>:<span className="hero-forecast-quick">{t('Quick estimate · Random Forest update pending','Mabilis na tantiya · hinihintay ang Random Forest')}</span>}<span>{t('Last week','Nakaraang linggo')}: {latest.weekly_new_cases} {t('reported','naiulat')}</span></span>
 </a>;
}

export function LiveManilaCard({data}:{data:LiveData}){
 const {t}=useRedesignLanguage(),latest=data.rows.at(-1)!,m=data.method,narrow=useNarrow();
 const {extras,next,later,quick,bias,checks}=useNextWeekForecast(data);
 const error=extras?.horizons.find(h=>h.horizon===1)?.metrics.find(x=>x.label==='Random Forest');
 const allBars=[...data.rows.map(r=>({key:r.week_end,value:r.weekly_new_cases,estimated:r.weekly_is_estimate,forecast:false})),...(next?[{key:next.target,value:next.predicted,estimated:false,forecast:true}]:[])];
 const bars=narrow?allBars.slice(-8):allBars,W=narrow?400:900,lastActual=bars.length-(bars.at(-1)?.forecast?2:1);
 const max=Math.max(1,...bars.map(b=>b.value)),width=W/bars.length;
 const direction=t(m.direction,({Rising:'Tumataas',Steady:'Halos pareho',Falling:'Bumababa',Unavailable:'Hindi matukoy'} as Record<string,string>)[m.direction]);
 return <article className="live-manila-card forecast-card" data-live-manila data-source="/live-manila/weekly.json + /research/manila-expanded.json + /research/manila-extras.json">
  <div className="print-only print-header"><strong>DengueWatch AI · {t('Weekly Dengue Bulletin, City of Manila','Lingguhang Bulletin sa Dengue, Lungsod ng Maynila')}</strong><span>{t('Printed','Na-print')} {manilaToday()}</span></div>
  <p className="eyebrow">{t('CITY OF MANILA · WEEKLY DENGUE FORECAST','LUNGSOD NG MAYNILA · LINGGUHANG PAGTATAYA')}</p>
  <h2>{t('What to expect next week','Ano ang aasahan sa susunod na linggo')}</h2>
  {next?<div className="forecast-hero">
   <div className="forecast-main">
    <p className="forecast-label">{t('Next week','Susunod na linggo')} · {span(startOf(next.target),next.target)}</p>
    <p className="rf-number"><strong data-rf-forecast><CountUp value={next.predicted}/></strong> <span>{t('expected cases','inaasahang kaso')}</span></p>
    {next.range&&<p className="rf-range" data-rf-range>{t(`Likely between ${next.range.low} and ${next.range.high}`,`Malamang nasa ${next.range.low} hanggang ${next.range.high}`)}</p>}
    <div className="alert-row"><AlertBadge level={next.level}/>{next.chance!=null&&<span className="chance-high" data-chance-high>{t(`Chance of a High week: ${next.chance}%`,`Tsansang Mataas: ${next.chance}%`)}</span>}</div>
    {next.level&&next.thresholds&&<p className="forecast-meaning">{alertMeaning(next.level,next.thresholds,t)}</p>}
    {next.range&&<p className="rf-honesty">{t(`In past tests, ranges like this held the real number ${Math.round(next.range.test_coverage_percent)}% of the time.`,`Sa mga pagsubok, ${Math.round(next.range.test_coverage_percent)}% ng pagkakataon na nasa ganitong saklaw ang totoong bilang.`)}{next.shifted&&bias<=-10?' '+t('The range leans higher because the model has predicted low so far in 2026.','Mas mataas ang saklaw dahil mababa ang naging pagtataya ng modelo sa 2026.'):(!next.shifted&&bias<=-10?' '+t(`So far in 2026 the model has predicted about ${Math.round(-bias)} cases too low on average, so the real number may be higher.`,`Sa 2026, mga ${Math.round(-bias)} kaso ang kulang ng pagtataya sa karaniwan, kaya maaaring mas mataas ang totoong bilang.`):'')}</p>}
    {next.target<manilaToday()&&<p role="note">{t('This week has passed. Add the newest weekly total to update the forecast.','Lumipas na ang linggong ito. Idagdag ang pinakabagong bilang para ma-update ang pagtataya.')}</p>}
   </div>
   <div className="forecast-side">
    <div><p className="forecast-label">{t('Last reported week','Huling naiulat na linggo')} · {span(latest.week_start,latest.week_end)}</p><p className="forecast-small"><strong>{latest.weekly_new_cases}</strong> {t('cases','kaso')} · {direction}</p></div>
    {later&&<div><p className="forecast-label">{t('In two weeks','Sa loob ng dalawang linggo')} · {span(startOf(later.target),later.target)}</p><p className="forecast-small"><strong>~{later.predicted}</strong> {t('cases','kaso')}</p>{later.range&&<p className="forecast-label">{t(`Likely ${later.range.low}–${later.range.high}`,`Malamang ${later.range.low}–${later.range.high}`)}</p>}<AlertBadge level={later.level}/></div>}
   </div>
  </div>:<div className="forecast-hero">
   <div className="forecast-main">
    <p className="forecast-label">{t('Next week','Susunod na linggo')} · {span(quick.target_week_start,quick.target_week_end)}</p>
    <p className="rf-number"><strong><CountUp value={quick.median}/></strong> <span>{t('expected cases (quick estimate)','inaasahang kaso (mabilis na tantiya)')}</span></p>
    <p className="forecast-meaning">{t(`Likely between ${quick.low} and ${quick.high}. The Random Forest forecast and alert level update after the weekly model run.`,`Malamang nasa ${quick.low} hanggang ${quick.high}. Maa-update ang Random Forest at antas ng babala matapos patakbuhin ang modelo.`)}</p>
   </div>
   <div className="forecast-side"><div><p className="forecast-label">{t('Last reported week','Huling naiulat na linggo')} · {span(latest.week_start,latest.week_end)}</p><p className="forecast-small"><strong>{latest.weekly_new_cases}</strong> {t('cases','kaso')} · {direction}</p></div></div>
  </div>}
  {next?.level&&<div className="forecast-support"><AlertActions level={next.level}/>{next.thresholds&&<SameWeekCompare thresholds={next.thresholds} current={next.predicted}/>}</div>}
  <CardTools data={data}/>
  {checks.length>0&&<div className="forecast-check" data-forecast-check><h3>{t('How did our last forecast do?','Gaano katumpak ang huling pagtataya?')}</h3><ul>{checks.map(c=><li key={c.target}>{span(startOf(c.target),c.target)}: {t('forecast','pagtataya')} <strong>{c.predicted}</strong> · {t('reported','naiulat')} <strong>{c.actual}</strong> ({t('difference','pagitan')} {Math.abs(c.actual-c.predicted)})</li>)}</ul></div>}
  <figure className="forecast-chart"><svg viewBox={`0 0 ${W} 200`} role="img" aria-label={t('Weekly dengue cases in Manila, with next week\'s forecast as a dashed bar. Lighter bars are estimated weeks.','Lingguhang kaso ng dengue sa Maynila; putol-putol ang hula sa susunod na linggo. Mas mapusyaw ang tinatayang linggo.')}>
   <line x1="0" x2={W} y1="150" y2="150" stroke="var(--line)" strokeWidth="1"/>
   {bars.map((b,i)=>{const height=b.value/max*120,x=i*width+width*.18,w=width*.64,labelled=b.forecast||i===lastActual;return <g key={b.key} className="forecast-bar" style={{animationDelay:`${i*35}ms`}}>
    <rect data-live-bar={b.key} data-estimated={String(b.estimated)} x={x} y={150-height} width={w} height={height} rx="3" fill={b.forecast?'none':'currentColor'} fillOpacity={b.estimated?.38:1} stroke={b.forecast?'var(--coral)':'none'} strokeWidth={b.forecast?2:0} strokeDasharray={b.forecast?'5 4':undefined}><title>{day(b.key)}: {b.value} {b.forecast?t('(forecast)','(pagtataya)'):b.estimated?t('(estimated)','(tinataya)'):''}</title></rect>
    {labelled&&<text x={x+w/2} y={142-height} textAnchor="middle" fontSize="15" fontWeight="700" fill={b.forecast?'var(--coral)':'var(--ink)'}>{b.value}</text>}
    {(labelled||i%2===(lastActual%2))&&<text x={x+w/2} y="172" textAnchor="middle" fontSize="13" fontWeight={labelled?700:400} fill={b.forecast?'var(--coral)':'var(--muted)'}>{b.forecast?t('Next','Susunod'):day(b.key)}</text>}
   </g>;})}</svg>
   <figcaption><span className="key key-reported" aria-hidden="true"/> {t('Reported','Naiulat')} <span className="key key-estimated" aria-hidden="true"/> {t('Estimated','Tinataya')} {next&&<><span className="key key-forecast" aria-hidden="true"/> {t('Forecast','Pagtataya')}</>} · {t(narrow?'Last 8 weeks, by week ending.':'Weekly cases, by week ending.',narrow?'Huling 8 linggo, ayon sa katapusan ng linggo.':'Lingguhang kaso, ayon sa katapusan ng linggo.')}</figcaption></figure>
  <p className="forecast-note">{t('2026 figures come from the Manila Health Department\'s daily reports posted by the Manila Public Information Office and may still be revised. Forecasts help with planning; they are not official DOH alerts.','Ang tala ng 2026 ay mula sa pang-araw-araw na ulat ng Manila Health Department na ipinost ng Manila Public Information Office at maaari pang mabago. Gabay sa pagpaplano ang pagtataya; hindi ito opisyal na babala ng DOH.')}</p>
  <details><summary>{t('How the forecast and alert work','Paano gumagana ang pagtataya at antas ng babala')}</summary>
   <p>{t('A Random Forest model learned from Manila\'s weekly dengue cases (2016–2023), the season, and rainfall, temperature and humidity from previous weeks. It uses the latest reported weeks to forecast the next one.','Natuto ang Random Forest mula sa lingguhang kaso ng dengue sa Maynila (2016–2023), panahon, at ulan, temperatura at halumigmig ng mga nakaraang linggo. Ginagamit nito ang pinakabagong mga linggo para hulaan ang susunod.')}</p>
   {error&&<p>{t(`When tested on 2023, it was off by about ${Math.round(error.mae)} cases per week on average.`,`Nang subukan sa 2023, nagkamali ito ng mga ${Math.round(error.mae)} kaso bawat linggo sa karaniwan.`)}</p>}
   {next?.thresholds&&<p>{t(`Alert levels follow the DOH method: the usual level is the average for the same week in recent years (${next.thresholds.years.join(', ')}). Medium means above that average (${Math.round(next.thresholds.alert)}); High means above the epidemic threshold, the average plus two standard deviations (${Math.round(next.thresholds.epidemic)}). 2020–2021 are skipped because of COVID-19, and no Manila data were available for 2024–2025.`,`Sumusunod sa paraan ng DOH ang antas: ang karaniwan ay average ng parehong linggo sa mga nakaraang taon (${next.thresholds.years.join(', ')}). Katamtaman kung lampas sa average (${Math.round(next.thresholds.alert)}); Mataas kung lampas sa epidemic threshold (${Math.round(next.thresholds.epidemic)}). Hindi isinama ang 2020–2021 dahil sa COVID-19, at walang datos ng Maynila para sa 2024–2025.`)}</p>}
   <p><Link to="/our-model#results">{t('See how accurate the model is','Tingnan ang katumpakan ng modelo')}</Link></p>
  </details>
  <details><summary>{t('Read all weekly values','Basahin ang lahat ng lingguhang bilang')}</summary><div className="table-scroll" role="region" tabIndex={0} aria-label={t('Manila weekly data','Lingguhang datos ng Maynila')}><table><thead><tr><th>{t('Week ending','Katapusan ng linggo')}</th><th>{t('Cases','Kaso')}</th><th>{t('Estimated','Tinataya')}</th><th>{t('Source','Pinagmulan')}</th></tr></thead><tbody>{data.rows.map(r=><tr key={r.week_end}><th scope="row">{r.week_end}</th><td>{r.weekly_new_cases}</td><td>{r.weekly_is_estimate?t('Yes','Oo'):t('No','Hindi')}</td><td>{r.source_url?<a href={r.source_url} target="_blank" rel="noreferrer">{t('Public post','Pampublikong post')}</a>:t('Manila PIO post','Post ng Manila PIO')}</td></tr>)}</tbody></table></div></details>
  <p className="forecast-care">{t('Have a fever? See a doctor early. Get urgent care for severe belly pain, repeated vomiting, bleeding, or trouble breathing.','May lagnat? Magpatingin agad. Magpunta agad sa ospital kung may matinding sakit ng tiyan, tuloy-tuloy na pagsusuka, pagdurugo, o hirap huminga.')} <a href="/#actions">{t('Prevention tips','Mga paraan ng pag-iwas')}</a></p>
 </article>;
}
