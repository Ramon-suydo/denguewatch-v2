import type { HTMLAttributes } from "react";
// Neutral metadata only; risk and provenance have separate components.
export function Badge({
  className = "",
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return <span className={`dw-badge ${className}`} {...props} />;
}
