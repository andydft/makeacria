import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, Audio, Sequence, random, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { InkPass, noInkFallback, NOINK } from "../jimi3d/ink";
import { LensBlur } from "../jimi3d/lensblur";
import { GradeEffect, GRADES, GRADE_STRENGTH } from "../jimi3d/grade";
import wordsData from "../../../public/mike-shinoda/words.json";

export const MIKE_FPS = 30;
export const MIKE_DUR = 78.05;
export const MIKE_FRAMES = Math.ceil(MIKE_DUR * MIKE_FPS);

type SceneId = "hook" | "success" | "bedroom" | "xero" | "call" | "crawling" | "grammy" | "legacy";
const SCENES: { id: SceneId; a: number; b: number }[] = [
  { id: "hook", a: 0, b: 6.1 },
  { id: "success", a: 6.1, b: 12.4 },
  { id: "bedroom", a: 12.4, b: 35.4 },
  { id: "xero", a: 35.4, b: 44.6 },
  { id: "call", a: 44.6, b: 54.0 },
  { id: "crawling", a: 54.0, b: 62.2 },
  { id: "grammy", a: 62.2, b: 67.2 },
  { id: "legacy", a: 67.2, b: MIKE_DUR },
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

// --- punches sincronizados às palavras ---
const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/gi, "").toLowerCase();
const PUNCH_KEYS = ["geracao", "cinquenta", "milhoes", "trezentos", "xero", "ligou", "sentido", "mudou", "crawling", "blue", "grammy", "voz", "vida"];
const PUNCHES: { t: number; dir: number }[] = (() => {
  const ws = (wordsData as unknown as { words?: { word: string; start: number }[] }).words || [];
  const out: { t: number; dir: number }[] = [];
  ws.forEach((w, i) => {
    const n = norm(w.word);
    if (n && PUNCH_KEYS.some((k) => n.includes(k))) out.push({ t: w.start, dir: i % 2 ? -1 : 1 });
  });
  return out.sort((a, b) => a.t - b.t);
})();

// ---------------------------------------------------------------------------
// Personagens 100% geométricos (sem PNG)
// ---------------------------------------------------------------------------
type Pose = "keys" | "think" | "phone" | "sing" | "cheer" | "quiet";

