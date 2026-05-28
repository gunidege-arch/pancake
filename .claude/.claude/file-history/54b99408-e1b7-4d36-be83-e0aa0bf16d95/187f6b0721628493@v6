import { useRef, useEffect, useState, useCallback } from "react";
import * as THREE from "three";

/* ── Color environments ────────────────────────────────── */
const ENVIRONMENTS = [
  { name: "深海", bg: "#020812", primary: "#4a8ec9", accent: "#7ab8f0" },
  { name: "极光", bg: "#010a08", primary: "#4ec9a4", accent: "#7af0d0" },
  { name: "暮光", bg: "#0a0408", primary: "#c94a7a", accent: "#f07aaa" },
  { name: "紫夜", bg: "#060410", primary: "#8b5cf6", accent: "#b794f4" },
];

const PARTICLE_COUNT = 1800;
const DEPTH_LAYERS = 4;

/* ── Generate soft circle texture for points ───────────── */
function createPointTexture(): THREE.Texture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.08, "rgba(255,255,255,0.9)");
  gradient.addColorStop(0.25, "rgba(255,255,255,0.5)");
  gradient.addColorStop(0.5, "rgba(255,255,255,0.1)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

interface Props {
  onDismissed: () => void;
}

export default function SplashScreen({ onDismissed }: Props) {
  const [exiting, setExiting] = useState(false);
  const [removed, setRemoved] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const animRef = useRef({
    camera: null as THREE.PerspectiveCamera | null,
    renderer: null as THREE.WebGLRenderer | null,
    points: [] as THREE.Points[],
    scene: null as THREE.Scene | null,
    targetX: 0, targetY: 0,
    env: 0,
    frame: 0,
    exitProgress: 0,
  });

  /* ── Three.js setup ── */
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const w = window.innerWidth;
    const h = window.innerHeight;
    const anim = animRef.current;

    /* Scene */
    const scene = new THREE.Scene();
    anim.scene = scene;

    /* Camera */
    const camera = new THREE.PerspectiveCamera(60, w / h, 1, 2000);
    camera.position.z = 500;
    anim.camera = camera;

    /* Renderer */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);
    anim.renderer = renderer;

    /* Point texture */
    const texture = createPointTexture();

    /* ── Create particle layers (different Z depths) ── */
    const layers = DEPTH_LAYERS;
    const pointsPerLayer = Math.floor(PARTICLE_COUNT / layers);
    const points: THREE.Points[] = [];

    for (let l = 0; l < layers; l++) {
      const zDepth = -200 + l * 160; /* spread along Z: -200 to +280 */
      const spread = 350 + l * 80;   /* further layers spread wider */
      const geo = new THREE.BufferGeometry();
      const positions = new Float32Array(pointsPerLayer * 3);
      const colors = new Float32Array(pointsPerLayer * 3);
      const sizes = new Float32Array(pointsPerLayer);

      for (let i = 0; i < pointsPerLayer; i++) {
        positions[i * 3] = (Math.random() - 0.5) * spread * 2;
        positions[i * 3 + 1] = (Math.random() - 0.5) * spread * 1.4;
        positions[i * 3 + 2] = zDepth + (Math.random() - 0.5) * 100;
        sizes[i] = 2 + Math.random() * 5 * (1 - l * 0.2);
        /* hue varies slightly per layer */
        const hue = 0.55 + l * 0.04 + Math.random() * 0.06;
        const col = new THREE.Color().setHSL(hue, 0.6, 0.5 + l * 0.12);
        colors[i * 3] = col.r;
        colors[i * 3 + 1] = col.g;
        colors[i * 3 + 2] = col.b;
      }

      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      geo.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

      const mat = new THREE.PointsMaterial({
        size: 6,
        map: texture,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        vertexColors: true,
        transparent: true,
        opacity: 0.75,
      });

      const pts = new THREE.Points(geo, mat);
      scene.add(pts);
      points.push(pts);
    }
    anim.points = points;

    /* ── Ambient floating particles (no depth, scattered all around) ── */
    const ambientCount = 200;
    const ambGeo = new THREE.BufferGeometry();
    const ambPos = new Float32Array(ambientCount * 3);
    for (let i = 0; i < ambientCount; i++) {
      ambPos[i * 3] = (Math.random() - 0.5) * 1200;
      ambPos[i * 3 + 1] = (Math.random() - 0.5) * 800;
      ambPos[i * 3 + 2] = -300 + Math.random() * 600;
    }
    ambGeo.setAttribute("position", new THREE.BufferAttribute(ambPos, 3));
    const ambMat = new THREE.PointsMaterial({
      size: 2.5,
      map: texture,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: new THREE.Color("#ffffff"),
      transparent: true,
      opacity: 0.3,
    });
    const ambient = new THREE.Points(ambGeo, ambMat);
    scene.add(ambient);
    points.push(ambient);

    /* ── Resize ── */
    const onResize = () => {
      const nw = window.innerWidth;
      const nh = window.innerHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };
    window.addEventListener("resize", onResize);

    /* ── Render loop ── */
    let raf = 0;
    const loop = () => {
      anim.frame++;
      const t = anim.frame * 0.01;

      /* camera sway */
      camera.position.x += (anim.targetX * 60 - camera.position.x) * 0.03;
      camera.position.y += (anim.targetY * 40 - camera.position.y) * 0.03;
      camera.lookAt(0, 0, 0);

      /* rotate each layer at different speeds (parallax) */
      points.forEach((pts, i) => {
        if (i < layers) {
          const speed = 0.08 + i * 0.025;
          pts.rotation.y += speed * 0.008;
          pts.rotation.x += speed * 0.004;
        } else {
          pts.rotation.y += 0.02;
        }
      });

      /* exit animation */
      if (exiting) {
        anim.exitProgress += 0.008;
        const ep = Math.min(anim.exitProgress, 1);
        camera.position.z = 500 + ep * 800; /* zoom in */
        renderer.domElement.style.opacity = String(1 - ep);
        points.forEach((pts) => {
          const mat = pts.material as THREE.PointsMaterial;
          if (mat.opacity !== undefined) mat.opacity = 0.75 * (1 - ep);
        });
        if (ep >= 1) {
          cancelAnimationFrame(raf);
          setRemoved(true);
          onDismissed();
          return;
        }
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [exiting, onDismissed]);

  /* ── Spacebar → cycle environment ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        animRef.current.env = (animRef.current.env + 1) % ENVIRONMENTS.length;
        const env = ENVIRONMENTS[animRef.current.env];
        animRef.current.points.forEach((pts) => {
          if (Array.isArray(pts.material)) return;
          const hsl = { h: 0, s: 0, l: 0 };
          (pts.material as THREE.PointsMaterial).color!.getHSL(hsl);
          const newCol = new THREE.Color(env.primary);
          (pts.material as THREE.PointsMaterial).color!.set(newCol);
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ── Pointer ── */
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    animRef.current.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
    animRef.current.targetY = -(e.clientY / window.innerHeight - 0.5) * 2;
  }, []);
  const handlePointerLeave = useCallback(() => {
    animRef.current.targetX = 0;
    animRef.current.targetY = 0;
  }, []);
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    /* burst impulse — briefly shake the camera target */
    animRef.current.targetX += (e.clientX / window.innerWidth - 0.5) * 3;
    animRef.current.targetY += -(e.clientY / window.innerHeight - 0.5) * 3;
  }, []);

  /* ── Dismiss ── */
  const handleClick = useCallback(() => {
    if (exiting) return;
    setExiting(true);
  }, [exiting]);

  if (removed) return null;

  const env = ENVIRONMENTS[animRef.current.env];

  return (
    <div
      ref={overlayRef}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden", cursor: exiting ? "default" : "pointer",
        userSelect: "none", WebkitTapHighlightColor: "transparent",
        touchAction: "manipulation",
        background: env.bg,
        transition: "background 1s ease",
      }}
      onClick={handleClick}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
    >
      {/* Three.js mount */}
      <div
        ref={mountRef}
        style={{ position: "absolute", inset: 0, zIndex: 1 }}
      />

      {/* Glass card */}
      <div
        className="splash-glass"
        style={{
          zIndex: 2,
          opacity: exiting ? Math.max(0, 1 - (animRef.current.exitProgress || 0) * 2) : 1,
          transition: "opacity 0.3s",
        }}
      >
        <div className="splash-shimmer-line" />
        <h1 className="splash-title">
          <span className="splash-title-text">别问了自己搜</span>
        </h1>
        <div className="splash-rule">
          <span className="splash-rule-diamond" />
        </div>
        <p className="splash-hint">轻触任意位置进入</p>
        <p style={{
          margin: 0, fontSize: "0.6rem", color: "rgba(255,255,255,.18)",
          letterSpacing: "0.1em", fontFamily: "Inter, sans-serif",
        }}>
          空格切换场景 · {env.name}
        </p>
      </div>
    </div>
  );
}
