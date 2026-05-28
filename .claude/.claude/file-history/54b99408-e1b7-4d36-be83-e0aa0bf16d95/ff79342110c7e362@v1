import { useEffect, useCallback, useState } from "react";
import { useSearch, useSources } from "./hooks/useSearch";
import SearchBar from "./components/SearchBar";
import SourceManager from "./components/SourceManager";
import ResultPanel from "./components/ResultPanel";

export default function App() {
  const { query, results, loading, error, search } = useSearch();
  const { sources, fetchSources, addSource, deleteSource } = useSources();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  const handleSearch = useCallback(
    (q: string) => {
      search(q);
    },
    [search],
  );

  return (
    <div className="flex h-screen">
      {/* Mobile sidebar toggle */}
      <button
        className="fixed top-3 left-3 z-50 lg:hidden bg-white border rounded-lg p-2 shadow"
        onClick={() => setSidebarOpen((v) => !v)}
        aria-label="Toggle sidebar"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 fixed lg:static z-40 w-72 h-full bg-white border-r border-gray-200 p-4 flex flex-col gap-4 transition-transform duration-200`}
      >
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <span className="text-2xl">&#128269;</span> 聚合搜索
        </h1>
        <SourceManager
          sources={sources}
          onAdd={addSource}
          onDelete={deleteSource}
        />
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        <div className="p-4 pt-14 lg:pt-4">
          <SearchBar onSearch={handleSearch} loading={loading} />
        </div>

        {error && (
          <div className="px-4 pb-2">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        {results && (
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <ResultPanel results={results.results} query={query} />
          </div>
        )}

        {!results && !loading && (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <p>输入关键词，聚合搜索多个网站 &#8593;</p>
          </div>
        )}
      </main>
    </div>
  );
}
