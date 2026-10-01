import { Link } from "react-router-dom";
import { Card } from "../components/ui";
import { PageHeader } from "../components/PageHeader";
import { MedicalNotice } from "../components/MedicalNotice";
export function Terms() {
  return (
    <>
      <PageHeader
        eyebrow="USING DENGUEWATCH"
        title="Terms with a clear purpose."
        description="A thesis/research application for understanding published history and voluntary community signals."
      />
      <div className="dw-container app-content narrow-content">
        <MedicalNotice />
        <Card className="prose">
          <h2>What this service is</h2>
          <p>
            DengueWatch is a thesis/research application. It is not an official
            Department of Health service, a clinical record, an emergency
            service, or an outbreak declaration system. Public dashboard access
            does not require an account.
          </p>
          <h3>Use historical data in context</h3>
          <p>
            Charts show supplied published observations, with their source
            dates, gaps, and quality limitations. Monthly and weekly series
            overlap; do not add them together. Daily Manila data is a separate
            source with different coverage. Incidence uses the source’s fixed
            2020 population.
          </p>
          <p>
            Forecasts are simple research estimates relative to each city’s
            historical distribution. They are not validated diagnoses,
            individual infection probabilities, or official warning thresholds.
            Old forecasts do not describe current conditions. Do not base health
            or emergency decisions on them.
          </p>
          <h3>Community participation</h3>
          <p>
            Reporting is optional and requires explicit consent to the{" "}
            <Link to="/report">participation notice</Link>. Submit only your own
            information, truthfully to the best of your knowledge. Do not submit
            someone else’s name, exact address, patient identifier, or contact
            information. Do not knowingly submit false reports, repeatedly
            submit the same report, or try to identify people from aggregate
            counts.
          </p>
          <p>
            All community reports remain unverified, including claims of clinic
            confirmation. They are kept separate from published surveillance and
            forecasts. Small weekly city counts are hidden; the public figures
            are not exact totals.
          </p>
          <h3>Retention, sharing, and withdrawal</h3>
          <p>
            Reports expire 90 days after submission and are removed by an hourly
            cleanup. We do not sell or share individual report content with
            third parties for their own use. Hosting providers process it for
            the app. Save your private reference code to withdraw a report
            through <Link to="/privacy#withdraw">Privacy</Link>. That page
            explains access, infrastructure, retention, and the deletion
            process.
          </p>
          <h3>Availability and research limits</h3>
          <p>
            Data may be incomplete, delayed, or unavailable. Submissions may
            pause for maintenance or when the daily report limit is reached.
            Optional research follow-up does not guarantee a reply.
            Public-health professionals and official advisories remain the
            appropriate sources for current clinical and emergency guidance.
          </p>
          <p>
            The notice version shown during consent applies to your submission.
            Material changes to collection or use require an updated notice;
            this app does not claim legal or clinical certification.
          </p>
        </Card>
      </div>
    </>
  );
}
