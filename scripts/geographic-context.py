import json,math,sys,hashlib,pathlib
import numpy as np
from shapely.geometry import shape,Point,LineString,Polygon
from shapely.ops import transform,unary_union,polygonize,clip_by_rect
from shapely import make_valid,STRtree
from pyproj import Transformer,Geod
from scipy.stats import rankdata
root=pathlib.Path('.')
def read(name):return json.loads((root/name).read_text(encoding='utf-8-sig'))
def write(name,data):(root/name).write_text(json.dumps(data,allow_nan=False,separators=(',',':'))+'\n',encoding='utf-8')
forward=Transformer.from_crs('EPSG:4326','EPSG:32651',always_xy=True).transform
inverse=Transformer.from_crs('EPSG:32651','EPSG:4326',always_xy=True).transform
pops=read('data/processed/ncr_population.json')
# Use exact existing canonical city labels, never infer a new statistical unit.
def normalize(name):
 key=name.upper().replace('CITY OF ','').replace(' CITY','').replace('\u00d1','N')
 return next(p['city'] for p in pops if p['city'].replace(' CITY','')==key)
features=read('data/geo/ncr-boundaries.geojson')['features']
cities=[{'city':normalize(f['properties']['adm3_name']),'geo':make_valid(shape(f['geometry']))} for f in features]
for city in cities:city['shape']=transform(forward,city['geo'])
def grid():
 points=[]
 for city in cities:
  poly=city['shape'];xmin,ymin,xmax,ymax=poly.bounds
  for x in np.arange(math.floor(xmin/500)*500+250,xmax,500):
   for y in np.arange(math.floor(ymin/500)*500+250,ymax,500):
    if poly.contains(Point(x,y)):
     lon,lat=inverse(x,y);points.append({'city':city['city'],'lat':round(lat,7),'lon':round(lon,7)})
 write('.artifacts/elevation-grid.json',points);print('500m grid:',len(points),'samples,',math.ceil(len(points)/100),'API calls')
def spearman(x,y):
 if len(x)<3 or np.ptp(x)==0 or np.ptp(y)==0:return None
 return float(np.corrcoef(rankdata(x),rankdata(y))[0,1])
def spearman_ci(x,y,seed=20261025):
 rng=np.random.default_rng(seed);draws=[]
 for _ in range(4000):
  ids=rng.integers(0,len(x),len(x));r=spearman(x[ids],y[ids])
  if r is not None:draws.append(r)
 return {'rho':spearman(x,y),'low':float(np.quantile(draws,.025)),'high':float(np.quantile(draws,.975)),'n':len(x)}
