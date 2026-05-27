import type { Bookmark } from "../types/bookmark";

interface Props {
  bookmarks: Bookmark[];
  onRemove: (id: number) => void;
  onSearch: (query: string) => void;
  onClose: () => void;
}

export default function BookmarksPanel({ bookmarks, onRemove, onSearch, onClose }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)",
      }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
          我的收藏 · {bookmarks.length}
        </h2>
        <button
          onClick={onClose}
          style={{
            width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: 8, color: "var(--text-secondary)", background: "none", border: "none",
            cursor: "pointer", fontSize: "1.1rem",
          }}
        >
          ✕
        </button>
      </div>

      {/* list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0.75rem 1.25rem" }}>
        {bookmarks.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
            <p style={{ fontSize: "2rem", margin: "0 0 0.5rem", opacity: .4 }}>♡</p>
            <p style={{ color: "var(--text-muted)", fontSize: "0.84rem", margin: 0 }}>
              还没有收藏，去搜索结果里点爱心吧
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {bookmarks.map((bm) => (
              <div
                key={bm.id}
                style={{
                  display: "flex", alignItems: "center", gap: "0.6rem",
                  padding: "0.6rem 0.7rem", borderRadius: 10,
                  background: "var(--bg-card)", border: "1px solid var(--border)",
                  cursor: "pointer",
                  transition: "background 0.12s",
                }}
                onClick={() => {
                  onSearch(bm.url);
                  onClose();
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-card-hover)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "var(--bg-card)"; }}
              >
                {/* thumbnail */}
                {bm.thumbnail ? (
                  <img
                    src={bm.thumbnail}
                    alt=""
                    style={{
                      width: 44, height: 32, borderRadius: 6,
                      objectFit: "cover", flexShrink: 0,
                      background: "var(--bg-primary)",
                    }}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div style={{
                    width: 44, height: 32, borderRadius: 6, flexShrink: 0,
                    background: "var(--bg-primary)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <svg width="14" height="14" fill="none" stroke="var(--text-muted)" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                )}

                {/* info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: "0.82rem", color: "var(--text-primary)", fontWeight: 500,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {bm.title}
                  </div>
                  <div style={{
                    fontSize: "0.68rem", color: "var(--text-muted)", marginTop: 1,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {bm.sourceName && `来源：${bm.sourceName} · `}{new Date(bm.createdAt).toLocaleDateString("zh-CN")}
                  </div>
                </div>

                {/* delete */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(bm.id);
                  }}
                  style={{
                    width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: 6, border: "none", color: "var(--text-muted)", cursor: "pointer",
                    background: "transparent", flexShrink: 0,
                    transition: "color 0.12s, background 0.12s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--danger)";
                    e.currentTarget.style.background = "rgba(248,113,113,.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--text-muted)";
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
