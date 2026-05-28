import type { NormalizedCard } from "../types";

interface Props {
  card: NormalizedCard;
  onOpen: () => void;
}

/** Extract plain text from HTML, truncated */
function excerpt(html: string | null | undefined, max = 120): string {
  if (!html) return "";
  const div = document.createElement("div");
  div.innerHTML = html;
  const text = div.textContent || div.innerText || "";
  return text.length > max ? text.slice(0, max).trim() + "…" : text.trim();
}

export default function ArticleCard({ card, onOpen }: Props) {
  const snippet = excerpt(card.content, 140);

  return (
    <button
      type="button"
      className="rc-card group"
      onClick={onOpen}
      style={{
        width: "100%",
        flexDirection: "row",
        alignItems: "flex-start",
        gap: "0.875rem",
        padding: "0.9rem",
        textAlign: "left",
      }}
    >
      {/* Thumbnail or placeholder */}
      <div style={{
        width: 72, height: 56, minWidth: 72, borderRadius: 10,
        overflow: "hidden", background: "var(--bg-primary)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        {card.thumbnail ? (
          <img
            src={card.thumbnail}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            referrerPolicy="no-referrer"
          />
        ) : (
          <svg width="22" height="22" fill="none" stroke="var(--text-muted)" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "0.3rem" }}>
        <span className="rc-title" style={{ fontSize: "0.82rem" }}>{card.title}</span>
        {snippet && (
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", lineHeight: 1.45, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
            {snippet}
          </span>
        )}
        {!card.isBuiltin && (
          <span style={{ fontSize: "0.64rem", color: "var(--text-muted)", opacity: .7 }}>{card.sourceName}</span>
        )}
      </div>

      {/* Arrow */}
      <svg width="14" height="14" fill="none" stroke="var(--text-muted)" strokeWidth={1.5} viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 2 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}