const ToonGuy: React.FC<{
  pos: [number, number, number]; scale?: number; hair?: "dark" | "blond";
  shirt?: string; pose?: Pose; energy?: number; opacity?: number; rot?: number;
}> = ({ pos, scale = 1, hair = "dark", shirt = "#8b8c7e", pose = "quiet", energy = 0, opacity = 1, rot = 0 }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const t = frame / fps;
  // Traços do Mike na época do Hybrid Theory: pele quente, cabelo preto com mechas
  // loiras na frente, olhos amendoados e sobrancelhas retas.
  const skin = "#e9bd94";
  const hairCol = hair === "blond" ? "#d9c25e" : "#191a22";
  const bob = Math.sin(t * 1.5) * (0.012 + energy * 0.018);
  const sway = Math.sin(t * 0.85) * (0.006 + energy * 0.01);
  const blink = (t % 3.6) > 3.52 ? 0.13 : 1;
  const armF = (p: Pose) => p === "keys" ? -0.82 : p === "phone" ? -1.08 : p === "cheer" ? -2.35 : p === "sing" ? -1.25 : -0.18;
  const armB = pose === "keys" ? -0.72 : pose === "cheer" ? -2.2 : pose === "phone" ? -0.3 : -0.12;
  const tr = (v: number): [number, number, number] => [v, 0, 0];
  const mat = (c: string) => <meshBasicMaterial color={c} transparent={opacity < 1} opacity={opacity} toneMapped={false} />;
  return (
    <group position={[pos[0], pos[1] + bob, pos[2]]} rotation={[0, rot, sway]} scale={scale}>
      <mesh position={[-0.19, 0.42, 0]}>{mat("#2f3448")}<capsuleGeometry args={[0.115, 0.62, 4, 8]} /></mesh>
      <mesh position={[0.19, 0.42, 0]}>{mat("#2f3448")}<capsuleGeometry args={[0.115, 0.62, 4, 8]} /></mesh>
      <mesh position={[-0.19, 0.06, 0.08]}>{mat("#1e2030")}<boxGeometry args={[0.24, 0.12, 0.42]} /></mesh>
      <mesh position={[0.19, 0.06, 0.08]}>{mat("#1e2030")}<boxGeometry args={[0.24, 0.12, 0.42]} /></mesh>
      <mesh position={[0, 1.4, 0]}>{mat(shirt)}<capsuleGeometry args={[0.41, 0.82, 6, 12]} /></mesh>
      {/* estampa geométrica da camiseta */}
      {[-0.15, 0.15].map((x) => (
        <mesh key={x} position={[x, 1.42, 0.415]} rotation={[0, 0, x < 0 ? 0.42 : -0.42]}>
          {mat("#30313a")}<boxGeometry args={[0.035, 0.56, 0.012]} />
        </mesh>
      ))}
      <mesh position={[0, 1.74, 0.415]} rotation={[0, 0, 0.78]}>
        {mat("#30313a")}<boxGeometry args={[0.03, 0.42, 0.012]} />
      </mesh>
      <group position={[-0.43, 1.72, 0]} rotation={tr(armF(pose))}>
        <mesh position={[0, -0.31, 0.1]}>{mat(shirt)}<capsuleGeometry args={[0.1, 0.55, 4, 8]} /></mesh>
        {/* tatuagens de linha no antebraço */}
        {[0.45, 0.51, 0.57].map((y) => (
          <mesh key={y} position={[0, -y, 0.19]} rotation={[0, 0, 0.28]}>
            {mat("#2a2230")}<boxGeometry args={[0.018, 0.18, 0.012]} />
          </mesh>
        ))}
        <mesh position={[0, -0.65, 0.17]}>{mat(skin)}<sphereGeometry args={[0.12, 10, 10]} /></mesh>
      </group>
      <group position={[0.43, 1.72, 0]} rotation={tr(armB)}>
        <mesh position={[0, -0.31, 0.1]}>{mat(shirt)}<capsuleGeometry args={[0.1, 0.55, 4, 8]} /></mesh>
        <mesh position={[0, -0.65, 0.17]}>{mat(skin)}<sphereGeometry args={[0.12, 10, 10]} /></mesh>
      </group>
      <mesh position={[0, 2.42, 0]} scale={[1, 1.12, 0.86]}>{mat(skin)}<sphereGeometry args={[0.5, 20, 16]} /></mesh>
      <mesh position={[0, 2.72, -0.04]} scale={[1.05, 0.76, 0.94]}>{mat(hairCol)}<sphereGeometry args={[0.51, 18, 14]} /></mesh>
      {Array.from({ length: 5 }, (_, i) => (
        <mesh key={i} position={[-0.38 + i * 0.19, 2.96 + (i % 2) * 0.045, 0.06]} rotation={[0, 0, (i - 2) * 0.16]}>
          {mat(hairCol)}<coneGeometry args={[0.1, 0.26, 8]} />
        </mesh>
      ))}
      {/* mechas loiras caindo sobre a testa */}
      {[-0.27, -0.04, 0.2].map((x, i) => (
        <mesh key={i} position={[x, 2.78, 0.33]} rotation={[0.1, 0, Math.PI + (i - 1) * 0.16]}>
          {mat("#d9c25e")}<coneGeometry args={[0.052, 0.4, 6]} />
        </mesh>
      ))}
      {/* olhos amendoados + pálpebra superior */}
      <mesh position={[-0.18, 2.48, 0.42]} scale={[1.48, blink * 0.6, 1]}>{mat("#1b1620")}<sphereGeometry args={[0.052, 10, 10]} /></mesh>
      <mesh position={[0.18, 2.48, 0.42]} scale={[1.48, blink * 0.6, 1]}>{mat("#1b1620")}<sphereGeometry args={[0.052, 10, 10]} /></mesh>
      {[-0.18, 0.18].map((x) => (
        <mesh key={x} position={[x, 2.515, 0.425]}>
          {mat(hairCol)}<boxGeometry args={[0.17, 0.016, 0.02]} />
        </mesh>
      ))}
      {/* sobrancelhas retas */}
      <mesh position={[-0.18, 2.63, 0.41]}>{mat(hairCol)}<boxGeometry args={[0.18, 0.04, 0.03]} /></mesh>
      <mesh position={[0.18, 2.63, 0.41]}>{mat(hairCol)}<boxGeometry args={[0.18, 0.04, 0.03]} /></mesh>
      <mesh position={[0, pose === "sing" ? 2.24 : 2.27, 0.44]}>
        {mat("#a04a4a")}
        <boxGeometry args={[pose === "sing" ? 0.1 : 0.15, pose === "sing" ? 0.11 : 0.022, 0.02]} />
      </mesh>
    </group>
  );
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
const Keyboard: React.FC<{ pos: [number, number, number]; scale?: number; glow?: number }> = ({ pos, scale = 1, glow = 0 }) => (
  <group position={pos} scale={scale} rotation={[-0.1, 0, 0]}>
    <mesh><boxGeometry args={[2.1, 0.18, 0.75]} /><meshLambertMaterial color="#1b1c24" /></mesh>
    {Array.from({ length: 14 }, (_, i) => (
      <mesh key={i} position={[-0.91 + i * 0.14, 0.105, 0.09]}>
        <boxGeometry args={[0.115, 0.035, 0.44]} />
        <meshBasicMaterial color={glow > 0.25 && i % 4 === 0 ? "#cfe3ff" : "#e9e6dc"} toneMapped={false} />
      </mesh>
    ))}
    {Array.from({ length: 10 }, (_, i) => (
      <mesh key={i} position={[-0.84 + i * 0.19, 0.13, -0.05]}><boxGeometry args={[0.06, 0.04, 0.26]} /><meshBasicMaterial color="#0a0a10" /></mesh>
    ))}
    <mesh position={[0, -0.55, 0]}><cylinderGeometry args={[0.045, 0.06, 0.95, 8]} /><meshLambertMaterial color="#22232b" /></mesh>
    <mesh position={[0, -1.02, 0]}><boxGeometry args={[0.9, 0.05, 0.5]} /><meshLambertMaterial color="#22232b" /></mesh>
  </group>
);

const FourTrack: React.FC<{ pos: [number, number, number]; scale?: number }> = ({ pos, scale = 1 }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const t = frame / fps;
  return (
    <group position={pos} scale={scale}>
      <mesh><boxGeometry args={[1.15, 0.5, 0.7]} /><meshLambertMaterial color="#262832" /></mesh>
      {[-0.28, 0.28].map((x) => (
        <group key={x} position={[x, 0.28, 0]} rotation={[Math.PI / 2, 0, t * (x < 0 ? 1 : -1)]}>
          <mesh><cylinderGeometry args={[0.19, 0.19, 0.045, 18]} /><meshBasicMaterial color="#e2ddcd" toneMapped={false} /></mesh>
          <mesh position={[0, 0.03, 0]}><cylinderGeometry args={[0.055, 0.055, 0.05, 12]} /><meshBasicMaterial color="#171820" /></mesh>
        </group>
      ))}
      <mesh position={[0, -0.06, 0.36]}><boxGeometry args={[0.7, 0.12, 0.03]} /><meshBasicMaterial color="#3d4252" /></mesh>
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} position={[-0.3 + i * 0.12, -0.2, 0.36]}><sphereGeometry args={[0.024, 8, 8]} /><meshBasicMaterial color={i % 2 ? "#ffb347" : "#4fd0a0"} /></mesh>
      ))}
    </group>
  );
};

const Guitar: React.FC<{ pos: [number, number, number]; rot?: number; scale?: number }> = ({ pos, rot = 0, scale = 1 }) => (
  <group position={pos} rotation={[0, 0, rot]} scale={scale}>
    <mesh position={[0, -0.35, 0]}><sphereGeometry args={[0.38, 16, 12]} /><meshBasicMaterial color="#cf5348" toneMapped={false} /></mesh>
    <mesh position={[0, -0.05, 0]}><boxGeometry args={[0.55, 0.4, 0.1]} /><meshBasicMaterial color="#cf5348" toneMapped={false} /></mesh>
    <mesh position={[0, 0.62, 0]}><boxGeometry args={[0.13, 1.25, 0.08]} /><meshBasicMaterial color="#7b5636" toneMapped={false} /></mesh>
    <mesh position={[0, 1.3, 0]}><boxGeometry args={[0.19, 0.25, 0.09]} /><meshBasicMaterial color="#a87942" toneMapped={false} /></mesh>
    {Array.from({ length: 5 }, (_, i) => <mesh key={i} position={[-0.04 + i * 0.02, 0.4, 0.055]}><boxGeometry args={[0.008, 1.6, 0.008]} /><meshBasicMaterial color="#c9c9c9" /></mesh>)}
  </group>
);

