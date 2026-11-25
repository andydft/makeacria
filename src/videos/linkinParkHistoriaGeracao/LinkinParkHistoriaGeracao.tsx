import React, { useMemo, useRef } from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, useCurrentFrame, useVideoConfig, staticFile, Easing } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import wordsData from "../../../public/linkin-park-historia-geracao/words.json";

export const LP_HIST_FPS = 30;
export const LP_HIST_FRAMES = 2340; // 78s

type Word = { text: string; offset: number; duration: number };
const WORDS = (wordsData as any).words as Word[];

const PX: React.CSSProperties = { imageRendering: "pixelated" };

// ---------- 3D Mike (from provided demo, compacted) ----------
type SpikeSpec = { pos:[number,number,number]; rot:[number,number,number]; scale:[number,number,number]; variant:"base"|"hi"|"shadow" };
const MikeChibiSinger: React.FC<{ frame:number; fps:number; pos?:[number,number,number]; scale?:number }> = ({ frame, fps, pos=[0,0,0], scale=1 }) => {
  const t = frame / fps;
  const beat = t * Math.PI * 3.2;
  const bodyBob = Math.abs(Math.sin(beat)) * 0.042;
  const bodySway = Math.sin(beat * 0.5 + 0.8) * 0.075;
  const bodyLean = 0.09 + Math.sin(beat) * 0.03;
  const headNodX = 0.07 + Math.sin(beat * 2) * 0.09;
  const headNodY = Math.sin(beat * 0.5 + 0.4) * 0.15;
  const headRollZ = Math.cos(beat) * 0.055;
  const rightArmRotX = -0.78 + Math.sin(beat) * 0.13;
  const rightArmRotZ = -0.2 + Math.cos(beat * 0.5) * 0.07;
  const leftArmRotX = 0.16 + Math.sin(beat + Math.PI) * 0.26;
  const leftArmRotZ = 0.27 + Math.cos(beat) * 0.1;
  const singWave = Math.max(0, Math.sin(t * 7.8 + 0.5)) * 0.55 + Math.max(0, Math.sin(t * 12.5)) * 0.3;
  const mouthScaleY = THREE.MathUtils.clamp(0.28 + singWave * 0.65, 0.28, 0.93);
  const mouthScaleX = THREE.MathUtils.clamp(0.78 + singWave * 0.16, 0.78, 0.94);
  const hairSpikes = useMemo<SpikeSpec[]>(() => {
    const spikes: SpikeSpec[] = []; const count=32;
    for (let i=0;i<count;i++){ const angle=(i/count)*Math.PI*2; const ring=i%3; const radius=ring===0?0.33:ring===1?0.23:0.11; const yBase=ring===0?0.21:ring===1?0.32:0.38;
      const x=Math.cos(angle)*radius; const z=Math.sin(angle)*radius*0.92; const jitter=Math.sin(i*4.1)*0.045;
      spikes.push({pos:[x,yBase,z], rot:[z*1.35+jitter, angle+Math.cos(i*2.1)*0.45, -x*1.35-jitter], scale:[0.056+((i*3)%3)*0.011, 0.13+((i*5)%4)*0.022, 0.056+((i*3)%3)*0.011], variant:i%5===0?"hi":i%4===0?"shadow":"base"});
    } return spikes;
  }, []);
  return (
    <group position={pos} scale={scale}>
    <group position={[bodySway*0.6, bodyBob, 0]} rotation={[bodyLean, bodySway, -bodySway*0.35]}>
      <group position={[-0.17,0.44,0]}><mesh position={[0,-0.18,0.02*Math.sin(beat)]} castShadow><capsuleGeometry args={[0.095,0.22,5,8]}/><meshStandardMaterial color="#1A1F2E" roughness={0.8} flatShading/></mesh><group position={[0,-0.38,0.04]}><mesh castShadow><boxGeometry args={[0.17,0.11,0.27]}/><meshStandardMaterial color="#141720" roughness={0.65} flatShading/></mesh><mesh position={[0,-0.04,0.01]}><boxGeometry args={[0.18,0.03,0.29]}/><meshStandardMaterial color="#DCE0EC" roughness={0.7} flatShading/></mesh></group></group>
      <group position={[0.17,0.44,0]}><mesh position={[0,-0.18,-0.02*Math.sin(beat)]} castShadow><capsuleGeometry args={[0.095,0.22,5,8]}/><meshStandardMaterial color="#1A1F2E" roughness={0.8} flatShading/></mesh><group position={[0,-0.38,0.04]}><mesh castShadow><boxGeometry args={[0.17,0.11,0.27]}/><meshStandardMaterial color="#141720" roughness={0.65} flatShading/></mesh><mesh position={[0,-0.04,0.01]}><boxGeometry args={[0.18,0.03,0.29]}/><meshStandardMaterial color="#DCE0EC" roughness={0.7} flatShading/></mesh></group></group>
      <group position={[0,0.76,0]}><mesh castShadow><capsuleGeometry args={[0.25,0.24,6,9]}/><meshStandardMaterial color="#151822" roughness={0.78} flatShading/></mesh><mesh position={[0,0.23,0.17]} rotation={[0.4,0,0]}><torusGeometry args={[0.09,0.014,5,12]}/><meshStandardMaterial color="#D8DCE6" roughness={0.75} flatShading/></mesh></group>
      <mesh position={[0,1.04,0.01]} castShadow><cylinderGeometry args={[0.088,0.102,0.12,7]}/><meshStandardMaterial color="#ECC09D" roughness={0.72} flatShading/></mesh>
      <group position={[-0.31,0.94,0]} rotation={[leftArmRotX,0,leftArmRotZ]}><mesh position={[0,-0.15,0]} castShadow><capsuleGeometry args={[0.072,0.18,5,8]}/><meshStandardMaterial color="#151822" roughness={0.78} flatShading/></mesh><mesh position={[0,-0.32,0.02]} castShadow><capsuleGeometry args={[0.062,0.14,5,8]}/><meshStandardMaterial color="#ECC09D" roughness={0.72} flatShading/></mesh><mesh position={[0,-0.44,0.03]} castShadow><sphereGeometry args={[0.078,7,7]}/><meshStandardMaterial color="#ECC09D" roughness={0.72} flatShading/></mesh></group>
      <group position={[0.31,0.94,0.02]} rotation={[rightArmRotX,0,rightArmRotZ]}><mesh position={[0,-0.14,0]} castShadow><capsuleGeometry args={[0.072,0.17,5,8]}/><meshStandardMaterial color="#151822" roughness={0.78} flatShading/></mesh><mesh position={[-0.03,-0.29,0.07]} rotation={[0.55,0,0]} castShadow><capsuleGeometry args={[0.062,0.14,5,8]}/><meshStandardMaterial color="#ECC09D" roughness={0.72} flatShading/></mesh><mesh position={[-0.07,-0.38,0.17]} castShadow><sphereGeometry args={[0.082,7,7]}/><meshStandardMaterial color="#ECC09D" roughness={0.72} flatShading/></mesh>
        <group position={[-0.08,-0.34,0.25]} rotation={[1.18,0.15,0]}><mesh castShadow><cylinderGeometry args={[0.032,0.024,0.26,8]}/><meshStandardMaterial color="#2A2E39" metalness={0.6} roughness={0.35} flatShading/></mesh><mesh position={[0,0.13,0]}><cylinderGeometry args={[0.036,0.036,0.02,8]}/><meshStandardMaterial color="#9AA5B8" metalness={0.8} roughness={0.25} flatShading/></mesh><mesh position={[0,0.18,0]} castShadow><sphereGeometry args={[0.065,8,8]}/><meshStandardMaterial color="#6C7688" metalness={0.75} roughness={0.3} flatShading/></mesh></group>
      </group>
      <group position={[0,1.32,0.03]} rotation={[headNodX,headNodY,headRollZ]}>
        <mesh scale={[0.99,1.05,1.02]} castShadow><sphereGeometry args={[0.37,10,9]}/><meshStandardMaterial color="#EEBF9B" roughness={0.7} flatShading/></mesh>
        <mesh position={[0,-0.225,0.295]} scale={[0.58,0.34,0.42]}><sphereGeometry args={[0.18,7,6]}/><meshStandardMaterial color="#20222A" roughness={0.85} flatShading/></mesh>
        <mesh position={[-0.36,-0.01,0]} rotation={[0,0,0.2]}><boxGeometry args={[0.06,0.13,0.08]}/><meshStandardMaterial color="#E2B08A" roughness={0.75} flatShading/></mesh>
        <mesh position={[0.36,-0.01,0]} rotation={[0,0,-0.2]}><boxGeometry args={[0.06,0.13,0.08]}/><meshStandardMaterial color="#E2B08A" roughness={0.75} flatShading/></mesh>
        <mesh position={[-0.135,0.095,0.335]} rotation={[0,0,-0.14]}><boxGeometry args={[0.115,0.032,0.035]}/><meshStandardMaterial color="#181A22" roughness={0.75} flatShading/></mesh>
        <mesh position={[0.135,0.095,0.335]} rotation={[0,0,0.14]}><boxGeometry args={[0.115,0.032,0.035]}/><meshStandardMaterial color="#181A22" roughness={0.75} flatShading/></mesh>
        <group position={[-0.13,0.035,0.33]}><mesh scale={[1.15,0.85,0.6]}><sphereGeometry args={[0.062,8,8]}/><meshStandardMaterial color="#F7F8FC" roughness={0.4} flatShading/></mesh><mesh position={[0.008,0,0.026]}><sphereGeometry args={[0.034,7,7]}/><meshStandardMaterial color="#161820" roughness={0.3} flatShading/></mesh></group>
        <group position={[0.13,0.035,0.33]}><mesh scale={[1.15,0.85,0.6]}><sphereGeometry args={[0.062,8,8]}/><meshStandardMaterial color="#F7F8FC" roughness={0.4} flatShading/></mesh><mesh position={[-0.008,0,0.026]}><sphereGeometry args={[0.034,7,7]}/><meshStandardMaterial color="#161820" roughness={0.3} flatShading/></mesh></group>
        <mesh position={[0,-0.02,0.375]} rotation={[0.25,0,0]}><coneGeometry args={[0.04,0.085,5]}/><meshStandardMaterial color="#E0AA82" roughness={0.72} flatShading/></mesh>
        <group position={[0,-0.14,0.345]} scale={[mouthScaleX,mouthScaleY,1]}><mesh><boxGeometry args={[0.088,0.028,0.03]}/><meshStandardMaterial color="#2A0B14" roughness={0.65} flatShading/></mesh><mesh position={[0,0.015,0.005]}><boxGeometry args={[0.092,0.01,0.03]}/><meshStandardMaterial color="#C68870" roughness={0.7} flatShading/></mesh></group>
        <group position={[0,0.07,-0.01]}><mesh position={[0,0.13,-0.02]} scale={[1.02,0.72,1.02]}><sphereGeometry args={[0.37,9,8]}/><meshStandardMaterial color="#1D4ED8" roughness={0.55} flatShading/></mesh>
          {hairSpikes.map((spike,idx)=>{ const color=spike.variant==="hi"?"#60A5FA":spike.variant==="shadow"?"#1E3A8A":"#2563EB"; return <mesh key={idx} position={spike.pos} rotation={spike.rot} scale={spike.scale} castShadow><coneGeometry args={[0.85,1.6,5]}/><meshStandardMaterial color={color} roughness={0.5} flatShading/></mesh>; })}
        </group>
      </group>
    </group>
    </group>
  );
};

