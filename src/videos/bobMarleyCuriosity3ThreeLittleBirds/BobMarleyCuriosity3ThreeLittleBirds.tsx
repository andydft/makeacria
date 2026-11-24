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
import wordsData from "../../../public/bob-marley-curiosity-3-three-little-birds/words.json";

export const BMC3_FPS = 30;
export const BMC3_FRAMES = 960;

const smooth = (t: number) => { const u = Math.max(0, Math.min(1, t)); return u * u * (3 - 2 * u); };
const makeBloom = () => new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.38, luminanceThreshold: 0.88, luminanceSmoothing: 0.25, mipmapBlur: true, levels: 4, radius: 0.6 });

const Card: React.FC<{ tex: THREE.Texture | null; pos: [number, number, number]; scale?: number | [number, number, number]; rot?: [number, number, number] }> = ({ tex, pos, scale = 1, rot = [0, 0, 0] }) => {
  if (!tex) return null;
  return <mesh position={pos} rotation={rot} scale={scale as any} layers={NOINK}><planeGeometry args={[2.2, 3.3]} /><meshBasicMaterial map={tex} transparent alphaTest={0.05} side={THREE.DoubleSide} /></mesh>;
};

const Bird: React.FC<{ pos: [number, number, number]; color?: string; flap?: number }> = ({ pos, color = "#FDE68A", flap = 0 }) => (
  <group position={pos}>
    <mesh><sphereGeometry args={[0.12, 16, 16]} /><meshStandardMaterial color={color} /></mesh>
    <mesh position={[0.12, 0.02, 0]} rotation={[0, 0, -0.3]}><coneGeometry args={[0.04, 0.1, 8]} /><meshStandardMaterial color="#F59E0B" /></mesh>
    <mesh position={[-0.15, 0.05 + flap, 0]} rotation={[0, 0, 0.6 + flap]}><boxGeometry args={[0.22, 0.03, 0.12]} /><meshStandardMaterial color={color} /></mesh>
    <mesh position={[0.15, 0.05 + flap, 0]} rotation={[0, 0, -0.6 - flap]}><boxGeometry args={[0.22, 0.03, 0.12]} /><meshStandardMaterial color={color} /></mesh>
  </group>
);

const MusicNote: React.FC<{ pos: [number, number, number]; color?: string }> = ({ pos, color = "#FFFFFF" }) => (
  <group position={pos}>
    <mesh><sphereGeometry args={[0.08, 12, 12]} /><meshBasicMaterial color={color} /></mesh>
    <mesh position={[0.05, 0.18, 0]}><boxGeometry args={[0.03, 0.28, 0.03]} /><meshBasicMaterial color={color} /></mesh>
  </group>
);

const SceneScenery: React.FC = () => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[28, 18]} />
      <meshStandardMaterial color="#7BC96F" roughness={0.95} />
    </mesh>
    <mesh position={[0, 4.2, -6.5]}><planeGeometry args={[30, 10]} /><meshBasicMaterial color="#87CEEB" /></mesh>
    <mesh position={[0, 6.2, -6.4]}><circleGeometry args={[1.2, 32]} /><meshBasicMaterial color="#FFD54F" /></mesh>
    {/* palm trees */}
    {[[-5.5,0,-4.2],[5.5,0,-4.0],[-7.5,0,-5.5]].map((p,i)=>(
      <group key={i} position={p as any}>
        <mesh position={[0,1.6,0]}><cylinderGeometry args={[0.12,0.16,3.2,10]} /><meshStandardMaterial color="#8D6E63" /></mesh>
        {[0,1,2,3,4].map(j=>(<mesh key={j} position={[Math.sin(j*1.256)*0.55,3.2,Math.cos(j*1.256)*0.2]} rotation={[0.8, j*1.256, 0]}><boxGeometry args={[0.25,0.9,0.05]} /><meshStandardMaterial color="#2E7D32" /></mesh>))}
      </group>
    ))}
    {/* window */}
    <group position={[0,2.4,-3.8]}>
      <mesh><boxGeometry args={[3.2,2.4,0.2]} /><meshStandardMaterial color="#F5DEB3" /></mesh>
      <mesh position={[0,0,0.11]}><planeGeometry args={[2.8,2.0]} /><meshBasicMaterial color="#CFEFFF" /></mesh>
      <mesh position={[0,0,0.12]}><boxGeometry args={[0.08,2.0,0.04]} /><meshStandardMaterial color="#FFFFFF" /></mesh>
      <mesh position={[0,0,0.12]}><boxGeometry args={[2.8,0.08,0.04]} /><meshStandardMaterial color="#FFFFFF" /></mesh>
    </group>
  </group>
);