const MicStand: React.FC<{ pos: [number, number, number]; tilt?: number }> = ({ pos, tilt = 0 }) => (
  <group position={pos} rotation={[0, 0, tilt]}>
    <mesh position={[0, 1.1, 0]}><cylinderGeometry args={[0.022, 0.03, 2.2, 8]} /><meshLambertMaterial color="#2c2d36" /></mesh>
    <mesh position={[0, 2.26, 0.06]}><sphereGeometry args={[0.09, 12, 12]} /><meshLambertMaterial color="#454650" /></mesh>
    <mesh position={[0, 0.03, 0]}><cylinderGeometry args={[0.24, 0.26, 0.06, 12]} /><meshLambertMaterial color="#1c1d25" /></mesh>
  </group>
);

const Trophy: React.FC<{ pos: [number, number, number]; scale?: number }> = ({ pos, scale = 1 }) => (
  <group position={pos} scale={scale}>
    <mesh position={[0, 0.55, 0]}><cylinderGeometry args={[0.21, 0.15, 0.5, 16]} /><meshBasicMaterial color="#ffd36b" toneMapped={false} /></mesh>
    <mesh position={[0, 0.95, 0]}><sphereGeometry args={[0.2, 16, 16, 0, Math.PI * 2, 0, Math.PI / 1.7]} /><meshBasicMaterial color="#ffe9a8" toneMapped={false} /></mesh>
    <mesh position={[0, 0.17, 0]}><cylinderGeometry args={[0.27, 0.31, 0.13, 16]} /><meshLambertMaterial color="#1b1b22" /></mesh>
    <mesh position={[0, 0.05, 0]}><cylinderGeometry args={[0.35, 0.39, 0.1, 16]} /><meshLambertMaterial color="#121218" /></mesh>
  </group>
);

const Phone: React.FC<{ pos: [number, number, number]; ring?: number }> = ({ pos, ring = 0 }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const t = frame / fps;
  return (
    <group position={pos}>
      <mesh><boxGeometry args={[0.5, 0.22, 0.35]} /><meshLambertMaterial color="#252733" /></mesh>
      <mesh position={[0, 0.12, 0]} rotation={[0, 0, -0.16]}><boxGeometry args={[0.42, 0.1, 0.12]} /><meshLambertMaterial color="#111219" /></mesh>
      {ring > 0 && [0, 1, 2].map((i) => {
        const p = (t * 1.7 + i / 3) % 1;
        return <mesh key={i} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.12, 0]}>
          <ringGeometry args={[0.2 + p * 0.65, 0.23 + p * 0.65, 32]} />
          <meshBasicMaterial color="#ffd36b" transparent opacity={ring * (1 - p) * 0.5} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>;
      })}
    </group>
  );
};

const RejectionStack: React.FC<{ pos: [number, number, number] }> = ({ pos }) => (
  <group position={pos}>
    {Array.from({ length: 9 }, (_, i) => (
      <mesh key={i} position={[(i % 3 - 1) * 0.045, i * 0.022, (i % 2) * 0.02]} rotation={[0, (i % 4 - 2) * 0.05, 0]}>
        <boxGeometry args={[0.85, 0.018, 0.6]} /><meshLambertMaterial color={i % 3 === 0 ? "#d8d2c4" : "#c8c4bb"} />
      </mesh>
    ))}
    <mesh position={[0, 0.24, 0]} rotation={[-0.3, 0, 0.04]}><boxGeometry args={[0.8, 0.01, 0.55]} /><meshBasicMaterial color="#e9e6da" /></mesh>
    <mesh position={[0, 0.25, 0.02]} rotation={[-0.3, 0, 0.04]}><boxGeometry args={[0.3, 0.012, 0.04]} /><meshBasicMaterial color="#a83b46" /></mesh>
  </group>
);

const Cassette: React.FC<{ pos: [number, number, number]; rot?: number }> = ({ pos, rot = 0 }) => (
  <group position={pos} rotation={[0, rot, 0]}>
    <mesh><boxGeometry args={[0.5, 0.32, 0.08]} /><meshLambertMaterial color="#20222c" /></mesh>
    <mesh position={[0, 0.02, 0.045]}><boxGeometry args={[0.4, 0.14, 0.01]} /><meshBasicMaterial color="#d8d4c6" /></mesh>
    {[-0.12, 0.12].map((x) => <mesh key={x} position={[x, 0.02, 0.055]}><circleGeometry args={[0.045, 12]} /><meshBasicMaterial color="#11121a" /></mesh>)}
  </group>
);

const Poster: React.FC<{ pos: [number, number, number]; color?: string; rot?: number }> = ({ pos, color = "#b8444e", rot = 0 }) => (
  <group position={pos} rotation={[0, rot, 0]}>
    <mesh><boxGeometry args={[1.05, 1.45, 0.04]} /><meshLambertMaterial color="#16171f" /></mesh>
    <mesh position={[0, 0, 0.03]}><planeGeometry args={[0.93, 1.33]} /><meshBasicMaterial color={color} transparent opacity={0.72} toneMapped={false} /></mesh>
    <mesh position={[0, 0.12, 0.034]}><circleGeometry args={[0.26, 24]} /><meshBasicMaterial color="#f0e2c8" transparent opacity={0.6} toneMapped={false} /></mesh>
    {[-0.35, -0.15, 0.05, 0.25].map((y) => <mesh key={y} position={[0, y - 0.35, 0.035]}><planeGeometry args={[0.62, 0.035]} /><meshBasicMaterial color="#15161d" transparent opacity={0.7} /></mesh>)}
  </group>
);

const SpeakerStack: React.FC<{ pos: [number, number, number]; scale?: number }> = ({ pos, scale = 1 }) => (
  <group position={pos} scale={scale}>
    <mesh position={[0, 0.6, 0]}><boxGeometry args={[0.9, 1.2, 0.7]} /><meshLambertMaterial color="#15161d" /></mesh>
    <mesh position={[0, 1.35, 0.36]}><circleGeometry args={[0.22, 16]} /><meshBasicMaterial color="#0d0e14" /></mesh>
    <mesh position={[0, 0.85, 0.36]}><circleGeometry args={[0.3, 16]} /><meshBasicMaterial color="#101118" /></mesh>
  </group>
);

const LightBar: React.FC<{ pos: [number, number, number]; color: string; intensity?: number }> = ({ pos, color, intensity = 1.2 }) => (
  <group position={pos}>
    <mesh><boxGeometry args={[2.2, 0.08, 0.12]} /><meshLambertMaterial color="#1a1a22" /></mesh>
    <pointLight position={[0, -0.2, 0.4]} intensity={intensity} color={color} distance={8} />
    {[-0.7, 0, 0.7].map((x) => <mesh key={x} position={[x, -0.02, 0.07]}><circleGeometry args={[0.05, 10]} /><meshBasicMaterial color={color} toneMapped={false} /></mesh>)}
  </group>
);

