import type { NormalizedCard } from "../types";

interface Props {
  card: NormalizedCard;
  onOpen: () => void;
}

export default function LinkCard({ card, onOpen }: Props) {
  const domain = (() => {
    try {
      return new URL(card.originalUrl || "").hostname.replace("www.", "");
    } catch {
      return "";
    }
  })();

  return (
    <button
      type="button"
      className="rc-card group"
      onClick={onOpen}
      style={{
        width: "100%",
        padding: "0.85rem 0.9rem",
        textAlign: "left",
        display: "flex",
        flexDirection: "column",
        gap: "0.6rem",
      }}
    >
      {/* Top row: icon + title + domain */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", minWidth: 0 }}>
        {/* Favicon-style placeholder */}
        <div style={{
          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
          background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="18" height="18" fill="none" stroke="var(--text-muted)" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <span className="rc-title" style={{ fontSize: "0.82rem" }}>{card.title}</span>
          {domain && (
            <span style={{ fontSize: "0.66rem", color: "var(--text-muted)", display: "block", marginTop: 1 }}>{domain}</span>
          )}
        </div>
      </div>

      {/* CTA button */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem",
        padding: "0.45rem", borderRadius: 8,
        background: "var(--accent-soft)", color: "var(--accent)",
        fontSize: "0.76rem", fontWeight: 500,
      }}>
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
        打开网站
      </div>
    </button>
  );
}
