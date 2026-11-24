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
import RogerioSkylabV1 from "../../characters/presets/RogerioSkylabV1";
import wordsData from "../../../public/skylab-story-1-fake-death/words.json";

export const SKY1_FPS = 30;
export const SKY1_FRAMES = 1600;
const smooth = (t: number) => { const u = Math.max(0, Math.min(1, t)); return u * u * (3 - 2 * u); };
const makeBloom = () => new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.4, luminanceThreshold: 0.86, luminanceSmoothing: 0.25, mipmapBlur: true, levels: 4, radius: 0.6 });
const Card: React.FC<{ tex: THREE.Texture | null; pos: [number, number, number]; scale?: number | [number, number, number] }> = ({ tex, pos, scale = 1 }) => {
  if (!tex) return null;
  return <mesh position={pos} scale={scale as any} layers={NOINK}><planeGeometry args={[2.2, 3.3]} /><meshBasicMaterial map={tex} transparent alphaTest={0.05} side={THREE.DoubleSide} /></mesh>;
};
const Scenery: React.FC = () => {
  const tex = useMemo(() => { const c=document.createElement("canvas"); c.width=1024; c.height=512; const ctx=c.getContext("2d")!; ctx.fillStyle="#1A1A2E"; ctx.fillRect(0,0,1024,512); ctx.textAlign="center"; ctx.font="900 120px Arial Black"; ctx.fillStyle="rgba(255,255,255,0.12)"; ctx.fillText("ROGÉRIO SKYLAB",512,220); ctx.font="bold 44px Arial"; ctx.fillStyle="rgba(255,200,80,0.25)"; ctx.fillText("HISTÓRIAS ABSURDAS",512,320); const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.needsUpdate=true; return t; }, []);
  return <group>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,0,0]} receiveShadow><planeGeometry args={[24,16]} /><meshStandardMaterial color="#22223B" roughness={0.95} /></mesh>
    <mesh position={[0,3.2,-3.5]}><planeGeometry args={[16,6]} /><meshBasicMaterial map={tex} /></mesh>
    <mesh position={[-5,2,-2.5]}><boxGeometry args={[0.5,4,1]} /><meshStandardMaterial color="#4A4E69" /></mesh>
    <mesh position={[5,2,-2.5]}><boxGeometry args={[0.5,4,1]} /><meshStandardMaterial color="#4A4E69" /></mesh>
  </group>;
};
const SkylabCard: React.FC<{ frame: number }> = ({ frame }) => {
  const { fps } = useVideoConfig(); const t = frame/fps;
  const words = (wordsData as any).words as { text:string; offset:number; duration:number }[];
  const speaking = words.some(w => t >= w.offset-0.03 && t <= w.offset+w.duration+0.08);
  const cycle = Math.sin(frame*0.22);
  const mouthShape: "neutral"|"open"|"smile" = speaking ? (cycle>0.15?"open":"smile") : "neutral";
  const blink = frame%130>124?0.08:1;
  const bob = Math.sin(frame*0.04)*0.015;
  const tex = useSvgTexture(<RogerioSkylabV1 width={512} height={768} eyeOpen={blink} mouthShape={mouthShape} />,["sky1",Math.round(frame/2),mouthShape,speaking?1:0],512,768);
  return <Card tex={tex} pos={[0,1.72+bob,0]} scale={1.02} />;
};
const CameraRig: React.FC<{ frame: number }> = ({ frame }) => { const { camera } = useThree(); const t=frame/SKY1_FRAMES; let cam={x:0,y:2.9,z:10.2,lx:0,ly:2.1,lz:0,fov:44};
  if(t<0.15){const p=smooth(t/0.15); cam={x:-1+p*0.6,y:3.0,z:10.8-p*0.6,lx:0,ly:2.1,lz:0,fov:45};}
  else if(t<0.3){cam={x:0,y:2.6,z:7.8,lx:0,ly:2.3,lz:0.2,fov:38};}
  else if(t<0.55){const p=smooth((t-0.3)/0.25); cam={x:0.8-p*1.6,y:2.9,z:9.8,lx:0,ly:2.15,lz:0,fov:43};}
  else if(t<0.75){cam={x:-0.3,y:2.65,z:7.6,lx:0,ly:2.35,lz:0.2,fov:37};}
  else {const p=smooth((t-0.75)/0.25); cam={x:0,y:3.1,z:10.5-p*0.5,lx:0,ly:2.1,lz:0,fov:45};}
  camera.position.set(cam.x,cam.y,cam.z); camera.lookAt(cam.lx,cam.ly,cam.lz); if("fov"in camera){(camera as THREE.PerspectiveCamera).fov=cam.fov; camera.updateProjectionMatrix();} return null; };
