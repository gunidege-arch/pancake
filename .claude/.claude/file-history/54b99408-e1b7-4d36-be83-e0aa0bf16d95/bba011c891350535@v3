import type { NormalizedCard } from "../types";

interface Props {
  card: NormalizedCard;
  onOpen: () => void;
}

function excerpt(html: string | null | undefined, max = 140): string {
  if (!html) return "";
  const div = document.createElement("div");
  div.innerHTML = html;
  const text = div.textContent || div.innerText || "";
  return text.length > max ? text.slice(0, max).trim() + "…" : text.trim();
}

export default function ArticleCard({ card, onOpen }: Props) {
  const snippet = excerpt(card.content, 160);

  return (
    <button
      type="button"
      className="rc-card group"
      onClick={onOpen}
      style={{
        width: "100%",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "0.4rem",
        padding: "0.85rem 0.95rem",
        textAlign: "left",
      }}
    >
      {/* Title row + arrow */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", width: "100%" }}>
        <span className="rc-title" style={{ fontSize: "0.84rem", flex: 1, minWidth: 0 }}>
          {card.title}
        </span>
        <svg width="14" height="14" fill="none" stroke="var(--text-muted)" strokeWidth={1.5} viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 2 }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>

      {/* Excerpt */}
      {snippet && (
        <span style={{
          fontSize: "0.72rem", color: "var(--text-muted)", lineHeight: 1.5,
          overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical",
        }}>
          {snippet}
        </span>
      )}

      {/* Source tag — only for user-added sources */}
      {!card.isBuiltin && (
        <span style={{ fontSize: "0.64rem", color: "var(--text-muted)", opacity: .6 }}>{card.sourceName}</span>
      )}
    </button>
  );
}
