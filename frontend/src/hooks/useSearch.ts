import { useState, useCallback } from "react";
import type { SearchResponse, SearchSource } from "../types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const API_BASE = BASE_URL ? `${BASE_URL}/api` : "/api";

export function useSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setQuery(q);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error(`Search failed: ${res.status}`);
      const data: SearchResponse = await res.json();
      setResults(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  return { query, results, loading, error, search };
}

export function useSources() {
  const [sources, setSources] = useState<SearchSource[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSources = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/sources/`);
      if (!res.ok) throw new Error("Failed to fetch sources");
      const data: SearchSource[] = await res.json();
      setSources(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const addSource = useCallback(
    async (data: { name: string; search_url_template: string; allow_embed: boolean }) => {
      const res = await fetch(`${API_BASE}/sources/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Unknown error" }));
        throw new Error(err.detail || `Failed: ${res.status}`);
      }
      await fetchSources();
    },
    [fetchSources],
  );

  const deleteSource = useCallback(
    async (id: number) => {
      const res = await fetch(`${API_BASE}/sources/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
      await fetchSources();
    },
    [fetchSources],
  );

  return { sources, loading, fetchSources, addSource, deleteSource };
}
