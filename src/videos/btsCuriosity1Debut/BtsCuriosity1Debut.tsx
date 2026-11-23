import React, { useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { InkPass, NOINK } from "../jimi3d/ink";
import { LensBlur } from "../jimi3d/lensblur";
import { GradeEffect, GRADES, GRADE_STRENGTH } from "../jimi3d/grade";
import { useSvgTexture } from "../../characters/base/useSvgTexture";
import { MaleBaseCharacter } from "../../characters/base/MaleBaseCharacter";
import { RM_BTS_V1 } from "../../characters/presets/rmBtsV1";
import { JIN_BTS_V1 } from "../../characters/presets/jinBtsV1";
import { SUGA_BTS_V1 } from "../../characters/presets/sugaBtsV1";
import { JHOPE_BTS_V1 } from "../../characters/presets/jhopeBtsV1";
import { JIMIN_BTS_V1 } from "../../characters/presets/jiminBtsV1";
import { V_BTS_V1 } from "../../characters/presets/vBtsV1";
import { JUNGKOOK_BTS_V1 } from "../../characters/presets/jungkookBtsV1";
import wordsData from "../../../public/bts-curiosity-1-debut/words.json";

export const BCD1_FPS = 30;
export const BCD1_FRAMES = 1220; // ~40.7s, voice ~38.6s + tail

const smooth = (t: number) => { const u = Math.max(0, Math.min(1, t)); return u * u * (3 - 2 * u); };
const makeBloom = () => new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.35, luminanceThreshold: 0.88, luminanceSmoothing: 0.25, mipmapBlur: true, levels: 4, radius: 0.6 });

const Box: React.FC<{ pos: [number, number, number]; args: [number, number, number]; color: string; rot?: [number, number, number]; rough?: number }> = ({ pos, args, color, rot = [0, 0, 0], rough = 0.85 }) => (
  <mesh position={pos} rotation={rot} castShadow receiveShadow><boxGeometry args={args} /><meshStandardMaterial color={color} roughness={rough} metalness={0.05} /></mesh>
);
const Card: React.FC<{ tex: THREE.Texture | null; pos: [number, number, number]; scale?: number | [number, number, number]; rot?: [number, number, number]; opacity?: number }> = ({ tex, pos, scale = 1, rot = [0, 0, 0], opacity = 1 }) => {
  if (!tex) return null;
  return <mesh position={pos} rotation={rot} scale={scale as any} layers={NOINK}><planeGeometry args={[2.2, 3.3]} /><meshBasicMaterial map={tex} transparent alphaTest={0.05} side={THREE.DoubleSide} opacity={opacity} /></mesh>;
};

type Member = { id: string; name: string; preset: any; x: number; color: string };
const MEMBERS: Member[] = [
  { id: "rm", name: "RM", preset: RM_BTS_V1, x: -3.6, color: "#3B82F6" },
  { id: "jin", name: "Jin", preset: JIN_BTS_V1, x: -2.4, color: "#F9A8D4" },
  { id: "suga", name: "SUGA", preset: SUGA_BTS_V1, x: -1.2, color: "#9CA3AF" },
  { id: "jhope", name: "j-hope", preset: JHOPE_BTS_V1, x: 0, color: "#22C55E" },
  { id: "jimin", name: "Jimin", preset: JIMIN_BTS_V1, x: 1.2, color: "#93C5FD" },
  { id: "v", name: "V", preset: V_BTS_V1, x: 2.4, color: "#8B5CF6" },
  { id: "jk", name: "Jungkook", preset: JUNGKOOK_BTS_V1, x: 3.6, color: "#E5E7EB" },
];

const CharacterCard: React.FC<{ m: Member; frame: number; highlight?: boolean }> = ({ m, frame, highlight }) => {
  const bob = Math.sin(frame * 0.04 + m.x) * 0.4;
  const eyeOpen = (frame + Math.round(m.x * 20)) % 140 > 134 && (frame + Math.round(m.x * 20)) % 140 < 139 ? 0.08 : 1;
  const headRotate = Math.sin(frame * 0.015 + m.x * 0.5) * 2;
  const tex = useSvgTexture(<MaleBaseCharacter width={512} height={768} {...m.preset} pose={{ bodyY: bob * 0.2, headY: bob * 0.15, headRotate, eyeOpen, mouthShape: "neutral" }} />, [m.id, Math.round(frame / 3), highlight ? 1 : 0], 512, 768);
  const y = 2.05 + (highlight ? 0.08 : 0);
  const s = highlight ? 1.02 : 0.96;
  return <Card tex={tex} pos={[m.x, y, 0]} scale={s} />;
};