const LightBeams: React.FC<{ colors: string[]; speed?: number }> = ({ colors, speed = 0.6 }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const t = frame / fps;
  return <group>{colors.map((c, i) => {
    const a = t * speed * (i % 2 ? -1 : 1) + i * 1.9;
    return <mesh key={i} position={[Math.sin(a) * 2.6, 3.0, -3.4 + Math.cos(a) * 0.5]} rotation={[0, 0, Math.sin(a) * 0.42]} layers={NOINK}>
      <coneGeometry args={[0.62, 5.0, 12, 1, true]} />
      <meshBasicMaterial color={c} transparent opacity={0.055} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
    </mesh>;
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

const Dust: React.FC<{ warm?: boolean; intensity?: number }> = ({ warm = false, intensity = 1 }) => {
  const pts = useMemo(() => Array.from({ length: 62 }, (_, i) => ({
    x: (random(`mk-dx-${i}`) - 0.5) * 5.5, y: 0.3 + random(`mk-dy-${i}`) * 4.2, z: -3.2 + random(`mk-dz-${i}`) * 3.6,
    ph: random(`mk-dp-${i}`) * Math.PI * 2, sp: 0.2 + random(`mk-ds-${i}`) * 0.45, r: 0.012 + random(`mk-dr-${i}`) * 0.022,
  })), []);
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const t = frame / fps;
  return <group>{pts.map((p, i) => (
    <mesh key={i} position={[p.x + Math.sin(t * p.sp * 0.7 + p.ph) * 0.09, p.y + Math.sin(t * p.sp + p.ph) * 0.22, p.z]} layers={NOINK}>
      <sphereGeometry args={[p.r, 6, 6]} />
      <meshBasicMaterial color={warm ? "#ffe0a8" : "#c6e6ff"} transparent opacity={(0.12 + 0.26 * Math.abs(Math.sin(t * 0.9 + p.ph))) * intensity} toneMapped={false} />
    </mesh>
  ))}</group>;
};

const Crowd: React.FC<{ color?: string; hype?: boolean }> = ({ color = "#11121a", hype = false }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const t = frame / fps;
  const people = useMemo(() => Array.from({ length: 52 }, (_, i) => ({
    x: (i / 51 - 0.5) * 14, h: 0.4 + random(`mk-ch-${i}`) * 0.35, w: 0.14 + random(`mk-cw-${i}`) * 0.08,
    z: -5.8 - random(`mk-cz-${i}`) * 3.5, ph: random(`mk-cph-${i}`) * Math.PI * 2,
  })), []);
  const amp = hype ? 0.12 : 0.03; const spd = hype ? 3.6 : 1.2;
  return <group>{people.map((p, i) => {
    const b = Math.abs(Math.sin(t * spd + p.ph)) * amp;
    const arm = hype ? 0.5 + Math.sin(t * spd * 0.8 + p.ph) * 0.45 : 0;
    return <group key={i} position={[p.x, 0.25 + b, p.z]} layers={NOINK}>
      <mesh position={[0, p.h * 0.7, 0]}><sphereGeometry args={[p.w * 0.33, 7, 7]} /><meshBasicMaterial color={color} toneMapped={false} /></mesh>
      <mesh position={[0, p.h * 0.25, 0]}><capsuleGeometry args={[p.w * 0.26, p.h * 0.42, 4, 8]} /><meshBasicMaterial color={color} toneMapped={false} /></mesh>
      {hype && [-1, 1].map((s) => <mesh key={s} position={[s * p.w * 0.35, p.h * 0.62 + arm * 0.12, 0]} rotation={[0, 0, -s * (0.35 + arm)]}>
        <capsuleGeometry args={[p.w * 0.08, p.h * 0.35, 3, 6]} /><meshBasicMaterial color={color} toneMapped={false} />
      </mesh>)}
    </group>;
  })}</group>;
};

const FloorGlow: React.FC<{ color: string; pos?: [number, number, number]; scale?: number }> = ({ color, pos = [0, 0.02, -0.8], scale = 2.2 }) => (
  <mesh position={pos} rotation={[-Math.PI / 2, 0, 0]} layers={NOINK}>
    <circleGeometry args={[scale, 32]} />
    <meshBasicMaterial color={color} transparent opacity={0.09} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} />
  </mesh>
);

const Cable: React.FC<{ from: [number, number, number]; to: [number, number, number] }> = ({ from, to }) => {
  const geom = useMemo(() => {
    const mid: [number, number, number] = [(from[0] + to[0]) / 2, Math.min(from[1], to[1]) - 0.3, (from[2] + to[2]) / 2];
    return new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(new THREE.Vector3(...from), new THREE.Vector3(...mid), new THREE.Vector3(...to)), 20, 0.015, 6, false);
  }, [from, to]);
  return <mesh geometry={geom}><meshBasicMaterial color="#101118" /></mesh>;
};

// ---------------------------------------------------------------------------
// Sets
// ---------------------------------------------------------------------------
const MessyRoom: React.FC<{ warm?: boolean }> = ({ warm = false }) => {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[18, 16]} /><meshLambertMaterial color={warm ? "#2a231e" : "#1a1a22"} /></mesh>
      <mesh position={[0, 2.7, -5]}><boxGeometry args={[15, 6, 0.4]} /><meshLambertMaterial color={warm ? "#2b2119" : "#1d1c26"} /></mesh>
      <mesh position={[-2.6, 2.2, -4.75]} rotation={[0, 0.08, 0]}><boxGeometry args={[1.5, 1.9, 0.1]} /><meshLambertMaterial color="#101119" /></mesh>
      <mesh position={[-2.6, 2.2, -4.68]} rotation={[0, 0.08, 0]}><planeGeometry args={[1.3, 1.7]} /><meshBasicMaterial color="#1b2a45" toneMapped={false} /></mesh>
      <mesh position={[-2.6, 2.2, -4.66]} rotation={[0, 0.08, 0]}><boxGeometry args={[0.05, 1.7, 0.02]} /><meshBasicMaterial color="#0d0e14" /></mesh>
      <mesh position={[-2.6, 2.2, -4.66]} rotation={[0, 0.08, 0]}><boxGeometry args={[1.3, 0.05, 0.02]} /><meshBasicMaterial color="#0d0e14" /></mesh>
      <Poster pos={[2.1, 2.5, -4.72]} color="#a83e4a" rot={-0.06} />
      <Poster pos={[3.45, 2.35, -4.72]} color="#355a86" rot={0.05} />
      <mesh position={[0, 0.72, -1.35]}><boxGeometry args={[3.4, 0.12, 1.0]} /><meshLambertMaterial color="#3a2f27" /></mesh>
      {[-1.4, 1.4].map((x) => <mesh key={x} position={[x, 0.35, -1.35]}><boxGeometry args={[0.12, 0.7, 0.8]} /><meshLambertMaterial color="#2c251f" /></mesh>)}
      {/* roupas e caixa de pizza no chão */}
      <mesh position={[-2.1, 0.06, -0.4]} rotation={[0, 0.4, 0]}><boxGeometry args={[0.9, 0.12, 0.8]} /><meshLambertMaterial color="#4b4a3d" /></mesh>
      <mesh position={[1.9, 0.07, 0.1]} rotation={[0, -0.3, 0]}><boxGeometry args={[0.75, 0.14, 0.75]} /><meshLambertMaterial color="#b08a54" /></mesh>
      <mesh position={[-0.9, 0.09, 0.6]} rotation={[0, 1.1, 0]}><capsuleGeometry args={[0.14, 0.5, 4, 8]} /><meshLambertMaterial color="#38415c" /></mesh>
      <mesh position={[2.4, 0.12, -2.0]}><cylinderGeometry args={[0.11, 0.09, 0.24, 10]} /><meshLambertMaterial color="#d5d0c2" /></mesh>
      {/* luzes de natal penduradas */}
      {Array.from({ length: 9 }, (_, i) => {
        const x = -3.2 + i * 0.8;
        return <mesh key={i} position={[x, 3.85 - Math.abs(i - 4) * 0.09, -2.4]} layers={NOINK}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color={i % 2 ? "#ffcf7a" : "#ff6a7a"} toneMapped={false} />
        </mesh>;
      })}
      <pointLight position={[-1.6, 3.4, -1.4]} intensity={warm ? 1.6 : 1.1} color={warm ? "#ffc47a" : "#8fb6ff"} distance={10} />
      <pointLight position={[2.0, 2.4, -0.6]} intensity={0.7} color="#ff8a6a" distance={7} />
      <ambientLight intensity={warm ? 1.15 : 0.95} color={warm ? "#ffe0b8" : "#c2cfff"} />
      {warm && <LightBeams colors={["#ffd36b", "#ff9c6a"]} speed={0.28} />}
      <Dust warm={warm} intensity={warm ? 0.9 : 0.7} />
    </group>
  );
};

