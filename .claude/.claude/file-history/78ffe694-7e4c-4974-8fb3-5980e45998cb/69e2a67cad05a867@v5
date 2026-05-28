export interface SearchSource {
  id: number;
  name: string;
  search_url_template: string;
  allow_embed: boolean;
  is_builtin: boolean;
}

export interface SearchResultItem {
  source_id: number;
  source_name: string;
  type: "embed" | "content" | "video" | "error";
  success: boolean;
  url?: string;
  content?: string;
  original_url?: string;
  error?: string;
  resource_type?: "video" | "webpage";
  thumbnail_url?: string;
  title?: string;
  embed_url?: string;
  video_url?: string;
}

export interface SearchResponse {
  query: string;
  results: SearchResultItem[];
}

/** Normalised card — the only shape the UI layer should ever see. */
export interface NormalizedCard {
  title: string;
  thumbnail: string | null;
  videoUrl: string | null;
  sourceName: string;
  originalUrl: string | null;
  error: string | null;
  isBuiltin: boolean;
  content: string | null;
  category: "video" | "article" | "image" | "link";
}

/**
 * Convert any backend result into the standard NormalizedCard shape.
 *
 * Handles common field-name variations that different scrapers may produce
 * (e.g. ``subject``, ``name``, ``label``) so the UI never has to care.
 */
export function normalizeResult(item: SearchResultItem): NormalizedCard {
  const raw = item as unknown as Record<string, unknown>;

  const title = String(
    raw.title || raw.subject || raw.name || raw.label || item.source_name || "",
  );

  const thumbnail = String(
    raw.thumbnail_url || raw.thumbnail || raw.cover || raw.poster || "",
  ) || null;

  const videoUrl = String(
    raw.video_url || raw.embed_url || raw.url || "",
  ) || null;

  const originalUrl = String(
    raw.original_url || raw.url || "",
  ) || null;

  const error = item.type === "error"
    ? String(raw.error || "请求失败")
    : null;

  const itemType = item.type as string;
  const category: NormalizedCard["category"] =
    itemType === "video" ? "video" :
    itemType === "content" && thumbnail ? "image" :
    itemType === "content" ? "article" :
    "link";

  const content = typeof raw.content === "string" ? raw.content : null;

  return {
    title,
    thumbnail,
    videoUrl,
    sourceName: item.source_name,
    originalUrl,
    error,
    isBuiltin: Boolean(raw.is_builtin),
    content,
    category,
  };
}
