import { Link } from "react-router-dom";
import { Card } from "../components/ui";
import { PageHeader } from "../components/PageHeader";
import { SourceCitation } from "../components/SourceCitation";
import { pendingCitationFields } from "../lib/source-metadata";

// Audit figures from docs/DATA_QUALITY.md, not live database totals.
const sources = [
  ["ncr_dengue_monthly_with_rates.csv", "Monthly (derived from weekly)", "17 NCR LGUs", "1 January 2016–1 January 2021", "1,037"],
  ["doh-epi-dengue-data-2016-2021.csv", "Weekly (source date labels)", "17 NCR LGUs", "10 January 2016–10 January 2021", "4,403"],
  ["Daily_Reported_Cases_of_Dengue_in_the_City_of_Manila_from_2018_to_2023.xlsx", "Daily (separate source)", "Manila City only", "1 January 2018–2 December 2023", "1,910"],
];

export function DataSources() {
  return (
    <>
      <PageHeader
        eyebrow="PUBLISHED DATA AND LIMITATIONS"
        title="Data & Sources"
        description="Understand coverage, missing observations, and the limits of the historical records before interpreting a chart or estimate."
      />
      <div className="ui-container app-content content-stack">
        <p className="data-notice">
          Historical records do not establish current dengue conditions.
          Forecasts are research estimates only, not medical advice or official
          outbreak warnings.
        </p>
        <Card className="prose">
          <h2>{pendingCitationFields().length ? "Source attribution awaiting review" : "Source attribution"}</h2>
          <p>
            The dataset owner identifies the supplied files as Department of
            Health (DOH) and Freedom of Information (FOI) sources. Source details
            are listed below; any pending field still requires source-owner review.
            DengueWatch is a thesis/research
            application, not an official DOH service.
          </p>
          <p>
            The figures below describe the files audited on 23 September 2026:
            17 NCR LGUs and 7,350 observations across three sources. These are
            audit figures, not a live database count or a count of unique cases.
            Never sum daily, weekly, and monthly case totals.
          </p>
        </Card>
        <Card>
          <h2>Audited source coverage</h2>
          <div className="table-scroll" role="region" aria-label="Audited source coverage" tabIndex={0}>
            <table>
              <caption>Supplied files; dates are source labels, not guaranteed complete periods.</caption>
              <thead>
                <tr>
                  <th scope="col">Source file</th>
                  <th scope="col">Period</th>
                  <th scope="col">Geography</th>
                  <th scope="col">First–last label</th>
                  <th scope="col">Observations</th>
                </tr>
              </thead>
              <tbody>
                {sources.map(([file, period, geography, coverage, rows]) => (
                  <tr key={file}>
                    <th scope="row">{file}</th>
                    <td>{period}</td>
                    <td>{geography}</td>
                    <td>{coverage}</td>
                    <td>{rows}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card className="prose">
          <h2>Citation details</h2>
          {sources.map(([file, period]) => <section key={file}>
            <h3>{period}</h3>
            <p>{file.split("_").map((part, i) => <span key={i}>{i > 0 && "_"}{part}<wbr /></span>)}</p>
            <SourceCitation source={file} />
          </section>)}
        </Card>
        <Card className="prose">
          <h2>Gaps and incomplete periods</h2>
          <p>
            Missing is not zero. Every NCR LGU has three internal weekly gaps:
            13 November 2016, 6 January 2019, and 15 November 2020. Weekly labels
            are Sundays; supplied metadata does not establish whether they are
            week starts or ends. Labels are preserved without shifting dates.
          </p>
          <p>
            January 2021 monthly values contain only two weekly records per LGU.
            Coverage starts partway through January 2016 and ends early in
            January 2021. A monthly row does not guarantee a complete month.
          </p>
          <p>
            Manila has 281 absent dates relative to the full 2018–2023 calendar
            years: 6 in 2018, 12 in 2019, 170 in 2020, 49 in 2021, 13 in 2022,
            and 31 in 2023. The final 29 days of 2023 are outside supplied
            coverage, not internal gaps. The workbook cannot establish whether
            other absent dates are missing observations or omitted zero-report
            days; they remain gaps.
          </p>
        </Card>
        <Card className="prose">
          <h2>Overlaps and source disagreements</h2>
          <p>
            Monthly CSV values exactly match grouping weekly rows by their
            label month. Monthly data is derived, not an independent validation
            set. Training and testing must not cross overlapping representations
            of the same observations.
          </p>
          <p>
            Manila daily and weekly totals disagree during overlapping years:
            3,641 versus 3,620 cases in 2018; 3,961 versus 3,901 in 2019; and
            697 versus 689 in 2020. Differences in coverage, definitions, or
            revisions have not been established. Keep each source and period
            type separate; do not combine or silently reconcile them.
          </p>
          <h3>Deaths and anomalies</h3>
          <p>
            Deaths exceed cases in 155 weekly and 41 monthly rows. These values
            are preserved and flagged, and affected rows must be excluded from
            mortality claims and forecast validation. Large case peaks alone
            are not evidence of an error.
          </p>
          <p>
            The daily workbook has no deaths field: all 1,910 death values remain
            NULL, not zero. One Quezon City weekly death value (7 May 2017) is
            also missing. Its supplied monthly aggregate is retained with a
            missing-deaths flag; it does not prove complete mortality reporting.
          </p>
          <h3>Population and geography</h3>
          <p>
            Incidence uses the monthly file’s fixed population_2020, not a
            current population estimate. Arithmetic checks do not establish
            external population provenance. Current PSGC identifiers do not
            establish that historical boundaries match current boundaries.
            Pateros is NCR’s municipality; daily data covers Manila only.
          </p>
          <h3>Community reports</h3>
          <p>
            Community reports are unverified, kept separate from official data,
            and excluded from the current forecasts. Weekly city counts below
            five are hidden, so displayed community counts are lower bounds,
            not complete totals.
          </p>
          <Link className="text-link" to="/">Explore the historical dashboard</Link>
        </Card>
      </div>
    </>
  );
}