def analyze():
 osm=read('data/external/osm-ncr-water.json');water=[];river=[];skipped=0
 bounds=unary_union([c['geo'] for c in cities]).bounds
 bounds=(bounds[0]-.02,bounds[1]-.02,bounds[2]+.02,bounds[3]+.02)
 for el in osm['elements']:
  tags=el.get('tags',{});geom=None
  if tags.get('natural')=='coastline':continue
  if el['type']=='way':
   coords=[(p['lon'],p['lat']) for p in el.get('geometry',[]) if p]
   if len(coords)<2:skipped+=1;continue
   geom=Polygon(coords) if tags.get('natural')=='water' and len(coords)>=4 and coords[0]==coords[-1] else LineString(coords)
  elif el['type']=='relation':
   outer=[];inner=[]
   for member in el.get('members',[]):
    coords=[(p['lon'],p['lat']) for p in member.get('geometry',[]) if p]
    if len(coords)>=2:(inner if member.get('role')=='inner' else outer).append(LineString(coords))
   if outer:
    geom=unary_union(list(polygonize(unary_union(outer))))
    if inner:geom=geom.difference(unary_union(list(polygonize(unary_union(inner)))))
  if geom is None or geom.is_empty:skipped+=1;continue
  geom=make_valid(clip_by_rect(make_valid(geom),*bounds))
  if geom.is_empty:continue
  geom=transform(forward,geom).simplify(1,preserve_topology=True)
  if tags.get('natural')!='coastline':water.append(geom)
  if tags.get('waterway')=='river':river.append(geom)
 if not water or not river:raise ValueError('No usable water or river features')
 print('Projected and clipped water geometries:',len(water),flush=True)
 tree=STRtree(water);rivers=unary_union(river)
 print('Indexed water geometry',flush=True)
 elevations=read('data/processed/elevation_samples.json');ncr=read('data/processed/ncr_weekly.json');rows=[]
 for city in cities:
  poly=city['shape'];name=city['city'];print('City metrics:',name,flush=True);pop=next(p for p in pops if p['city']==name)
  candidates=[water[int(i)].intersection(poly.envelope.buffer(510)) for i in tree.query(poly.envelope.buffer(510))]
  local=unary_union(candidates)
  buffers={m:local.buffer(m,quad_segs=8).simplify(1,preserve_topology=True) for m in [200,500]}
  cases=[r['cases'] for r in ncr if r['city']==name and '2016-01-01'<=r['week_ending']<'2020-01-01']
  samples=[r['elevation'] for r in elevations if r['city']==name and r['elevation'] is not None];total=sum(r['city']==name for r in elevations)
  if len(samples)<3 or len(samples)!=total:raise ValueError('Incomplete elevation coverage for '+name)
  geodesic=abs(Geod(ellps='WGS84').geometry_area_perimeter(city['geo'])[0]);area=poly.area/1e6
  if abs(poly.area-geodesic)/geodesic>.003:raise ValueError('Projection area check failed')
  rows.append({'city':name,'area_km2':area,'geodesic_area_km2':geodesic/1e6,'population_2020':pop['population_2020'],'population_status':pop['status'],'density_per_km2':pop['population_2020']/area,'mean_weekly_incidence_2016_2019':float(np.mean(cases))/pop['population_2020']*1e5,'observed_weeks':len(cases),'water_share_200m':poly.intersection(buffers[200]).area/poly.area,'water_share_500m':poly.intersection(buffers[500]).area/poly.area,'centroid_river_distance_m':poly.centroid.distance(rivers),'sample_mean_elevation_m':float(np.mean(samples)),'sample_share_below_5m':float(np.mean(np.array(samples)<5)),'elevation_sample_n':len(samples)})
 columns=['water_share_200m','water_share_500m','centroid_river_distance_m','sample_mean_elevation_m','sample_share_below_5m','density_per_km2']
 correlations=[]
 for column in columns:
  x=np.array([r[column] for r in rows]);y=np.array([r['mean_weekly_incidence_2016_2019'] for r in rows]);correlations.append({'feature':column,**spearman_ci(x,y)})
 metadata={'label':'Exploratory Metro Manila context, not a prediction','n':17,'period':'2016-2019 recorded weekly incidence with unverified fixed 2020 denominator','water':'OSM contemporary mapped waterways and water bodies, excludes coastline from distance buffers; 200/500m UTM buffers (8 segments/quadrant), 1m geometry simplification and clipped to city geometry; centroid-to-nearest mapped river. Incomplete mapping is not absence of water.','elevation':'USGS SRTM90m via Open Topo Data, bilinear interpolation; systematic 500m grid centers inside polygons; sampled mean and fraction below 5m, NOT complete raster zonal statistics or flood hazard. DSM/vertical errors and coastal/ocean zeros can dominate a 5m cutoff.','area':'UTM 51N polygon area from official HDX/NAMRIA boundary geometry, checked against WGS84 geodesic area within 0.3%; derived area, not a PSA land-area statistic.','vintage':'2025 boundary / 2026 OSM / circa-2000 SRTM / 2020 population versus 2016-2019 disease observations; no historical harmonization.','ci':'4000 iid city bootstrap resamples, seed 20261025; percentile 95% interval; spatial dependence not modeled, very low power, exploratory effect sizes without p-values.','confounding':'Population denominator unverified; density, income, health-seeking behavior, reporting and mapping quality confound these ecological associations. No causal inference.','biology':'Aedes aegypti mainly breeds in small standing-water containers near homes, such as drums, tires and pots; flowing rivers are not the principal breeding habitat. Water proximity, low elevation and flooding are indirect hypotheses only.','omitted':'Official flood hazard omitted: no licensed machine-readable city-comparable hazard layer was verified. No household or barangay-risk overlay.'}
 bundle={'version':2,'historical_only':True,'metadata':metadata,'rows':rows,'correlations':correlations,'source':read('data/processed/osm-water-source.json'),'osm_geometry_skipped':skipped}
 write('data/processed/geographic_context.json',bundle);write('public/api/v2/geography.json',bundle)
 import matplotlib
 matplotlib.use('Agg')
 import matplotlib.pyplot as plt
 fig,axes=plt.subplots(2,3,figsize=(14,8),layout='constrained')
 for ax,column,result in zip(axes.flat,columns,correlations):
  ax.scatter([r[column] for r in rows],[r['mean_weekly_incidence_2016_2019'] for r in rows],color='#244c70')
  manila=next(r for r in rows if r['city']=='MANILA CITY');ax.annotate('Manila',(manila[column],manila['mean_weekly_incidence_2016_2019']),fontsize=8,xytext=(5,5),textcoords='offset points')
  labels={'water_share_200m':'Share within 200m of mapped water (0-1)','water_share_500m':'Share within 500m of mapped water (0-1)','centroid_river_distance_m':'Centroid to mapped river (m)','sample_mean_elevation_m':'Sample mean elevation (m)','sample_share_below_5m':'Sample fraction below 5m (0-1)','density_per_km2':'Population / km2 (unverified)'}
  ax.set_xlabel(labels[column],fontsize=9);ax.set_ylabel('Mean recorded weekly cases / 100k',fontsize=8);ax.set_title(f"rho {result['rho']:.2f}; 95% CI {result['low']:.2f} to {result['high']:.2f}",fontsize=10)
 fig.suptitle('Exploratory ecological context, n=17; 2016-2019; population unverified; no causation')
 fig.savefig('docs/figures/geographic-context.png',dpi=150);plt.close(fig)
 print(json.dumps({'cities':len(rows),'correlations':correlations,'skipped_osm':skipped},indent=2))
if __name__=='__main__':
 if '--grid' in sys.argv:grid()
 else:analyze()
