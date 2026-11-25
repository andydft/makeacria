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
import SonGokuGtV1 from "../../characters/presets/SonGokuGtV1";
import wordsData from "../../../public/dragon-ball-gt-goku-crianca/words.json";

export const DBGT_GOKU_CRIANCA_FPS = 30;
export const DBGT_GOKU_CRIANCA_FRAMES = 1320; // 44s, voice ~41.4s

const smooth = (t: number) => { const u = Math.max(0, Math.min(1, t)); return u * u * (3 - 2 * u); };
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

const Box: React.FC<{ pos: [number, number, number]; args: [number, number, number]; color: string; rot?: [number, number, number]; rough?: number; emissive?: string; emissiveIntensity?: number }> = ({ pos, args, color, rot = [0, 0, 0], rough = 0.85, emissive, emissiveIntensity = 0 }) => (
  <mesh position={pos} rotation={rot} castShadow receiveShadow><boxGeometry args={args} /><meshStandardMaterial color={color} roughness={rough} metalness={0.05} emissive={emissive} emissiveIntensity={emissiveIntensity} /></mesh>
);

const Card: React.FC<{ tex: THREE.Texture | null; pos: [number, number, number]; scale?: number | [number, number, number]; rot?: [number, number, number]; opacity?: number }> = ({ tex, pos, scale = 1, rot = [0, 0, 0], opacity = 1 }) => {
  if (!tex) return null;
  return <mesh position={pos} rotation={rot} scale={scale as any} layers={NOINK}><planeGeometry args={[2.2, 3.3]} /><meshBasicMaterial map={tex} transparent alphaTest={0.05} side={THREE.DoubleSide} opacity={opacity} /></mesh>;
};

const Stars: React.FC = () => {
  const positions = useMemo(() => {
    const arr = new Float32Array(450 * 3);
    for (let i = 0; i < 450; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 60;
      arr[i * 3 + 1] = Math.random() * 30 - 2;
      arr[i * 3 + 2] = -Math.random() * 40 - 5;
    }
    return arr;
  }, []);
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#FFFFFF" size={0.12} sizeAttenuation transparent opacity={0.9} />
    </points>
  );
};

const BlackStarBall: React.FC<{ pos: [number, number, number]; scale?: number; stars?: number }> = ({ pos, scale = 1, stars = 1 }) => {
  const starTex = useMemo(() => {
    const c = document.createElement("canvas"); c.width = 128; c.height = 128;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, 128, 128);
    ctx.fillStyle = "#111"; ctx.beginPath(); ctx.arc(64, 64, 60, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#DC2626";
    const drawStar = (cx: number, cy: number, r: number) => {
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + i * Math.PI * 2 / 5;
        const a2 = a + Math.PI / 5;
        ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
        ctx.lineTo(cx + Math.cos(a2) * r * 0.45, cy + Math.sin(a2) * r * 0.45);
      }
      ctx.closePath(); ctx.fill();
    };
    if (stars === 1) drawStar(64, 64, 28);
    if (stars === 2) { drawStar(46, 64, 18); drawStar(82, 64, 18); }
    if (stars === 4) { drawStar(48, 48, 14); drawStar(80, 48, 14); drawStar(48, 80, 14); drawStar(80, 80, 14); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true; return t;
  }, [stars]);
  return (
    <group position={pos} scale={scale}>
      <mesh>
        <sphereGeometry args={[0.32, 32, 24]} />
        <meshStandardMaterial color="#1F2937" roughness={0.2} metalness={0.2} emissive="#7F1D1D" emissiveIntensity={0.35} />
      </mesh>
      <mesh position={[0, 0, 0.31]}>
        <planeGeometry args={[0.36, 0.36]} />
        <meshBasicMaterial map={starTex} transparent />
      </mesh>
      <pointLight color="#EF4444" intensity={0.8} distance={2.5} />
    </group>
  );
};

const FlyingCloud: React.FC<{ frame: number }> = ({ frame }) => {
  const bob = Math.sin(frame * 0.06) * 0.08;
  return (
    <group position={[0, 0.72 + bob, 0.2]}>
      <mesh castShadow><sphereGeometry args={[1.05, 28, 20]} /><meshStandardMaterial color="#FCD34D" roughness={0.95} emissive="#F59E0B" emissiveIntensity={0.15} /></mesh>
      <mesh position={[-0.85, -0.08, 0]}><sphereGeometry args={[0.55, 20, 16]} /><meshStandardMaterial color="#FDE68A" roughness={0.95} /></mesh>
      <mesh position={[0.85, -0.08, 0]}><sphereGeometry args={[0.55, 20, 16]} /><meshStandardMaterial color="#FDE68A" roughness={0.95} /></mesh>
      <mesh position={[-0.45, 0.25, 0.2]}><sphereGeometry args={[0.45, 20, 16]} /><meshStandardMaterial color="#FEF3C7" roughness={0.95} /></mesh>
      <mesh position={[0.45, 0.25, 0.2]}><sphereGeometry args={[0.45, 20, 16]} /><meshStandardMaterial color="#FEF3C7" roughness={0.95} /></mesh>
    </group>
  );
};

