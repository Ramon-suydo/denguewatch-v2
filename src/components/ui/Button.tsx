import type { ButtonHTMLAttributes } from "react";
export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
}) {
  return (
    <button
      type={type}
      className={`dw-button dw-button-${variant} ${className}`}
      {...props}
    />
  );
}