// ---------- UI helpers ----------
const Title: React.FC<{ text: string; color?: string; top?: number; size?: number }> = ({ text, color="#FACC15", top=90, size=52 }) => (
  <div style={{ position:"absolute", top, left:60, right:60, textAlign:"center", fontFamily:"Arial Black,Arial,sans-serif", fontSize:size, color, lineHeight:1.1, textShadow:"0 4px 0 #000, 2px 2px 0 #000, -2px -2px 0 #000, 0 8px 20px rgba(0,0,0,0.7)", whiteSpace:"pre-line" }}>{text}</div>
);
const Subtitles: React.FC = () => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const t = frame/fps;
  if (t > 74.5) return null;
  const idx = WORDS.findIndex(w=>w.offset>t); const end = idx===-1?WORDS.length:idx;
  const slice = WORDS.slice(Math.max(0,end-7), end).filter(w=>t-w.offset<3.5);
  const line = slice.map(w=>w.text).join(" ");
  if(!line) return null;
  return <div style={{ position:"absolute", bottom:110, left:50, right:50, textAlign:"center", fontFamily:"Arial Black,Arial,sans-serif", fontSize:38, lineHeight:1.25, color:"#FFFFFF", textShadow:"0 3px 10px rgba(0,0,0,0.9)", padding:"12px 16px", borderRadius:14, background:"rgba(0,0,0,0.35)" }}>{line}</div>;
};

