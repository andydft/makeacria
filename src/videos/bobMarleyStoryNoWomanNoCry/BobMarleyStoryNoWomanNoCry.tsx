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
export const BMNW_FRAMES = 1140;

const smooth = (t: number) => { const u = Math.max(0, Math.min(1, t)); return u * u * (3 - 2 * u); };
const makeBloom = () => new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.35, luminanceThreshold: 0.88, luminanceSmoothing: 0.25, mipmapBlur: true, levels: 4, radius: 0.6 });

const Card: React.FC<{ tex: THREE.Texture | null; pos: [number, number, number]; scale?: number | [number, number, number] }> = ({ tex, pos, scale = 1 }) => {
  if (!tex) return null;
  return <mesh position={pos} scale={scale as any} layers={NOINK}><planeGeometry args={[2.2, 3.3]} /><meshBasicMaterial map={tex} transparent alphaTest={0.05} side={THREE.DoubleSide} /></mesh>;
};

const SceneScenery: React.FC = () => (
  <group>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,0,0]} receiveShadow><planeGeometry args={[26,16]} /><meshStandardMaterial color="#8B6B4A" roughness={0.95} /></mesh>
    <mesh position={[0,3.8,-6.0]}><planeGeometry args={[28,9]} /><meshBasicMaterial color="#F6B26B" /></mesh>
    <mesh position={[0,1.0,-5.9]}><planeGeometry args={[28,4]} /><meshBasicMaterial color="#D98C4A" /></mesh>
    {/* simple houses */}
    {[[-4.5,1.1,-4.8],[ -1.8,1.0,-5.1],[1.8,1.0,-5.0],[4.5,1.1,-4.8]].map((p,i)=>(
      <group key={i} position={p as any}>
        <mesh><boxGeometry args={[2.2,2.2,1.6]} /><meshStandardMaterial color={i%2?"#C9ADA1":"#B08968"} /></mesh>
        <mesh position={[0,1.45,0]} rotation={[0,0,Math.PI/4]}><boxGeometry args={[1.7,1.7,1.7]} /><meshStandardMaterial color="#6D4C41" /></mesh>
      </group>
    ))}
    <pointLight position={[0,5,-2]} intensity={0.8} color="#FFD7A8" distance={18} />
  </group>
);

const BobCard: React.FC<{ frame: number }> = ({ frame }) => {
  const singCycle = Math.sin(frame * 0.2);
  const mouthShape: "neutral" | "open" | "smile" = singCycle > 0.25 ? "open" : "smile";
  const blink = frame % 120 > 114 ? 0.08 : 1;
  const tex = useSvgTexture(<BobMarleyV1 width={512} height={768} eyeOpen={blink} mouthShape={mouthShape} />, ["bob-nwnc", Math.round(frame/3), mouthShape, blink<0.5?1:0], 512, 768);
  return <Card tex={tex} pos={[0,1.7,0]} scale={1.02} />;
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
  const opacity = interpolate(frame,[0,8,70,90],[0,1,1,0],{extrapolateLeft:"clamp",extrapolateRight:"clamp"});
  return <div style={{ position:"absolute",top:100,left:50,right:50,textAlign:"center",opacity }}>
    <div style={{ fontFamily:"Arial Black, Arial, sans-serif",fontSize:40,color:"#FFFFFF",background:"rgba(120,53,15,0.72)",borderRadius:24,padding:"20px",border:"3px solid #FCD34D" }}>
      Por que Bob Marley fez “No Woman, No Cry”? 🥺
      <div style={{ fontSize:28,marginTop:10,color:"#FEF3C7",fontFamily:"Arial, sans-serif" }}>Curte, segue e compartilha essa história!</div>
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
