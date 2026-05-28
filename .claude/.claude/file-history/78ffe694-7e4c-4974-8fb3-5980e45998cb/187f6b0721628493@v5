import { useState, useCallback, useRef, useEffect } from "react";

/* ── 3-layer depth system (near / mid / far) ──────────── */
interface Dot {
  x: number; y: number; z: number; /* 0=far ... 1=near */
  vx: number; vy: number;
  size: number; opacity: number;
  hue: number;
}

function spawnDot(w: number, h: number): Dot {
  const z = Math.random(); /* depth: 0 (far) to 1 (near) */
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    z,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3 - 0.15, /* slight upward drift */
    size: 0.6 + z * 2.4,   /* near dots are bigger */
    opacity: 0.1 + z * 0.5, /* near dots are brighter */
    hue: 210 + Math.random() * 60, /* blue-teal range */
  };
}

/* ── "Environments" — color palettes cycled by spacebar ── */
const ENVIRONMENTS = [
  { name: "深海", bg: "#020812", hue: 215, accent: "#4a8ec9" },
  { name: "极光", bg: "#010a08", hue: 170, accent: "#4ec9a4" },
  { name: "暮光", bg: "#0a0408", hue: 330, accent: "#c94a7a" },
  { name: "紫夜", bg: "#060410", hue: 260, accent: "#8b5cf6" },
];

/* ── Grid/geometric lines ──────────────────────────────── */
function drawVignette(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const gradient = ctx.createRadialGradient(w / 2, h / 2, h * 0.35, w / 2, h / 2, h * 0.85);
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(1, "rgba(0,0,0,0.65)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
}

function drawScanlines(ctx: CanvasRenderingContext2D, w: number, h: number, frame: number) {
  ctx.fillStyle = "rgba(0,0,0,0.015)";
  for (let y = 0; y < h; y += 3) {
    ctx.fillRect(0, y, w, 1);
  }
}

function drawCenterGlow(ctx: CanvasRenderingContext2D, w: number, h: number, hue: number, t: number) {
  const cx = w / 2;
  const cy = h / 2;
  const pulse = 1 + Math.sin(t * 0.001) * 0.15;
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, h * 0.45 * pulse);
  const hsl = (h: number) => `hsla(${hue}, 60%, 55%, ${h})`;
  glow.addColorStop(0, hsl(0.06));
  glow.addColorStop(0.3, hsl(0.03));
  glow.addColorStop(0.6, hsl(0.01));
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
}

