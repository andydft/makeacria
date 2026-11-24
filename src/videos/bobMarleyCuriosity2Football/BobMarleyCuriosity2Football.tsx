import React, { useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
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
export const BMC2_FRAMES = 960;

const smooth = (t: number) => { const u = Math.max(0, Math.min(1, t)); return u * u * (3 - 2 * u); };
const makeBloom = () => new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.42, luminanceThreshold: 0.86, luminanceSmoothing: 0.25, mipmapBlur: true, levels: 4, radius: 0.65 });

const Card: React.FC<{ tex: THREE.Texture | null; pos: [number, number, number]; scale?: number | [number, number, number]; rot?: [number, number, number] }> = ({ tex, pos, scale = 1, rot = [0, 0, 0] }) => {
  if (!tex) return null;
  return <mesh position={pos} rotation={rot} scale={scale as any} layers={NOINK}><planeGeometry args={[2.2, 3.3]} /><meshBasicMaterial map={tex} transparent alphaTest={0.05} side={THREE.DoubleSide} /></mesh>;
};

const Football: React.FC<{ pos: [number, number, number]; rot?: [number, number, number] }> = ({ pos, rot = [0, 0, 0] }) => (
  <group position={pos} rotation={rot}>
    <mesh castShadow>
      <sphereGeometry args={[0.28, 24, 24]} />
      <meshStandardMaterial color="#F5F5F5" roughness={0.55} />
    </mesh>
    {[[0,0,0.285],[0,0,-0.285],[0.285,0,0],[-0.285,0,0],[0,0.285,0],[0,-0.285,0]].map((p,i)=>(
      <mesh key={i} position={p as any} rotation={[i*0.5, i*0.3, 0]}>
        <circleGeometry args={[0.07, 5]} />
        <meshBasicMaterial color="#1F2937" />
      </mesh>
    ))}
  </group>
);

const BrazilFlag: React.FC<{ pos: [number, number, number]; scale?: number }> = ({ pos, scale = 1 }) => (
  <group position={pos} scale={scale}>
    <mesh><planeGeometry args={[1.6, 1.0]} /><meshBasicMaterial color="#1B8A3A" /></mesh>
    <mesh position={[0, 0, 0.01]} rotation={[0, 0, Math.PI / 4]}><planeGeometry args={[0.95, 0.95]} /><meshBasicMaterial color="#F2C200" /></mesh>
    <mesh position={[0, 0, 0.02]}><circleGeometry args={[0.28, 32]} /><meshBasicMaterial color="#1D4ED8" /></mesh>
    <mesh position={[0.02, 0.03, 0.03]} rotation={[0,0,-0.2]}><planeGeometry args={[0.52, 0.06]} /><meshBasicMaterial color="#FFFFFF" /></mesh>
  </group>
);

const Pitch: React.FC = () => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[28, 18]} />
      <meshStandardMaterial color="#2E8B3A" roughness={0.95} />
    </mesh>
    {/* field lines */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}><ringGeometry args={[2.2, 2.28, 56]} /><meshBasicMaterial color="#FFFFFF" transparent opacity={0.85} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}><planeGeometry args={[0.08, 14]} /><meshBasicMaterial color="#FFFFFF" transparent opacity={0.85} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -5.5]}><planeGeometry args={[10, 0.08]} /><meshBasicMaterial color="#FFFFFF" transparent opacity={0.7} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 5.5]}><planeGeometry args={[10, 0.08]} /><meshBasicMaterial color="#FFFFFF" transparent opacity={0.7} /></mesh>
    {/* sky/backdrop */}
    <mesh position={[0, 4.2, -6.5]}><planeGeometry args={[30, 10]} /><meshBasicMaterial color="#5BC0EB" /></mesh>
    <mesh position={[0, 1.3, -6.4]}><planeGeometry args={[30, 4]} /><meshBasicMaterial color="#8FD694" /></mesh>
    {/* stands */}
    {[-1, 1].map((side) => (
      <group key={side} position={[side * 7.5, 1.2, -4.8]}>
        <mesh><boxGeometry args={[3.2, 2.4, 3.5]} /><meshStandardMaterial color="#1F2937" roughness={0.9} /></mesh>
        {Array.from({ length: 18 }).map((_, i) => (
          <mesh key={i} position={[-1 + (i % 6) * 0.4, -0.7 + Math.floor(i / 6) * 0.45, 1.8]}>
            <boxGeometry args={[0.22, 0.22, 0.05]} />
            <meshBasicMaterial color={i % 3 === 0 ? "#F2C200" : i % 3 === 1 ? "#1B8A3A" : "#FFFFFF"} />
          </mesh>
        ))}
      </group>
    ))}
    {/* goal */}
    <group position={[0, 1.2, -5.2]}>
      <mesh position={[-2.2, 0, 0]}><boxGeometry args={[0.12, 2.4, 0.12]} /><meshStandardMaterial color="#FFFFFF" /></mesh>
      <mesh position={[2.2, 0, 0]}><boxGeometry args={[0.12, 2.4, 0.12]} /><meshStandardMaterial color="#FFFFFF" /></mesh>
      <mesh position={[0, 1.2, 0]}><boxGeometry args={[4.52, 0.12, 0.12]} /><meshStandardMaterial color="#FFFFFF" /></mesh>
    </group>
    <BrazilFlag pos={[-5.2, 2.8, -4.0]} scale={0.9} />
    <BrazilFlag pos={[5.2, 2.8, -4.0]} scale={0.9} />
  </group>
);

