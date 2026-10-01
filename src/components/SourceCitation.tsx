import { Link } from "react-router-dom";
import { citationFields, sourceMetadata, CITATION_PENDING, PENDING } from "../lib/source-metadata";

export function SourceCitation({ source }: { source: string }) {
  const metadata = sourceMetadata[source];
  const pending = !metadata || Object.values(metadata).some(value => value === PENDING);
  return (
    <div className="prose">
      {pending && <p>{CITATION_PENDING}</p>}
      <dl>
        {Object.entries(citationFields).map(([field, label]) => {
          const value = metadata?.[field as keyof typeof citationFields] ?? PENDING;
          return <div key={field}>
            <dt><strong>{label}</strong></dt>
            <dd>{field === "url" && /^https?:\/\//i.test(value)
              ? <a className="text-link" href={value} target="_blank" rel="noreferrer">Open source</a>
              : value}</dd>
          </div>;
        })}
      </dl>
      <Link className="text-link" to="/data-sources">Data & Sources</Link>
    </div>
  );
}