const StudioStage: React.FC = () => (
  <group>
    {/* Floor */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[30, 20]} />
      <meshStandardMaterial color="#E8EDF5" roughness={0.9} metalness={0.02} />
    </mesh>
    {/* Back wall */}
    <Box pos={[0, 3.2, -3.5]} args={[30, 7, 0.3]} color="#F3F6FB" rough={0.95} />
    {/* LED panel */}
    <mesh position={[0, 3.4, -3.34]}>
      <planeGeometry args={[14, 4.2]} />
      <meshBasicMaterial color="#DDEAFE" />
    </mesh>
    <mesh position={[0, 3.4, -3.33]}>
      <planeGeometry args={[13.6, 3.8]} />
      <meshBasicMaterial color="#EEF4FF" transparent opacity={0.95} />
    </mesh>
    {/* Side pillars */}
    <Box pos={[-7.2, 2.5, -2.5]} args={[0.5, 5, 2]} color="#DCE5F2" />
    <Box pos={[7.2, 2.5, -2.5]} args={[0.5, 5, 2]} color="#DCE5F2" />
    {/* Accent lights */}
    {[-5, -2.5, 0, 2.5, 5].map((x, i) => (
      <mesh key={i} position={[x, 0.02, 1.8]}>
        <circleGeometry args={[0.16, 20]} />
        <meshBasicMaterial color={["#A78BFA", "#60A5FA", "#F472B6", "#60A5FA", "#A78BFA"][i]} transparent opacity={0.55} />
      </mesh>
    ))}
  </group>
);

const CameraRig: React.FC<{ frame: number }> = ({ frame }) => {
  const { camera } = useThree();
  const t = frame / BCD1_FRAMES;
  let cam = { x: 0, y: 3.0, z: 11.5, lx: 0, ly: 2.1, lz: -0.2, fov: 46 };
  if (t < 0.12) {
    const p = smooth(t / 0.12);
    cam = { x: -1.5 + p * 1.5, y: 3.3, z: 13.5 - p * 1.5, lx: 0, ly: 2.2, lz: -0.5, fov: 50 };
  } else if (t < 0.32) {
    const p = smooth((t - 0.12) / 0.2);
    cam = { x: 0 + p * 0.5, y: 3.0, z: 11.0, lx: 0, ly: 2.15, lz: 0, fov: 46 };
  } else if (t < 0.55) {
    const p = smooth((t - 0.32) / 0.23);
    cam = { x: -2.5 + p * 5.0, y: 2.9, z: 10.5, lx: -2.0 + p * 4.0, ly: 2.15, lz: 0, fov: 44 };
  } else if (t < 0.78) {
    const p = smooth((t - 0.55) / 0.23);
    cam = { x: 1.5 - p * 3.0, y: 3.0, z: 11.2, lx: 1.0 - p * 2.0, ly: 2.15, lz: 0, fov: 45 };
  } else {
    const p = smooth((t - 0.78) / 0.22);
    cam = { x: 0, y: 3.2, z: 12.5 - p * 0.8, lx: 0, ly: 2.1, lz: -0.2, fov: 48 };
  }
  camera.position.set(cam.x, cam.y, cam.z);
  camera.lookAt(cam.lx, cam.ly, cam.lz);
  if ("fov" in camera) { (camera as THREE.PerspectiveCamera).fov = cam.fov; camera.updateProjectionMatrix(); }
  return null;
};

const Effects: React.FC = () => {
  const { scene, camera } = useThree();
  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera, { strength: 0.55, widthNear: 3.5, widthFar: 2.2 }),
    lens: new LensBlur({ maxCoC: 10, nearScale: 0.8 }),
    bloom: makeBloom(),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(GRADES.day, GRADE_STRENGTH.day),
  }), [scene, camera]);
  return (
    <EffectComposer multisampling={0} frameBufferType={THREE.HalfFloatType} renderPriority={1}>
      <primitive object={fx.ink} dispose={null} />
      <primitive object={fx.lens.pre} dispose={null} />
      <primitive object={fx.lens.main} dispose={null} />
      <primitive object={fx.bloom} dispose={null} />
      <primitive object={fx.tone} dispose={null} />
      <primitive object={fx.grade} dispose={null} />
    </EffectComposer>
  );
};

