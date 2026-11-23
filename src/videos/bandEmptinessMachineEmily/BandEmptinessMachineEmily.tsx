import React, { useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { InkPass, NOINK } from "../jimi3d/ink";
import { LensBlur } from "../jimi3d/lensblur";
import { GradeEffect, GRADES, GRADE_STRENGTH } from "../jimi3d/grade";
import { useSvgTexture } from "../../characters/base/useSvgTexture";
import { MaleBaseCharacter } from "../../characters/base/MaleBaseCharacter";
import { EMILY_ORIGINAL_V1 } from "../../characters/presets/emilyOriginalV1";
import { MIKE_ORIGINAL_V1 } from "../../characters/presets/mikeOriginalV1";
import { GUITARIST_ORIGINAL_V1 } from "../../characters/presets/guitaristOriginalV1";
import { BASSIST_ORIGINAL_V1 } from "../../characters/presets/bassistOriginalV1";
import { DJ_ORIGINAL_V1 } from "../../characters/presets/djOriginalV1";
import { DRUMMER_ORIGINAL_V1 } from "../../characters/presets/drummerOriginalV1";

export const BEME_FPS = 30;
export const BEME_BPM = 92;
export const BEME_BEAT_FRAMES = (60 / BEME_BPM) * BEME_FPS; // ~19.565
export const BEME_BAR_FRAMES = BEME_BEAT_FRAMES * 4;
// Starts at Emily verse 2 (~1:08 in song). 21 bars ~54.78s
export const BEME_BARS = 21;
export const BEME_FRAMES = Math.ceil(BEME_BARS * BEME_BAR_FRAMES);

const smooth = (t: number) => { const u = Math.max(0, Math.min(1, t)); return u * u * (3 - 2 * u); };
const makeBloom = () => new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.5, luminanceThreshold: 0.85, luminanceSmoothing: 0.25, mipmapBlur: true, levels: 5, radius: 0.65 });

const Box: React.FC<{ pos: [number, number, number]; args: [number, number, number]; color: string; rot?: [number, number, number] }> = ({ pos, args, color, rot = [0, 0, 0] }) => (
  <mesh position={pos} rotation={rot} castShadow receiveShadow><boxGeometry args={args} /><meshStandardMaterial color={color} roughness={0.9} metalness={0.05} /></mesh>
);
const Cyl: React.FC<{ pos: [number, number, number]; args: [number, number, number, number?]; color: string; rot?: [number, number, number] }> = ({ pos, args, color, rot = [0, 0, 0] }) => (
  <mesh position={pos} rotation={rot} castShadow receiveShadow><cylinderGeometry args={args} /><meshStandardMaterial color={color} roughness={0.8} metalness={0.1} /></mesh>
);
const Card: React.FC<{ tex: THREE.Texture | null; pos: [number, number, number]; scale?: number | [number, number, number]; rot?: [number, number, number]; opacity?: number }> = ({ tex, pos, scale = 1, rot = [0, 0, 0], opacity = 1 }) => {
  if (!tex) return null;
  return <mesh position={pos} rotation={rot} scale={scale as any} layers={NOINK}><planeGeometry args={[2.2, 3.3]} /><meshBasicMaterial map={tex} transparent alphaTest={0.05} side={THREE.DoubleSide} opacity={opacity} /></mesh>;
};
const PropCard: React.FC<{ file: string; pos: [number, number, number]; scale?: number | [number, number, number]; rot?: [number, number, number]; opacity?: number }> = ({ file, pos, scale = 1, rot = [0, 0, 0], opacity = 1 }) => {
  const tex = useMemo(() => { const t = new THREE.TextureLoader().load(staticFile(file)); t.colorSpace = THREE.SRGBColorSpace; return t; }, [file]);
  return <Card tex={tex} pos={pos} scale={scale} rot={rot} opacity={opacity} />;
};

