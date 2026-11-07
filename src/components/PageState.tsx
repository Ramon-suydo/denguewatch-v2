import type { ReactNode } from "react";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import type { Resource } from "../lib/resources";
export function Loading({ label = "Loading data…" }: { label?: string }) {
  return (
    <div className="data-state" role="status">
      <span className="loading-dot" aria-hidden="true" />
      {label}
    </div>
  );
}
export function ErrorState({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  return (
    <Card className="data-state">
      <p role="alert">{message}</p>
      {retry && (
        <Button variant="secondary" onClick={retry}>
          Try again
        </Button>
      )}
    </Card>
  );
}
export function ReadState<T>({
  resource,
  children,
}: {
  resource: Resource<T>;
  children: (data: T) => ReactNode;
}) {
  if (resource.loading) return <Loading />;
  if (resource.error || resource.data === null)
    return (
      <ErrorState
        message={resource.error ?? "Data is unavailable."}
        retry={resource.retry}
      />
    );
  return <>{children(resource.data)}</>;
}
