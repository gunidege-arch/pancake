import { useState, useRef, useCallback, useEffect } from "react";

interface Track {
  id: string;
  title: string;
  artist: string;
  cover_url?: string;
  audio_url: string;
  duration?: number;
  source_name: string;
}

interface LyricLine {
  time: number;
  text: string;
}

const API = "/api/music";

function parseLrc(lrc: string): LyricLine[] {
  const lines: LyricLine[] = [];
  const re = /\[(\d{2}):(\d{2})(?:[.:](\d{2,3}))?\]/g;
  for (const line of lrc.split("\n")) {
    const match = re.exec(line);
    if (match) {
      const min = parseInt(match[1]);
      const sec = parseInt(match[2]);
      const ms = parseInt((match[3] || "0").padEnd(3, "0"));
      const text = line.replace(re, "").trim();
      if (text) lines.push({ time: min * 60 + sec + ms / 1000, text });
    }
  }
  return lines;
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function MusicPage() {
  const [query, setQuery] = useState("");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [current, setCurrent] = useState<Track | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [showLyrics, setShowLyrics] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const lyricRef = useRef<HTMLDivElement>(null);
  const seekRef = useRef<HTMLInputElement>(null);

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
      if (!url) { setError("未获取到播放地址"); return; }
      setCurrent(track);
      setError("");
      setCurrentTime(0);
      setDuration(0);
      setLyrics([]);

      // Fetch lyrics
      fetch(`${API}/lyric?id=${encodeURIComponent(track.id)}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.lyric) setLyrics(parseLrc(d.lyric));
        })
        .catch(() => {});

      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play().catch(() => {});
        setPlaying(true);
      }
    } catch {
      setError("播放请求失败");
    }
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
    setPlaying(!playing);
  };

  const doSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = t;
      setCurrentTime(t);
    }
  };

  const activeLyricIdx = lyrics.reduce((best, l, i) => (currentTime >= l.time ? i : best), 0);

  useEffect(() => {
    if (lyricRef.current) {
      const el = lyricRef.current.children[activeLyricIdx] as HTMLElement;
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeLyricIdx, lyrics]);

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg-primary, #0a0a0a)", color: "var(--text-primary, #eee)" }}>
      {/* Search */}
      <div style={{ padding: "0.75rem 1rem", display: "flex", gap: "0.5rem", borderBottom: "1px solid var(--border, #1a1a1a)" }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && doSearch()}
          placeholder="搜索歌曲..."
          style={{
            flex: 1, padding: "0.5rem 0.8rem", borderRadius: 8,
            border: "1px solid var(--border, #222)", background: "var(--bg-secondary, #111)",
            color: "var(--text-primary, #eee)", fontSize: "0.9rem", outline: "none",
          }}
        />
        <button
          onClick={doSearch} disabled={loading}
          style={{
            padding: "0.5rem 1rem", borderRadius: 8, border: "none",
            background: "var(--accent, #6366f1)", color: "#fff", fontSize: "0.9rem", cursor: "pointer",
          }}
        >
          {loading ? "..." : "搜索"}
        </button>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Track list */}
        <div style={{ flex: 1, overflowY: "auto", borderRight: current ? "1px solid var(--border, #1a1a1a)" : "none" }}>
          {tracks.length === 0 && !loading && !error && (
            <div style={{ textAlign: "center", padding: "4rem 1rem", color: "var(--text-muted, #555)", fontSize: "0.9rem" }}>
              &#x266B; 搜索并播放歌曲
            </div>
          )}
          {error && (
            <div style={{ textAlign: "center", padding: "2rem 1rem", color: "var(--text-muted, #888)", fontSize: "0.85rem" }}>
              {error}
            </div>
          )}
          {tracks.map((t) => (
            <div
              key={t.id}
              onClick={() => doPlay(t)}
              style={{
                display: "flex", alignItems: "center", gap: "0.65rem", padding: "0.55rem 1rem",
                cursor: "pointer", background: current?.id === t.id ? "var(--bg-secondary, #1a1a1a)" : "transparent",
                borderLeft: current?.id === t.id ? "3px solid var(--accent, #6366f1)" : "3px solid transparent",
              }}
            >
              <div style={{ width: 38, height: 38, borderRadius: 6, overflow: "hidden", flexShrink: 0, background: "var(--bg-tertiary, #1a1a1a)" }}>
                {t.cover_url ? (
                  <img src={t.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", opacity: 0.25 }}>&#x266B;</div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {t.title}
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted, #888)", marginTop: 1 }}>
                  {t.artist}
                  <span style={{ marginLeft: "0.4rem", fontSize: "0.65rem", padding: "0.05rem 0.35rem", borderRadius: 4, background: "var(--bg-tertiary, #1a1a1a)" }}>
                    {t.source_name}
                  </span>
                </div>
              </div>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted, #666)" }}>{t.duration ? formatTime(t.duration) : ""}</span>
            </div>
          ))}
        </div>

        {/* Player panel */}
        {current && (
          <div style={{ width: 360, flexShrink: 0, display: "flex", flexDirection: "column", background: "var(--bg-secondary, #0d0d0d)" }}>
            {/* Toggle: cover / lyrics */}
            <div style={{ display: "flex", borderBottom: "1px solid var(--border, #1a1a1a)" }}>
              <button
                onClick={() => setShowLyrics(false)}
                style={{
                  flex: 1, padding: "0.5rem", border: "none", cursor: "pointer", fontSize: "0.8rem",
                  background: !showLyrics ? "var(--bg-primary, #0a0a0a)" : "transparent",
                  color: !showLyrics ? "var(--text-primary, #eee)" : "var(--text-muted, #666)",
                  borderBottom: !showLyrics ? "2px solid var(--accent, #6366f1)" : "2px solid transparent",
                }}
              >
                封面
              </button>
              <button
                onClick={() => setShowLyrics(true)}
                style={{
                  flex: 1, padding: "0.5rem", border: "none", cursor: "pointer", fontSize: "0.8rem",
                  background: showLyrics ? "var(--bg-primary, #0a0a0a)" : "transparent",
                  color: showLyrics ? "var(--text-primary, #eee)" : "var(--text-muted, #666)",
                  borderBottom: showLyrics ? "2px solid var(--accent, #6366f1)" : "2px solid transparent",
                }}
              >
                歌词
              </button>
            </div>

            {!showLyrics ? (
              /* Cover view */
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
                <div style={{
                  width: 220, height: 220, borderRadius: 12, overflow: "hidden", marginBottom: "1.5rem",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.4)", background: "var(--bg-tertiary, #1a1a1a)",
                }}>
                  {current.cover_url ? (
                    <img src={current.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: "3rem", opacity: 0.2 }}>&#x266B;</div>
                  )}
                </div>
                <div style={{ textAlign: "center", marginBottom: "0.25rem" }}>
                  <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>{current.title}</div>
                  <div style={{ fontSize: "0.82rem", color: "var(--text-muted, #999)", marginTop: "0.25rem" }}>{current.artist}</div>
                </div>

                {/* Progress */}
                <div style={{ width: "100%", marginTop: "1.25rem" }}>
                  <input
                    ref={seekRef}
                    type="range"
                    min={0}
                    max={duration || 1}
                    step={0.1}
                    value={currentTime}
                    onChange={doSeek}
                    style={{ width: "100%", accentColor: "var(--accent, #6366f1)" }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--text-muted, #888)", marginTop: "0.15rem" }}>
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Controls */}
                <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginTop: "0.75rem" }}>
                  <button onClick={togglePlay} style={{
                    width: 48, height: 48, borderRadius: "50%", border: "none",
                    background: "var(--accent, #6366f1)", color: "#fff", fontSize: "1.3rem",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {playing ? "⏸" : "▶"}
                  </button>
                </div>
              </div>
            ) : (
              /* Lyrics view */
              <div
                ref={lyricRef}
                style={{
                  flex: 1, overflowY: "auto", padding: "2rem 1.5rem",
                  maskImage: "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
                  WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
                }}
              >
                {lyrics.length === 0 && (
                  <div style={{ textAlign: "center", color: "var(--text-muted, #666)", padding: "3rem 0", fontSize: "0.85rem" }}>
                    暂无歌词
                  </div>
                )}
                {lyrics.map((l, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "0.4rem 0",
                      fontSize: i === activeLyricIdx ? "1.05rem" : "0.85rem",
                      fontWeight: i === activeLyricIdx ? 600 : 400,
                      color: i === activeLyricIdx ? "var(--accent, #6366f1)" : i < activeLyricIdx ? "var(--text-muted, #555)" : "var(--text-muted, #777)",
                      transition: "all 0.25s",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      if (audioRef.current) {
                        audioRef.current.currentTime = l.time;
                        setCurrentTime(l.time);
                      }
                    }}
                  >
                    {l.text}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <audio
        ref={audioRef}
        onTimeUpdate={() => {
          if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) setDuration(audioRef.current.duration);
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        style={{ display: "none" }}
      />
    </div>
  );
}
