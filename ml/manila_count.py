"""Independent, source-aware Manila count experiments. Never rewrites legacy artifacts."""
from __future__ import annotations

import argparse
import calendar
import csv
import datetime as dt
import hashlib
import json
import math
import os
import sys
import xml.etree.ElementTree as ET
import zipfile
from collections import defaultdict
from pathlib import Path

os.environ.setdefault('OMP_NUM_THREADS', '1')
os.environ.setdefault('OPENBLAS_NUM_THREADS', '1')
import numpy as np
from sklearn import __version__ as sklearn_version
from sklearn.ensemble import HistGradientBoostingRegressor, RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.linear_model import Ridge
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

ROOT = Path(__file__).resolve().parents[1]
SEED = 20261028
VERSION = 'manila-count-expanded-v1'
BASE = ['log_cases_0', 'log_cases_1', 'log_cases_2', 'log_cases_3', 'log_cases_4', 'log_cases_7',
        'log_mean_4', 'log_mean_8', 'available_history_8', 'log_growth_1',
        'target_annual_sin', 'target_annual_cos', 'target_rainy_Jun_Nov', 'origin_estimated']
WEATHER = [f'{v}_lag_{lag}' for lag in (1, 2, 4, 8)
           for v in ('rainfall_mm', 'temperature_c', 'humidity_percent')]
WEATHER += ['rain_total_4_delayed', 'rain_total_8_delayed', 'rain_days_lag_1',
            'temperature_min_lag_1', 'temperature_max_lag_1', 'rain_x_humidity_delayed']
REGIONAL = ['log_own_prior_complete_month', 'log_rest_ncr_prior_complete_month',
            'monthly_context_available', 'daily_peak_share_at_origin']
GEO = ['water_share_200m', 'water_share_500m', 'log_river_distance_m',
       'sample_mean_elevation_m', 'sample_share_below_5m', 'log_density_per_km2']
CANDIDATES = ['persistence', 'ridge_cases', 'rf_cases', 'ridge_weather',
              'rf_weather', 'boost_weather', 'ridge_all', 'rf_all', 'boost_all',
              'rf_pooled', 'rf_pooled_geo', 'rf_pooled_weather_geo']


def read_json(path):
    return json.loads(Path(path).read_text(encoding='utf-8-sig'))


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def shift(day, weeks=0, days=0):
    return (dt.date.fromisoformat(day) + dt.timedelta(weeks=weeks, days=days)).isoformat()


def week_end(day):
    d = dt.date.fromisoformat(day)
    return (d + dt.timedelta(days=6-d.weekday())).isoformat()


def whole(value):
    x = float(value)
    if not math.isfinite(x) or x < 0 or x != int(x):
        raise ValueError('Expected a nonnegative whole count')
    return int(x)


def raw_csv(path):
    with Path(path).open(encoding='utf-8-sig', newline='') as f:
        return list(csv.DictReader(f))


def daily_workbook(path):
    """Read original OOXML numeric cells without modifying the workbook."""
    ns = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    with zipfile.ZipFile(path) as z:
        workbook = ET.fromstring(z.read('xl/workbook.xml'))
        sheet = next(s for s in workbook.findall('m:sheets/m:sheet', ns) if s.attrib['name'] == 'Sheet4')
        relation = sheet.attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id']
        relationships = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
        target = next(r.attrib['Target'] for r in relationships if r.attrib['Id'] == relation)
        target = target.lstrip('/') if target.startswith('/') else 'xl/' + target
        tree = ET.fromstring(z.read(target))
        result = {}
        for row in tree.findall('m:sheetData/m:row', ns):
            cells = {''.join(filter(str.isalpha, c.attrib['r'])): c for c in row}
            for date_col, case_col in [('A', 'B'), ('D', 'E'), ('G', 'H'), ('J', 'K'), ('M', 'N'), ('P', 'Q')]:
                cell, count = cells.get(date_col), cells.get(case_col)
                if cell is None or count is None or cell.attrib.get('t') in ('s', 'inlineStr'):
                    continue
                serial, value = cell.findtext('m:v', namespaces=ns), count.findtext('m:v', namespaces=ns)
                if serial is None or value is None:
                    continue
                day = (dt.date(1899, 12, 30) + dt.timedelta(days=float(serial))).isoformat()
                if not '2018-01-01' <= day <= '2023-12-02' or day in result:
                    raise ValueError('Unexpected or duplicate workbook date')
                result[day] = whole(value)
    if len(result) != 1910:
        raise ValueError('Daily coverage changed; re-audit before fitting')
    return result


