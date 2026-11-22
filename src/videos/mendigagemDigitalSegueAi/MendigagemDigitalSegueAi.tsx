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

export const MDSA_FPS = 30;
export const MDSA_DURATION = 1170; // ~39s
export const MDSA_FRAMES = MDSA_DURATION;

const SEGS = [
  { id: "work", a: 0.096, b: 3.198 },
  { id: "craft", a: 3.499, b: 7.284 },
  { id: "gone", a: 8.079, b: 11.562 },
  { id: "cigarro", a: 12.361, b: 14.502 },
  { id: "official", a: 15.301, b: 18.449 },
  { id: "instruments", a: 19.248, b: 24.201 },
  { id: "notgood", a: 25.0, b: 26.551 },
  { id: "play", a: 26.794, b: 28.507 },
  { id: "moral", a: 29.306, b: 33.368 },
  { id: "cta", a: 34.167, b: 39.0 },
] as const;
type SegId = (typeof SEGS)[number]["id"];

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (t: number) => { const u = clamp01(t); return u * u * (3 - 2 * u); };
const segInfo = (time: number) => {
  for (const s of SEGS) if (time >= s.a && time < s.b) return { id: s.id as SegId, local: time - s.a, dur: Math.max(0.001, s.b - s.a) };
  const last = SEGS[SEGS.length - 1];
  if (time >= last.b) return { id: last.id as SegId, local: Math.min(last.b - last.a, time - last.a), dur: Math.max(0.001, last.b - last.a) };
  return { id: SEGS[0].id as SegId, local: 0, dur: SEGS[0].b - SEGS[0].a };
};
const makeBloom = () => new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.38, luminanceThreshold: 0.95, luminanceSmoothing: 0.25, mipmapBlur: true, levels: 5, radius: 0.55 });
function makeTex(draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, w = 512, h = 768) {
  const canvas = document.createElement("canvas"); canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d")!; draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; tex.needsUpdate = true; return tex;
}

