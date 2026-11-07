"""Export the actual fixed-candidate validation/test comparison, never cherry-picked rows."""
import json
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

root = Path(__file__).resolve().parents[1]
data = json.loads((root/'data/processed/expanded-manila/evaluation.json').read_text())
fig, axes = plt.subplots(2, 2, figsize=(14, 8), constrained_layout=True)
for row, h in enumerate(data['horizons']):
    for col, (key, title) in enumerate([('validation', '2021–2022 validation'), ('test', '2023 test audit')]):
        values = h[key]
        ax = axes[row, col]
        ax.barh([r['model'] for r in values], [r['mae'] for r in values],
                color=['#426e88' if r['model'] == h['selected_by_validation'] else '#b8d3cd' for r in values])
        ax.axvline(next(r['mae'] for r in values if r['model'] == 'persistence'), color='#45355e', ls='--', lw=1)
        ax.invert_yaxis()
        ax.set_xlabel('Mean absolute error (cases; lower is better)')
        ax.set_title(f"{h['horizon']}-week horizon · {title}")
fig.suptitle('Expanded Manila count models: validation gains do not establish test improvement\nBlue = validation-selected method; dashed line = persistence baseline', fontsize=13)
(root/'docs/figures').mkdir(exist_ok=True)
fig.savefig(root/'docs/figures/expanded-manila-mae.png', dpi=150)
plt.close(fig)
