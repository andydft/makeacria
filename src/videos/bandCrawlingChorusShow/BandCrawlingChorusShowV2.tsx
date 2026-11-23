import React, { useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { InkPass, noInkFallback, NOINK } from "../jimi3d/ink";
import { LensBlur } from "../jimi3d/lensblur";
import { GradeEffect, GRADES, GRADE_STRENGTH } from "../jimi3d/grade";
import { useSvgTexture } from "../../characters/base/useSvgTexture";
import { MaleBaseCharacter } from "../../characters/base/MaleBaseCharacter";
import { CHESTER_ORIGINAL_V1 } from "../../characters/presets/chesterOriginalV1";
import { MIKE_ORIGINAL_V1 } from "../../characters/presets/mikeOriginalV1";
import { GUITARIST_ORIGINAL_V1 } from "../../characters/presets/guitaristOriginalV1";
import { BASSIST_ORIGINAL_V1 } from "../../characters/presets/bassistOriginalV1";
import { DJ_ORIGINAL_V1 } from "../../characters/presets/djOriginalV1";
import { DRUMMER_ORIGINAL_V1 } from "../../characters/presets/drummerOriginalV1";

export const BCCS2_FPS = 30;
export const BCCS2_BPM = 105;
export const BCCS2_BEAT_FRAMES = (60 / BCCS2_BPM) * BCCS2_FPS;
export const BCCS2_BAR_FRAMES = BCCS2_BEAT_FRAMES * 4;
export const BCCS2_BARS = 17; // 38.857s
export const BCCS2_FRAMES = Math.ceil(BCCS2_BARS * BCCS2_BAR_FRAMES);

const smooth = (t: number) => { const u = Math.max(0, Math.min(1, t)); return u * u * (3 - 2 * u); };
const makeBloom = () => new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.55, luminanceThreshold: 0.84, luminanceSmoothing: 0.25, mipmapBlur: true, levels: 5, radius: 0.65 });

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

type CharKind = "chester" | "mike" | "guitarist" | "bassist" | "dj" | "drummer";
const PRESETS: Record<CharKind, any> = { chester: CHESTER_ORIGINAL_V1, mike: MIKE_ORIGINAL_V1, guitarist: GUITARIST_ORIGINAL_V1, bassist: BASSIST_ORIGINAL_V1, dj: DJ_ORIGINAL_V1, drummer: DRUMMER_ORIGINAL_V1 };

const PHASE: Record<CharKind, number> = { chester: 0, mike: 0.8, guitarist: 1.6, bassist: 2.4, dj: 3.2, drummer: 0.4 };
const CharacterCard: React.FC<{ kind: CharKind; pos: [number, number, number]; scale?: number; rot?: [number, number, number]; frame: number; energy?: number; sing?: boolean; face?: "front" | "left" | "right" }> = ({ kind, pos, scale = 1, rot = [0, 0, 0], frame, energy = 0.5, sing = false, face = "front" }) => {
  const beat = frame / BCCS2_BEAT_FRAMES;
  const phase = PHASE[kind] ?? 0;
  const step = beat * Math.PI * 2 + phase;
  const bob = Math.sin(step) * -1.2 * energy;
  const legSwing = Math.sin(step * (kind === "drummer" ? 1.5 : 1)) * (kind === "drummer" ? 4 : 2) * energy;
  const armSwing = Math.sin(step + Math.PI) * (kind === "drummer" ? 14 : 6 + 6 * energy);
  const eyeOpen = (frame + Math.round(phase * 10)) % 110 > 104 && (frame + Math.round(phase * 10)) % 110 < 109 ? 0.08 : 1;
  const mouthShape = sing ? (Math.sin(step * 2) > 0.15 ? "open" : "smile") : "neutral";
  const headY = bob * 0.35 + (sing ? Math.sin(step * 1.3) * 1.2 : Math.sin(step * 0.5) * 0.4);
  const headRotate = face === "left" ? -10 + Math.sin(step * 0.7) * 2 : face === "right" ? 10 + Math.sin(step * 0.7) * 2 : Math.sin(step * 0.5) * 3 * energy;
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
    {[-4, -2, 0, 2, 4].map((x, i) => <mesh key={i} position={[x, 0.05, 2.2]}><circleGeometry args={[0.18, 16]} /><meshBasicMaterial color={i % 2 ? "#60a5fa" : "#f472b6"} transparent opacity={0.7} /></mesh>)}
  </group>
);

