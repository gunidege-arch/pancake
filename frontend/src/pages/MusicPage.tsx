import { useState, useRef, useCallback } from "react";

interface Track {
  id: string;
  title: string;
  artist: string;
  cover_url?: string;
  audio_url: string;
  duration?: number;
  source_name: string;
}

const API = "/api/music";

export default function MusicPage() {
  const [query, setQuery] = useState("");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [current, setCurrent] = useState<Track | null>(null);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const doSearch = useCallback(async () => {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError("");
    try {
      const r = await fetch(`${API}/search?q=${encodeURIComponent(q)}`);
      if (!r.ok) throw new Error(r.statusText);
      const data = await r.json();
      setTracks(data.tracks || []);
      if (!data.tracks?.length) setError("没有找到结果");
    } catch (e: any) {
      setError(e.message || "搜索失败");
    } finally {
      setLoading(false);
    }
  }, [query]);

  const doPlay = useCallback(async (track: Track) => {
    try {
      const r = await fetch(`${API}/play?id=${encodeURIComponent(track.id)}`);
      const data = await r.json();
      const url = data.url;
      if (!url) {
        setError("未获取到播放地址");
        return;
      }
      setCurrent(track);
      setError("");
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play().catch(() => {});
        setPlaying(true);
      }
    } catch {
      setError("播放请求失败");
    }
  }, []);

  const formatTime = (s?: number) => {
    if (!s) return "--:--";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg-primary, #111)" }}>
      {/* Header / Search */}
      <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border, #222)" }}>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doSearch()}
            placeholder="搜索歌曲..."
            style={{
              flex: 1,
              padding: "0.6rem 0.9rem",
              borderRadius: "8px",
              border: "1px solid var(--border, #333)",
              background: "var(--bg-secondary, #1a1a1a)",
              color: "var(--text-primary, #eee)",
              fontSize: "0.95rem",
              outline: "none",
            }}
          />
          <button
            onClick={doSearch}
            disabled={loading}
            style={{
              padding: "0.6rem 1.2rem",
              borderRadius: "8px",
              border: "none",
              background: "var(--accent, #6366f1)",
              color: "#fff",
              fontSize: "0.95rem",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {loading ? "..." : "搜索"}
          </button>
        </div>
        {error && (
          <p style={{ color: "var(--text-muted, #999)", fontSize: "0.82rem", margin: "0.5rem 0 0" }}>{error}</p>
        )}
      </div>

      {/* Results */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0.5rem 0" }}>
        {tracks.map((t) => (
          <div
            key={t.id}
            onClick={() => doPlay(t)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.6rem 1.25rem",
              cursor: "pointer",
              borderRadius: 0,
              background: current?.id === t.id ? "var(--bg-secondary, #1a1a1a)" : "transparent",
              transition: "background 0.15s",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 6,
                overflow: "hidden",
                flexShrink: 0,
                background: "var(--bg-tertiary, #222)",
              }}
            >
              {t.cover_url ? (
                <img src={t.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", opacity: 0.3 }}>
                  &#x266B;
                </div>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "0.92rem", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "var(--text-primary, #eee)" }}>
                {t.title}
              </div>
              <div style={{ fontSize: "0.77rem", color: "var(--text-muted, #999)", marginTop: "0.15rem" }}>
                {t.artist}
                <span style={{
                  marginLeft: "0.5rem",
                  padding: "0.1rem 0.4rem",
                  borderRadius: 4,
                  background: "var(--bg-tertiary, #222)",
                  fontSize: "0.68rem",
                }}>
                  {t.source_name}
                </span>
              </div>
            </div>
            <div style={{ color: "var(--text-muted, #666)", fontSize: "0.75rem", flexShrink: 0 }}>
              {formatTime(t.duration)}
            </div>
          </div>
        ))}
        {tracks.length === 0 && !loading && !error && (
          <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted, #666)", fontSize: "0.9rem" }}>
            &#x1F3B5; 输入关键词开始搜索
          </div>
        )}
      </div>

      {/* Player bar */}
      {current && (
        <div
          style={{
            padding: "0.75rem 1.25rem",
            borderTop: "1px solid var(--border, #222)",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            background: "var(--bg-secondary, #181818)",
          }}
        >
          <div style={{ width: 40, height: 40, borderRadius: 6, overflow: "hidden", flexShrink: 0, background: "var(--bg-tertiary, #222)" }}>
            {current.cover_url ? (
              <img src={current.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", opacity: 0.3 }}>&#x266B;</div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "var(--text-primary, #eee)" }}>
              {current.title}
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted, #999)" }}>{current.artist}</div>
          </div>
          <button
            onClick={() => {
              if (audioRef.current) {
                if (playing) {
                  audioRef.current.pause();
                } else {
                  audioRef.current.play().catch(() => {});
                }
                setPlaying(!playing);
              }
            }}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              border: "none",
              background: "var(--accent, #6366f1)",
              color: "#fff",
              fontSize: "1rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {playing ? "⏸" : "▶"}
          </button>
        </div>
      )}

      <audio
        ref={audioRef}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        style={{ display: "none" }}
      />
    </div>
  );
}
