import type {Evidence} from '../lib/evidence';
export const ncrDistricts=[
 {name:'Eastern Manila District',cities:['QUEZON CITY','PASIG CITY','MARIKINA CITY','MANDALUYONG CITY','SAN JUAN CITY']},
 {name:'CAMANAVA District',cities:['CALOOCAN CITY','MALABON CITY','NAVOTAS CITY','VALENZUELA CITY']},
 {name:'Southern Manila District',cities:['LAS PINAS CITY','MAKATI CITY','MUNTINLUPA CITY','PARANAQUE CITY','PASAY CITY','PATEROS','TAGUIG CITY']},
];
export function manilaOutlook(data:Evidence,weeks=26){
 const snapshot=data.snapshots.find(row=>row.scenario==='M');
 const forecast=snapshot?.forecasts.find(row=>row.horizon===1);
 if(!snapshot||!forecast)return null;
 const history=data.series.M.filter(row=>row.week_ending<=snapshot.as_of).slice(-weeks);
 return {snapshot,forecast,history,last:history.at(-1)};
}
