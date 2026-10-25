import { weatherFallback } from "../lib/forecast-policy";
import { useState } from "react";
import { Card, Select } from "./ui";
import { ReadState } from "./PageState";
import { useResource } from "../lib/resources";
import {
  loadEnvironment,
  loadGeography,
  loadWeatherContext,
  seasonalContext,
} from "../lib/environment";
import { number, percent, type Scenario } from "../lib/evidence";
export function SeasonalWatch({ fil = false }: { fil?: boolean }) {
  const weather = useResource("weather-context-v1", loadWeatherContext),
    history = useResource("environment-v1", loadEnvironment);
  const monthly =
      history.data?.design.profile.filter(
        (r) => r.scenario === "M" && r.complete_mean_cases !== null,
      ) ?? [],
    peak = [...monthly].sort(
      (a, b) => b.complete_mean_cases! - a.complete_mean_cases!,
    )[0],
    low = [...monthly].sort(
      (a, b) => a.complete_mean_cases! - b.complete_mean_cases!,
    )[0];
  const monthName = (n: number) =>
    new Intl.DateTimeFormat(fil ? "fil-PH" : "en-PH", {
      month: "long",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(2023, n - 1, 1)));
  const month = Number(
    new Intl.DateTimeFormat("en", {
      timeZone: "Asia/Manila",
      month: "numeric",
    }).format(new Date()),
  );
  return (
    <Card>
      <h2>
        {fil
          ? "Bantay-panahon: konteksto lamang"
          : "Seasonal watch: context only"}
      </h2>
      <p>{seasonalContext(month, fil)}</p>
      <p>
        {fil
          ? "Makasaysayang datos ang mga bilang ng dengue; hindi nito masasabi ang panganib ngayon."
          : "Dengue observations remain historical; current weather cannot establish today's dengue risk."}
      </p>
      {peak && low && (
        <p>
          {fil
            ? `Sa kumpletong tala noong 2016-2023 (Scenario M), ang karaniwang bilang bawat linggo ay ${number(low.complete_mean_cases, 1)} sa ${monthName(low.month)} at ${number(peak.complete_mean_cases, 1)} sa ${monthName(peak.month)}. Hindi nito sinusukat ang pagitan mula sa simula ng ulan hanggang sa pagdami ng kaso.`
            : `In complete-row history for 2016-2023 (Scenario M), mean weekly cases ranged from ${number(low.complete_mean_cases, 1)} in ${monthName(low.month)} to ${number(peak.complete_mean_cases, 1)} in ${monthName(peak.month)}. This does not measure a delay from rainfall onset to rising cases.`}
        </p>
      )}
      <p role="status">
        {weather.loading
          ? fil
            ? "Sinusuri ang datos ng panahon..."
            : "Checking weather context..."
          : weather.error ||
              !weather.data ||
              Date.now() - Date.parse(weather.data.attempted_at) > 2 * 86400000
            ? fil
              ? "Hindi makuha ang datos ng panahon; batayang pagtataya ang ipinapakita."
              : weatherFallback("naive", null, false).message
            : fil
              ? weather.data.status === "unavailable"
                ? "Hindi makuha ang datos ng panahon; batayang pagtataya ang ipinapakita."
                : `Konteksto lamang ang datos ng panahon hanggang ${weather.data.weather_as_of}; batayang pagtataya ang ipinapakita.`
              : `${weather.data.message} Weather as of: ${weather.data.weather_as_of ?? "unavailable"}.`}
      </p>
      <a
        className="text-link"
        href="https://www.pagasa.dost.gov.ph/information/climate-philippines"
      >
        {fil
          ? "Kahulugan ng panahon ayon sa PAGASA"
          : "PAGASA season definition"}
      </a>
    </Card>
  );
}
export function EnvironmentalEvidence() {
  const resource = useResource("environment-v1", loadEnvironment),
    [scenario, setScenario] = useState<Scenario>("M"),
    [fold, setFold] = useState("test-2018-2023"),
    [horizon, setHorizon] = useState(1);
  return (
    <ReadState resource={resource}>
      {(data) => {
        const rows = data.summaries.filter(
            (r) =>
              r.scenario === scenario &&
              r.fold === fold &&
              r.horizon === horizon,
          ),
          lags = data.design.lags[scenario];
        return (
          <Card>
            <h2>Season and weather: controlled ablation</h2>
            <p>{data.metadata.training}</p>
            <p>{data.metadata.paired_support}</p>
            <div className="evidence-controls">
              <Select
                label="Environmental scenario"
                value={scenario}
                onChange={(e) => setScenario(e.target.value as Scenario)}
              >
                <option value="M">M: absent dates missing</option>
                <option value="Z">Z: absent dates zero-assumed</option>
              </Select>
              <Select
                label="Environmental fold"
                value={fold}
                onChange={(e) => setFold(e.target.value)}
              >
                {[
                  "test-2018-2023",
                  "2018",
                  "2019",
                  "2020",
                  "2021",
                  "2022",
                  "2023",
                  "covid-2020-2021",
                ].map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </Select>
              <Select
                label="Environmental horizon"
                value={horizon}
                onChange={(e) => setHorizon(Number(e.target.value))}
              >
                {[1, 2, 4].map((h) => (
                  <option key={h} value={h}>
                    {h} week{h === 4 ? " (exploratory)" : ""}
                  </option>
                ))}
              </Select>
            </div>
            <div
              className="table-scroll"
              role="region"
              aria-label="Season and weather ablation metrics"
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
                    <th scope="col">Skill vs persistence % (95% CI)</th>
                    <th scope="col">Alert precision / recall</th>
                    <th scope="col">False positive rate</th>
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
                      <td>
                        {number(r.skillPercent, 2)} ({number(r.skill95?.low, 2)}{" "}
                        to {number(r.skill95?.high, 2)})
                      </td>
                      <td>
                        {percent(r.precision)} / {percent(r.recall)}
                      </td>
                      <td>{percent(r.falseAlarmRate)}</td>
                      <td>{percent(r.coverage80)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>
              Training-only choices through {lags.cutoff}: rainfall lag{" "}
              {lags.rain}, temperature lag {lags.temperature}, humidity lag{" "}
              {lags.humidity}, rainfall window {lags.rain_window} weeks. Lags
              are before the forecast origin, never future weather. Correlations
              are season-confounded, not causal.
            </p>
            <p>{data.metadata.features}</p>
            <p>{data.metadata.thermal}</p>
            <p>{data.metadata.calibration}</p>
            <h3>NASA POWER cross-check</h3>
            <p>
              {data.design.comparison.n} paired weeks: rainfall Pearson r{" "}
              {number(data.design.comparison.rainfall_r, 3)}, temperature r{" "}
              {number(data.design.comparison.temperature_r, 3)}. Weekly rainfall
              MAE {number(data.design.comparison.rainfall_mae_mm, 2)} mm;
              mean-temperature MAE{" "}
              {number(data.design.comparison.temperature_mae_c, 2)} Celsius.{" "}
              {data.design.comparison.time_caveat} Neither source is a rain
              gauge. ERA5 is about 25 km; NASA meteorology about 0.5 by 0.625
              degrees. One Manila point cannot resolve city or household
              weather.
            </p>
            <h3>Historical monthly profile</h3>
            <p>
              Sunday week-ending month, 2016-2023. This descriptive profile uses
              the test-period history too; it never selects forecasting lags or
              thresholds. It is not a measured rainy-onset response delay.
            </p>
            <div
              className="table-scroll"
              role="region"
              aria-label="Historical monthly case profile"
              tabIndex={0}
            >
              <table>
                <thead>
                  <tr>
                    <th scope="col">Month</th>
                    <th scope="col">Scorable weeks</th>
                    <th scope="col">Mean cases/week</th>
                    <th scope="col">Complete-row subset N</th>
                    <th scope="col">Complete-row mean</th>
                  </tr>
                </thead>
                <tbody>
                  {data.design.profile
                    .filter((r) => r.scenario === scenario)
                    .map((r) => (
                      <tr key={r.month}>
                        <th scope="row">{r.month}</th>
                        <td>{r.n}</td>
                        <td>{number(r.mean_cases, 2)}</td>
                        <td>{r.complete_n}</td>
                        <td>{number(r.complete_mean_cases, 2)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <h3>Primary threshold episode lead</h3>
            <div
              className="table-scroll"
              role="region"
              aria-label="Environmental alert episode lead"
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
                  {data.leads
                    .filter((r) => r.scenario === scenario)
                    .map((r) => (
                      <tr key={r.model}>
                        <th scope="row">{r.model}</th>
                        <td>{r.eligible_onsets}</td>
                        <td>{r.detected_onsets}</td>
                        <td>{number(r.mean_lead_weeks, 2)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <p>
              Both 1/2-week horizons; onset requires an observed previous
              below-threshold week. No outbreak diagnosis. Source: versioned
              ERA5, NASA POWER and Manila files; disease data ends December
              2023. Full alert F1/AUC/Brier, coefficients and figures are in
              docs/ENVIRONMENT_RESULTS.md and docs/figures.
            </p>
          </Card>
        );
      }}
    </ReadState>
  );
}
export function GeographyContext() {
  const resource = useResource("geography-v1", loadGeography),
    [show, setShow] = useState(false);
  return (
    <Card>
      <h2>Metro Manila context, not a prediction</h2>
      <p>
        Aedes aegypti mainly breeds in small standing-water containers near
        homes: drums, tires, pots and clogged drains. Flowing rivers are not its
        principal breeding habitat. Geographic proxies cannot identify a
        household at risk.
      </p>
      <button
        className="ui-button ui-button-secondary"
        type="button"
        aria-expanded={show}
        onClick={() => setShow(!show)}
      >
        {show ? "Hide" : "Show"} exploratory city context
      </button>
      {show && (
        <ReadState resource={resource}>
          {(data) => (
            <>
              <p>
                {data.metadata.period}. {data.metadata.vintage}
              </p>
              <p>{data.metadata.confounding}</p>
              <div
                className="table-scroll"
                role="region"
                aria-label="Exploratory geographic effect sizes"
                tabIndex={0}
              >
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Context feature</th>
                      <th scope="col">Cities</th>
                      <th scope="col">Spearman rho</th>
                      <th scope="col">95% bootstrap CI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.correlations.map((r) => (
                      <tr key={r.feature}>
                        <th scope="row">{r.feature.replaceAll("_", " ")}</th>
                        <td>{r.n}</td>
                        <td>{number(r.rho, 3)}</td>
                        <td>
                          {number(r.low, 3)} to {number(r.high, 3)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p>{data.metadata.ci}</p>
              <div
                className="table-scroll"
                role="region"
                aria-label="City geographic context values"
                tabIndex={0}
              >
                <table>
                  <thead>
                    <tr>
                      <th scope="col">City</th>
                      <th scope="col">Derived area km2</th>
                      <th scope="col">Population/km2 (unverified)</th>
                      <th scope="col">Within 200m / 500m mapped water</th>
                      <th scope="col">Centroid to river m</th>
                      <th scope="col">Sample mean elevation m</th>
                      <th scope="col">Samples below 5m</th>
                      <th scope="col">Sample N</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((r) => (
                      <tr key={r.city}>
                        <th scope="row">{r.city}</th>
                        <td>{number(r.area_km2, 2)}</td>
                        <td>{number(r.density_per_km2, 0)}</td>
                        <td>
                          {percent(r.water_share_200m)} /{" "}
                          {percent(r.water_share_500m)}
                        </td>
                        <td>{number(r.centroid_river_distance_m, 0)}</td>
                        <td>{number(r.sample_mean_elevation_m, 1)}</td>
                        <td>{percent(r.sample_share_below_5m)}</td>
                        <td>{r.elevation_sample_n}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p>{data.metadata.water}</p>
              <p>{data.metadata.elevation}</p>
              <p>{data.metadata.area}</p>
              <p>{data.metadata.omitted}</p>
              <p>
                <a
                  className="text-link"
                  href="https://www.openstreetmap.org/copyright"
                >
                  Copyright OpenStreetMap contributors; ODbL
                </a>
                . NASA/USGS SRTM via Open Topo Data. Official HDX/NAMRIA
                boundaries. Full scatterplots:
                docs/figures/geographic-context.png. No causal claim.
              </p>
            </>
          )}
        </ReadState>
      )}
    </Card>
  );
}
export function ProviderAttributions() {
  return (
    <Card>
      <h2>Environmental and geographic providers</h2>
      <p>
        <a
          className="text-link"
          href="https://open-meteo.com/en/docs/historical-weather-api"
        >
          Open-Meteo Historical API
        </a>
        : CC BY 4.0; contains modified Copernicus Climate Change Service
        information. ERA5 / ECMWF / Copernicus C3S reanalysis, about 0.25
        degrees, not station gauges. One Manila point only.
      </p>
      <p>
        <a
          className="text-link"
          href="https://data.nasa.gov/dataset/prediction-of-worldwide-energy-resources-power"
        >
          NASA POWER acknowledgement
        </a>
        : This data was obtained from the NASA Langley Research Center (LaRC)
        POWER Project funded through the NASA Earth Science/Applied Science
        Program.
      </p>
      <p>
        NASA GMAO MERRA-2 supplies POWER meteorology. The daily cross-check uses
        solar LST, which differs from a civil timezone. No per-city weather is
        presented as real.
      </p>
      <p>
        <a className="text-link" href="https://www.openstreetmap.org/copyright">
          Copyright OpenStreetMap contributors; Open Database License (ODbL)
        </a>
        . City water proximity is a contemporary mapped-water proxy, not a
        breeding-site survey.{" "}
        <a
          className="text-link"
          href="https://www.opentopodata.org/datasets/srtm/"
        >
          NASA/USGS SRTM90m via Open Topo Data
        </a>
        , public-domain USGS data; 500m systematic sample, not a flood model.
      </p>
      <p>
        City boundaries: NAMRIA / OCHA HDX COD-AB, CC BY 3.0 IGO, geometry dated
        February 2025. Derived polygon areas are checked geodesically; 2020
        population provenance remains unverified. Flood hazard and
        thermal-suitability curves are omitted because a usable licensed layer
        or verified parameterization was not established.
      </p>
      <p>
        <a
          className="text-link"
          href="https://www.pagasa.dost.gov.ph/information/climate-philippines"
        >
          PAGASA climate definition
        </a>
        : rainy June-November; dry December-May.{" "}
        <a
          className="text-link"
          href="https://www.cdc.gov/mosquitoes/about/life-cycle-of-aedes-mosquitoes.html/"
        >
          CDC Aedes life cycle
        </a>
        : container-breeding biology. These are context, not a prediction. Exact
        requests, retrieval dates and hashes: data/external/SOURCES.md.
      </p>
    </Card>
  );
}
