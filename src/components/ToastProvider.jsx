import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

const ToastCtx = createContext(null);

/**
 * Minimal, dependency-free toast:
 * - bottom-right
 * - auto-dismiss
 * - no "OK" button
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const seq = useRef(1);

  const remove = useCallback((id) => {
    setToasts((xs) => xs.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((message, opts = {}) => {
    const id = seq.current++;
    const type = opts.type ?? "success"; // success | info | warn | error
    const ttl = Math.max(1200, Number(opts.ttl ?? 2200));

    setToasts((xs) => [...xs, { id, message, type }]);

    window.setTimeout(() => remove(id), ttl);
    return id;
  }, [remove]);

  const api = useMemo(() => ({ push }), [push]);

  return (
    <ToastCtx.Provider value={api}>
      {children}

      <div className="ngh-toast-stack" aria-live="polite" aria-relevant="additions">
        {toasts.map((t) => (
          <div key={t.id} className={`ngh-toast ngh-toast--${t.type}`} role="status">
            <div className="ngh-toast__dot" aria-hidden="true" />
            <div className="ngh-toast__msg">{t.message}</div>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const v = useContext(ToastCtx);
  if (!v) throw new Error("useToast must be used inside <ToastProvider>");
  return v;
}
