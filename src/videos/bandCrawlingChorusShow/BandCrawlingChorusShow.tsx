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
import { EMILY_ORIGINAL_V1 } from "../../characters/presets/emilyOriginalV1";
import { GUITARIST_ORIGINAL_V1 } from "../../characters/presets/guitaristOriginalV1";
import { BASSIST_ORIGINAL_V1 } from "../../characters/presets/bassistOriginalV1";
import { DJ_ORIGINAL_V1 } from "../../characters/presets/djOriginalV1";
import { DRUMMER_ORIGINAL_V1 } from "../../characters/presets/drummerOriginalV1";

export const BCCS_FPS = 30;
export const BCCS_BPM = 105;
export const BCCS_BEAT_FRAMES = (60 / BCCS_BPM) * BCCS_FPS; // ~17.142857
export const BCCS_BAR_FRAMES = BCCS_BEAT_FRAMES * 4; // ~68.571
// 17 bars @105BPM = 38.857s, under 40s
export const BCCS_BARS = 17;
export const BCCS_FRAMES = Math.ceil(BCCS_BARS * BCCS_BAR_FRAMES); // 1166

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (t: number) => { const u = clamp01(t); return u * u * (3 - 2 * u); };
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
  const tex = useMemo(() => {
    const t = new THREE.TextureLoader().load(staticFile(file));
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [file]);
  return <Card tex={tex} pos={pos} scale={scale} rot={rot} opacity={opacity} />;
};

type CharKind = "chester" | "mike" | "emily" | "guitarist" | "bassist" | "dj" | "drummer";
const PRESETS: Record<CharKind, any> = {
  chester: CHESTER_ORIGINAL_V1,
  mike: MIKE_ORIGINAL_V1,
  emily: EMILY_ORIGINAL_V1,
  guitarist: GUITARIST_ORIGINAL_V1,
  bassist: BASSIST_ORIGINAL_V1,
  dj: DJ_ORIGINAL_V1,
  drummer: DRUMMER_ORIGINAL_V1,
};

const CharacterCard: React.FC<{
  kind: CharKind; pos: [number, number, number]; scale?: number; rot?: [number, number, number]; frame: number;
  energy?: number; sing?: boolean; walk?: boolean; face?: "front" | "left" | "right";
}> = ({ kind, pos, scale = 1, rot = [0, 0, 0], frame, energy = 0.5, sing = false, walk = false, face = "front" }) => {
  const beat = frame / BCCS_BEAT_FRAMES;
  const step = beat * Math.PI * 2;
  const bob = (walk ? Math.abs(Math.sin(step)) * -4 : Math.sin(step) * -1.5) * energy;
  const legSwing = walk ? Math.sin(step) * 12 : Math.sin(step) * 2 * energy;
  const armSwing = walk ? Math.sin(step + Math.PI) * 14 : Math.sin(step + Math.PI) * (6 + 10 * energy);
  const eyeOpen = frame % 110 > 104 && frame % 110 < 109 ? 0.08 : 1;
  // Mouth opens only for singing/talking moments - controlled by sing flag
  const mouthShape = sing ? (Math.sin(step * 2) > 0.2 ? "open" : "smile") : "neutral";
  const headY = bob * 0.35 + (sing ? Math.sin(step) * 1.2 : 0);
  const headRotate = face === "left" ? -12 : face === "right" ? 12 : Math.sin(step * 0.5) * 2 * energy;
  const preset = PRESETS[kind];
  const tex = useSvgTexture(
    <MaleBaseCharacter width={512} height={768} {...preset} pose={{ bodyY: bob, headY, headRotate, armLeftRotate: armSwing, armRightRotate: -armSwing, legLeftRotate: legSwing, legRightRotate: -legSwing, eyeOpen, mouthShape }} />,
    [kind, Math.round(frame / 2), sing, walk, face, Math.round(energy * 10)],
    512, 768,
  );
  return <Card tex={tex} pos={pos} scale={scale} rot={rot} />;
};

