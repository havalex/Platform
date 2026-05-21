import { useState, useCallback, useRef, useEffect } from 'react';

export function useToast() {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  const show = useCallback((message, kind = 'info') => {
    setToast({ message, kind });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  return { toast, show };
}

export function Toast({ toast }) {
  if (!toast) return null;
  const cls = toast.kind === 'ok' ? 'forge-toast-ok' : toast.kind === 'err' ? 'forge-toast-err' : 'forge-toast-info';
  return <div className={`forge-toast ${cls}`} role="status">{toast.message}</div>;
}
