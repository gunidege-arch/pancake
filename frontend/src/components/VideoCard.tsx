import { useState } from "react";
import type { NormalizedCard } from "../types";

interface Props {
  card: NormalizedCard;
  onOpen: () => void;
}

export default function VideoCard({ card, onOpen }: Props) {
  const [imgFailed, setImgFailed] = useState(false);
  const hasVideo = card.videoUrl !== null;
  const isError = card.error !== null;

  return (
    <button
      type="button"
      className="rc-card group"
      onClick={onOpen}
      aria-label={isError ? `错误: ${card.error}` : hasVideo ? `播放 ${card.title}` : `打开 ${card.title}`}
    >
      <div className="rc-thumb">
        {isError ? (
          <div className="rc-thumb-placeholder rc-thumb-error">
            <svg style={{ width: 36, height: 36, color: "rgba(248,113,113,.35)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.072 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        ) : card.thumbnail && !imgFailed ? (
          <img
            src={card.thumbnail}
            alt={card.title}
            className="rc-thumb-img"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="rc-thumb-placeholder">
            {hasVideo ? (
              <svg style={{ width: 36, height: 36, color: "rgba(255,255,255,.2)" }} fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            ) : (
              <svg style={{ width: 36, height: 36, color: "rgba(255,255,255,.15)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
          </div>
        )}

        {hasVideo && !isError && (
          <div className="rc-thumb-overlay">
            <div className="rc-play-circle">
              <svg style={{ width: 26, height: 26, color: "#fff", marginLeft: 2 }} fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}
      </div>

      <div className="rc-info">
        <p className="rc-title" title={card.title}>{card.title}</p>
        <span className="rc-source-tag">
          {isError ? card.error : `来源：${card.sourceName}`}
        </span>
      </div>
    </button>
  );
}