def source_data(root=ROOT):
    raw = root / 'data/raw'
    files = sorted(p for p in raw.iterdir() if p.suffix.lower() in ('.csv', '.xlsx'))
    expected = {'doh-epi-dengue-data-2016-2021.csv', 'Manila_Dengue_Weekly_Clean_2026.csv',
                'Manila_weekly_MHD_2018_2023.csv', 'ncr_dengue_monthly_with_rates.csv',
                'Daily_Reported_Cases_of_Dengue_in_the_City_of_Manila_from_2018_to_2023.xlsx'}
    if {p.name for p in files} != expected:
        raise ValueError('Raw inventory changed: explicitly review each new/removed source')
    manifest = [{'file': p.name, 'sha256': digest(p)} for p in files]
    daily = daily_workbook(next(p for p in files if p.suffix == '.xlsx'))
    by_week = defaultdict(dict)
    for day, count in daily.items():
        by_week[week_end(day)][day] = count
    historical, daily_peak = {}, {}
    weekly = raw_csv(raw/'Manila_weekly_MHD_2018_2023.csv')
    for r in weekly:
        d = r['week_ending']
        days = by_week.get(d, {})
        if r['week_start'] != shift(d, days=-6) or int(r['days_reported']) != len(days):
            raise ValueError('Weekly/daily coverage mismatch')
        count = None if r['cases_reported'] == '' else whole(r['cases_reported'])
        if count != (sum(days.values()) if days else None):
            raise ValueError('Derived weekly source disagrees with workbook')
        if (r['complete_week'] == 'True') != (len(days) == 7):
            raise ValueError('Unexpected weekly completeness flag')
    for d, days in by_week.items():
        if len(days) == 7:
            historical[d] = {'cases': sum(days.values()), 'estimated': False, 'source': 'daily'}
            daily_peak[d] = max(days.values())/max(sum(days.values()), 1)
    doh, monthly_groups, weeks_by_month = [], defaultdict(int), defaultdict(set)
    for r in raw_csv(raw/'doh-epi-dengue-data-2016-2021.csv'):
        if r['Region'] != 'NATIONAL CAPITAL REGION':
            continue
        d = dt.datetime.strptime(r['date'], '%m/%d/%Y').date().isoformat()
        cases = whole(r['cases'])
        if dt.date.fromisoformat(d).weekday() != 6:
            raise ValueError('Unexpected weekly source date semantics')
        doh.append({'city': r['loc'], 'date': d, 'cases': cases})
        monthly_groups[(r['loc'], d[:7])] += cases
        weeks_by_month[(r['loc'], d[:7])].add(d)
        if r['loc'] == 'MANILA CITY' and d < '2018-01-01' and (not r['deaths'] or whole(r['deaths']) <= cases):
            historical[d] = {'cases': cases, 'estimated': False, 'source': 'doh'}
    # Compare independently reconstructed primary series with the existing audited M definition.
    prior = read_json(root/'data/processed/manila_weekly.json')['scenarios']['M']
    expected_history = {r['week_ending']: r['cases'] for r in prior if r['reliable'] and r['cases'] is not None}
    if {d: r['cases'] for d, r in historical.items()} != expected_history:
        raise ValueError('Raw reconstruction differs from audited Scenario M')
    monthly = raw_csv(raw/'ncr_dengue_monthly_with_rates.csv')
    complete_months = defaultdict(dict)
    for r in monthly:
        month = f"{int(r['year']):04}-{int(r['month']):02}"
        key = (r['city'], month)
        if whole(r['cases']) != monthly_groups[key] or int(r['weeks_reported']) != len(weeks_by_month[key]):
            raise ValueError('Monthly representation does not reconcile to weekly source')
        pop = whole(r['population_2020'])
        if abs(float(r['incidence_per_100k']) - whole(r['cases'])/pop*100000) > .011:
            raise ValueError('Monthly rate arithmetic mismatch')
        year, m = map(int, month.split('-'))
        end = dt.date(year, m, calendar.monthrange(year, m)[1])
        expected_sundays = {dt.date(year, m, day).isoformat() for day in range(1, end.day+1)
                            if dt.date(year, m, day).weekday() == 6}
        if weeks_by_month[key] == expected_sundays:
            complete_months[month][r['city']] = whole(r['cases'])
    monthly_context = []
    for month, cities in sorted(complete_months.items()):
        if len(cities) != 17:
            continue
        year, m = map(int, month.split('-'))
        end = dt.date(year, m, calendar.monthrange(year, m)[1]).isoformat()
        monthly_context.append({'month': month, 'available': shift(end, days=45),
                                'manila': cities['MANILA CITY'], 'rest': sum(cities.values())-cities['MANILA CITY']})
    recent = {}
    previous = None
    for r in raw_csv(raw/'Manila_Dengue_Weekly_Clean_2026.csv'):
        d = r['week_end']
        if dt.date.fromisoformat(d).weekday() != 6 or r['week_start'] != shift(d, days=-6) or r['report_monday'] != shift(d, days=1):
            raise ValueError('Invalid recent week boundaries')
        if r['weekly_is_estimate'] not in ('0', '1', 'False', 'True', 'false', 'true'):
            raise ValueError('Explicit recent estimate flag required')
        estimated = r['weekly_is_estimate'].lower() in ('1', 'true')
        total, cases = whole(r['total_since_jan1']), whole(r['weekly_new_cases'])
        if previous and (d != shift(previous[0], 1) or total-previous[1] != cases):
            raise ValueError('Recent gap or cumulative difference mismatch')
        if d in historical or d in recent:
            raise ValueError('Overlapping independent target sources')
        recent[d] = {'cases': cases, 'estimated': estimated, 'source': 'unverified_2026'}
        previous = (d, total)
    geo = next(r for r in read_json(root/'data/processed/geographic_context.json')['rows'] if r['city'] == 'MANILA CITY')
    # No outcome-derived incidence enters geographic context or predictors.
    geography = {k: geo[k] for k in ('water_share_200m', 'water_share_500m', 'centroid_river_distance_m',
                                    'sample_mean_elevation_m', 'sample_share_below_5m', 'density_per_km2')}
    audit = {'raw_files': manifest, 'daily_rows': len(daily), 'derived_weekly_rows': len(weekly),
             'monthly_rows': len(monthly), 'ncr_weekly_rows': len(doh), 'historical_complete_weeks': len(historical),
             'recent_weeks': len(recent), 'recent_estimated_weeks': sum(r['estimated'] for r in recent.values()),
             'roles': {'daily': 'primary post-2018 targets and past daily shape',
                       'weekly_manila': 'exact duplicate reconciliation; never duplicated training targets',
                       'weekly_doh': 'pre-2018 Manila targets and monthly reconciliation',
                       'monthly_ncr': 'delayed complete-month predictor; not duplicate targets or current-month totals',
                       'recent_2026': 'separate weighted experimental refit and unverified prequential check'},
             'geography': geography, 'geography_in_model': {'single_city': False, 'pooled_transfer': True},
             'geography_reason': 'Constant within one city. Separate pooled-city exploratory models test spatial variation; contemporary proxies have unharmonized vintages.'}
    return historical, recent, monthly_context, daily_peak, audit


