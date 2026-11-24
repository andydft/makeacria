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
import wordsData from "../../../public/bob-marley-curiosity-2-football/words.json";

export const BMC2_FPS = 30;
export const BMC2_FRAMES = 1120;

const smooth = (t: number) => { const u = Math.max(0, Math.min(1, t)); return u * u * (3 - 2 * u); };
const makeBloom = () => new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.35, luminanceThreshold: 0.88, luminanceSmoothing: 0.25, mipmapBlur: true, levels: 4, radius: 0.6 });

const Card: React.FC<{ tex: THREE.Texture | null; pos: [number, number, number]; scale?: number | [number, number, number]; rot?: [number, number, number] }> = ({ tex, pos, scale = 1, rot = [0, 0, 0] }) => {
  if (!tex) return null;
  return <mesh position={pos} rotation={rot} scale={scale as any} layers={NOINK}><planeGeometry args={[2.2, 3.3]} /><meshBasicMaterial map={tex} transparent alphaTest={0.05} side={THREE.DoubleSide} /></mesh>;
};

const Football: React.FC<{ pos: [number, number, number] }> = ({ pos }) => (
  <group position={pos}>
    <mesh castShadow>
      <sphereGeometry args={[0.28, 24, 24]} />
      <meshStandardMaterial color="#F5F5F5" roughness={0.6} />
    </mesh>
    {[[0,0,0.285],[0,0,-0.285],[0.285,0,0],[-0.285,0,0],[0,0.285,0],[0,-0.285,0]].map((p,i)=>(
      <mesh key={i} position={p as any} rotation={[i*0.5, i*0.3, 0]}>
        <circleGeometry args={[0.07, 5]} />
        <meshBasicMaterial color="#1F2937" />
      </mesh>
    ))}
  </group>
);

const Pitch: React.FC = () => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[24, 16]} />
      <meshStandardMaterial color="#2E7D32" roughness={0.95} />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
      <ringGeometry args={[1.8, 1.9, 48]} />
      <meshBasicMaterial color="#FFFFFF" transparent opacity={0.8} />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
      <planeGeometry args={[0.08, 12]} />
      <meshBasicMaterial color="#FFFFFF" transparent opacity={0.8} />
    </mesh>
    <mesh position={[0, 2.8, -4.5]}>
      <planeGeometry args={[20, 7]} />
      <meshBasicMaterial color="#87CEEB" />
    </mesh>
    <mesh position={[0, 0.8, -4.4]}>
      <planeGeometry args={[20, 3]} />
      <meshBasicMaterial color="#4CAF50" />
    </mesh>
  </group>
);

const BobCard: React.FC<{ frame: number }> = ({ frame }) => {
  const bob = Math.sin(frame * 0.05) * 0.03;
  const singCycle = Math.sin(frame * 0.16);
  const mouthShape: "neutral" | "open" | "smile" = singCycle > 0.3 ? "open" : singCycle > -0.2 ? "smile" : "neutral";
  const blink = frame % 130 > 124 && frame % 130 < 129 ? 0.08 : 1;
  const tex = useSvgTexture(<BobMarleyV1 width={512} height={768} eyeOpen={blink} mouthShape={mouthShape} shirtColor="#1B8A3A" adidasStripes />, ["bob-football", Math.round(frame / 2), mouthShape], 512, 768);
  return <Card tex={tex} pos={[0, 2.05 + bob, 0]} scale={1.02} />;
};

