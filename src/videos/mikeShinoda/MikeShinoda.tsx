import React, { useMemo, useEffect } from "react";
import * as THREE from "three";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { InkPass, noInkFallback, NOINK } from "../jimi3d/ink";
import { LensBlur } from "../jimi3d/lensblur";
import { GradeEffect, GRADES, GRADE_STRENGTH } from "../jimi3d/grade";
import { MaleBaseCharacter, type MouthShape } from "../../characters/base/MaleBaseCharacter";
import { useSvgTexture } from "../../characters/base/useSvgTexture";

export const MIKE_FPS = 30;
export const MIKE_DUR = 78.047;
export const MIKE_FRAMES = Math.ceil(MIKE_DUR * MIKE_FPS);

type SegId = "hook" | "success" | "bedroom" | "xero" | "call" | "crawling" | "grammy" | "legacy";

const SEGS: { id: SegId; a: number; b: number }[] = [
  { id: "hook", a: 0, b: 6.362 },
  { id: "success", a: 6.362, b: 13.192 },
  { id: "bedroom", a: 13.192, b: 36.094 },
  { id: "xero", a: 36.094, b: 45.446 },
  { id: "call", a: 45.446, b: 54.754 },
  { id: "crawling", a: 54.754, b: 63.158 },
  { id: "grammy", a: 63.158, b: 67.98 },
  { id: "legacy", a: 67.98, b: 78.047 },
];

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (t: number) => { const u = clamp01(t); return u * u * (3 - 2 * u); };
const segInfo = (time: number) => {
  for (const s of SEGS) if (time >= s.a && time < s.b) return { id: s.id, local: time - s.a, dur: Math.max(0.001, s.b - s.a) };
  const last = SEGS[SEGS.length - 1];
  return { id: last.id, local: Math.max(0, Math.min(last.b - last.a, time - last.a)), dur: Math.max(0.001, last.b - last.a) };
};
const makeBloom = () => new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.45, luminanceThreshold: 0.9, luminanceSmoothing: 0.25, mipmapBlur: true, levels: 5, radius: 0.6 });

const Box: React.FC<{ pos: [number, number, number]; args: [number, number, number]; color: string; rot?: [number, number, number] }> = ({ pos, args, color, rot = [0, 0, 0] }) => (
  <mesh position={pos} rotation={rot} castShadow receiveShadow><boxGeometry args={args} /><meshLambertMaterial color={color} /></mesh>
);
const Cyl: React.FC<{ pos: [number, number, number]; args: [number, number, number, number?]; color: string; rot?: [number, number, number] }> = ({ pos, args, color, rot = [0, 0, 0] }) => (
  <mesh position={pos} rotation={rot} castShadow receiveShadow><cylinderGeometry args={args} /><meshLambertMaterial color={color} /></mesh>
);

const Card: React.FC<{ tex: THREE.Texture | null; pos: [number, number, number]; scale?: number | [number, number, number]; rot?: [number, number, number]; opacity?: number }> = ({ tex, pos, scale = 1, rot = [0, 0, 0], opacity = 1 }) => {
  if (!tex) return null;
  return (
    <mesh position={pos} rotation={rot} scale={scale as any} layers={NOINK}>
      <planeGeometry args={[2.2, 3.3]} />
      <meshBasicMaterial map={tex} transparent alphaTest={0.05} side={THREE.DoubleSide} opacity={opacity} />
    </mesh>
  );
};

const talkMouth = (frame: number, speed = 0.65): MouthShape => {
  const v = Math.sin(frame * speed);
  if (v > 0.5) return "open";
  if (v > 0.2) return "smile";
  return "neutral";
};

