import { useState, useCallback, useEffect } from "react";
import type { Bookmark } from "../types/bookmark";

const KEY = "pancake-bookmarks";

function load(): Bookmark[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(items: Bookmark[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(load);

  useEffect(() => { save(bookmarks); }, [bookmarks]);

  const isBookmarked = useCallback(
    (url: string) => bookmarks.some((b) => b.url === url),
    [bookmarks],
  );

  const addBookmark = useCallback((item: {
    title: string;
    url: string;
    thumbnail?: string | null;
    sourceName?: string;
  }) => {
    setBookmarks((prev) => {
      if (prev.some((b) => b.url === item.url)) return prev;
      const bm: Bookmark = {
        id: Date.now(),
        title: item.title,
        url: item.url,
        thumbnail: item.thumbnail ?? null,
        sourceName: item.sourceName ?? "",
        createdAt: Date.now(),
      };
      return [bm, ...prev];
    });
    try { navigator.vibrate?.(15); } catch { /* not supported */ }
    return true;
  }, []);

  const removeBookmark = useCallback((id: number) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const toggleBookmark = useCallback(
    (item: { title: string; url: string; thumbnail?: string | null; sourceName?: string }) => {
      const existing = bookmarks.find((b) => b.url === item.url);
      if (existing) {
        removeBookmark(existing.id);
        return false;
      } else {
        addBookmark(item);
        return true;
      }
    },
    [bookmarks, addBookmark, removeBookmark],
  );

  return { bookmarks, isBookmarked, addBookmark, removeBookmark, toggleBookmark };
}
