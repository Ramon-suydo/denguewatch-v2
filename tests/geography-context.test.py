import unittest,importlib.util,json,pathlib
import numpy as np
from shapely.geometry import Polygon,LineString
spec=importlib.util.spec_from_file_location('context','scripts/geographic-context.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
class GeographyTests(unittest.TestCase):
 def test_metric_buffer_and_monotonicity(self):
  city=Polygon([(0,0),(1000,0),(1000,1000),(0,1000)]);river=LineString([(0,-1000),(0,2000)])
  self.assertAlmostEqual(city.intersection(river.buffer(200)).area/city.area,.2)
  self.assertAlmostEqual(city.intersection(river.buffer(500)).area/city.area,.5)
  self.assertAlmostEqual(city.centroid.distance(river),500)
 def test_spearman_ties_and_reverse_ranks(self):
  a=np.array([1,1,2,3]);self.assertAlmostEqual(module.spearman(a,a),1);self.assertAlmostEqual(module.spearman(a,-a),-1)
  self.assertIsNone(module.spearman(np.array([1,1,1]),np.array([1,2,3])))
 def test_actual_context_has_seventeen_cities_and_bounded_proxies(self):
  data=json.loads(pathlib.Path('data/processed/geographic_context.json').read_text(encoding='utf-8'))
  self.assertEqual(len(data['rows']),17);self.assertEqual(len({r['city'] for r in data['rows']}),17)
  self.assertEqual(sum(r['elevation_sample_n'] for r in data['rows']),2398)
  for r in data['rows']:
   self.assertTrue(0<=r['water_share_200m']<=r['water_share_500m']<=1+1e-9)
   self.assertTrue(0<=r['sample_share_below_5m']<=1);self.assertGreater(r['elevation_sample_n'],2)
   self.assertLess(abs(r['area_km2']/r['geodesic_area_km2']-1),.003)
   self.assertIn('unverified',r['population_status'].lower())
  for r in data['correlations']:
   self.assertEqual(r['n'],17);self.assertTrue(-1<=r['rho']<=1);self.assertTrue(-1<=r['low']<=r['high']<=1)
if __name__=='__main__':unittest.main()