type CharKind = "mike" | "chester";
const CharacterCard: React.FC<{
  kind: CharKind;
  pos: [number, number, number];
  scale?: number;
  rot?: [number, number, number];
  frame: number;
  talking?: boolean;
  mood?: "neutral" | "smile" | "focus" | "sing";
  walk?: boolean;
  cap?: boolean;
}> = ({ kind, pos, scale = 1, rot = [0, 0, 0], frame, talking = false, mood = "neutral", walk = false, cap = false }) => {
  const step = frame * 0.28;
  const legSwing = walk ? Math.sin(step) * 12 : 0;
  const armSwing = walk ? Math.sin(step + Math.PI) * 14 : Math.sin(frame * 0.05) * 1.5;
  const bob = walk ? Math.abs(Math.sin(step)) * -3 : Math.sin(frame * 0.04) * -1;
  const eyeOpen = frame % 90 > 84 && frame % 90 < 89 ? 0.08 : 1;
  const mouthShape: MouthShape = talking ? talkMouth(frame, kind === "chester" ? 0.8 : 0.65) : mood === "smile" ? "smile" : mood === "sing" ? "open" : "neutral";

  const colors = kind === "mike"
    ? { skin: "#EFC39B", hair: "#2B2118", hairDark: "#1A130E", shirt: "#3B4A66", shorts: "#2D3748", cap: "#B91C1C", capDetail: "#7F1D1D", hairHighlight: "#4A3A2E" }
    : { skin: "#F0C29A", hair: "#FFD400", hairDark: "#C9A000", hairHighlight: "#FFF176", shirt: "#1E1E22", shorts: "#4A5568" };

  const tex = useSvgTexture(
    <MaleBaseCharacter
      width={512}
      height={768}
      hairVariant={kind === "chester" ? "spiky" : "short"}
      headAccessory={cap ? "cap" : "none"}
      goatee
      tattoos={kind === "chester"}
      colors={colors as any}
      pose={{
        bodyY: bob,
        headY: bob * 0.35,
        armLeftRotate: armSwing,
        armRightRotate: -armSwing,
        legLeftRotate: legSwing,
        legRightRotate: -legSwing,
        eyeOpen,
        mouthShape,
      }}
    />,
    [kind, Math.round(frame / 2), talking, mood, walk, cap],
    512, 768
  );

  return <Card tex={tex} pos={pos} scale={scale} rot={rot} />;
};

const Keyboard: React.FC<{ pos: [number, number, number]; scale?: number; rot?: [number, number, number] }> = ({ pos, scale = 1, rot = [0, 0, 0] }) => (
  <group position={pos} scale={scale} rotation={rot}>
    <Box pos={[0, 0.36, 0]} args={[2.4, 0.08, 0.7]} color="#1a1a1f" />
    <Box pos={[0, 0.41, 0.02]} args={[2.25, 0.03, 0.55]} color="#f5f5f5" />
    {Array.from({ length: 14 }).map((_, i) => {
      const x = -0.98 + i * 0.151;
      return <Box key={`w${i}`} pos={[x, 0.43, 0.02]} args={[0.14, 0.015, 0.52]} color="#ffffff" />;
    })}
    {[ -0.83,-0.53,-0.23,0.22,0.52,0.82 ].map((x, i) => (
      <Box key={`b${i}`} pos={[x, 0.45, -0.08]} args={[0.09, 0.04, 0.28]} color="#111827" />
    ))}
    <Cyl pos={[-0.95, 0.18, 0]} args={[0.03, 0.03, 0.36, 10]} color="#2d2d2d" />
    <Cyl pos={[0.95, 0.18, 0]} args={[0.03, 0.03, 0.36, 10]} color="#2d2d2d" />
  </group>
);

const MicStand: React.FC<{ pos: [number, number, number] }> = ({ pos }) => (
  <group position={pos}>
    <Cyl pos={[0, 0.95, 0]} args={[0.03, 0.03, 1.9, 12]} color="#222" />
    <Cyl pos={[0, 0.02, 0]} args={[0.22, 0.25, 0.04, 16]} color="#1a1a1a" />
    <mesh position={[0, 1.95, 0.08]} rotation={[Math.PI / 2, 0, 0]} castShadow><sphereGeometry args={[0.09, 16, 16]} /><meshLambertMaterial color="#9aa0a6" /></mesh>
  </group>
);