const StageSet: React.FC<{ mode?: "success" | "studio" | "final" }> = ({ mode = "studio" }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const t = frame / fps;
  const pulse = 0.5 + 0.5 * Math.sin(t * 3.2);
  const col = mode === "success" ? "#2b78ff" : mode === "final" ? "#b06cff" : "#2b78ff";
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[18, 16]} /><meshLambertMaterial color="#12121a" /></mesh>
      <mesh position={[0, 2.8, -5.2]}><boxGeometry args={[16, 6, 0.4]} /><meshLambertMaterial color="#181828" /></mesh>
      <mesh position={[0, 0.18, -1.2]}><boxGeometry args={[8.5, 0.36, 4.2]} /><meshLambertMaterial color="#1b1822" /></mesh>
      <SpeakerStack pos={[-3.8, 0.36, -2.8]} />
      <SpeakerStack pos={[3.8, 0.36, -2.8]} />
      <LightBar pos={[-1.8, 4.3, -3.8]} color={col} intensity={1.2 + pulse * 0.5} />
      <LightBar pos={[1.8, 4.3, -3.8]} color="#ff2f52" intensity={1.0 + (1 - pulse) * 0.5} />
      <LightBeams colors={mode === "final" ? ["#b06cff", "#2b78ff", "#ff2f52"] : [col, "#ff2f52"]} speed={0.75} />
      <WaveBars color={mode === "final" ? "#b06cff" : "#ff3355"} y={0.4} z={-4.9} />
      <pointLight position={[-2.2, 3.5, -1.2]} intensity={1.4 + pulse * 0.6} color={col} distance={10} />
      <pointLight position={[2.2, 3.4, -1.2]} intensity={1.2 + (1 - pulse) * 0.6} color="#ff2f52" distance={10} />
      {mode === "final" && <pointLight position={[0, 3.8, -1.8]} intensity={1.3} color="#b06cff" distance={11} />}
      <ambientLight intensity={0.95} color="#c2cfff" />
      <Dust intensity={1.1} />
    </group>
  );
};

const GrammySet: React.FC = () => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const t = frame / fps;
  const shimmer = 0.5 + 0.5 * Math.sin(t * 2.1);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[18, 16]} /><meshLambertMaterial color="#18120a" /></mesh>
      <mesh position={[0, 2.8, -5.2]}><boxGeometry args={[16, 6, 0.4]} /><meshLambertMaterial color="#241b10" /></mesh>
      <mesh position={[0, 0.18, -1.2]}><boxGeometry args={[8.5, 0.36, 4.2]} /><meshLambertMaterial color="#22190f" /></mesh>
      {[-3.2, 3.2].map((x) => <mesh key={x} position={[x, 2.2, -4.9]}><planeGeometry args={[1.2, 4.5]} /><meshBasicMaterial color="#ffd36b" transparent opacity={0.06 + shimmer * 0.05} toneMapped={false} /></mesh>)}
      <LightBar pos={[0, 4.4, -3.8]} color="#ffd36b" intensity={1.2 + shimmer * 0.4} />
      <LightBeams colors={["#ffd36b", "#5aa2ff", "#fff0c8"]} speed={0.45} />
      <pointLight position={[-1.6, 3.4, -1]} intensity={1.4} color="#ffd36b" distance={10} />
      <pointLight position={[1.6, 3.2, -1.2]} intensity={1.1} color="#5aa2ff" distance={10} />
      <pointLight position={[0, 4.0, -1.5]} intensity={0.9} color="#fff0c8" distance={12} />
      <ambientLight intensity={1.05} color="#ffe2b0" />
      <Crowd color="#0e0d14" hype />
      <FloorGlow color="#ffd36b" scale={2.4} />
      <Dust warm intensity={1.3} />
    </group>
  );
};

