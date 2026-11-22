import React, { Suspense, useEffect, useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, Audio, Sequence, random, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useLoader, useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { InkPass, noInkFallback, NOINK } from "../jimi3d/ink";
import { LensBlur } from "../jimi3d/lensblur";
import { GradeEffect, GRADES, GRADE_STRENGTH } from "../jimi3d/grade";
import wordsData from "../../../public/chester-crawling/words.json";

export const CHESTER_CRAWL_FPS = 30;
export const CHESTER_CRAWL_DUR = 74.0;
export const CHESTER_CRAWL_FRAMES = Math.ceil(CHESTER_CRAWL_DUR * CHESTER_CRAWL_FPS);

type SceneId = "hook" | "song" | "conflict" | "reveal" | "responsibility" | "grammy" | "final";
const SCENES: { id: SceneId; a: number; b: number }[] = [
  { id: "hook", a: 0.0, b: 6.0 },
  { id: "song", a: 6.0, b: 16.2 },
  { id: "conflict", a: 16.2, b: 32.0 },
  { id: "reveal", a: 32.0, b: 44.0 },
  { id: "responsibility", a: 44.0, b: 53.5 },
  { id: "grammy", a: 53.5, b: 65.0 },
  { id: "final", a: 65.0, b: 74.0 },
];

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (t: number) => { const u = clamp01(t); return u * u * (3 - 2 * u); };
const smoother = (t: number) => { const u = clamp01(t); return u * u * u * (u * (u * 6 - 15) + 10); };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const sceneInfo = (time: number) => {
  for (let i = 0; i < SCENES.length; i++) {
    const s = SCENES[i];
    if (time >= s.a && time < s.b) return { ...s, local: time - s.a, dur: Math.max(0.001, s.b - s.a), idx: i };
  }
  const last = SCENES[SCENES.length - 1];
  return { ...last, local: Math.max(0, time - last.a), dur: Math.max(0.001, last.b - last.a), idx: SCENES.length - 1 };
};

// Palavras que ganham um "punch" de câmera/luz, sincronizadas à narração.
const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/gi, "").toLowerCase();
const PUNCH_KEYS = ["grammy", "batalha", "2000", "crawling", "controle", "responsabilidade", "milh", "vida"];
const PUNCHES: { t: number; dir: number }[] = (() => {
  const ws = (wordsData as unknown as { words?: { word: string; start: number }[] }).words || [];
  const out: { t: number; dir: number }[] = [];
  ws.forEach((w, i) => {
    const n = norm(w.word);
    if (n && PUNCH_KEYS.some((k) => n.includes(k))) out.push({ t: w.start, dir: i % 2 === 0 ? 1 : -1 });
  });
  return out.sort((a, b) => a.t - b.t);
})();

type Pose = "normal" | "singing" | "sad";
const useTex = (name: string) => {
  const tex = useLoader(THREE.TextureLoader, staticFile(`chester-crawling/${name}`));
  useEffect(() => { tex.colorSpace = THREE.SRGBColorSpace; tex.needsUpdate = true; }, [tex]);
  return tex;
};

const Sprite: React.FC<{ tex: THREE.Texture; pos: [number, number, number]; size: [number, number]; opacity?: number; rot?: [number, number, number] }> = ({ tex, pos, size, opacity = 1, rot = [0, 0, 0] }) => (
  <mesh position={pos} rotation={rot} layers={NOINK}>
    <planeGeometry args={size} />
    <meshBasicMaterial map={tex} transparent alphaTest={0.04} opacity={opacity} side={THREE.DoubleSide} toneMapped={false} depthWrite={false} />
  </mesh>
);

