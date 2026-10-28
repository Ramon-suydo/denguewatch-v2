import {cachedRequest} from './lib/source-cache.ts';
// Explicit historical cutoff keeps this research request reproducible, independent of the host clock.
const params=new URLSearchParams({latitude:'14.59932236',longitude:'120.98493761',start_date:'2026-01-01',end_date:'2026-10-20',hourly:'temperature_2m,relative_humidity_2m,precipitation',timezone:'Asia/Manila',models:'era5'});
const {provenance}=await cachedRequest('data/external/expanded-manila-weather-2026.json','https://archive-api.open-meteo.com/v1/archive?'+params,'CC BY 4.0','Open-Meteo / Copernicus C3S / ECMWF ERA5');
console.log(JSON.stringify(provenance));