def geography_features(geo):
    return {'water_share_200m': geo['water_share_200m'], 'water_share_500m': geo['water_share_500m'],
            'log_river_distance_m': math.log1p(geo['centroid_river_distance_m']),
            'sample_mean_elevation_m': geo['sample_mean_elevation_m'],
            'sample_share_below_5m': geo['sample_share_below_5m'],
            'log_density_per_km2': math.log1p(geo['density_per_km2'])}


def transfer_data(weather, monthly, root=ROOT):
    """Other cities supply extra training only. Manila targets remain the canonical source."""
    geo = {r['city']: geography_features(r) for r in read_json(root/'data/processed/geographic_context.json')['rows']}
    cities = defaultdict(dict)
    for r in raw_csv(root/'data/raw/doh-epi-dengue-data-2016-2021.csv'):
        if r['Region'] != 'NATIONAL CAPITAL REGION' or r['loc'] == 'MANILA CITY':
            continue
        d = dt.datetime.strptime(r['date'], '%m/%d/%Y').date().isoformat()
        cases = whole(r['cases'])
        if d > '2020-12-27' or not r['deaths'] or whole(r['deaths']) > cases:
            continue
        cities[r['loc']][d] = {'cases': cases, 'estimated': False, 'source': 'doh'}
    pooled = {}
    for h in (1, 2):
        rows = []
        for city, series in sorted(cities.items()):
            for r in examples(series, weather, monthly, {}, h):
                r['x'].update(geo[city])
                r['city'] = city
                rows.append(r)
        pooled[h] = rows
    return pooled, geo['MANILA CITY']