const CameraRig: React.FC<{ frame: number }> = ({ frame }) => {
  const { camera } = useThree();
  const bar = frame / BCCS2_BAR_FRAMES;
  // Cuts: Chester+Mike, Guitarist, Drummer+Bassist, DJ, Wide all
  let cam = { x: 0, y: 2.9, z: 8.8, lx: 0, ly: 2.2, lz: 0, fov: 40 };
  if (bar < 3.5) {
    const p = smooth(bar / 3.5);
    cam = { x: -0.8 + p * 0.3, y: 2.7, z: 7.4, lx: -1.0, ly: 2.35, lz: 0.3, fov: 40 };
  } else if (bar < 7) {
    const p = smooth((bar - 3.5) / 3.5);
    cam = { x: -3.0 + p * 0.4, y: 2.7, z: 7.6, lx: -3.2, ly: 2.2, lz: 0.0, fov: 40 };
  } else if (bar < 10.5) {
    const p = smooth((bar - 7) / 3.5);
    cam = { x: 2.2 - p * 0.2, y: 2.6, z: 8.2, lx: 2.4, ly: 2.15, lz: -0.4, fov: 44 };
  } else if (bar < 14) {
    const p = smooth((bar - 10.5) / 3.5);
    cam = { x: 2.2 - p * 0.3, y: 2.7, z: 7.6, lx: 2.6, ly: 2.15, lz: -0.4, fov: 40 };
  } else {
    const p = smooth((bar - 14) / 3);
    cam = { x: 0, y: 3.3 + p * 0.3, z: 11.5 - p * 0.5, lx: 0, ly: 2.15, lz: -0.3, fov: 46 };
  }
  camera.position.set(cam.x, cam.y, cam.z);
  camera.lookAt(cam.lx, cam.ly, cam.lz);
  if ("fov" in camera) { (camera as THREE.PerspectiveCamera).fov = cam.fov; camera.updateProjectionMatrix(); }
  return null;
};

