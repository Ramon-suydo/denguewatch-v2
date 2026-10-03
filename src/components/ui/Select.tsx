import { useId, type SelectHTMLAttributes } from "react";
export function Select({
  label,
  id,
  error,
  className = "",
  "aria-describedby": describedBy,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
}) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  return (
    <div className={`ui-field ${className}`}>
      <label htmlFor={fieldId}>{label}</label>
      <select
        {...props}
        id={fieldId}
        aria-invalid={error ? true : props["aria-invalid"]}
        aria-describedby={
          [describedBy, error && `${fieldId}-error`]
            .filter(Boolean)
            .join(" ") || undefined
        }
      />
      {error && (
        <p className="ui-error" id={`${fieldId}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}
