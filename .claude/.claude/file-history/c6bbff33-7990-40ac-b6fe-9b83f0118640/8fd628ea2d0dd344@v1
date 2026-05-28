import { useState, useRef, useCallback } from "react";

interface Props {
  url: string;
  sourceName: string;
  originalUrl?: string;
}

export default function EmbedFrame({ url, sourceName, originalUrl }: Props) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleLoad = useCallback(() => {
    setLoading(false);
    // Detect X-Frame-Options / CSP frame-ancestors blocking.
    // After a short delay the iframe DOM is stable.
    setTimeout(() => {
      try {
        const doc = iframeRef.current?.contentDocument;
        // Same-origin + blocked → body is empty
        if (doc && doc.body && doc.body.children.length === 0 && doc.body.innerText.trim() === "") {
          setError(true);
        }
        // Cross-origin → contentDocument is null (can't inspect, assume ok)
      } catch {
        // Access denied — cross-origin, assume loaded
      }
    }, 800);
  }, []);

  const handleError = useCallback(() => {
    setLoading(false);
    setError(true);
  }, []);

  const fallbackUrl = originalUrl || url;

  return (
    <div className="relative">
      {/* Loading spinner */}
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10 min-h-[300px]">
          <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )}

      {/* Error / blocked fallback */}
      {error ? (
        <div className="flex flex-col items-center justify-center p-8 bg-gray-900 text-white rounded-b-xl min-h-[300px] gap-4">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          <p className="text-gray-300 text-sm">该网站禁止嵌入播放</p>
          <p className="text-gray-500 text-xs">（X-Frame-Options / CSP 限制）</p>
          <a
            href={fallbackUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            点击跳转观看
          </a>
        </div>
      ) : (
        <iframe
          ref={iframeRef}
          src={url}
          title={sourceName}
          onLoad={handleLoad}
          onError={handleError}
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          className="w-full min-h-[400px]"
        />
      )}
    </div>
  );
}