const Stage: React.FC = () => (
  <group>
    <Box pos={[0, -0.1, 0]} args={[18, 0.2, 10]} color="#1a1f2e" />
    <Box pos={[0, 1.6, -3.2]} args={[18, 3.4, 0.2]} color="#111827" />
    <Box pos={[-6.8, 1.6, -1.5]} args={[0.2, 3.4, 3.6]} color="#111827" />
    <Box pos={[6.8, 1.6, -1.5]} args={[0.2, 3.4, 3.6]} color="#111827" />
    <Box pos={[0, 3.25, -1.5]} args={[14, 0.12, 3.8]} color="#0f172a" />
    <Cyl pos={[-5.5, 1.5, -2.8]} args={[0.08, 0.08, 3.0, 10]} color="#374151" />
    <Cyl pos={[5.5, 1.5, -2.8]} args={[0.08, 0.08, 3.0, 10]} color="#374151" />
    <Cyl pos={[-2.5, 1.5, -2.8]} args={[0.08, 0.08, 3.0, 10]} color="#374151" />
    <Cyl pos={[2.5, 1.5, -2.8]} args={[0.08, 0.08, 3.0, 10]} color="#374151" />
    {/* floor lights */}
    {[-4, -2, 0, 2, 4].map((x, i) => <mesh key={i} position={[x, 0.05, 2.2]}><circleGeometry args={[0.18, 16]} /><meshBasicMaterial color={i % 2 ? "#60a5fa" : "#f472b6"} transparent opacity={0.7} /></mesh>)}
  </group>
);

const CrowdSilhouettes: React.FC = () => (
  <group position={[0, 0, 4.2]}>
    {Array.from({ length: 18 }).map((_, i) => {
      const x = -7 + i * 0.82;
      const h = 0.9 + (i % 3) * 0.12;
      return <Box key={i} pos={[x, h / 2, (i % 2) * 0.15]} args={[0.5, h, 0.3]} color="#0b1020" />;
    })}
  </group>
);

