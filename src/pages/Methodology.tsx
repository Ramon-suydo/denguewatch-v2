import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, Select } from "../components/ui";
import { ReadState } from "../components/PageState";
import { ScenarioControl } from "../components/EvidenceControls";
import { useResource } from "../lib/resources";
import { loadEvidence, number, percent, type Scenario } from "../lib/evidence";
export function Methodology() {
  const resource = useResource("manila-v2", loadEvidence),
    [scenario, setScenario] = useState<Scenario>("M"),
    [fold, setFold] = useState("test-2018-2023"),
    [horizon, setHorizon] = useState(1),
    [driverModel, setDriverModel] = useState("ridge-weather");
  return (
    <div className="ui-container app-content evidence-page">
      <p className="eyebrow">METHODS / EVIDENCE BEFORE CLAIMS</p>
      <h1>What was tested. What remains uncertain.</h1>
      <p>
        We study Manila city one to two weeks ahead, compare with last-week
        persistence, and keep community reports outside official counts and
        models. Four weeks is exploratory.
      </p>
      <ReadState resource={resource}>
        {(data) => {
          const rows = data.summaries.filter(
              (s) =>
                s.scenario === scenario &&
                s.fold === fold &&
                s.horizon === horizon,
            ),
            cases = rows.find((r) => r.model === "ridge-cases"),
            weather = rows.find((r) => r.model === "ridge-weather");
          return (
            <>
              <Card>
                <h2>Does a date with no row mean zero cases or no report?</h2>
                <p>
                  The workbook does not answer. Scenario Z assumes zero inside
                  coverage; Scenario M excludes incomplete daily-row weeks. We
                  evaluate both. No absence is silently turned into zero in M.
                  Partial boundary weeks are excluded in both.
                </p>
                <p>
                  DOH weekly data provides 2016–2017; daily-derived weekly data
                  begins January 2018. The Sunday week-ending interpretation of
                  DOH labels is operational and unconfirmed. Observed-week
                  overlap has 151 pairs and a mean absolute difference of
                  13.5960 cases. Including five blank weeks under Z gives 156
                  pairs and MAE 13.2244; seven-row weeks give 104 pairs. Close
                  totals do not mean matching weeks.
                </p>
                <p>
                  Source citations and 2020 NCR population provenance still need
                  owner review.{" "}
                  <Link className="text-link" to="/data-sources">
                    Detailed source audit
                  </Link>
                  .
                </p>
              </Card>
              <ScenarioControl value={scenario} onChange={setScenario} />
              <div className="evidence-filters">
                <Select
                  label="Evaluation fold"
                  value={fold}
                  onChange={(e) => setFold(e.target.value)}
                >
                  <option value="test-2018-2023">
                    All test years · 2018–2023
                  </option>
                  {["2018", "2019", "2020", "2021", "2022", "2023"].map((y) => (
                    <option key={y}>{y}</option>
                  ))}
                  <option value="covid-2020-2021">
                    COVID years · 2020–2021
                  </option>
                </Select>
                <Select
                  label="Forecast horizon"
                  value={horizon}
                  onChange={(e) => setHorizon(Number(e.target.value))}
                >
                  <option value={1}>1 week</option>
                  <option value={2}>2 weeks</option>
                  <option value={4}>4 weeks · exploratory</option>
                </Select>
              </div>
              <Card>
                <h2>Forecast comparison</h2>
                <p>
                  Expanding-window rolling origins; no random split. Same scored
                  targets for every method within each scenario. The 2017
                  development candidate was frozen before 2018–2023 testing. The
                  public display conservatively uses persistence because
                  one/two-week gains remain inconclusive; that promotion choice
                  is post-evaluation, not preregistered.
                </p>
                {!rows.length ? (
                  <p>No eligible targets in this selection.</p>
                ) : (
                  <div
                    className="table-scroll"
                    role="region"
                    aria-label="Model evaluation metrics"
                    tabIndex={0}
                  >
                    <table>
                      <thead>
                        <tr>
                          <th scope="col">Model</th>
                          <th scope="col">N</th>
                          <th scope="col">MAE</th>
                          <th scope="col">RMSE</th>
                          <th scope="col">MASE</th>
                          <th scope="col">Skill vs last week</th>
                          <th scope="col">95% skill CI</th>
                          <th scope="col">80% coverage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r) => (
                          <tr key={r.model}>
                            <th scope="row">{r.model}</th>
                            <td>{r.n}</td>
                            <td>{number(r.mae, 3)}</td>
                            <td>{number(r.rmse, 3)}</td>
                            <td>{number(r.mase, 3)}</td>
                            <td>{number(r.skillPercent)}%</td>
                            <td>
                              {r.skill95
                                ? `${number(r.skill95.low)} to ${number(r.skill95.high)}%`
                                : "Unavailable"}
                            </td>
                            <td>{percent(r.coverage80)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <p className="muted">
                  Sources: immutable DOH / Manila daily inputs, ERA5 grid
                  estimates. Test targets through 2023-11-26; version{" "}
                  {data.metadata.version}. MASE uses training-only mean
                  adjacent-week persistence error. Bootstrap: 400 paired
                  resamples in blocks of eight observed targets; gaps mean
                  blocks are not always eight calendar weeks.
                </p>
              </Card>
              <Card>
                <h2>Did weather help?</h2>
                {cases && weather ? (
                  <p>
                    Case-only ridge MAE: <strong>{number(cases.mae, 3)}</strong>
                    . Weather ridge MAE:{" "}
                    <strong>{number(weather.mae, 3)}</strong>.{" "}
                    {weather.mae! < cases.mae!
                      ? "Lower error in this selected fold does not establish consistent or causal improvement."
                      : "Weather did not improve this matched comparison."}
                  </p>
                ) : (
                  <p>No matched weather comparison in this selection.</p>
                )}
                <p>
                  Across the full 2018–2023 test, weather worsens ridge at one
                  and two weeks in both Z and M. ERA5 is retrospective
                  reanalysis, not station gauges or historical operational
                  vintages. Weekly rain, temperature and humidity enter only at
                  lags 1–8, with at least seven days of availability lag.
                  Constants such as population and density cannot predict change
                  within Manila.
                </p>
                <p>
                  Leave-one-driver-out ridge and cases/weather tree variants
                  appear in the same table. Importances and correlations are not
                  causal explanations. No deep learning: fewer than 500 weekly
                  observations.
                </p>
              </Card>
              <Card>
                <h2>Descriptive driver fits</h2>
                <Select
                  label="Descriptive driver model"
                  value={driverModel}
                  onChange={(e) => setDriverModel(e.target.value)}
                >
                  <option value="ridge-weather">
                    Weather ridge coefficients
                  </option>
                  <option value="tree-weather">Weather tree split gains</option>
                </Select>
                <p>
                  These summarize a final training fit, not out-of-sample
                  attribution or causal effects. Correlation and importance do
                  not establish causation.
                </p>
                {data.drivers
                  ?.filter(
                    (d) => d.scenario === scenario && d.model === driverModel,
                  )
                  .map((d) => (
                    <div key={d.model}>
                      <p>
                        Origin {d.origin} · {d.interpretation}
                      </p>
                      <details>
                        <summary>Feature names and fitted values</summary>
                        <div
                          className="table-scroll"
                          role="region"
                          aria-label="Descriptive model drivers"
                          tabIndex={0}
                        >
                          <table>
                            <thead>
                              <tr>
                                <th scope="col">Feature</th>
                                <th scope="col">Value</th>
                              </tr>
                            </thead>
                            <tbody>
                              {d.rows.map((r) => (
                                <tr key={r.name}>
                                  <th scope="row">{r.name}</th>
                                  <td>{number(r.value, 4)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </details>
                    </div>
                  ))}
              </Card>
              <Card>
                <h2>Research alerts, not outbreak declarations</h2>
                <p>{data.metadata.threshold}</p>
                <p>
                  Alert probabilities use matured out-of-sample residuals. The
                  endemic-channel rule uses the latest count crossing that
                  threshold. These research signals do not establish current
                  risk or replace official DOH guidance.
                </p>
                <div
                  className="table-scroll"
                  role="region"
                  aria-label="Alert evaluation"
                  tabIndex={0}
                >
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">Model</th>
                        <th scope="col">Precision</th>
                        <th scope="col">Recall</th>
                        <th scope="col">F1</th>
                        <th scope="col">ROC-AUC</th>
                        <th scope="col">Brier</th>
                        <th scope="col">False-positive rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows
                        .filter((r) =>
                          [
                            "naive",
                            "endemic-channel",
                            "ridge-weather",
                          ].includes(r.model),
                        )
                        .map((r) => (
                          <tr key={r.model}>
                            <th scope="row">{r.model}</th>
                            <td>{number(r.precision, 3)}</td>
                            <td>{number(r.recall, 3)}</td>
                            <td>{number(r.f1, 3)}</td>
                            <td>{number(r.rocAuc, 3)}</td>
                            <td>{number(r.brier, 3)}</td>
                            <td>{percent(r.falseAlarmRate)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                <p>
                  Lead time is currently reported as the forecast horizon among
                  correct positives; episode-based outbreak lead time has not
                  been validated. Undefined metrics stay unavailable. Intervals
                  can under-cover, especially in M and COVID years.
                </p>
              </Card>
              <Card>
                <h2>Research threshold-episode lead time</h2>
                <p>
                  An eligible onset requires an above-threshold scored week
                  preceded by an observed, consecutive calendar week at/below
                  threshold. Gaps do not establish onset. Only one/two-week
                  forecasts are counted here; this is not a medically confirmed
                  outbreak measure. Missed eligible onsets remain in the
                  denominator.
                </p>
                <div
                  className="table-scroll"
                  role="region"
                  aria-label="Primary threshold episode lead time"
                  tabIndex={0}
                >
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">Model</th>
                        <th scope="col">Eligible onsets</th>
                        <th scope="col">Detected</th>
                        <th scope="col">Mean lead (weeks)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.episode_leads
                        ?.filter(
                          (r) =>
                            r.scenario === scenario &&
                            r.horizon_set === "primary-1-2",
                        )
                        .map((r) => (
                          <tr key={r.model}>
                            <th scope="row">{r.model}</th>
                            <td>{r.eligible_onsets}</td>
                            <td>{r.detected_onsets}</td>
                            <td>{number(r.mean_lead_weeks)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </Card>
              <Card>
                <h2>Known limits</h2>
                <ul>
                  {data.metadata.limitations.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
                <p>{data.metadata.ridge}</p>
                <p>{data.metadata.tree}</p>
                <p>{data.metadata.intervals}</p>
                <p>
                  Community reports are an unverified awareness layer only.
                  Their predictive value is future work; there is no validation
                  history.
                </p>
              </Card>
            </>
          );
        }}
      </ReadState>
    </div>
  );
}
