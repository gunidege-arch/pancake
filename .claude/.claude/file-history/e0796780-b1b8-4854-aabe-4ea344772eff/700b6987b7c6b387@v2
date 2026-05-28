import { useEffect, useRef, useState, useCallback } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  embedUrl: string;
  originalUrl: string;
  sourceName: string;
}

export default function VideoModal({
  open,
  onClose,
  title,
  embedUrl,
  originalUrl,
  sourceName,
}: Props) {
  const [embedError, setEmbedError] = useState(false);
  const [loading, setLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Reset state when opening a new video
  useEffect(() => {
    if (open) {
      setEmbedError(false);
      setLoading(true);
    }
  }, [open, embedUrl]);

  // ESC key to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleIframeLoad = useCallback(() => {
    setLoading(false);
    setTimeout(() => {
      try {
        const doc = iframeRef.current?.contentDocument;
        if (
          doc &&
          doc.body &&
          doc.body.children.length === 0 &&
          doc.body.innerText.trim() === ""
        ) {
          setEmbedError(true);
        }
      } catch {
        // cross-origin, assume loaded
      }
    }, 800);
  }, []);

  const handleIframeError = useCallback(() => {
    setLoading(false);
    setEmbedError(true);
  }, []);

  if (!open) return null;

  return (
    <div className="vm-overlay" onClick={onClose}>
      <div
        className="vm-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`播放 ${title}`}
      >
        {/* Header */}
        <div className="vm-header">
          <div className="vm-header-left">
            <span className="vm-source-tag">{sourceName}</span>
            <h2 className="vm-title">{title}</h2>
          </div>
          <div className="vm-header-right">
            <a
              href={originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="vm-original-link"
              title="打开原始页面"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              原页
            </a>
            <button
              type="button"
              className="vm-close-btn"
              onClick={onClose}
              aria-label="关闭"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Player area */}
        <div className="vm-player">
          {/* Loading */}
          {loading && !embedError && (
            <div className="vm-loading">
              <svg className="animate-spin h-10 w-10 text-white/70" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-white/50 text-sm mt-3">加载播放器中…</p>
            </div>
          )}

          {/* Embed blocked fallback */}
          {embedError ? (
            <div className="vm-fallback">
              <svg className="w-14 h-14 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              <p className="text-gray-400 text-sm mt-3">该网站禁止嵌入播放</p>
              <p className="text-gray-600 text-xs mt-1">（目标网站设置了 X-Frame-Options 或 CSP 限制）</p>
              <a
                href={originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="vm-fallback-btn"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                在新标签页中打开
              </a>
            </div>
          ) : (
            <iframe
              ref={iframeRef}
              src={embedUrl}
              title={title}
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              className="vm-iframe"
            />
          )}
        </div>
      </div>
    </div>
  );
}
