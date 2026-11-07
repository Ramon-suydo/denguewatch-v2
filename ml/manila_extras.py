"""Extra results for the thesis paper, computed on the SAME test weeks as ml/manila_count.py.

Adds, without changing the reviewed expanded evaluation:
  * MAPE for the selected Random Forest and the naive (persistence) forecast;
  * two more baselines promised in Chapter 3: Seasonal Average and SARIMA;
  * DOH-style Low / Medium / High alert levels (alert threshold = mean of the same
    morbidity week in the three most recent non-pandemic years with data; epidemic
    threshold = alert threshold + 2 standard deviations);
  * Random Forest feature importance, when the ERA5 weather cache is available locally.

Run:  npm run count:extras   (after npm run count:evaluate)
"""
import datetime as dt
import json
import math
import sys
import warnings
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
EVALUATION = ROOT / 'data/processed/expanded-manila/evaluation.json'
SERIES = ROOT / 'data/processed/manila_weekly.json'
PANDEMIC_YEARS = {2020, 2021}
VERSION = 'manila-count-extras-v1'


def history():
    rows = json.loads(SERIES.read_text(encoding='utf-8'))['scenarios']['M']
    return {r['week_ending']: r['cases'] for r in rows if r['reliable'] and r['cases'] is not None}


def iso_week(day):
    return dt.date.fromisoformat(day).isocalendar()[1]


def same_week_values(series, target, years):
    week = iso_week(target)
    out = {}
    for day, cases in series.items():
        d = dt.date.fromisoformat(day)
        if d.year in years and d.isocalendar()[1] == week:
            out[d.year] = cases
    return out


def seasonal_average(series, target):
    year = dt.date.fromisoformat(target).year
    years = {y for y in range(2000, year) if y not in PANDEMIC_YEARS}
    values = list(same_week_values(series, target, years).values())
    return float(np.mean(values)) if values else None


def thresholds(series, target, wanted=3):
    """DOH-style thresholds for the target's morbidity week.

    Uses the most recent earlier years that have a recorded value for that week,
    skipping the pandemic years 2020-2021 (Chapter 3, Alert Computation).
    """
    year = dt.date.fromisoformat(target).year
    available = same_week_values(series, target, {y for y in range(2000, year) if y not in PANDEMIC_YEARS})
    years = sorted(available, reverse=True)[:wanted]
    values = [available[y] for y in years]
    if len(values) < 2:
        return None
    alert = float(np.mean(values))
    epidemic = alert + 2 * float(np.std(values, ddof=1))
    return {'years': sorted(years), 'values': [available[y] for y in sorted(years)],
            'alert': round(alert, 1), 'epidemic': round(epidemic, 1)}


def level(value, limits):
    if limits is None or value is None:
        return None
    if value >= limits['epidemic']:
        return 'High'
    if value >= limits['alert']:
        return 'Medium'
    return 'Low'


def metrics(actual, predicted):
    a, p = np.array(actual, dtype=float), np.array(predicted, dtype=float)
    err = a - p
    keep = a > 0
    return {'n': int(len(a)), 'mae': round(float(np.mean(abs(err))), 2),
            'rmse': round(float(math.sqrt(np.mean(err ** 2))), 2),
            'mape': round(float(np.mean(abs(err[keep]) / a[keep]) * 100), 1)}


def sarima_forecasts(series, records, horizon):
    """SARIMA(1,0,1)(1,0,0)[52] on log(1+cases), fitted once on data known before the first
    test origin, then re-filtered with the observations available at each origin (no refit)."""
    import pandas as pd
    from statsmodels.tsa.statespace.sarimax import SARIMAX
    start, end = min(series), max(series)
    index = pd.date_range(start, end, freq='W-SUN')
    full = pd.Series([series.get(d.date().isoformat(), np.nan) for d in index], index=index, dtype=float)
    logged = np.log1p(full)
    first_origin = pd.Timestamp(min(r['origin'] for r in records))
    train = logged[logged.index <= first_origin]
    with warnings.catch_warnings():
        warnings.simplefilter('ignore')
        model = SARIMAX(train, order=(1, 0, 1), seasonal_order=(1, 0, 0, 52), trend='c',
                        enforce_stationarity=False, enforce_invertibility=False)
        fitted = model.fit(disp=False, maxiter=200)
        out = []
        for r in records:
            upto = logged[logged.index <= pd.Timestamp(r['origin'])]
            applied = fitted.apply(upto)
            value = float(applied.forecast(horizon).iloc[-1])
            out.append(max(0.0, math.expm1(value)))
    return out, {'order': [1, 0, 1], 'seasonal_order': [1, 0, 0, 52], 'transform': 'log1p',
                 'fit_through': first_origin.date().isoformat()}


