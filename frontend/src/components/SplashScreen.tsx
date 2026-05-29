import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";

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
  const [displayMode, setDisplayMode] = useState<Mode | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [removed, setRemoved] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef({ x: -999, y: -999, active: false });
  const rafRef = useRef(0);
  const frameRef = useRef(0);

  /* ── SVG transition refs ── */
  const transSvgRef = useRef<SVGSVGElement>(null);
  const path1Ref = useRef<SVGPathElement>(null);
  const path2Ref = useRef<SVGPathElement>(null);
  const fillRef = useRef<SVGRectElement>(null);

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

  /* ── Mode transition animation ── */
  const animateModeSwitch = useCallback((nextMode: Mode) => {
    const path1 = path1Ref.current;
    const path2 = path2Ref.current;
    const fill = fillRef.current;
    if (!path1 || !path2 || !fill) {
      setDisplayMode(nextMode);
      setMode(nextMode);
      return;
    }

    setTransitioning(true);

    const len1 = path1.getTotalLength();
    const len2 = path2.getTotalLength();

    gsap.set([path1, path2], { strokeDasharray: len1, strokeDashoffset: len1, opacity: 1 });
    gsap.set(fill, { opacity: 0 });

    const tl = gsap.timeline();

    // Phase 1: draw strokes on
    tl.to(path1, {
      strokeDashoffset: 0,
      duration: 0.45,
      ease: "power2.inOut",
    })
    .to(path2, {
      strokeDashoffset: 0,
      duration: 0.35,
      ease: "power2.inOut",
    }, "-=0.3")
    // Phase 2: fill to solid
    .to(fill, {
      opacity: 1,
      duration: 0.25,
      ease: "power2.in",
    })
    // Phase 3: switch content
    .call(() => {
      setDisplayMode(nextMode);
      setMode(nextMode);
    })
    // Phase 4: wipe away
    .to(fill, {
      opacity: 0,
      duration: 0.12,
      ease: "power2.out",
    })
    .to([path1, path2], {
      strokeDashoffset: -len1,
      duration: 0.5,
      ease: "power3.in",
      stagger: 0.05,
    })
    .call(() => {
      gsap.set([path1, path2], { opacity: 0, strokeDashoffset: len1 });
      setTransitioning(false);
    });
  }, []);

  /* ── Mode select ── */
  const handleSelectMode = useCallback((m: Mode) => {
    if (transitioning || phase === "exit") return;
    if (mode === null) {
      // First selection: animate in
      animateModeSwitch(m);
    } else if (mode !== m) {
      // Switching between modes: animate
      animateModeSwitch(m);
    }
  }, [transitioning, phase, mode, animateModeSwitch]);

  /* ── Enter page ── */
  const handleEnter = useCallback(() => {
    if (!mode || phase === "exit" || transitioning) return;
    const path = `/${mode}`;
    setPhase("exit");
    // Use same exit animation delay
    setTimeout(() => { setRemoved(true); navigate(path); }, 1600);
  }, [mode, phase, transitioning, navigate]);

  if (removed) return null;

  const config = displayMode ? MODE_CONFIG[displayMode] : null;
  const showHint = displayMode !== null && phase === "idle";

  return (
    <div
      className={`splash-linear ${phase} ${displayMode ? `splash-mode--${displayMode}` : ""}`}
      onClick={handleEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {/* ── SVG mode transition overlay ── */}
      <svg
        ref={transSvgRef}
        className="splash-transition-svg"
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="splashStroke1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          <linearGradient id="splashStroke2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="50%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#60a5fa" />
          </linearGradient>
        </defs>
        <rect ref={fillRef} x="0" y="0" width="1440" height="900" fill="#050508" opacity="0" />
        <path
          ref={path1Ref}
          d="M -50,200 C 180,80 320,320 500,280 C 720,230 680,450 850,480 C 1020,510 1100,300 1280,380 C 1380,420 1480,500 1520,550"
          fill="none" stroke="url(#splashStroke1)" strokeWidth="120" strokeLinecap="round" opacity="0"
        />
        <path
          ref={path2Ref}
          d="M -30,750 C 200,820 350,600 550,640 C 780,685 720,380 900,350 C 1060,320 1180,500 1350,420 C 1420,390 1490,300 1530,250"
          fill="none" stroke="url(#splashStroke2)" strokeWidth="100" strokeLinecap="round" opacity="0"
        />
      </svg>

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
          className={`splash-btn ${displayMode === "search" ? "splash-btn--active" : ""}`}
          onClick={(e) => { e.stopPropagation(); handleSelectMode("search"); }}
        >
          搜索
        </button>
        <button
          className={`splash-btn ${displayMode === "music" ? "splash-btn--active" : ""}`}
          onClick={(e) => { e.stopPropagation(); handleSelectMode("music"); }}
        >
          音乐
        </button>
        <button
          className={`splash-btn ${displayMode === "wallpaper" ? "splash-btn--active" : ""}`}
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