// ---------- 3D primitives ----------
const StageLights: React.FC<{ tint?: string }> = ({ tint="#7B6CFF" }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const t=frame/fps;
  return <>
    <ambientLight color="#C8C0FF" intensity={0.35} />
    <pointLight position={[Math.cos(t*1.4)*2.4, 2.1+Math.sin(t*2.1)*0.35, 1.8]} color={tint} intensity={4.2} distance={9} />
    <pointLight position={[Math.sin(t*1.2+1.5)*2.4, 1.6, -1.2]} color="#FF5C8A" intensity={3.2} distance={9} />
    <pointLight position={[0,2.8,2.6]} color="#5ED3FF" intensity={2.0} distance={10} />
  </>;
};
const BackWall: React.FC<{ color?: string }> = ({ color="#0B1630" }) => (
  <><color attach="background" args={[color]} /><fog attach="fog" args={[color,5.5,14]} />
  <mesh position={[0,-0.06,0]} receiveShadow><cylinderGeometry args={[1.55,1.72,0.12,24]} /><meshStandardMaterial color="#1E1833" roughness={0.65} metalness={0.2} flatShading /></mesh>
  <mesh position={[0,1.8,-2.4]} receiveShadow><boxGeometry args={[6.5,4.5,0.25]} /><meshStandardMaterial color="#111A33" roughness={0.85} flatShading /></mesh></>
);