const CameraRig: React.FC<{ frame: number }> = ({ frame }) => {
  const { camera } = useThree();
  const bar = frame / BCCS_BAR_FRAMES;
  // bar 0-1: wide intro, bar 1-5: push to Chester, bar 5-9: wide band, bar 9-13: Chester+band, bar 13-17: epic wide
  let cam = { x: 0, y: 3.0, z: 10.5, lx: 0, ly: 2.2, lz: 0, fov: 42 };
  if (bar < 1) {
    const p = smooth(bar);
    cam = { x: -1.5 + p * 1.5, y: 3.4, z: 11.5 - p * 0.5, lx: 0, ly: 2.1, lz: -0.5, fov: 44 };
  } else if (bar < 5) {
    const p = smooth((bar - 1) / 4);
    cam = { x: 0.8 - p * 0.6, y: 2.9 - p * 0.2, z: 10.2 - p * 3.2, lx: 0, ly: 2.3, lz: 0.2, fov: 40 - p * 4 };
  } else if (bar < 9) {
    const p = smooth((bar - 5) / 4);
    cam = { x: -2.5 + p * 5, y: 3.1, z: 9.5 + p * 0.8, lx: 0, ly: 2.1, lz: -0.3, fov: 42 };
  } else if (bar < 13) {
    const p = smooth((bar - 9) / 4);
    cam = { x: 2.2 - p * 2.0, y: 2.8, z: 8.8 - p * 1.2, lx: 0.2 - p * 0.2, ly: 2.3, lz: 0.2, fov: 38 };
  } else {
    const p = smooth((bar - 13) / 4);
    cam = { x: 0, y: 3.2 + p * 0.4, z: 8.5 + p * 2.5, lx: 0, ly: 2.2, lz: -0.4, fov: 40 + p * 4 };
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
    grade: new GradeEffect(GRADES.night ?? GRADES.day, GRADE_STRENGTH.night ?? GRADE_STRENGTH.day),
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
  const bar = frame / BCCS_BAR_FRAMES;
  const beatPulse = 0.5 + 0.5 * Math.sin((frame / BCCS_BEAT_FRAMES) * Math.PI * 2);
  const energy = bar < 1 ? 0.4 : bar < 9 ? 0.8 : 1.0;
  const chesterSing = bar >= 1; // mouth animated only when sing=true

  return (
    <>
      <ThreeCanvas width={width} height={height} frameloop="demand" dpr={1.0}
        shadows
        gl={{ antialias: false, alpha: false, powerPreference: "high-performance", toneMapping: THREE.NoToneMapping, outputColorSpace: THREE.SRGBColorSpace }}
        camera={{ fov: 42, position: [0, 3.2, 10.5], near: 0.1, far: 60 }}
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
        <CrowdSilhouettes />

        <PropCard file="reference/stage-svg-reference.svg" pos={[0, 2.3, -2.9]} scale={[3.2, 2.2, 1]} opacity={0.55} />
        <PropCard file="reference/drums-svg-reference.svg" pos={[0, 1.55, -1.2]} scale={0.62} />
        <PropCard file="reference/guitar-svg-reference.svg" pos={[-3.8, 1.55, -0.2]} scale={0.46} rot={[0, 0.15, 0]} />
        <PropCard file="reference/bass-svg-reference.svg" pos={[3.8, 1.55, -0.2]} scale={0.46} rot={[0, -0.15, 0]} />
        <PropCard file="reference/microphone-svg-reference.svg" pos={[0.0, 1.55, 0.9]} scale={0.38} />
        <PropCard file="reference/keyboard-svg-reference.svg" pos={[2.3, 1.2, -0.9]} scale={0.42} />
        <PropCard file="reference/amp-svg-reference.svg" pos={[-5.2, 1.0, -1.8]} scale={0.35} />
        <PropCard file="reference/amp-svg-reference.svg" pos={[5.2, 1.0, -1.8]} scale={0.35} />

        <CharacterCard kind="drummer" pos={[0, 2.15, -1.0]} scale={0.92} frame={frame} energy={energy} />
        <CharacterCard kind="chester" pos={[0, 2.10, 0.85]} scale={1.08} frame={frame} energy={1} sing={chesterSing} />
        <CharacterCard kind="mike" pos={[-1.45, 2.05, 0.45]} scale={0.98} frame={frame} energy={energy} face="right" />
        <CharacterCard kind="guitarist" pos={[-3.6, 2.05, 0.1]} scale={0.98} frame={frame} energy={energy} face="right" />
        <CharacterCard kind="bassist" pos={[3.6, 2.05, 0.1]} scale={0.98} frame={frame} energy={energy} face="left" />
        <CharacterCard kind="dj" pos={[2.2, 2.02, -0.5]} scale={0.94} frame={frame} energy={energy * 0.8} face="left" />
        <CharacterCard kind="emily" pos={[1.45, 2.03, 0.45]} scale={0.96} frame={frame} energy={energy} face="left" />

        <Effects />
      </ThreeCanvas>

      {/* Title overlay */}
      <div style={{ position: "absolute", top: 70, left: 0, right: 0, textAlign: "center", fontFamily: "Arial Black, sans-serif", fontSize: 44, color: "#fff", textShadow: "0 4px 24px rgba(0,0,0,0.7)", letterSpacing: 2, opacity: interpolate(frame, [0, 20, 90, 120], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
        CRAWLING — CHORUS SHOW
      </div>
      <div style={{ position: "absolute", bottom: 60, left: 0, right: 0, textAlign: "center", fontFamily: "Arial, sans-serif", fontSize: 28, color: "rgba(255,255,255,0.85)", textShadow: "0 2px 12px rgba(0,0,0,0.8)", opacity: interpolate(frame, [BCCS_FRAMES - 90, BCCS_FRAMES - 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
        105 BPM • 4/4 • 38.9s • Add your music
      </div>
    </>
  );
};

export const BandCrawlingChorusShow: React.FC = () => {
  return <AbsoluteFill style={{ backgroundColor: "#0a0e1a" }}><Scene /></AbsoluteFill>;
};
export default BandCrawlingChorusShow;