def weather_data(root=ROOT):
    """Validate raw provider receipts and aggregate complete civil weeks, retaining gaps."""
    files = [root/f'data/external/era5-manila-{y}.json' for y in range(2015, 2024)]
    optional = root/'data/external/expanded-manila-weather-2026.json'
    if optional.exists():
        files.append(optional)
    grouped, sources, seen = defaultdict(list), [], set()
    for path in files:
        receipt = read_json(str(path)+'.provenance.json')
        if digest(path) != receipt['sha256'] or not receipt['url'].startswith('https://archive-api.open-meteo.com/v1/archive?'):
            raise ValueError('Weather provenance mismatch')
        data = read_json(path)
        if data['timezone'] != 'Asia/Manila' or data['utc_offset_seconds'] != 28800:
            raise ValueError('Weather timezone mismatch')
        hourly = data['hourly']
        times = hourly['time']
        if any(len(hourly[v]) != len(times) for v in ('precipitation', 'temperature_2m', 'relative_humidity_2m')):
            raise ValueError('Weather array length mismatch')
        last = None
        for i, time in enumerate(times):
            current = dt.datetime.fromisoformat(time)
            if time in seen or (last and current-last != dt.timedelta(hours=1)):
                raise ValueError('Weather duplicate or hourly gap')
            seen.add(time)
            last = current
            p, t, h = (hourly[v][i] for v in ('precipitation', 'temperature_2m', 'relative_humidity_2m'))
            if any(x is None or not math.isfinite(x) for x in (p, t, h)) or p < 0 or not -40 <= t <= 60 or not 0 <= h <= 100:
                raise ValueError('Invalid weather values')
            grouped[week_end(time[:10])].append((time[:10], p, t, h))
        sources.append({'file': path.name, **receipt})
    weeks = {}
    for d, hours in grouped.items():
        if len(hours) != 168 or len({r[0] for r in hours}) != 7:
            continue
        days = defaultdict(float)
        for day, p, _, _ in hours:
            days[day] += p
        weeks[d] = {'rainfall_mm': sum(r[1] for r in hours), 'temperature_c': float(np.mean([r[2] for r in hours])),
                    'humidity_percent': float(np.mean([r[3] for r in hours])), 'temperature_min_c': min(r[2] for r in hours),
                    'temperature_max_c': max(r[2] for r in hours), 'rain_days': sum(p >= 1 for p in days.values())}
    return weeks, sources


