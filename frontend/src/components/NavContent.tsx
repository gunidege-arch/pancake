import type { SearchSource } from "../types";
import type { Bookmark } from "../types/bookmark";
import SourceManager from "./SourceManager";

interface Props {
  sources: SearchSource[];
  onAdd: (data: { name: string; search_url_template: string; allow_embed: boolean }) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  bookmarks: Bookmark[];
  onOpenBookmarks: () => void;
  onOpenSettings: () => void;
}

export default function NavContent({
  sources,
  onAdd,
  onDelete,
  bookmarks,
  onOpenBookmarks,
  onOpenSettings,
}: Props) {
  return (
    <>
      {/* Brand */}
      <div style={{ padding: "0.25rem 0.25rem 0.5rem", position: "relative" }}>
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
          <span style={{ fontSize: "0.75rem" }}>🌸</span>
          <span style={{
            fontSize: "0.88rem",
            background: "linear-gradient(135deg, #ff85a2 0%, #fb7299 40%, #ff6090 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textShadow: "0 0 12px rgba(251,114,153,.25)",
          }}>别问了自己搜</span>
          <span style={{ fontSize: "0.75rem" }}>🌸</span>
        </h1>

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
      <SourceManager sources={sources} onAdd={onAdd} onDelete={onDelete} />

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Bookmarks button */}
      <button
        onClick={onOpenBookmarks}
        style={{
          display: "flex", alignItems: "center", gap: "0.6rem",
          padding: "0.6rem 0.75rem", borderRadius: 10,
          background: "var(--bg-card)", border: "1px solid var(--border)",
          color: "var(--text-secondary)", cursor: "pointer",
          fontSize: "0.84rem", fontWeight: 500,
          transition: "background 0.15s, color 0.15s",
          marginBottom: "0.35rem",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-card-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "var(--bg-card)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
        </svg>
        收藏 {bookmarks.length > 0 && (
          <span style={{
            background: "var(--accent)", color: "#fff", borderRadius: 10,
            padding: "0 0.4rem", fontSize: "0.68rem", fontWeight: 600,
            minWidth: 18, textAlign: "center", lineHeight: "18px",
          }}>{bookmarks.length}</span>
        )}
      </button>

      {/* Settings button */}
      <button
        onClick={onOpenSettings}
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
    </>
  );
}