const Chester: React.FC<{ pose: Pose; pos: [number, number, number]; scale?: number; tilt?: number; opacity?: number; energy?: number }> = ({ pose, pos, scale = 1, tilt = 0, opacity = 1, energy = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const normal = useTex("chester_normal.png");
  const singing = useTex("chester_singing.png");
  const sad = useTex("chester_sad.png");
  const tex = pose === "normal" ? normal : pose === "singing" ? singing : sad;
  const breathe = 1 + 0.009 * Math.sin(t * 1.8);
  const pulse = 1 + energy * 0.018 * Math.abs(Math.sin(t * 4.2));
  const bob = Math.sin(t * 1.3) * (0.012 + energy * 0.022);
  const sway = Math.sin(t * 0.8) * (0.004 + energy * 0.009) + tilt;
  const s = scale * breathe * pulse;
  return <Sprite tex={tex} pos={[pos[0], pos[1] + bob, pos[2]]} size={[2.6 * s, 3.5 * s]} opacity={opacity} rot={[0, 0, sway]} />;
};

const Crowd: React.FC<{ color?: string; hype?: boolean }> = ({ color = "#12121a", hype = false }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const t = frame / fps;
  const people = useMemo(() => Array.from({ length: 48 }, (_, i) => ({
    x: (i / 47 - 0.5) * 14, h: 0.4 + random(`ch-h-${i}`) * 0.35, w: 0.14 + random(`ch-w-${i}`) * 0.08,
    z: -5.8 - random(`ch-z-${i}`) * 3.5, ph: random(`ch-ph-${i}`) * Math.PI * 2,
  })), []);
  const amp = hype ? 0.12 : 0.03; const spd = hype ? 3.6 : 1.2;
  return <group>{people.map((p, i) => {
    const b = Math.abs(Math.sin(t * spd + p.ph)) * amp;
    const arm = hype ? 0.5 + Math.sin(t * spd * 0.8 + p.ph) * 0.45 : 0;
    return (
      <group key={i} position={[p.x, 0.25 + b, p.z]}>
        <mesh layers={NOINK} position={[0, p.h * 0.7, 0]}><sphereGeometry args={[p.w * 0.33, 7, 7]} /><meshBasicMaterial color={color} transparent opacity={0.92} toneMapped={false} /></mesh>
        <mesh layers={NOINK} position={[0, p.h * 0.25, 0]}><capsuleGeometry args={[p.w * 0.26, p.h * 0.42, 4, 8]} /><meshBasicMaterial color={color} transparent opacity={0.92} toneMapped={false} /></mesh>
        {hype && (
          <>
            <mesh layers={NOINK} position={[-p.w * 0.35, p.h * 0.62 + arm * 0.12, 0]} rotation={[0, 0, 0.35 + arm]}><capsuleGeometry args={[p.w * 0.08, p.h * 0.35, 3, 6]} /><meshBasicMaterial color={color} toneMapped={false} /></mesh>
            <mesh layers={NOINK} position={[p.w * 0.35, p.h * 0.62 + arm * 0.12, 0]} rotation={[0, 0, -0.35 - arm]}><capsuleGeometry args={[p.w * 0.08, p.h * 0.35, 3, 6]} /><meshBasicMaterial color={color} toneMapped={false} /></mesh>
          </>
        )}
      </group>
    );
  })}</group>;
};

const DustParticles: React.FC<{ warm?: boolean; intensity?: number }> = ({ warm = false, intensity = 1 }) => {
  const pts = useMemo(() => Array.from({ length: 60 }, (_, i) => ({
    x: (random(`dust-x-${i}`) - 0.5) * 5.5, y: 0.3 + random(`dust-y-${i}`) * 4.2, z: -3.2 + random(`dust-z-${i}`) * 3.6,
    ph: random(`dust-ph-${i}`) * Math.PI * 2, sp: 0.2 + random(`dust-sp-${i}`) * 0.45, r: 0.012 + random(`dust-r-${i}`) * 0.022,
  })), []);
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const t = frame / fps;
  const col = warm ? "#ffe0a8" : "#c6e6ff";
  return <group>{pts.map((p, i) => {
    const y = p.y + Math.sin(t * p.sp + p.ph) * 0.22;
    const x = p.x + Math.sin(t * p.sp * 0.7 + p.ph) * 0.09;
    const o = (0.12 + 0.26 * Math.abs(Math.sin(t * 0.9 + p.ph))) * intensity;
    return <mesh key={i} position={[x, y, p.z]} layers={NOINK}><sphereGeometry args={[p.r, 6, 6]} /><meshBasicMaterial color={col} transparent opacity={o} toneMapped={false} /></mesh>;
  })}</group>;
};

const LightBeams: React.FC<{ colors: string[]; speed?: number }> = ({ colors, speed = 0.6 }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const t = frame / fps;
  return <group>{colors.map((c, i) => {
    const a = t * speed * (i % 2 ? -1 : 1) + i * 1.9;
    return (
      <mesh key={i} position={[Math.sin(a) * 2.6, 3.0, -3.4 + Math.cos(a) * 0.5]} rotation={[0, 0, Math.sin(a) * 0.42]} layers={NOINK}>
        <coneGeometry args={[0.62, 5.0, 12, 1, true]} />
        <meshBasicMaterial color={c} transparent opacity={0.055} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
    );
  })}</group>;
};

const WaveBars: React.FC<{ color: string; y?: number; z?: number; count?: number }> = ({ color, y = 0.4, z = -4.6, count = 14 }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const t = frame / fps;
  return <group>{Array.from({ length: count }, (_, i) => {
    const h = 0.12 + Math.abs(Math.sin(t * 2.4 + i * 0.62)) * 0.85;
    return <mesh key={i} position={[(i / (count - 1) - 0.5) * 6.8, y + h / 2, z]} layers={NOINK}>
      <boxGeometry args={[0.12, h, 0.08]} />
      <meshBasicMaterial color={color} transparent opacity={0.42} toneMapped={false} blending={THREE.AdditiveBlending} />
    </mesh>;
  })}</group>;
};

const Vinyl: React.FC<{ pos: [number, number, number] }> = ({ pos }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const t = frame / fps;
  return <group position={pos} rotation={[0, -0.12, t * 1.35]}>
    <mesh layers={NOINK}><circleGeometry args={[0.56, 32]} /><meshBasicMaterial color="#0a0a10" toneMapped={false} /></mesh>
    <mesh position={[0, 0, 0.006]} layers={NOINK}><ringGeometry args={[0.2, 0.52, 32]} /><meshBasicMaterial color="#171b28" transparent opacity={0.85} toneMapped={false} /></mesh>
    <mesh position={[0, 0, 0.012]} layers={NOINK}><circleGeometry args={[0.17, 24]} /><meshBasicMaterial color="#d94b5e" toneMapped={false} /></mesh>
    <mesh position={[0, 0, 0.014]} layers={NOINK}><circleGeometry args={[0.035, 12]} /><meshBasicMaterial color="#0a0a10" toneMapped={false} /></mesh>
  </group>;
};

const Trophy: React.FC<{ pos: [number, number, number]; scale?: number }> = ({ pos, scale = 1 }) => (
  <group position={pos} scale={scale}>
    <mesh position={[0, 0.55, 0]}><cylinderGeometry args={[0.22, 0.16, 0.5, 16]} /><meshStandardMaterial color="#ffd36b" metalness={0.9} roughness={0.2} emissive="#553300" emissiveIntensity={0.25} /></mesh>
    <mesh position={[0, 0.95, 0]}><sphereGeometry args={[0.2, 16, 16, 0, Math.PI * 2, 0, Math.PI / 1.7]} /><meshStandardMaterial color="#ffe08a" metalness={0.95} roughness={0.18} /></mesh>
    <mesh position={[0, 0.18, 0]}><cylinderGeometry args={[0.28, 0.32, 0.14, 16]} /><meshStandardMaterial color="#1b1b22" metalness={0.4} roughness={0.5} /></mesh>
    <mesh position={[0, 0.05, 0]}><cylinderGeometry args={[0.36, 0.4, 0.1, 16]} /><meshStandardMaterial color="#121218" metalness={0.3} roughness={0.6} /></mesh>
  </group>
);

const MicStand: React.FC<{ pos: [number, number, number]; tilt?: number }> = ({ pos, tilt = 0 }) => (
  <group position={pos} rotation={[0, 0, tilt]}>
    <mesh position={[0, 1.1, 0]}><cylinderGeometry args={[0.025, 0.03, 2.2, 10]} /><meshStandardMaterial color="#2a2a32" metalness={0.8} roughness={0.25} /></mesh>
    <mesh position={[0, 2.22, 0.08]} rotation={[0.35, 0, 0]}><cylinderGeometry args={[0.02, 0.02, 0.25, 8]} /><meshStandardMaterial color="#2a2a32" metalness={0.8} roughness={0.25} /></mesh>
    <mesh position={[0, 2.34, 0.15]}><sphereGeometry args={[0.07, 12, 12]} /><meshStandardMaterial color="#3a3a44" metalness={0.7} roughness={0.3} /></mesh>
    <mesh position={[0, 0.03, 0]}><cylinderGeometry args={[0.22, 0.24, 0.06, 14]} /><meshStandardMaterial color="#1d1d24" metalness={0.6} roughness={0.4} /></mesh>
  </group>
);

const SpeakerStack: React.FC<{ pos: [number, number, number]; scale?: number }> = ({ pos, scale = 1 }) => (
  <group position={pos} scale={scale}>
    <mesh position={[0, 0.6, 0]}><boxGeometry args={[0.9, 1.2, 0.7]} /><meshLambertMaterial color="#16161d" /></mesh>
    <mesh position={[0, 1.35, 0.36]}><circleGeometry args={[0.22, 16]} /><meshBasicMaterial color="#0f0f14" /></mesh>
    <mesh position={[0, 0.85, 0.36]}><circleGeometry args={[0.3, 16]} /><meshBasicMaterial color="#101018" /></mesh>
    <mesh position={[0, 0.45, 0.36]}><circleGeometry args={[0.18, 16]} /><meshBasicMaterial color="#0f0f14" /></mesh>
  </group>
);

const LightBar: React.FC<{ pos: [number, number, number]; color: string; intensity?: number }> = ({ pos, color, intensity = 1.2 }) => (
  <group position={pos}>
    <mesh><boxGeometry args={[2.2, 0.08, 0.12]} /><meshLambertMaterial color="#1a1a22" /></mesh>
    <pointLight position={[0, -0.2, 0.4]} intensity={intensity} color={color} distance={8} />
    {[-0.7, 0, 0.7].map((x) => <mesh key={x} position={[x, -0.02, 0.07]}><circleGeometry args={[0.05, 10]} /><meshBasicMaterial color={color} toneMapped={false} /></mesh>)}
  </group>
);

const AlbumFrame: React.FC<{ pos: [number, number, number]; rot?: [number, number, number] }> = ({ pos, rot = [0, 0, 0] }) => (
  <group position={pos} rotation={rot}>
    <mesh><boxGeometry args={[1.4, 1.4, 0.06]} /><meshLambertMaterial color="#22222a" /></mesh>
    <mesh position={[0, 0, 0.035]}><planeGeometry args={[1.2, 1.2]} /><meshBasicMaterial color="#1a2740" toneMapped={false} /></mesh>
    <mesh position={[0, 0.15, 0.04]}><planeGeometry args={[0.9, 0.15]} /><meshBasicMaterial color="#dce8ff" transparent opacity={0.85} toneMapped={false} /></mesh>
    <mesh position={[0, -0.15, 0.04]}><planeGeometry args={[0.7, 0.08]} /><meshBasicMaterial color="#7fb4ff" transparent opacity={0.7} toneMapped={false} /></mesh>
  </group>
);

const Cable: React.FC<{ from: [number, number, number]; to: [number, number, number] }> = ({ from, to }) => {
  const curve = useMemo(() => {
    const mid: [number, number, number] = [(from[0] + to[0]) / 2, Math.min(from[1], to[1]) - 0.3, (from[2] + to[2]) / 2];
    return new THREE.QuadraticBezierCurve3(new THREE.Vector3(...from), new THREE.Vector3(...mid), new THREE.Vector3(...to));
  }, [from, to]);
  const geom = useMemo(() => new THREE.TubeGeometry(curve, 20, 0.015, 6, false), [curve]);
  return <mesh geometry={geom}><meshBasicMaterial color="#111118" /></mesh>;
};

const FloorGlow: React.FC<{ color: string; pos?: [number, number, number]; scale?: number }> = ({ color, pos = [0, 0.02, -0.8], scale = 2.2 }) => (
  <mesh position={pos} rotation={[-Math.PI / 2, 0, 0]} layers={NOINK}>
    <circleGeometry args={[scale, 32]} />
    <meshBasicMaterial color={color} transparent opacity={0.09} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} />
  </mesh>
);

