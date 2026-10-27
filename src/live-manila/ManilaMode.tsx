import {Segmented} from '../overhaul/Components';
import {ManilaHistory} from '../redesign/ManilaHistory';
import {useRedesignLanguage} from '../redesign/Language';
import type {useForecast} from '../ml/useForecast';
import {LiveManilaCard} from './LiveManilaCard';
export function ManilaMode({forecast}:{forecast:ReturnType<typeof useForecast>}){const {t}=useRedesignLanguage(),active=forecast.mode==='Live',data=forecast.liveManila;
 return <section aria-label={t('Manila data mode','Uri ng datos ng Maynila')}><Segmented value={forecast.mode} onChange={mode=>forecast.setMode(mode as 'Replay'|'Live')} label={t('Manila Replay or Live','Maynila Replay o Live')} options={[{value:'Replay',label:'Replay'},{value:'Live',label:'Live',disabled:!forecast.live}]}/>{forecast.stale&&<p role="status">{t('Live data is out of date. Showing Replay.','Luma na ang live na datos. Replay ang ipinapakita.')}</p>}{forecast.liveError&&<p role="status">{t('Live data could not load. Replay remains available.','Hindi ma-load ang live na datos. Magagamit ang Replay.')} <button onClick={forecast.retry}>{t('Try again','Subukan muli')}</button></p>}{active&&data?<div id="manila-history"><LiveManilaCard data={data}/></div>:<ManilaHistory/>}</section>;
}
