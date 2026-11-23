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
import LucasFresnoV1 from "../../characters/presets/LucasFresnoV1";
import TavaresFresnoV1 from "../../characters/presets/TavaresFresnoV1";
import DrummerFresnoV1 from "../../characters/presets/DrummerFresnoV1";

export const FSDQ_FPS = 30;
export const FSDQ_BPM = 130;
export const FSDQ_BEAT_FRAMES = (60 / FSDQ_BPM) * FSDQ_FPS;
export const FSDQ_BAR_FRAMES = FSDQ_BEAT_FRAMES * 4;
export const FSDQ_BARS = 24;
export const FSDQ_FRAMES = Math.ceil(FSDQ_BARS * FSDQ_BAR_FRAMES); // ~44.3s

const smooth = (t: number) => { const u = Math.max(0, Math.min(1, t)); return u * u * (3 - 2 * u); };
const makeBloom = () => new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.5, luminanceThreshold: 0.84, luminanceSmoothing: 0.25, mipmapBlur: true, levels: 5, radius: 0.65 });

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

const CharacterCard: React.FC<{ kind: "lucas" | "tavares" | "drummer"; pos: [number, number, number]; scale?: number; frame: number; energy?: number; sing?: boolean }> = ({ kind, pos, scale = 1, frame, energy = 0.6, sing = false }) => {
  const beat = frame / FSDQ_BEAT_FRAMES;
  const phase = kind === "lucas" ? 0 : kind === "tavares" ? 1.8 : 0.7;
  const bob = Math.sin(beat * Math.PI * 2 + phase) * -0.06 * energy;
  const sway = Math.sin(beat * Math.PI * 2 + phase) * 0.03 * energy;
  const Comp = kind === "lucas" ? LucasFresnoV1 : kind === "tavares" ? TavaresFresnoV1 : DrummerFresnoV1;
  const tex = useSvgTexture(<Comp width={512} height={768} />, [kind, "fresno-v1"], 512, 768);
  return <Card tex={tex} pos={[pos[0] + sway, pos[1] + bob, pos[2]]} scale={scale} />;
};

const Stage: React.FC = () => (
  <group>
    <Box pos={[0, -0.1, 0]} args={[16, 0.2, 9]} color="#141824" />
    <Box pos={[0, 1.7, -3.0]} args={[16, 3.6, 0.2]} color="#0F1420" />
    <Box pos={[-6.2, 1.7, -1.4]} args={[0.2, 3.6, 3.4]} color="#0F1420" />
    <Box pos={[6.2, 1.7, -1.4]} args={[0.2, 3.6, 3.4]} color="#0F1420" />
    <Cyl pos={[-4.8, 1.5, -2.7]} args={[0.08, 0.08, 3.0, 10]} color="#374151" />
    <Cyl pos={[4.8, 1.5, -2.7]} args={[0.08, 0.08, 3.0, 10]} color="#374151" />
    {[-3, -1, 1, 3].map((x, i) => <mesh key={i} position={[x, 0.04, 2.0]}><circleGeometry args={[0.16, 16]} /><meshBasicMaterial color={i % 2 ? "#F97316" : "#EF4444"} transparent opacity={0.6} /></mesh>)}
  </group>
);

const CameraRig: React.FC<{ frame: number }> = ({ frame }) => {
  const { camera } = useThree();
  const bar = frame / FSDQ_BAR_FRAMES;
  let cam = { x: 0, y: 2.9, z: 9.5, lx: 0, ly: 2.2, lz: 0, fov: 42 };
  if (bar < 6) { const p = smooth(bar / 6); cam = { x: -1.2 + p * 0.4, y: 2.9, z: 9.2, lx: -0.8, ly: 2.2, lz: 0.1, fov: 44 }; }
  else if (bar < 12) { const p = smooth((bar - 6) / 6); cam = { x: 1.2 - p * 0.4, y: 2.9, z: 9.2, lx: 0.8, ly: 2.2, lz: 0.1, fov: 44 }; }
  else if (bar < 18) { const p = smooth((bar - 12) / 6); cam = { x: 0, y: 3.0, z: 9.8, lx: 0, ly: 2.2, lz: -0.2, fov: 45 }; }
  else { const p = smooth((bar - 18) / 6); cam = { x: 0, y: 3.4, z: 11.5 - p * 0.5, lx: 0, ly: 2.15, lz: -0.2, fov: 48 }; }
  camera.position.set(cam.x, cam.y, cam.z);
  camera.lookAt(cam.lx, cam.ly, cam.lz);
  if ("fov" in camera) { (camera as THREE.PerspectiveCamera).fov = cam.fov; camera.updateProjectionMatrix(); }
  return null;
};

