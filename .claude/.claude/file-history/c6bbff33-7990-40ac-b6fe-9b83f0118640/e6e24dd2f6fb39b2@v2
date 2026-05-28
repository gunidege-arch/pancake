type Category = "all" | "article" | "video" | "link";

interface Props {
  active: Category;
  counts: Record<Category, number>;
  onChange: (c: Category) => void;
}

const CATEGORIES: { key: Category; label: string; icon: string }[] = [
  { key: "all", label: "全部", icon: "" },
  { key: "article", label: "文章", icon: "" },
  { key: "video", label: "视频", icon: "" },
  { key: "link", label: "链接", icon: "" },
];

export default function FilterBar({ active, counts, onChange }: Props) {
  return (
    <div style={{
      display: "flex", gap: "0.4rem", paddingBottom: "0.75rem",
      overflowX: "auto", scrollbarWidth: "none",
    }}>
      {CATEGORIES.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={() => onChange(c.key)}
          style={{
            display: "flex", alignItems: "center", gap: "0.3rem",
            padding: "0.35rem 0.85rem", borderRadius: 20,
            border: active === c.key ? "none" : "1px solid var(--border)",
            background: active === c.key ? "var(--accent)" : "transparent",
            color: active === c.key ? "#fff" : "var(--text-secondary)",
            fontSize: "0.78rem", fontWeight: active === c.key ? 600 : 400,
            cursor: "pointer", whiteSpace: "nowrap",
            transition: "all .2s ease",
          }}
        >
          {c.label}
          {counts[c.key] > 0 && (
            <span style={{
              fontSize: "0.62rem", fontWeight: 600,
              opacity: active === c.key ? .8 : .5,
              minWidth: 16, textAlign: "center",
            }}>
              {counts[c.key]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
