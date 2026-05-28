import { useState, type FormEvent } from "react";

interface Props {
  onSearch: (query: string) => void;
  loading: boolean;
}

export default function SearchBar({ onSearch, loading }: Props) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (value.trim()) onSearch(value.trim());
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        gap: "0.5rem",
        alignItems: "center",
      }}
    >
      <div
        style={{
          flex: 1,
          position: "relative",
          display: "flex",
          alignItems: "center",
        }}
      >
        {/* search icon inside input */}
        <svg
          style={{
            position: "absolute",
            left: 12,
            width: 16,
            height: 16,
            color: focused ? "var(--accent)" : "var(--text-muted)",
            transition: "color 0.2s",
            pointerEvents: "none",
          }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="搜索关键词..."
          className="search-input"
          style={{
            width: "100%",
            height: 40,
            paddingLeft: 38,
            paddingRight: 12,
            borderRadius: 20,
            fontSize: "0.875rem",
            transition: "border-color 0.2s, box-shadow 0.2s",
          }}
          autoFocus
        />
      </div>

      {/* search button — creative micro-interaction */}
      <button
        type="submit"
        disabled={loading || !value.trim()}
        className={`search-btn ${!loading && value.trim() ? "search-btn-glow" : ""}`}
        style={{
          height: 40,
          width: 72,
          borderRadius: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: loading || !value.trim() ? "not-allowed" : "pointer",
          fontSize: "0.85rem",
        }}
      >
        {loading ? (
          <svg
            style={{ width: 18, height: 18, animation: "spin-slow 1.2s linear infinite" }}
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle style={{ opacity: 0.2 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3.5" />
            <path style={{ opacity: 0.7 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <span style={{ display: "flex", alignItems: "center", gap: 2 }}>
            <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ transition: "transform 0.2s" }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
        )}
      </button>
    </form>
  );
}