const Cam: React.FC<{ z?:number; y?:number; x?:number; lookY?:number }> = ({ z=3.6, y=1.5, x=0, lookY=1.4 }) => {
  const frame=useCurrentFrame(); const {fps}=useVideoConfig(); const t=frame/fps;
  const {camera}=useThree(); const cam=camera as THREE.PerspectiveCamera;
  cam.position.set(x+Math.sin(t*0.5)*0.08, y+Math.sin(t*0.4)*0.03, z);
  cam.lookAt(0,lookY,0); cam.fov=34; cam.updateProjectionMatrix(); return null;
};

// ---------- Scenes ----------
const Scene1: React.FC = () => { // 0-7s
  const f=useCurrentFrame(); const o=interpolate(f,[0,20],[0,1],{extrapolateRight:"clamp"});
  return <AbsoluteFill style={{opacity:o}}>
    <ThreeCanvas width={1080} height={1920} shadows camera={{position:[0,1.5,3.4],fov:34}}>
      <BackWall color="#050A18"/><StageLights tint="#4A78FF"/>
      <MikeChibiSinger frame={f} fps={30} pos={[0,0,0]} scale={1}/>
      <Cam z={3.2-interpolate(f,[0,210],[0,0.4],{extrapolateRight:"clamp"})} />
    </ThreeCanvas>
    <Title text={"DEFINIU UMA GERAÇÃO\nINTEIRA"} color="#FACC15" />
  </AbsoluteFill>;
};

const Scene2: React.FC = () => { // 7-14s
  const f=useCurrentFrame();
  return <AbsoluteFill>
    <ThreeCanvas width={1080} height={1920} shadows camera={{position:[0,1.5,3.6],fov:34}}>
      <BackWall color="#081433"/><StageLights tint="#3B82F6"/>
      <MikeChibiSinger frame={f+210} fps={30} pos={[-0.8,0,0.2]} scale={0.95}/>
      <mesh position={[1.1,1.4,-1.2]}><boxGeometry args={[1.2,1.6,0.08]}/><meshStandardMaterial color="#B91C1C"/></mesh>
      <Cam z={3.6} x={0.2}/>
    </ThreeCanvas>
    <Title text={"HYBRID THEORY • 2000"} color="#FACC15" size={48}/>
  </AbsoluteFill>;
};

const Scene3: React.FC = () => { // 14-21s
  const f=useCurrentFrame();
  return <AbsoluteFill>
    <ThreeCanvas width={1080} height={1920} shadows camera={{position:[0,1.4,3.8],fov:34}}>
      <BackWall color="#071022"/><StageLights tint="#60A5FA"/>
      {/* desk + keyboard */}
      <mesh position={[0,0.55,-0.2]}><boxGeometry args={[2.2,0.08,0.8]}/><meshStandardMaterial color="#1F2937"/></mesh>
      <mesh position={[0,0.65,-0.15]}><boxGeometry args={[1.4,0.08,0.35]}/><meshStandardMaterial color="#111827"/></mesh>
      {Array.from({length:10}).map((_,i)=><mesh key={i} position={[-0.5+i*0.11,0.7,-0.05]}><boxGeometry args={[0.08,0.02,0.18]}/><meshStandardMaterial color={i%3===0?"#111":"#F3F4F6"}/></mesh>)}
      <MikeChibiSinger frame={f+420} fps={30} pos={[0,0,0.2]} scale={0.9}/>
      <Cam z={3.5} y={1.35}/>
    </ThreeCanvas>
    <Title text={"ANTES DO ESTÚDIO:\nO QUARTO"} color="#FACC15" size={46}/>
  </AbsoluteFill>;
};

