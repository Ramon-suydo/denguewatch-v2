import { createContext, useContext, useState, type ReactNode } from "react";
import { Button } from "./Button";
const ToastContext = createContext<((message: string) => void) | null>(null);
export function Toast({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  return (
    <div className="ui-toast">
      <span>{message}</span>
      <Button
        variant="ghost"
        aria-label="Dismiss notification"
        onClick={onDismiss}
      >
        ✕
      </Button>
    </div>
  );
}
export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("");
  return (
    <ToastContext.Provider value={setMessage}>
      {children}
      <div
        className="toast-region"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {message && (
          <Toast message={message} onDismiss={() => setMessage("")} />
        )}
      </div>
    </ToastContext.Provider>
  );
}
export function useToast() {
  const toast = useContext(ToastContext);
  if (!toast) throw new Error("useToast requires ToastProvider");
  return toast;
}
