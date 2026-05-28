import { useState, useCallback, useRef, useEffect } from "react";

/* ── Particle class ────────────────────────────────────── */
interface Particle {
  x: number; y: number; vx: number; vy: number;
  size: number; opacity: number; life: number; maxLife: number;
  color: string;
}

function createParticle(x: number, y: number, burst = false): Particle {
  const angle = Math.random() * Math.PI * 2;
  const speed = burst ? 1.5 + Math.random() * 5 : 0.2 + Math.random() * 0.6;
  const colors = [
    "rgba(200,160,255,?)",
    "rgba(251,114,153,?)",
    "rgba(140,160,240,?)",
    "rgba(255,255,255,?)",
  ];
  const color = colors[Math.floor(Math.random() * colors.length)];
  return {
    x, y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    size: burst ? 1.5 + Math.random() * 3 : 0.8 + Math.random() * 2,
    opacity: burst ? 0.7 + Math.random() * 0.3 : 0,
    life: 0,
    maxLife: burst ? 40 + Math.random() * 60 : 100 + Math.random() * 200,
    color,
  };
}

interface Props {
  onDismissed: () => void;
}

export default function SplashScreen({ onDismissed }: Props) {
  const [exiting, setExiting] = useState(false);
  const [removed, setRemoved] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef({ x: -999, y: -999, active: false });
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef(0);
  const frameCountRef = useRef(0);

  /* ── Initialize particles ── */
  useEffect(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const initial: Particle[] = [];
    for (let i = 0; i < 60; i++) {
      const p = createParticle(Math.random() * w, Math.random() * h);
      p.opacity = 0.15 + Math.random() * 0.35;
      p.life = Math.random() * p.maxLife;
      initial.push(p);
    }
    particlesRef.current = initial;
  }, []);

  /* ── Canvas animation loop ── */
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
      frameCountRef.current++;
      const particles = particlesRef.current;
      const { x: cx, y: cy, active: cursorActive } = cursorRef.current;

      /* ── clear with trail (semi-transparent for motion blur) ── */
      ctx.fillStyle = "rgba(5,5,10,0.22)";
      ctx.fillRect(0, 0, w, h);

      /* ── ambient spawn ── */
      if (frameCountRef.current % 3 === 0 && particles.length < 80) {
        particles.push(createParticle(Math.random() * w, h + 10));
      }

      /* ── update & draw ── */
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;

        /* cursor gravity */
        if (cursorActive && cx > 0 && cy > 0) {
          const dx = cx - p.x;
          const dy = cy - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy) + 1;
          if (dist < 220) {
            const force = 0.25 / (dist * 0.012);
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force;
          }
        }

        /* drift + drag */
        p.vx += (Math.random() - 0.5) * 0.04;
        p.vy -= 0.02; /* subtle upward float */
        p.vx *= 0.995;
        p.vy *= 0.995;

        p.x += p.vx;
        p.y += p.vy;

        /* opacity fade in/out */
        const lifeRatio = p.life / p.maxLife;
        p.opacity = lifeRatio < 0.1
          ? lifeRatio / 0.1 * 0.6
          : lifeRatio > 0.7
            ? (1 - lifeRatio) / 0.3 * 0.6
            : 0.6;

        /* wrap around edges */
        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        if (p.y > h + 20) p.y = -20;

        /* draw */
        if (p.opacity > 0.01) {
          const color = p.color.replace("?", String(p.opacity));
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }

        /* remove dead */
        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
        }
      }

      /* ── connection lines between nearby particles ── */
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 80) {
            const alpha = (1 - dist / 80) * 0.15;
            ctx.strokeStyle = `rgba(180,160,220,${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      /* ── cursor glow ── */
      if (cursorActive && cx > 0 && cy > 0) {
        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60);
        glow.addColorStop(0, "rgba(251,114,153,.12)");
        glow.addColorStop(0.5, "rgba(160,140,220,.06)");
        glow.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, cy, 60, 0, Math.PI * 2);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  /* ── Mouse / touch handlers ── */
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    cursorRef.current = { x: e.clientX, y: e.clientY, active: true };
  }, []);

  const handlePointerLeave = useCallback(() => {
    cursorRef.current = { x: -999, y: -999, active: false };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    /* burst particles at tap point */
    const burst: Particle[] = [];
    for (let i = 0; i < 25; i++) {
      burst.push(createParticle(e.clientX, e.clientY, true));
    }
    particlesRef.current.push(...burst);
  }, []);

  /* ── Click to dismiss ── */
  const handleClick = useCallback(() => {
    if (exiting) return;
    setExiting(true);
  }, [exiting]);

  /* ── Remove DOM ── */
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
      {/* ── Interactive particle canvas ── */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          touchAction: "none",
        }}
      />

      {/* ── Concentric rings ── */}
      <div className="splash-rings">
        <div className="splash-ring splash-ring-1" />
        <div className="splash-ring splash-ring-2" />
        <div className="splash-ring splash-ring-3" />
      </div>

      {/* ── Glass card ── */}
      <div className="splash-glass">
        <div className="splash-shimmer-line" />

        <h1 className="splash-title">
          <span className="splash-title-text">别问了自己搜</span>
        </h1>

        <div className="splash-rule">
          <span className="splash-rule-diamond" />
        </div>

        <p className="splash-hint">轻触任意位置进入</p>
      </div>

      {/* ── Bottom glow ── */}
      <div className="splash-bottom-glow" />
    </div>
  );
}
