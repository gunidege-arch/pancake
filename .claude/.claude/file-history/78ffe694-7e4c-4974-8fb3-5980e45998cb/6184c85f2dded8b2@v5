import { useState, useCallback, useMemo } from "react";
import type { SearchResultItem, NormalizedCard } from "../types";
import { normalizeResult } from "../types";
import VideoCard from "./VideoCard";
import VideoModal from "./VideoModal";
import ArticleCard from "./ArticleCard";
import LinkCard from "./LinkCard";
import FilterBar from "./FilterBar";
import { showToast } from "./Toast";

type Category = "all" | "article" | "video" | "link";

interface Props {
  results: SearchResultItem[];
  query: string;
  columns: string;
  isBookmarked: (url: string) => boolean;
  onToggleBookmark: (item: { title: string; url: string; thumbnail?: string | null; sourceName?: string }) => boolean;
}

interface ModalData {
  title: string;
  embedUrl: string;
  originalUrl: string;
  sourceName: string;
}

export default function ResultPanel({ results, query, columns, isBookmarked, onToggleBookmark }: Props) {
  const [modal, setModal] = useState<ModalData | null>(null);
  const [category, setCategory] = useState<Category>("all");
  const openModal = useCallback((data: ModalData) => setModal(data), []);
  const closeModal = useCallback(() => setModal(null), []);

  const cards: NormalizedCard[] = useMemo(
    () => results.map(normalizeResult).filter((c) => !c.error),
    [results],
  );

  const filtered = useMemo(
    () => category === "all" ? cards : cards.filter((c) => c.category === category),
    [cards, category],
  );

  const counts = useMemo((): Record<Category, number> => ({
    all: cards.length,
    article: cards.filter((c) => c.category === "article").length,
    video: cards.filter((c) => c.category === "video").length,
    link: cards.filter((c) => c.category === "link").length,
  }), [cards]);

  if (cards.length === 0) {
    return (
      <p style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)", fontSize: "0.88rem" }}>
        搜索 &quot;{query}&quot; — 所有来源均无法访问
      </p>
    );
  }

  const colsNum = parseInt(columns, 10);

  const renderCard = (card: NormalizedCard, idx: number) => {
    const handleOpen = () => {
      if (card.videoUrl) {
        openModal({ title: card.title, embedUrl: card.videoUrl, originalUrl: card.originalUrl ?? "", sourceName: card.sourceName });
      } else if (card.originalUrl) {
        window.open(card.originalUrl, "_blank", "noopener");
      }
    };

    const url = card.originalUrl ?? card.videoUrl ?? "";
    const bookmarked = url ? isBookmarked(url) : false;
    const handleToggleBookmark = () => {
      if (!url) return;
      const added = onToggleBookmark({ title: card.title, url, thumbnail: card.thumbnail, sourceName: card.sourceName });
      showToast(added ? "已收藏" : "已取消");
    };

    const sharedProps = { key: `card-${idx}`, card, onOpen: handleOpen, bookmarked, onToggleBookmark: handleToggleBookmark };

    switch (card.category) {
      case "video":
        return <VideoCard {...sharedProps} />;
      case "article":
        return <ArticleCard card={card} onOpen={handleOpen} />;
      case "link":
        return <LinkCard card={card} onOpen={handleOpen} />;
      default:
        return <LinkCard card={card} onOpen={handleOpen} />;
    }
  };

  return (
    <div>
      <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.5rem", paddingLeft: "0.25rem" }}>
        搜索 &quot;{query}&quot; — {cards.length} 个结果
      </p>

      <FilterBar active={category} counts={counts} onChange={setCategory} />

      {/* Article list layout */}
      {category === "article" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxWidth: 680, margin: "0 auto" }}>
          {filtered.map((card, idx) => renderCard(card, idx))}
        </div>
      )}

      {/* Video / Link / All — grid layout */}
      {category !== "article" && (
        <div
          className="results-grid"
          style={{
            gridTemplateColumns: `repeat(${colsNum}, 1fr)`,
            maxWidth: colsNum === 2 ? "100%" : colsNum === 3 ? 900 : 1200,
            margin: "0 auto",
          }}
        >
          {filtered.map((card, idx) => renderCard(card, idx))}
        </div>
      )}

      <VideoModal
        open={modal !== null}
        onClose={closeModal}
        title={modal?.title ?? ""}
        embedUrl={modal?.embedUrl ?? ""}
        originalUrl={modal?.originalUrl ?? ""}
        sourceName={modal?.sourceName ?? ""}
      />
    </div>
  );
}
