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
import wordsData from "../../../public/bob-marley-story-love-message/words.json";

export const BMLM_FPS = 30;
export const BMLM_FRAMES = 1020;

const smooth = (t: number) => { const u = Math.max(0, Math.min(1, t)); return u * u * (3 - 2 * u); };
const makeBloom = () => new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.38, luminanceThreshold: 0.86, luminanceSmoothing: 0.25, mipmapBlur: true, levels: 4, radius: 0.6 });

const Card: React.FC<{ tex: THREE.Texture | null; pos: [number, number, number]; scale?: number | [number, number, number] }> = ({ tex, pos, scale = 1 }) => {
  if (!tex) return null;
  return <mesh position={pos} scale={scale as any} layers={NOINK}><planeGeometry args={[2.2, 3.3]} /><meshBasicMaterial map={tex} transparent alphaTest={0.05} side={THREE.DoubleSide} /></mesh>;
};

const Heart: React.FC<{ pos: [number, number, number]; color?: string; scale?: number }> = ({ pos, color = "#F472B6", scale = 1 }) => (
  <group position={pos} scale={scale}>
    <mesh position={[-0.07,0.05,0]}><sphereGeometry args={[0.1,16,16]} /><meshBasicMaterial color={color} /></mesh>
    <mesh position={[0.07,0.05,0]}><sphereGeometry args={[0.1,16,16]} /><meshBasicMaterial color={color} /></mesh>
    <mesh position={[0,-0.06,0]} rotation={[0,0,Math.PI/4]}><boxGeometry args={[0.16,0.16,0.08]} /><meshBasicMaterial color={color} /></mesh>
  </group>
);

const SceneScenery: React.FC = () => (
  <group>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,0,0]} receiveShadow><planeGeometry args={[26,16]} /><meshStandardMaterial color="#7BC96F" roughness={0.95} /></mesh>
    <mesh position={[0,4.0,-6.2]}><planeGeometry args={[28,10]} /><meshBasicMaterial color="#87CEEB" /></mesh>
    <mesh position={[0,6.2,-6.1]}><circleGeometry args={[1.1,32]} /><meshBasicMaterial color="#FFD54F" /></mesh>
    {[[-5,0,-4.5],[5,0,-4.5]].map((p,i)=>(<group key={i} position={p as any}><mesh position={[0,1.5,0]}><cylinderGeometry args={[0.12,0.16,3,10]} /><meshStandardMaterial color="#8D6E63" /></mesh><mesh position={[0,3.2,0]}><sphereGeometry args={[0.9,16,16]} /><meshStandardMaterial color="#2E7D32" /></mesh></group>))}
  </group>
);

const BobCard: React.FC<{ frame: number }> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const words = (wordsData as any).words as { text: string; offset: number; duration: number }[];
  const speaking = words.some(w => t >= w.offset - 0.03 && t <= w.offset + w.duration + 0.08);
  const singCycle = Math.sin(frame * 0.24);
  const mouthShape: "neutral" | "open" | "smile" = speaking ? (singCycle > 0.15 ? "open" : "smile") : "smile";
  const blink = frame % 120 > 114 ? 0.08 : 1;
  const bob = Math.sin(frame * 0.04) * 0.015;
  const tex = useSvgTexture(<BobMarleyV1 width={512} height={768} eyeOpen={blink} mouthShape={mouthShape} />, ["bob-love-v2", Math.round(frame/2), mouthShape, speaking?1:0, blink<0.5?1:0], 512, 768);
  return <Card tex={tex} pos={[0,1.7 + bob,0]} scale={1.02} />;
};

const CameraRig: React.FC<{ frame: number }> = ({ frame }) => {
  const { camera } = useThree(); const t = frame / BMLM_FRAMES;
  let cam = { x:0,y:2.9,z:10.5,lx:0,ly:2.1,lz:0,fov:44 };
  if (t<0.2){const p=smooth(t/0.2); cam={x:-1+p,y:3.0,z:11-p*0.8,lx:0,ly:2.1,lz:0,fov:45};}
  else if(t<0.45){const p=smooth((t-0.2)/0.25); cam={x:0.8-p*1.6,y:2.8,z:9.5,lx:0,ly:2.15,lz:0,fov:43};}
  else if(t<0.7){cam={x:0,y:2.6,z:7.8,lx:0,ly:2.35,lz:0.2,fov:38};}
  else {const p=smooth((t-0.7)/0.3); cam={x:-0.5+p,y:3.0,z:10.5-p*0.6,lx:0,ly:2.1,lz:0,fov:45};}
  camera.position.set(cam.x,cam.y,cam.z); camera.lookAt(cam.lx,cam.ly,cam.lz);
  if ("fov" in camera){ (camera as THREE.PerspectiveCamera).fov=cam.fov; camera.updateProjectionMatrix(); }
  return null;
};

