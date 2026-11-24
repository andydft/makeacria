import React, { useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig, interpolate, Sequence } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { InkPass, NOINK } from "../jimi3d/ink";
import { LensBlur } from "../jimi3d/lensblur";
import { GradeEffect, GRADES, GRADE_STRENGTH } from "../jimi3d/grade";
import { useSvgTexture } from "../../characters/base/useSvgTexture";
import CjLikeV1 from "../../characters/presets/CjLikeV1";
import wordsData from "../../../public/gta-sa-grove-street-parody/words.json";

export const GTA_FPS = 30;
export const GTA_FRAMES = 840; // 28s

const smooth = (t: number) => { const u = Math.max(0, Math.min(1, t)); return u * u * (3 - 2 * u); };
const makeBloom = () => new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.35, luminanceThreshold: 0.85, luminanceSmoothing: 0.25, mipmapBlur: true, levels: 4, radius: 0.6 });

const Card: React.FC<{ tex: THREE.Texture | null; pos: [number, number, number]; scale?: number | [number, number, number]; rot?: [number, number, number] }> = ({ tex, pos, scale = 1, rot = [0, 0, 0] }) => {
  if (!tex) return null;
  return <mesh position={pos} rotation={rot} scale={scale as any} layers={NOINK}><planeGeometry args={[2.2, 3.3]} /><meshBasicMaterial map={tex} transparent alphaTest={0.05} side={THREE.DoubleSide} /></mesh>;
};

const GroveHouse: React.FC<{ pos: [number, number, number]; scale?: number }> = ({ pos, scale = 1 }) => (
  <group position={pos} scale={scale}>
    <mesh position={[0, 1.1, 0]}><boxGeometry args={[3.2, 2.2, 2.2]} /><meshStandardMaterial color="#D9C3A0" roughness={0.9} /></mesh>
    <mesh position={[0, 2.5, 0]} rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[2.6, 1.3, 4]} /><meshStandardMaterial color="#8B5A2B" roughness={0.95} /></mesh>
    <mesh position={[0, 0.55, 1.12]}><boxGeometry args={[0.8, 1.1, 0.05]} /><meshStandardMaterial color="#6B7280" /></mesh>
    <mesh position={[-0.9, 1.2, 1.12]}><boxGeometry args={[0.6, 0.6, 0.05]} /><meshStandardMaterial color="#93C5FD" /></mesh>
    <mesh position={[0.9, 1.2, 1.12]}><boxGeometry args={[0.6, 0.6, 0.05]} /><meshStandardMaterial color="#93C5FD" /></mesh>
    <mesh position={[1.1, 0.2, 1.5]}><boxGeometry args={[1.2, 0.05, 1.8]} /><meshStandardMaterial color="#9CA3AF" /></mesh>
  </group>
);

const Palm: React.FC<{ pos: [number, number, number]; s?: number }> = ({ pos, s = 1 }) => (
  <group position={pos} scale={s}>
    <mesh position={[0, 1.8, 0]}><cylinderGeometry args={[0.08, 0.14, 3.6, 8]} /><meshStandardMaterial color="#8D6E63" /></mesh>
    {[0,1,2,3,4].map(i => <mesh key={i} position={[Math.sin(i*1.25)*0.5,3.6,Math.cos(i*1.25)*0.5]} rotation={[0.6, i*1.25, 0]}><boxGeometry args={[0.18,0.02,1.2]} /><meshStandardMaterial color="#2F855A" /></mesh>)}
  </group>
);

