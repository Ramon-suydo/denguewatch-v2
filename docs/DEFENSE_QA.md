# Defense questions and honest answers

**What does the app claim?** Manila city historical 1–2-week activity forecasting,
weather-versus-persistence evaluation, historical NCR patterns and a separate
unverified community-awareness layer. Current risk is unavailable without recent
official observations. It is not a medical or outbreak declaration service.

**Why Manila only?** The supplied daily Manila series extends through 2023. The
NCR city-level weekly comparison ends January 2021. That supports a narrower,
clearer claim than a live NCR-wide forecast.

**Why a simple model?** Short-term persistence is strong. The frozen 2017 ridge
candidate does not establish consistent held-out 1/2-week gains over naive;
uncertainty intervals include no gain. The public historical display therefore
uses persistence. This conservative promotion choice followed evaluation and is
not called preregistered. See EVALUATION.md for actual values and negative results.

**Did weather improve accuracy?** In the primary 2018–2023 paired comparison,
weather worsens ridge MAE at 1 and 2 weeks in both Z and M. ERA5 is reanalysis,
not station gauges or historical real-time vintages. This does not show that
weather is causally irrelevant to dengue. Alternative-source sensitivity is a
separate case-only experiment, not proof of weather robustness under that source.

**Why two absent-day scenarios?** No recorded workbook day has zero cases, and
252 dates are absent within coverage. The source does not confirm zero versus
missing. Z explicitly assumes zero; M excludes weeks without seven daily rows.
Their scored samples differ, so their errors cannot be compared as identical
cohorts. The 29 days after 2023-12-02 are outside coverage, not missing observations.

**Why not a district or barangay case map?** No verified Manila subcity official
case series was supplied. The map shows NCR city-level history. Barangay labels
in the report form are coarse source-location choices only; no city count is
allocated to them. Community aggregates, if eligible after review, remain
unverified reports rather than official case figures.

**Do the two Manila sources agree?** On 151 observed paired weeks, daily 8,255
versus DOH 8,234, MAE 13.5960 and correlation about .93. Including five blank daily
weeks under Z gives 156 pairs. Similar totals do not make weeks interchangeable;
source change and alternate-source sensitivity are disclosed.

**How are alerts evaluated?** Past-only seasonal 90th-percentile research
thresholds, precision/recall/F1/AUC/Brier/false-positive rates, plus explicitly
defined threshold-episode lead time. These are research thresholds, not verified
DOH outbreak classifications. Sparse groups can make metrics undefined. Nominal
80% intervals are tested and can under-cover; no guaranteed protection is claimed.

**How are false reports handled?** Closed-by-default collection, one-use PoW,
honeypot, schema limits, global quotas, duplicate/burst quarantine, staff review,
merge/reject, >=3 approved reports, >=72-hour delay and withdrawal/retention.
Moderation cannot prove identity or clinical truth. Reports never train the model
or change official counts. Predictive value is future work.

**How is RA 10173 addressed?** Sensitive-health-data minimization, explicit
versioned consent, no names/contact/GPS/IP fields, staff-only raw access, hashed
bearer withdrawal codes, suppression/delay and 90-day expiry. Provider logs,
backups, free-text leakage, children/third-party reports, lawful basis and actual
controller/DPO arrangements still require review. This is not a compliance
certification or claim of guaranteed anonymity.

**What is verified?** Local source/SQL/model tests, browser/axe/keyboard/mobile
checks, build, dependency audit, production offline cache and local headers,
reproducible evidence and a saved Lighthouse mobile lab report. See the final
implementation status for the exact counts and commit.

**What is not verified?** Human usability results, current disease risk, future
model performance, provider retention settings, real hosted staff sign-in/MFA,
new hosted migrations/purge execution, and deployed ZAP. The known database
password must be rotated because it matches a public identifier. Collection has
not been activated. No absent evidence is presented as a pass.

## Does living near a river cause dengue?
No causal conclusion follows from this analysis. Aedes aegypti mainly breeds in
small containers of standing water around homes, including drums, tires, pots
and clogged drains. River proximity, low elevation and flooding are indirect
proxies for drainage, standing water and density. The 17-city correlations are
exploratory, use mixed source vintages and an unverified population denominator,
and have broad intervals. See ENVIRONMENT.md.

## Did season or weather beat last week?
The controlled AR(2) ablation improves some year/season comparisons, but no
environmental variant establishes a reliable pooled 1/2-week gain over matched
persistence in both scenarios. Exploratory four-week gains stay exploratory.
The public model remains persistence; no environmental promotion was made.