const Guitar: React.FC<{ pos: [number, number, number]; scale?: number; rot?: [number, number, number]; color?: string }> = ({ pos, scale = 1, rot = [0, 0.2, 0.15], color = "#c2410c" }) => (
  <group position={pos} scale={scale} rotation={rot}>
    <Box pos={[0, 0.95, 0]} args={[0.08, 1.1, 0.05]} color="#3a2a1a" />
    <Box pos={[0, 1.55, 0]} args={[0.14, 0.22, 0.06]} color="#1a1a1a" />
    <mesh position={[0, 0.28, 0]} castShadow><sphereGeometry args={[0.26, 16, 16]} /><meshLambertMaterial color={color} /></mesh>
    <mesh position={[0, -0.02, 0]} castShadow><sphereGeometry args={[0.22, 16, 16]} /><meshLambertMaterial color={color} /></mesh>
    <Box pos={[0, 0.15, 0.14]} args={[0.12, 0.18, 0.03]} color="#111827" />
  </group>
);

const Trophy: React.FC<{ pos: [number, number, number]; scale?: number }> = ({ pos, scale = 1 }) => (
  <group position={pos} scale={scale}>
    <Cyl pos={[0, 0.15, 0]} args={[0.18, 0.22, 0.3, 16]} color="#cfa43b" />
    <Cyl pos={[0, 0.45, 0]} args={[0.1, 0.14, 0.35, 16]} color="#ffd166" />
    <mesh position={[0, 0.72, 0]} castShadow><sphereGeometry args={[0.14, 16, 16]} /><meshStandardMaterial color="#ffd166" metalness={0.7} roughness={0.25} /></mesh>
  </group>
);

const Stage: React.FC = () => (
  <group>
    <Box pos={[0, 0.3, -0.2]} args={[10, 0.6, 5]} color="#1a1d27" />
    <Box pos={[0, 2.8, -2.6]} args={[11, 5.2, 0.2]} color="#141824" />
    <pointLight position={[-3, 4.8, 1]} intensity={1.8} color="#7db6ff" distance={16} />
    <pointLight position={[3, 4.8, 1]} intensity={1.6} color="#ff7d7d" distance={16} />
  </group>
);

const Bedroom: React.FC = () => (
  <group>
    <Box pos={[0, 2.2, -2.6]} args={[10, 5.2, 0.2]} color="#24314a" />
    <Box pos={[-3.2, 1.4, -2.49]} args={[1.3, 2.0, 0.05]} color="#2d1b69" />
    <Box pos={[3.2, 1.4, -2.49]} args={[1.3, 2.0, 0.05]} color="#512b58" />
    <Box pos={[0, 0.72, -0.5]} args={[4.2, 0.1, 1.1]} color="#4a3b32" />
    <Cyl pos={[-1.8, 0.36, -0.5]} args={[0.05, 0.05, 0.72, 10]} color="#2f2620" />
    <Cyl pos={[1.8, 0.36, -0.5]} args={[0.05, 0.05, 0.72, 10]} color="#2f2620" />
    <Keyboard pos={[0.1, 0.82, -0.35]} />
    <Box pos={[-1.4, 1.18, -0.75]} args={[0.9, 0.55, 0.06]} color="#111827" />
    <Box pos={[-1.4, 0.86, -0.75]} args={[0.08, 0.22, 0.08]} color="#374151" />
    <Box pos={[1.7, 0.95, -0.15]} args={[0.35, 0.55, 0.25]} color="#2b2b2b" />
  </group>
);