function drawChibi(ctx: CanvasRenderingContext2D, w: number, h: number, mood: "normal" | "sad" | "plead" | "happy" | "wink" | "proud") {
  ctx.clearRect(0, 0, w, h);
  const cx = w * 0.5, by = h * 0.93; const ink = "#1b1820";
  const skin = "#b07a52";
  const line = (lw = 6) => { ctx.lineWidth = lw; ctx.strokeStyle = ink; ctx.lineCap = "round"; ctx.lineJoin = "round"; };
  const fs = (fill: string) => { ctx.fillStyle = fill; ctx.fill(); ctx.stroke(); };
  // legs
  line(6);
  ctx.beginPath(); ctx.ellipse(cx - 22, by - 48, 14, 38, 0, 0, Math.PI * 2); fs("#2e2a33");
  ctx.beginPath(); ctx.ellipse(cx + 22, by - 48, 14, 38, 0, 0, Math.PI * 2); fs("#2e2a33");
  // body - Deftones tee
  ctx.beginPath(); ctx.ellipse(cx, by - 120, 46, 52, 0, 0, Math.PI * 2); fs("#171717");
  ctx.fillStyle = "#f0f0f0"; ctx.font = "bold 18px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("DEFTONES", cx, by - 120);
  // arms
  ctx.save(); ctx.translate(cx - 46, by - 132); ctx.rotate(mood === "plead" ? -0.2 : 0.45); ctx.beginPath(); ctx.ellipse(0, 30, 11, 34, 0, 0, Math.PI * 2); fs(skin); ctx.restore();
  ctx.save(); ctx.translate(cx + 46, by - 132); ctx.rotate(mood === "plead" ? 0.2 : -0.45); ctx.beginPath(); ctx.ellipse(0, 30, 11, 34, 0, 0, Math.PI * 2); fs(skin); ctx.restore();
  if (mood === "plead") {
    ctx.save(); ctx.translate(cx - 52, by - 172); ctx.rotate(-1.15); ctx.beginPath(); ctx.ellipse(0, 22, 11, 30, 0, 0, Math.PI * 2); fs(skin); ctx.restore();
    ctx.save(); ctx.translate(cx + 52, by - 172); ctx.rotate(1.15); ctx.beginPath(); ctx.ellipse(0, 22, 11, 30, 0, 0, Math.PI * 2); fs(skin); ctx.restore();
  }
  // head
  const hy = by - 265;
  ctx.beginPath(); ctx.ellipse(cx, hy, 78, 74, 0, 0, Math.PI * 2); fs(skin);
  // cap
  line(4); ctx.fillStyle = "#1f2937"; ctx.strokeStyle = ink;
  ctx.beginPath(); ctx.ellipse(cx, hy - 38, 79, 30, 0, Math.PI, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.roundRect(cx - 8, hy - 50, 105, 14, 6); ctx.fill(); ctx.stroke();
  // beard + mustache
  ctx.strokeStyle = "#2a1a12"; line(4);
  ctx.beginPath(); ctx.moveTo(cx - 18, hy + 28); ctx.quadraticCurveTo(cx, hy + 24, cx + 18, hy + 28); ctx.stroke(); // mustache
  ctx.fillStyle = "rgba(42,26,18,0.25)"; ctx.strokeStyle = "#2a1a12"; line(2.5);
  ctx.beginPath(); ctx.moveTo(cx - 22, hy + 38); ctx.quadraticCurveTo(cx, hy + 56, cx + 22, hy + 38); ctx.quadraticCurveTo(cx, hy + 46, cx - 22, hy + 38); ctx.fill(); ctx.stroke(); // barbicha
  // cheeks
  ctx.fillStyle = "rgba(255,140,140,0.18)";
  ctx.beginPath(); ctx.ellipse(cx - 42, hy + 12, 14, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 42, hy + 12, 14, 9, 0, 0, Math.PI * 2); ctx.fill();
  // eyes
  const eyeY = hy - 2;
  const drawEye = (ex: number, winkEye = false) => {
    if (winkEye) { line(4); ctx.strokeStyle = ink; ctx.beginPath(); ctx.moveTo(ex - 12, eyeY); ctx.quadraticCurveTo(ex, eyeY - 8, ex + 12, eyeY); ctx.stroke(); return; }
    ctx.fillStyle = "#fff"; ctx.strokeStyle = ink; line(3); ctx.beginPath(); ctx.ellipse(ex, eyeY, 14, 16, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#2a1f24"; ctx.beginPath(); ctx.ellipse(ex, eyeY + 1, 8.5, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(ex - 4, eyeY - 4, 3.5, 4, 0, 0, Math.PI * 2); ctx.fill();
    if (mood === "plead" || mood === "sad") { ctx.fillStyle = "rgba(120,200,255,0.5)"; ctx.beginPath(); ctx.ellipse(ex + 10, eyeY + 16, 3, 5, 0, 0, Math.PI * 2); ctx.fill(); }
  };
  drawEye(cx - 24, mood === "wink"); drawEye(cx + 24);
  // brows
  line(4); ctx.strokeStyle = ink;
  if (mood === "sad" || mood === "plead") {
    ctx.beginPath(); ctx.moveTo(cx - 38, hy - 22); ctx.quadraticCurveTo(cx - 24, hy - 32, cx - 10, hy - 26); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 10, hy - 26); ctx.quadraticCurveTo(cx + 24, hy - 32, cx + 38, hy - 22); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(cx - 38, hy - 24); ctx.quadraticCurveTo(cx - 24, hy - 30, cx - 10, hy - 24); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 10, hy - 24); ctx.quadraticCurveTo(cx + 24, hy - 30, cx + 38, hy - 24); ctx.stroke();
  }
  // mouth
  line(3.5); ctx.strokeStyle = ink; ctx.beginPath();
  if (mood === "happy" || mood === "wink" || mood === "proud") { ctx.arc(cx, hy + 33, 10, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); }
  else if (mood === "sad") { ctx.arc(cx, hy + 40, 9, 1.2 * Math.PI, 1.8 * Math.PI); ctx.stroke(); }
  else if (mood === "plead") { ctx.moveTo(cx - 10, hy + 35); ctx.quadraticCurveTo(cx, hy + 31, cx + 10, hy + 35); ctx.stroke(); }
  else { ctx.moveTo(cx - 9, hy + 35); ctx.quadraticCurveTo(cx, hy + 39, cx + 9, hy + 35); ctx.stroke(); }
}

