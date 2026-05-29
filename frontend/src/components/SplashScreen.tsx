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
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
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
    const paths = pathRefs.current.filter(Boolean) as SVGPathElement[];
    const fill = fillRef.current;
    if (paths.length === 0 || !fill) {
      setDisplayMode(nextMode);
      setMode(nextMode);
      return;
    }

    setTransitioning(true);

    const baseLen = paths[0].getTotalLength();

    gsap.set(paths, { strokeDasharray: baseLen, strokeDashoffset: baseLen, opacity: 1 });
    gsap.set(fill, { opacity: 0 });

    const tl = gsap.timeline();

    // Phase 1: flowing strokes draw on, staggered
    tl.to(paths, {
      strokeDashoffset: 0,
      duration: 0.65,
      ease: "power2.inOut",
      stagger: 0.04,
    })
    // Phase 2: fill briefly
    .to(fill, {
      opacity: 1,
      duration: 0.18,
      ease: "power2.in",
    })
    // Phase 3: switch content
    .call(() => {
      setDisplayMode(nextMode);
      setMode(nextMode);
    })
    // Phase 4: strokes flow out
    .to(fill, {
      opacity: 0,
      duration: 0.1,
      ease: "power2.out",
    })
    .to(paths, {
      strokeDashoffset: -baseLen,
      duration: 0.6,
      ease: "power3.in",
      stagger: 0.03,
    })
    .call(() => {
      gsap.set(paths, { opacity: 0, strokeDashoffset: baseLen });
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
        className="splash-transition-svg"
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="sG1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
          <linearGradient id="sG2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#818cf8" />
          </linearGradient>
          <linearGradient id="sG3" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>
          <linearGradient id="sG4" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#6d28d9" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>

        <rect ref={fillRef} x="0" y="0" width="1440" height="900" fill="#0a0a14" opacity="0" />

        {/* 12 flowing brush strokes — together cover entire viewport */}
        <path ref={(el) => { pathRefs.current[0] = el; }}
          d="M -60,120 C 180,40 300,280 520,200 C 740,120 680,380 880,440 C 1080,500 1180,300 1380,380 C 1500,420 1580,520 1640,560"
          fill="none" stroke="url(#sG1)" strokeWidth="22" strokeLinecap="round" opacity="0" />
        <path ref={(el) => { pathRefs.current[1] = el; }}
          d="M -40,780 C 200,840 340,580 560,620 C 780,660 700,340 920,310 C 1120,280 1200,540 1400,460 C 1500,400 1600,240 1660,180"
          fill="none" stroke="url(#sG2)" strokeWidth="20" strokeLinecap="round" opacity="0" />
        <path ref={(el) => { pathRefs.current[2] = el; }}
          d="M -80,400 C 140,350 280,520 480,460 C 680,400 720,560 940,510 C 1140,460 1220,380 1420,420 C 1540,450 1620,520 1680,550"
          fill="none" stroke="url(#sG3)" strokeWidth="28" strokeLinecap="round" opacity="0" />
        <path ref={(el) => { pathRefs.current[3] = el; }}
          d="M 1660,100 C 1380,180 1300,340 1120,300 C 920,260 980,480 780,520 C 580,560 480,380 280,430 C 160,460 60,590 -60,640"
          fill="none" stroke="url(#sG4)" strokeWidth="18" strokeLinecap="round" opacity="0" />
        <path ref={(el) => { pathRefs.current[4] = el; }}
          d="M 1660,700 C 1400,620 1340,440 1140,480 C 940,520 1000,680 800,650 C 620,620 520,760 320,720 C 180,690 60,790 -80,840"
          fill="none" stroke="url(#sG1)" strokeWidth="24" strokeLinecap="round" opacity="0" />
        <path ref={(el) => { pathRefs.current[5] = el; }}
          d="M -60,30 C 120,100 200,180 400,130 C 600,80 520,280 740,240 C 960,200 1000,340 1200,300 C 1400,260 1520,360 1660,320"
          fill="none" stroke="url(#sG2)" strokeWidth="16" strokeLinecap="round" opacity="0" />
        <path ref={(el) => { pathRefs.current[6] = el; }}
          d="M -60,900 C 160,800 280,650 480,700 C 680,750 600,550 820,510 C 1020,480 1100,620 1300,580 C 1460,550 1580,680 1680,640"
          fill="none" stroke="url(#sG3)" strokeWidth="20" strokeLinecap="round" opacity="0" />
        <path ref={(el) => { pathRefs.current[7] = el; }}
          d="M 1680,800 C 1440,720 1300,550 1100,580 C 880,620 940,740 720,700 C 520,660 460,820 240,780 C 120,750 20,860 -80,880"
          fill="none" stroke="url(#sG4)" strokeWidth="14" strokeLinecap="round" opacity="0" />
        <path ref={(el) => { pathRefs.current[8] = el; }}
          d="M 320,-60 C 380,160 280,300 480,260 C 680,220 580,420 800,380 C 980,350 900,500 1100,460 C 1280,420 1300,580 1480,540"
          fill="none" stroke="url(#sG1)" strokeWidth="26" strokeLinecap="round" opacity="0" />
        <path ref={(el) => { pathRefs.current[9] = el; }}
          d="M 1100,960 C 1060,780 1180,640 980,680 C 780,720 880,520 660,560 C 440,600 540,400 320,440 C 180,470 120,300 -60,260"
          fill="none" stroke="url(#sG2)" strokeWidth="18" strokeLinecap="round" opacity="0" />
        <path ref={(el) => { pathRefs.current[10] = el; }}
          d="M 720,-60 C 780,100 680,240 860,280 C 1020,320 920,480 1100,520 C 1260,560 1280,680 1460,710"
          fill="none" stroke="url(#sG3)" strokeWidth="16" strokeLinecap="round" opacity="0" />
        <path ref={(el) => { pathRefs.current[11] = el; }}
          d="M 750,960 C 690,800 780,660 600,620 C 440,580 540,420 360,380 C 200,340 240,200 80,160"
          fill="none" stroke="url(#sG4)" strokeWidth="22" strokeLinecap="round" opacity="0" />
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
