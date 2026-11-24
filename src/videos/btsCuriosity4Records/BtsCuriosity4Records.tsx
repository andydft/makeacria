import React, { useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
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
import wordsData from "../../../public/bts-curiosity-4-records/words.json";

export const BCD4_FPS = 30;
export const BCD4_FRAMES = 1140;

const smooth = (t: number) => { const u = Math.max(0, Math.min(1, t)); return u * u * (3 - 2 * u); };
const makeBloom = () => new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.55, luminanceThreshold: 0.84, luminanceSmoothing: 0.25, mipmapBlur: true, levels: 5, radius: 0.65 });

const Box: React.FC<{ pos: [number, number, number]; args: [number, number, number]; color: string }> = ({ pos, args, color }) => (
  <mesh position={pos} castShadow receiveShadow><boxGeometry args={args} /><meshStandardMaterial color={color} roughness={0.85} metalness={0.05} /></mesh>
);
const Card: React.FC<{ tex: THREE.Texture | null; pos: [number, number, number]; scale?: number | [number, number, number] }> = ({ tex, pos, scale = 1 }) => {
  if (!tex) return null;
  return <mesh position={pos} scale={scale as any} layers={NOINK}><planeGeometry args={[2.2, 3.3]} /><meshBasicMaterial map={tex} transparent alphaTest={0.05} side={THREE.DoubleSide} /></mesh>;
};

type Member = { id: string; preset: any; x: number };
const MEMBERS: Member[] = [
  { id: "rm", preset: RM_BTS_V1, x: -3.6 }, { id: "jin", preset: JIN_BTS_V1, x: -2.4 }, { id: "suga", preset: SUGA_BTS_V1, x: -1.2 },
  { id: "jhope", preset: JHOPE_BTS_V1, x: 0 }, { id: "jimin", preset: JIMIN_BTS_V1, x: 1.2 }, { id: "v", preset: V_BTS_V1, x: 2.4 }, { id: "jk", preset: JUNGKOOK_BTS_V1, x: 3.6 },
];

const CharacterCard: React.FC<{ m: Member; frame: number }> = ({ m, frame }) => {
  const bob = Math.sin(frame * 0.04 + m.x) * 0.4;
  const eyeOpen = (frame + Math.round(m.x * 20)) % 140 > 134 ? 0.08 : 1;
  const headRotate = Math.sin(frame * 0.015 + m.x * 0.5) * 2;
  const tex = useSvgTexture(<MaleBaseCharacter width={512} height={768} {...m.preset} pose={{ bodyY: bob * 0.2, headY: bob * 0.15, headRotate, eyeOpen, mouthShape: "smile", armLeftRotate: 8, armRightRotate: -8 }} />, [m.id, "c4", Math.round(frame / 4)], 512, 768);
  return <Card tex={tex} pos={[m.x, 2.05, 0]} scale={0.96} />;
};

const Crowd: React.FC<{ frame: number }> = ({ frame }) => {
  const items: React.ReactNode[] = [];
  for (let r = 0; r < 6; r++) for (let c = 0; c < 20; c++) {
    const phase = r * 0.6 + c * 0.3;
    const glow = 0.5 + 0.5 * Math.sin(frame * 0.08 + phase);
    items.push(<group key={`${r}-${c}`} position={[-7.8 + c * 0.82 + Math.sin(frame*0.05+phase)*0.06, 0.35 + r*0.2, 2.2 + r*0.75]}>
      <mesh position={[0,0.28,0]}><sphereGeometry args={[0.07,8,8]} /><meshBasicMaterial color="#1F2937" /></mesh>
      <pointLight position={[0,0.55,0]} intensity={glow*0.08} color="#FCD34D" distance={1.0} />
    </group>);
  }
  return <group>{items}</group>;
};

const Stage: React.FC = () => {
  const btsTex = useMemo(() => {
    const c = document.createElement("canvas"); c.width = 1024; c.height = 512;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0,0,1024,512); ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.font="900 220px Arial Black, Arial"; ctx.fillStyle="rgba(252,211,77,0.35)"; ctx.fillText("BTS",512,220);
    ctx.font="bold 58px Arial"; ctx.fillStyle="rgba(253,230,138,0.45)"; ctx.fillText("WORLD RECORDS",512,370);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true; return t;
  }, []);
  return <group>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,0,0]} receiveShadow><planeGeometry args={[30,20]} /><meshStandardMaterial color="#151827" roughness={0.9} /></mesh>
    <Box pos={[0,3.2,-3.5]} args={[30,7,0.3]} color="#1B2033" />
    <mesh position={[0,3.35,-3.31]}><planeGeometry args={[13.2,3.6]} /><meshBasicMaterial map={btsTex} transparent /></mesh>
    <Box pos={[-7.2,2.5,-2.5]} args={[0.5,5,2]} color="#20263B" />
    <Box pos={[7.2,2.5,-2.5]} args={[0.5,5,2]} color="#20263B" />
  </group>;
};