// ---------------------------------------------------------------------------
// Mundo por cena
// ---------------------------------------------------------------------------
const World: React.FC<{ time: number }> = ({ time }) => {
  const { id, local, dur } = sceneInfo(time);
  const p = smooth(local / dur);
  return (
    <group>
      {id === "hook" && <>
        <color attach="background" args={["#080812"]} />
        <fog attach="fog" args={["#0a0c18", 6, 24]} />
        <MessyRoom />
        <Keyboard pos={[0, 1.05, -0.35]} glow={0.8} />
        <FloorGlow color="#2a8bff" />
        {p < 0.17
          ? <ToonGuy pos={[0, 0.06, -0.85]} scale={1.02} pose="keys" energy={0.6} />
          : <ToonGuy pos={[0, 0.06, -0.9]} scale={1.95} pose="keys" energy={0.7} />}
      </>}

      {id === "success" && <>
        <color attach="background" args={["#0a0c18"]} />
        <fog attach="fog" args={["#10182c", 7, 28]} />
        <StageSet mode="success" />
        <Crowd color="#0d0e16" hype />
        <FloorGlow color="#2b78ff" scale={2.6} />
        {p < 0.15
          ? <ToonGuy pos={[0, 0.25, -0.9]} scale={1.0} pose="sing" energy={0.8} />
          : <ToonGuy pos={[0, 0.2, -0.55]} scale={1.9} pose="cheer" energy={1} />}
      </>}

      {id === "bedroom" && <>
        <color attach="background" args={["#0b0a12"]} />
        <fog attach="fog" args={["#14121e", 7, 26]} />
        <MessyRoom warm={p > 0.62} />
        <FourTrack pos={[-1.05, 1.05, -1.15]} scale={0.9} />
        <Guitar pos={[1.55, 0.95, -1.35]} rot={-0.14} scale={0.95} />
        <MicStand pos={[0.9, 0, -0.5]} />
        <Cassette pos={[-2.0, 0.78, -1.28]} rot={0.2} />
        <Cassette pos={[-1.65, 0.78, -1.22]} rot={-0.1} />
        <Cable from={[0.9, 0.1, -0.5]} to={[2.8, 0.2, -2.3]} />
        <Keyboard pos={[0, 1.05, -0.35]} glow={p > 0.5 ? 0.5 : 0.15} />
        <FloorGlow color={p > 0.62 ? "#ffb36b" : "#6fa8ff"} />
        {p < 0.28
          ? <ToonGuy pos={[0, 0.06, -0.85]} scale={1.02} pose="keys" energy={0.45} />
          : p < 0.55
            ? <ToonGuy pos={[0, 0.06, -0.85]} scale={1.95} pose="think" energy={0.3} />
            : <ToonGuy pos={[0, 0.06, -0.9]} scale={1.05} pose="keys" energy={0.55} />}
      </>}

      {id === "xero" && <>
        <color attach="background" args={["#07080e"]} />
        <fog attach="fog" args={["#0b0c16", 6, 24]} />
        <MessyRoom />
        <RejectionStack pos={[1.5, 0.76, -1.1]} />
        <mesh position={[-1.8, 1.9, -4.7]}><planeGeometry args={[0.9, 1.5]} /><meshBasicMaterial color="#252734" transparent opacity={0.55} /></mesh>
        <Keyboard pos={[0, 1.05, -0.4]} glow={0.05} />
        <FloorGlow color="#4d6fff" scale={1.8} />
        {p < 0.5
          ? <ToonGuy pos={[-0.4, 0.06, -0.85]} scale={1.05} pose="think" />
          : <ToonGuy pos={[-0.4, 0.06, -0.85]} scale={1.9} pose="think" />}
      </>}

      {id === "call" && <>
        <color attach="background" args={["#080910"]} />
        <fog attach="fog" args={["#0d1020", 6, 24]} />
        <MessyRoom warm={p > 0.5} />
        <Phone pos={[0, 0.9, -0.9]} ring={p < 0.55 ? 1 : 0} />
        <RejectionStack pos={[2.0, 0.76, -1.4]} />
        <FloorGlow color={p > 0.5 ? "#ffd36b" : "#4d6fff"} scale={2.0} />
        <pointLight position={[0, 2.4, -0.4]} intensity={p > 0.5 ? 1.5 : 0.5} color={p > 0.5 ? "#ffd36b" : "#4d6fff"} distance={8} />
        {p < 0.21
          ? <ToonGuy pos={[-0.7, 0.06, -0.95]} scale={1.05} pose="think" />
          : <ToonGuy pos={[-0.7, 0.06, -0.95]} scale={1.75} pose="phone" energy={0.6} />}
      </>}

      {id === "crawling" && <>
        <color attach="background" args={["#0b0b16"]} />
        <fog attach="fog" args={["#101022", 7, 28]} />
        <StageSet mode="studio" />
        <MicStand pos={[0.95, 0, -0.45]} />
        <Cable from={[0.95, 0.1, -0.45]} to={[3.2, 0.2, -2.5]} />
        <FloorGlow color="#ff3355" scale={2.0} />
        <ToonGuy pos={[-0.15, 0.25, -0.95]} scale={1.02} pose="keys" energy={0.7} />
        <ToonGuy pos={[1.45, 0.2, -1.35]} scale={0.92} hair="blond" shirt="#4a3a3a" pose="sing" energy={1} />
      </>}

      {id === "grammy" && <>
        <color attach="background" args={["#120e08"]} />
        <fog attach="fog" args={["#2a1e10", 7, 28]} />
        <GrammySet />
        <Trophy pos={[1.6, 0.36, -0.4]} scale={1.05} />
        <FloorGlow color="#ffd36b" pos={[-0.2, 0.02, -0.8]} scale={2.3} />
        {p < 0.45
          ? <ToonGuy pos={[-0.35, 0.25, -0.9]} scale={1.05} pose="quiet" energy={0.3} />
          : <ToonGuy pos={[-0.2, 0.2, -0.55]} scale={1.9} pose="cheer" energy={0.9} />}
      </>}

      {id === "legacy" && <>
        <color attach="background" args={["#100d18"]} />
        <fog attach="fog" args={["#1a1530", 7, 28]} />
        <StageSet mode="final" />
        <Crowd color="#100f18" hype />
        <FloorGlow color="#b07cff" scale={2.5} />
        {p < 0.12
          ? <ToonGuy pos={[0, 0.25, -0.9]} scale={1.05} pose="quiet" energy={0.3} />
          : <ToonGuy pos={[0, 0.2, -0.55]} scale={1.95} pose="cheer" energy={1} />}
      </>}
    </group>
  );
};

// ---------------------------------------------------------------------------
// Câmera: 22 planos, cortes secos, glides, rolls, impacto e foco
// ---------------------------------------------------------------------------
type CamKey = { p: [number, number, number]; l: [number, number, number]; fov: number; roll: number; coc: number; bloom: number; golden?: boolean };
const K = (p: [number, number, number], l: [number, number, number], fov: number, roll: number, coc: number, bloom: number, golden = false): CamKey => ({ p, l, fov, roll, coc, bloom, golden });