const StudioSet: React.FC = () => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const t = frame / fps;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}><planeGeometry args={[18, 16]} /><meshLambertMaterial color="#171724" /></mesh>
      <mesh position={[0, 2.8, -5.2]}><boxGeometry args={[16, 6, 0.4]} /><meshLambertMaterial color="#141428" /></mesh>
      <mesh position={[-3.2, 0.7, -2.8]}><boxGeometry args={[1.8, 1.2, 0.9]} /><meshLambertMaterial color="#1b1b24" /></mesh>
      <mesh position={[-3.2, 1.45, -2.8]}><boxGeometry args={[1.4, 0.4, 0.5]} /><meshLambertMaterial color="#252530" /></mesh>
      <SpeakerStack pos={[3.6, 0, -2.6]} />
      <SpeakerStack pos={[-3.8, 0, -2.2]} scale={0.9} />
      <LightBar pos={[0, 4.2, -3.5]} color="#2a8bff" intensity={1.3 + Math.sin(t * 2) * 0.25} />
      <AlbumFrame pos={[2.8, 2.6, -4.95]} rot={[0, -0.15, 0]} />
      <Vinyl pos={[-2.15, 1.65, -3.6]} />
      <WaveBars color="#3f8dff" y={0.35} z={-4.85} />
      <LightBeams colors={["#2a8bff", "#ff3355"]} speed={0.5} />
      <pointLight position={[-1.5, 3.2, -1]} intensity={1.5} color="#2a8bff" distance={10} />
      <pointLight position={[1.8, 2.8, -1.2]} intensity={1.2} color="#ff3355" distance={9} />
      <pointLight position={[0, 2.0, 1.5]} intensity={0.7} color="#cfe8ff" distance={8} />
      <ambientLight intensity={0.35} color="#a8b8ff" />
    </group>
  );
};

