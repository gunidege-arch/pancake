import { useRef, useMemo, useState, useCallback, Suspense } from "react";
import { Canvas, useFrame, extend } from "@react-three/fiber";
import {
  PerspectiveCamera,
  shaderMaterial,
  Float,
} from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

/* ═══════════════════════════════════════════════════════════
   GLSL SHADER — glow ring edge
   ═══════════════════════════════════════════════════════════ */
const GlowRingMaterial = shaderMaterial(
  { uTime: 0, uColor: new THREE.Color("#fb7299"), uGlow: new THREE.Color("#8b5cf6") },
  /* vertex */
  `varying vec3 vNormal; varying vec3 vPos;
   void main() {
     vNormal = normalize(normalMatrix * normal);
     vPos = position;
     gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
   }`,
  /* fragment */
  `varying vec3 vNormal; varying vec3 vPos;
   uniform float uTime; varying vec2 vUv;
   uniform vec3 uColor; uniform vec3 uGlow;
   void main() {
     float fresnel = 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
     fresnel = pow(fresnel, 2.5);
     vec3 edge = mix(uColor, uGlow, fresnel);
     float pulse = 0.5 + 0.5 * sin(uTime * 1.5 + vPos.y * 2.0);
     edge += uGlow * fresnel * pulse * 0.4;
     float alpha = 0.5 + fresnel * 0.5;
     gl_FragColor = vec4(edge, alpha);
   }`,
);
extend({ GlowRingMaterial });

/* ═══════════════════════════════════════════════════════════
   GLSL SHADER — particle glow
   ═══════════════════════════════════════════════════════════ */
const GlowParticleMaterial = shaderMaterial(
  { uTime: 0 },
  `varying float vAlpha;
   uniform float uTime;
   void main() {
     vec4 mv = modelViewMatrix * vec4(position, 1.0);
     gl_PointSize = (120.0 / -mv.z) * (0.8 + 0.4 * sin(uTime + position.x * 3.0));
     gl_Position = projectionMatrix * mv;
     vAlpha = 0.6 + 0.4 * sin(uTime * 2.0 + position.y * 5.0);
   }`,
  `varying float vAlpha;
   void main() {
     float d = length(gl_PointCoord - 0.5) * 2.0;
     float glow = exp(-d * 2.5) * vAlpha;
     vec3 col = mix(vec3(0.98, 0.45, 0.60), vec3(0.55, 0.36, 0.96), d);
     gl_FragColor = vec4(col, glow);
   }`,
);
extend({ GlowParticleMaterial });

/* ═══════════════════════════════════════════════════════════
   TWISTED TORUS SPIRAL
   ═══════════════════════════════════════════════════════════ */
function TwistedTorus() {
  const ref = useRef<THREE.Mesh>(null!);
  const matRef = useRef<any>(null!);

  const geo = useMemo(() => {
    const base = new THREE.TorusKnotGeometry(1.6, 0.18, 200, 32, 3, 4);
    const pos = base.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const dist = Math.sqrt(x * x + z * z);
      const twist = Math.sin(dist * 2.5) * 0.2;
      pos.setXYZ(i, x + twist * z, y + Math.cos(dist * 1.8) * 0.15, z - twist * x);
    }
    base.computeVertexNormals();
    return base;
  }, []);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.x += delta * 0.12;
      ref.current.rotation.y += delta * 0.18;
    }
    if (matRef.current?.uniforms) matRef.current.uniforms.uTime.value += delta;
  });

  return (
    <Float speed={0.8} rotationIntensity={0.08} floatIntensity={0.25}>
      <mesh ref={ref} geometry={geo}>
        {/* @ts-ignore */}
        <glowRingMaterial ref={matRef} transparent depthWrite={false} />
      </mesh>
    </Float>
  );
}

/* ═══════════════════════════════════════════════════════════
   PARTICLE ORBIT CLOUD
   ═══════════════════════════════════════════════════════════ */