const CameraRig: React.FC<{ frame: number }> = ({ frame }) => {
  const { camera } = useThree();
  const t = frame / BMC2_FRAMES;
  let cam = { x: 0, y: 3.0, z: 10.5, lx: 0, ly: 2.1, lz: 0, fov: 44 };
  if (t < 0.15) { const p = smooth(t / 0.15); cam = { x: -0.8 + p * 0.8, y: 3.2, z: 11.5 - p * 1.0, lx: 0, ly: 2.1, lz: 0, fov: 46 }; }
  else if (t < 0.4) { const p = smooth((t - 0.15) / 0.25); cam = { x: 0.6 - p * 1.2, y: 2.9, z: 9.8, lx: 0, ly: 2.2, lz: 0, fov: 43 }; }
  else if (t < 0.65) { const p = smooth((t - 0.4) / 0.25); cam = { x: -0.5 + p * 1.0, y: 3.0, z: 10.2, lx: 0, ly: 2.15, lz: 0, fov: 44 }; }
  else if (t < 0.85) { cam = { x: 0, y: 2.7, z: 8.8, lx: 0, ly: 2.3, lz: 0.2, fov: 40 }; }
  else { const p = smooth((t - 0.85) / 0.15); cam = { x: 0, y: 3.2, z: 11.0 - p * 0.5, lx: 0, ly: 2.1, lz: 0, fov: 46 }; }
  camera.position.set(cam.x, cam.y, cam.z);
  camera.lookAt(cam.lx, cam.ly, cam.lz);
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
  return <div style={{ position: "absolute", bottom: 110, left: 60, right: 60, textAlign: "center", fontFamily: "Arial Black, Arial, sans-serif", fontSize: 44, lineHeight: 1.25, color: "#FFFFFF", textShadow: "0 4px 18px rgba(0,0,0,0.55)", padding: "18px 24px", borderRadius: 20, background: "rgba(17,24,39,0.35)" }}>{line}</div>;
};

const HookOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 10, 75, 95], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", top: 120, left: 50, right: 50, textAlign: "center", opacity }}>
      <div style={{ fontFamily: "Arial Black, Arial, sans-serif", fontSize: 44, color: "#FFFFFF", textShadow: "0 3px 14px rgba(0,0,0,0.5)", background: "rgba(27,138,58,0.82)", borderRadius: 24, padding: "22px 20px", border: "3px solid #F2C200" }}>
        Bob Marley amava futebol!
        <div style={{ fontSize: 30, marginTop: 10, color: "#FFF9C4", fontFamily: "Arial, sans-serif" }}>Segue pra ver esse lado dele ⚽</div>
      </div>
    </div>
  );
};

const TitleCard: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [80, 100, 170, 200], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", top: 80, left: 0, right: 0, textAlign: "center", opacity }}>
      <div style={{ fontFamily: "Arial Black, Arial, sans-serif", fontSize: 50, color: "#FFFFFF", textShadow: "0 4px 18px rgba(0,0,0,0.6)" }}>BOB MARLEY ⚽ FUTEBOL</div>
      <div style={{ fontFamily: "Arial, sans-serif", fontSize: 30, color: "#FFF9C4", marginTop: 8 }}>Curiosidade #2</div>
    </div>
  );
};

const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <>
      <ThreeCanvas width={width} height={height} frameloop="demand" dpr={1.0}
        shadows gl={{ antialias: false, alpha: false, powerPreference: "high-performance", toneMapping: THREE.NoToneMapping, outputColorSpace: THREE.SRGBColorSpace }}
        camera={{ fov: 44, position: [0, 3.0, 10.5], near: 0.1, far: 60 }}
        onCreated={({ gl }) => { gl.setClearColor(0x87CEEB, 1); gl.shadowMap.enabled = true; gl.shadowMap.type = THREE.PCFSoftShadowMap; }}
      >
        <CameraRig frame={frame} />
        <color attach="background" args={["#87CEEB"]} />
        <fog attach="fog" args={["#87CEEB", 14, 40]} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 10, 6]} intensity={1.2} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
        <Pitch />
        <BobCard frame={frame} />
        <Football pos={[0.9, 0.28, 0.8]} />
        <Effects />
      </ThreeCanvas>
      <HookOverlay />
      <TitleCard />
      <Subtitle />
    </>
  );
};

export const BobMarleyCuriosity2Football: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#87CEEB" }}>
    <Audio src={staticFile("bob-marley-curiosity-2-football/voice.wav")} />
    <Scene />
  </AbsoluteFill>
);
export default BobMarleyCuriosity2Football;
