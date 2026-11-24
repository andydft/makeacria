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

const Car: React.FC<{ pos: [number, number, number]; rot?: [number, number, number]; color?: string }> = ({ pos, rot = [0, 0, 0], color = "#1D7A3D" }) => (
  <group position={pos} rotation={rot}>
    <mesh position={[0, 0.42, 0]}><boxGeometry args={[2.4, 0.45, 1.1]} /><meshStandardMaterial color={color} metalness={0.2} roughness={0.5} /></mesh>
    <mesh position={[0.1, 0.72, 0]}><boxGeometry args={[1.2, 0.35, 0.95]} /><meshStandardMaterial color="#BFD7EA" transparent opacity={0.7} /></mesh>
    <mesh position={[-0.7, 0.22, 0.56]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.22, 0.22, 0.12, 16]} /><meshStandardMaterial color="#111827" /></mesh>
    <mesh position={[0.7, 0.22, 0.56]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.22, 0.22, 0.12, 16]} /><meshStandardMaterial color="#111827" /></mesh>
    <mesh position={[-0.7, 0.22, -0.56]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.22, 0.22, 0.12, 16]} /><meshStandardMaterial color="#111827" /></mesh>
    <mesh position={[0.7, 0.22, -0.56]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.22, 0.22, 0.12, 16]} /><meshStandardMaterial color="#111827" /></mesh>
    <mesh position={[1.21, 0.38, 0.35]}><boxGeometry args={[0.04, 0.08, 0.18]} /><meshStandardMaterial color="#FDE68A" emissive="#FDE68A" emissiveIntensity={0.8} /></mesh>
    <mesh position={[1.21, 0.38, -0.35]}><boxGeometry args={[0.04, 0.08, 0.18]} /><meshStandardMaterial color="#FDE68A" emissive="#FDE68A" emissiveIntensity={0.8} /></mesh>
  </group>
);

const Scenery: React.FC<{ mood: "modern" | "grove" }> = ({ mood }) => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow><planeGeometry args={[34, 22]} /><meshStandardMaterial color={mood === "grove" ? "#719A52" : "#6B7280"} roughness={0.95} /></mesh>
    <mesh position={[0, 4.6, -7.5]}><planeGeometry args={[36, 12]} /><meshBasicMaterial color={mood === "grove" ? "#7DD3FC" : "#A5B4FC"} /></mesh>
    <mesh position={[4.2, 6.6, -7.3]}><circleGeometry args={[1.15, 32]} /><meshBasicMaterial color="#FDE047" /></mesh>
    {/* road */}
    <mesh position={[0, 0.01, 1.4]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[34, 3.0]} /><meshStandardMaterial color="#374151" roughness={0.95} /></mesh>
    {[-4,-2,0,2,4].map((x,i)=><mesh key={i} position={[x,0.02,1.4]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[0.7,0.12]} /><meshStandardMaterial color="#F3F4F6" /></mesh>)}
    {/* sidewalk */}
    <mesh position={[0,0.03,-0.25]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[34,0.9]} /><meshStandardMaterial color="#CBD5E1" /></mesh>
    {mood === "grove" ? <>
      <GroveHouse pos={[-4.4,0,-3.2]} scale={0.95} />
      <GroveHouse pos={[4.6,0,-3.4]} scale={1.0} />
      <GroveHouse pos={[0.2,0,-4.8]} scale={0.85} />
      <Palm pos={[-6.8,0,-2.0]} s={1.0} />
      <Palm pos={[6.8,0,-2.2]} s={1.05} />
      <Palm pos={[-1.8,0,-5.2]} s={0.82} />
      <Palm pos={[2.4,0,-5.4]} s={0.78} />
      <Car pos={[-2.8,0,1.35]} rot={[0,0.08,0]} color="#166534" />
      {/* graffiti wall */}
      <mesh position={[0,1.0,-2.3]}><boxGeometry args={[3.4,1.2,0.15]} /><meshStandardMaterial color="#D6D3D1" /></mesh>
      <mesh position={[-0.6,1.05,-2.22]}><boxGeometry args={[0.9,0.35,0.03]} /><meshBasicMaterial color="#22C55E" /></mesh>
      <mesh position={[0.7,0.95,-2.22]}><boxGeometry args={[0.8,0.25,0.03]} /><meshBasicMaterial color="#F59E0B" /></mesh>
    </> : <>
      {[-5,0,5].map((x,i)=><mesh key={i} position={[x,2.0,-4.0]}><boxGeometry args={[2.4,4.0,2.2]} /><meshStandardMaterial color={i===1?"#475569":"#64748B"} /></mesh>)}
      <mesh position={[-2.5,1.2,-2.2]}><boxGeometry args={[1.4,2.4,0.12]} /><meshBasicMaterial color="#60A5FA" transparent opacity={0.35} /></mesh>
      <mesh position={[2.5,1.2,-2.2]}><boxGeometry args={[1.4,2.4,0.12]} /><meshBasicMaterial color="#A78BFA" transparent opacity={0.25} /></mesh>
    </>}
  </group>
);

