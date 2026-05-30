import { useMusic } from "../hooks/useMusic";
import MusicPlayer from "../components/MusicPlayer";
import SearchBar from "../components/SearchBar";

function fmtDuration(s: number) {
  if (!s || !isFinite(s)) return "";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function MusicPage() {
  const m = useMusic();

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflowY: "auto", paddingBottom: m.currentTrack ? 90 : 0 }}>
        {/* Top bar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "0.75rem 1rem",
          paddingTop: "calc(3.5rem + env(safe-area-inset-top, 0px))",
        }}>
          <div style={{ width: "100%", maxWidth: 500 }}>
            <SearchBar onSearch={m.search} loading={m.loading} autoFocus={false} />
          </div>
        </div>

        {/* Error */}
        {m.error && (
          <div style={{ padding: "0 1rem 0.5rem", textAlign: "center" }}>
            <span style={{ fontSize: "0.82rem", color: "var(--danger)" }}>{m.error}</span>
          </div>
        )}

        {/* Loading */}
        {m.loading && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div className="music-visualizer">
              <span /><span /><span /><span /><span />
            </div>
          </div>
        )}

        {/* Resolving URL indicator */}
        {m.resolvingUrl && (
          <div style={{ padding: "0.25rem 1rem", textAlign: "center" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>获取播放链接...</span>
          </div>
        )}

        {/* Track list */}
        {!m.loading && m.tracks.length > 0 && (
          <div style={{ flex: 1, overflowY: "auto", padding: "0 1rem 2rem" }}>
            <div className="music-track-list">
              {m.tracks.map((track) => (
                <button
                  key={track.id}
                  className={`music-track-item ${m.currentTrack?.id === track.id ? "active" : ""}`}
                  onClick={() => m.play(track)}
                >
                  <div className="music-track-cover-wrap">
                    {track.cover_url ? (
                      <img src={track.cover_url} alt="" className="music-track-cover" />
                    ) : (
                      <div className="music-track-cover-placeholder">
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" opacity={0.3}>
                          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                        </svg>
                      </div>
                    )}
                    {m.currentTrack?.id === track.id && m.isPlaying && (
                      <div className="music-track-playing-overlay">
                        <div className="music-visualizer small">
                          <span /><span /><span />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="music-track-info">
                    <div className="music-track-title">{track.title}</div>
                    <div className="music-track-artist">{track.artist || "未知歌手"} · {track.source_name}</div>
                  </div>
                  <span className="music-track-duration">{fmtDuration(track.duration || 0)}</span>
                </button>
              ))}
            </div>

            <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", opacity: 0.5 }}>
                数据来源：网易云 · QQ音乐 · 酷狗
              </span>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!m.loading && !m.error && m.tracks.length === 0 && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "3.5rem", marginBottom: "0.75rem", opacity: 0.5 }}>&#x266B;</div>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: 0, fontWeight: 500 }}>搜索你想听的音乐</p>
              <p style={{ color: "var(--text-muted)", fontSize: "0.72rem", marginTop: "0.25rem", opacity: 0.5 }}>
                网易云 · QQ音乐 · 酷狗 全平台搜索
              </p>
            </div>
          </div>
        )}
      </div>

      <MusicPlayer
        track={m.currentTrack}
        isPlaying={m.isPlaying}
        currentTime={m.currentTime}
        duration={m.duration}
        volume={m.volume}
        onToggle={m.togglePlay}
        onSeek={m.seek}
        onVolume={m.setVolume}
        onPrev={m.playPrev}
        onNext={m.playNext}
      />
    </div>
  );
}
