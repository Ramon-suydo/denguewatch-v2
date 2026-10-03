import { Link } from "react-router-dom";
import type { CommunityPolicy } from "../lib/types";
export function ParticipationNotice({ policy }: { policy: CommunityPolicy }) {
  return (
    <div className="prose">
      <h2>Before you choose to report</h2>
      <p>Draft for review. Not legal advice. Version community-v1 · 2026-10-03. Final launch retention/controller details await review in <Link to="/legal#privacy">Privacy</Link>.</p>
      <p>
        Participation is voluntary. This is a thesis/research application, not
        an official Department of Health service. A report is a self-reported
        community signal, even if you say a clinic confirmed it.
      </p>
      <h3>What we collect and why</h3>
      <p>
        If reporting opens after review, we would ask for your city or municipality, report date, and self-reported
        status to study broad patterns. Barangay text is optional. We record
        your consent version and submission time. Please do not enter names,
        exact addresses, patient numbers, or other people’s details.
      </p>
      <p>
        You may separately opt in to research follow-up and provide an email
        address or phone number. It is not required, never shown publicly, and
        does not create a medical service or a promise of a reply.
      </p>
      <h3>What is public</h3>
      <p>
        Only city-level weekly counts of at least five reports are shown.
        Smaller counts are hidden. Individual status, barangay, contact details,
        exact report dates, and reference codes are never published. Aggregation
        reduces disclosure risk but cannot guarantee anonymity.
      </p>
      <h3>Retention and your control</h3>
      <p>
        The existing setting expires reports after {policy.retention_days} days after submission and leave
        public aggregates immediately at expiry. An hourly cleanup removes
        expired database rows. Until then, your secret reference code lets you
        withdraw your report and immediately clear optional contact and barangay
        text.
      </p>
      <p>
        We do not sell or share individual report content with third parties for
        their own use. Supabase stores it for the research application; only
        appointed research administrators may read it. See{" "}
        <Link to="/privacy">Privacy</Link> for infrastructure and deletion
        details.
      </p>
      <p>
        Research-team contact:{" "}
        {policy.contact_email ? (
          <a href={"mailto:" + policy.contact_email}>{policy.contact_email}</a>
        ) : (
          "Awaiting publication. New submissions remain closed until a contact is available."
        )}
      </p>
    </div>
  );
}
