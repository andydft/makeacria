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
import BobMarleyV1 from "../../characters/presets/BobMarleyV1";

export const BMSBS_FPS = 30;
export const BMSBS_FRAMES = 600; // 20s - intro only, silent for overlay

const smooth = (t: number) => { const u = Math.max(0, Math.min(1, t)); return u * u * (3 - 2 * u); };
const makeBloom = () => new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.5, luminanceThreshold: 0.82, luminanceSmoothing: 0.25, mipmapBlur: true, levels: 5, radius: 0.7 });

const Card: React.FC<{ tex: THREE.Texture | null; pos: [number, number, number]; scale?: number | [number, number, number] }> = ({ tex, pos, scale = 1 }) => {
  if (!tex) return null;
  return <mesh position={pos} scale={scale as any} layers={NOINK}><planeGeometry args={[2.2, 3.3]} /><meshBasicMaterial map={tex} transparent alphaTest={0.05} side={THREE.DoubleSide} /></mesh>;
};
const Box: React.FC<{ pos: [number, number, number]; args: [number, number, number]; color: string; rough?: number }> = ({ pos, args, color, rough = 0.85 }) => (
  <mesh position={pos} castShadow receiveShadow><boxGeometry args={args} /><meshStandardMaterial color={color} roughness={rough} metalness={0.05} /></mesh>
);
const PropCard: React.FC<{ file: string; pos: [number, number, number]; scale?: number | [number, number, number]; rot?: [number, number, number] }> = ({ file, pos, scale = 1, rot = [0, 0, 0] }) => {
  const tex = useMemo(() => { const t = new THREE.TextureLoader().load(staticFile(file)); t.colorSpace = THREE.SRGBColorSpace; return t; }, [file]);
  return <Card tex={tex} pos={pos} scale={scale} rot={rot} />;
};

const BobCard: React.FC<{ frame: number }> = ({ frame }) => {
  const beat = frame / 13.846; // ~130bpm feel
  const bob = Math.sin(beat * Math.PI * 2) * 0.03;
  const singCycle = Math.sin(frame * 0.18);
  const mouthShape: "neutral" | "open" | "smile" = singCycle > 0.1 ? "open" : "smile";
  const nearEnd = frame > BMSBS_FRAMES - 60;
  const blink = !nearEnd && frame % 120 > 114 ? 0.08 : 1;
  const tex = useSvgTexture(<BobMarleyV1 width={512} height={768} eyeOpen={blink} mouthShape={mouthShape} pose="stand" />, ["bob-buffalo", Math.round(frame / 2), mouthShape, blink < 0.5 ? 1 : 0], 512, 768);
  return <Card tex={tex} pos={[0, 1.72 + bob, 0.2]} scale={1.05} />;
};

const Stage: React.FC = () => {
  const backdropTex = useMemo(() => {
    const c = document.createElement("canvas"); c.width = 1024; c.height = 512; const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#111827"; ctx.fillRect(0,0,1024,512);
    ctx.fillStyle = "#1B8A3A"; ctx.fillRect(0, 420, 1024, 30);
    ctx.fillStyle = "#F2C200"; ctx.fillRect(0, 450, 1024, 30);
    ctx.fillStyle = "#C62828"; ctx.fillRect(0, 480, 1024, 32);
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = "900 120px Arial Black, Arial"; ctx.fillStyle = "rgba(242,194,0,0.95)"; ctx.fillText("BOB MARLEY", 512, 170);
    ctx.font = "bold 56px Arial"; ctx.fillStyle = "rgba(255,255,255,0.75)"; ctx.fillText("BUFFALO SOLDIER", 512, 280);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true; return t;
  }, []);
  return <group>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,0,0]} receiveShadow><planeGeometry args={[24,16]} /><meshStandardMaterial color="#1F2937" roughness={0.92} /></mesh>
    <Box pos={[0,3.0,-3.2]} args={[20,7,0.3]} color="#111827" />
    <mesh position={[0,3.1,-3.03]}><planeGeometry args={[14,4.5]} /><meshBasicMaterial map={backdropTex} /></mesh>
    <Box pos={[-6.5,2.2,-2.4]} args={[0.6,4.8,2]} color="#222B36" />
    <Box pos={[6.5,2.2,-2.4]} args={[0.6,4.8,2]} color="#222B36" />
    <Box pos={[-4.8,0.9,-1.5]} args={[1.3,1.8,0.8]} color="#2B313B" />
    <Box pos={[4.8,0.9,-1.5]} args={[1.3,1.8,0.8]} color="#2B313B" />
    {/* rasta lights */}
    {[-3,-1.5,0,1.5,3].map((x,i)=><pointLight key={i} position={[x,4.8,-1.5]} intensity={1.2} color={i%3===0?"#C62828":i%3===1?"#F2C200":"#1B8A3A"} distance={10} />)}
  </group>;
};

