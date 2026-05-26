import { useState, useRef, useCallback } from "react";

interface Props {
  url: string;
  sourceName: string;
  originalUrl?: string;
}

export default function EmbedFrame({ url, sourceName, originalUrl }: Props) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleLoad = useCallback(() => {
    setLoading(false);
    setTimeout(() => {
      try {
        const doc = iframeRef.current?.contentDocument;
        if (doc && doc.body && doc.body.children.length === 0 && doc.body.innerText.trim() === "") {
          setError(true);
        }
      } catch { /* cross-origin, assume loaded */ }
    }, 800);
  }, []);

  const handleError = useCallback(() => {
    setLoading(false);
    setError(true);
  }, []);

  const fallbackUrl = originalUrl || url;

  return (
    <div style={{ position: "relative" }}>
      {loading && !error && (
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          background: "var(--bg-card)", zIndex: 10, minHeight: 300,
        }}>
          <svg style={{ width: 28, height: 28, animation: "spin-slow 1.2s linear infinite", color: "var(--text-muted)" }} viewBox="0 0 24 24">
            <circle style={{ opacity: 0.2 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3.5" />
            <path style={{ opacity: 0.7 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )}

      {error ? (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "2rem", background: "var(--bg-card)", borderRadius: "0 0 12px 12px",
          minHeight: 300, gap: "0.75rem",
        }}>
          <svg style={{ width: 40, height: 40, color: "var(--text-muted)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: 0 }}>该网站禁止嵌入播放</p>
          <p style={{ color: "var(--text-muted)", fontSize: "0.72rem", margin: 0 }}>（X-Frame-Options / CSP 限制）</p>
          <a
            href={fallbackUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.4rem",
              padding: "0.6rem 1.4rem", background: "var(--accent)", color: "#fff",
              fontWeight: 600, fontSize: "0.84rem", borderRadius: 8, textDecoration: "none",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--accent-hover)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--accent)"; }}
          >
            <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            点击跳转观看
          </a>
        </div>
      ) : (
        <iframe
          ref={iframeRef}
          src={url}
          title={sourceName}
          onLoad={handleLoad}
          onError={handleError}
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          style={{ width: "100%", minHeight: 400, background: "#000" }}
        />
      )}
    </div>
  );
}
