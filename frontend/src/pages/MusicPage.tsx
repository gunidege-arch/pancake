import { useState, useEffect } from "react";

export default function MusicPage() {
  const [lxserverUrl, setLxserverUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/music/lxserver")
      .then((r) => r.json())
      .then((d) => setLxserverUrl(d.url || ""))
      .catch(() => setLxserverUrl(""));
  }, []);

  if (lxserverUrl === null) {
    return (
      <div style={{ height: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="music-visualizer">
          <span /><span /><span /><span /><span />
        </div>
      </div>
    );
  }

  if (!lxserverUrl) {
    return (
      <div style={{ height: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "3.5rem", marginBottom: "0.75rem", opacity: 0.5 }}>&#x266B;</div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: 0, fontWeight: 500 }}>音乐服务未配置</p>
          <p style={{ color: "var(--text-muted)", fontSize: "0.72rem", marginTop: "0.25rem", opacity: 0.5 }}>
            请在后端设置 LXSERVER_URL 环境变量
          </p>
        </div>
      </div>
    );
  }

  return (
    <iframe
      src={lxserverUrl + "/music"}
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
