import {cachedRequest} from './lib/source-cache.ts';
// A dated cache preserves earlier receipts while allowing delayed weather for new source weeks.
const endIndex=process.argv.indexOf('--end'),end=endIndex>=0?process.argv[endIndex+1]:'2026-10-30';
if(!/^2026-\d{2}-\d{2}$/.test(end??'')||new Date(end+'T00:00:00Z').toISOString().slice(0,10)!==end)throw Error('Use --end with a valid 2026 date.');
const params=new URLSearchParams({latitude:'14.59932236',longitude:'120.98493761',start_date:'2026-01-01',end_date:end,hourly:'temperature_2m,relative_humidity_2m,precipitation',timezone:'Asia/Manila',models:'era5'});
const {provenance}=await cachedRequest(`data/external/expanded-manila-weather-${end}.json`,'https://archive-api.open-meteo.com/v1/archive?'+params,'CC BY 4.0','Open-Meteo / Copernicus C3S / ECMWF ERA5');
console.log(JSON.stringify(provenance));