// As miras (l) acompanham o enquadramento do ROSTO: personagens em scale ~1 tem a
// cabeça em y~2.5; os closes com scale ~1.9 tem a cabeça em y~4.8. Mirar em y~1.1-1.5
// (valor antigo) enquadrava a virilha, principalmente nos closes ampliados.
const SHOTS: { a: number; b: number; from: CamKey; to: CamKey }[] = [
  { a: 0, b: 1.6, from: K([0.1, 2.4, 1.6], [0, 2.45, -0.85], 31, -0.02, 2.2, 0.55), to: K([0.03, 2.4, 1.5], [0, 2.45, -0.85], 30.5, 0.01, 2.2, 0.6) },
  { a: 1.6, b: 3.0, from: K([0.12, 2.42, 2.1], [0, 2.5, -0.85], 32, 0.035, 2.3, 0.6), to: K([0.02, 3.9, 2.0], [0, 4.0, -0.85], 31, -0.02, 2.3, 0.6) },
  { a: 3.0, b: 6.1, from: K([-0.55, 3.9, 4.3], [0, 4.0, -0.9], 44, -0.035, 3.8, 0.5), to: K([0.3, 3.9, 4.0], [0, 4.0, -0.9], 42, 0.025, 3.8, 0.55) },
  { a: 6.1, b: 9.2, from: K([-0.4, 2.4, 4.4], [0, 2.45, -0.9], 44, 0.04, 3.8, 0.7), to: K([0.35, 3.9, 4.1], [0, 4.0, -0.9], 42, -0.03, 3.8, 0.75) },
  { a: 9.2, b: 12.4, from: K([0.1, 4.05, 2.4], [0, 4.15, -0.55], 32, -0.03, 2.1, 0.85), to: K([0.02, 4.05, 2.3], [0, 4.15, -0.55], 31, 0.02, 2.1, 0.9) },
  { a: 12.4, b: 16.5, from: K([-0.5, 2.35, 4.3], [0, 2.4, -0.9], 44, 0.035, 3.8, 0.5), to: K([0.25, 2.35, 4.0], [0, 2.4, -0.9], 42, -0.025, 3.8, 0.55) },
  { a: 16.5, b: 19.8, from: K([0.05, 2.42, 2.5], [0, 2.5, -0.85], 32, -0.025, 2.3, 0.55), to: K([0.08, 2.42, 2.35], [0, 2.5, -0.85], 31, 0.015, 2.3, 0.55) },
  { a: 19.8, b: 22.5, from: K([-1.05, 1.3, 1.75], [-1.05, 1.2, -1.15], 33, 0.04, 2.4, 0.5), to: K([-0.98, 1.3, 1.6], [-1.05, 1.2, -1.15], 32, -0.03, 2.4, 0.5) },
  { a: 22.5, b: 25.8, from: K([1.55, 1.15, 1.85], [1.55, 1.05, -1.35], 34, -0.035, 2.5, 0.5), to: K([1.6, 1.15, 1.7], [1.55, 1.05, -1.35], 33, 0.025, 2.5, 0.5) },
  { a: 25.8, b: 30.8, from: K([-0.25, 2.42, 2.2], [0, 2.5, -0.55], 31, 0.035, 2.0, 0.6), to: K([-0.1, 2.42, 2.1], [0, 2.5, -0.55], 30.5, -0.02, 2.0, 0.6) },
  { a: 30.8, b: 35.4, from: K([-0.7, 2.38, 4.5], [0, 2.45, -0.9], 46, -0.04, 4.2, 0.6), to: K([0.15, 2.38, 4.2], [0, 2.45, -0.9], 45, 0.02, 4.2, 0.65) },
  { a: 35.4, b: 39.0, from: K([-0.4, 2.35, 2.5], [-0.4, 2.42, -0.85], 33, 0.03, 2.3, 0.4), to: K([-0.35, 2.35, 2.35], [-0.4, 2.42, -0.85], 32, -0.02, 2.3, 0.4) },
  { a: 39.0, b: 44.6, from: K([1.5, 1.05, 2.1], [1.5, 0.95, -1.1], 34, -0.035, 2.5, 0.35), to: K([1.55, 1.05, 1.95], [1.5, 0.95, -1.1], 33, 0.02, 2.5, 0.35) },
  { a: 44.6, b: 47.4, from: K([0.05, 1.15, 1.5], [0, 1.0, -0.9], 31, 0.04, 2.1, 0.5), to: K([0.02, 1.15, 1.4], [0, 1.0, -0.9], 30.5, -0.03, 2.1, 0.6) },
  { a: 47.4, b: 52.0, from: K([-0.7, 3.95, 3.6], [-0.55, 4.05, -0.95], 42, -0.03, 3.6, 0.55), to: K([0.1, 3.95, 3.4], [-0.55, 4.05, -0.95], 41, 0.025, 3.6, 0.6) },
  { a: 52.0, b: 54.0, from: K([-0.3, 4.05, 2.3], [-0.4, 4.15, -0.95], 32, 0.045, 2.2, 0.9), to: K([-0.2, 4.05, 2.2], [-0.4, 4.15, -0.95], 31, -0.04, 2.2, 0.95) },
  { a: 54.0, b: 57.5, from: K([0.6, 2.38, 4.2], [0, 2.45, -0.9], 43, 0.035, 3.7, 0.7), to: K([0.1, 2.38, 3.9], [0, 2.45, -0.9], 42, -0.03, 3.7, 0.75) },
  { a: 57.5, b: 62.2, from: K([-0.2, 2.42, 2.4], [0.2, 2.5, -0.7], 32, -0.03, 2.2, 0.85), to: K([0.05, 2.42, 2.25], [0.2, 2.5, -0.7], 31, 0.02, 2.2, 0.9) },
  { a: 62.2, b: 66.0, from: K([1.6, 1.15, 1.75], [1.6, 1.05, -0.4], 31, 0.04, 2.0, 0.85, true), to: K([1.62, 1.15, 1.6], [1.6, 1.05, -0.4], 30.5, -0.03, 2.0, 0.9, true) },
  { a: 66.0, b: 67.2, from: K([-0.5, 3.9, 4.3], [0, 4.0, -0.85], 44, -0.04, 3.8, 0.8, true), to: K([0.2, 3.9, 4.0], [0, 4.0, -0.85], 43, 0.03, 3.8, 0.85, true) },
  { a: 67.2, b: 72.0, from: K([0.2, 2.4, 4.1], [0, 2.45, -0.85], 43, 0.035, 3.6, 0.7), to: K([-0.05, 3.9, 3.8], [0, 4.0, -0.85], 42, -0.025, 3.6, 0.75) },
  { a: 72.0, b: MIKE_DUR, from: K([0, 4.05, 2.4], [0, 4.15, -0.55], 32, -0.02, 2.1, 0.8), to: K([0, 4.05, 2.25], [0, 4.15, -0.55], 31, 0.015, 2.1, 0.85) },
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

  for (const punch of PUNCHES) {
    const d = time - punch.t;
    if (d >= 0 && d < 0.32) {
      const k = Math.pow(1 - d / 0.32, 2);
      const dir = pos.clone().sub(look).normalize();
      pos.addScaledVector(dir, -k * 0.4);
      pos.x += punch.dir * k * 0.05 * (frame % 2 ? 1 : -1);
      pos.y += k * 0.032 * (frame % 3 === 0 ? 1 : -1);
      roll += punch.dir * k * 0.045;
      punchBloom += k * 0.26;
    }
  }

  const creep = Math.min(0.15, (time - shot.a) * 0.032);
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
  fx.bloom.intensity = bloom + punchBloom + (shot.from.golden ? 0.06 * Math.sin(time * 3.2) : 0);

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
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const time = frame / fps;
  const { scene } = useThree();
  noInkFallback(scene);
  return <><World time={time} /><CameraAndPost time={time} /></>;
};

