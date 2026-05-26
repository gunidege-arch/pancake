import { useState } from "react";
import type { SearchSource } from "../types";

interface Props {
  sources: SearchSource[];
  onAdd: (data: { name: string; search_url_template: string; allow_embed: boolean }) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export default function SourceManager({ sources, onAdd, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [urlTemplate, setUrlTemplate] = useState("");
  const [allowEmbed, setAllowEmbed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const handleAdd = async () => {
    setError(null);
    if (!name.trim() || !urlTemplate.trim()) {
      setError("请填写名称和搜索 URL 模板");
      return;
    }
    if (!urlTemplate.includes("{query}")) {
      setError("URL 模板必须包含 {query} 占位符");
      return;
    }
    setSubmitting(true);
    try {
      await onAdd({ name: name.trim(), search_url_template: urlTemplate.trim(), allow_embed: allowEmbed });
      setName("");
      setUrlTemplate("");
      setAllowEmbed(false);
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "添加失败");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeleting(id);
    try {
      await onDelete(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "删除失败");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", flex: 1, minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 0.25rem" }}>
        <h2 style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
          搜索源 · {sources.length}
        </h2>
        <button
          onClick={() => setOpen(true)}
          className="source-add-btn"
          style={{
            width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: 8, border: "none", cursor: "pointer", fontSize: "1rem", lineHeight: 1,
          }}
          title="添加搜索源"
        >
          +
        </button>
      </div>

      {/* Source list */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
        {sources.length === 0 && (
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", padding: "0.5rem 0.25rem", margin: 0 }}>
            暂无搜索源，点击 + 添加
          </p>
        )}
        {sources.map((s) => (
          <div
            key={s.id}
            className="source-item"
            style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              padding: "0.45rem 0.5rem", borderRadius: 8,
              fontSize: "0.8rem", color: "var(--text-secondary)",
              transition: "background 0.12s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-card)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={s.name}>
              {s.name}
            </span>
            {s.allow_embed && (
              <span style={{ fontSize: "0.62rem", background: "rgba(74,222,128,.15)", color: "var(--success)", padding: "0.1rem 0.4rem", borderRadius: 4, fontWeight: 600, flexShrink: 0 }}>
                EMBED
              </span>
            )}
            <button
              onClick={() => handleDelete(s.id)}
              disabled={deleting === s.id}
              style={{
                opacity: 0, width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: 5, border: "none", color: "var(--danger)", cursor: "pointer",
                background: "transparent", transition: "opacity 0.12s, background 0.12s", flexShrink: 0,
                fontSize: "0.85rem",
              }}
              className="source-delete-btn"
              title="删除"
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
              onMouseLeave={(e) => {
                // keep visible only if parent hovered
              }}
            >
              <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* CSS for hover reveal */}
      <style>{`
        .source-item:hover .source-delete-btn { opacity: 1 !important; }
        .source-delete-btn:hover { background: rgba(248,113,113,.15) !important; }
      `}</style>

      {/* Add modal */}
      {open && (
        <div
          className="modal-backdrop"
          style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="modal-card"
            style={{
              borderRadius: 14, padding: "1.25rem", width: "92%", maxWidth: 380,
              display: "flex", flexDirection: "column", gap: "0.85rem",
              boxShadow: "0 12px 40px rgba(0,0,0,.5)",
              animation: "vmScaleIn .2s ease",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>添加搜索源</h3>

            <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>名称</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：Google"
                className="modal-input"
                style={{ padding: "0.5rem 0.7rem", borderRadius: 8, fontSize: "0.84rem" }}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>搜索 URL 模板</span>
              <input
                type="text"
                value={urlTemplate}
                onChange={(e) => setUrlTemplate(e.target.value)}
                placeholder="https://site.com/search?q={query}"
                className="modal-input"
                style={{ padding: "0.5rem 0.7rem", borderRadius: 8, fontSize: "0.84rem" }}
              />
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.82rem", color: "var(--text-secondary)", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={allowEmbed}
                onChange={(e) => setAllowEmbed(e.target.checked)}
                style={{ accentColor: "var(--accent)", width: 15, height: 15 }}
              />
              允许直接嵌入（iframe）
            </label>

            {error && <p style={{ fontSize: "0.8rem", color: "var(--danger)", margin: 0 }}>{error}</p>}

            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "0.25rem" }}>
              <button
                onClick={() => setOpen(false)}
                className="modal-btn-secondary"
                style={{ padding: "0.5rem 1rem", borderRadius: 8, border: "none", fontSize: "0.82rem", cursor: "pointer", background: "transparent" }}
              >
                取消
              </button>
              <button
                onClick={handleAdd}
                disabled={submitting}
                className="modal-btn-primary"
                style={{ padding: "0.5rem 1.2rem", borderRadius: 8, border: "none", fontSize: "0.82rem", fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? .6 : 1 }}
              >
                {submitting ? "添加中..." : "确认添加"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
