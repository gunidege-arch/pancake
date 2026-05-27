import { useState, useCallback, useRef, useEffect } from "react";

/* ═══════════════════════════════════════════════════════════
   LINEAR × VERCEL INSPIRED SPLASH
   Geometric grid · prismatic flow · dot matrix · edge beams
   ═══════════════════════════════════════════════════════════ */

interface Props {
  onDismissed: () => void;
}

export default function SplashScreen({ onDismissed }: Props) {
  const [phase, setPhase] = useState<"enter" | "idle" | "exit">("enter");
  const [removed, setRemoved] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef({ x: -999, y: -999, active: false });
  const rafRef = useRef(0);
  const frameRef = useRef(0);

  /* ── Staggered entrance ── */
  useEffect(() => {
    const t = setTimeout(() => setPhase("idle"), 1200);
    return () => clearTimeout(t);
  }, []);

  /* ── Canvas: subtle specks + cursor halo ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let w = window.innerWidth;
    let h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;

    const specks: { x: number; y: number; r: number; a: number; s: number }[] = [];
    for (let i = 0; i < 40; i++) {
      specks.push({
        x: Math.random() * w, y: Math.random() * h,
        r: 0.3 + Math.random() * 0.8,
        a: 0.15 + Math.random() * 0.35,
        s: 0.02 + Math.random() * 0.06,
      });
    }

    const onResize = () => { w = window.innerWidth; h = window.innerHeight; canvas.width = w; canvas.height = h; };
    window.addEventListener("resize", onResize);

    const loop = () => {
      frameRef.current++;
      const { x: cx, y: cy, active } = cursorRef.current;
      ctx.clearRect(0, 0, w, h);

      /* specks */
      for (const s of specks) {
        s.y -= s.s;
        if (s.y < -10) { s.y = h + 10; s.x = Math.random() * w; }
        ctx.fillStyle = `rgba(200,200,240,${s.a})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      /* cursor halo */
      if (active && cx > 0 && cy > 0) {
        const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, 180);
        halo.addColorStop(0, "rgba(160,140,220,0.07)");
        halo.addColorStop(0.4, "rgba(120,100,180,0.03)");
        halo.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = halo;
        ctx.fillRect(cx - 180, cy - 180, 360, 360);
      }

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener("resize", onResize); };
  }, []);

  /* ── Pointer ── */
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    cursorRef.current = { x: e.clientX, y: e.clientY, active: true };
  }, []);
  const handlePointerLeave = useCallback(() => {
    cursorRef.current = { x: -999, y: -999, active: false };
  }, []);

  /* ── Dismiss ── */
  const handleClick = useCallback(() => {
    if (phase === "exit") return;
    setPhase("exit");
    setTimeout(() => { setRemoved(true); onDismissed(); }, 1600);
  }, [phase, onDismissed]);

  if (removed) return null;

  return (
    <div
      className={`splash-linear ${phase}`}
      onClick={handleClick}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {/* ── Geometric grid overlay ── */}
      <div className="splash-grid" />

      {/* ── Canvas: specks + cursor halo ── */}
      <canvas ref={canvasRef} className="splash-canvas" />

      {/* ── Prismatic central glow pillar ── */}
      <div className="splash-pillar">
        <div className="splash-pillar-core" />
        <div className="splash-pillar-aura" />
      </div>

      {/* ── Edge light beams ── */}
      <div className="splash-beams">
        <div className="splash-beam splash-beam-h" />
        <div className="splash-beam splash-beam-v" />
        <div className="splash-beam splash-beam-d1" />
        <div className="splash-beam splash-beam-d2" />
      </div>

      {/* ── Dot matrix noise overlay ── */}
      <div className="splash-noise" />

      {/* ── Content ── */}
      <div className="splash-content">
        {/* tiny label */}
        <span className="splash-label">AGGREGATED SEARCH</span>

        {/* Title */}
        <h1 className="splash-title-linear">
          <span className="splash-title-char" style={{ transitionDelay: "0s" }}>别</span>
          <span className="splash-title-char" style={{ transitionDelay: "0.06s" }}>问</span>
          <span className="splash-title-char" style={{ transitionDelay: "0.12s" }}>了</span>
          <span className="splash-title-char" style={{ transitionDelay: "0.18s" }}>自</span>
          <span className="splash-title-char" style={{ transitionDelay: "0.24s" }}>己</span>
          <span className="splash-title-char" style={{ transitionDelay: "0.3s" }}>搜</span>
        </h1>

        {/* Decorative line */}
        <div className="splash-divider">
          <div className="splash-divider-dot" />
          <div className="splash-divider-line" />
          <div className="splash-divider-dot" />
        </div>

        {/* Hint */}
        <p className="splash-hint-linear">轻触任意位置进入</p>
      </div>

      {/* ── Bottom status bar ── */}
      <div className="splash-status">
        <span className="splash-status-dot" />
        <span>READY</span>
      </div>
    </div>
  );
}