const BobCard: React.FC<{ frame: number }> = ({ frame }) => {
  const singCycle = Math.sin(frame * 0.22);
  const mouthShape: "neutral" | "open" | "smile" = singCycle > 0.2 ? "open" : "smile";
  const blink = frame % 120 > 114 ? 0.08 : 1;
  const tex = useSvgTexture(
    <BobMarleyV1 width={512} height={768} eyeOpen={blink} mouthShape={mouthShape} />,
    ["bob-3birds", Math.round(frame / 3), mouthShape, blink < 0.5 ? 1 : 0],
    512, 768
  );
  return <Card tex={tex} pos={[0, 1.70, 0]} scale={1.02} />;
};

const CameraRig: React.FC<{ frame: number }> = ({ frame }) => {
  const { camera } = useThree();
  const t = frame / BMC3_FRAMES;
  let cam = { x: 0, y: 2.9, z: 10.5, lx: 0, ly: 2.1, lz: 0, fov: 44 };
  if (t < 0.12) { const p = smooth(t/0.12); cam = { x: -1.2+p*0.6, y: 3.0, z: 11.0-p*0.7, lx: 0, ly: 2.1, lz: 0, fov: 45 }; }
  else if (t < 0.22) { cam = { x: 0, y: 2.6, z: 7.8, lx: 0, ly: 2.3, lz: 0.2, fov: 38 }; }
  else if (t < 0.38) { const p = smooth((t-0.22)/0.16); cam = { x: 1.2-p*2.4, y: 2.9, z: 9.8, lx: 0, ly: 2.2, lz: -0.2, fov: 44 }; }
  else if (t < 0.52) { cam = { x: -0.8, y: 3.2, z: 9.0, lx: -0.5, ly: 2.8, lz: -1.5, fov: 42 }; } // birds/window
  else if (t < 0.68) { const p = smooth((t-0.52)/0.16); cam = { x: -1.0+p*2.0, y: 2.8, z: 9.2, lx: 0, ly: 2.1, lz: 0, fov: 43 }; }
  else if (t < 0.82) { cam = { x: 0.2, y: 2.6, z: 7.6, lx: 0, ly: 2.35, lz: 0.2, fov: 37 }; }
  else { const p = smooth((t-0.82)/0.18); cam = { x: 0, y: 3.1, z: 10.8-p*0.6, lx: 0, ly: 2.1, lz: 0, fov: 46 }; }
  camera.position.set(cam.x, cam.y, cam.z);
  camera.lookAt(cam.lx, cam.ly, cam.lz);
  if ("fov" in camera) { (camera as THREE.PerspectiveCamera).fov = cam.fov; camera.updateProjectionMatrix(); }
  return null;
};

const Effects: React.FC = () => {
  const { scene, camera } = useThree();
  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera, { strength: 0.52, widthNear: 3.4, widthFar: 2.2 }),
    lens: new LensBlur({ maxCoC: 9, nearScale: 0.7 }),
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

