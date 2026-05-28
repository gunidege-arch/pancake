import { useEffect, useCallback, useState } from "react";
import { useSearch, useSources } from "./hooks/useSearch";
import SearchBar from "./components/SearchBar";
import SourceManager from "./components/SourceManager";
import ResultPanel from "./components/ResultPanel";
import SplashScreen from "./components/SplashScreen";

/* ── Settings types ─────────────────────────────────────── */
type Theme = "dark" | "light";
type Columns = "2" | "3" | "4";

interface Settings {
  theme: Theme;
  columns: Columns;
}

const DEFAULT_SETTINGS: Settings = { theme: "dark", columns: "2" };

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem("pancake-settings");
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULT_SETTINGS;
}

function saveSettings(s: Settings) {
  localStorage.setItem("pancake-settings", JSON.stringify(s));
}

/* ── Toggle Switch ──────────────────────────────────────── */
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="toggle-switch">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-track">
        <span className="toggle-thumb" />
      </span>
    </label>
  );
}

/* ── Settings Panel ──────────────────────────────────────── */
function SettingsPanel({
  settings,
  onUpdate,
  onClose,
}: {
  settings: Settings;
  onUpdate: (s: Settings) => void;
  onClose: () => void;
}) {
  const columnsOptions: { value: Columns; label: string }[] = [
    { value: "2", label: "2 列" },
    { value: "3", label: "3 列 (平板)" },
    { value: "4", label: "4 列 (桌面)" },
  ];

  return (
    <>
      <div className="settings-overlay" onClick={onClose} />
      <div className="settings-panel">
        {/* header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>设置</h2>
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, color: "var(--text-secondary)", background: "none", border: "none", cursor: "pointer", transition: "color 0.15s, background 0.15s" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-card)"; e.currentTarget.style.color = "var(--text-primary)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--text-secondary)"; }}
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* 外观 */}
          <div className="settings-section">
            <div style={{ padding: "0.65rem 1rem", borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>外观</span>
            </div>

            <div className="settings-option">
              <div>
                <div className="settings-option-label">深色模式</div>
                <div className="settings-option-desc">切换暗色 / 亮色主题</div>
              </div>
              <Toggle
                checked={settings.theme === "dark"}
                onChange={(v) => onUpdate({ ...settings, theme: v ? "dark" : "light" })}
              />
            </div>

            <div className="settings-option">
              <div>
                <div className="settings-option-label">搜索结果列数</div>
                <div className="settings-option-desc">控制每行显示的结果数量</div>
              </div>
              <select
                className="settings-select"
                value={settings.columns}
                onChange={(e) => onUpdate({ ...settings, columns: e.target.value as Columns })}
              >
                {columnsOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 关于 */}
          <div className="settings-section">
            <div style={{ padding: "0.65rem 1rem", borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>关于</span>
            </div>
            <div className="settings-option">
              <div>
                <div className="settings-option-label">别问了自己搜</div>
                <div className="settings-option-desc">版本 1.0.0 · 多源聚合小工具 🌸</div>
              </div>
            </div>
            <a
              className="settings-option"
              href="https://github.com/pancake"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div>
                <div className="settings-option-label">GitHub</div>
                <div className="settings-option-desc">查看项目源码</div>
              </div>
              <svg width="14" height="14" fill="none" stroke="var(--text-muted)" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   APP
   ═══════════════════════════════════════════════════════════ */
export default function App() {
  const { query, results, loading, error, search } = useSearch();
  const { sources, fetchSources, addSource, deleteSource } = useSources();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => { fetchSources(); }, [fetchSources]);

  /* persist settings */
  useEffect(() => { saveSettings(settings); }, [settings]);

  /* apply theme to body */
  useEffect(() => {
    document.body.style.background = settings.theme === "dark" ? "#0d0d12" : "#f5f6f8";
    document.body.style.color = settings.theme === "dark" ? "#ececf1" : "#1f2937";
  }, [settings.theme]);

  const handleSearch = useCallback((q: string) => { search(q); }, [search]);

  return (
    <>
      <SplashScreen />
      <div style={{ display: "flex", height: "100dvh", overflow: "hidden" }}>
      {/* ── Mobile hamburger ─────────────────────────── */}
      <button
        style={{
          position: "fixed", top: 10, left: 10, zIndex: 50,
          width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center",
          borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg-card)",
          color: "var(--text-secondary)", cursor: "pointer",
        }}
        className="lg:hidden"
        onClick={() => setSidebarOpen((v) => !v)}
        aria-label="Toggle sidebar"
      >
        {sidebarOpen ? (
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* ── Sidebar overlay (mobile) ──────────────────── */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay lg:hidden"
          style={{ position: "fixed", inset: 0, zIndex: 40 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ───────────────────────────────────── */}
      <aside
        className="sidebar"
        style={{
          position: sidebarOpen ? "fixed" : "fixed",
          left: sidebarOpen ? 0 : -288,
          top: 0,
          bottom: 0,
          width: 272,
          zIndex: 45,
          display: "flex",
          flexDirection: "column",
          padding: "1rem 0.875rem",
          gap: "0.875rem",
          transition: "left 0.2s cubic-bezier(.4,0,.2,1)",
        }}
      >
        {/* Brand */}
        <div style={{ padding: "0.25rem 0.25rem 0.5rem", position: "relative" }}>
          {/* decorative sparkles */}
          <span style={{ position: "absolute", top: -2, left: 8, fontSize: "0.55rem", opacity: .7, pointerEvents: "none" }}>✦</span>
          <span style={{ position: "absolute", top: 4, right: 14, fontSize: "0.45rem", opacity: .5, pointerEvents: "none" }}>✧</span>
          <span style={{ position: "absolute", bottom: 0, left: "40%", fontSize: "0.4rem", opacity: .4, pointerEvents: "none" }}>·</span>

          <h1 style={{
            margin: 0,
            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.25rem",
            fontFamily: "'ZCOOL XiaoWei', 'Ma Shan Zheng', 'Noto Serif SC', cursive, serif",
            fontWeight: 400,
            letterSpacing: "0.05em",
          }}>
            <span style={{ fontSize: "0.75rem", display: "inline-block", animation: "none" }}>🌸</span>
            <span style={{
              fontSize: "0.88rem",
              background: "linear-gradient(135deg, #ff85a2 0%, #fb7299 40%, #ff6090 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textShadow: "0 0 12px rgba(251,114,153,.25)",
              filter: "drop-shadow(0 1px 2px rgba(251,114,153,.2))",
            }}>别问了自己搜</span>
            <span style={{ fontSize: "0.75rem", display: "inline-block" }}>🌸</span>
          </h1>

          {/* lace-like divider */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem",
            marginTop: "0.3rem",
          }}>
            <span style={{ width: 20, height: 1, background: "linear-gradient(90deg, transparent, rgba(251,114,153,.35))" }} />
            <span style={{ fontSize: "0.4rem", color: "rgba(251,114,153,.4)", lineHeight: 1 }}>♡</span>
            <span style={{ width: 20, height: 1, background: "linear-gradient(90deg, rgba(251,114,153,.35), transparent)" }} />
          </div>
        </div>

        {/* Source Manager */}
        <SourceManager sources={sources} onAdd={addSource} onDelete={deleteSource} />

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Settings button */}
        <button
          onClick={() => setSettingsOpen(true)}
          style={{
            display: "flex", alignItems: "center", gap: "0.6rem",
            padding: "0.6rem 0.75rem", borderRadius: 10,
            background: "var(--bg-card)", border: "1px solid var(--border)",
            color: "var(--text-secondary)", cursor: "pointer",
            fontSize: "0.84rem", fontWeight: 500,
            transition: "background 0.15s, color 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-card-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--bg-card)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
        >
          <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          设置
        </button>
      </aside>

      {/* ── Settings panel ────────────────────────────── */}
      {settingsOpen && (
        <SettingsPanel
          settings={settings}
          onUpdate={setSettings}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {/* ── Main content ──────────────────────────────── */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          marginLeft: 0,
          overflowY: "auto",
        }}
      >
        {/* Search area */}
        <div style={{
          padding: "0.75rem 1rem",
          paddingTop: "3.5rem",
          display: "flex",
          justifyContent: "center",
        }}>
          <div style={{ width: "100%", maxWidth: 540 }}>
            <SearchBar onSearch={handleSearch} loading={loading} />
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{ padding: "0 1rem 0.5rem", textAlign: "center" }}>
            <span style={{ fontSize: "0.82rem", color: "var(--danger)" }}>{error}</span>
          </div>
        )}

        {/* Results */}
        {results && (
          <div style={{ flex: 1, overflowY: "auto", padding: "0.5rem 1rem 2rem" }}>
            <ResultPanel results={results.results} query={query} columns={settings.columns} />
          </div>
        )}

        {/* Empty state */}
        {!results && !loading && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "3rem", marginBottom: "0.75rem", opacity: .6 }}>&#128270;</div>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: 0 }}>🌸 输入关键词，别问了自己搜～</p>
              <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "0.25rem", opacity: .6 }}>
                支持视频识别、内容提取、嵌入式预览
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
    </>
  );
}