type CharKind = "emily" | "mike" | "guitarist" | "bassist" | "dj" | "drummer";
const PRESETS: Record<CharKind, any> = { emily: EMILY_ORIGINAL_V1, mike: MIKE_ORIGINAL_V1, guitarist: GUITARIST_ORIGINAL_V1, bassist: BASSIST_ORIGINAL_V1, dj: DJ_ORIGINAL_V1, drummer: DRUMMER_ORIGINAL_V1 };
const PHASE: Record<CharKind, number> = { emily: 0, mike: 1.1, guitarist: 2.0, bassist: 2.8, dj: 3.6, drummer: 0.5 };

const CharacterCard: React.FC<{ kind: CharKind; pos: [number, number, number]; scale?: number; rot?: [number, number, number]; frame: number; energy?: number; sing?: boolean; face?: "front" | "left" | "right" }> = ({ kind, pos, scale = 1, rot = [0, 0, 0], frame, energy = 0.5, sing = false, face = "front" }) => {
  const beat = frame / BEME_BEAT_FRAMES;
  const phase = PHASE[kind] ?? 0;
  const step = beat * Math.PI * 2 + phase;
  const bob = Math.sin(step) * -1.0 * energy;
  const legSwing = Math.sin(step * (kind === "drummer" ? 1.5 : 1)) * (kind === "drummer" ? 4 : 1.8) * energy;
  const armSwing = Math.sin(step + Math.PI) * (kind === "drummer" ? 12 : 5 + 5 * energy);
  const eyeOpen = (frame + Math.round(phase * 10)) % 120 > 114 && (frame + Math.round(phase * 10)) % 120 < 119 ? 0.08 : 1;
  const mouthShape = sing ? (Math.sin(step * 1.8) > 0.1 ? "open" : "smile") : "neutral";
  const headY = bob * 0.35 + (sing ? Math.sin(step * 1.2) * 1.0 : Math.sin(step * 0.4) * 0.3);
  const headRotate = face === "left" ? -8 + Math.sin(step * 0.6) * 2 : face === "right" ? 8 + Math.sin(step * 0.6) * 2 : Math.sin(step * 0.4) * 2.5 * energy;
  const preset = PRESETS[kind];
  const tex = useSvgTexture(<MaleBaseCharacter width={512} height={768} {...preset} pose={{ bodyY: bob, headY, headRotate, armLeftRotate: armSwing, armRightRotate: -armSwing, legLeftRotate: legSwing, legRightRotate: -legSwing, eyeOpen, mouthShape }} />, [kind, Math.round(frame / 2), sing, face, Math.round(energy * 10)], 512, 768);
  return <Card tex={tex} pos={pos} scale={scale} rot={rot} />;
};

const Stage: React.FC = () => (
  <group>
    <Box pos={[0, -0.1, 0]} args={[18, 0.2, 10]} color="#1a1f2e" />
    <Box pos={[0, 1.6, -3.2]} args={[18, 3.4, 0.2]} color="#111827" />
    <Box pos={[-6.8, 1.6, -1.5]} args={[0.2, 3.4, 3.6]} color="#111827" />
    <Box pos={[6.8, 1.6, -1.5]} args={[0.2, 3.4, 3.6]} color="#111827" />
    <Cyl pos={[-5.5, 1.5, -2.8]} args={[0.08, 0.08, 3.0, 10]} color="#374151" />
    <Cyl pos={[5.5, 1.5, -2.8]} args={[0.08, 0.08, 3.0, 10]} color="#374151" />
    {[-4, -2, 0, 2, 4].map((x, i) => <mesh key={i} position={[x, 0.05, 2.2]}><circleGeometry args={[0.18, 16]} /><meshBasicMaterial color={i % 2 ? "#a78bfa" : "#22d3ee"} transparent opacity={0.7} /></mesh>)}
  </group>
);