const Card: React.FC<{ tex: THREE.Texture; pos: [number, number, number]; scale?: number | [number, number, number]; rot?: [number, number, number] }> = ({ tex, pos, scale = 1, rot = [0, 0, 0] }) => (
  <mesh position={pos} rotation={rot} scale={scale as any} layers={NOINK}><planeGeometry args={[2.2, 3.3]} /><meshBasicMaterial map={tex} transparent alphaTest={0.05} side={THREE.DoubleSide} /></mesh>
);
const Box: React.FC<{ pos: [number, number, number]; args: [number, number, number]; color: string; rot?: [number, number, number] }> = ({ pos, args, color, rot = [0, 0, 0] }) => (<mesh position={pos} rotation={rot} castShadow receiveShadow><boxGeometry args={args} /><meshLambertMaterial color={color} /></mesh>);
const Cyl: React.FC<{ pos: [number, number, number]; args: [number, number, number, number?]; color: string; rot?: [number, number, number] }> = ({ pos, args, color, rot = [0, 0, 0] }) => (<mesh position={pos} rotation={rot} castShadow receiveShadow><cylinderGeometry args={args} /><meshLambertMaterial color={color} /></mesh>);

const Screen: React.FC<{ pos: [number, number, number]; text: string; sub?: string; color?: string }> = ({ pos, text, sub, color = "#ff5d6c" }) => {
  const tex = useMemo(() => makeTex((ctx, W, H) => {
    ctx.clearRect(0, 0, W, H); ctx.fillStyle = "#10131b"; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#2f3547"; ctx.lineWidth = 16; ctx.strokeRect(8, 8, W - 16, H - 16);
    ctx.fillStyle = color; ctx.font = "bold 68px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(text, W / 2, H / 2 - 18);
    if (sub) { ctx.fillStyle = "#c9d1e1"; ctx.font = "34px Arial"; ctx.fillText(sub, W / 2, H / 2 + 52); }
  }, 900, 520), [text, sub, color]);
  return <Card tex={tex} pos={pos} scale={[1.45, 0.85, 1] as any} />;
};

const Guitar: React.FC<{ pos: [number, number, number]; rot?: [number, number, number]; color?: string }> = ({ pos, rot = [0, 0, 0], color = "#c0392b" }) => (
  <group position={pos} rotation={rot}>
    <Box pos={[0, 0.75, 0]} args={[0.08, 0.9, 0.04]} color="#3a2a1a" />
    <Box pos={[0, 1.25, 0]} args={[0.14, 0.18, 0.05]} color="#1a1a1a" />
    <mesh position={[0, 0.2, 0]} castShadow><sphereGeometry args={[0.22, 16, 16]} /><meshLambertMaterial color={color} /></mesh>
    <mesh position={[0, -0.05, 0]} castShadow><sphereGeometry args={[0.18, 16, 16]} /><meshLambertMaterial color={color} /></mesh>
  </group>
);

const Studio: React.FC = () => (
  <group>
    {/* back wall */}
    <Box pos={[0, 2.2, -2.4]} args={[9, 5.2, 0.2]} color="#20263a" />
    <Box pos={[-3.2, 1.3, -2.29]} args={[1.2, 1.8, 0.05]} color="#2d1b69" />
    <Box pos={[3.2, 1.3, -2.29]} args={[1.2, 1.8, 0.05]} color="#512b58" />
    {/* desk */}
    <Box pos={[0, 0.75, 0.1]} args={[4.8, 0.12, 1.8]} color="#3b2f2a" />
    <Cyl pos={[-2.0, 0.36, 0.7]} args={[0.07, 0.07, 0.72, 12]} color="#222" />
    <Cyl pos={[2.0, 0.36, 0.7]} args={[0.07, 0.07, 0.72, 12]} color="#222" />
    <Cyl pos={[-2.0, 0.36, -0.5]} args={[0.07, 0.07, 0.72, 12]} color="#222" />
    <Cyl pos={[2.0, 0.36, -0.5]} args={[0.07, 0.07, 0.72, 12]} color="#222" />
    {/* monitors */}
    <Box pos={[-1.1, 1.45, -0.4]} args={[1.3, 0.8, 0.08]} color="#111" />
    <Box pos={[1.1, 1.45, -0.4]} args={[1.3, 0.8, 0.08]} color="#111" />
    <Box pos={[-1.1, 1.45, -0.35]} args={[1.18, 0.68, 0.02]} color="#1c2438" />
    <Box pos={[1.1, 1.45, -0.35]} args={[1.18, 0.68, 0.02]} color="#1c2438" />
    {/* ring lights */}
    <mesh position={[-2.5, 2.8, -1.4]}><torusGeometry args={[0.34, 0.04, 12, 32]} /><meshStandardMaterial color="#f5f5f5" emissive="#ffffff" emissiveIntensity={0.5} /></mesh>
    <mesh position={[2.5, 2.8, -1.4]}><torusGeometry args={[0.34, 0.04, 12, 32]} /><meshStandardMaterial color="#f5f5f5" emissive="#ffffff" emissiveIntensity={0.5} /></mesh>
    <Cyl pos={[-2.5, 1.8, -1.4]} args={[0.03, 0.03, 2.0, 10]} color="#333" />
    <Cyl pos={[2.5, 1.8, -1.4]} args={[0.03, 0.03, 2.0, 10]} color="#333" />
    {/* mic */}
    <Cyl pos={[1.9, 1.15, 0.3]} args={[0.03, 0.03, 1.0, 10]} color="#444" />
    <mesh position={[1.9, 1.72, 0.35]} castShadow><sphereGeometry args={[0.09, 16, 16]} /><meshLambertMaterial color="#8d97a8" /></mesh>
    {/* instruments on wall/floor */}
    <Guitar pos={[-3.2, 1.3, -2.1]} rot={[0, 0, -0.08]} color="#c0392b" />
    <Guitar pos={[-2.6, 1.2, -2.1]} rot={[0, 0, 0.06]} color="#2980b9" />
    <Guitar pos={[3.1, 1.2, -2.1]} rot={[0, 0, 0.05]} color="#d35400" />
    {/* escaleta / harmonica props */}
    <Box pos={[2.6, 0.88, 0.2]} args={[0.45, 0.12, 0.18]} color="#222" />
    <Box pos={[2.15, 0.84, 0.35]} args={[0.22, 0.04, 0.06]} color="#b0b8c4" />
  </group>
);

