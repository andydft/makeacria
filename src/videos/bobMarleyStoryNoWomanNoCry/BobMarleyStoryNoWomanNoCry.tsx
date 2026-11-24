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
import BobMarleyV1 from "../../characters/presets/BobMarleyV1";
import wordsData from "../../../public/bob-marley-story-no-woman-no-cry/words.json";

export const BMNW_FPS = 30;
export const BMNW_FRAMES = 1060;

const smooth = (t: number) => { const u = Math.max(0, Math.min(1, t)); return u * u * (3 - 2 * u); };
const makeBloom = () => new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.35, luminanceThreshold: 0.88, luminanceSmoothing: 0.25, mipmapBlur: true, levels: 4, radius: 0.6 });

const Card: React.FC<{ tex: THREE.Texture | null; pos: [number, number, number]; scale?: number | [number, number, number] }> = ({ tex, pos, scale = 1 }) => {
  if (!tex) return null;
  return <mesh position={pos} scale={scale as any} layers={NOINK}><planeGeometry args={[2.2, 3.3]} /><meshBasicMaterial map={tex} transparent alphaTest={0.05} side={THREE.DoubleSide} /></mesh>;
};

const SceneScenery: React.FC = () => (
  <group>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,0,0]} receiveShadow><planeGeometry args={[26,16]} /><meshStandardMaterial color="#A67C52" roughness={0.95} /></mesh>
    <mesh position={[0,3.8,-6.0]}><planeGeometry args={[28,9]} /><meshBasicMaterial color="#FFBE76" /></mesh>
    <mesh position={[0,1.0,-5.9]}><planeGeometry args={[28,4]} /><meshBasicMaterial color="#E67E22" opacity={0.35} transparent /></mesh>
    {/* cute little huts */}
    {[[-4.8,0,-4.8,0.9],[ -2.2,0,-5.2,0.75],[2.2,0,-5.1,0.8],[4.8,0,-4.7,0.95]].map((p,i)=>(
      <group key={i} position={[p[0],0,p[2]] as any} scale={p[3] as number}>
        <mesh position={[0,0.9,0]}><cylinderGeometry args={[0.95,1.05,1.8,8]} /><meshStandardMaterial color={i%2?"#F5DEB3":"#E8C39E"} /></mesh>
        <mesh position={[0,2.15,0]}><coneGeometry args={[1.35,1.3,8]} /><meshStandardMaterial color={i%3===0?"#8D6E63":"#795548"} /></mesh>
        <mesh position={[0,0.55,0.96]}><boxGeometry args={[0.45,0.8,0.08]} /><meshStandardMaterial color="#5D4037" /></mesh>
        <mesh position={[0.55,1.1,0.96]}><boxGeometry args={[0.32,0.32,0.06]} /><meshBasicMaterial color="#FFF9C4" /></mesh>
      </group>
    ))}
    <pointLight position={[0,5,-2]} intensity={0.9} color="#FFD7A8" distance={18} />
  </group>
);

const BobCard: React.FC<{ frame: number }> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const words = (wordsData as any).words as { text: string; offset: number; duration: number }[];
  const speaking = words.some(w => t >= w.offset - 0.03 && t <= w.offset + w.duration + 0.08);
  const singCycle = Math.sin(frame * 0.22);
  const mouthShape: "neutral" | "open" | "smile" = speaking ? (singCycle > 0.15 ? "open" : "smile") : "smile";
  const blink = frame % 120 > 114 ? 0.08 : 1;
  const bob = Math.sin(frame * 0.035) * 0.012;
  const tex = useSvgTexture(<BobMarleyV1 width={512} height={768} eyeOpen={blink} mouthShape={mouthShape} />, ["bob-nwnc-v2", Math.round(frame/2), mouthShape, speaking?1:0, blink<0.5?1:0], 512, 768);
  return <Card tex={tex} pos={[0,1.7+bob,0]} scale={1.02} />;
};

const CameraRig: React.FC<{ frame: number }> = ({ frame }) => {
  const { camera } = useThree(); const t = frame / BMNW_FRAMES;
  let cam = { x:0,y:2.9,z:10.5,lx:0,ly:2.1,lz:0,fov:44 };
  if (t<0.2){const p=smooth(t/0.2); cam={x:-1+p,y:3.0,z:11-p*0.8,lx:0,ly:2.1,lz:0,fov:45};}
  else if(t<0.45){const p=smooth((t-0.2)/0.25); cam={x:0.8-p*1.6,y:2.8,z:9.5,lx:0,ly:2.15,lz:0,fov:43};}
  else if(t<0.65){cam={x:0,y:2.6,z:7.8,lx:0,ly:2.35,lz:0.2,fov:38};}
  else {const p=smooth((t-0.65)/0.35); cam={x:-0.6+p*1.2,y:3.0,z:10.5-p*0.6,lx:0,ly:2.1,lz:0,fov:45};}
  camera.position.set(cam.x,cam.y,cam.z); camera.lookAt(cam.lx,cam.ly,cam.lz);
  if ("fov" in camera){ (camera as THREE.PerspectiveCamera).fov=cam.fov; camera.updateProjectionMatrix(); }
  return null;
};