const EarthProp: React.FC<{ frame: number; danger: number }> = ({ frame, danger }) => {
  const rot = frame * 0.003;
  return (
    <group position={[3.8, 3.8, -6]} rotation={[0.2, rot, 0]} scale={1.1 + danger * 0.05}>
      <mesh>
        <sphereGeometry args={[1.15, 32, 24]} />
        <meshStandardMaterial color={danger > 0.5 ? "#7F1D1D" : "#1D4ED8"} roughness={0.7} emissive={danger > 0.5 ? "#DC2626" : "#1E40AF"} emissiveIntensity={0.25 + danger * 0.5} />
      </mesh>
      <mesh scale={1.01}>
        <sphereGeometry args={[1.15, 24, 18]} />
        <meshBasicMaterial color="#22C55E" transparent opacity={danger > 0.5 ? 0.15 : 0.35} wireframe />
      </mesh>
      {danger > 0.1 && <pointLight color="#EF4444" intensity={danger * 2.5} distance={8} />}
    </group>
  );
};

const GokuCard: React.FC<{ frame: number }> = ({ frame }) => {
  const bob = Math.sin(frame * 0.05) * 0.03;
  const tex = useSvgTexture(<SonGokuGtV1 width={512} height={768} />, ["goku-gt-v1", 0], 512, 768);
  return <Card tex={tex} pos={[0, 2.35 + bob, 0.45]} scale={1.08} />;
};

const SceneWorld: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / DBGT_GOKU_CRIANCA_FRAMES;

  const danger = smooth(clamp01((t - 0.52) / 0.08)) * (1 - smooth(clamp01((t - 0.78) / 0.08)));
  const spaceBlend = smooth(clamp01((t - 0.45) / 0.1));

  const ballOrbit = frame * 0.01;
  const ballsVisible = t > 0.08;

  return (
    <group>
      <Stars />
      {/* Ground/platform */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[8, 48]} />
        <meshStandardMaterial color={spaceBlend > 0.5 ? "#111827" : "#1E3A5F"} roughness={0.95} metalness={0.02} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[2.2, 2.35, 64]} />
        <meshBasicMaterial color="#F59E0B" transparent opacity={0.45} />
      </mesh>

      {/* Backdrop */}
      <mesh position={[0, 4, -10]}>
        <planeGeometry args={[40, 24]} />
        <meshBasicMaterial color="#0B1020" />
      </mesh>

      <EarthProp frame={frame} danger={danger} />

      {ballsVisible && (
        <group>
          <BlackStarBall pos={[Math.cos(ballOrbit) * 3.2, 2.8 + Math.sin(frame * 0.04) * 0.2, -1.5 + Math.sin(ballOrbit) * 0.8]} scale={0.9} stars={1} />
          <BlackStarBall pos={[Math.cos(ballOrbit + 2.1) * 3.5, 3.4 + Math.sin(frame * 0.035) * 0.2, -2 + Math.sin(ballOrbit + 2.1) * 0.8]} scale={0.75} stars={2} />
          <BlackStarBall pos={[Math.cos(ballOrbit + 4.2) * 3.0, 2.2 + Math.sin(frame * 0.045) * 0.2, -1.2 + Math.sin(ballOrbit + 4.2) * 0.8]} scale={0.8} stars={4} />
        </group>
      )}

      <FlyingCloud frame={frame} />
      <GokuCard frame={frame} />

      {/* Accent pillars */}
      <Box pos={[-5.5, 1.5, -3]} args={[0.35, 3, 0.35]} color="#1E293B" emissive="#F59E0B" emissiveIntensity={0.08} />
      <Box pos={[5.5, 1.5, -3]} args={[0.35, 3, 0.35]} color="#1E293B" emissive="#F59E0B" emissiveIntensity={0.08} />
    </group>
  );
};