const CameraRig: React.FC<{ frame: number }> = ({ frame }) => {
  const { camera } = useThree();
  const t = frame / BMSBS_FRAMES;
  let cam = { x: 0, y: 2.9, z: 8.5, lx: 0, ly: 2.2, lz: 0.2, fov: 40 };
  if (t < 0.15) { const p=smooth(t/0.15); cam={x:-0.6+p*0.4,y:2.9,z:9.0-p*0.4,lx:0,ly:2.2,lz:0.2,fov:42}; }
  else if (t < 0.28) { cam={x:0.15,y:2.55,z:6.8,lx:0,ly:2.45,lz:0.25,fov:34}; } // face close
  else if (t < 0.40) { cam={x:0.7,y:2.2,z:7.0,lx:0.35,ly:1.55,lz:0.45,fov:38}; } // guitar close
  else if (t < 0.55) { const p=smooth((t-0.40)/0.15); cam={x:0.8-p*1.6,y:2.9,z:8.8,lx:0,ly:2.2,lz:0.15,fov:40}; }
  else if (t < 0.68) { cam={x:-0.1,y:2.55,z:6.7,lx:0,ly:2.45,lz:0.25,fov:34}; } // face close
  else if (t < 0.80) { cam={x:-0.5,y:2.25,z:7.2,lx:0.25,ly:1.6,lz:0.45,fov:38}; } // guitar/body
  else { const p=smooth((t-0.80)/0.20); cam={x:0,y:3.1,z:9.8-p*0.6,lx:0,ly:2.15,lz:0.15,fov:44}; }
  camera.position.set(cam.x,cam.y,cam.z); camera.lookAt(cam.lx,cam.ly,cam.lz);
  if ("fov" in camera) { (camera as THREE.PerspectiveCamera).fov = cam.fov; camera.updateProjectionMatrix(); }
  return null;
};

const Effects: React.FC = () => {
  const { scene, camera } = useThree();
  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera, { strength: 0.6, widthNear: 3.8, widthFar: 2.2 }),
    lens: new LensBlur({ maxCoC: 12, nearScale: 0.9 }),
    bloom: makeBloom(),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(GRADES.day, GRADE_STRENGTH.day),
  }), [scene, camera]);
  return <EffectComposer multisampling={0} frameBufferType={THREE.HalfFloatType} renderPriority={1}>
    <primitive object={fx.ink} dispose={null} /><primitive object={fx.lens.pre} dispose={null} /><primitive object={fx.lens.main} dispose={null} />
    <primitive object={fx.bloom} dispose={null} /><primitive object={fx.tone} dispose={null} /><primitive object={fx.grade} dispose={null} />
  </EffectComposer>;
};

const Scene: React.FC = () => {
  const frame = useCurrentFrame(); const { width, height } = useVideoConfig();
  return <>
    <ThreeCanvas width={width} height={height} frameloop="demand" dpr={1.0}
      shadows gl={{ antialias: false, alpha: false, powerPreference: "high-performance", toneMapping: THREE.NoToneMapping, outputColorSpace: THREE.SRGBColorSpace }}
      camera={{ fov: 40, position: [0, 2.9, 8.5], near: 0.1, far: 60 }}
      onCreated={({ gl }) => { gl.setClearColor(0x0B1016, 1); gl.shadowMap.enabled = true; gl.shadowMap.type = THREE.PCFSoftShadowMap; }}>
      <CameraRig frame={frame} /><color attach="background" args={["#0B1016"]} /><fog attach="fog" args={["#0B1016", 10, 30]} />
      <ambientLight intensity={0.5} /><directionalLight position={[3,8,5]} intensity={1.0} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <Stage />
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,0.02,0.25]} layers={NOINK}><circleGeometry args={[0.55,32]} /><meshBasicMaterial color="#000000" transparent opacity={0.18} /></mesh>
      <BobCard frame={frame} />
      <PropCard file="reference/guitar-svg-reference.svg" pos={[0.45, 1.35, 0.55]} scale={0.46} rot={[0, 0, -0.12]} />
      <Effects />
    </ThreeCanvas>
    <div style={{ position: "absolute", top: 70, left: 0, right: 0, textAlign: "center", fontFamily: "Arial Black, sans-serif", fontSize: 42, color: "#fff", textShadow: "0 4px 24px rgba(0,0,0,0.7)", opacity: interpolate(frame, [0,15,90,120], [0,1,1,0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
      BOB MARLEY — BUFFALO SOLDIER
    </div>
    <div style={{ position: "absolute", bottom: 60, left: 0, right: 0, textAlign: "center", fontFamily: "Arial, sans-serif", fontSize: 26, color: "rgba(255,255,255,0.85)", textShadow: "0 2px 12px rgba(0,0,0,0.8)", opacity: interpolate(frame, [BMSBS_FRAMES-60, BMSBS_FRAMES-30], [0,1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
      Intro • 20s • Add your music
    </div>
  </>;
};

export const BobMarleyShowBuffaloSoldier: React.FC = () => <AbsoluteFill style={{ backgroundColor: "#0B1016" }}><Scene /></AbsoluteFill>;
export default BobMarleyShowBuffaloSoldier;