const World: React.FC<{ time: number; frame: number }> = ({ time, frame }) => {
  const { id, local, dur } = segInfo(time);
  const p = smooth(local / dur);
  const enter = smooth(clamp01(local / 1.2));
  const walkX = (1 - enter) * -1.2;
  const dark = id === "hook" || id === "xero" || id === "legacy";
  const bg = dark ? "#0b1020" : id === "success" || id === "grammy" ? "#141225" : id === "call" ? "#18140f" : "#18243a";

  // Talking: keep it sparse/natural. Mostly narrator; only cue-focused character talks briefly.
  const mikeTalking = (id === "hook" && local < 4.5) || (id === "bedroom" && local > 2 && local < 18) || (id === "xero" && local > 3) || (id === "call" && local > 2) || (id === "legacy" && local > 3);
  const chesterTalking = (id === "crawling" && local > 3.8 && local < 7.8) || (id === "grammy" && local < 2.5);

  return (
    <group>
      <color attach="background" args={[bg]} />
      <fog attach="fog" args={[bg, 10, 38]} />
      <ambientLight intensity={dark ? 0.4 : 0.58} />
      <directionalLight position={[4, 7, 4]} intensity={dark ? 0.9 : 1.2} color="#fff0d8" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshLambertMaterial color="#23293a" />
      </mesh>

      {id === "hook" && (
        <group>
          <Bedroom />
          <CharacterCard kind="mike" pos={[-0.4 + walkX * 0.2, 2.05, 0.55]} scale={1.0} frame={frame} talking={mikeTalking} mood="focus" cap />
          <pointLight position={[0, 3.5, 1]} intensity={1.3} color="#6ea8ff" distance={10} />
        </group>
      )}

      {id === "success" && (
        <group>
          <Stage />
          <CharacterCard kind="mike" pos={[-0.58, 2.15, 0.22]} scale={1.05} frame={frame} talking={false} mood="smile" />
          <CharacterCard kind="chester" pos={[0.58, 2.15, 0.42]} scale={1.05} frame={frame} talking={false} mood="sing" />
          <MicStand pos={[-0.58, 0.6, 0.88]} />
          <MicStand pos={[0.58, 0.6, 1.02]} />
          <Guitar pos={[-0.95, 0.95, 0.5]} scale={0.8} rot={[0, 0.3, 0.2]} color="#1e40af" />
        </group>
      )}

      {id === "bedroom" && (
        <group>
          <Bedroom />
          <CharacterCard kind="mike" pos={[-0.55, 2.08, 0.55]} scale={1.02} frame={frame} talking={mikeTalking} mood="focus" cap />
          <CharacterCard kind="chester" pos={[0.75, 2.02, 0.1]} scale={0.92} frame={frame} talking={false} mood="neutral" />
          <Guitar pos={[1.15, 0.95, 0.35]} scale={0.78} rot={[0, -0.2, 0.15]} color="#b45309" />
        </group>
      )}

      {id === "xero" && (
        <group>
          <Box pos={[0, 2.2, -2.6]} args={[10, 5.2, 0.2]} color="#1e2636" />
          <Box pos={[0, 0.72, -0.45]} args={[4.2, 0.1, 1.1]} color="#4a3b32" />
          <Cyl pos={[-1.8, 0.36, -0.45]} args={[0.05, 0.05, 0.72, 10]} color="#2f2620" />
          <Cyl pos={[1.8, 0.36, -0.45]} args={[0.05, 0.05, 0.72, 10]} color="#2f2620" />
          <Keyboard pos={[-0.8, 0.82, -0.3]} scale={0.9} />
          {[-0.1, 0.25, 0.6, 0.95, 1.3].map((x, i) => (
            <Box key={i} pos={[x, 0.82 + i * 0.01, -0.35]} args={[0.28, 0.05, 0.18]} color={i % 2 ? "#111827" : "#374151"} rot={[0, i * 0.08, 0]} />
          ))}
          <CharacterCard kind="mike" pos={[-1.5, 2.02, 0.55]} scale={0.95} frame={frame} talking={mikeTalking} mood="neutral" cap />
        </group>
      )}

      {id === "call" && (
        <group>
          <Box pos={[0, 2.2, -2.6]} args={[10, 5.2, 0.2]} color="#2a2418" />
          <Box pos={[0, 0.72, -0.45]} args={[3.6, 0.1, 1.0]} color="#4a3b32" />
          <Cyl pos={[-1.5, 0.36, -0.45]} args={[0.05, 0.05, 0.72, 10]} color="#2f2620" />
          <Cyl pos={[1.5, 0.36, -0.45]} args={[0.05, 0.05, 0.72, 10]} color="#2f2620" />
          <Box pos={[1.1, 0.9, -0.2]} args={[0.35, 0.18, 0.22]} color="#d1d5db" />
          <CharacterCard kind="mike" pos={[-0.6, 2.03, 0.55]} scale={0.98} frame={frame} talking={mikeTalking} mood="smile" cap />
          <pointLight position={[1.2, 2.2, 0.8]} intensity={1.4 + Math.sin(frame * 0.2) * 0.25} color="#ffd166" distance={8} />
        </group>
      )}

      {id === "crawling" && (
        <group>
          <Stage />
          <CharacterCard kind="mike" pos={[-0.62, 2.12, 0.2]} scale={1.0} frame={frame} talking={false} mood="focus" />
          <Keyboard pos={[-0.62, 0.82, 0.38]} scale={0.68} />
          <CharacterCard kind="chester" pos={[0.62, 2.15, 0.48]} scale={1.02} frame={frame} talking={chesterTalking} mood="sing" />
          <MicStand pos={[0.62, 0.6, 1.02]} />
          <Guitar pos={[-1.05, 0.95, 0.5]} scale={0.72} rot={[0, 0.25, 0.18]} color="#1e40af" />
        </group>
      )}

      {id === "grammy" && (
        <group>
          <Stage />
          <CharacterCard kind="mike" pos={[-0.58, 2.12, 0.22]} scale={1.02} frame={frame} talking={false} mood="smile" />
          <CharacterCard kind="chester" pos={[0.58, 2.12, 0.42]} scale={1.02} frame={frame} talking={chesterTalking} mood="smile" />
          <Trophy pos={[0, 0.95, 0.75]} scale={1.05} />
          <MicStand pos={[-0.58, 0.6, 0.88]} />
          <MicStand pos={[0.58, 0.6, 1.02]} />
          <pointLight position={[0, 3.2, 1]} intensity={2.0} color="#ffd166" distance={10} />
        </group>
      )}

      {id === "legacy" && (
        <group>
          <Stage />
          <CharacterCard kind="mike" pos={[-0.58, 2.12, 0.22]} scale={1.03} frame={frame} talking={mikeTalking} mood="smile" cap />
          <CharacterCard kind="chester" pos={[0.58, 2.12, 0.42]} scale={1.03} frame={frame} talking={false} mood="smile" />
          <MicStand pos={[-0.58, 0.6, 0.88]} />
          <MicStand pos={[0.58, 0.6, 1.02]} />
          <Guitar pos={[-0.95, 0.95, 0.5]} scale={0.78} rot={[0, 0.25, 0.15]} color="#1e40af" />
          <pointLight position={[0, 4.2, 1.2]} intensity={1.6} color="#a78bfa" distance={12} />
        </group>
      )}
    </group>
  );
};