const CjCard: React.FC<{ frame: number; t: number }> = ({ frame, t }) => {
  const words = (wordsData as any).words as { text: string; offset: number; duration: number }[];
  const speaking = words.some(w => t >= w.offset - 0.03 && t <= w.offset + w.duration + 0.08);
  const cycle = Math.sin(frame * 0.24);
  const mouthShape: "neutral" | "open" | "smile" = speaking ? (cycle > 0.15 ? "open" : "smile") : "neutral";
  const blink = frame % 110 > 104 ? 0.08 : 1;
  const bob = Math.sin(frame * 0.06) * 0.02;
  const sway = Math.sin(frame * 0.04) * 2.5;
  const tex = useSvgTexture(
    <CjLikeV1 width={512} height={768} eyeOpen={blink} mouthShape={mouthShape} pose={{ bodyY: bob * -8, headY: bob * -4, headRotate: Math.sin(frame * 0.03) * 1.5, armLeftRotate: 8 + sway, armRightRotate: -8 - sway }} />,
    ["cj-like-v2", Math.round(frame / 2), mouthShape, speaking ? 1 : 0, blink < 0.5 ? 1 : 0],
    512, 768
  );
  return <Card tex={tex} pos={[0, 1.72 + bob, 0.3]} scale={1.05} />;
};

const CameraRig: React.FC<{ frame: number }> = ({ frame }) => {
  const { camera } = useThree();
  const t = frame / GTA_FRAMES;
  let cam = { x: 0, y: 2.9, z: 10.2, lx: 0, ly: 2.1, lz: 0.2, fov: 44 };
  if (t < 0.18) { const p = smooth(t / 0.18); cam = { x: -1.4 + p * 1.0, y: 3.1, z: 11.5 - p * 1.2, lx: -0.2, ly: 2.0, lz: 0.2, fov: 46 }; }
  else if (t < 0.38) { const p = smooth((t - 0.18) / 0.20); cam = { x: 1.6 - p * 2.8, y: 2.6, z: 9.2 - p * 0.4, lx: 0.1 - p * 0.1, ly: 2.15, lz: 0.3, fov: 41 }; }
  else if (t < 0.55) { const p = smooth((t - 0.38) / 0.17); cam = { x: 0.0, y: 2.35 + p * 0.1, z: 7.4, lx: 0, ly: 2.35, lz: 0.35, fov: 36 }; }
  else if (t < 0.75) { const p = smooth((t - 0.55) / 0.20); cam = { x: -1.2 + p * 2.4, y: 2.8, z: 9.8 - p * 1.0, lx: 0, ly: 2.15, lz: 0.2, fov: 43 }; }
  else { const p = smooth((t - 0.75) / 0.25); cam = { x: 0.6 - p * 0.6, y: 3.0, z: 10.8 - p * 0.8, lx: 0, ly: 2.1, lz: 0.2, fov: 45 }; }
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
  const opacity = interpolate(frame, [0, 8, 75, 95], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const y = interpolate(frame, [0, 12], [20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <div style={{ position: "absolute", top: 90, left: 45, right: 45, textAlign: "center", opacity, transform: `translateY(${y}px)` }}>
    <div style={{ fontFamily: "Arial Black, Arial, sans-serif", fontSize: 46, color: "#FDE047", background: "rgba(20,83,45,0.88)", borderRadius: 26, padding: "22px 20px", border: "4px solid #4ADE80", boxShadow: "0 12px 40px rgba(0,0,0,0.35)" }}>
      GTA 6 CHEGOU...
      <div style={{ fontSize: 30, marginTop: 10, color: "#FFFFFF", fontFamily: "Arial, sans-serif", fontWeight: 700 }}>mas a missão é voltar pra Grove Street</div>
    </div>
  </div>;
};

const MissionPassed: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const show = t > 13.8 && t < 18.2;
  const opacity = show ? interpolate(t, [13.8, 14.3, 17.5, 18.2], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
  const scale = show ? interpolate(t, [13.8, 14.3], [0.85, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
  return <div style={{ position: "absolute", top: 170, left: 60, right: 60, textAlign: "center", opacity, transform: `scale(${scale})` }}>
    <div style={{ fontFamily: "Arial Black, Arial, sans-serif", fontSize: 60, color: "#FACC15", textShadow: "0 8px 30px rgba(0,0,0,0.65)", letterSpacing: 1.5 }}>MISSÃO CUMPRIDA</div>
    <div style={{ fontFamily: "Arial Black, Arial, sans-serif", fontSize: 38, color: "#4ADE80", marginTop: 10, textShadow: "0 4px 16px rgba(0,0,0,0.5)" }}>RESPEITO +99</div>
  </div>;
};

const CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [GTA_FRAMES - 130, GTA_FRAMES - 100], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <div style={{ position: "absolute", top: 130, left: 55, right: 55, textAlign: "center", opacity }}>
    <div style={{ fontFamily: "Arial Black, Arial, sans-serif", fontSize: 38, color: "#FFFFFF", background: "rgba(20,83,45,0.82)", borderRadius: 22, padding: "20px", border: "3px solid #4ADE80", boxShadow: "0 10px 30px rgba(0,0,0,0.3)" }}>
      Comenta: SA ou GTA 6? 💚
      <div style={{ fontSize: 24, marginTop: 8, color: "#BBF7D0", fontFamily: "Arial, sans-serif" }}>Curte, segue e compartilha</div>
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
      <ambientLight intensity={0.72} />
      <directionalLight position={[6, 10, 5]} intensity={1.35} color="#FFF4D6" castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <pointLight position={[-4, 3, 2]} intensity={0.45} color={mood === "grove" ? "#86EFAC" : "#93C5FD"} distance={12} />
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