// ---------------------------------------------------------------------------
// Texto e áudio
// ---------------------------------------------------------------------------
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
  const y = (1 - enter) * 34;
  const sc = 0.86 + 0.14 * enter + overshoot;
  const rot = (1 - enter) * -2.5 + Math.sin(t * 8) * 0.35;
  return <div style={{ ...overlayBase, top, fontSize, color, opacity: enter * exit, transform: `translateY(${y}px) scale(${sc}) rotate(${rot}deg)` }}>{text}</div>;
};

const Sfx: React.FC<{ at: number; dur: number; file: string; volume?: number }> = ({ at, dur, file, volume = 0.14 }) => (
  <Sequence from={Math.floor(at * MIKE_FPS)} durationInFrames={Math.floor(dur * MIKE_FPS)}>
    <Audio src={staticFile(`mike-shinoda/${file}`)} volume={volume} />
  </Sequence>
);

export const MikeShinoda: React.FC = () => {
  const cues = (wordsData as unknown as { cues?: { start: number; end: number; text: string }[] }).cues || [];
  const c = (i: number) => cues[i] || { start: 0, end: 0, text: "" };
  return (
    <AbsoluteFill style={{ backgroundColor: "#090914" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@800;900&family=Bebas+Neue&display=swap');`}</style>
      <ThreeCanvas width={1080} height={1920} camera={{ fov: 40, position: [0, 1.9, 3.3], near: 0.1, far: 140 }} gl={{ antialias: false, stencil: false, powerPreference: "high-performance", toneMappingExposure: 1.35 }}>
        <SceneRoot />
      </ThreeCanvas>

      <TextPop text={"DEFINIU UMA\nGERAÇÃO INTEIRA"} from={c(0).start} to={c(0).end + 0.3} top="8%" fontSize={66} color="#FFD54A" />
      <TextPop text={"HYBRID THEORY • 2000"} from={c(1).start} to={c(1).end + 0.4} top="8%" fontSize={58} color="#7fd4ff" />
      <TextPop text={"ANTES DO ESTÚDIO:\nO QUARTO"} from={c(2).start} to={c(3).end + 0.4} top="8%" fontSize={62} color="#c8d4ff" />
      <TextPop text={"O SETUP INTEIRO:\n~ US$ 300"} from={c(5).start} to={c(5).end + 0.5} top="60%" fontSize={56} color="#ffb36b" />
      <TextPop text={"MAL PENSAVA\nEM FORMAR BANDA"} from={c(7).start} to={c(8).end + 0.4} top="8%" fontSize={58} color="#9ec5ff" />
      <TextPop text={"XERO • NINGUÉM QUERIA"} from={c(9).start} to={c(9).end + 0.4} top="8%" fontSize={56} color="#ff4b66" />
      <TextPop text={"ESSAS MÚSICAS\nSOAM BEM"} from={c(11).start} to={c(11).end + 0.5} top="8%" fontSize={60} color="#FFD54A" />
      <TextPop text={"CRAWLING\nNASCIDA DE BLUE"} from={c(13).start} to={c(14).end + 0.4} top="8%" fontSize={58} color="#ff7f9a" />
      <TextPop text={"GRAMMY • 2002"} from={c(15).start} to={c(15).end + 0.5} top="8%" fontSize={68} color="#FFD54A" />
      <TextPop text={"UM QUARTO.\nUM TECLADO.\nMILHÕES DE VOZES."} from={c(16).start} to={c(16).end + 0.4} top="8%" fontSize={54} color="#c8b8ff" />
      <TextPop text={"QUAL MÚSICA MARCOU\nA SUA VIDA?"} from={c(17).start} to={MIKE_DUR} top="8%" fontSize={58} color="#FFD54A" />

      <Audio src={staticFile("mike-shinoda/voice.wav")} />
      <Audio src={staticFile("mike-shinoda/music.mp3")} volume={0.11} />
      <Sfx at={0.5} dur={0.5} file="sfx_whoosh.wav" volume={0.16} />
      <Sfx at={6.1} dur={0.5} file="sfx_whoosh.wav" volume={0.13} />
      <Sfx at={12.4} dur={0.5} file="sfx_whoosh.wav" volume={0.12} />
      <Sfx at={20.5} dur={0.8} file="sfx_keys.wav" volume={0.2} />
      <Sfx at={25.9} dur={0.35} file="sfx_impact.wav" volume={0.13} />
      <Sfx at={35.4} dur={0.5} file="sfx_whoosh.wav" volume={0.12} />
      <Sfx at={45.0} dur={1.8} file="sfx_phone.wav" volume={0.22} />
      <Sfx at={52.3} dur={0.35} file="sfx_impact.wav" volume={0.16} />
      <Sfx at={54.0} dur={0.5} file="sfx_whoosh.wav" volume={0.13} />
      <Sfx at={62.7} dur={3.0} file="sfx_crowd.wav" volume={0.14} />
      <Sfx at={67.2} dur={0.5} file="sfx_whoosh.wav" volume={0.12} />
    </AbsoluteFill>
  );
};

export default MikeShinoda;