const CameraRig: React.FC<{ time: number }> = ({ time }) => {
  const { camera } = useThree();
  const { id, local, dur } = segInfo(time);
  const p = smooth(local / dur);
  const pos = new THREE.Vector3(0, 2.5, 7.6);
  const look = new THREE.Vector3(0, 2.0, 0);

  if (id === "hook") { pos.set(-0.5 + p * 0.4, 2.35, 6.3 - p * 0.2); look.set(-0.3, 1.95, 0.2); }
  if (id === "success") { pos.set(0, 2.55, 7.4 - p * 0.3); look.set(0, 2.1, 0.4); }
  if (id === "bedroom") { pos.set(0.4 - p * 0.4, 2.45, 7.0 - p * 0.2); look.set(0.1, 1.95, 0.2); }
  if (id === "xero") { pos.set(-0.3, 2.35, 6.6 - p * 0.2); look.set(-0.5, 1.95, 0.1); }
  if (id === "call") { pos.set(0.2 - p * 0.3, 2.35, 6.4 - p * 0.2); look.set(-0.2, 1.95, 0.2); }
  if (id === "crawling") { pos.set(0, 2.55, 7.6 - p * 0.3); look.set(0, 2.1, 0.4); }
  if (id === "grammy") { pos.set(0, 2.5, 7.2 - p * 0.2); look.set(0, 2.05, 0.4); }
  if (id === "legacy") { pos.set(0, 2.55, 7.4 - p * 0.3); look.set(0, 2.1, 0.4); }

  camera.position.copy(pos);
  camera.lookAt(look);
  camera.fov = 38;
  camera.updateProjectionMatrix();
  return null;
};