function ParticleCloud() {
  const ref = useRef<THREE.Points>(null!);
  const positions = useMemo(() => {
    const count = 800;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 1.8 + Math.random() * 2.5;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 3.5;
      pos[i * 3 + 2] = Math.sin(angle) * radius;
    }
    return pos;
  }, []);

  useFrame((_, delta) => { if (ref.current) ref.current.rotation.y += delta * 0.08; });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      {/* @ts-ignore */}
      <glowParticleMaterial transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

/* ═══════════════════════════════════════════════════════════
   MOUSE-FOLLOWING AMBIENT DUST
   ═══════════════════════════════════════════════════════════ */
function MouseDust() {
  const ref = useRef<THREE.Points>(null!);
  const target = useRef({ x: 0, y: 0 });
  const positions = useMemo(() => {
    const count = 400;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 7;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    return pos;
  }, []);

  useFrame(({ pointer }, delta) => {
    target.current.x += (pointer.x * 2.5 - target.current.x) * 0.04;
    target.current.y += (pointer.y * 1.5 - target.current.y) * 0.04;
    const tgt = ref.current;
    if (tgt) {
      tgt.rotation.y += delta * 0.12;
      tgt.position.x = target.current.x;
      tgt.position.y = target.current.y;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.03} color="#c4b5fd" transparent depthWrite={false}
        blending={THREE.AdditiveBlending} opacity={0.5} />
    </points>
  );
}

/* ═══════════════════════════════════════════════════════════
   WIREFRAME SHELL
   ═══════════════════════════════════════════════════════════ */
function WireframeShell() {
  const ref = useRef<THREE.LineSegments>(null!);
  const geo = useMemo(() => new THREE.SphereGeometry(2.5, 32, 20), []);

  useFrame((_, delta) => {
    ref.current.rotation.x += delta * 0.04;
    ref.current.rotation.z += delta * 0.03;
  });

  return (
    <lineSegments ref={ref} geometry={new THREE.EdgesGeometry(geo)}>
      <lineBasicMaterial color="#6666aa" transparent opacity={0.12} depthWrite={false} />
    </lineSegments>
  );
}

/* ═══════════════════════════════════════════════════════════
   SCENE
   ═══════════════════════════════════════════════════════════ */
function Scene3D() {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0.3, 5.5]} fov={50} />
      <EffectComposer>
        <Bloom luminanceThreshold={0.2} intensity={0.8} radius={0.6} mipmapBlur />
      </EffectComposer>
      <ambientLight intensity={0.2} />
      <TwistedTorus />
      <ParticleCloud />
      <MouseDust />
      <WireframeShell />
      <fog attach="fog" args={["#08080f", 5, 18]} />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
interface Props {
  onDismissed: () => void;
}

export default function SplashScreen({ onDismissed }: Props) {
  const [exiting, setExiting] = useState(false);
  const [removed, setRemoved] = useState(false);

  const handleClick = useCallback(() => {
    if (exiting) return;
    setExiting(true);
    setTimeout(() => { setRemoved(true); onDismissed(); }, 1600);
  }, [exiting, onDismissed]);

  if (removed) return null;

  return (
    <div
      onClick={handleClick}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "radial-gradient(ellipse 60% 50% at 50% 40%, #111028 0%, #08080f 70%)",
        cursor: exiting ? "default" : "pointer",
        userSelect: "none", WebkitTapHighlightColor: "transparent",
        touchAction: "manipulation",
        opacity: exiting ? 0 : 1,
        transition: "opacity 1.4s ease-out",
      }}
    >
      <Canvas
        gl={{ antialias: true, powerPreference: "high-performance", alpha: false }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <Scene3D />
        </Suspense>
      </Canvas>

      {!exiting && (
        <div style={{
          position: "absolute", bottom: "2.5rem", left: 0, right: 0,
          textAlign: "center", pointerEvents: "none",
        }}>
          <p style={{
            margin: 0, fontFamily: "'Inter', sans-serif",
            fontSize: "0.68rem", letterSpacing: "0.2em",
            color: "rgba(200,180,220,.35)",
            animation: "hintBreathe 2.8s ease-in-out infinite",
          }}>
            轻触进入
          </p>
        </div>
      )}
    </div>
  );
}