const World: React.FC<{ time: number }> = ({ time }) => {
  const { id, local, dur } = segInfo(time);
  const p = smooth(local / dur);
  const mood: "normal" | "sad" | "plead" | "happy" | "wink" | "proud" =
    id === "gone" || id === "cigarro" ? "sad"
      : id === "official" ? "plead"
      : id === "instruments" || id === "play" ? "proud"
      : id === "moral" || id === "cta" ? "happy"
      : id === "notgood" ? "wink"
      : "normal";
  const tex = useMemo(() => makeTex((c, w, h) => drawChibi(c, w, h, mood), 512, 768), [mood]);
  useEffect(() => () => tex.dispose(), [tex]);
  const bob = Math.sin(time * 2.2) * 0.025;

  return (
    <group>
      <color attach="background" args={["#171d2e"]} />
      <fog attach="fog" args={["#171d2e", 8, 28]} />
      <ambientLight intensity={0.58} />
      <directionalLight position={[4, 6, 4]} intensity={1.15} color="#fff0d8" />
      <pointLight position={[-2.5, 2.8, -0.8]} intensity={1.1} color="#ffffff" distance={8} />
      <pointLight position={[2.5, 2.8, -0.8]} intensity={1.1} color="#ffffff" distance={8} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow><planeGeometry args={[30, 30]} /><meshLambertMaterial color="#23293a" /></mesh>
      <Studio />
      {/* Character centered */}
      <Card tex={tex} pos={[0, 1.45 + bob, 0.65]} scale={1.02} />

      {/* Screen placed above desk, not blocking character face */}
      {(id === "work" || id === "craft") && <Screen pos={[0, 2.85, -0.15]} text="FAZENDO VÍDEO" sub="todo dia..." color="#7fd4ff" />}
      {(id === "gone" || id === "cigarro") && <Screen pos={[0, 2.85, -0.15]} text="SEGUIDORES: 0" sub="views: 3 e meio" color="#ff5d6c" />}
      {id === "official" && <Screen pos={[0, 2.85, -0.15]} text="MENDIGAGEM DIGITAL" sub="modo: ativado" color="#ffd166" />}
      {id === "instruments" && <Screen pos={[0, 2.85, -0.15]} text="EU TOCO TAMBÉM" sub="guitarra • baixo • violão • escaleta • gaita" color="#7CFF9B" />}
      {id === "notgood" && <Screen pos={[0, 2.85, -0.15]} text="NÃO SOU BOM" sub="mas..." color="#ffb347" />}
      {id === "play" && <Screen pos={[0, 2.85, -0.15]} text="EU TOCO MESMO" sub="e isso já é alguma coisa" color="#7CFF9B" />}
      {(id === "moral" || id === "cta") && <Screen pos={[0, 2.85, -0.15]} text="DÁ UMA MORAL" sub="segue • curte • comenta • compartilha" color="#7CFF9B" />}
    </group>
  );
};