const Effects: React.FC = () => { const { scene, camera } = useThree(); const fx=useMemo(()=>({ink:new InkPass(scene,camera as THREE.PerspectiveCamera,{strength:0.55,widthNear:3.5,widthFar:2.2}),lens:new LensBlur({maxCoC:9,nearScale:0.8}),bloom:makeBloom(),tone:new ToneMappingEffect({mode:ToneMappingMode.NEUTRAL}),grade:new GradeEffect(GRADES.day,GRADE_STRENGTH.day)}),[scene,camera]); return <EffectComposer multisampling={0} frameBufferType={THREE.HalfFloatType} renderPriority={1}><primitive object={fx.ink} dispose={null}/><primitive object={fx.lens.pre} dispose={null}/><primitive object={fx.lens.main} dispose={null}/><primitive object={fx.bloom} dispose={null}/><primitive object={fx.tone} dispose={null}/><primitive object={fx.grade} dispose={null}/></EffectComposer>; };
const Subtitle: React.FC = () => { const frame=useCurrentFrame(); const {fps}=useVideoConfig(); const t=frame/fps; const words=(wordsData as any).words as {text:string;offset:number;duration:number}[]; const active=words.filter(w=>t>=w.offset-0.05&&t<=w.offset+w.duration+0.15); const recent=words.filter(w=>w.offset<=t).slice(-6); const line=(active.length?active:recent).map(w=>w.text).join(" "); if(!line) return null; return <div style={{position:"absolute",bottom:110,left:60,right:60,textAlign:"center",fontFamily:"Arial Black, Arial, sans-serif",fontSize:42,lineHeight:1.25,color:"#FFFFFF",textShadow:"0 4px 18px rgba(0,0,0,0.7)",padding:"18px 24px",borderRadius:20,background:"rgba(17,24,39,0.45)"}}>{line}</div>; };
const Hook: React.FC = () => { const frame=useCurrentFrame(); const o=interpolate(frame,[0,8,90,110],[0,1,1,0],{extrapolateLeft:"clamp",extrapolateRight:"clamp"}); return <div style={{position:"absolute",top:100,left:50,right:50,textAlign:"center",opacity:o}}><div style={{fontFamily:"Arial Black, Arial, sans-serif",fontSize:38,color:"#FFFFFF",background:"rgba(40,40,55,0.88)",borderRadius:24,padding:"20px",border:"3px solid #FCD34D"}}>Boa noite. Eu sou Rogério Skylab.<div style={{fontSize:28,marginTop:10,color:"#FDE68A",fontFamily:"Arial, sans-serif"}}>Eu morri... e ninguém percebeu. Curte e segue, por respeito ao defunto.</div></div></div>; };
const EndCTA: React.FC = () => { const frame=useCurrentFrame(); const o=interpolate(frame,[SKY1_FRAMES-120,SKY1_FRAMES-90],[0,1],{extrapolateLeft:"clamp",extrapolateRight:"clamp"}); return <div style={{position:"absolute",top:140,left:60,right:60,textAlign:"center",opacity:o}}><div style={{fontFamily:"Arial Black, Arial, sans-serif",fontSize:34,color:"#FFFFFF",background:"rgba(74,78,105,0.75)",borderRadius:20,padding:"18px",border:"2px solid #FCD34D"}}>Comenta SKYLAB VIVO • Curte • Segue • Compartilha</div></div>; };
const Scene: React.FC = () => { const frame=useCurrentFrame(); const {width,height}=useVideoConfig(); return <><ThreeCanvas width={width} height={height} frameloop="demand" dpr={1.0} shadows gl={{antialias:false,alpha:false,powerPreference:"high-performance",toneMapping:THREE.NoToneMapping,outputColorSpace:THREE.SRGBColorSpace}} camera={{fov:44,position:[0,2.9,10.2],near:0.1,far:60}} onCreated={({gl})=>{gl.setClearColor(0x1A1A2E,1); gl.shadowMap.enabled=true; gl.shadowMap.type=THREE.PCFSoftShadowMap;}}><CameraRig frame={frame}/><color attach="background" args={["#1A1A2E"]}/><fog attach="fog" args={["#1A1A2E",12,35]}/><ambientLight intensity={0.55}/><directionalLight position={[4,8,6]} intensity={1.1} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024}/><Scenery/><mesh rotation={[-Math.PI/2,0,0]} position={[0,0.02,0.1]} layers={NOINK}><circleGeometry args={[0.55,32]}/><meshBasicMaterial color="#000000" transparent opacity={0.16}/></mesh><SkylabCard frame={frame}/><Effects/></ThreeCanvas><Hook/><EndCTA/><Subtitle/></>; };
export const SkylabStory1FakeDeath: React.FC = () => <AbsoluteFill style={{backgroundColor:"#1A1A2E"}}><Audio src={staticFile("skylab-story-1-fake-death/voice.wav")}/><Scene/></AbsoluteFill>;
export default SkylabStory1FakeDeath;