const BobCard: React.FC<{ frame: number }> = ({ frame }) => {
  const t = frame / BMC2_FRAMES;
  const kicking = (t > 0.38 && t < 0.52) || (t > 0.72 && t < 0.82);
  const pose = kicking ? "kick" : "stand";
  const singCycle = Math.sin(frame * 0.22);
  const mouthShape: "neutral" | "open" | "smile" = singCycle > 0.2 ? "open" : "smile";
  const blink = frame % 110 > 104 ? 0.08 : 1;
  const tex = useSvgTexture(
    <BobMarleyV1 width={512} height={768} eyeOpen={blink} mouthShape={mouthShape} shirtColor="#1B8A3A" adidasStripes pose={pose} />,
    ["bob-football-br2", Math.round(frame / 3), mouthShape, blink < 0.5 ? 1 : 0, pose],
    512, 768
  );
  // Grounded: card height 3.366, bottom = y - 1.683 => 0.02
  return <Card tex={tex} pos={[0, 1.70, 0]} scale={1.02} />;
};

const CameraRig: React.FC<{ frame: number }> = ({ frame }) => {
  const { camera } = useThree();
  const t = frame / BMC2_FRAMES;
  let cam = { x: 0, y: 2.9, z: 10.5, lx: 0, ly: 2.0, lz: 0, fov: 44 };
  if (t < 0.12) { const p = smooth(t / 0.12); cam = { x: -1.2 + p * 0.6, y: 2.9, z: 10.8 - p * 0.6, lx: 0, ly: 2.0, lz: 0, fov: 45 }; }
  else if (t < 0.22) { cam = { x: 0, y: 2.6, z: 7.8, lx: 0, ly: 2.25, lz: 0.2, fov: 38 }; } // front close
  else if (t < 0.35) { const p = smooth((t - 0.22) / 0.13); cam = { x: 1.0 - p * 2.0, y: 2.9, z: 9.8, lx: 0, ly: 2.0, lz: 0, fov: 44 }; }
  else if (t < 0.52) { cam = { x: 2.6, y: 2.2, z: 8.2, lx: 0.6, ly: 1.7, lz: 0.3, fov: 42 }; } // kick side
  else if (t < 0.65) { cam = { x: -0.3, y: 2.6, z: 7.6, lx: 0, ly: 2.3, lz: 0.2, fov: 37 }; } // Brazil close
  else if (t < 0.72) { cam = { x: 0, y: 4.8, z: 9.5, lx: 0, ly: 1.6, lz: -0.2, fov: 50 }; } // high
  else if (t < 0.82) { cam = { x: -2.4, y: 2.3, z: 8.4, lx: 0.2, ly: 1.7, lz: 0.3, fov: 42 }; } // kick other side
  else { const p = smooth((t - 0.82) / 0.18); cam = { x: 0.8 - p * 0.8, y: 2.9, z: 10.5 - p * 0.5, lx: 0, ly: 2.0, lz: 0, fov: 45 }; }
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
  return <div style={{ position: "absolute", bottom: 110, left: 60, right: 60, textAlign: "center", fontFamily: "Arial Black, Arial, sans-serif", fontSize: 42, lineHeight: 1.25, color: "#FFFFFF", textShadow: "0 4px 18px rgba(0,0,0,0.55)", padding: "18px 24px", borderRadius: 20, background: "rgba(17,24,39,0.35)" }}>{line}</div>;
};

const HookOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 8, 70, 90], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", top: 100, left: 50, right: 50, textAlign: "center", opacity }}>
      <div style={{ fontFamily: "Arial Black, Arial, sans-serif", fontSize: 42, color: "#FFFFFF", textShadow: "0 3px 14px rgba(0,0,0,0.5)", background: "rgba(27,138,58,0.88)", borderRadius: 24, padding: "20px 20px", border: "3px solid #F2C200" }}>
        Bob Marley amava futebol!
        <div style={{ fontSize: 30, marginTop: 10, color: "#FFF9C4", fontFamily: "Arial, sans-serif" }}>Curte e compartilha agora ⚽🇧🇷</div>
      </div>
    </div>
  );
};

const BrazilMoment: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  // show around when "veio até o Brasil" is said (~12-16s in new audio)
  const opacity = interpolate(t, [11.5, 12.2, 16.5, 17.5], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", top: 180, left: 80, right: 80, textAlign: "center", opacity }}>
      <div style={{ fontFamily: "Arial Black, Arial, sans-serif", fontSize: 48, color: "#F2C200", textShadow: "0 4px 20px rgba(0,0,0,0.6)", background: "rgba(0,0,0,0.28)", borderRadius: 20, padding: "16px" }}>
        ELE JOGOU NO BRASIL! 🇧🇷
      </div>
    </div>
  );
};

const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const t = frame / BMC2_FRAMES;
  let ballX = 0.65; let ballY = 0.28; let ballZ = 0.55;
  if (t > 0.40 && t < 0.56) { const p = (t - 0.40) / 0.16; ballX = 0.65 + p * 2.8; ballZ = 0.55 - p * 1.8; ballY = 0.28 + Math.sin(p * Math.PI) * 0.9; }
  else if (t >= 0.56 && t < 0.72) { ballX = 3.45; ballZ = -1.25; ballY = 0.28; }
  else if (t > 0.74 && t < 0.86) { const p = (t - 0.74) / 0.12; ballX = 0.65 + p * 2.2; ballZ = 0.55 - p * 1.2; ballY = 0.28 + Math.sin(p * Math.PI) * 0.7; }
  else if (t >= 0.86) { ballX = 2.85; ballZ = -0.65; ballY = 0.28; }
  return (
    <>
      <ThreeCanvas width={width} height={height} frameloop="demand" dpr={1.0}
        shadows gl={{ antialias: false, alpha: false, powerPreference: "high-performance", toneMapping: THREE.NoToneMapping, outputColorSpace: THREE.SRGBColorSpace }}
        camera={{ fov: 44, position: [0, 3.0, 10.5], near: 0.1, far: 60 }}
        onCreated={({ gl }) => { gl.setClearColor(0x5BC0EB, 1); gl.shadowMap.enabled = true; gl.shadowMap.type = THREE.PCFSoftShadowMap; }}
      >
        <CameraRig frame={frame} />
        <color attach="background" args={["#5BC0EB"]} />
        <fog attach="fog" args={["#5BC0EB", 14, 45]} />
        <ambientLight intensity={0.75} />
        <directionalLight position={[5, 10, 6]} intensity={1.25} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
        <pointLight position={[0, 5, 2]} intensity={0.5} color="#FFF7CC" distance={18} />
        <Pitch />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0.1]} layers={NOINK}>
          <circleGeometry args={[0.55, 32]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.18} />
        </mesh>
        <BobCard frame={frame} />
        <Football pos={[ballX, ballY, ballZ]} rot={[frame * 0.03, frame * 0.02, 0]} />
        <Effects />
      </ThreeCanvas>
      <HookOverlay />
      <BrazilMoment />
      <Subtitle />
    </>
  );
};

export const BobMarleyCuriosity2Football: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#5BC0EB" }}>
    <Audio src={staticFile("bob-marley-curiosity-2-football/voice.wav")} />
    <Scene />
  </AbsoluteFill>
);
export default BobMarleyCuriosity2Football;
