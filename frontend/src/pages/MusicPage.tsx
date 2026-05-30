import { useState, useEffect } from "react";

export default function MusicPage() {
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch("/music", { method: "HEAD" })
      .then((r) => { if (r.ok) setReady(true); })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  if (checking) {
    return (
      <div style={{ height: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="music-visualizer">
          <span /><span /><span /><span /><span />
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div style={{ height: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "3.5rem", marginBottom: "0.75rem", opacity: 0.5 }}>&#x266B;</div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: 0, fontWeight: 500 }}>音乐服务未就绪</p>
          <p style={{ color: "var(--text-muted)", fontSize: "0.72rem", marginTop: "0.25rem", opacity: 0.5 }}>
            请确保 lxserver 已正确部署
          </p>
        </div>
      </div>
    );
  }

  return (
    <iframe
      src="/music"
      style={{
        width: "100%",
        height: "100dvh",
        border: "none",
        display: "block",
      }}
      title="音乐播放器"
      allow="autoplay"
    />
  );
}