def features(series, weather, monthly, daily_peak, origin, horizon):
    """All lookups are calendar-aligned and bounded by origin (weather <= origin-7d)."""
    current = series[origin]['cases']
    target = dt.date.fromisoformat(shift(origin, horizon))
    angle = 2*math.pi*(target.timetuple().tm_yday-1)/365.2425
    lag = lambda n: series.get(shift(origin, -n), {}).get('cases', np.nan)
    history = np.array([lag(n) for n in range(8)], dtype=float)
    finite = history[np.isfinite(history)]
    result = {f'log_cases_{n}': float(np.log1p(lag(n))) for n in (0, 1, 2, 3, 4, 7)}
    for n in (4, 8):
        values = history[:n][np.isfinite(history[:n])]
        result[f'log_mean_{n}'] = float(np.log1p(np.mean(values))) if len(values) else np.nan
    result.update(available_history_8=len(finite), log_growth_1=float(np.log1p(current)-np.log1p(lag(1))),
                  target_annual_sin=math.sin(angle), target_annual_cos=math.cos(angle),
                  target_rainy_Jun_Nov=float(6 <= target.month <= 11), origin_estimated=float(series[origin]['estimated']))
    for n in (1, 2, 4, 8):
        w = weather.get(shift(origin, -n), {})
        for v in ('rainfall_mm', 'temperature_c', 'humidity_percent'):
            result[f'{v}_lag_{n}'] = w.get(v, np.nan)
    for n in (4, 8):
        values = [weather.get(shift(origin, -k), {}).get('rainfall_mm', np.nan) for k in range(1, n+1)]
        result[f'rain_total_{n}_delayed'] = sum(values)
    w = weather.get(shift(origin, -1), {})
    for key in ('rain_days', 'temperature_min_c', 'temperature_max_c'):
        result[key.replace('_c', '')+'_lag_1'] = w.get(key, np.nan)
    result['rain_x_humidity_delayed'] = w.get('rainfall_mm', np.nan)*w.get('humidity_percent', np.nan)/100
    available = [r for r in monthly if r['available'] <= origin and (dt.date.fromisoformat(origin)-dt.date.fromisoformat(r['available'])).days <= 45]
    last = available[-1] if available else None
    result.update(log_own_prior_complete_month=np.log1p(last['manila']) if last else np.nan,
                  log_rest_ncr_prior_complete_month=np.log1p(last['rest']) if last else np.nan,
                  monthly_context_available=float(last is not None), daily_peak_share_at_origin=daily_peak.get(origin, np.nan))
    return result


def examples(series, weather, monthly, daily_peak, horizon):
    rows = []
    for origin, r in sorted(series.items()):
        target = shift(origin, horizon)
        actual = series.get(target)
        if not actual or actual['source'] == 'unverified_2026' and r['source'] != 'unverified_2026':
            continue
        # Do not create a training pair crossing the long source gap.
        if r['source'] == 'unverified_2026' and actual['source'] != 'unverified_2026':
            continue
        rows.append({'origin': origin, 'target': target, 'current': r['cases'], 'actual': actual['cases'],
                     'estimated': actual['estimated'], 'recent': actual['source'] == 'unverified_2026',
                     'x': features(series, weather, monthly, daily_peak, origin, horizon)})
    return rows


def columns(name):
    return BASE + (WEATHER if 'weather' in name or name.endswith('all') else []) + (REGIONAL if name.endswith('all') else []) + (GEO if name.endswith('_geo') else [])


def estimator(name):
    if name.startswith('ridge'):
        core = Ridge(alpha=20)
    elif name.startswith('rf'):
        core = RandomForestRegressor(n_estimators=160, max_depth=5, min_samples_leaf=8,
                                     max_features=.8, random_state=SEED, n_jobs=1)
    else:
        core = HistGradientBoostingRegressor(max_iter=80, max_leaf_nodes=7, min_samples_leaf=15,
                                            l2_regularization=20, learning_rate=.04, random_state=SEED)
    return make_pipeline(SimpleImputer(strategy='median', add_indicator=True, keep_empty_features=True), StandardScaler(), core)


def matrix(rows, names):
    return np.array([[r['x'][n] for n in names] for r in rows], dtype=float)


def fit(name, rows, use_estimates=False, pool=None):
    if name == 'persistence':
        return None
    if 'pooled' in name:
        cutoff = max(r['target'] for r in rows)
        rows = rows+[r for r in (pool or []) if r['target'] <= cutoff]
    model = estimator(name)
    y = np.array([math.log1p(r['actual'])-math.log1p(r['current']) for r in rows])
    weights = np.array([(.15 if r['estimated'] else .5) if r['recent'] else 1 for r in rows])
    if not use_estimates and any(r['estimated'] for r in rows):
        raise ValueError('Estimated targets require explicit experimental opt-in')
    model.fit(matrix(rows, columns(name)), y, **{model.steps[-1][0]+'__sample_weight': weights})
    return model