const Scene4: React.FC = () => { // 21-26s
  const f=useCurrentFrame(); const showGuitar = f>75;
  return <AbsoluteFill>
    <ThreeCanvas width={1080} height={1920} shadows camera={{position:[0,1.4,3.2],fov:34}}>
      <BackWall color="#050B18"/><StageLights tint="#93C5FD"/>
      {!showGuitar ? <group position={[0,0.9,0]}>{Array.from({length:12}).map((_,i)=><mesh key={i} position={[-0.66+i*0.12,0,-0.1]}><boxGeometry args={[0.09,0.03,0.4]}/><meshStandardMaterial color={i%3===0?"#111":"#F3F4F6"}/></mesh>)}<mesh position={[0,-0.05,-0.2]}><boxGeometry args={[1.8,0.12,0.6]}/><meshStandardMaterial color="#111827"/></mesh></group>
      : <group position={[0,1.1,0]} rotation={[0,0,-0.2]}><mesh><boxGeometry args={[0.7,0.9,0.12]}/><meshStandardMaterial color="#DC2626"/></mesh><mesh position={[0,0.85,0]}><boxGeometry args={[0.18,1.0,0.1]}/><meshStandardMaterial color="#111827"/></mesh></group>}
      <Cam z={3.0} y={1.4}/>
    </ThreeCanvas>
    <Title text={showGuitar?"GUITARRA":"TECLADO"} color="#FACC15"/>
  </AbsoluteFill>;
};

const Scene5: React.FC = () => { // 26-38s
  const f=useCurrentFrame();
  return <AbsoluteFill>
    <ThreeCanvas width={1080} height={1920} shadows camera={{position:[0,1.5,3.6],fov:34}}>
      <BackWall color="#0A1024"/><StageLights tint="#F59E0B"/>
      <MikeChibiSinger frame={f+780} fps={30} pos={[0,0,0]} scale={1}/>
      <Cam z={3.4-interpolate(f,[0,360],[0,0.3],{extrapolateRight:"clamp"})}/>
    </ThreeCanvas>
    <Title text={"O INÍCIO"} color="#FACC15"/>
  </AbsoluteFill>;
};

const Scene6: React.FC = () => { // 38-47s
  const f=useCurrentFrame();
  return <AbsoluteFill>
    <ThreeCanvas width={1080} height={1920} shadows camera={{position:[0,1.5,3.6],fov:34}}>
      <BackWall color="#0A0F1C"/><StageLights tint="#EF4444"/>
      <mesh position={[1.0,1.5,-1.2]}><boxGeometry args={[1.2,1.0,0.08]}/><meshStandardMaterial color="#B91C1C"/></mesh>
      <MikeChibiSinger frame={f+1140} fps={30} pos={[-0.9,0,0.2]} scale={0.9}/>
      <Cam z={3.5} x={0.1}/>
    </ThreeCanvas>
    <Title text={"XERO"} color="#FACC15"/>
    <div style={{position:"absolute",top:160,left:0,right:0,textAlign:"center",fontFamily:"Arial Black",fontSize:34,color:"#FFFFFF",textShadow:"0 3px 8px #000"}}>NINGUÉM QUERIA</div>
  </AbsoluteFill>;
};

const Scene7: React.FC = () => { // 47-55s
  const f=useCurrentFrame();
  return <AbsoluteFill>
    <ThreeCanvas width={1080} height={1920} shadows camera={{position:[0,1.5,3.5],fov:34}}>
      <BackWall color="#0B1328"/><StageLights tint="#A78BFA"/>
      <MikeChibiSinger frame={f+1410} fps={30} pos={[0,0,0]} scale={1}/>
      <Cam z={3.3}/>
    </ThreeCanvas>
    <Title text={"ESSAS MÚSICAS\nSOAM BEM"} color="#FACC15" size={46}/>
  </AbsoluteFill>;
};