const ConflictSet: React.FC = () => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const t = frame / fps;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}><planeGeometry args={[16, 14]} /><meshLambertMaterial color="#101018" /></mesh>
      <mesh position={[0, 2.6, -4.8]}><boxGeometry args={[14, 5.5, 0.4]} /><meshLambertMaterial color="#141722" /></mesh>
      <mesh position={[1.8, 2.1, -3.8]}><boxGeometry args={[2.4, 3.4, 0.08]} /><meshLambertMaterial color="#1d1f28" /></mesh>
      <mesh position={[1.8, 2.1, -3.75]}><planeGeometry args={[2.1, 3.1]} /><meshBasicMaterial color="#1b2433" toneMapped={false} /></mesh>
      <mesh position={[1.8, 2.1, -3.74]}><planeGeometry args={[2.1, 3.1]} /><meshBasicMaterial color="#6fa8ff" transparent opacity={0.05 + 0.03 * Math.sin(t * 1.6)} toneMapped={false} /></mesh>
      <mesh position={[-2.4, 0.7, -2.5]}><boxGeometry args={[1.2, 1.2, 0.8]} /><meshLambertMaterial color="#15151c" /></mesh>
      <LightBeams colors={["#4d6fff", "#9ec5ff"]} speed={0.32} />
      <pointLight position={[-0.5, 3.0, -0.8]} intensity={1.0} color="#88b7ff" distance={8} />
      <pointLight position={[2.2, 2.2, -2.8]} intensity={0.8} color="#4d6fff" distance={6} />
      <ambientLight intensity={0.22} color="#8aa0c8" />
    </group>
  );
};

const StageSet: React.FC<{ mode: "reveal" | "empty" | "final" }> = ({ mode }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const t = frame / fps;
  const pulse = 0.5 + 0.5 * Math.sin(t * 3.2);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}><planeGeometry args={[18, 16]} /><meshLambertMaterial color={mode === "final" ? "#14101d" : "#12121a"} /></mesh>
      <mesh position={[0, 2.8, -5.2]}><boxGeometry args={[16, 6, 0.4]} /><meshLambertMaterial color={mode === "final" ? "#1a1430" : "#181828"} /></mesh>
      <mesh position={[0, 0.18, -1.2]}><boxGeometry args={[8.5, 0.36, 4.2]} /><meshLambertMaterial color="#1b1822" /></mesh>
      <SpeakerStack pos={[-3.8, 0.36, -2.8]} scale={0.95} />
      <SpeakerStack pos={[3.8, 0.36, -2.8]} scale={0.95} />
      <LightBar pos={[-1.8, 4.3, -3.8]} color="#2b78ff" intensity={1.2 + pulse * 0.5} />
      <LightBar pos={[1.8, 4.3, -3.8]} color="#ff2f52" intensity={1.0 + (1 - pulse) * 0.5} />
      <LightBeams colors={mode === "final" ? ["#b06cff", "#2b78ff", "#ff2f52"] : ["#2b78ff", "#ff2f52"]} speed={0.75} />
      <WaveBars color={mode === "final" ? "#b06cff" : "#ff3355"} y={0.4} z={-4.9} />
      <pointLight position={[-2.2, 3.5, -1.2]} intensity={1.4 + pulse * 0.6} color="#2b78ff" distance={10} />
      <pointLight position={[2.2, 3.4, -1.2]} intensity={1.2 + (1 - pulse) * 0.6} color="#ff2f52" distance={10} />
      {mode === "final" && <><pointLight position={[0, 3.8, -1.8]} intensity={1.3} color="#b06cff" distance={11} /><LightBar pos={[0, 4.6, -3.5]} color="#b06cff" intensity={1.0} /></>}
      <ambientLight intensity={0.28} color={mode === "final" ? "#c8b8ff" : "#9fb0ff"} />
    </group>
  );
};

const GrammySet: React.FC = () => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const t = frame / fps;
  const shimmer = 0.5 + 0.5 * Math.sin(t * 2.1);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}><planeGeometry args={[18, 16]} /><meshLambertMaterial color="#18120a" /></mesh>
      <mesh position={[0, 2.8, -5.2]}><boxGeometry args={[16, 6, 0.4]} /><meshLambertMaterial color="#241b10" /></mesh>
      <mesh position={[0, 0.18, -1.2]}><boxGeometry args={[8.5, 0.36, 4.2]} /><meshLambertMaterial color="#22190f" /></mesh>
      <mesh position={[-3.2, 2.2, -4.9]}><planeGeometry args={[1.2, 4.5]} /><meshBasicMaterial color="#ffd36b" transparent opacity={0.06 + shimmer * 0.05} toneMapped={false} /></mesh>
      <mesh position={[3.2, 2.2, -4.9]}><planeGeometry args={[1.2, 4.5]} /><meshBasicMaterial color="#ffd36b" transparent opacity={0.06 + (1 - shimmer) * 0.05} toneMapped={false} /></mesh>
      <LightBar pos={[0, 4.4, -3.8]} color="#ffd36b" intensity={1.2 + shimmer * 0.4} />
      <LightBeams colors={["#ffd36b", "#5aa2ff", "#fff0c8"]} speed={0.45} />
      <pointLight position={[-1.6, 3.4, -1]} intensity={1.4} color="#ffd36b" distance={10} />
      <pointLight position={[1.6, 3.2, -1.2]} intensity={1.1} color="#5aa2ff" distance={10} />
      <pointLight position={[0, 4.0, -1.5]} intensity={0.9} color="#fff0c8" distance={12} />
      <ambientLight intensity={0.35} color="#ffe2b0" />
    </group>
  );
};

