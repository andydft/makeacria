import os

path = r"C:\Users\Pichau\cartoon-short\jimi-broom-short\src\videos\chesterCrawling\ChesterCrawling.tsx"
content = r'''import React, { Suspense, useEffect, useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
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
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const sceneInfo = (time: number) => {
  for (let i = 0; i < SCENES.length; i++) {
    const s = SCENES[i];
    if (time >= s.a && time < s.b) return { ...s, local: time - s.a, dur: Math.max(0.001, s.b - s.a), idx: i };
  }
  const last = SCENES[SCENES.length - 1];
  return { ...last, local: Math.max(0, time - last.a), dur: Math.max(0.001, last.b - last.a), idx: SCENES.length - 1 };
};

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
  const breathe = 1 + 0.008 * Math.sin(t * 1.8);
  const pulse = 1 + energy * 0.015 * Math.abs(Math.sin(t * 4.2));
  const bob = Math.sin(t * 1.3) * (0.012 + energy * 0.02);
  const sway = Math.sin(t * 0.8) * (0.004 + energy * 0.008) + tilt;
  const s = scale * breathe * pulse;
  return <Sprite tex={tex} pos={[pos[0], pos[1] + bob, pos[2]]} size={[2.6 * s, 3.5 * s]} opacity={opacity} rot={[0, 0, sway]} />;
};

const Crowd: React.FC<{ color?: string; hype?: boolean }> = ({ color = "#12121a", hype = false }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const t = frame / fps;
  const people = useMemo(() => Array.from({ length: 55 }, (_, i) => ({ x: (i / 54 - 0.5) * 14, h: 0.4 + Math.random() * 0.35, w: 0.14 + Math.random() * 0.08, z: -5.8 - Math.random() * 3.5, ph: Math.random() * Math.PI * 2 })), []);
  const amp = hype ? 0.1 : 0.03; const spd = hype ? 3.5 : 1.2;
  return <group>{people.map((p, i) => { const b = Math.abs(Math.sin(t * spd + p.ph)) * amp; return (
    <group key={i} position={[p.x, 0.25 + b, p.z]}>
      <mesh layers={NOINK} position={[0, p.h * 0.7, 0]}><sphereGeometry args={[p.w * 0.33, 7, 7]} /><meshBasicMaterial color={color} transparent opacity={0.92} toneMapped={false} /></mesh>
      <mesh layers={NOINK} position={[0, p.h * 0.25, 0]}><capsuleGeometry args={[p.w * 0.26, p.h * 0.42, 4, 8]} /><meshBasicMaterial color={color} transparent opacity={0.92} toneMapped={false} /></mesh>
    </group>); })}</group>;
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
    <mesh position={[0, 1.35, 0.36]} rotation={[0, 0, 0]}><circleGeometry args={[0.22, 16]} /><meshBasicMaterial color="#0f0f14" /></mesh>
    <mesh position={[0, 0.85, 0.36]}><circleGeometry args={[0.3, 16]} /><meshBasicMaterial color="#101018" /></mesh>
    <mesh position={[0, 0.45, 0.36]}><circleGeometry args={[0.18, 16]} /><meshBasicMaterial color="#0f0f14" /></mesh>
  </group>
);

const LightBar: React.FC<{ pos: [number, number, number]; color: string; intensity?: number }> = ({ pos, color, intensity = 1.2 }) => (
  <group position={pos}>
    <mesh><boxGeometry args={[2.2, 0.08, 0.12]} /><meshLambertMaterial color="#1a1a22" /></mesh>
    <pointLight position={[0, -0.2, 0.4]} intensity={intensity} color={color} distance={8} />
    <mesh position={[-0.7, -0.02, 0.07]}><circleGeometry args={[0.05, 10]} /><meshBasicMaterial color={color} toneMapped={false} /></mesh>
    <mesh position={[0, -0.02, 0.07]}><circleGeometry args={[0.05, 10]} /><meshBasicMaterial color={color} toneMapped={false} /></mesh>
    <mesh position={[0.7, -0.02, 0.07]}><circleGeometry args={[0.05, 10]} /><meshBasicMaterial color={color} toneMapped={false} /></mesh>
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
  const mid: [number, number, number] = [(from[0] + to[0]) / 2, Math.min(from[1], to[1]) - 0.3, (from[2] + to[2]) / 2];
  const curve = useMemo(() => new THREE.QuadraticBezierCurve3(new THREE.Vector3(...from), new THREE.Vector3(...mid), new THREE.Vector3(...to)), [from, to, mid]);
  const geom = useMemo(() => new THREE.TubeGeometry(curve, 20, 0.015, 6, false), [curve]);
  return <mesh geometry={geom}><meshBasicMaterial color="#111118" /></mesh>;
};

const FloorGlow: React.FC<{ color: string; pos?: [number, number, number]; scale?: number }> = ({ color, pos = [0, 0.02, -0.8], scale = 2.2 }) => (
  <mesh position={pos} rotation={[-Math.PI / 2, 0, 0]}>
    <circleGeometry args={[scale, 32]} />
    <meshBasicMaterial color={color} transparent opacity={0.08} toneMapped={false} />
  </mesh>
);
'''
with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('part1', os.path.getsize(path))