const Subtitle: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const words = (wordsData as any).words as { text: string; offset: number; duration: number }[];
  const active = words.filter(w => t >= w.offset - 0.05 && t <= w.offset + w.duration + 0.15);
  const recent = words.filter(w => w.offset <= t).slice(-6);
  const line = (active.length ? active : recent).map(w => w.text).join(" ");
  if (!line) return null;
  return (
    <div style={{ position: "absolute", bottom: 110, left: 60, right: 60, textAlign: "center", fontFamily: "Arial Black, Arial, sans-serif", fontSize: 44, lineHeight: 1.25, color: "#FFFFFF", textShadow: "0 4px 18px rgba(0,0,0,0.55)", padding: "18px 24px", borderRadius: 20, background: "rgba(17,24,39,0.35)" }}>
      {line}
    </div>
  );
};

const HookOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 10, 75, 95], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const scale = interpolate(frame, [0, 15], [0.95, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", top: 120, left: 50, right: 50, textAlign: "center", opacity, transform: `scale(${scale})` }}>
      <div style={{ fontFamily: "Arial Black, Arial, sans-serif", fontSize: 46, color: "#111827", textShadow: "0 3px 12px rgba(255,255,255,0.9)", background: "rgba(255,255,255,0.82)", borderRadius: 24, padding: "22px 20px", border: "3px solid #A78BFA" }}>
        7 desconhecidos viraram o BTS...
        <div style={{ fontSize: 30, marginTop: 10, color: "#374151", fontFamily: "Arial, sans-serif" }}>Curte, comenta e compartilha pra ver como!</div>
      </div>
    </div>
  );
};

const TitleCard: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [80, 100, 170, 200], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", top: 80, left: 0, right: 0, textAlign: "center", opacity }}>
      <div style={{ fontFamily: "Arial Black, Arial, sans-serif", fontSize: 54, color: "#1F2937", textShadow: "0 2px 10px rgba(255,255,255,0.8)" }}>COMO O BTS COMEÇOU?</div>
      <div style={{ fontFamily: "Arial, sans-serif", fontSize: 30, color: "#374151", marginTop: 8 }}>Curiosidade #1</div>
    </div>
  );
};

const NameLabels: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [120, 150, 900, 950], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", bottom: 270, left: 40, right: 40, display: "flex", justifyContent: "space-between", opacity }}>
      {MEMBERS.map(m => (
        <div key={m.id} style={{ width: 120, textAlign: "center", fontFamily: "Arial Black, Arial, sans-serif", fontSize: 24, color: "#111827", background: "rgba(255,255,255,0.75)", borderRadius: 12, padding: "6px 4px", border: `2px solid ${m.color}` }}>{m.name}</div>
      ))}
    </div>
  );
};

const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <>
      <ThreeCanvas width={width} height={height} frameloop="demand" dpr={1.0}
        shadows gl={{ antialias: false, alpha: false, powerPreference: "high-performance", toneMapping: THREE.NoToneMapping, outputColorSpace: THREE.SRGBColorSpace }}
        camera={{ fov: 46, position: [0, 3.2, 12.5], near: 0.1, far: 60 }}
        onCreated={({ gl }) => { gl.setClearColor(0xF3F6FB, 1); gl.shadowMap.enabled = true; gl.shadowMap.type = THREE.PCFSoftShadowMap; }}
      >
        <CameraRig frame={frame} />
        <color attach="background" args={["#F3F6FB"]} />
        <fog attach="fog" args={["#F3F6FB", 14, 40]} />
        <ambientLight intensity={0.75} />
        <directionalLight position={[4, 8, 6]} intensity={1.1} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
        <pointLight position={[-5, 4, 2]} intensity={0.8} color="#A78BFA" distance={18} />
        <pointLight position={[5, 4, 2]} intensity={0.8} color="#60A5FA" distance={18} />
        <StudioStage />
        {MEMBERS.map(m => <CharacterCard key={m.id} m={m} frame={frame} />)}
        <Effects />
      </ThreeCanvas>
      <HookOverlay />
      <TitleCard />
      <NameLabels />
      <Subtitle />
    </>
  );
};

export const BtsCuriosity1Debut: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#F3F6FB" }}>
    <Audio src={staticFile("bts-curiosity-1-debut/voice.wav")} />
    <Scene />
  </AbsoluteFill>
);
export default BtsCuriosity1Debut;
