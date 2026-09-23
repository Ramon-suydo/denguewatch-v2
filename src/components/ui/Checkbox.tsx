import { useId, type InputHTMLAttributes, type ReactNode } from "react";
export function Checkbox({
  label,
  id,
  error,
  className = "",
  "aria-describedby": describedBy,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: ReactNode;
  error?: string;
}) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  return (
    <div className={className}>
      <label className="dw-checkbox" htmlFor={fieldId}>
        <input
          {...props}
          id={fieldId}
          type="checkbox"
          aria-invalid={error ? true : props["aria-invalid"]}
          aria-describedby={
            [describedBy, error && `${fieldId}-error`]
              .filter(Boolean)
              .join(" ") || undefined
          }
        />
        <span>{label}</span>
      </label>
      {error && (
        <p className="dw-error" id={`${fieldId}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}