const World: React.FC<{ time: number }> = ({ time }) => {
  const { id, local, dur } = sceneInfo(time);
  const p = smooth(local / dur);
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const t = frame / fps;
  return (
    <group>
      {id === "hook" && (
        <group>
          <color attach="background" args={["#080812"]} />
          <fog attach="fog" args={["#090914", 7, 26]} />
          <StudioSet />
          <FloorGlow color="#2a8bff" />
          <DustParticles intensity={0.9} />
          {p < 0.55 ? (
            <Suspense fallback={null}><Chester pose="normal" pos={[0, 0.25, -0.45]} scale={2.1 + p * 0.15} tilt={Math.sin(t * 1.2) * 0.01} energy={0.5} /></Suspense>
          ) : (
            <Suspense fallback={null}><Chester pose="normal" pos={[0, 1.5, -0.9]} scale={1.05} tilt={Math.sin(t * 0.8) * 0.008} /></Suspense>
          )}
        </group>
      )}
      {id === "song" && (
        <group>
          <color attach="background" args={["#0b0b16"]} />
          <fog attach="fog" args={["#101022", 7, 28]} />
          <StudioSet />
          <MicStand pos={[0.85, 0, -0.45]} />
          <Cable from={[0.85, 0.1, -0.45]} to={[3.2, 0.2, -2.5]} />
          <FloorGlow color="#ff3355" pos={[0.2, 0.02, -0.8]} scale={1.8} />
          <DustParticles intensity={1.05} />
          {p < 0.5 ? (
            <Suspense fallback={null}><Chester pose="normal" pos={[lerp(-0.25, 0.1, p * 2), 1.5, -0.95]} scale={1.0} energy={0.35} /></Suspense>
          ) : (
            <Suspense fallback={null}><Chester pose="normal" pos={[0.05, 0.45, -0.55]} scale={1.75} tilt={-0.01} energy={0.6} /></Suspense>
          )}
        </group>
      )}
      {id === "conflict" && (
        <group>
          <color attach="background" args={["#070910"]} />
          <fog attach="fog" args={["#0a1020", 6, 24]} />
          <ConflictSet />
          <FloorGlow color="#4d6fff" pos={[-0.5, 0.02, -0.8]} scale={1.8} />
          <DustParticles intensity={0.7} />
          {p < 0.35 ? (
            <Suspense fallback={null}><Chester pose="sad" pos={[-0.55, 1.45, -0.85]} scale={1.05} tilt={-0.015} /></Suspense>
          ) : p < 0.7 ? (
            <Suspense fallback={null}><Chester pose="sad" pos={[-0.25, 0.35, -0.5]} scale={1.9} tilt={-0.01} /></Suspense>
          ) : (
            <Suspense fallback={null}><Chester pose="sad" pos={[-0.5, 1.45, -0.85]} scale={1.02} /></Suspense>
          )}
          <Suspense fallback={null}><Chester pose="sad" pos={[1.7, 1.45, -3.72]} scale={0.72} opacity={0.14} /></Suspense>
        </group>
      )}
      {id === "reveal" && (
        <group>
          <color attach="background" args={["#0b0a14"]} />
          <fog attach="fog" args={["#121224", 7, 28]} />
          <StageSet mode="reveal" />
          <MicStand pos={[0.8, 0, -0.4]} />
          <Cable from={[0.8, 0.1, -0.4]} to={[3.5, 0.2, -2.6]} />
          <FloorGlow color="#ff2f52" scale={2.4} />
          <DustParticles intensity={1.2} />
          {p < 0.33 ? (
            <Suspense fallback={null}><Chester pose="singing" pos={[0, 1.5, -0.85]} scale={1.08} energy={1} tilt={Math.sin(t * 2) * 0.01} /></Suspense>
          ) : p < 0.66 ? (
            <Suspense fallback={null}><Chester pose="singing" pos={[0.05, 0.2, -0.45]} scale={2.15} energy={1} tilt={Math.sin(t * 2.5) * 0.008} /></Suspense>
          ) : (
            <Suspense fallback={null}><Chester pose="singing" pos={[-0.1, 1.45, -1.0]} scale={1.0} energy={0.8} /></Suspense>
          )}
        </group>
      )}
      {id === "responsibility" && (
        <group>
          <color attach="background" args={["#0a0a12"]} />
          <fog attach="fog" args={["#11111d", 7, 28]} />
          <StageSet mode="empty" />
          <MicStand pos={[1.4, 0, -0.7]} />
          <FloorGlow color="#6fa8ff" pos={[-0.2, 0.02, -0.9]} scale={2.0} />
          <DustParticles intensity={0.8} />
          {p < 0.5 ? (
            <Suspense fallback={null}><Chester pose="sad" pos={[-0.2, 1.48, -0.95]} scale={1.0} tilt={-0.008} /></Suspense>
          ) : (
            <Suspense fallback={null}><Chester pose="normal" pos={[-0.1, 0.35, -0.55]} scale={1.85} energy={0.4} /></Suspense>
          )}
        </group>
      )}
      {id === "grammy" && (
        <group>
          <color attach="background" args={["#120e08"]} />
          <fog attach="fog" args={["#2a1e10", 7, 28]} />
          <GrammySet />
          <Crowd color="#0e0d14" hype={p > 0.25} />
          <Trophy pos={[1.5, 0.36, -0.35]} scale={1.0} />
          <FloorGlow color="#ffd36b" pos={[-0.2, 0.02, -0.8]} scale={2.2} />
          <DustParticles warm intensity={1.25} />
          {p < 0.45 ? (
            <Suspense fallback={null}><Chester pose="normal" pos={[-0.35, 1.5, -0.9]} scale={1.02} energy={0.3} /></Suspense>
          ) : (
            <Suspense fallback={null}><Chester pose="normal" pos={[-0.15, 0.3, -0.5]} scale={1.95} tilt={0.005} energy={0.7} /></Suspense>
          )}
        </group>
      )}
      {id === "final" && (
        <group>
          <color attach="background" args={["#100d18"]} />
          <fog attach="fog" args={["#1a1530", 7, 28]} />
          <StageSet mode="final" />
          <Crowd color="#100f18" hype />
          <FloorGlow color="#b07cff" scale={2.4} />
          <DustParticles intensity={1.1} />
          {p < 0.45 ? (
            <Suspense fallback={null}><Chester pose="normal" pos={[0, 1.5, -0.85]} scale={1.05} energy={0.3} /></Suspense>
          ) : (
            <Suspense fallback={null}><Chester pose="sad" pos={[0, 0.25, -0.5]} scale={2.05} /></Suspense>
          )}
        </group>
      )}
    </group>
  );
};

