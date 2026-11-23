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

export const FSAQ_FPS = 30;
export const FSAQ_FRAMES = 1200; // ~40s, final chorus/end clip

const smooth = (t: number) => { const u = Math.max(0, Math.min(1, t)); return u * u * (3 - 2 * u); };
const makeBloom = () => new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.45, luminanceThreshold: 0.85, luminanceSmoothing: 0.25, mipmapBlur: true, levels: 5, radius: 0.65 });

const Card: React.FC<{ tex: THREE.Texture | null; pos: [number, number, number]; scale?: number | [number, number, number]; rot?: [number, number, number]; opacity?: number }> = ({ tex, pos, scale = 1, rot = [0, 0, 0], opacity = 1 }) => {
  if (!tex) return null;
  return <mesh position={pos} rotation={rot} scale={scale as any} layers={NOINK}><planeGeometry args={[2.2, 3.3]} /><meshBasicMaterial map={tex} transparent alphaTest={0.05} side={THREE.DoubleSide} opacity={opacity} /></mesh>;
};
const PropCard: React.FC<{ file: string; pos: [number, number, number]; scale?: number | [number, number, number]; rot?: [number, number, number]; opacity?: number }> = ({ file, pos, scale = 1, rot = [0, 0, 0], opacity = 1 }) => {
  const tex = useMemo(() => { const t = new THREE.TextureLoader().load(staticFile(file)); t.colorSpace = THREE.SRGBColorSpace; return t; }, [file]);
  return <Card tex={tex} pos={pos} scale={scale} rot={rot} opacity={opacity} />;
};

const LucasCard: React.FC<{ frame: number }> = ({ frame }) => {
  const t = frame / FSAQ_FRAMES;
  const singCycle = Math.sin(frame * 0.18);
  const mouthShape: "neutral" | "open" | "smile" = singCycle > 0.25 ? "open" : singCycle > -0.2 ? "smile" : "neutral";
  // Close eyes in emotional moments
  const emotionalClose = (t > 0.18 && t < 0.32) || (t > 0.55 && t < 0.72) || (t > 0.85);
  const blink = frame % 120 > 114 && frame % 120 < 119 ? 0.08 : 1;
  const eyeOpen = emotionalClose ? 0.05 : blink;
  const bob = Math.sin(frame * 0.06) * 0.03;
  const tex = useSvgTexture(<LucasFresnoV1 width={512} height={768} eyeOpen={eyeOpen} mouthShape={mouthShape} />, ["lucas-fresno-aq", Math.round(frame / 2), eyeOpen < 0.5 ? 1 : 0, mouthShape], 512, 768);
  return <Card tex={tex} pos={[0, 2.05 + bob, 0.2]} scale={1.08} />;
};

const Stage: React.FC = () => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[20, 14]} />
      <meshStandardMaterial color="#151A22" roughness={0.92} />
    </mesh>
    <mesh position={[0, 2.2, -2.8]}>
      <planeGeometry args={[12, 6]} />
      <meshStandardMaterial color="#0D1518" roughness={0.95} />
    </mesh>
  </group>
);

const CameraRig: React.FC<{ frame: number }> = ({ frame }) => {
  const { camera } = useThree();
  const t = frame / FSAQ_FRAMES;
  let cam = { x: 0, y: 2.9, z: 7.8, lx: 0, ly: 2.35, lz: 0.2, fov: 38 };
  if (t < 0.25) { const p = smooth(t / 0.25); cam = { x: -0.3 + p * 0.6, y: 2.9, z: 8.2 - p * 0.4, lx: 0, ly: 2.35, lz: 0.2, fov: 40 }; }
  else if (t < 0.5) { const p = smooth((t - 0.25) / 0.25); cam = { x: 0.4 - p * 0.2, y: 2.85, z: 7.2, lx: 0, ly: 2.4, lz: 0.2, fov: 36 }; }
  else if (t < 0.75) { const p = smooth((t - 0.5) / 0.25); cam = { x: -0.2 + p * 0.4, y: 3.0, z: 8.5 - p * 0.5, lx: 0, ly: 2.3, lz: 0.2, fov: 39 }; }
  else { const p = smooth((t - 0.75) / 0.25); cam = { x: 0.1, y: 2.85, z: 7.0 - p * 0.3, lx: 0, ly: 2.4, lz: 0.2, fov: 35 }; }
  camera.position.set(cam.x, cam.y, cam.z);
  camera.lookAt(cam.lx, cam.ly, cam.lz);
  if ("fov" in camera) { (camera as THREE.PerspectiveCamera).fov = cam.fov; camera.updateProjectionMatrix(); }
  return null;
};

const Effects: React.FC = () => {
  const { scene, camera } = useThree();
  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera, { strength: 0.65, widthNear: 3.8, widthFar: 2.2 }),
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
  const beatPulse = 0.5 + 0.5 * Math.sin(frame * 0.12);
  return (
    <>
      <ThreeCanvas width={width} height={height} frameloop="demand" dpr={1.0}
        shadows gl={{ antialias: false, alpha: false, powerPreference: "high-performance", toneMapping: THREE.NoToneMapping, outputColorSpace: THREE.SRGBColorSpace }}
        camera={{ fov: 38, position: [0, 2.9, 7.8], near: 0.1, far: 60 }}
        onCreated={({ gl }) => { gl.setClearColor(0x0B1016, 1); gl.shadowMap.enabled = true; gl.shadowMap.type = THREE.PCFSoftShadowMap; }}
      >
        <CameraRig frame={frame} />
        <color attach="background" args={["#0B1016"]} />
        <fog attach="fog" args={["#0B1016", 10, 30]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[3, 8, 5]} intensity={1.0} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
        <pointLight position={[0, 5, 2]} intensity={1.3 + beatPulse * 0.5} color="#FFFFFF" distance={16} />
        <pointLight position={[-3, 4, 1]} intensity={0.8} color="#93C5FD" distance={12} />
        <pointLight position={[3, 4, 1]} intensity={0.8} color="#FCA5A5" distance={12} />

        <Stage />
        <PropCard file="reference/fresno-stage-svg-reference.svg" pos={[0, 2.5, -2.6]} scale={[3.0, 3.2, 1]} opacity={0.98} />
        <PropCard file="reference/microphone-svg-reference.svg" pos={[-0.15, 1.55, 0.55]} scale={0.4} />

        <LucasCard frame={frame} />
        <Effects />
      </ThreeCanvas>
      <div style={{ position: "absolute", top: 70, left: 0, right: 0, textAlign: "center", fontFamily: "Arial Black, sans-serif", fontSize: 40, color: "#fff", textShadow: "0 4px 24px rgba(0,0,0,0.7)", letterSpacing: 1, opacity: interpolate(frame, [0, 15, 80, 110], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
        FRESNO — ALGUÉM QUE TE FAZ SORRIR
      </div>
      <div style={{ position: "absolute", bottom: 60, left: 0, right: 0, textAlign: "center", fontFamily: "Arial, sans-serif", fontSize: 26, color: "rgba(255,255,255,0.85)", textShadow: "0 2px 12px rgba(0,0,0,0.8)", opacity: interpolate(frame, [FSAQ_FRAMES - 90, FSAQ_FRAMES - 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
        Final do refrão (~2:30) • 40s • Add your music
      </div>
    </>
  );
};

export const FresnoShowAlguemQueTeFazSorrir: React.FC = () => <AbsoluteFill style={{ backgroundColor: "#0B1016" }}><Scene /></AbsoluteFill>;
export default FresnoShowAlguemQueTeFazSorrir;