const CameraRig: React.FC<{ time: number }> = ({ time }) => {
  const { camera } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  const { local, dur } = segInfo(time);
  const p = smooth(local / dur);
  const z = 5.6 - p * 0.12;
  useEffect(() => {
    cam.position.set(0, 1.95, z);
    cam.lookAt(0, 1.85, 0.1); // look higher to keep screen+face centered
    cam.fov = 45;
    cam.near = 0.1;
    cam.far = 100;
    cam.updateProjectionMatrix();
  }, [cam, z]);
  return null;
};

const PostFX: React.FC = () => {
  const { scene, camera } = useThree();
  const fx = useMemo(() => ({ ink: new InkPass(scene, camera as THREE.PerspectiveCamera, { strength: 0.82, widthNear: 4.2, widthFar: 2.6 }), lens: new LensBlur({ maxCoC: 16, nearScale: 1.0 }), bloom: makeBloom(), tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }), grade: new GradeEffect(GRADES.day, GRADE_STRENGTH.day) }), [scene, camera]);
  useEffect(() => () => fx.ink.dispose(), [fx]);
  fx.lens.focus = 5.2; fx.lens.cInf = 5.0;
  return (<EffectComposer multisampling={4}><primitive object={fx.ink} dispose={null} /><primitive object={fx.lens.pre} dispose={null} /><primitive object={fx.lens.main} dispose={null} /><primitive object={fx.bloom} dispose={null} /><primitive object={fx.tone} dispose={null} /><primitive object={fx.grade} dispose={null} /></EffectComposer>);
};

const SceneRoot: React.FC = () => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const time = frame / fps;
  const { scene } = useThree(); noInkFallback(scene);
  return <><World time={time} /><CameraRig time={time} /><PostFX /></>;
};

const OverlayText: React.FC = () => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const t = frame / fps;
  const items: { start: number; end: number; text: string; color?: string }[] = [
    { start: 0.2, end: 3.0, text: "VÍDEO DE CURIOSIDADE MUSICAL TODO DIA", color: "#7fd4ff" },
    { start: 8.2, end: 11.3, text: "E OS SEGUIDORES? SUMIRAM.", color: "#ff5d6c" },
    { start: 15.4, end: 18.2, text: "MENDIGAGEM DIGITAL OFICIAL", color: "#ffd166" },
    { start: 19.4, end: 24.0, text: "TOCO GUITARRA, BAIXO, VIOLÃO, ESCALETA E GAITA", color: "#7CFF9B" },
    { start: 25.1, end: 28.3, text: "NÃO SOU BOM. MAS TOCO MESMO.", color: "#ffb347" },
    { start: 34.3, end: 38.8, text: "SEGUE, CURTE, COMENTA E COMPARTILHA", color: "#7CFF9B" },
  ];
  const active = items.find((it) => t >= it.start && t < it.end);
  if (!active) return null;
  const local = (t - active.start) / Math.max(0.001, active.end - active.start);
  const opacity = local < 0.1 ? local / 0.1 : local > 0.85 ? (1 - local) / 0.15 : 1;
  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 170, pointerEvents: "none" }}>
      <div style={{
        opacity,
        transform: `translateY(${interpolate(local, [0, 1], [-12, 0])}px)`,
        color: active.color,
        fontFamily: "Arial Black, Arial, sans-serif",
        fontSize: 44,
        lineHeight: 1.15,
        textAlign: "center",
        padding: "14px 26px",
        maxWidth: 920,
        textShadow: "0 4px 18px rgba(0,0,0,0.9)",
        backgroundColor: "rgba(0,0,0,0.18)",
        borderRadius: 18,
      }}>
        {active.text}
      </div>
    </AbsoluteFill>
  );
};

export const MendigagemDigitalSegueAiShort: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#171d2e" }}>
    <ThreeCanvas width={1080} height={1920} camera={{ fov: 45, position: [0, 1.95, 5.6], near: 0.1, far: 100 }} gl={{ antialias: false, stencil: false, powerPreference: "high-performance", toneMappingExposure: 1.0 }}>
      <SceneRoot />
    </ThreeCanvas>
    <OverlayText />
    <Audio src={staticFile("mendigagem-digital-segue-ai/voice.wav")} />
  </AbsoluteFill>
);
