import type { HTMLAttributes } from "react";
export function Card({
  className = "",
  interactive = false,
  ...props
}: HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return <div className={`ui-card index-card ${interactive || props.onClick ? "interactive-card" : ""} ${className}`} {...props} />;
}