// ---- Câmera: 20 planos, cortes secos, glides, rolls, impacto e foco ----
type CamKey = { p: [number, number, number]; l: [number, number, number]; fov: number; roll: number; coc: number; bloom: number; golden: boolean };
const K = (p: [number, number, number], l: [number, number, number], fov: number, roll: number, coc: number, bloom: number, golden = false): CamKey => ({ p, l, fov, roll, coc, bloom, golden });

const SHOTS: { a: number; b: number; from: CamKey; to: CamKey }[] = [
  { a: 0.0, b: 1.6, from: K([0, 1.95, 2.15], [0, 1.95, -0.45], 32, -0.02, 2.2, 0.5), to: K([0.04, 1.96, 2.05], [0, 1.95, -0.45], 31.5, -0.01, 2.2, 0.55) },
  { a: 1.6, b: 2.9, from: K([0.15, 1.78, 3.9], [0, 1.5, -0.9], 43, 0.03, 3.6, 0.5), to: K([0.05, 1.78, 3.7], [0, 1.5, -0.9], 42, 0.04, 3.6, 0.5) },
  { a: 2.9, b: 6.0, from: K([-0.1, 1.95, 2.3], [0, 1.9, -0.5], 32, -0.035, 2.2, 0.55), to: K([0, 1.95, 2.2], [0, 1.9, -0.5], 31.5, 0.02, 2.2, 0.55) },
  { a: 6.0, b: 11.6, from: K([-0.5, 1.8, 4.4], [-0.2, 1.5, -0.9], 44, 0.04, 3.8, 0.5), to: K([0.35, 1.82, 4.1], [0.05, 1.52, -0.9], 42, -0.03, 3.8, 0.55) },
  { a: 11.6, b: 13.2, from: K([0.05, 1.95, 2.45], [0.05, 1.9, -0.55], 33, 0.025, 2.4, 0.6), to: K([0.05, 1.95, 2.3], [0.05, 1.9, -0.55], 32, -0.02, 2.4, 0.6) },
  { a: 13.2, b: 16.2, from: K([0.45, 1.9, 2.65], [0.1, 1.9, -0.55], 34, -0.03, 2.5, 0.7), to: K([0.2, 1.92, 2.35], [0.1, 1.9, -0.55], 33, 0.02, 2.5, 0.7) },
  { a: 16.2, b: 21.5, from: K([-0.5, 1.78, 3.9], [-0.45, 1.45, -0.85], 42, 0.035, 3.6, 0.35), to: K([-0.35, 1.8, 3.6], [-0.4, 1.45, -0.85], 41, -0.02, 3.6, 0.35) },
  { a: 21.5, b: 24.8, from: K([-0.2, 1.92, 2.5], [-0.22, 1.85, -0.5], 33, -0.025, 2.2, 0.32), to: K([-0.18, 1.92, 2.4], [-0.22, 1.85, -0.5], 32, 0.01, 2.2, 0.32) },
  { a: 24.8, b: 29.8, from: K([-0.05, 1.95, 2.2], [-0.2, 1.9, -0.5], 31, 0.04, 2.0, 0.38), to: K([-0.1, 1.95, 2.35], [-0.2, 1.9, -0.5], 32, -0.02, 2.1, 0.38) },
  { a: 29.8, b: 32.0, from: K([-0.75, 1.72, 4.5], [-0.4, 1.45, -0.85], 46, -0.04, 4.2, 0.35), to: K([-0.6, 1.72, 4.3], [-0.4, 1.45, -0.85], 45, 0.02, 4.2, 0.35) },
  { a: 32.0, b: 36.6, from: K([0.15, 1.78, 3.9], [0, 1.5, -0.85], 42, 0.03, 3.6, 0.75), to: K([-0.05, 1.8, 3.7], [0, 1.5, -0.85], 41, -0.03, 3.6, 0.8) },
  { a: 36.6, b: 40.5, from: K([0.05, 1.92, 2.35], [0.05, 1.85, -0.45], 32, -0.03, 2.1, 0.85), to: K([0.08, 1.93, 2.25], [0.05, 1.85, -0.45], 31, 0.02, 2.1, 0.9) },
  { a: 40.5, b: 44.0, from: K([-0.45, 1.85, 4.6], [-0.05, 1.5, -0.95], 47, 0.04, 4.5, 0.8), to: K([0.2, 1.85, 4.35], [0, 1.5, -0.95], 45, -0.03, 4.5, 0.8) },
  { a: 44.0, b: 47.2, from: K([0.12, 1.85, 4.5], [-0.1, 1.45, -0.95], 46, 0.03, 4.2, 0.45), to: K([0, 1.85, 4.2], [-0.1, 1.45, -0.95], 44, -0.02, 4.2, 0.45) },
  { a: 47.2, b: 50.8, from: K([-0.05, 1.92, 2.5], [-0.08, 1.85, -0.55], 34, -0.025, 2.3, 0.5), to: K([-0.02, 1.93, 2.35], [-0.08, 1.85, -0.55], 33, 0.015, 2.3, 0.5) },
  { a: 50.8, b: 53.5, from: K([0.25, 1.88, 3.3], [0.1, 1.7, -0.6], 38, 0.035, 2.8, 0.7, true), to: K([0.1, 1.9, 3.0], [0.1, 1.7, -0.6], 37, -0.02, 2.8, 0.72, true) },
  { a: 53.5, b: 58.9, from: K([-0.25, 1.82, 4.3], [-0.2, 1.45, -0.85], 44, -0.03, 3.8, 0.72, true), to: K([0.1, 1.83, 4.1], [-0.2, 1.45, -0.85], 43, 0.02, 3.8, 0.75, true) },
  { a: 58.9, b: 63.9, from: K([-0.1, 1.94, 2.4], [-0.12, 1.85, -0.5], 32, 0.03, 2.1, 0.75, true), to: K([-0.05, 1.95, 2.3], [-0.12, 1.85, -0.5], 31, -0.02, 2.1, 0.78, true) },
  { a: 63.9, b: 68.2, from: K([0.25, 1.78, 4.1], [0, 1.48, -0.85], 43, -0.03, 3.6, 0.7), to: K([0.05, 1.8, 3.9], [0, 1.48, -0.85], 42, 0.025, 3.6, 0.72) },
  { a: 68.2, b: 74.0, from: K([0, 1.94, 2.4], [0, 1.85, -0.5], 32, 0.02, 2.1, 0.75), to: K([0, 1.95, 2.25], [0, 1.85, -0.5], 31, -0.01, 2.1, 0.78) },
];