def paired_difference(actual, first, second, draws=5000, block=4, seed=20261029):
    """Mean absolute error of `first` minus `second`, with a 95% circular block-bootstrap interval."""
    a, f, s = (np.array(x, dtype=float) for x in (actual, first, second))
    diff = np.abs(a - f) - np.abs(a - s)
    n, rng = len(diff), np.random.default_rng(seed)
    means = []
    for _ in range(draws):
        starts = rng.integers(0, n, size=math.ceil(n / block))
        idx = np.concatenate([(np.arange(st, st + block)) % n for st in starts])[:n]
        means.append(diff[idx].mean())
    low, high = np.percentile(means, [2.5, 97.5])
    return {'mae_difference': round(float(diff.mean()), 2), 'ci95': [round(float(low), 2), round(float(high), 2)],
            'first_closer_weeks': int((np.abs(a - f) < np.abs(a - s)).sum()), 'weeks': int(n)}


def sharp_change(actual, naive, compared, threshold=0.2):
    """Weeks where reported cases moved more than 20% from the week before (descriptive subset)."""
    a, nv = np.array(actual, dtype=float), np.array(naive, dtype=float)
    mask = np.abs(a - nv) / np.maximum(nv, 1) > threshold
    return {'threshold_percent': int(threshold * 100), 'weeks': int(mask.sum()),
            'mae': {label: round(float(np.mean(np.abs(a - np.array(v, dtype=float))[mask])), 1) for label, v in compared}}


def recent_check(evaluation):
    """Out-of-sample check on 2026 weeks the model had not seen (not-estimated outcomes only)."""
    out = []
    for h in evaluation['horizons']:
        rows = h.get('unverified_2026_prequential') or []
        if not rows:
            continue
        a = np.array([r['actual_unverified'] for r in rows], dtype=float)
        p = np.array([r['predicted'] for r in rows], dtype=float)
        n = np.array([r['persistence'] for r in rows], dtype=float)
        out.append({'horizon': h['horizon'], 'weeks': len(rows), 'rf_mae': round(float(np.mean(abs(a - p))), 1),
                    'naive_mae': round(float(np.mean(abs(a - n))), 1), 'rf_mape': round(float(np.mean(abs(a - p) / a) * 100), 1),
                    'rf_mean_bias': round(float(np.mean(p - a)), 1)})
    return out


def recent_series():
    data = json.loads((ROOT / 'public/live-manila/weekly.json').read_text(encoding='utf-8'))
    return {r['week_end']: r['weekly_new_cases'] for r in data['rows']}


def sarima_recent_forecast(series, recent, horizon):
    """Experimental: the same SARIMA specification on history plus the 2026 weeks (2024-2025 missing)."""
    import pandas as pd
    from statsmodels.tsa.statespace.sarimax import SARIMAX
    merged = {**series, **recent}
    index = pd.date_range(min(merged), max(merged), freq='W-SUN')
    logged = np.log1p(pd.Series([merged.get(d.date().isoformat(), np.nan) for d in index], index=index, dtype=float))
    with warnings.catch_warnings():
        warnings.simplefilter('ignore')
        fitted = SARIMAX(logged[logged.index <= pd.Timestamp(max(series))], order=(1, 0, 1), seasonal_order=(1, 0, 0, 52), trend='c',
                         enforce_stationarity=False, enforce_invertibility=False).fit(disp=False, maxiter=200)
        value = float(fitted.apply(logged).forecast(horizon).iloc[-1])
    return max(0.0, math.expm1(value))


def update_forecast_log(evaluation, sarima_next):
    """Append-only record of next-week forecasts made BEFORE the outcome is known."""
    path = ROOT / 'data/processed/expanded-manila/forecast-log.json'
    log = json.loads(path.read_text(encoding='utf-8')) if path.exists() else {'version': 'manila-forecast-log-v1', 'entries': []}
    f = evaluation['horizons'][0]['forecast']
    if not any(e['target_week_end'] == f['target'] for e in log['entries']):
        rf = round(f['predicted'])
        log['entries'].append({'origin_week_end': f['origin'], 'target_week_end': f['target'],
                               'recorded_on': dt.date.today().isoformat(), 'random_forest': rf,
                               'sarima': round(sarima_next), 'average': round((f['predicted'] + sarima_next) / 2),
                               'naive': f['persistence'], 'actual': None})
    text = json.dumps(log, indent=2) + '\n'
    path.write_text(text, encoding='utf-8')
    (ROOT / 'public/research/manila-forecast-log.json').write_text(text, encoding='utf-8')
    return log