const Effects: React.FC = () => {
  const { scene, camera } = useThree();
  const fx = useMemo(()=>({ ink:new InkPass(scene,camera as THREE.PerspectiveCamera,{strength:0.5,widthNear:3.4,widthFar:2.2}), lens:new LensBlur({maxCoC:9,nearScale:0.7}), bloom:makeBloom(), tone:new ToneMappingEffect({mode:ToneMappingMode.NEUTRAL}), grade:new GradeEffect(GRADES.day,GRADE_STRENGTH.day)}),[scene,camera]);
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
  return <div style={{ position:"absolute",bottom:110,left:60,right:60,textAlign:"center",fontFamily:"Arial Black, Arial, sans-serif",fontSize:42,lineHeight:1.25,color:"#FFFFFF",textShadow:"0 4px 18px rgba(0,0,0,0.55)",padding:"18px 24px",borderRadius:20,background:"rgba(17,24,39,0.3)" }}>{line}</div>;
};

const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame,[0,8,75,95],[0,1,1,0],{extrapolateLeft:"clamp",extrapolateRight:"clamp"});
  return <div style={{ position:"absolute",top:100,left:50,right:50,textAlign:"center",opacity }}>
    <div style={{ fontFamily:"Arial Black, Arial, sans-serif",fontSize:40,color:"#FFFFFF",background:"rgba(27,138,58,0.78)",borderRadius:24,padding:"20px",border:"3px solid #FCD34D" }}>
      Oi, eu sou Bob Marley 💚
      <div style={{ fontSize:28,marginTop:10,color:"#FEF3C7",fontFamily:"Arial, sans-serif" }}>Curte, segue e fica comigo até o fim!</div>
    </div>
  </div>;
};

const EndCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame,[BMLM_FRAMES-110,BMLM_FRAMES-80],[0,1],{extrapolateLeft:"clamp",extrapolateRight:"clamp"});
  return <div style={{ position:"absolute",top:140,left:60,right:60,textAlign:"center",opacity }}>
    <div style={{ fontFamily:"Arial Black, Arial, sans-serif",fontSize:34,color:"#FFFFFF",background:"rgba(27,138,58,0.7)",borderRadius:20,padding:"18px",border:"2px solid #FCD34D" }}>
      Comenta ONE LOVE 💚 Curta, siga e compartilhe!
    </div>
  </div>;
};

const Scene: React.FC = () => {
  const frame = useCurrentFrame(); const { width, height } = useVideoConfig();
  const float = Math.sin(frame*0.05)*0.1;
  return <>
    <ThreeCanvas width={width} height={height} frameloop="demand" dpr={1.0}
      shadows gl={{ antialias:false,alpha:false,powerPreference:"high-performance",toneMapping:THREE.NoToneMapping,outputColorSpace:THREE.SRGBColorSpace }}
      camera={{ fov:44, position:[0,2.9,10.5], near:0.1, far:60 }}
      onCreated={({ gl })=>{ gl.setClearColor(0x87CEEB,1); gl.shadowMap.enabled=true; gl.shadowMap.type=THREE.PCFSoftShadowMap; }}>
      <CameraRig frame={frame} /><color attach="background" args={["#87CEEB"]} /><fog attach="fog" args={["#87CEEB",14,40]} />
      <ambientLight intensity={0.75} /><directionalLight position={[5,10,6]} intensity={1.2} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <SceneScenery />
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,0.02,0.1]} layers={NOINK}><circleGeometry args={[0.55,32]} /><meshBasicMaterial color="#000000" transparent opacity={0.16} /></mesh>
      <BobCard frame={frame} />
      <Heart pos={[-1.8,2.8+float,-1]} color="#F87171" scale={0.8} />
      <Heart pos={[1.9,3.0-float,-1.2]} color="#F472B6" scale={0.7} />
      <Heart pos={[0,3.6+float*0.6,-1.5]} color="#FCD34D" scale={0.6} />
      <Effects />
    </ThreeCanvas>
    <Hook />
    {(() => { const t = frame/30; const o = interpolate(t,[18.5,19.2,23.5,24.5],[0,1,1,0],{extrapolateLeft:"clamp",extrapolateRight:"clamp"}); return <div style={{ position:"absolute",top:210,left:80,right:80,textAlign:"center",opacity:o }}><div style={{ fontFamily:"Arial Black, Arial, sans-serif",fontSize:44,color:"#FCD34D",textShadow:"0 4px 18px rgba(0,0,0,0.5)",background:"rgba(0,0,0,0.22)",borderRadius:18,padding:"14px" }}>🎵 Is This Love</div></div>; })()}
    <EndCTA />
    <Subtitle />
  </>;
};

export const BobMarleyStoryLoveMessage: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor:"#87CEEB" }}>
    <Audio src={staticFile("bob-marley-story-love-message/voice.wav")} />
    <Scene />
  </AbsoluteFill>
);
export default BobMarleyStoryLoveMessage;