const Effects: React.FC = () => {
  const { scene, camera } = useThree();
  const fx = useMemo(()=>({ ink:new InkPass(scene,camera as THREE.PerspectiveCamera,{strength:0.52,widthNear:3.4,widthFar:2.2}), lens:new LensBlur({maxCoC:9,nearScale:0.7}), bloom:makeBloom(), tone:new ToneMappingEffect({mode:ToneMappingMode.NEUTRAL}), grade:new GradeEffect(GRADES.day,GRADE_STRENGTH.day)}),[scene,camera]);
  return <EffectComposer multisampling={0} frameBufferType={THREE.HalfFloatType} renderPriority={1}>
    <primitive object={fx.ink} dispose={null}/><primitive object={fx.lens.pre} dispose={null}/><primitive object={fx.lens.main} dispose={null}/>
    <primitive object={fx.bloom} dispose={null}/><primitive object={fx.tone} dispose={null}/><primitive object={fx.grade} dispose={null}/>
  </EffectComposer>;
};

const Subtitle: React.FC = () => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const t = frame/fps;
  const words = (wordsData as any).words as { text:string; offset:number; duration:number }[];
  const active = words.filter(w => t >= w.offset-0.05 && t <= w.offset+w.duration+0.15);
  const recent = words.filter(w => w.offset <= t).slice(-6);
  const line = (active.length?active:recent).map(w=>w.text).join(" ");
  if(!line) return null;
  return <div style={{ position:"absolute",bottom:110,left:60,right:60,textAlign:"center",fontFamily:"Arial Black, Arial, sans-serif",fontSize:42,lineHeight:1.25,color:"#FFFFFF",textShadow:"0 4px 18px rgba(0,0,0,0.55)",padding:"18px 24px",borderRadius:20,background:"rgba(17,24,39,0.35)" }}>{line}</div>;
};

const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame,[0,8,75,95],[0,1,1,0],{extrapolateLeft:"clamp",extrapolateRight:"clamp"});
  return <div style={{ position:"absolute",top:100,left:50,right:50,textAlign:"center",opacity }}>
    <div style={{ fontFamily:"Arial Black, Arial, sans-serif",fontSize:40,color:"#FFFFFF",background:"rgba(120,53,15,0.72)",borderRadius:24,padding:"20px",border:"3px solid #FCD34D" }}>
      Oi, eu sou Bob Marley... 🥺
      <div style={{ fontSize:28,marginTop:10,color:"#FEF3C7",fontFamily:"Arial, sans-serif" }}>Essa é a história de No Woman, No Cry</div>
    </div>
  </div>;
};

const Scene: React.FC = () => {
  const frame = useCurrentFrame(); const { width, height } = useVideoConfig();
  return <>
    <ThreeCanvas width={width} height={height} frameloop="demand" dpr={1.0}
      shadows gl={{ antialias:false,alpha:false,powerPreference:"high-performance",toneMapping:THREE.NoToneMapping,outputColorSpace:THREE.SRGBColorSpace }}
      camera={{ fov:44, position:[0,2.9,10.5], near:0.1, far:60 }}
      onCreated={({ gl })=>{ gl.setClearColor(0xF6B26B,1); gl.shadowMap.enabled=true; gl.shadowMap.type=THREE.PCFSoftShadowMap; }}>
      <CameraRig frame={frame} /><color attach="background" args={["#F6B26B"]} /><fog attach="fog" args={["#F6B26B",14,40]} />
      <ambientLight intensity={0.72} /><directionalLight position={[5,10,6]} intensity={1.15} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <SceneScenery />
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,0.02,0.1]} layers={NOINK}><circleGeometry args={[0.55,32]} /><meshBasicMaterial color="#000000" transparent opacity={0.16} /></mesh>
      <BobCard frame={frame} />
      <Effects />
    </ThreeCanvas>
    <Hook /><Subtitle />
  </>;
};

export const BobMarleyStoryNoWomanNoCry: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor:"#F6B26B" }}>
    <Audio src={staticFile("bob-marley-story-no-woman-no-cry/voice.wav")} />
    <Scene />
  </AbsoluteFill>
);
export default BobMarleyStoryNoWomanNoCry;