def calibrated_range(records, prequential, forecast, thresholds_next, radius, old_coverage):
    """Percentage-error range (10th-90th percentile of past relative errors) and chance of a High week.
    Judged leave-one-out on the 2023 test weeks against the current fixed-width range and the hard label;
    `adopted` is True only when it is not worse. The Random Forest point forecast is unchanged."""
    a = np.array([r['actual'] for r in records], dtype=float)
    p = np.array([r['predicted'] for r in records], dtype=float)
    limits = [thresholds(history(), r['target']) for r in records]
    epi = np.array([l['epidemic'] if l else np.inf for l in limits])
    rel = (a - p) / p
    cover, chance = [], []
    for i in range(len(a)):
        other = np.delete(rel, i)
        lo, hi = np.quantile(other, [.1, .9])
        cover.append(p[i] * (1 + lo) <= a[i] <= p[i] * (1 + hi))
        chance.append(float(np.mean(p[i] * (1 + other) >= epi[i])))
    chance, high = np.array(chance), a >= epi
    hard = p >= epi
    new_cov = float(np.mean(cover))
    detection = {'actual_high_weeks': int(high.sum()),
                 'hard_label': {'caught': int((hard & high).sum()), 'false_alarms': int((hard & ~high).sum())},
                 'chance_50': {'caught': int(((chance >= .5) & high).sum()), 'false_alarms': int(((chance >= .5) & ~high).sum())}}
    chance_ok = detection['chance_50']['caught'] >= detection['hard_label']['caught'] and detection['chance_50']['false_alarms'] <= detection['hard_label']['false_alarms']
    # Final calibration uses every out-of-sample error available: 2023 test weeks + not-estimated 2026 weeks.
    recent = np.array([(r['actual_unverified'] - r['predicted']) / r['predicted'] for r in prequential], dtype=float)
    pooled = np.concatenate([rel, recent])
    lo, hi = np.quantile(pooled, [.1, .9])
    pred = forecast['predicted']
    out = {'method': '10th-90th percentile of past percentage errors (2023 test weeks + not-estimated 2026 weeks)',
           'loo_coverage_percent': round(100 * new_cov, 1), 'previous_coverage_percent': round(100 * old_coverage, 1),
           'adopted': new_cov >= old_coverage, 'low': max(0, round(pred * (1 + lo))), 'high': round(pred * (1 + hi)),
           'errors_used': int(len(pooled)), 'high_detection_2023': detection, 'chance_adopted': bool(chance_ok)}
    if thresholds_next:
        out['chance_high_percent'] = round(100 * float(np.mean(pred * (1 + pooled) >= thresholds_next['epidemic'])))
    return out


def feature_importance():
    """Impurity importance of the selected weather Random Forest, refitted exactly as in
    manila_count.py on all historical pairs. Needs the local ERA5 cache (data/external/era5-*.json)."""
    sys.path.insert(0, str(ROOT / 'ml'))
    try:
        import manila_count as mc
        historical, recent, monthly, daily_peak, _ = mc.source_data()
        weather, _ = mc.weather_data()
    except Exception as error:  # missing gitignored raw/weather inputs on this machine
        return {'available': False, 'reason': f'{type(error).__name__}: {error}'}
    evaluation = json.loads(EVALUATION.read_text(encoding='utf-8'))
    name = evaluation['horizons'][0]['selected_by_validation']
    if not name.startswith('rf'):
        return {'available': False, 'reason': f'Selected model is {name}, not a Random Forest'}
    rows = mc.examples(historical, weather, monthly, daily_peak, 1)
    model = mc.fit(name, rows, pool=None)
    columns = mc.columns(name)
    names = list(model[:-1].get_feature_names_out(columns))
    scores = model.steps[-1][1].feature_importances_
    grouped = {}
    for feature, score in zip(names, scores):
        base = feature.replace('missingindicator_', '')
        grouped[base] = grouped.get(base, 0.0) + float(score)
    ranked = sorted(grouped.items(), key=lambda item: -item[1])
    return {'available': True, 'model': name, 'horizon': 1, 'pairs': len(rows),
            'features': [{'feature': f, 'importance': round(s, 4)} for f, s in ranked]}


