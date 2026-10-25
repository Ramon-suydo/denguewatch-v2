# UX decisions: city classification and Replay

The primary view now answers which Metro Manila city areas have higher estimates in a clearly dated example. It does not imply a current forecast from old data. Exactly Dashboard, Risk Map and Community Report remain in primary navigation; About and Methods stay footer-linked.

Dashboard order: compact photographic hero and two actions; visible Replay/Live banner; top-three city estimates and neutral map thumbnail; three prevention actions and urgent warning signs; Data/Model/Map steps; closed Evidence accordion. Dense numeric methods and scenario analysis belong to About/Methods and the research archive. Primary views avoid MAE, Spearman, Scenario M and persistence wording. Probabilities use plain “about N in 10” wording; small values are “less than 1 in 10,” never rounded into a false zero-risk promise. Filipino primary text follows the same controls and data.

The national Philippines Outlook Index has been retired from primary UI. Its source, definition and evaluations are preserved under docs/archive/national-outlook and the original scripts/data for auditability. The current model uses the 17 NCR units only. Archived Manila 2023 research remains distinguishable from the 2016-2020 NCR classification task. Community reports remain separate and closed.

Motion is present in section reveals, count-up coverage, subtle photo movement, sparklines, city fly-to, probability-color transitions and high-level pulses. Reduced motion disables animation, autoplay and tilt. Explicit dimensions, stable loading space and lazy map code protect layout/performance. Browser/Lighthouse evidence is recorded separately; these choices do not prove the five-second usability goal.

The default Dashboard example is the first held-out week. It is not selected for favorable outcomes. Replay can show later weeks, including unavailable predictions where the real input calendar has gaps. A neutral thumbnail avoids encoding a historical risk color as a Live value.

The physical map resolution is city/municipality. Display zoom and street detail do not imply sub-city model precision. Calibration and probability bands are research constructs. The baseline can outperform RF, and all saved results remain visible.