const Bike: React.FC<{ pos: [number, number, number]; rot?: [number, number, number]; s?: number }> = ({ pos, rot = [0, 0, 0], s = 1 }) => (
  <group position={pos} rotation={rot} scale={s}>
    <mesh position={[-0.55,0.28,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[0.28,0.05,10,20]} /><meshStandardMaterial color="#1F2937" /></mesh>
    <mesh position={[0.55,0.28,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[0.28,0.05,10,20]} /><meshStandardMaterial color="#1F2937" /></mesh>
    <mesh position={[0,0.55,0]} rotation={[0,0,0.2]}><boxGeometry args={[1.0,0.06,0.06]} /><meshStandardMaterial color="#10B981" /></mesh>
    <mesh position={[0.15,0.78,0]}><boxGeometry args={[0.06,0.45,0.06]} /><meshStandardMaterial color="#10B981" /></mesh>
    <mesh position={[-0.1,0.75,0]}><boxGeometry args={[0.5,0.06,0.06]} /><meshStandardMaterial color="#374151" /></mesh>
  </group>
);

const Scenery: React.FC<{ mood: "modern" | "grove" }> = ({ mood }) => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow><planeGeometry args={[30, 20]} /><meshStandardMaterial color={mood === "grove" ? "#6B8E4E" : "#64748B"} roughness={0.95} /></mesh>
    <mesh position={[0, 4.2, -7]}><planeGeometry args={[32, 11]} /><meshBasicMaterial color={mood === "grove" ? "#7DD3FC" : "#94A3B8"} /></mesh>
    <mesh position={[3.5, 6.2, -6.8]}><circleGeometry args={[1.0, 32]} /><meshBasicMaterial color="#FCD34D" /></mesh>
    <mesh position={[0, 0.01, 1.2]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[30, 2.4]} /><meshStandardMaterial color="#4B5563" /></mesh>
    {/* street line */}
    <mesh position={[0, 0.02, 1.2]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[0.18, 8]} /><meshStandardMaterial color="#E5E7EB" /></mesh>
    {mood === "grove" ? <>
      <GroveHouse pos={[-4.2,0,-2.8]} scale={0.9} />
      <GroveHouse pos={[4.2,0,-3.2]} scale={0.95} />
      <Palm pos={[-6.2,0,-1.8]} s={0.9} />
      <Palm pos={[6.4,0,-2.0]} s={1.0} />
      <Palm pos={[1.8,0,-4.8]} s={0.8} />
    </> : <>
      <mesh position={[-4.5,1.8,-3.5]}><boxGeometry args={[2.2,3.6,2.2]} /><meshStandardMaterial color="#475569" /></mesh>
      <mesh position={[4.5,2.2,-3.8]}><boxGeometry args={[2.6,4.4,2.2]} /><meshStandardMaterial color="#334155" /></mesh>
      <mesh position={[0,1.4,-4.2]}><boxGeometry args={[1.8,2.8,1.8]} /><meshStandardMaterial color="#64748B" /></mesh>
    </>}
  </group>
);

const CjCard: React.FC<{ frame: number; t: number }> = ({ frame, t }) => {
  const words = (wordsData as any).words as { text: string; offset: number; duration: number }[];
  const speaking = words.some(w => t >= w.offset - 0.03 && t <= w.offset + w.duration + 0.08);
  const cycle = Math.sin(frame * 0.24);
  const mouthShape: "neutral" | "open" | "smile" = speaking ? (cycle > 0.15 ? "open" : "smile") : "neutral";
  const blink = frame % 110 > 104 ? 0.08 : 1;
  const bob = Math.sin(frame * 0.05) * 0.015;
  const tex = useSvgTexture(<CjLikeV1 width={512} height={768} eyeOpen={blink} mouthShape={mouthShape} />, ["cj-like-v1", Math.round(frame/2), mouthShape, speaking?1:0, blink<0.5?1:0], 512, 768);
  return <Card tex={tex} pos={[0, 1.72 + bob, 0.3]} scale={1.02} />;
};

const CameraRig: React.FC<{ frame: number }> = ({ frame }) => {
  const { camera } = useThree();
  const t = frame / GTA_FRAMES;
  let cam = { x: 0, y: 2.9, z: 10.5, lx: 0, ly: 2.1, lz: 0, fov: 44 };
  if (t < 0.2) { const p = smooth(t / 0.2); cam = { x: -0.8 + p * 0.8, y: 2.9, z: 10.8 - p * 0.8, lx: 0, ly: 2.1, lz: 0, fov: 45 }; }
  else if (t < 0.45) { const p = smooth((t - 0.2) / 0.25); cam = { x: 1.2 - p * 2.4, y: 2.7, z: 9.2, lx: 0, ly: 2.1, lz: 0, fov: 42 }; }
  else if (t < 0.7) { cam = { x: 0, y: 2.5, z: 7.8, lx: 0, ly: 2.3, lz: 0.2, fov: 38 }; }
  else { const p = smooth((t - 0.7) / 0.3); cam = { x: -0.6 + p * 0.6, y: 3.0, z: 10.5 - p * 0.5, lx: 0, ly: 2.1, lz: 0, fov: 45 }; }
  camera.position.set(cam.x, cam.y, cam.z);
  camera.lookAt(cam.lx, cam.ly, cam.lz);
  if ("fov" in camera) { (camera as THREE.PerspectiveCamera).fov = cam.fov; camera.updateProjectionMatrix(); }
  return null;
};

const Effects: React.FC = () => {
  const { scene, camera } = useThree();
  const fx = useMemo(() => ({ ink: new InkPass(scene, camera as THREE.PerspectiveCamera, { strength: 0.5, widthNear: 3.3, widthFar: 2.1 }), lens: new LensBlur({ maxCoC: 8, nearScale: 0.7 }), bloom: makeBloom(), tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }), grade: new GradeEffect(GRADES.day, GRADE_STRENGTH.day) }), [scene, camera]);
  return <EffectComposer multisampling={0} frameBufferType={THREE.HalfFloatType} renderPriority={1}>
    <primitive object={fx.ink} dispose={null} /><primitive object={fx.lens.pre} dispose={null} /><primitive object={fx.lens.main} dispose={null} />
    <primitive object={fx.bloom} dispose={null} /><primitive object={fx.tone} dispose={null} /><primitive object={fx.grade} dispose={null} />
  </EffectComposer>;
};

