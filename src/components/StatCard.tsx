import type { ReactNode } from "react";
import { Card } from "./ui";
export function StatCard({
  label,
  value,
  detail,
  annotation,
}: {
  label: string;
  value: string;
  detail: string;
  annotation?: ReactNode;
}) {
  return (
    <Card className="stat-card">
      <h2 className="stat-label">{label}</h2>
      <p className="stat-value">{value}</p>
      <p className="stat-detail">{detail}</p>
      {annotation && <div className="stat-annotation">{annotation}</div>}
    </Card>
  );
}
