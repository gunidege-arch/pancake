import { useOutletContext } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import ResultPanel from "../components/ResultPanel";
import { useSearch } from "../hooks/useSearch";
import { useBookmarks } from "../hooks/useBookmarks";

export default function SearchPage() {
  const { columns } = useOutletContext<{ columns: string }>();
  const { query, results, loading, error, search } = useSearch();
  const { isBookmarked, toggleBookmark } = useBookmarks();

  return (
    <div className="page page-search">
      {/* Search bar */}
      <div className="search-bar-area">
        <SearchBar onSearch={search} loading={loading} autoFocus={true} />
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: "0 1rem 0.5rem", textAlign: "center" }}>
          <span style={{ fontSize: "0.82rem", color: "var(--danger)" }}>{error}</span>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="results-area">
          <ResultPanel
            results={results.results}
            query={query}
            columns={columns}
            isBookmarked={isBookmarked}
            onToggleBookmark={toggleBookmark}
          />
        </div>
      )}

      {/* Empty state */}
      {!results && !loading && !error && (
        <div className="page-empty">
          <div style={{ fontSize: "3rem", marginBottom: "0.75rem", opacity: 0.6 }}>&#128270;</div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: 0 }}>输入关键词，别问了自己搜</p>
          <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "0.25rem", opacity: 0.6 }}>
            支持视频识别、内容提取、嵌入式预览
          </p>
        </div>
      )}
    </div>
  );
}
