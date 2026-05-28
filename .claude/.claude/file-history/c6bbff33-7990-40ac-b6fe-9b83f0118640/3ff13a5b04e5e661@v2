import { useEffect, useState } from "react";

interface ToastData {
  message: string;
  id: number;
}

let _pushToast: ((msg: string) => void) | null = null;

/** Call from anywhere to show a toast. */
export function showToast(message: string) {
  _pushToast?.(message);
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  useEffect(() => {
    _pushToast = (msg: string) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { message: msg, id }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 2200);
    };
    return () => { _pushToast = null; };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "calc(2rem + env(safe-area-inset-bottom, 0px))",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9998,
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="toast-item"
          style={{
            background: "rgba(30,30,40,.92)",
            backdropFilter: "blur(12px)",
            color: "#fff",
            padding: "0.6rem 1.2rem",
            borderRadius: 20,
            fontSize: "0.82rem",
            fontWeight: 500,
            boxShadow: "0 4px 20px rgba(0,0,0,.4)",
            border: "1px solid rgba(255,255,255,.08)",
            whiteSpace: "nowrap",
          }}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
