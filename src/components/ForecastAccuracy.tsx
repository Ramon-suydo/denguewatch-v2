import { Card } from './ui';
import type { Evidence,Scenario } from '../lib/evidence';
export function ForecastAccuracy({data,scenario}:{data:Evidence;scenario:Scenario}){
 const rows=data.summaries.filter(r=>r.scenario===scenario && r.fold==='test-2018-2023' && ['naive','ridge-cases','ridge-weather'].includes(r.model) && [1,2,4].includes(r.horizon));
 return <Card><h2>How accurate is this?</h2><p>The public chart starts with Scenario M (only complete daily-row weeks). Scenario Z assumes absent dates are zero within coverage. Both are evaluated. The one-week public forecast is last week's value. Weather did not improve the predeclared one/two-week comparison. Two- to four-week ridge improvements are exploratory with wide uncertainty, not a validated operational warning.</p>
 <p>Mean absolute error (MAE) is the average error in weekly case counts, from the saved 2018–2023 held-out evaluation. It does not establish accuracy for current conditions.</p>
 <div className="table-scroll" role="region" aria-label="Forecast accuracy from saved evaluation" tabIndex={0}><table><thead><tr><th scope="col">Model</th><th scope="col">Weeks ahead</th><th scope="col">MAE (cases)</th><th scope="col">Evaluated targets</th></tr></thead><tbody>{rows.map(r=><tr key={`${r.model}-${r.horizon}`} data-model={r.model} data-horizon={r.horizon}><th scope="row">{r.model}</th><td>{r.horizon}</td><td data-mae={r.mae??'unavailable'}>{r.mae==null?'Unavailable':r.mae.toFixed(2)}</td><td>{r.n}</td></tr>)}</tbody></table></div></Card>;
}