const Effects: React.FC = () => {
  const { scene, camera } = useThree();
  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera, { strength: 0.72, widthNear: 4.0, widthFar: 2.4 }),
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
  const bar = frame / BCCS2_BAR_FRAMES;
  const beatPulse = 0.5 + 0.5 * Math.sin((frame / BCCS2_BEAT_FRAMES) * Math.PI * 2);
  const energy = bar < 1 ? 0.6 : 1.0;
  const chesterSing = true; // starts on "Crawling..." scream

  return (
    <>
      <ThreeCanvas width={width} height={height} frameloop="demand" dpr={1.0}
        shadows gl={{ antialias: false, alpha: false, powerPreference: "high-performance", toneMapping: THREE.NoToneMapping, outputColorSpace: THREE.SRGBColorSpace }}
        camera={{ fov: 40, position: [0, 3.0, 9.0], near: 0.1, far: 60 }}
        onCreated={({ gl }) => { gl.setClearColor(0x0a0e1a, 1); gl.shadowMap.enabled = true; gl.shadowMap.type = THREE.PCFSoftShadowMap; }}
      >
        <CameraRig frame={frame} />
        <color attach="background" args={["#0a0e1a"]} />
        <fog attach="fog" args={["#0a0e1a", 12, 35]} />
        <ambientLight intensity={0.45} />
        <directionalLight position={[4, 8, 6]} intensity={1.2} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
        <pointLight position={[0, 5, 2]} intensity={1.5 + beatPulse * 0.8} color="#93c5fd" distance={18} />
        <pointLight position={[-4, 4, 1]} intensity={1.0 + beatPulse * 0.5} color="#f472b6" distance={14} />
        <pointLight position={[4, 4, 1]} intensity={1.0 + beatPulse * 0.5} color="#60a5fa" distance={14} />

        <Stage />
        <PropCard file="reference/stage-svg-reference.svg" pos={[0, 2.3, -2.9]} scale={[3.2, 2.2, 1]} opacity={0.55} />

        {/* Instruments / amps - all visible, instruments in front of players */}
        <PropCard file="reference/drums-svg-reference.svg" pos={[1.4, 1.55, -0.7]} scale={0.62} />
        <PropCard file="reference/guitar-svg-reference.svg" pos={[-3.2, 1.45, 0.25]} scale={0.46} rot={[0, 0.15, 0]} />
        <PropCard file="reference/bass-svg-reference.svg" pos={[3.4, 1.45, 0.25]} scale={0.46} rot={[0, -0.15, 0]} />
        <PropCard file="reference/microphone-svg-reference.svg" pos={[-0.6, 1.55, 1.05]} scale={0.38} />
        <PropCard file="reference/keyboard-svg-reference.svg" pos={[-1.8, 1.2, -0.35]} scale={0.44} />
        <PropCard file="reference/dj-deck-svg-reference.svg" pos={[2.6, 1.25, -0.35]} scale={0.45} />
        <PropCard file="reference/amp-svg-reference.svg" pos={[-4.8, 1.0, -1.8]} scale={0.36} />
        <PropCard file="reference/amp-svg-reference.svg" pos={[4.8, 1.0, -1.8]} scale={0.36} />
        <PropCard file="reference/amp-svg-reference.svg" pos={[-2.6, 0.95, -2.2]} scale={0.30} />

        {/* Band - no Emily; players behind their instruments */}
        <CharacterCard kind="drummer" pos={[1.4, 2.15, -1.3]} scale={0.92} frame={frame} energy={energy} />
        {/* Drumsticks */}
        <mesh position={[1.15, 2.35, -1.05]} rotation={[0.2, 0, 0.55]} castShadow><cylinderGeometry args={[0.018, 0.014, 0.55, 8]} /><meshStandardMaterial color="#D7C3A3" roughness={0.6} /></mesh>
        <mesh position={[1.62, 2.32, -1.05]} rotation={[0.2, 0, -0.55]} castShadow><cylinderGeometry args={[0.018, 0.014, 0.55, 8]} /><meshStandardMaterial color="#D7C3A3" roughness={0.6} /></mesh>
        <CharacterCard kind="chester" pos={[-0.6, 2.10, 0.75]} scale={1.08} frame={frame} energy={1} sing={chesterSing} />
        <CharacterCard kind="mike" pos={[-1.8, 2.03, -0.85]} scale={0.98} frame={frame} energy={energy} face="right" />
        <CharacterCard kind="guitarist" pos={[-3.2, 2.05, -0.05]} scale={1.0} frame={frame} energy={energy} face="right" />
        <CharacterCard kind="bassist" pos={[3.4, 2.05, -0.05]} scale={1.0} frame={frame} energy={energy} face="left" />
        <CharacterCard kind="dj" pos={[2.6, 2.02, -0.85]} scale={0.94} frame={frame} energy={energy * 0.8} face="left" />

        <Effects />
      </ThreeCanvas>

      <div style={{ position: "absolute", top: 70, left: 0, right: 0, textAlign: "center", fontFamily: "Arial Black, sans-serif", fontSize: 44, color: "#fff", textShadow: "0 4px 24px rgba(0,0,0,0.7)", letterSpacing: 2, opacity: interpolate(frame, [0, 15, 80, 110], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
        CRAWLING — CHORUS HIT
      </div>
      <div style={{ position: "absolute", bottom: 60, left: 0, right: 0, textAlign: "center", fontFamily: "Arial, sans-serif", fontSize: 28, color: "rgba(255,255,255,0.85)", textShadow: "0 2px 12px rgba(0,0,0,0.8)", opacity: interpolate(frame, [BCCS2_FRAMES - 90, BCCS2_FRAMES - 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
        105 BPM • 4/4 • 38.9s • Add your music
      </div>
    </>
  );
};

export const BandCrawlingChorusShowV2: React.FC = () => <AbsoluteFill style={{ backgroundColor: "#0a0e1a" }}><Scene /></AbsoluteFill>;
export default BandCrawlingChorusShowV2;
