import { useRef, useState, useCallback, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls, Text, Sphere, Stars, Float,
  PerspectiveCamera,
} from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";

/* ═══════════════════════════════════════════════════════════
   EARTH TEXTURE
   ═══════════════════════════════════════════════════════════ */
const EARTH_MAP = "https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg";
const EARTH_BUMP = "https://threejs.org/examples/textures/planets/earth_normal_2048.jpg";
const EARTH_SPEC = "https://threejs.org/examples/textures/planets/earth_specular_2048.jpg";

/* ═══════════════════════════════════════════════════════════
   EARTH COMPONENT
   ═══════════════════════════════════════════════════════════ */
function Earth() {
  const earthRef = useRef<THREE.Mesh>(null!);
  const groupRef = useRef<THREE.Group>(null!);
  const [textures] = useState(() => {
    const loader = new THREE.TextureLoader();
    const map = loader.load(EARTH_MAP);
    const bumpMap = loader.load(EARTH_BUMP);
    const specularMap = loader.load(EARTH_SPEC);
    return { map, bumpMap, specularMap };
  });

  useFrame((_, delta) => {
    if (earthRef.current) earthRef.current.rotation.y += delta * 0.12;
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.02;
  });

  return (
    <group ref={groupRef}>
      {/* Orbit ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.8, 3.82, 128]} />
        <meshBasicMaterial color="#4a6c8f" opacity={0.15} transparent side={THREE.DoubleSide} />
      </mesh>
      {/* Earth */}
      <group position={[4, 0, 0]}>
        <Sphere ref={earthRef} args={[0.8, 64, 64]}>
          <meshPhongMaterial
            map={textures.map}
            bumpMap={textures.bumpMap}
            bumpScale={0.05}
            specularMap={textures.specularMap}
            specular={new THREE.Color("#333")}
            shininess={10}
          />
        </Sphere>
        {/* Atmosphere glow */}
        <Sphere args={[0.83, 64, 64]}>
          <meshBasicMaterial
            color="#4a9fff"
            transparent
            opacity={0.08}
            side={THREE.BackSide}
          />
        </Sphere>
      </group>
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════
   SUN (central light)
   ═══════════════════════════════════════════════════════════ */
function Sun() {
  return (
    <group>
      <Sphere args={[0.6, 32, 32]}>
        <meshBasicMaterial color="#ffd4a0" />
      </Sphere>
      <Sphere args={[0.72, 32, 32]}>
        <meshBasicMaterial color="#ffaa44" transparent opacity={0.2} />
      </Sphere>
      <pointLight intensity={2.5} color="#ffe8d0" distance={20} decay={1.5} />
      <ambientLight intensity={0.4} />
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════
   GALAXY SPIRAL (visible when zoomed out)
   ═══════════════════════════════════════════════════════════ */
function GalaxySpiral() {
  const pointsRef = useRef<THREE.Points>(null!);

  const [geo, mat] = (() => {
    const count = 8000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const arms = 4;
    const spiralTightness = 3.5;

    for (let i = 0; i < count; i++) {
      const arm = i % arms;
      const armAngle = (arm / arms) * Math.PI * 2;
      const radius = 5 + Math.pow(Math.random(), 1.5) * 35;
      const spiralAngle = armAngle + radius * 0.22;
      const scatter = (Math.random() - 0.5) * (1.5 + radius * 0.15);

      positions[i * 3] = Math.cos(spiralAngle) * radius + Math.cos(spiralAngle + 1) * scatter;
      positions[i * 3 + 1] = (Math.random() - 0.5) * (1.2 + radius * 0.08);
      positions[i * 3 + 2] = Math.sin(spiralAngle) * radius + Math.sin(spiralAngle + 1) * scatter;

      const t = radius / 40;
      const hue = 0.58 + t * 0.08;
      const lightness = 0.3 + t * 0.35;
      const col = new THREE.Color().setHSL(hue, 0.5, lightness);
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const m = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      opacity: 0.7,
    });
    return [g, m];
  })();

  useFrame((_, delta) => {
    if (pointsRef.current) pointsRef.current.rotation.y += delta * 0.015;
  });

  return <primitive object={new THREE.Points(geo, mat)} ref={pointsRef} />;
}

/* ═══════════════════════════════════════════════════════════
   COSMIC TEXT (3D, naturally occluded by planets)
   ═══════════════════════════════════════════════════════════ */
function CosmicTitle() {
  const ref = useRef<THREE.Group>(null!);

  useFrame(({ clock }) => {
    ref.current.position.y = Math.sin(clock.elapsedTime * 0.3) * 0.15;
  });

  return (
    <Float speed={0.4} rotationIntensity={0} floatIntensity={0.3}>
      <group ref={ref} position={[0, 0.4, 0]}>
        <Text
          fontSize={0.55}
          letterSpacing={0.08}
          color="#e8e0f0"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.015}
          outlineColor="#000000"
          outlineBlur={0.04}
        >
          别问了自己搜
          <meshStandardMaterial
            color="#e8e0f0"
            emissive="#443366"
            emissiveIntensity={0.3}
            metalness={0.4}
            roughness={0.6}
          />
        </Text>
        {/* Hint text below */}
        <Text
          position={[0, -0.5, 0]}
          fontSize={0.1}
          letterSpacing={0.15}
          color="#8888aa"
          anchorX="center"
          anchorY="middle"
          fillOpacity={0.5}
        >
          轻触任意位置进入
        </Text>
      </group>
    </Float>
  );
}

/* ═══════════════════════════════════════════════════════════
   SCENE CONTENT
   ═══════════════════════════════════════════════════════════ */
function Scene({ exiting }: { exiting: boolean }) {
  const controlsRef = useRef<any>(null);
  const camRef = useRef<THREE.PerspectiveCamera>(null!);

  useFrame(() => {
    if (exiting && camRef.current) {
      camRef.current.zoom -= 0.003;
      camRef.current.updateProjectionMatrix();
    }
  });

  return (
    <>
      {/* Post-processing */}
      <EffectComposer>
        <Bloom luminanceThreshold={0.2} intensity={0.6} radius={0.8} mipmapBlur />
        <Vignette darkness={0.45} offset={0.1} />
      </EffectComposer>

      {/* Camera */}
      <PerspectiveCamera
        ref={camRef}
        makeDefault
        position={[0, 1.2, 7]}
        fov={50}
        near={0.1}
        far={200}
      />

      {/* Controls — horizontal orbit + zoom */}
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableZoom={true}
        enableRotate={true}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 1.8}
        minDistance={3}
        maxDistance={50}
        autoRotate={!exiting}
        autoRotateSpeed={0.15}
        dampingFactor={0.08}
        zoomSpeed={1.2}
        rotateSpeed={0.3}
      />

      {/* Lighting */}
      <ambientLight intensity={0.15} color="#1a1a3a" />

      {/* Galaxy (far background) */}
      <GalaxySpiral />

      {/* Deep stars */}
      <Stars radius={80} depth={60} count={3000} factor={5} saturation={0.3} fade speed={0.3} />

      {/* Solar system */}
      <Sun />
      <Earth />

      {/* Mars-like small planet (further out) */}
      <group rotation={[0, Math.PI * 0.3, 0]}>
        <mesh position={[8, -0.3, 1]}>
          <sphereGeometry args={[0.3, 32, 32]} />
          <meshStandardMaterial color="#c1440e" roughness={0.8} metalness={0.1} />
        </mesh>
      </group>

      {/* Belt of asteroids */}
      <group rotation={[0.1, 0, 0]}>
        {Array.from({ length: 200 }, (_, i) => {
          const angle = (i / 200) * Math.PI * 2;
          const radius = 5.5 + Math.random() * 1.2;
          const y = (Math.random() - 0.5) * 0.3;
          return (
            <mesh
              key={i}
              position={[Math.cos(angle) * radius, y, Math.sin(angle) * radius]}
            >
              <sphereGeometry args={[0.02 + Math.random() * 0.04, 4, 4]} />
              <meshStandardMaterial color="#999" roughness={1} />
            </mesh>
          );
        })}
      </group>

      {/* 3D text — naturally occluded */}
      <CosmicTitle />

      {/* Fog for depth */}
      <fog attach="fog" args={["#020812", 15, 60]} />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   FALLBACK (before R3F loads)
   ═══════════════════════════════════════════════════════════ */
function Fallback() {
  return (
    <div style={{
      position: "absolute", inset: 0, display: "flex",
      alignItems: "center", justifyContent: "center",
      background: "#020812",
    }}>
      <div style={{
        fontFamily: "'Cinzel Decorative', serif",
        fontSize: "clamp(1.2rem, 4vw, 1.8rem)",
        color: "rgba(200,180,220,.6)",
        letterSpacing: "0.1em",
      }}>
        别问了自己搜
      </div>
    </div>
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
  const exitTimerRef = useRef<number>(0);

  const handleClick = useCallback(() => {
    if (exiting) return;
    setExiting(true);
    exitTimerRef.current = window.setTimeout(() => {
      setRemoved(true);
      onDismissed();
    }, 2500);
  }, [exiting, onDismissed]);

  if (removed) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#020812",
        cursor: exiting ? "default" : "pointer",
        userSelect: "none",
        WebkitTapHighlightColor: "transparent",
        touchAction: "pan-x pan-y pinch-zoom",
        opacity: exiting ? 0 : 1,
        transition: "opacity 2s ease-out",
      }}
      onClick={handleClick}
    >
      <Suspense fallback={<Fallback />}>
        <Canvas
          gl={{
            antialias: true,
            powerPreference: "high-performance",
            alpha: false,
          }}
          dpr={[1, 2]}
        >
          <Scene exiting={exiting} />
        </Canvas>
      </Suspense>

      {/* Overlay hint — only visible before click */}
      {!exiting && (
        <div style={{
          position: "absolute",
          bottom: "2rem",
          left: 0, right: 0,
          textAlign: "center",
          pointerEvents: "none",
        }}>
          <p style={{
            margin: 0,
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.7rem",
            letterSpacing: "0.2em",
            color: "rgba(255,255,255,.2)",
            animation: "hintBreathe 2.8s ease-in-out infinite",
          }}>
            拖动探索宇宙 · 点击进入
          </p>
        </div>
      )}
    </div>
  );
}
