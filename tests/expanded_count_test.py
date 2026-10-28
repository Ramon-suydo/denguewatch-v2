"""Leakage and source semantics for the separate Manila count experiment."""
import copy
import sys
import unittest
from unittest.mock import patch, MagicMock
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]/'ml'))
from manila_count import BASE, WEATHER, REGIONAL, GEO, examples, features, fit, radius, shift, source_data


class ExpandedCountTests(unittest.TestCase):
    def setUp(self):
        self.origin = '2020-06-28'
        self.series = {shift(self.origin, -n): {'cases': 20+n, 'estimated': False, 'source': 'daily'} for n in range(12)}
        self.weather = {shift(self.origin, -n): {'rainfall_mm': n*10, 'temperature_c': 27,
                        'humidity_percent': 80, 'temperature_min_c': 24, 'temperature_max_c': 31,
                        'rain_days': 3} for n in range(12)}

    def test_future_cases_and_unavailable_weather_do_not_change_inputs(self):
        before = features(self.series, self.weather, [], {}, self.origin, 2)
        later = copy.deepcopy(self.series)
        later[shift(self.origin, 1)] = {'cases': 9000, 'estimated': False, 'source': 'daily'}
        weather = copy.deepcopy(self.weather)
        weather[self.origin]['rainfall_mm'] = 90000
        weather[shift(self.origin, 1)] = weather[self.origin]
        after = features(later, weather, [], {}, self.origin, 2)
        for key in before:
            np.testing.assert_equal(before[key], after[key])
        self.assertEqual(after['rainfall_mm_lag_1'], 10)

    def test_missing_week_is_not_a_shifted_row_or_zero(self):
        del self.series[shift(self.origin, -1)]
        x = features(self.series, self.weather, [], {}, self.origin, 1)
        self.assertTrue(np.isnan(x['log_cases_1']))
        self.assertEqual(x['available_history_8'], 7)
        self.assertFalse(any(r['origin'] == shift(self.origin, -2) for r in examples(self.series, self.weather, [], {}, 1)))

    def test_monthly_context_respects_release_assumption_and_expiry(self):
        month = {'available': shift(self.origin, days=1), 'manila': 200, 'rest': 1000}
        x = features(self.series, self.weather, [month], {}, self.origin, 1)
        self.assertEqual(x['monthly_context_available'], 0)
        month['available'] = shift(self.origin, days=-46)
        self.assertEqual(features(self.series, self.weather, [month], {}, self.origin, 1)['monthly_context_available'], 0)
        month['available'] = self.origin
        self.assertAlmostEqual(features(self.series, self.weather, [month], {}, self.origin, 1)['log_own_prior_complete_month'], np.log1p(200))

    def test_no_pair_crosses_long_historical_gap(self):
        self.series['2026-10-25'] = {'cases': 226, 'estimated': False, 'source': 'unverified_2026'}
        self.assertFalse(any(r['target'] == '2026-10-25' for r in examples(self.series, self.weather, [], {}, 1)))

    def test_all_declared_feature_names_are_generated(self):
        x = features(self.series, self.weather, [], {}, self.origin, 1)
        self.assertEqual(set(x), set(BASE+WEATHER+REGIONAL))

    def test_estimated_targets_need_explicit_opt_in(self):
        rows = examples(self.series, self.weather, [], {}, 1)
        rows[0]['estimated'] = True
        rows[0]['recent'] = True
        with self.assertRaises(ValueError):
            fit('ridge_cases', rows)
        self.assertIsNotNone(fit('ridge_cases', rows, use_estimates=True))

    def test_finite_sample_radius_requires_support(self):
        self.assertIsNone(radius(list(range(19))))
        self.assertEqual(radius(list(range(1, 21))), 17)

    def test_pooled_targets_after_training_cutoff_are_excluded(self):
        rows = examples(self.series, self.weather, [], {}, 1)
        for r in rows:
            r['x'].update({key: 1 for key in GEO})
        pool = [copy.deepcopy(rows[0]), copy.deepcopy(rows[0])]
        pool[0]['target'] = '2019-01-06'
        pool[1]['target'] = '2026-10-25'
        spy = MagicMock()
        spy.steps = [('regressor', None)]
        with patch('manila_count.estimator', return_value=spy):
            fit('rf_pooled_geo', rows, pool=pool)
        self.assertEqual(len(spy.fit.call_args.args[0]), len(rows)+1)

    def test_recent_weights_are_explicit_and_preserve_historical_weight(self):
        rows = examples(self.series, self.weather, [], {}, 1)[:3]
        rows[1]['recent'] = True
        rows[2]['recent'] = True
        rows[2]['estimated'] = True
        spy = MagicMock()
        spy.steps = [('regressor', None)]
        with patch('manila_count.estimator', return_value=spy):
            fit('ridge_cases', rows, use_estimates=True)
        np.testing.assert_equal(spy.fit.call_args.kwargs['regressor__sample_weight'], [1, .5, .15])

    def test_real_raw_reconciliation_and_no_duplicated_targets(self):
        historical, recent, _, _, audit = source_data()
        self.assertEqual(len(audit['raw_files']), 5)
        self.assertEqual(len(historical), 312)
        self.assertEqual(len(recent), 13)
        self.assertEqual(audit['derived_weekly_rows'], 308)
        self.assertEqual(audit['monthly_rows'], 1037)
        self.assertFalse(set(historical) & set(recent))
        self.assertFalse(audit['geography_in_model']['single_city'])
        self.assertTrue(audit['geography_in_model']['pooled_transfer'])


if __name__ == '__main__':
    unittest.main()