/* ── Dot connection lines (only for near-layer dots) ───── */
function drawConnections(ctx: CanvasRenderingContext2D, dots: Dot[], threshold: number, hue: number) {
  for (let i = 0; i < dots.length; i++) {
    for (let j = i + 1; j < dots.length; j++) {
      const a = dots[i];
      const b = dots[j];
      if (a.z < 0.5 || b.z < 0.5) continue; /* only near dots connect */
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < threshold) {
        const alpha = (1 - dist / threshold) * 0.12 * a.z * b.z;
        ctx.strokeStyle = `hsla(${hue}, 60%, 65%, ${alpha})`;
        ctx.lineWidth = 0.4;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }
}

/* ═══════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════ */
interface Props {
  onDismissed: () => void;
}

const DOT_COUNT = 70;

export default function SplashScreen({ onDismissed }: Props) {
  const [exiting, setExiting] = useState(false);
  const [removed, setRemoved] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const envRef = useRef(0);
  const cursorRef = useRef({ x: -999, y: -999, active: false });
  const dotsRef = useRef<Dot[]>([]);
  const rafRef = useRef(0);
  const frameRef = useRef(0);

  /* ── Init dots ── */
  useEffect(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    dotsRef.current = Array.from({ length: DOT_COUNT }, () => spawnDot(w, h));
  }, []);

  /* ── Canvas loop ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let w = window.innerWidth;
    let h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;

    const onResize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
    };
    window.addEventListener("resize", onResize);

    const loop = () => {
      const f = frameRef.current++;
      const t = performance.now();
      const env = ENVIRONMENTS[envRef.current];
      const { x: cx, y: cy, active: cursorActive } = cursorRef.current;

      /* ── backdrop ── */
      ctx.fillStyle = env.bg;
      ctx.fillRect(0, 0, w, h);

      /* ── center glow ── */
      drawCenterGlow(ctx, w, h, env.hue, t);

      const dots = dotsRef.current;

      /* ── maintain count ── */
      while (dots.length < DOT_COUNT) dots.push(spawnDot(w, h));
      if (dots.length > DOT_COUNT + 10) dots.splice(DOT_COUNT);

      /* ── update + draw dots ── */
      for (let i = dots.length - 1; i >= 0; i--) {
        const d = dots[i];
        const depthFactor = 0.3 + d.z * 0.7;

        /* cursor gravity (stronger on near dots) */
        if (cursorActive && cx > 0 && cy > 0) {
          const dx = cx - d.x;
          const dy = cy - d.y;
          const dist = Math.sqrt(dx * dx + dy * dy) + 1;
          if (dist < 250) {
            const force = depthFactor * 0.18 / (dist * 0.008);
            d.vx += (dx / dist) * force;
            d.vy += (dy / dist) * force;
          }
        }

        /* drift */
        d.vx += (Math.random() - 0.5) * 0.03;
        d.vy += (Math.random() - 0.5) * 0.02 - 0.015;
        d.vx *= 0.994;
        d.vy *= 0.994;

        /* move */
        d.x += d.vx * depthFactor;
        d.y += d.vy * depthFactor;

        /* wrap */
        if (d.x < -30) d.x = w + 30;
        if (d.x > w + 30) d.x = -30;
        if (d.y < -30) { d.y = h + 30; d.x = Math.random() * w; }
        if (d.y > h + 30) { d.y = -30; d.x = Math.random() * w; }

        /* draw */
        const alpha = d.opacity * (0.5 + depthFactor * 0.5);
        ctx.fillStyle = `hsla(${env.hue + d.z * 40}, 50%, ${45 + d.z * 40}%, ${alpha})`;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
        ctx.fill();
      }

      /* ── connections ── */
      drawConnections(ctx, dots, 100, env.hue);

      /* ── scanlines ── */
      drawScanlines(ctx, w, h, f);

      /* ── vignette ── */
      drawVignette(ctx, w, h);

      /* ── cursor glow ── */
      if (cursorActive && cx > 0 && cy > 0) {
        const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 70);
        cg.addColorStop(0, `hsla(${env.hue}, 70%, 65%, 0.1)`);
        cg.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = cg;
        ctx.beginPath();
        ctx.arc(cx, cy, 70, 0, Math.PI * 2);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener("resize", onResize); };
  }, []);

  /* ── Spacebar → cycle environment ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        envRef.current = (envRef.current + 1) % ENVIRONMENTS.length;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ── Pointer ── */
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    cursorRef.current = { x: e.clientX, y: e.clientY, active: true };
  }, []);
  const handlePointerLeave = useCallback(() => {
    cursorRef.current = { x: -999, y: -999, active: false };
  }, []);
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    /* burst */
    for (let i = 0; i < 15; i++) {
      const d = spawnDot(window.innerWidth, window.innerHeight);
      d.x = e.clientX + (Math.random() - 0.5) * 40;
      d.y = e.clientY + (Math.random() - 0.5) * 40;
      d.z = 0.6 + Math.random() * 0.4;
      d.vx = (Math.random() - 0.5) * 4;
      d.vy = (Math.random() - 0.5) * 4;
      d.opacity = 0.8;
      dotsRef.current.push(d);
    }
  }, []);

  /* ── Dismiss ── */
  const handleClick = useCallback(() => {
    if (exiting) return;
    setExiting(true);
  }, [exiting]);
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

  const env = ENVIRONMENTS[envRef.current];

  return (
    <div
      ref={overlayRef}
      className={`splash-overlay ${exiting ? "splash-exit" : ""}`}
      onClick={handleClick}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
      onAnimationEnd={handleAnimationEnd}
    >
      {/* Canvas layer */}
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, zIndex: 1, touchAction: "none" }}
      />

      {/* Glass card — centered */}
      <div className="splash-glass" style={{ zIndex: 2 }}>
        <div className="splash-shimmer-line" />
        <h1 className="splash-title">
          <span className="splash-title-text">别问了自己搜</span>
        </h1>
        <div className="splash-rule">
          <span className="splash-rule-diamond" />
        </div>
        <p className="splash-hint">轻触任意位置进入</p>
        <p style={{
          margin: 0, fontSize: "0.6rem", color: "rgba(255,255,255,.15)",
          letterSpacing: "0.1em", fontFamily: "Inter, sans-serif",
        }}>
          按空格键切换场景 · {env.name}
        </p>
      </div>
    </div>
  );
}
