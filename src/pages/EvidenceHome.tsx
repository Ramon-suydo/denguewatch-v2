import { SeasonalWatch } from "../components/EnvironmentalEvidence";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "../components/ui";
import { ReadState } from "../components/PageState";
import {
  ScenarioControl,
  LanguageControl,
  useLanguage,
} from "../components/EvidenceControls";
import { useResource } from "../lib/resources";
import { loadEvidence, number, percent, type Scenario } from "../lib/evidence";
export function EvidenceHome() {
  const data = useResource("manila-v2", loadEvidence),
    [scenario, setScenario] = useState<Scenario>("M"),
    { language, setLanguage } = useLanguage();
  const fil = language === "fil";
  return (
    <div className="ui-container app-content evidence-page">
      <LanguageControl value={language} onChange={setLanguage} />
      <p className="eyebrow">MANILA / DENGUEWATCH RESEARCH</p>
      <h1>
        {fil
          ? "Alamin ang datos. Kumilos nang maaga."
          : "Know the evidence. Take care early."}
      </h1>
      <p className="evidence-intro">
        {fil
          ? "Kasaysayan ng dengue sa Maynila, pagsusuri ng pagtataya, at malinaw na mga limitasyon."
          : "Manila dengue history, tested forecasts, and clear limits on what the data can tell us."}
      </p>
      <ReadState resource={data}>
        {(value) => {
          const snapshot = value.snapshots.find((r) => r.scenario === scenario);
          if (!snapshot)
            return (
              <Card>
                <h2>No historical research snapshot available</h2>
                <p>
                  No observations have been invented. Try again after the
                  dataset is published.
                </p>
              </Card>
            );
          return (
            <>
              <Card className="evidence-status">
                <p className="eyebrow">
                  {fil ? "KASALUKUYANG KALAGAYAN" : "CURRENT STATUS"}
                </p>
                <h2>
                  <span aria-hidden="true">◇ </span>
                  {fil
                    ? "Kulang ang kasalukuyang datos"
                    : "Current risk unavailable"}
                </h2>
                <p>
                  {fil
                    ? `Ang pinakahuling mapagkakatiwalaang linggo sa Scenario ${scenario} ay nagtatapos noong ${snapshot.as_of}. Hindi nito masasabi ang panganib ngayon.`
                    : snapshot.current_risk.reason}
                </p>
                <p>
                  <strong>
                    {fil ? "Petsa ng huling tala:" : "Last recorded day:"}
                  </strong>{" "}
                  {value.data_as_of} ·{" "}
                  {fil
                    ? "Makasaysayang datos lamang"
                    : "Historical records only"}
                </p>
                <p>
                  {fil
                    ? "Alisin ang naiipong tubig, protektahan ang sarili laban sa kagat ng lamok, at kumonsulta nang maaga kung may sintomas."
                    : "Remove standing water, protect yourself from mosquito bites, and seek early consultation for symptoms."}
                </p>
                <div className="evidence-actions">
                  <Link
                    className="ui-button ui-button-primary"
                    to="/prevention"
                  >
                    {fil
                      ? "Pag-iwas at mga babala"
                      : "Prevention & warning signs"}
                  </Link>
                  <Link className="ui-button ui-button-secondary" to="/report">
                    {fil
                      ? "Mag-ulat · sarado pa"
                      : "Report a case · collection closed"}
                  </Link>
                </div>
              </Card>
              <SeasonalWatch fil={fil} />
              <section>
                <h2>
                  {fil
                    ? "Ano ang ipinapakita ng pagtataya?"
                    : "What do the forecasts show?"}
                </h2>
                <p>
                  {fil
                    ? "Pagsusuri ito sa lumang datos, hindi babala para sa kasalukuyan."
                    : "These are historical statistical estimates, not current alerts or outbreak predictions."}
                </p>
                <ScenarioControl
                  value={scenario}
                  onChange={setScenario}
                  language={language}
                />
                <Card>
                  <h3>
                    {fil
                      ? "Makasaysayang pagtataya para sa Maynila"
                      : "Historical Manila forecast"}
                  </h3>
                  <p>
                    {fil ? "Batayan noong" : "Origin"} {snapshot.as_of} ·{" "}
                    {snapshot.model_version} ·{" "}
                    {fil
                      ? "Hindi kasama ang ulat ng komunidad"
                      : "Community reports excluded"}
                  </p>
                  <div
                    className="table-scroll"
                    role="region"
                    aria-label={
                      fil
                        ? "Talahanayan ng makasaysayang pagtataya"
                        : "Historical forecast table"
                    }
                    tabIndex={0}
                  >
                    <table>
                      <thead>
                        <tr>
                          <th scope="col">
                            {fil ? "Linggong tinataya" : "Target week"}
                          </th>
                          <th scope="col">{fil ? "Agwat" : "Horizon"}</th>
                          <th scope="col">
                            {fil ? "Tinatayang bilang" : "Cases estimate"}
                          </th>
                          <th scope="col">
                            {fil ? "80% na agwat" : "80% interval"}
                          </th>
                          <th scope="col">
                            {fil ? "Tsansang pagtaas" : "Probability of rise"}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {snapshot.forecasts
                          .filter((f) => f.horizon <= 2)
                          .map((f) => (
                            <tr key={f.target}>
                              <th scope="row">{f.target}</th>
                              <td>
                                {f.horizon} {fil ? "linggo" : "week(s)"}
                              </td>
                              <td>{number(f.predicted)}</td>
                              <td>
                                {f.low80 == null
                                  ? "Unavailable"
                                  : `${number(f.low80)}–${number(f.high80)}`}
                              </td>
                              <td>{percent(f.riseProbability)}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="muted">
                    {fil
                      ? "Ang persistence model ay gumagamit ng pinakahuling bilang. Hindi garantiya ang pagitan ng pagtataya."
                      : "Persistence uses the latest available weekly count. Intervals use earlier out-of-sample errors and are not guarantees."}{" "}
                    {fil
                      ? "Pinagmulan: arawang tala ng Maynila; hanggang sa"
                      : "Source: Manila daily workbook; as of"}{" "}
                    {snapshot.as_of}.
                  </p>
                </Card>
              </section>
              <section>
                <h2>
                  {fil
                    ? "Sinubok ang panahon. Hindi ipinagpalagay."
                    : "Weather was tested, not assumed."}
                </h2>
                <p>
                  {fil
                    ? "Walang malinaw na pagbuti sa isa hanggang dalawang linggong pagtataya sa alinmang scenario gamit ang panahon at klima. Ginagamit pa rin ang mas simpleng batayang modelo."
                    : "Expanded season and weather tests did not establish a reliable one- to two-week gain over last-week persistence in either scenario. The public forecast keeps the simpler baseline."}
                </p>
                <Link className="text-link" to="/methodology">
                  {fil
                    ? "Tingnan ang resulta at pamamaraan"
                    : "Read the measured results and methodology"}{" "}
                  →
                </Link>
              </section>
              <div className="evidence-links">
                <Card>
                  <h2>{fil ? "Mga trend sa Maynila" : "Manila trends"}</h2>
                  <p>
                    2016–2023 ·{" "}
                    {fil
                      ? "may markang pinagmulan at mga nawawalang tala"
                      : "source bands, missing weeks, and COVID context"}
                  </p>
                  <Link className="text-link" to="/trends">
                    {fil ? "Tingnan ang kasaysayan" : "Explore the history"} →
                  </Link>
                </Card>
                <Card>
                  <h2>
                    {fil
                      ? "Kasaysayan ng Metro Manila"
                      : "Metro Manila history"}
                  </h2>
                  <p>
                    {fil
                      ? "Nagtatapos ang datos noong Enero 2021. Walang kasalukuyang pagtataya para sa NCR."
                      : "Data ends January 2021. No live NCR forecast."}
                  </p>
                  <Link className="text-link" to="/metro-manila">
                    {fil ? "Ihambing ang mga lungsod" : "Compare the cities"} →
                  </Link>
                </Card>
              </div>
            </>
          );
        }}
      </ReadState>
    </div>
  );
}
