import { useState, useCallback } from "react";
import type { SearchResponse, SearchSource } from "../types";

/* Always use relative /api — Vercel proxy rewrites handle production */
const API_BASE = "/api";

/* ── Device ID — persistent per-browser ── */
function getDeviceId(): string {
  const key = "pancake-device-id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(key, id);
  }
  return id;
}

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
      const res = await fetch(`${API_BASE}/sources/?device_id=${encodeURIComponent(getDeviceId())}`);
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
        body: JSON.stringify({ ...data, device_id: getDeviceId() }),
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
      const res = await fetch(`${API_BASE}/sources/${id}?device_id=${encodeURIComponent(getDeviceId())}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
      await fetchSources();
    },
    [fetchSources],
  );

  return { sources, loading, fetchSources, addSource, deleteSource };
}
