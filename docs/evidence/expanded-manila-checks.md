# Expanded Manila model verification - 28 October 2026

Branch: `feat/expanded-forecast`. Application baseline: `ce949e7`. No push, main merge, hosted migration/write or collection activation is included. User requested Manila weekly case counts; this is a separate experiment from the unchanged NCR classifier and provisional ratio reference.

## Results

| Check | Actual outcome |
| --- | --- |
| Scientific/source tests | 10 passed, including all five raw-source reconciliation, calendar gaps, future weather/case leakage, pooled target cutoff and estimate weights |
| Existing unit/integration suite | 98 passed; 0 failed/skipped |
| Types and lint | Passed under Node 22.23.4 |
| Expanded artifact/prebuild guard | Passed; fingerprints, public/processed parity, source snapshot, selection, test calculations and complete selected-model weather |
| Existing integrity guard | Passed for all 121 protected earlier historical/model/source/export artifacts |
| Shipped data, credits and contrast | Passed |
| Production build/prerender/PWA generation | Passed |
| Full browser suite | 64 passed |
| Production suite | 18 passed |
| Offline/PWA | 6 passed, including offline expanded evidence with recent counts hidden when source unavailable |
| Visuals | 16 intended Our Model baselines refreshed; independent full comparison 79/80, then remaining About case passed against untouched baseline/tolerance |
| Reproduction | Full twelve-candidate numerical evaluation and raw-source audit identical on repeated fitting |
| Runtime | Python 3.12.7, NumPy 2.5.4, scikit-learn 1.9.1 |
| JavaScript gzip budget | Initial 110,118 / limit 225,280 bytes; total 717,109 / limit 870,400 bytes |
| Changed-file secret-pattern scan | 0 findings before staging; commit hook performs its own staged scan |
| Documentation | Local links, code fences and diff whitespace checked |

[Sanitized command manifest](expanded-manila-command-manifest.json). Full raw runner logs are ignored locally under `.artifacts/expanded-manila/`; they are not claimed as committed artifacts. The targeted final About comparison was a direct tool execution with no separate disk log. Existing whole-history credential-rotation gate remains **NEEDS OWNER**; a clean staged scan is not historical revocation proof.

## Actual scientific finding

One-week selected `rf_weather`: validation improvement 9.39%, 2023 MAE 9.989 versus persistence 10.000; paired 95% skill interval -22.25% to 13.63%. Two-week selected `rf_cases`: 2023 MAE 13.241 versus 12.667; interval -41.89% to 15.36%. Reliable overall improvement is not established. The public reference is preserved, and experimental recent refits are labeled accordingly.

Pooled-city controls add water/elevation/density and regional weather comparisons using only earlier other-city targets. None wins validation. The current experimental estimates are approximately 201 and 185 cases for weeks ending 1/8 November, using the source through 25 October. Nine recent weeks are estimated; all 13 are source-unverified. No calibrated 2026 interval or prospective accuracy is claimed.

Full methods, all-source roles and results: [EXPANDED_MANILA_MODEL.md](../EXPANDED_MANILA_MODEL.md). Public evidence uses aggregate data only. The original disease and weather inputs were read without rewriting their bytes.

## Diagnostics retained honestly

- Focused new-page checks initially found mobile horizontal overflow. Scroll containers/grid minimum widths were corrected; the remaining overflow was the inherited nowrap status badge. Its text now wraps. The unchanged root-overflow assertion and accessibility checks pass at 360/1280px. Earlier failed logs remain local.
- An attempted visual runner used the active production port and ran no tests. A separate port resolved that setup issue.
- The initial anchored grep matched no full Playwright titles and ran no tests. The corrected `model [0-9]` selection refreshed exactly 16 intended screenshots.
- The full independent visual run passed 79 cases and failed one About 1920/night/reduced-motion capture because it did not stabilize within 15 seconds. The final received image and baseline differed only inside a 63-by-13-pixel bounding box. The same case passed on a targeted rerun without updating that baseline, enlarging tolerance or changing application code. Font/loading timing is a possible cause, not a proven diagnosis. The failed log remains; the shared Playwright output directory was reused by the rerun, so a retained full failure trace is not claimed.
- Concurrent helper processes initially overwrote manifest entries for a successful PWA run and a pre-test port diagnostic. These were reconciled from their actual tool records; the helper now reads the latest manifest before appending. Log names distinguish the checks.

## Review images and limits

- [360px research page](expanded-manila-ui/research-360.png)
- [1280px research page](expanded-manila-ui/research-1280.png)
- [All-candidate error comparison](../figures/expanded-manila-mae.png)

Automated Chrome checks are not real-device, screen-reader, native-language or human usability review. No new Lighthouse, deployed scan, active penetration test, hosted Auth/publication verification or DPO approval is claimed. Known credential, source-definition/republication and collection gates remain. Test locally and self-review before merging; main deploys automatically. User pushes `git push -u origin feat/expanded-forecast`.