const Subtitle: React.FC = () => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const t = frame / fps;
  const words = (wordsData as any).words as { text: string; offset: number; duration: number }[];
  const active = words.filter(w => t >= w.offset - 0.05 && t <= w.offset + w.duration + 0.15);
  const recent = words.filter(w => w.offset <= t).slice(-6);
  const line = (active.length ? active : recent).map(w => w.text).join(" ");
  if (!line) return null;
  return <div style={{ position: "absolute", bottom: 110, left: 60, right: 60, textAlign: "center", fontFamily: "Arial Black, Arial, sans-serif", fontSize: 42, lineHeight: 1.25, color: "#FFFFFF", textShadow: "0 4px 18px rgba(0,0,0,0.55)", padding: "18px 24px", borderRadius: 20, background: "rgba(17,24,39,0.35)" }}>{line}</div>;
};

const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 8, 70, 90], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <div style={{ position: "absolute", top: 100, left: 50, right: 50, textAlign: "center", opacity }}>
    <div style={{ fontFamily: "Arial Black, Arial, sans-serif", fontSize: 42, color: "#FFFFFF", background: "rgba(22,101,52,0.85)", borderRadius: 24, padding: "20px", border: "3px solid #86EFAC" }}>
      GTA 6 chegou...
      <div style={{ fontSize: 28, marginTop: 10, color: "#DCFCE7", fontFamily: "Arial, sans-serif" }}>mas a missão é voltar pra Grove Street</div>
    </div>
  </div>;
};

const MissionPassed: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const show = t > 14.5 && t < 18.5;
  const opacity = show ? interpolate(t, [14.5, 15.0, 17.8, 18.5], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
  return <div style={{ position: "absolute", top: 180, left: 80, right: 80, textAlign: "center", opacity }}>
    <div style={{ fontFamily: "Arial Black, Arial, sans-serif", fontSize: 54, color: "#FACC15", textShadow: "0 6px 24px rgba(0,0,0,0.6)", letterSpacing: 1 }}>MISSÃO CUMPRIDA</div>
    <div style={{ fontFamily: "Arial Black, Arial, sans-serif", fontSize: 34, color: "#86EFAC", marginTop: 8 }}>RESPEITO +99</div>
  </div>;
};

const CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [GTA_FRAMES - 120, GTA_FRAMES - 90], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <div style={{ position: "absolute", top: 140, left: 60, right: 60, textAlign: "center", opacity }}>
    <div style={{ fontFamily: "Arial Black, Arial, sans-serif", fontSize: 34, color: "#FFFFFF", background: "rgba(22,101,52,0.72)", borderRadius: 20, padding: "18px", border: "2px solid #86EFAC" }}>
      Comenta: SA ou GTA 6? 💚
    </div>
  </div>;
};

const Scene: React.FC = () => {
  const frame = useCurrentFrame(); const { width, height, fps } = useVideoConfig(); const t = frame / fps;
  const mood: "modern" | "grove" = t < 6 ? "modern" : "grove";
  return <>
    <ThreeCanvas width={width} height={height} frameloop="demand" dpr={1.0}
      shadows gl={{ antialias: false, alpha: false, powerPreference: "high-performance", toneMapping: THREE.NoToneMapping, outputColorSpace: THREE.SRGBColorSpace }}
      camera={{ fov: 44, position: [0, 2.9, 10.5], near: 0.1, far: 60 }}
      onCreated={({ gl }) => { gl.setClearColor(mood === "grove" ? 0x7DD3FC : 0x94A3B8, 1); gl.shadowMap.enabled = true; gl.shadowMap.type = THREE.PCFSoftShadowMap; }}>
      <CameraRig frame={frame} />
      <color attach="background" args={[mood === "grove" ? "#7DD3FC" : "#94A3B8"]} />
      <fog attach="fog" args={[mood === "grove" ? "#7DD3FC" : "#94A3B8", 14, 40]} />
      <ambientLight intensity={0.75} />
      <directionalLight position={[5, 10, 6]} intensity={1.2} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <Scenery mood={mood} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0.35]} layers={NOINK}><circleGeometry args={[0.55, 32]} /><meshBasicMaterial color="#000000" transparent opacity={0.16} /></mesh>
      <CjCard frame={frame} t={t} />
      {t > 8 && <Bike pos={[2.2, 0, 0.8]} rot={[0, -0.5, 0]} s={1.0} />}
      <Effects />
    </ThreeCanvas>
    <Hook />
    <MissionPassed />
    <CTA />
    <Subtitle />
  </>;
};

export const GtaSaGroveStreetParody: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#7DD3FC" }}>
    <Audio src={staticFile("gta-sa-grove-street-parody/voice.wav")} />
    <Audio src={staticFile("gta-sa-grove-street-parody/beat.wav")} volume={0.22} />
    <Scene />
  </AbsoluteFill>
);

export default GtaSaGroveStreetParody;