const CameraRig: React.FC = () => {
  const frame = useCurrentFrame();
  const { camera } = useThree();
  const t = frame / DBGT_GOKU_CRIANCA_FRAMES;
  let cam = { x: 0, y: 2.7, z: 8.8, lx: 0, ly: 2.2, lz: 0, fov: 42 };
  if (t < 0.12) {
    const p = smooth(t / 0.12);
    cam = { x: -0.8 + p * 0.8, y: 2.9, z: 10.5 - p * 1.5, lx: 0, ly: 2.3, lz: 0, fov: 46 };
  } else if (t < 0.45) {
    const p = smooth((t - 0.12) / 0.33);
    cam = { x: 0.6 - p * 1.2, y: 2.75, z: 8.8 + Math.sin(p * Math.PI) * 0.4, lx: 0, ly: 2.25, lz: 0, fov: 42 };
  } else if (t < 0.72) {
    const p = smooth((t - 0.45) / 0.27);
    cam = { x: -0.8 + p * 1.6, y: 3.0, z: 9.2, lx: 0.2, ly: 2.4, lz: -0.5, fov: 44 };
  } else {
    const p = smooth((t - 0.72) / 0.28);
    cam = { x: 0, y: 2.8, z: 9.5 - p * 0.8, lx: 0, ly: 2.2, lz: 0, fov: 43 };
  }
  camera.position.set(cam.x, cam.y, cam.z);
  camera.lookAt(cam.lx, cam.ly, cam.lz);
  if ("fov" in camera) { (camera as THREE.PerspectiveCamera).fov = cam.fov; camera.updateProjectionMatrix(); }
  return null;
};

const Effects: React.FC = () => {
  const { scene, camera } = useThree();
  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera, { strength: 0.45, widthNear: 3.0, widthFar: 2.0 }),
    lens: new LensBlur({ maxCoC: 8, nearScale: 0.7 }),
    bloom: new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.4, luminanceThreshold: 0.82, luminanceSmoothing: 0.25, mipmapBlur: true, levels: 4, radius: 0.55 }),
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
  const active = words.filter(w => t >= w.offset - 0.05 && t <= w.offset + w.duration + 0.12);
  const recent = words.filter(w => w.offset <= t).slice(-7);
  const line = (active.length ? active : recent).map(w => w.text).join(" ");
  if (!line) return null;
  return (
    <div style={{ position: "absolute", bottom: 105, left: 55, right: 55, textAlign: "center", fontFamily: "Arial Black, Arial, sans-serif", fontSize: 42, lineHeight: 1.25, color: "#FFFFFF", textShadow: "0 4px 18px rgba(0,0,0,0.7)", padding: "16px 22px", borderRadius: 20, background: "rgba(15,23,42,0.45)" }}>
      {line}
    </div>
  );
};

const HookOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 10, 80, 100], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const scale = interpolate(frame, [0, 12], [0.95, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", top: 110, left: 50, right: 50, textAlign: "center", opacity, transform: `scale(${scale})` }}>
      <div style={{ fontFamily: "Arial Black, Arial, sans-serif", fontSize: 44, color: "#FFFFFF", background: "rgba(15,23,42,0.72)", borderRadius: 24, padding: "22px 20px", border: "3px solid #F59E0B", textShadow: "0 3px 12px rgba(0,0,0,0.6)" }}>
        Por que o Goku virou criança no GT?
      </div>
    </div>
  );
};

const CTAOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [DBGT_GOKU_CRIANCA_FRAMES - 120, DBGT_GOKU_CRIANCA_FRAMES - 90], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", top: 120, left: 50, right: 50, textAlign: "center", opacity }}>
      <div style={{ fontFamily: "Arial Black, Arial, sans-serif", fontSize: 38, color: "#FDE68A", background: "rgba(15,23,42,0.68)", padding: "18px 20px", borderRadius: 22, border: "2px solid #F59E0B" }}>
        Segue pra mais curiosidades de anime!
      </div>
    </div>
  );
};

export const DragonBallGtGokuCriancaCuriosity: React.FC = () => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#0B1020" }}>
      <Audio src={staticFile("dragon-ball-gt-goku-crianca/voice.wav")} />
      <ThreeCanvas width={width} height={height} frameloop="demand" dpr={1.0}
        shadows gl={{ antialias: false, alpha: false, powerPreference: "high-performance", toneMapping: THREE.NoToneMapping, outputColorSpace: THREE.SRGBColorSpace }}
        camera={{ fov: 42, position: [0, 2.8, 9], near: 0.1, far: 80 }}
        onCreated={({ gl }) => { gl.setClearColor(0x0B1020, 1); gl.shadowMap.enabled = true; gl.shadowMap.type = THREE.PCFSoftShadowMap; }}
      >
        <CameraRig />
        <color attach="background" args={["#0B1020"]} />
        <fog attach="fog" args={["#0B1020", 12, 45]} />
        <ambientLight intensity={0.72} />
        <directionalLight position={[4, 8, 6]} intensity={1.15} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
        <pointLight position={[-4, 3, 3]} intensity={0.9} color="#60A5FA" distance={18} />
        <pointLight position={[4, 3, 3]} intensity={0.7} color="#F59E0B" distance={18} />
        <SceneWorld />
        <Effects />
      </ThreeCanvas>
      <HookOverlay />
      <CTAOverlay />
      <Subtitle />
    </AbsoluteFill>
  );
};

export default DragonBallGtGokuCriancaCuriosity;
