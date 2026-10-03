import { Link } from "react-router-dom";
import { Card } from "../components/ui";
import { PageHeader } from "../components/PageHeader";
import { DraftMark, PrivacyDraft, TermsDraft, ForecastDisclaimerDraft } from "../components/LegalDrafts";
import { SourceCitation } from "../components/SourceCitation";
import { publishedSources } from "../lib/source-metadata";
import { useAppData } from "../lib/resources";
export function Legal() {
  const { cities } = useAppData();
  return <><PageHeader eyebrow="REVIEW DRAFTS" title="Legal and privacy notices" description="Draft notices describing this research prototype and its current closed collection." />
    <div className="ui-container app-content narrow-content content-stack">
      <Card><nav aria-label="Legal sections"><a href="#privacy">Privacy</a>{" · "}<a href="#terms">Terms</a>{" · "}<a href="#forecast">Forecast disclaimer</a>{" · "}<a href="#sources">Sources</a>{" · "}<a href="#model">Model transparency</a>{" · "}<a href="#storage">Cookies/storage</a></nav></Card>
      <Card id="privacy"><PrivacyDraft /></Card><Card id="terms"><TermsDraft /></Card><Card id="forecast"><ForecastDisclaimerDraft /></Card>
      <Card id="sources"><DraftMark /><h2>Data Sources & Attribution</h2><p>DOH/FOI attribution fields await source-owner verification. Pending fields do not establish reuse permission.</p>{publishedSources.map(s => <section key={s.source}><h3>{s.label}</h3><SourceCitation source={s.source} /></section>)}</Card>
      <Card id="model"><DraftMark /><h2>Model Transparency</h2><p>The existing LGU model panel contains artifact-derived inputs, training/test windows, comparisons and limitations.</p>{cities.data?.[0] ? <Link className="text-link" to={"/city/" + cities.data[0].id + "#model-transparency-title"}>Open the existing model transparency panel</Link> : <Link to="/">Choose an LGU on the dashboard</Link>}</Card>
      <Card id="storage"><DraftMark /><h2>Cookie/Storage Notice</h2><p>The app sets no cookies and writes no localStorage or sessionStorage. The browser may cache public fonts, scripts and the demo snapshot. Report inputs and the original withdrawal code remain in memory for the current page/session; copying the code uses the clipboard only at your request. No tracking or consent banner is added. Provider technical logs are described in the Privacy Notice.</p></Card>
    </div></>;
}
