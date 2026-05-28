import { useState } from "react";
import type { NormalizedCard } from "../types";
import BookmarkButton from "./BookmarkButton";

interface Props {
  card: NormalizedCard;
  onOpen: () => void;
  bookmarked?: boolean;
  onToggleBookmark?: () => void;
}

export default function ImageCard({ card, onOpen, bookmarked, onToggleBookmark }: Props) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      {card.originalUrl && onToggleBookmark && (
        <BookmarkButton active={bookmarked ?? false} onClick={onToggleBookmark} />
      )}

      <button
        type="button"
        className="rc-card group"
        onClick={onOpen}
        style={{ width: "100%" }}
      >
        <div className="rc-thumb" style={{ aspectRatio: imgFailed ? "16/9" : "auto", minHeight: 120 }}>
          {card.thumbnail && !imgFailed ? (
            <img
              src={card.thumbnail}
              alt={card.title}
              className="rc-thumb-img"
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              style={{ position: "static", height: "auto", maxHeight: 280 }}
            />
          ) : (
            <div className="rc-thumb-placeholder">
              <svg width="32" height="32" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        <div className="rc-info">
          <p className="rc-title">{card.title}</p>
          {!card.isBuiltin && (
            <span className="rc-source-tag">来源：{card.sourceName}</span>
          )}
        </div>
      </button>
    </div>
  );
}
