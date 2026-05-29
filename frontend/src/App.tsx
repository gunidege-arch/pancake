import { useEffect, useCallback, useState } from "react";
import { useSearch, useSources } from "./hooks/useSearch";
import { useBookmarks } from "./hooks/useBookmarks";
import SearchBar from "./components/SearchBar";
import SourceManager from "./components/SourceManager";
import ResultPanel from "./components/ResultPanel";
import BookmarksPanel from "./components/BookmarksPanel";
import ToastContainer from "./components/Toast";
import SplashScreen from "./components/SplashScreen";

import NavContent from "./components/NavContent";
import BottomSheet from "./components/BottomSheet";

/* ── Settings types ─────────────────────────────────────── */
type Theme = "dark" | "light";
type Columns = "2" | "3" | "4";
type ViewMode = "auto" | "mobile";
type LayoutMode = "sidebar" | "bottom-sheet";

interface Settings {
  theme: Theme;
  columns: Columns;
  viewMode: ViewMode;
  layoutMode: LayoutMode;
}

const DEFAULT_SETTINGS: Settings = { theme: "dark", columns: "2", viewMode: "auto", layoutMode: "bottom-sheet" };

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

            <div className="settings-option">
              <div>
                <div className="settings-option-label">手机视图</div>
                <div className="settings-option-desc">固定为手机宽度，仿真 App 体验</div>
              </div>
              <Toggle
                checked={settings.viewMode === "mobile"}
                onChange={(v) => onUpdate({ ...settings, viewMode: v ? "mobile" : "auto" })}
              />
            </div>

            <div className="settings-option">
              <div>
                <div className="settings-option-label">导航布局</div>
                <div className="settings-option-desc">选择侧边栏或底部抽屉模式</div>
              </div>
            </div>
            <div className="settings-option" style={{ flexDirection: "column", alignItems: "stretch", gap: "0.35rem", paddingTop: "0.4rem" }}>
              {([
                { value: "bottom-sheet" as LayoutMode, label: "底部抽屉", desc: "从底部滑出，适合单手操作" },
                { value: "sidebar" as LayoutMode, label: "侧边栏", desc: "左侧导航，桌面端更高效" },
              ]).map((opt) => (
                <label
                  key={opt.value}
                  className={`layout-radio ${settings.layoutMode === opt.value ? "layout-radio-active" : ""}`}
                >
                  <input
                    type="radio"
                    name="layoutMode"
                    checked={settings.layoutMode === opt.value}
                    onChange={() => onUpdate({ ...settings, layoutMode: opt.value })}
                  />
                  <div>
                    <div style={{ fontSize: "0.82rem" }}>{opt.label}</div>
                    <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: 1 }}>{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 关于 */}
          <div className="settings-section">
            <div style={{ padding: "0.65rem 1rem", borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>关于</span>
            </div>
            <div className="settings-option">
              <div>
                <div className="settings-option-label" style={{ fontFamily: "'Cinzel Decorative', 'ZCOOL XiaoWei', 'Noto Serif SC', serif", fontSize: "0.92rem", letterSpacing: "0.06em" }}>
                  作者：高冷的菜煎饼
                </div>
              </div>
            </div>
            <a
              className="settings-option"
              href="mailto:gunidege@gmail.com"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div>
                <div className="settings-option-label">意见反馈</div>
                <div className="settings-option-desc">gunidege@gmail.com</div>
              </div>
              <svg width="15" height="15" fill="none" stroke="var(--text-muted)" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
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
  const [splashDone, setSplashDone] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [bookmarksOpen, setBookmarksOpen] = useState(false);
  const { bookmarks, isBookmarked, toggleBookmark, removeBookmark } = useBookmarks();

  useEffect(() => { fetchSources(); }, [fetchSources]);

  /* register service worker for PWA */
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

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
      <SplashScreen onDismissed={() => setSplashDone(true)} />
      {/* ── Mobile view wrapper ──────────────────────────── */}
      {splashDone && (
      <div
        style={
          settings.viewMode === "mobile"
            ? {
                maxWidth: 430,
                margin: "0 auto",
                height: "100dvh",
                overflow: "hidden",
                borderLeft: "1px solid var(--border)",
                borderRight: "1px solid var(--border)",
                boxShadow: "0 0 60px rgba(0,0,0,.5)",
                position: "relative",
              }
            : { height: "100dvh", overflow: "hidden" }
        }
      >
      <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* ── Sidebar overlay (mobile, sidebar mode only) ── */}
      {settings.layoutMode === "sidebar" && sidebarOpen && (
        <div
          className="sidebar-overlay lg:hidden"
          style={{ position: "fixed", inset: 0, zIndex: 40 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── SIDEBAR MODE ──────────────────────────────── */}
      {settings.layoutMode === "sidebar" && (
        <aside
          className="sidebar sidebar-shell"
          style={{
            position: sidebarOpen ? "fixed" : "fixed",
            left: sidebarOpen ? 0 : -288,
            top: 0,
            bottom: 0,
            width: 272,
            zIndex: 45,
            display: "flex",
            flexDirection: "column",
            paddingTop: "calc(1rem + env(safe-area-inset-top, 0px))",
            paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))",
            paddingLeft: "0.875rem",
            paddingRight: "0.875rem",
            gap: "0.875rem",
          }}
        >
          <NavContent
            sources={sources}
            onAdd={addSource}
            onDelete={deleteSource}
            bookmarks={bookmarks}
            onOpenBookmarks={() => setBookmarksOpen(true)}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        </aside>
      )}

      {/* ── BOTTOM-SHEET MODE ─────────────────────────── */}
      {settings.layoutMode === "bottom-sheet" && (
        <BottomSheet open={sidebarOpen} onClose={() => setSidebarOpen(false)}>
          <NavContent
            sources={sources}
            onAdd={addSource}
            onDelete={deleteSource}
            bookmarks={bookmarks}
            onOpenBookmarks={() => setBookmarksOpen(true)}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        </BottomSheet>
      )}

      {/* ── Bookmarks panel ──────────────────────────── */}
      {bookmarksOpen && (
        <>
          <div
            className="settings-overlay"
            onClick={() => setBookmarksOpen(false)}
          />
          <div className="settings-panel">
            <BookmarksPanel
              bookmarks={bookmarks}
              onRemove={removeBookmark}
              onSearch={(q) => handleSearch(q)}
              onClose={() => setBookmarksOpen(false)}
            />
          </div>
        </>
      )}

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
        {/* Search area — sidebar toggle + search bar */}
        <div style={{
          padding: "0.75rem 1rem",
          paddingTop: `calc(${settings.viewMode === "mobile" ? "0.75rem" : "3.5rem"} + env(safe-area-inset-top, 0px))`,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "0.5rem",
        }}>
          {/* Sidebar/bottom-sheet toggle */}
          <button
            className={settings.layoutMode === "sidebar" ? "lg:hidden" : ""}
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Toggle sidebar"
            style={{
              width: 40, height: 40, minWidth: 40,
              display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: 20, border: "1px solid var(--border)", background: "var(--bg-card)",
              color: "var(--text-muted)", cursor: "pointer",
              transition: "color 0.15s, background 0.15s",
            }}
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div style={{ width: "100%", maxWidth: 500 }}>
            <SearchBar onSearch={handleSearch} loading={loading} autoFocus={splashDone} />
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
            <ResultPanel
              results={results.results}
              query={query}
              columns={settings.columns}
              isBookmarked={isBookmarked}
              onToggleBookmark={toggleBookmark}
            />
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
    {/* close mobile wrapper */}
    </div>
    )}
    <ToastContainer />
    </>
  );
}