const CameraAndPost: React.FC<{ time: number }> = ({ time }) => {
  const { camera, scene } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  const frame = useCurrentFrame();
  const shot = SHOTS.find((s) => time >= s.a && time < s.b) || SHOTS[SHOTS.length - 1];
  const u = smoother((time - shot.a) / Math.max(0.001, shot.b - shot.a));
  const pos = new THREE.Vector3(...shot.from.p);
  const look = new THREE.Vector3(...shot.from.l);
  pos.lerp(new THREE.Vector3(...shot.to.p), u);
  look.lerp(new THREE.Vector3(...shot.to.l), u);
  const fov = lerp(shot.from.fov, shot.to.fov, u);
  const coc = lerp(shot.from.coc, shot.to.coc, u);
  const bloom = lerp(shot.from.bloom, shot.to.bloom, u);
  let roll = lerp(shot.from.roll, shot.to.roll, u) + Math.sin(time * 1.7) * 0.006;
  let punchBloom = 0;

  // Punch de câmera: impactos curtos e secos nas palavras-chave da narração.
  for (const punch of PUNCHES) {
    const d = time - punch.t;
    if (d >= 0 && d < 0.34) {
      const k = Math.pow(1 - d / 0.34, 2);
      const dir = pos.clone().sub(look).normalize();
      pos.addScaledVector(dir, -k * 0.42); // avanço rápido
      pos.x += punch.dir * k * 0.055 * (frame % 2 ? 1 : -1);
      pos.y += k * 0.035 * (frame % 3 === 0 ? 1 : -1);
      roll += punch.dir * k * 0.045;
      punchBloom += k * 0.28;
    }
  }

  // Pequeno push-in contínuo em cada plano (nada de holds estáticos).
  const creep = Math.min(0.16, (time - shot.a) * 0.035);
  pos.addScaledVector(look.clone().sub(pos).normalize(), creep);

  cam.position.copy(pos);
  cam.lookAt(look);
  cam.rotateZ(roll);
  cam.fov = fov;
  cam.near = 0.1; cam.far = 140;
  cam.updateProjectionMatrix();

  const fx = useMemo(() => ({
    ink: new InkPass(scene, cam, { strength: 0.8, widthNear: 4.2, widthFar: 2.6 }),
    lens: new LensBlur({ maxCoC: 18, nearScale: 1.0 }),
    bloom: new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.5, luminanceThreshold: 0.9, luminanceSmoothing: 0.25, mipmapBlur: true, levels: 5, radius: 0.65 }),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(GRADES.day, GRADE_STRENGTH.day),
  }), [scene, cam]);
  useEffect(() => () => fx.ink.dispose(), [fx]);

  fx.lens.focus = Math.max(1.2, pos.distanceTo(look));
  fx.lens.cInf = coc;
  fx.grade.set(shot.from.golden ? GRADES.golden : GRADES.day);
  fx.grade.amount = shot.from.golden ? GRADE_STRENGTH.golden : 0.9;
  (fx.bloom as BloomEffect).intensity = bloom + punchBloom + (shot.from.golden ? 0.06 * Math.sin(time * 3.2) : 0);

  return (
    <EffectComposer multisampling={4}>
      <primitive object={fx.ink} dispose={null} />
      <primitive object={fx.lens.pre} dispose={null} />
      <primitive object={fx.lens.main} dispose={null} />
      <primitive object={fx.bloom} dispose={null} />
      <primitive object={fx.tone} dispose={null} />
      <primitive object={fx.grade} dispose={null} />
    </EffectComposer>
  );
};