def run():
    evaluation = json.loads(EVALUATION.read_text(encoding='utf-8'))
    series = history()
    output = {'version': VERSION, 'source_evaluation_version': evaluation['version'],
              'alert_rule': {'alert': 'Mean of the same morbidity week in the 3 most recent earlier years with data, excluding 2020-2021',
                             'epidemic': 'Alert threshold + 2 sample standard deviations',
                             'levels': {'Low': 'below alert threshold', 'Medium': 'at/above alert, below epidemic', 'High': 'at/above epidemic threshold'},
                             'note': 'No Manila data are available for 2024-2025, so 2026 thresholds use 2019, 2022 and 2023.'},
              'horizons': []}
    for h in evaluation['horizons']:
        records = h['test_records']
        actual = [r['actual'] for r in records]
        rf = [r['predicted'] for r in records]
        naive = [r['persistence'] for r in records]
        seasonal = [seasonal_average(series, r['target']) for r in records]
        sarima, sarima_spec = sarima_forecasts(series, records, h['horizon'])
        compared = [('Random Forest', h['selected_by_validation'], rf), ('Naive (same as this week)', 'persistence', naive),
                    ('Seasonal average', 'seasonal_average', seasonal), ('SARIMA', 'sarima', sarima)]
        table = [{'label': label, 'model': model, **metrics(actual, values)} for label, model, values in compared]
        limits = [thresholds(series, r['target']) for r in records]
        agree = [(level(p, l), level(a, l)) for p, a, l in zip(rf, actual, limits) if l is not None]
        confusion = {f'{p}->{a}': sum(1 for x in agree if x == (p, a)) for p in ('Low', 'Medium', 'High') for a in ('Low', 'Medium', 'High')}
        forecast = h['forecast']
        future = thresholds(series, forecast['target'])
        output['horizons'].append({
            'horizon': h['horizon'], 'test_period': [records[0]['target'], records[-1]['target']],
            'metrics': table, 'sarima': sarima_spec,
            'rf_minus_sarima': paired_difference(actual, rf, sarima),
            'sharp_change': sharp_change(actual, naive, [('Random Forest', rf), ('SARIMA', sarima), ('Naive', naive)]),
            'calibrated': calibrated_range(records, h.get('unverified_2026_prequential') or [], forecast, future,
                                           h['historical_residual_radius'], h['selected_test_range_coverage']),
            'forecast_range': {'low': round(forecast['historical_residual_range'][0]), 'high': round(forecast['historical_residual_range'][1]),
                               'test_coverage_percent': round(100 * h['selected_test_range_coverage'], 1)} if forecast.get('historical_residual_range') else None,
            'alert_test': {'weeks': len(agree), 'agreement_percent': round(100 * sum(p == a for p, a in agree) / len(agree), 1),
                           'confusion_predicted_to_actual': confusion,
                           'actual_levels': {k: sum(1 for _, a in agree if a == k) for k in ('Low', 'Medium', 'High')}},
            'forecast': {'origin': forecast['origin'], 'target': forecast['target'], 'model': forecast['model'],
                         'predicted': round(forecast['predicted']), 'thresholds': future,
                         'alert_level': level(forecast['predicted'], future)},
            'test_weeks': [{'target': r['target'], 'actual': r['actual'], 'random_forest': round(p, 1), 'naive': n,
                            'seasonal_average': None if s is None else round(s, 1), 'sarima': round(q, 1),
                            'alert_threshold': None if l is None else l['alert'], 'epidemic_threshold': None if l is None else l['epidemic'],
                            'forecast_level': level(p, l), 'actual_level': level(r['actual'], l)}
                           for r, p, n, s, q, l in zip(records, rf, naive, seasonal, sarima, limits)]})
    output['recent_2026_check'] = recent_check(evaluation)
    recent = recent_series()
    if max(recent) == evaluation['latest_week_end']:
        log = update_forecast_log(evaluation, sarima_recent_forecast(series, recent, 1))
        output['forecast_log_entries'] = len(log['entries'])
    output['feature_importance'] = feature_importance()
    text = json.dumps(output, indent=2, allow_nan=False) + '\n'
    (ROOT / 'data/processed/expanded-manila/extras.json').write_text(text, encoding='utf-8')
    public = ROOT / 'public/research'
    public.mkdir(exist_ok=True)
    (public / 'manila-extras.json').write_text(json.dumps(output, separators=(',', ':'), allow_nan=False) + '\n', encoding='utf-8')
    for h in output['horizons']:
        print(json.dumps({'horizon': h['horizon'], 'metrics': h['metrics'], 'forecast': h['forecast'], 'alert_test': h['alert_test']}))
    print('feature importance:', output['feature_importance'].get('available'), output['feature_importance'].get('reason', ''))


if __name__ == '__main__':
    run()
