import { useState, useCallback, useMemo } from "react";
import type { SearchResultItem, NormalizedCard } from "../types";
import { normalizeResult } from "../types";
import VideoCard from "./VideoCard";
import VideoModal from "./VideoModal";
import { showToast } from "./Toast";

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
  const openModal = useCallback((data: ModalData) => setModal(data), []);
  const closeModal = useCallback(() => setModal(null), []);

  const cards: NormalizedCard[] = useMemo(
    () => results.map(normalizeResult),
    [results],
  );

  if (cards.length === 0) {
    return (
      <p style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)", fontSize: "0.88rem" }}>
        未配置搜索源，请先在侧边栏添加。
      </p>
    );
  }

  const colsNum = parseInt(columns, 10);

  return (
    <div>
      <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.75rem", paddingLeft: "0.25rem" }}>
        搜索 &quot;{query}&quot; — 共 {cards.length} 个来源
      </p>

      <div
        className="results-grid"
        style={{
          gridTemplateColumns: `repeat(${colsNum}, 1fr)`,
          maxWidth: colsNum === 2 ? "100%" : colsNum === 3 ? 900 : 1200,
          margin: "0 auto",
        }}
      >
        {cards.map((card, idx) => {
          const handleOpen = () => {
            if (card.error) return;
            if (card.videoUrl) {
              openModal({
                title: card.title,
                embedUrl: card.videoUrl,
                originalUrl: card.originalUrl ?? "",
                sourceName: card.sourceName,
              });
            } else if (card.originalUrl) {
              window.open(card.originalUrl, "_blank", "noopener");
            }
          };

          const url = card.originalUrl ?? card.videoUrl ?? "";
          const bookmarked = url ? isBookmarked(url) : false;

          const handleToggleBookmark = () => {
            if (!url) return;
            const added = onToggleBookmark({
              title: card.title,
              url,
              thumbnail: card.thumbnail,
              sourceName: card.sourceName,
            });
            showToast(added ? "已收藏 ♡" : "已取消收藏");
          };

          return (
            <VideoCard
              key={`card-${idx}`}
              card={card}
              onOpen={handleOpen}
              bookmarked={bookmarked}
              onToggleBookmark={handleToggleBookmark}
            />
          );
        })}
      </div>

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