const CameraRig: React.FC<{ frame: number }> = ({ frame }) => {
  const { camera } = useThree();
  const t = frame / BCD4_FRAMES;
  let cam = { x: 0, y: 3.2, z: 12.5, lx: 0, ly: 2.1, lz: 0, fov: 48 };
  if (t < 0.15) { const p=smooth(t/0.15); cam={x:0,y:3.4,z:13.2-p,lx:0,ly:2.2,lz:0.5,fov:50}; }
  else if (t < 0.35) { const p=smooth((t-0.15)/0.2); cam={x:-1.5+p*3,y:3.0,z:11.5,lx:-0.5+p,ly:2.15,lz:0,fov:46}; }
  else if (t < 0.55) { cam={x:0,y:4.0,z:8.5,lx:0,ly:1.8,lz:1.8,fov:50}; }
  else if (t < 0.75) { const p=smooth((t-0.55)/0.2); cam={x:2-p*4,y:3.0,z:11.0,lx:1-p*2,ly:2.15,lz:0,fov:45}; }
  else { const p=smooth((t-0.75)/0.25); cam={x:0,y:3.4,z:12.8-p*0.8,lx:0,ly:2.1,lz:0.3,fov:49}; }
  camera.position.set(cam.x,cam.y,cam.z); camera.lookAt(cam.lx,cam.ly,cam.lz);
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
  return <div style={{ position: "absolute", bottom: 110, left: 60, right: 60, textAlign: "center", fontFamily: "Arial Black, Arial, sans-serif", fontSize: 44, lineHeight: 1.25, color: "#FFFFFF", textShadow: "0 4px 18px rgba(0,0,0,0.7)", padding: "18px 24px", borderRadius: 20, background: "rgba(20,24,39,0.45)" }}>{line}</div>;
};

const HookOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 10, 75, 95], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <div style={{ position: "absolute", top: 110, left: 50, right: 50, textAlign: "center", opacity }}>
    <div style={{ fontFamily: "Arial Black, Arial, sans-serif", fontSize: 42, color: "#FFFFFF", textShadow: "0 3px 14px rgba(0,0,0,0.6)", background: "rgba(30,41,59,0.7)", borderRadius: 24, padding: "22px 20px", border: "3px solid #FCD34D" }}>
      Você tem ideia do tamanho dos recordes do BTS? 🏆
      <div style={{ fontSize: 28, marginTop: 10, color: "#FDE68A", fontFamily: "Arial, sans-serif" }}>Curte, segue e compartilha agora!</div>
    </div>
  </div>;
};

const EndCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [BCD4_FRAMES - 120, BCD4_FRAMES - 90], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <div style={{ position: "absolute", top: 140, left: 60, right: 60, textAlign: "center", opacity }}>
    <div style={{ fontFamily: "Arial Black, Arial, sans-serif", fontSize: 36, color: "#F5F3FF", background: "rgba(30,41,59,0.65)", borderRadius: 20, padding: "18px", border: "2px solid #FCD34D" }}>
      Orgulho do BTS? 💜 Curta, siga e comente: RECORDES
    </div>
  </div>;
};

const Scene: React.FC = () => {
  const frame = useCurrentFrame(); const { width, height } = useVideoConfig();
  return <>
    <ThreeCanvas width={width} height={height} frameloop="demand" dpr={1.0}
      shadows gl={{ antialias: false, alpha: false, powerPreference: "high-performance", toneMapping: THREE.NoToneMapping, outputColorSpace: THREE.SRGBColorSpace }}
      camera={{ fov: 48, position: [0, 3.2, 12.5], near: 0.1, far: 60 }}
      onCreated={({ gl }) => { gl.setClearColor(0x0F1422, 1); gl.shadowMap.enabled = true; gl.shadowMap.type = THREE.PCFSoftShadowMap; }}>
      <CameraRig frame={frame} /><color attach="background" args={["#0F1422"]} /><fog attach="fog" args={["#0F1422", 12, 35]} />
      <ambientLight intensity={0.45} /><directionalLight position={[4,8,6]} intensity={1.0} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <pointLight position={[-5,4,2]} intensity={1.0} color="#FCD34D" distance={18} /><pointLight position={[5,4,2]} intensity={1.0} color="#60A5FA" distance={18} />
      <Stage /><Crowd frame={frame} />
      {MEMBERS.map(m => <CharacterCard key={m.id} m={m} frame={frame} />)}
      <Effects />
    </ThreeCanvas>
    <HookOverlay /><EndCTA /><Subtitle />
  </>;
};

export const BtsCuriosity4Records: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#0F1422" }}>
    <Audio src={staticFile("bts-curiosity-4-records/voice.wav")} />
    <Scene />
  </AbsoluteFill>
);
export default BtsCuriosity4Records;