const Overlay: React.FC<{ time: number }> = ({ time }) => {
  const items: { start: number; end: number; text: string; color?: string; size?: number }[] = [
    { start: 0.2, end: 5.5, text: "UM QUARTO BAGUNÇADO\nUM TECLADO DE 50 DÓLARES", color: "#7dd3fc", size: 44 },
    { start: 6.5, end: 12.2, text: "HYBRID THEORY • 2000", color: "#ffffff", size: 46 },
    { start: 26.3, end: 31.0, text: "SETUP INTEIRO: ~US$ 300", color: "#ffd166", size: 42 },
    { start: 41.6, end: 44.7, text: "XERO • NINGUÉM QUERIA", color: "#a5b4fc", size: 44 },
    { start: 48.6, end: 52.0, text: "ESSAS MÚSICAS SOAM BEM", color: "#ffd166", size: 44 },
    { start: 54.8, end: 57.9, text: "CRAWLING NASCEU DE BLUE", color: "#ff7d7d", size: 42 },
    { start: 63.2, end: 67.2, text: "GRAMMY • 2002", color: "#ffd166", size: 50 },
    { start: 73.1, end: 77.8, text: "QUAL MÚSICA DO LINKIN PARK\nMARCOU A SUA VIDA?", color: "#7CFF9B", size: 40 },
  ];
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {items.map((it, i) => {
        const visible = time >= it.start && time <= it.end;
        const o = visible ? interpolate(time, [it.start, it.start + 0.3, it.end - 0.3, it.end], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
        if (o <= 0) return null;
        return (
          <div key={i} style={{ position: "absolute", left: 60, right: 60, top: 120, textAlign: "center", opacity: o, transform: `translateY(${(1 - o) * 20}px)` }}>
            <div style={{ fontFamily: "Arial Black, Arial, sans-serif", fontSize: it.size ?? 42, color: it.color ?? "#fff", lineHeight: 1.15, textShadow: "0 6px 24px rgba(0,0,0,0.65)", whiteSpace: "pre-line" }}>{it.text}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const PostFX: React.FC<{ time: number }> = ({ time }) => {
  const { scene, camera } = useThree();
  const { id } = segInfo(time);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera, { strength: 0.75, widthNear: 4.0, widthFar: 2.5 }),
    lens: new LensBlur({ maxCoC: 16, nearScale: 1.0 }),
    bloom: makeBloom(),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(GRADES.day, GRADE_STRENGTH.day),
  }), [scene, camera]);
  useEffect(() => () => fx.ink.dispose(), [fx]);
  fx.lens.focus = 5.0; fx.lens.cInf = 5.0;
  const golden = ["success", "call", "grammy"].includes(id);
  fx.grade.set(golden ? GRADES.golden : GRADES.day);
  fx.grade.amount = golden ? GRADE_STRENGTH.golden : GRADE_STRENGTH.day;
  return (
    <EffectComposer multisampling={4}>
      <primitive object={fx.ink} dispose={null} />
      <primitive object={fx.lens.pre} dispose={null} />
      <primitive object={fx.lens.main} dispose={null} />
      <primitive object={fx.bloom} dispose={null} />
      <primitive object={fx.tone} dispose={null} />
      <primitive object={fx.grade} dispose={null} />
    </EffectComposer>
  );
};

const SceneRoot: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;
  const { scene } = useThree();
  noInkFallback(scene);
  return <><World time={time} frame={frame} /><CameraRig time={time} /><PostFX time={time} /></>;
};

export const MikeShinoda: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;
  const { id } = segInfo(time);
  const dark = id === "hook" || id === "xero" || id === "legacy";
  const bg = dark ? "#0b1020" : "#18243a";
  return (
    <AbsoluteFill style={{ backgroundColor: bg }}>
      <ThreeCanvas
        width={1080}
        height={1920}
        frameloop="demand"
        dpr={[1, 2]}
        gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}
        camera={{ fov: 38, position: [0, 2.5, 7.6] }}
      >
        <SceneRoot />
      </ThreeCanvas>
      <Overlay time={time} />
      <Audio src={staticFile("mike-shinoda/voice.wav")} />
    </AbsoluteFill>
  );
};

export const MikeShinodaShort = MikeShinoda;
export default MikeShinoda;