const CameraRig: React.FC<{ frame: number }> = ({ frame }) => {
  const { camera } = useThree();
  const bar = frame / BEME_BAR_FRAMES;
  // Safe framing: generous distance/FOV, lookAt centered on heads to avoid cropping
  let cam = { x: 0, y: 3.1, z: 10.5, lx: 0, ly: 2.15, lz: 0, fov: 44 };
  if (bar < 4) {
    const p = smooth(bar / 4);
    cam = { x: -0.2 + p * 0.2, y: 3.0, z: 10.0, lx: -0.2, ly: 2.2, lz: 0.2, fov: 44 };
  } else if (bar < 8) {
    const p = smooth((bar - 4) / 4);
    cam = { x: -2.0 + p * 0.3, y: 3.0, z: 10.2, lx: -1.8, ly: 2.15, lz: -0.1, fov: 45 };
  } else if (bar < 12) {
    const p = smooth((bar - 8) / 4);
    cam = { x: 2.0 - p * 0.3, y: 3.0, z: 10.2, lx: 1.8, ly: 2.15, lz: -0.1, fov: 45 };
  } else if (bar < 16) {
    const p = smooth((bar - 12) / 4);
    cam = { x: 0.3 - p * 0.3, y: 3.0, z: 9.8, lx: 0, ly: 2.2, lz: 0.2, fov: 43 };
  } else {
    const p = smooth((bar - 16) / 5);
    cam = { x: 0, y: 3.4, z: 12.0 - p * 0.4, lx: 0, ly: 2.1, lz: -0.2, fov: 48 };
  }
  camera.position.set(cam.x, cam.y, cam.z);
  camera.lookAt(cam.lx, cam.ly, cam.lz);
  if ("fov" in camera) { (camera as THREE.PerspectiveCamera).fov = cam.fov; camera.updateProjectionMatrix(); }
  return null;
};

const Effects: React.FC = () => {
  const { scene, camera } = useThree();
  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera, { strength: 0.7, widthNear: 4.0, widthFar: 2.4 }),
    lens: new LensBlur({ maxCoC: 14, nearScale: 1.0 }),
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

