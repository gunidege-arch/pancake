interface Props {
  active: boolean;
  onClick: (e: React.MouseEvent) => void;
}

export default function BookmarkButton({ active, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      className={`bm-btn ${active ? "bm-active" : ""}`}
      aria-label={active ? "取消收藏" : "收藏"}
      title={active ? "取消收藏" : "收藏"}
      style={{
        position: "absolute",
        top: 6,
        right: 6,
        width: 30,
        height: 30,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
        border: "none",
        background: active ? "rgba(251,114,153,.85)" : "rgba(0,0,0,.45)",
        backdropFilter: "blur(6px)",
        cursor: "pointer",
        zIndex: 8,
        transition: "background 0.2s, transform 0.2s",
        padding: 0,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.12)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill={active ? "#fff" : "none"}
        stroke="#fff"
        strokeWidth={2.2}
        style={{ transition: "fill 0.15s" }}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
        />
      </svg>
    </button>
  );
}