const Scene8: React.FC = () => { // 55-64s
  const f=useCurrentFrame();
  return <AbsoluteFill>
    <ThreeCanvas width={1080} height={1920} shadows camera={{position:[0,1.5,3.4],fov:34}}>
      <BackWall color="#120A1A"/><StageLights tint="#EF4444"/>
      <MikeChibiSinger frame={f+1650} fps={30} pos={[0,0,0]} scale={1.05}/>
      <Cam z={3.1} x={Math.sin(f*0.02)*0.15}/>
    </ThreeCanvas>
    <Title text={"CRAWLING"} color="#FACC15"/>
    <div style={{position:"absolute",top:160,left:0,right:0,textAlign:"center",fontFamily:"Arial Black",fontSize:34,color:"#FFFFFF",textShadow:"0 3px 8px #000"}}>NASCIDA DE BLUE</div>
  </AbsoluteFill>;
};

const Scene9: React.FC = () => { // 64-69s
  const f=useCurrentFrame();
  return <AbsoluteFill>
    <ThreeCanvas width={1080} height={1920} shadows camera={{position:[0,1.5,3.5],fov:34}}>
      <BackWall color="#120D05"/><StageLights tint="#FACC15"/>
      <mesh position={[0,1.2,-0.8]}><cylinderGeometry args={[0.03,0.03,1.4,8]}/><meshStandardMaterial color="#444"/></mesh>
      <mesh position={[0,1.95,-0.8]}><sphereGeometry args={[0.12,12,12]}/><meshStandardMaterial color="#FACC15" metalness={0.9} roughness={0.2}/></mesh>
      <MikeChibiSinger frame={f+1920} fps={30} pos={[-0.9,0,0.2]} scale={0.9}/>
      <Cam z={3.4}/>
    </ThreeCanvas>
    <Title text={"GRAMMY • 2002"} color="#FACC15"/>
  </AbsoluteFill>;
};

const Scene10: React.FC = () => { // 69-74s
  const f=useCurrentFrame();
  return <AbsoluteFill>
    <ThreeCanvas width={1080} height={1920} shadows camera={{position:[0,1.6,3.8],fov:34}}>
      <BackWall color="#0F1028"/><StageLights tint="#A855F7"/>
      <MikeChibiSinger frame={f+2070} fps={30} pos={[0,0,0]} scale={0.95}/>
      <Cam z={3.6+interpolate(f,[0,150],[0,0.5],{extrapolateRight:"clamp"})} y={1.6}/>
    </ThreeCanvas>
    <Title text={"UM QUARTO, UM TECLADO,\nMILHÕES DE VOZES"} color="#FACC15" size={42}/>
  </AbsoluteFill>;
};

const Scene11: React.FC = () => { // 74-78s
  const f=useCurrentFrame(); const o=interpolate(f,[90,120],[1,0],{extrapolateLeft:"clamp",extrapolateRight:"clamp"});
  return <AbsoluteFill style={{opacity:o, backgroundColor:"#D6D3D1"}}>
    <ThreeCanvas width={1080} height={1920} shadows camera={{position:[0,1.5,3.5],fov:34}}>
      <color attach="background" args={["#D6D3D1"]}/>
      <ambientLight intensity={0.8}/><pointLight position={[0,3,3]} intensity={2} color="#FFFFFF"/>
      <MikeChibiSinger frame={f+2220} fps={30} pos={[0,0,0]} scale={1}/>
      <Cam z={3.4}/>
    </ThreeCanvas>
    <Title text={"QUAL MÚSICA MARCOU\nA SUA VIDA?"} color="#FACC15" size={48}/>
  </AbsoluteFill>;
};

export const LinkinParkHistoriaGeracao: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#050A18" }}>
      <Sequence from={0} durationInFrames={210}><Scene1/></Sequence>
      <Sequence from={210} durationInFrames={210}><Scene2/></Sequence>
      <Sequence from={420} durationInFrames={210}><Scene3/></Sequence>
      <Sequence from={630} durationInFrames={150}><Scene4/></Sequence>
      <Sequence from={780} durationInFrames={360}><Scene5/></Sequence>
      <Sequence from={1140} durationInFrames={270}><Scene6/></Sequence>
      <Sequence from={1410} durationInFrames={240}><Scene7/></Sequence>
      <Sequence from={1650} durationInFrames={270}><Scene8/></Sequence>
      <Sequence from={1920} durationInFrames={150}><Scene9/></Sequence>
      <Sequence from={2070} durationInFrames={150}><Scene10/></Sequence>
      <Sequence from={2220} durationInFrames={120}><Scene11/></Sequence>
      <Audio src={staticFile("linkin-park-historia-geracao/voice.wav")} volume={1}/>
      <Audio src={staticFile("linkin-park-historia-geracao/bgm.wav")} volume={0.18} loop/>
      <Subtitles/>
    </AbsoluteFill>
  );
};

export default LinkinParkHistoriaGeracao;