const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const bar = frame / BEME_BAR_FRAMES;
  const beatPulse = 0.5 + 0.5 * Math.sin((frame / BEME_BEAT_FRAMES) * Math.PI * 2);
  const energy = bar < 2 ? 0.6 : 0.9;
  // Emily sings from start (video starts at her vocal entrance ~1:08)
  const emilySing = true;
  const mikeSing = bar >= 12 && bar < 16 ? false : false; // keep simple, Emily focus

  return (
    <>
      <ThreeCanvas width={width} height={height} frameloop="demand" dpr={1.0}
        shadows gl={{ antialias: false, alpha: false, powerPreference: "high-performance", toneMapping: THREE.NoToneMapping, outputColorSpace: THREE.SRGBColorSpace }}
        camera={{ fov: 42, position: [0, 3.0, 9.5], near: 0.1, far: 60 }}
        onCreated={({ gl }) => { gl.setClearColor(0x0a0e1a, 1); gl.shadowMap.enabled = true; gl.shadowMap.type = THREE.PCFSoftShadowMap; }}
      >
        <CameraRig frame={frame} />
        <color attach="background" args={["#0a0e1a"]} />
        <fog attach="fog" args={["#0a0e1a", 12, 35]} />
        <ambientLight intensity={0.45} />
        <directionalLight position={[4, 8, 6]} intensity={1.2} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
        <pointLight position={[0, 5, 2]} intensity={1.4 + beatPulse * 0.7} color="#a78bfa" distance={18} />
        <pointLight position={[-4, 4, 1]} intensity={1.0 + beatPulse * 0.4} color="#22d3ee" distance={14} />
        <pointLight position={[4, 4, 1]} intensity={1.0 + beatPulse * 0.4} color="#f472b6" distance={14} />

        <Stage />
        <PropCard file="reference/stage-svg-reference.svg" pos={[0, 2.3, -2.9]} scale={[3.2, 2.2, 1]} opacity={0.55} />

        {/* Instruments / amps */}
        <PropCard file="reference/drums-svg-reference.svg" pos={[1.2, 1.55, -0.7]} scale={0.60} />
        <PropCard file="reference/guitar-svg-reference.svg" pos={[-3.0, 1.35, 0.25]} scale={0.46} rot={[0, 0.15, -1.57]} />
        <PropCard file="reference/bass-svg-reference.svg" pos={[3.0, 1.35, 0.25]} scale={0.46} rot={[0, -0.15, 1.57]} />
        <PropCard file="reference/microphone-svg-reference.svg" pos={[-0.2, 1.55, 1.0]} scale={0.38} />
        <PropCard file="reference/keyboard-svg-reference.svg" pos={[-1.8, 1.2, -0.35]} scale={0.42} />
        <PropCard file="reference/dj-deck-svg-reference.svg" pos={[2.4, 1.25, -0.35]} scale={0.44} />
        <PropCard file="reference/amp-svg-reference.svg" pos={[-4.6, 1.0, -1.8]} scale={0.34} />
        <PropCard file="reference/amp-svg-reference.svg" pos={[4.6, 1.0, -1.8]} scale={0.34} />

        {/* Band - Emily front */}
        <CharacterCard kind="drummer" pos={[1.2, 2.15, -1.3]} scale={0.92} frame={frame} energy={energy} />
        <mesh position={[0.98, 2.35, -1.05]} rotation={[0.2, 0, 0.55]} castShadow><cylinderGeometry args={[0.018, 0.014, 0.55, 8]} /><meshStandardMaterial color="#D7C3A3" roughness={0.6} /></mesh>
        <mesh position={[1.42, 2.32, -1.05]} rotation={[0.2, 0, -0.55]} castShadow><cylinderGeometry args={[0.018, 0.014, 0.55, 8]} /><meshStandardMaterial color="#D7C3A3" roughness={0.6} /></mesh>
        <CharacterCard kind="emily" pos={[-0.2, 2.10, 0.7]} scale={1.06} frame={frame} energy={1} sing={emilySing} />
        <CharacterCard kind="mike" pos={[-1.8, 2.03, -0.85]} scale={0.96} frame={frame} energy={energy} sing={mikeSing} face="right" />
        <CharacterCard kind="guitarist" pos={[-3.0, 2.05, -0.05]} scale={0.98} frame={frame} energy={energy} face="right" />
        <CharacterCard kind="bassist" pos={[3.0, 2.05, -0.05]} scale={0.98} frame={frame} energy={energy} face="left" />
        <CharacterCard kind="dj" pos={[2.4, 2.02, -0.85]} scale={0.94} frame={frame} energy={energy * 0.8} face="left" />

        <Effects />
      </ThreeCanvas>

      <div style={{ position: "absolute", top: 70, left: 0, right: 0, textAlign: "center", fontFamily: "Arial Black, sans-serif", fontSize: 42, color: "#fff", textShadow: "0 4px 24px rgba(0,0,0,0.7)", letterSpacing: 2, opacity: interpolate(frame, [0, 15, 80, 110], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
        THE EMPTINESS MACHINE — EMILY
      </div>
      <div style={{ position: "absolute", bottom: 60, left: 0, right: 0, textAlign: "center", fontFamily: "Arial, sans-serif", fontSize: 26, color: "rgba(255,255,255,0.85)", textShadow: "0 2px 12px rgba(0,0,0,0.8)", opacity: interpolate(frame, [BEME_FRAMES - 90, BEME_FRAMES - 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
        92 BPM • 4/4 • 54.8s • Sync at Emily vocal (~1:08)
      </div>
    </>
  );
};

export const BandEmptinessMachineEmily: React.FC = () => <AbsoluteFill style={{ backgroundColor: "#0a0e1a" }}><Scene /></AbsoluteFill>;
export default BandEmptinessMachineEmily;