def predict(name, model, rows):
    if name == 'persistence':
        return np.array([r['current'] for r in rows], dtype=float)
    correction = model.predict(matrix(rows, columns(name)))
    return np.maximum(0, np.expm1(np.log1p([r['current'] for r in rows])+correction))


def scores(rows, predicted):
    errors = np.array([r['actual'] for r in rows])-predicted
    baseline = np.array([abs(r['actual']-r['current']) for r in rows])
    mae = float(np.mean(abs(errors)))
    b = float(baseline.mean())
    return {'n': len(rows), 'mae': mae, 'rmse': float(np.sqrt(np.mean(errors**2))),
            'skill_percent': 100*(1-mae/b) if b else None}


def block_skill(rows, predicted, draws=1000):
    # Same sampled target-week indices for model and persistence; observed blocks may span gaps.
    rng = np.random.default_rng(SEED)
    errors = np.abs(np.array([r['actual'] for r in rows])-predicted)
    base = np.array([abs(r['actual']-r['current']) for r in rows])
    values = []
    for _ in range(draws):
        starts = rng.integers(0, len(rows), math.ceil(len(rows)/4))
        indices = np.array([(s+k) % len(rows) for s in starts for k in range(4)])[:len(rows)]
        denominator = base[indices].mean()
        if denominator:
            values.append(100*(1-errors[indices].mean()/denominator))
    return [float(x) for x in np.quantile(values, [.025, .975])]


def radius(residuals):
    if len(residuals) < 20:
        return None
    values = sorted(abs(x) for x in residuals)
    return values[min(len(values)-1, math.ceil((len(values)+1)*.8)-1)]


def yearly_audit(rows, pool):
    """Select inside each past-only fold; never choose a model using that year's outcomes."""
    result = []
    for year in range(2018, 2024):
        test = [r for r in rows if r['target'].startswith(str(year))]
        validation = [r for r in rows if r['target'].startswith(str(year-1))]
        if len(test) < 10 or len(validation) < 10:
            result.append({'year': year, 'skipped': True, 'n': len(test), 'validation_n': len(validation),
                           'reason': 'Fewer than 10 eligible test or preceding validation pairs; no forecast accuracy assigned.'})
            continue
        training = [r for r in rows if r['target'] < f'{year-1}-01-01' and r['target'] <= min(x['origin'] for x in validation)]
        development = [r for r in rows if r['target'] <= min(x['origin'] for x in test)]
        if len(training) < 32:
            result.append({'year': year, 'skipped': True, 'n': len(test), 'validation_n': len(validation),
                           'reason': 'Fewer than 32 earlier training pairs; no forecast accuracy assigned.'})
            continue
        candidates = []
        for name in CANDIDATES:
            p = predict(name, fit(name, training, pool=pool), validation)
            candidates.append({'model': name, **scores(validation, p)})
        best = min(candidates, key=lambda r: r['mae'])
        selected = best['model'] if best['skill_percent'] is not None and best['skill_percent'] >= 5 else 'persistence'
        p = predict(selected, fit(selected, development, pool=pool), test)
        result.append({'year': year, 'training_n': len(training), 'validation_n': len(validation),
                       'selected': selected, **scores(test, p), 'skill_95': block_skill(test, p),
                       'persistence_mae': scores(test, predict('persistence', None, test))['mae']})
    return result


