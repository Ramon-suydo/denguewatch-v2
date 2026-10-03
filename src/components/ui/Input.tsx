import { useId, type InputHTMLAttributes } from "react";
export function Input({
  label,
  hint,
  error,
  id,
  className = "",
  "aria-describedby": describedBy,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
}) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const description =
    [describedBy, hint && `${fieldId}-hint`, error && `${fieldId}-error`]
      .filter(Boolean)
      .join(" ") || undefined;
  return (
    <div className={`ui-field ${className}`}>
      <label htmlFor={fieldId}>{label}</label>
      <input
        {...props}
        id={fieldId}
        aria-invalid={error ? true : props["aria-invalid"]}
        aria-describedby={description}
      />
      {hint && (
        <p id={`${fieldId}-hint`} className="ui-hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${fieldId}-error`} className="ui-error">
          {error}
        </p>
      )}
    </div>
  );
}
