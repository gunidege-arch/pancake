import { useEffect, useState } from "react";
import { useMusic } from "../hooks/useMusic";
import MusicPlayer from "../components/MusicPlayer";
import SearchBar from "../components/SearchBar";
import BottomSheet from "../components/BottomSheet";

function fmtDuration(s: number) {
  if (!s || !isFinite(s)) return "";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function MusicPage() {
  const m = useMusic();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", url: "" });

  useEffect(() => { m.fetchSources(); }, [m.fetchSources]);

  const handleAdd = async () => {
    if (!addForm.name.trim() || !addForm.url.trim()) return;
    await m.addSource(addForm.name.trim(), addForm.url.trim());
    setAddForm({ name: "", url: "" });
  };

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {sidebarOpen && (
        <div className="settings-overlay" style={{ zIndex: 40 }} onClick={() => setSidebarOpen(false)} />
      )}

      <BottomSheet open={sidebarOpen} onClose={() => setSidebarOpen(false)}>
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
          <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600 }}>音源管理</h3>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.72rem", color: "var(--text-muted)" }}>
            添加音乐 API，支持 LX Music 音源格式
          </p>
        </div>
        <div style={{ padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <input
            className="search-input"
            placeholder="音源名称"
            value={addForm.name}
            onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))}
            style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: 8, fontSize: "0.82rem" }}
          />
          <input
            className="search-input"
            placeholder="API URL ({keyword} = 搜索词)"
            value={addForm.url}
            onChange={(e) => setAddForm((p) => ({ ...p, url: e.target.value }))}
            style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: 8, fontSize: "0.82rem" }}
          />
          <button
            className="search-btn"
            onClick={handleAdd}
            style={{ padding: "0.5rem 1rem", borderRadius: 8, fontSize: "0.82rem", cursor: "pointer" }}
          >
            添加音源
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "0.5rem 1.25rem" }}>
          {m.sources.length === 0 && (
            <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", textAlign: "center", padding: "1.5rem 0" }}>
              暂无音源，添加后即可搜索
            </p>
          )}
          {m.sources.map((s) => (
            <div key={s.id} className="settings-option" style={{ justifyContent: "space-between", padding: "0.6rem 0.75rem" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "0.82rem", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.api_url_template}</div>
              </div>
              {!s.is_builtin && (
                <button onClick={() => m.deleteSource(s.id)} style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", fontSize: "0.72rem", padding: "0.25rem 0.5rem", flexShrink: 0 }}>
                  删除
                </button>
              )}
            </div>
          ))}
        </div>
      </BottomSheet>

      <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflowY: "auto", paddingBottom: m.currentTrack ? 90 : 0 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: "0.5rem",
            padding: "0.75rem 1rem",
            paddingTop: "calc(3.5rem + env(safe-area-inset-top, 0px))",
          }}>
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label="Toggle sidebar"
              style={{
                width: 40, height: 40, minWidth: 40,
                display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: 20, border: "1px solid var(--border)", background: "var(--bg-card)",
                color: "var(--text-muted)", cursor: "pointer",
              }}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div style={{ width: "100%", maxWidth: 500 }}>
              <SearchBar onSearch={m.search} loading={m.loading} autoFocus={false} />
            </div>
          </div>

          {m.error && (
            <div style={{ padding: "0 1rem 0.5rem", textAlign: "center" }}>
              <span style={{ fontSize: "0.82rem", color: "var(--danger)" }}>{m.error}</span>
            </div>
          )}

          {m.loading && (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div className="music-visualizer">
                <span /><span /><span /><span /><span />
              </div>
            </div>
          )}

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
            </div>
          )}

          {!m.loading && !m.error && m.tracks.length === 0 && (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "3rem", marginBottom: "0.75rem", opacity: 0.6 }}>&#x266A;</div>
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: 0 }}>添加音源，搜索音乐</p>
                <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "0.25rem", opacity: 0.6 }}>
                  支持 LX Music 音源 API 格式
                </p>
              </div>
            </div>
          )}
        </div>
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