const Subtitle: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const words = (wordsData as any).words as { text: string; offset: number; duration: number }[];
  const active = words.filter(w => t >= w.offset - 0.05 && t <= w.offset + w.duration + 0.15);
  const recent = words.filter(w => w.offset <= t).slice(-6);
  const line = (active.length ? active : recent).map(w => w.text).join(" ");
  if (!line) return null;
  return <div style={{ position: "absolute", bottom: 110, left: 60, right: 60, textAlign: "center", fontFamily: "Arial Black, Arial, sans-serif", fontSize: 42, lineHeight: 1.25, color: "#FFFFFF", textShadow: "0 4px 18px rgba(0,0,0,0.55)", padding: "18px 24px", borderRadius: 20, background: "rgba(17,24,39,0.30)" }}>{line}</div>;
};

const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 8, 70, 90], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <div style={{ position: "absolute", top: 100, left: 50, right: 50, textAlign: "center", opacity }}>
    <div style={{ fontFamily: "Arial Black, Arial, sans-serif", fontSize: 42, color: "#FFFFFF", textShadow: "0 3px 14px rgba(0,0,0,0.45)", background: "rgba(46,125,50,0.85)", borderRadius: 24, padding: "20px", border: "3px solid #FFD54F" }}>
      A história feliz por trás de Three Little Birds 🐦
      <div style={{ fontSize: 28, marginTop: 10, color: "#FFF9C4", fontFamily: "Arial, sans-serif" }}>Curte e compartilha essa história boa!</div>
    </div>
  </div>;
};

const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const flap = Math.sin(frame * 0.25) * 0.08;
  return (
    <>
      <ThreeCanvas width={width} height={height} frameloop="demand" dpr={1.0}
        shadows gl={{ antialias: false, alpha: false, powerPreference: "high-performance", toneMapping: THREE.NoToneMapping, outputColorSpace: THREE.SRGBColorSpace }}
        camera={{ fov: 44, position: [0, 3.0, 10.5], near: 0.1, far: 60 }}
        onCreated={({ gl }) => { gl.setClearColor(0x87CEEB, 1); gl.shadowMap.enabled = true; gl.shadowMap.type = THREE.PCFSoftShadowMap; }}
      >
        <CameraRig frame={frame} />
        <color attach="background" args={["#87CEEB"]} />
        <fog attach="fog" args={["#87CEEB", 14, 45]} />
        <ambientLight intensity={0.78} />
        <directionalLight position={[5, 10, 6]} intensity={1.2} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
        <SceneScenery />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0.1]} layers={NOINK}>
          <circleGeometry args={[0.55, 32]} /><meshBasicMaterial color="#000000" transparent opacity={0.16} />
        </mesh>
        <BobCard frame={frame} />
        <Bird pos={[-1.2 + Math.sin(frame*0.02)*0.2, 3.2 + Math.sin(frame*0.04)*0.1, -2.2]} color="#FDE68A" flap={flap} />
        <Bird pos={[0 + Math.sin(frame*0.018+1)*0.25, 3.45 + Math.sin(frame*0.035)*0.12, -2.0]} color="#FCD34D" flap={-flap} />
        <Bird pos={[1.1 + Math.sin(frame*0.022+2)*0.2, 3.1 + Math.sin(frame*0.045)*0.1, -2.3]} color="#FDE68A" flap={flap} />
        <MusicNote pos={[-1.8, 2.8 + Math.sin(frame*0.05)*0.1, -0.8]} />
        <MusicNote pos={[1.9, 3.0 + Math.sin(frame*0.045+1)*0.1, -0.9]} color="#FFD54F" />
        <Effects />
      </ThreeCanvas>
      <Hook />
      <Subtitle />
    </>
  );
};

export const BobMarleyCuriosity3ThreeLittleBirds: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#87CEEB" }}>
    <Audio src={staticFile("bob-marley-curiosity-3-three-little-birds/voice.wav")} />
    <Scene />
  </AbsoluteFill>
);
export default BobMarleyCuriosity3ThreeLittleBirds;