def evaluate(historical, recent, weather, monthly, daily_peak, horizon, pool, manila_geo):
    rows = examples(historical, weather, monthly, daily_peak, horizon)
    for r in rows:
        r['x'].update(manila_geo)
    training = [r for r in rows if r['target'] < '2021-01-01']
    validation = [r for r in rows if '2021-01-01' <= r['target'] < '2023-01-01']
    testing = [r for r in rows if r['target'] >= '2023-01-01']
    # At h=2 remove the overlapping first validation origin from training, rather than leak a target.
    training = [r for r in training if r['target'] <= min(r['origin'] for r in validation)]
    assert max(r['target'] for r in training) <= min(r['origin'] for r in validation)
    development = [r for r in rows if r['target'] <= min(r['origin'] for r in testing)]
    comparisons = []
    for name in CANDIDATES:
        model = fit(name, training, pool=pool)
        pv = predict(name, model, validation)
        comparisons.append({'model': name, **scores(validation, pv)})
    chosen = min(comparisons, key=lambda r: r['mae'])['model']
    # Require 5% validation improvement to depart from persistence; no test tuning.
    winner = next(r for r in comparisons if r['model'] == chosen)
    selected = chosen if winner['skill_percent'] is not None and winner['skill_percent'] >= 5 else 'persistence'
    report = []
    test_predictions = {}
    for name in CANDIDATES:
        model = fit(name, development, pool=pool)
        p = predict(name, model, testing)
        test_predictions[name] = p
        report.append({'model': name, **scores(testing, p), 'skill_95': block_skill(testing, p)})
    pv = predict(selected, fit(selected, training, pool=pool), validation)
    residuals = [r['actual']-float(p) for r, p in zip(validation, pv)]
    rad = radius(residuals)
    pt = test_predictions[selected]
    coverage = float(np.mean([max(0, p-rad) <= r['actual'] <= p+rad for r, p in zip(testing, pt)])) if rad is not None else None
    # Final historical refit and explicitly separate source/estimate-weighted refit.
    merged = {**historical, **recent}
    all_rows = examples(merged, weather, monthly, daily_peak, horizon)
    for r in all_rows:
        r['x'].update(manila_geo)
    recent_rows = [r for r in all_rows if r['recent']]
    origin = max(recent)
    forecast_row = {'current': recent[origin]['cases'], 'x': features(merged, weather, monthly, daily_peak, origin, horizon)}
    forecast_row['x'].update(manila_geo)
    historical_fit = fit(selected, rows, pool=pool)
    observed_fit = fit(selected, rows+[r for r in recent_rows if not r['estimated']], pool=pool)
    weighted_fit = fit(selected, rows+recent_rows, use_estimates=True, pool=pool)
    estimates = {'historical_only': float(predict(selected, historical_fit, [forecast_row])[0]),
                 'recent_not_estimated_refit': float(predict(selected, observed_fit, [forecast_row])[0]),
                 'recent_estimate_weighted_refit': float(predict(selected, weighted_fit, [forecast_row])[0])}
    primary = next(r for r in report if r['model'] == selected)
    transfer = []
    for r in recent_rows:
        if r['estimated']:
            continue
        past = [x for x in all_rows if x['target'] <= r['origin']]
        p = float(predict(selected, fit(selected, past, use_estimates=True, pool=pool), [r])[0])
        transfer.append({'origin': r['origin'], 'target': r['target'], 'actual_unverified': r['actual'],
                         'predicted': p, 'persistence': r['current']})
    return {'horizon': horizon, 'split': {'training': len(training), 'validation_2021_2022': len(validation),
                                         'test_2023': len(testing), 'final_historical_pairs': len(rows)},
            'selected_by_validation': selected, 'validation': comparisons, 'test': report,
            'selected_test_range_coverage': coverage, 'calibration_n': len(residuals), 'historical_residual_radius': rad,
            'promotion_eligible': selected != 'persistence' and primary['skill_95'][0] > 0,
            'forecast': {'origin': origin, 'target': shift(origin, horizon), 'persistence': recent[origin]['cases'],
                         'model': selected, 'predicted': estimates['recent_estimate_weighted_refit'],
                         'historical_residual_range': [max(0, estimates['recent_estimate_weighted_refit']-rad),
                                                       estimates['recent_estimate_weighted_refit']+rad] if rad is not None else None,
                         'source_sensitivity': estimates, 'recent_training_pairs': len(recent_rows),
                         'recent_estimated_training_pairs': sum(r['estimated'] for r in recent_rows),
                         'weather_complete': all(math.isfinite(forecast_row['x'][n]) for n in WEATHER)},
            'unverified_2026_prequential': transfer, 'nested_yearly_audit': yearly_audit(rows, pool),
            'pooled_other_city_pairs_available': len(pool),
            'test_records': [{'origin': r['origin'], 'target': r['target'], 'actual': r['actual'],
                              'predicted': float(p), 'persistence': r['current']} for r, p in zip(testing, pt)]}


