import { useState, useCallback, useRef, useEffect } from "react";

export default function SplashScreen() {
  const [exiting, setExiting] = useState(false);
  const [removed, setRemoved] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  /* ── Mouse-driven subtle parallax on the gradient orbs ── */
  useEffect(() => {
    const el = bgRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 30;
      const y = (e.clientY / window.innerHeight - 0.5) * 30;
      el.style.setProperty("--mx", `${x}px`);
      el.style.setProperty("--my", `${y}px`);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  /* ── Click handler ── */
  const handleClick = useCallback(() => {
    if (exiting) return;
    setExiting(true);
  }, [exiting]);

  /* ── Remove DOM after animation ends ── */
  const handleAnimationEnd = useCallback(
    (e: React.AnimationEvent) => {
      if (e.target === overlayRef.current && exiting) {
        setRemoved(true);
      }
    },
    [exiting],
  );

  if (removed) return null;

  return (
    <div
      ref={overlayRef}
      className={`splash-overlay ${exiting ? "splash-exit" : ""}`}
      onClick={handleClick}
      onAnimationEnd={handleAnimationEnd}
      style={{ cursor: exiting ? "default" : "pointer" }}
    >
      {/* ── Animated gradient orbs (background) ── */}
      <div ref={bgRef} className="splash-bg">
        <div className="splash-orb splash-orb-a" />
        <div className="splash-orb splash-orb-b" />
        <div className="splash-orb splash-orb-c" />
      </div>

      {/* ── Glass card ── */}
      <div className="splash-glass">
        {/* subtle top shimmer line */}
        <div className="splash-shimmer-line" />

        {/* Main title */}
        <h1 className="splash-title">
          <span className="splash-title-text">别问了自己搜</span>
        </h1>

        {/* Decorative rule */}
        <div className="splash-rule">
          <span className="splash-rule-diamond" />
        </div>

        {/* Hint */}
        <p className="splash-hint">// 点击开启 //</p>
      </div>
    </div>
  );
}
