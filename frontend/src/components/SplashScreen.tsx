import { useState, useCallback, useRef, useEffect } from "react";

const PARTICLES = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  delay: Math.random() * 6,
  size: 1 + Math.random() * 2.5,
  duration: 4 + Math.random() * 6,
}));

interface Props {
  onDismissed: () => void;
}

export default function SplashScreen({ onDismissed }: Props) {
  const [exiting, setExiting] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [touchY, setTouchY] = useState(0);
  const overlayRef = useRef<HTMLDivElement>(null);

  /* ── Click / touch to dismiss ── */
  const handleClick = useCallback(() => {
    if (exiting) return;
    setExiting(true);
  }, [exiting]);

  /* ── Touch move for subtle parallax on mobile ── */
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchY(e.touches[0]?.clientY ?? 0);
  }, []);

  /* ── Remove DOM after animation, notify parent ── */
  const handleAnimationEnd = useCallback(
    (e: React.AnimationEvent) => {
      if (e.target === overlayRef.current && exiting) {
        setRemoved(true);
        onDismissed();
      }
    },
    [exiting, onDismissed],
  );

  if (removed) return null;

  const parallax = touchY ? (touchY / window.innerHeight - 0.5) * 16 : 0;

  return (
    <div
      ref={overlayRef}
      className={`splash-overlay ${exiting ? "splash-exit" : ""}`}
      onClick={handleClick}
      onTouchMove={handleTouchMove}
      onAnimationEnd={handleAnimationEnd}
    >
      {/* ── Deep space background ── */}
      <div className="splash-bg" />

      {/* ── Floating particles ── */}
      {PARTICLES.map((p) => (
        <div
          key={p.id}
          className="splash-particle"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.size,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}

      {/* ── Concentric rings ── */}
      <div className="splash-rings" style={{ transform: `translateY(${parallax * 0.3}px)` }}>
        <div className="splash-ring splash-ring-1" />
        <div className="splash-ring splash-ring-2" />
        <div className="splash-ring splash-ring-3" />
      </div>

      {/* ── Glass card ── */}
      <div
        className="splash-glass"
        style={{ transform: `translateY(${parallax * 0.5}px)` }}
      >
        <div className="splash-shimmer-line" />

        <h1 className="splash-title">
          <span className="splash-title-text">别问了自己搜</span>
        </h1>

        {/* Decorative divider */}
        <div className="splash-rule">
          <span className="splash-rule-diamond" />
        </div>

        <p className="splash-hint">轻触任意位置进入</p>
      </div>

      {/* ── Bottom glow bar ── */}
      <div className="splash-bottom-glow" />
    </div>
  );
}