const SceneRoot: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;
  const { scene } = useThree();
  noInkFallback(scene);
  return <><World time={time} /><CameraAndPost time={time} /></>;
};

const overlayBase: React.CSSProperties = {
  position: "absolute", left: "6%", right: "12%", top: "8%", bottom: "24%",
  display: "flex", alignItems: "flex-start", justifyContent: "center", textAlign: "center",
  fontFamily: '"Montserrat","Bebas Neue","Arial Black",sans-serif', fontWeight: 900, lineHeight: 1.04,
  color: "#ffffff", textShadow: "0 4px 0 rgba(0,0,0,.7),0 10px 30px rgba(0,0,0,.75),3px 3px 0 #000,-3px -3px 0 #000,3px -3px 0 #000,-3px 3px 0 #000",
  letterSpacing: 1.4, pointerEvents: "none", whiteSpace: "pre-line",
};

const TextPop: React.FC<{ text: string; from: number; to: number; top?: string; fontSize?: number; color?: string }> = ({ text, from, to, top = "8%", fontSize = 62, color = "#ffffff" }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const t = frame / fps;
  if (t < from || t > to) return null;
  const local = t - from;
  const enter = clamp01(local / 0.13);
  const exit = clamp01((to - t) / 0.2);
  const overshoot = Math.sin(enter * Math.PI) * 0.09;
  const opacity = enter * exit;
  const y = (1 - enter) * 34;
  const sc = 0.86 + 0.14 * enter + overshoot;
  const rot = (1 - enter) * -2.5 + Math.sin(t * 8) * 0.35;
  return <div style={{ ...overlayBase, top, fontSize, color, opacity, transform: `translateY(${y}px) scale(${sc}) rotate(${rot}deg)` }}>{text}</div>;
};

export const ChesterCrawling: React.FC = () => {
  const cues = (wordsData as unknown as { cues?: { start: number; end: number; text: string }[] }).cues || [];
  const c = (i: number) => cues[i] || { start: 0, end: 0, text: "" };
  const d = CHESTER_CRAWL_DUR;
  return (
    <AbsoluteFill style={{ backgroundColor: "#090914" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@800;900&family=Bebas+Neue&display=swap');`}</style>
      <ThreeCanvas width={1080} height={1920} camera={{ fov: 40, position: [0, 1.9, 3.3], near: 0.1, far: 140 }} gl={{ antialias: false, stencil: false, powerPreference: "high-performance", toneMappingExposure: 1.0 }}>
        <SceneRoot />
      </ThreeCanvas>

      <TextPop text={"ELE GANHOU\nUM GRAMMY…"} from={Math.max(0.2, c(0).start)} to={c(0).end + 0.3} top="8%" fontSize={68} color="#FFD54A" />
      <TextPop text={"CRAWLING • 2000"} from={c(2).start} to={c(2).end + 0.4} top="8%" fontSize={62} color="#7fd4ff" />
      <TextPop text={"UMA BATALHA\nINTERNA"} from={c(4).start} to={c(5).end + 0.4} top="8%" fontSize={64} color="#9ec5ff" />
      <TextPop text={"PERDER O\nCONTROLE"} from={c(4).start + 2.2} to={c(4).end + 0.2} top="62%" fontSize={56} color="#ff4b66" />
      <TextPop text={"ASSUMIR O\nCONTROLE"} from={c(8).start} to={c(8).end + 0.3} top="8%" fontSize={62} color="#ffffff" />
      <TextPop text={"GRAMMY • 2002"} from={c(10).start} to={c(10).end + 0.4} top="8%" fontSize={66} color="#FFD54A" />
      <TextPop text={"A VOZ QUE\nMARCOU GERAÇÕES"} from={c(12).start} to={c(12).end + 0.5} top="8%" fontSize={56} color="#c8b8ff" />
      <TextPop text={"QUAL MÚSICA\nMARCOU SUA VIDA?"} from={c(13).start} to={d} top="8%" fontSize={58} color="#FFD54A" />

      <Audio src={staticFile("chester-crawling/voice.wav")} />
      <Audio src={staticFile("chester-crawling/music.mp3")} volume={0.11} />
      <Sequence from={Math.floor(0.5 * CHESTER_CRAWL_FPS)} durationInFrames={Math.floor(0.5 * CHESTER_CRAWL_FPS)}>
        <Audio src={staticFile("chester-crawling/sfx_whoosh.wav")} volume={0.16} />
      </Sequence>
      <Sequence from={Math.floor(12.0 * CHESTER_CRAWL_FPS)} durationInFrames={Math.floor(0.35 * CHESTER_CRAWL_FPS)}>
        <Audio src={staticFile("chester-crawling/sfx_impact.wav")} volume={0.12} />
      </Sequence>
      <Sequence from={Math.floor(24.8 * CHESTER_CRAWL_FPS)} durationInFrames={Math.floor(0.3 * CHESTER_CRAWL_FPS)}>
        <Audio src={staticFile("chester-crawling/sfx_impact.wav")} volume={0.15} />
      </Sequence>
      <Sequence from={Math.floor(32.0 * CHESTER_CRAWL_FPS)} durationInFrames={Math.floor(0.5 * CHESTER_CRAWL_FPS)}>
        <Audio src={staticFile("chester-crawling/sfx_whoosh.wav")} volume={0.12} />
      </Sequence>
      <Sequence from={Math.floor(52.0 * CHESTER_CRAWL_FPS)} durationInFrames={Math.floor(3.0 * CHESTER_CRAWL_FPS)}>
        <Audio src={staticFile("chester-crawling/sfx_crowd.wav")} volume={0.13} />
      </Sequence>
    </AbsoluteFill>
  );
};

export default ChesterCrawling;