def run():
    historical, recent, monthly, daily_peak, audit = source_data()
    weather, weather_sources = weather_data()
    pools, manila_geo = transfer_data(weather, monthly)
    output = {'version': VERSION, 'seed': SEED, 'target': 'Manila weekly case count',
              'runtime': {'python': sys.version.split()[0], 'numpy': np.__version__, 'scikit_learn': sklearn_version},
              'context_sha256': {name: digest(ROOT/'data/processed'/name) for name in ('geographic_context.json', 'manila_weekly.json')},
              'parameters': {'ridge': {'alpha': 20},
                             'forest': {'trees': 160, 'max_depth': 5, 'min_samples_leaf': 8, 'max_features': .8},
                             'boost': {'max_iter': 80, 'max_leaf_nodes': 7, 'min_samples_leaf': 15, 'l2_regularization': 20, 'learning_rate': .04}},
              'source_verified': False, 'latest_week_end': max(recent), 'source_audit': audit,
              'recent_input': [{'week_end': d, 'cases': r['cases'], 'estimated': r['estimated']} for d, r in sorted(recent.items())],
              'weather_sources': weather_sources, 'feature_groups': {'case_season': BASE, 'weather': WEATHER, 'source_context': REGIONAL, 'pooled_geography': GEO},
              'protocol': {'selection': 'Fixed candidates; training before 2021, validation 2021-2022, untouched 2023 audit. >=5% validation MAE improvement required.',
                           'weather': 'ERA5 complete civil weeks at least 7 days before origin; final reanalysis, not operational vintages.',
                           'monthly': 'Complete source-label months; assumed available 45 days after month-end, expire 45 days later. No partial/current-month leakage.',
                           'estimates': 'No 2026 rows in historical validation/test. Final experimental weights: historical=1, unverified not-estimated=.5, estimated=.15.',
                           'ranges': 'Historical validation absolute residuals; nominal 80%, no 2026 calibration guarantee.',
                           'pooled': 'Other 16 NCR cities, 2016-2020; exclude death anomalies/missing deaths. Training-only pooled targets; no duplicate Manila outcomes. Shared Manila weather is a regional proxy, not city-specific weather. Geography vintages are contemporary and exploratory.',
                           'scope': 'Exploratory expanded count model. Does not alter the historical NCR classifier or official observations.'},
              'horizons': []}
    for h in (1, 2):
        print(f'Evaluating horizon {h}', flush=True)
        output['horizons'].append(evaluate(historical, recent, weather, monthly, daily_peak, h, pools[h], manila_geo))
    # Fail if any raw source changed while fitting.
    for item in audit['raw_files']:
        if digest(ROOT/'data/raw'/item['file']) != item['sha256']:
            raise ValueError('Raw source changed during evaluation')
    folder = ROOT/'data/processed/expanded-manila'
    folder.mkdir(parents=True, exist_ok=True)
    (folder/'evaluation.json').write_text(json.dumps(output, indent=2, allow_nan=False)+'\n', encoding='utf-8')
    public = ROOT/'public/research'
    public.mkdir(exist_ok=True)
    # This aggregate export contains no participant data, raw workbook cells or local filesystem paths.
    (public/'manila-expanded.json').write_text(json.dumps(output, separators=(',', ':'), allow_nan=False)+'\n', encoding='utf-8')
    for h in output['horizons']:
        print(json.dumps({'horizon': h['horizon'], 'selected': h['selected_by_validation'], 'forecast': h['forecast'],
                          'promotion_eligible': h['promotion_eligible']}), flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('command', choices=['evaluate'], nargs='?', default='evaluate')
    parser.parse_args()
    run()
