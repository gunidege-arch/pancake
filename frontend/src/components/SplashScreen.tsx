import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

type Mode = "search" | "music" | "wallpaper";

const MODE_CONFIG: Record<Mode, { title: string[]; hint: string }> = {
  search: {
    title: ["别", "问", "了", "自", "己", "搜"],
    hint: "轻触任意位置进入",
  },
  music: {
    title: ["静", "下", "来", "听", "一", "首"],
    hint: "轻触任意位置进入",
  },
  wallpaper: {
    title: ["换", "一", "张", "看", "世", "界"],
    hint: "轻触任意位置进入",
  },
};

export default function SplashScreen() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"enter" | "idle" | "exit">("enter");
  const [mode, setMode] = useState<Mode | null>(null);
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

      for (const s of specks) {
        s.y -= s.s;
        if (s.y < -10) { s.y = h + 10; s.x = Math.random() * w; }
        ctx.fillStyle = `rgba(200,200,240,${s.a})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

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

  /* ── Mode select ── */
  const handleSelectMode = useCallback((m: Mode) => {
    if (phase === "exit") return;
    setMode((prev) => (prev === m ? prev : m));
  }, [phase]);

  /* ── Enter page ── */
  const handleEnter = useCallback(() => {
    if (!mode || phase === "exit") return;
    const path = `/${mode}`;
    setPhase("exit");
    setTimeout(() => { setRemoved(true); navigate(path); }, 1600);
  }, [mode, phase, navigate]);

  if (removed) return null;

  const config = mode ? MODE_CONFIG[mode] : null;
  const showHint = mode !== null && phase === "idle";

  return (
    <div
      className={`splash-linear ${phase} ${mode ? `splash-mode--${mode}` : ""}`}
      onClick={handleEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <div className="splash-grid" />
      <canvas ref={canvasRef} className="splash-canvas" />

      <div className="splash-pillar">
        <div className="splash-pillar-core" />
        <div className="splash-pillar-aura" />
      </div>

      <div className="splash-beams">
        <div className="splash-beam splash-beam-h" />
        <div className="splash-beam splash-beam-v" />
        <div className="splash-beam splash-beam-d1" />
        <div className="splash-beam splash-beam-d2" />
      </div>

      <div className="splash-noise" />

      <div className="splash-actions">
        <button
          className={`splash-btn ${mode === "search" ? "splash-btn--active" : ""}`}
          onClick={(e) => { e.stopPropagation(); handleSelectMode("search"); }}
        >
          搜索
        </button>
        <button
          className={`splash-btn ${mode === "music" ? "splash-btn--active" : ""}`}
          onClick={(e) => { e.stopPropagation(); handleSelectMode("music"); }}
        >
          音乐
        </button>
        <button
          className={`splash-btn ${mode === "wallpaper" ? "splash-btn--active" : ""}`}
          onClick={(e) => { e.stopPropagation(); handleSelectMode("wallpaper"); }}
        >
          壁纸
        </button>
      </div>

      <div className="splash-content">
        <span className="splash-label">AGGREGATED SEARCH</span>
        <h1 className="splash-title-linear">
          {(config?.title ?? MODE_CONFIG.search.title).map((char, i) => (
            <span
              key={`${char}-${i}`}
              className="splash-title-char"
              style={{ transitionDelay: `${i * 0.06}s` }}
            >
              {char}
            </span>
          ))}
        </h1>
        <div className="splash-divider">
          <div className="splash-divider-dot" />
          <div className="splash-divider-line" />
          <div className="splash-divider-dot" />
        </div>
        {showHint && config && (
          <p className="splash-hint-linear">{config.hint}</p>
        )}
      </div>

      <div className="splash-status">
        <span className="splash-status-dot" />
        <span>READY</span>
      </div>
    </div>
  );
}