const Effects: React.FC = () => {
  const { scene, camera } = useThree();
  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera, { strength: 0.7, widthNear: 4.0, widthFar: 2.4 }),
    lens: new LensBlur({ maxCoC: 12, nearScale: 1.0 }),
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
  const beatPulse = 0.5 + 0.5 * Math.sin((frame / FSDQ_BEAT_FRAMES) * Math.PI * 2);
  const energy = 0.8;

  return (
    <>
      <ThreeCanvas width={width} height={height} frameloop="demand" dpr={1.0}
        shadows gl={{ antialias: false, alpha: false, powerPreference: "high-performance", toneMapping: THREE.NoToneMapping, outputColorSpace: THREE.SRGBColorSpace }}
        camera={{ fov: 42, position: [0, 3.0, 9.5], near: 0.1, far: 60 }}
        onCreated={({ gl }) => { gl.setClearColor(0x0B0F1A, 1); gl.shadowMap.enabled = true; gl.shadowMap.type = THREE.PCFSoftShadowMap; }}
      >
        <CameraRig frame={frame} />
        <color attach="background" args={["#0B0F1A"]} />
        <fog attach="fog" args={["#0B0F1A", 12, 35]} />
        <ambientLight intensity={0.45} />
        <directionalLight position={[4, 8, 6]} intensity={1.1} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
        <pointLight position={[0, 5, 2]} intensity={1.4 + beatPulse * 0.7} color="#FB7185" distance={18} />
        <pointLight position={[-4, 4, 1]} intensity={1.0 + beatPulse * 0.4} color="#F97316" distance={14} />
        <pointLight position={[4, 4, 1]} intensity={1.0 + beatPulse * 0.4} color="#EF4444" distance={14} />

        <Stage />
        <PropCard file="reference/fresno-stage-svg-reference.svg" pos={[0, 2.5, -2.7]} scale={[3.0, 3.2, 1]} opacity={0.95} />

        {/* Instruments / amps */}
        <PropCard file="reference/drums-svg-reference.svg" pos={[0, 1.55, -0.8]} scale={0.62} />
        <PropCard file="reference/guitar-svg-reference.svg" pos={[-2.4, 1.35, 0.55]} scale={0.48} rot={[0, 0.15, -1.57]} />
        <PropCard file="reference/bass-svg-reference.svg" pos={[2.4, 1.35, 0.55]} scale={0.48} rot={[0, -0.15, 1.57]} />
        <PropCard file="reference/microphone-svg-reference.svg" pos={[-2.2, 1.55, 0.95]} scale={0.38} />
        <PropCard file="reference/amp-svg-reference.svg" pos={[-4.6, 1.0, -1.8]} scale={0.36} />
        <PropCard file="reference/amp-svg-reference.svg" pos={[4.6, 1.0, -1.8]} scale={0.36} />

        {/* Band */}
        <CharacterCard kind="drummer" pos={[0, 2.15, -1.4]} scale={0.92} frame={frame} energy={energy} />
        <CharacterCard kind="lucas" pos={[-2.4, 2.10, 0.2]} scale={1.05} frame={frame} energy={1} sing />
        <CharacterCard kind="tavares" pos={[2.4, 2.05, 0.2]} scale={1.0} frame={frame} energy={energy} />

        <Effects />
      </ThreeCanvas>

      <div style={{ position: "absolute", top: 70, left: 0, right: 0, textAlign: "center", fontFamily: "Arial Black, sans-serif", fontSize: 42, color: "#fff", textShadow: "0 4px 24px rgba(0,0,0,0.7)", letterSpacing: 2, opacity: interpolate(frame, [0, 15, 80, 110], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
        FRESNO — DESDE QUANDO VOCÊ SE FOI
      </div>
      <div style={{ position: "absolute", bottom: 60, left: 0, right: 0, textAlign: "center", fontFamily: "Arial, sans-serif", fontSize: 26, color: "rgba(255,255,255,0.85)", textShadow: "0 2px 12px rgba(0,0,0,0.8)", opacity: interpolate(frame, [FSDQ_FRAMES - 90, FSDQ_FRAMES - 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
        130 BPM • 4/4 • 44.3s • Add your music
      </div>
    </>
  );
};

export const FresnoShowDesdeQuando: React.FC = () => <AbsoluteFill style={{ backgroundColor: "#0B0F1A" }}><Scene /></AbsoluteFill>;
export default FresnoShowDesdeQuando;
