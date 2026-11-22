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

export const BTH_FPS = 30;
export const BTH_DURATION = 2602; // ~86.73s
export const BTH_FRAMES = BTH_DURATION;

const SEGS = [
  { id: "hook1", a: 0.092, b: 4.859 },
  { id: "hook2", a: 5.583, b: 9.163 },
  { id: "title", a: 9.894, b: 13.888 },
  { id: "years", a: 14.619, b: 22.458 },
  { id: "instrumental", a: 23.189, b: 29.587 },
  { id: "twohours", a: 30.318, b: 38.782 },
  { id: "friend", a: 39.513, b: 46.229 },
  { id: "bridge", a: 46.96, b: 49.672 },
  { id: "metaphor", a: 50.403, b: 57.987 },
  { id: "chesterConnect", a: 58.718, b: 67.871 },
  { id: "recording", a: 68.602, b: 75.148 },
  { id: "all", a: 75.879, b: 79.396 },
  { id: "cta", a: 80.127, b: 86.733 },
] as const;
type SegId = (typeof SEGS)[number]["id"];

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (t: number) => { const u = clamp01(t); return u * u * (3 - 2 * u); };
const segInfo = (time: number) => {
  for (let i = 0; i < SEGS.length; i++) {
    const s = SEGS[i];
    if (time >= s.a && time < s.b) return { id: s.id as SegId, local: time - s.a, dur: Math.max(0.001, s.b - s.a) };
  }
  const last = SEGS[SEGS.length - 1];
  if (time >= last.b) return { id: last.id as SegId, local: Math.min(last.b - last.a, time - last.a), dur: Math.max(0.001, last.b - last.a) };
  return { id: SEGS[0].id as SegId, local: 0, dur: SEGS[0].b - SEGS[0].a };
};

const makeBloom = () => new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.45, luminanceThreshold: 0.9, luminanceSmoothing: 0.25, mipmapBlur: true, levels: 5, radius: 0.6 });

function makeTex(draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, w = 512, h = 768) {
  const canvas = document.createElement("canvas"); canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d")!; draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; tex.needsUpdate = true; return tex;
}

function drawChibiMike(ctx: CanvasRenderingContext2D, w: number, h: number, mood: "focus" | "soft" | "surprised" = "soft") {
  ctx.clearRect(0, 0, w, h);
  const cx = w * 0.5, by = h * 0.93; const ink = "#1b1820"; const skin = "#efc39b"; const shirt = "#3b4a66"; const pants = "#30323a";
  const line = (lw = 6) => { ctx.lineWidth = lw; ctx.strokeStyle = ink; ctx.lineCap = "round"; ctx.lineJoin = "round"; };
  const fs = (fill: string) => { ctx.fillStyle = fill; ctx.fill(); ctx.stroke(); };
  line(6);
  ctx.beginPath(); ctx.ellipse(cx - 22, by - 48, 14, 38, 0, 0, Math.PI * 2); fs(pants);
  ctx.beginPath(); ctx.ellipse(cx + 22, by - 48, 14, 38, 0, 0, Math.PI * 2); fs(pants);
  ctx.beginPath(); ctx.ellipse(cx, by - 120, 46, 52, 0, 0, Math.PI * 2); fs(shirt);
  ctx.save(); ctx.translate(cx - 46, by - 132); ctx.rotate(0.45); ctx.beginPath(); ctx.ellipse(0, 30, 11, 34, 0, 0, Math.PI * 2); fs(skin); ctx.restore();
  ctx.save(); ctx.translate(cx + 46, by - 132); ctx.rotate(-0.45); ctx.beginPath(); ctx.ellipse(0, 30, 11, 34, 0, 0, Math.PI * 2); fs(skin); ctx.restore();
  const hy = by - 265;
  ctx.beginPath(); ctx.ellipse(cx, hy, 78, 74, 0, 0, Math.PI * 2); fs(skin);
  ctx.fillStyle = "#c23b3b"; ctx.strokeStyle = ink; line(4);
  ctx.beginPath(); ctx.ellipse(cx, hy - 38, 78, 30, 0, Math.PI, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.roundRect(cx - 10, hy - 52, 98, 14, 6); ctx.fill(); ctx.stroke();
  const eyeY = hy - 2;
  const drawEye = (ex: number) => {
    ctx.fillStyle = "#fff"; ctx.strokeStyle = ink; line(3);
    ctx.beginPath(); ctx.ellipse(ex, eyeY, 14, 16, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#2a1f24"; ctx.beginPath(); ctx.ellipse(ex, eyeY + 1, 8.5, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(ex - 4, eyeY - 4, 3.5, 4, 0, 0, Math.PI * 2); ctx.fill();
  };
  drawEye(cx - 24); drawEye(cx + 24);
  line(4); ctx.strokeStyle = ink;
  ctx.beginPath(); ctx.moveTo(cx - 38, hy - 24); ctx.quadraticCurveTo(cx - 24, hy - 30, cx - 10, hy - 24); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 10, hy - 24); ctx.quadraticCurveTo(cx + 24, hy - 30, cx + 38, hy - 24); ctx.stroke();
  line(3.5); ctx.beginPath();
  if (mood === "surprised") { ctx.ellipse(cx, hy + 34, 8, 7, 0, 0, Math.PI * 2); ctx.stroke(); }
  else { ctx.moveTo(cx - 10, hy + 33); ctx.quadraticCurveTo(cx, hy + 37, cx + 10, hy + 33); ctx.stroke(); }
  ctx.fillStyle = "rgba(255,150,150,0.2)";
  ctx.beginPath(); ctx.ellipse(cx - 42, hy + 12, 14, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 42, hy + 12, 14, 9, 0, 0, Math.PI * 2); ctx.fill();
}

function drawChibiChester(ctx: CanvasRenderingContext2D, w: number, h: number, mood: "normal" | "sad" | "sing" = "normal") {
  ctx.clearRect(0, 0, w, h);
  const cx = w * 0.5, by = h * 0.93; const ink = "#1b1820"; const skin = "#f1c7a3"; const shirt = "#2f3136"; const pants = "#25262b"; const hair = "#e2c675";
  const line = (lw = 6) => { ctx.lineWidth = lw; ctx.strokeStyle = ink; ctx.lineCap = "round"; ctx.lineJoin = "round"; };
  const fs = (fill: string) => { ctx.fillStyle = fill; ctx.fill(); ctx.stroke(); };
  line(6);
  ctx.beginPath(); ctx.ellipse(cx - 22, by - 48, 14, 38, 0, 0, Math.PI * 2); fs(pants);
  ctx.beginPath(); ctx.ellipse(cx + 22, by - 48, 14, 38, 0, 0, Math.PI * 2); fs(pants);
  ctx.beginPath(); ctx.ellipse(cx, by - 120, 46, 52, 0, 0, Math.PI * 2); fs(shirt);
  ctx.save(); ctx.translate(cx - 46, by - 132); ctx.rotate(0.45); ctx.beginPath(); ctx.ellipse(0, 30, 11, 34, 0, 0, Math.PI * 2); fs(skin); ctx.restore();
  ctx.save(); ctx.translate(cx + 46, by - 132); ctx.rotate(-0.45); ctx.beginPath(); ctx.ellipse(0, 30, 11, 34, 0, 0, Math.PI * 2); fs(skin); ctx.restore();
  const hy = by - 265;
  ctx.beginPath(); ctx.ellipse(cx, hy, 78, 74, 0, 0, Math.PI * 2); fs(skin);
  // spiky blond hair
  ctx.fillStyle = hair; ctx.strokeStyle = ink; line(4);
  ctx.beginPath();
  ctx.moveTo(cx - 74, hy - 12);
  ctx.quadraticCurveTo(cx - 76, hy - 55, cx - 44, hy - 66);
  ctx.lineTo(cx - 50, hy - 84); ctx.lineTo(cx - 32, hy - 72);
  ctx.lineTo(cx - 28, hy - 92); ctx.lineTo(cx - 12, hy - 74);
  ctx.lineTo(cx - 2, hy - 95); ctx.lineTo(cx + 12, hy - 75);
  ctx.lineTo(cx + 26, hy - 93); ctx.lineTo(cx + 38, hy - 72);
  ctx.lineTo(cx + 52, hy - 86); ctx.lineTo(cx + 46, hy - 64);
  ctx.quadraticCurveTo(cx + 76, hy - 52, cx + 74, hy - 12);
  ctx.quadraticCurveTo(cx + 30, hy - 28, cx, hy - 26);
  ctx.quadraticCurveTo(cx - 30, hy - 28, cx - 74, hy - 12);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // cheeks
  ctx.fillStyle = "rgba(255,150,150,0.22)";
  ctx.beginPath(); ctx.ellipse(cx - 42, hy + 12, 14, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 42, hy + 12, 14, 9, 0, 0, Math.PI * 2); ctx.fill();
  // eyes
  const eyeY = hy - 2;
  const drawEye = (ex: number) => {
    ctx.fillStyle = "#fff"; ctx.strokeStyle = ink; line(3);
    ctx.beginPath(); ctx.ellipse(ex, eyeY, 14, 16, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#2a1f24";
    if (mood === "sad") { ctx.beginPath(); ctx.ellipse(ex, eyeY + 3, 8, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(ex - 3, eyeY - 2, 3, 3, 0, 0, Math.PI * 2); ctx.fill(); }
    else { ctx.beginPath(); ctx.ellipse(ex, eyeY + 1, 8.5, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(ex - 4, eyeY - 4, 3.5, 4, 0, 0, Math.PI * 2); ctx.fill(); }
  };
  drawEye(cx - 24); drawEye(cx + 24);
  // brows
  line(4); ctx.strokeStyle = ink;
  const brow = mood === "sad" ? 4 : 0;
  ctx.beginPath(); ctx.moveTo(cx - 38, hy - 24 + brow); ctx.quadraticCurveTo(cx - 24, hy - 30 + brow, cx - 10, hy - 24 + brow); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 10, hy - 24 + brow); ctx.quadraticCurveTo(cx + 24, hy - 30 + brow, cx + 38, hy - 24 + brow); ctx.stroke();
  line(3.5); ctx.beginPath();
  if (mood === "sing") { ctx.ellipse(cx, hy + 34, 9, 6, 0, 0, Math.PI * 2); ctx.stroke(); }
  else if (mood === "sad") { ctx.arc(cx, hy + 38, 10, 1.2 * Math.PI, 1.8 * Math.PI); ctx.stroke(); }
  else { ctx.moveTo(cx - 9, hy + 33); ctx.quadraticCurveTo(cx, hy + 37, cx + 9, hy + 33); ctx.stroke(); }
}

const Card: React.FC<{ tex: THREE.Texture; pos: [number, number, number]; scale?: number | [number, number, number]; rot?: [number, number, number]; opacity?: number }> = ({ tex, pos, scale = 1, rot = [0, 0, 0], opacity = 1 }) => (
  <mesh position={pos} rotation={rot} scale={scale as any} layers={NOINK}>
    <planeGeometry args={[2.2, 3.3]} />
    <meshBasicMaterial map={tex} transparent alphaTest={0.05} side={THREE.DoubleSide} opacity={opacity} />
  </mesh>
);

// Chester images replaced by chibi procedural characters for consistent style

const Label3D: React.FC<{ text: string; pos: [number, number, number]; color?: string; bg?: string; w?: number; h?: number; scale?: number }> = ({ text, pos, color = "#ffffff", bg = "rgba(0,0,0,0.45)", w = 720, h = 128, scale = 1 }) => {
  const tex = useMemo(() => makeTex((ctx, W, H) => {
    ctx.clearRect(0, 0, W, H); ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(20, 20, W - 40, H - 40, 20); ctx.fill();
    ctx.fillStyle = color; ctx.font = "bold 46px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(text, W / 2, H / 2);
  }, w, h), [text, color, bg, w, h]);
  return <Card tex={tex} pos={pos} scale={[scale * 2.4, scale * 0.55, 1] as any} />;
};

const BoxProp: React.FC<{ pos: [number, number, number]; args: [number, number, number]; color: string; rot?: [number, number, number] }> = ({ pos, args, color, rot = [0, 0, 0] }) => (
  <mesh position={pos} rotation={rot} castShadow receiveShadow><boxGeometry args={args} /><meshLambertMaterial color={color} /></mesh>
);
const Cyl: React.FC<{ pos: [number, number, number]; args: [number, number, number, number?]; color: string; rot?: [number, number, number] }> = ({ pos, args, color, rot = [0, 0, 0] }) => (
  <mesh position={pos} rotation={rot} castShadow receiveShadow><cylinderGeometry args={args} /><meshLambertMaterial color={color} /></mesh>
);

const MicStand: React.FC<{ pos: [number, number, number] }> = ({ pos }) => (
  <group position={pos}><Cyl pos={[0, 0.9, 0]} args={[0.03, 0.03, 1.8, 12]} color="#222" /><Cyl pos={[0, 0.02, 0]} args={[0.22, 0.25, 0.04, 16]} color="#1a1a1a" /><mesh position={[0, 1.85, 0.08]} rotation={[Math.PI / 2, 0, 0]} castShadow><sphereGeometry args={[0.09, 16, 16]} /><meshLambertMaterial color="#9aa0a6" /></mesh></group>
);
const KeyboardProp: React.FC<{ pos: [number, number, number] }> = ({ pos }) => (
  <group position={pos}><BoxProp pos={[0, 0, 0]} args={[1.2, 0.08, 0.35]} color="#22262f" /><BoxProp pos={[0, 0.05, 0]} args={[1.05, 0.02, 0.22]} color="#f0f0f0" /></group>
);
const StudioDesk: React.FC<{ pos: [number, number, number] }> = ({ pos }) => (
  <group position={pos}><BoxProp pos={[0, 0.45, 0]} args={[2.4, 0.08, 0.9]} color="#3a2a20" /><BoxProp pos={[-1.05, 0.22, 0]} args={[0.08, 0.44, 0.8]} color="#2e2118" /><BoxProp pos={[1.05, 0.22, 0]} args={[0.08, 0.44, 0.8]} color="#2e2118" /><BoxProp pos={[0.2, 0.62, -0.15]} args={[0.9, 0.22, 0.35]} color="#1f232b" /></group>
);

const World: React.FC<{ time: number }> = ({ time }) => {
  const { id, local, dur } = segInfo(time);
  const p = smooth(local / dur);
  const mike = useMemo(() => makeTex((c, w, h) => drawChibiMike(c, w, h, id === "years" || id === "twohours" ? "focus" : id === "instrumental" ? "surprised" : "soft"), 512, 768), [id]);
  const chester = useMemo(() => makeTex((c, w, h) => drawChibiChester(c, w, h, id === "chesterConnect" ? "sad" : id === "recording" || id === "all" ? "sing" : "normal"), 512, 768), [id]);
  useEffect(() => () => { mike.dispose(); }, [mike]);
  useEffect(() => () => { chester.dispose(); }, [chester]);

  const bg = id === "hook1" || id === "hook2" ? "#0e1430" : id === "years" || id === "twohours" || id === "instrumental" ? "#181528" : id === "friend" ? "#18222a" : id === "metaphor" || id === "chesterConnect" ? "#14132a" : id === "recording" ? "#120f24" : "#141a2e";
  const ground = "#23293a";

  return (
    <group>
      <color attach="background" args={[bg]} />
      <fog attach="fog" args={[bg, 8, 30]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 7, 4]} intensity={1.2} color="#fff0d8" />
      <directionalLight position={[-5, 4, -2]} intensity={0.45} color="#7cc0ff" />
      {id === "hook1" && <pointLight position={[-2, 3, 2]} intensity={2.2} color="#4da6ff" distance={12} />}
      {id === "hook2" && <pointLight position={[2, 3, 2]} intensity={2.0} color="#ff4d6d" distance={12} />}
      {id === "recording" && <pointLight position={[0, 2.5, 1.5]} intensity={2.4} color="#c77dff" distance={10} />}
      {id === "all" && <><pointLight position={[-3, 4, 2]} intensity={2.0} color="#4da6ff" distance={14} /><pointLight position={[3, 4, 2]} intensity={1.8} color="#ff4d8d" distance={14} /></>}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow><planeGeometry args={[40, 40]} /><meshLambertMaterial color={ground} /></mesh>
      <mesh position={[0, 3.2, -6]} receiveShadow><planeGeometry args={[20, 8]} /><meshLambertMaterial color="#1d2436" /></mesh>

      {id === "hook1" && (
          <group>
            <Card tex={chester} pos={[0, 1.58, 0.2]} scale={1.0} />
            <BoxProp pos={[2.2, 2.0, -1.5]} args={[1.6, 1.2, 0.08]} color="#22304a" />
            <Label3D text="ERA SOBRE CHESTER?" pos={[0, 3.35, -2.2]} color="#7fd4ff" />
          </group>
        )}
        {id === "hook2" && (
          <group>
            <Card tex={chester} pos={[-0.8, 1.55, 0.1]} scale={0.95} />
            {/* symbolic empty chair/silhouette, not a real identified person */}
            <BoxProp pos={[1.1, 0.45, -0.8]} args={[0.7, 0.9, 0.7]} color="#2a2f3a" />
            <BoxProp pos={[1.1, 1.05, -1.05]} args={[0.7, 0.7, 0.12]} color="#2a2f3a" />
            <mesh position={[1.1, 1.55, -0.5]} layers={NOINK}><planeGeometry args={[1.0, 2.0]} /><meshBasicMaterial color="#7fa6ff" transparent opacity={0.12} /></mesh>
            <Label3D text="OUTRA HISTÓRIA" pos={[0, 3.35, -2.2]} color="#ffd166" />
          </group>
        )}
        {id === "title" && (
          <group>
            <Card tex={chester} pos={[-0.7, 1.55, 0.2]} scale={0.95} />
            <KeyboardProp pos={[1.0, 0.8, -0.8]} />
            <StudioDesk pos={[1.0, 0, -1.2]} />
            <Label3D text="BREAKING THE HABIT" pos={[0, 3.45, -2.3]} color="#ffffff" />
            <Label3D text="METEORA • 2003" pos={[0, 2.85, -2.0]} color="#7fd4ff" bg="rgba(0,0,0,0.3)" scale={0.75} />
          </group>
        )}
        {id === "years" && (
          <group>
            <StudioDesk pos={[-0.8, 0, -1.4]} />
            <KeyboardProp pos={[-0.6, 0.55, -1.3]} />
            <BoxProp pos={[0.9, 0.58, -1.2]} args={[0.7, 0.05, 0.5]} color="#efe4c8" />
            <BoxProp pos={[1.2, 0.62, -1.0]} args={[0.5, 0.04, 0.35]} color="#efe4c8" rot={[0, 0.3, 0]} />
            <Card tex={mike} pos={[-0.4, 1.55, 0.2]} scale={0.95} />
            <Label3D text="UMA IDEIA DE 5 ANOS" pos={[0, 3.4, -2.3]} color="#ffd166" />
          </group>
        )}
        {id === "instrumental" && (
          <group>
            <KeyboardProp pos={[0, 0.85, -1.0]} />
            <StudioDesk pos={[0, 0, -1.4]} />
            <BoxProp pos={[-2.8, 1.2, -2.8]} args={[0.08, 2.4, 0.08]} color="#8aa0b8" />
            <BoxProp pos={[2.8, 1.2, -2.8]} args={[0.08, 2.4, 0.08]} color="#8aa0b8" />
            <Card tex={mike} pos={[-0.9, 1.5, 0.1]} scale={0.9} />
            <Card tex={chester} pos={[0.9, 1.45, -0.6]} scale={0.85} />
            <Label3D text="COMEÇOU COMO INSTRUMENTAL" pos={[0, 3.45, -2.4]} w={920} scale={0.72} color="#7fd4ff" />
          </group>
        )}
        {id === "twohours" && (
          <group>
            <StudioDesk pos={[0, 0, -1.4]} />
            <KeyboardProp pos={[0.2, 0.55, -1.3]} />
            <mesh position={[2.2, 2.2, -1.5]} layers={NOINK}><ringGeometry args={[0.45, 0.55, 48]} /><meshBasicMaterial color="#ffd166" side={THREE.DoubleSide} /></mesh>
            <BoxProp pos={[2.2, 2.2, -1.45]} args={[0.05, 0.35, 0.03]} color="#ffd166" />
            <Card tex={mike} pos={[-0.4, 1.55, 0.2]} scale={0.95} />
            <Label3D text="A LETRA: CERCA DE 2 HORAS" pos={[0, 3.45, -2.4]} w={920} scale={0.72} color="#ffd166" />
          </group>
        )}
        {id === "friend" && (
          <group>
            <BoxProp pos={[0, 2.8, -4]} args={[12, 5.5, 0.2]} color="#203040" />
            <BoxProp pos={[-3.2, 1.2, -2.2]} args={[1.8, 2.4, 1.8]} color="#2a3a4a" />
            <BoxProp pos={[3.2, 1.4, -2.6]} args={[2.0, 2.8, 2.0]} color="#2a3a4a" />
            <Card tex={mike} pos={[-0.6, 1.5, 0.1]} scale={0.92} />
            <mesh position={[0.9 + p * 0.5, 1.4, -1.0 - p * 0.8]} layers={NOINK}>
              <planeGeometry args={[1.0, 2.2]} />
              <meshBasicMaterial color="#8fb3ff" transparent opacity={0.18} />
            </mesh>
            <Label3D text="UM AMIGO DA ÉPOCA DA FACULDADE" pos={[0, 3.45, -2.4]} w={980} scale={0.68} color="#8ecbff" />
          </group>
        )}
        {id === "bridge" && (
          <group>
            <Card tex={chester} pos={[0, 1.58, 0.2]} scale={1.0} />
            <Label3D text="A HISTÓRIA É MAIS PROFUNDA" pos={[0, 3.4, -2.2]} w={920} scale={0.72} color="#ffd166" />
          </group>
        )}
        {id === "metaphor" && (
          <group>
            <Card tex={chester} pos={[-0.5, 1.55, 0.1]} scale={0.95} />
            <mesh position={[0.9, 1.8, -1.0]} layers={NOINK}><planeGeometry args={[1.6, 2.8]} /><meshBasicMaterial color="#9fb8ff" transparent opacity={0.12} side={THREE.DoubleSide} /></mesh>
            <mesh position={[1.4, 1.8, -1.5]} layers={NOINK}><planeGeometry args={[1.4, 2.6]} /><meshBasicMaterial color="#c77dff" transparent opacity={0.1} side={THREE.DoubleSide} /></mesh>
            <Label3D text="NÃO ERA UMA BIOGRAFIA LITERAL" pos={[0, 3.45, -2.4]} w={940} scale={0.68} color="#cfa0ff" />
          </group>
        )}
        {id === "chesterConnect" && (
          <group>
            <MicStand pos={[0.8, 0, -0.6]} />
            <Card tex={chester} pos={[-0.7, 1.58, 0.2]} scale={0.98} />
            <Card tex={mike} pos={[0.9, 1.45, -0.8]} scale={0.85} />
            <Label3D text="CHESTER SE IDENTIFICOU" pos={[0, 3.45, -2.4]} w={860} scale={0.72} color="#ff9bc0" />
          </group>
        )}
        {id === "recording" && (
          <group>
            <MicStand pos={[0.2, 0, -0.5]} />
            <Card tex={chester} pos={[0, 1.58, 0.2]} scale={1.0} />
            <BoxProp pos={[2.4, 1.3, -2.0]} args={[1.2, 2.2, 0.1]} color="#24304a" />
            <Label3D text="FOI DIFÍCIL GRAVAR" pos={[0, 3.45, -2.4]} color="#ff9bc0" />
          </group>
        )}
        {id === "all" && (
          <group>
            {Array.from({ length: 14 }).map((_, i) => (
              <mesh key={i} position={[-3.2 + i * 0.5, 0.5 + (i % 3) * 0.12, -2.8]} layers={NOINK}>
                <boxGeometry args={[0.28, 0.7 + (i % 4) * 0.1, 0.2]} /><meshLambertMaterial color="#151a28" />
              </mesh>
            ))}
            <Card tex={chester} pos={[0, 1.58, 0.2]} scale={1.0} />
            <Label3D text="A HISTÓRIA VIROU DE TODOS" pos={[0, 3.45, -2.4]} w={900} scale={0.7} color="#ffffff" />
          </group>
        )}
        {id === "cta" && (
          <group>
            <Card tex={chester} pos={[0, 1.58, 0.2]} scale={1.0} />
            <Label3D text="ELA FALAVA COM VOCÊ TAMBÉM?" pos={[0, 3.45, -2.4]} w={940} scale={0.68} color="#ffffff" />
          </group>
        )}
    </group>
  );
};

const CameraAndPost: React.FC<{ time: number }> = ({ time }) => {
  const { camera, scene } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  const { id, local, dur } = segInfo(time);
  const p = smooth(local / dur);
  const pos = new THREE.Vector3(); const look = new THREE.Vector3();
  if (id === "hook1") { pos.set(0, 1.75, 5.2 - p * 0.3); look.set(0, 1.55, 0.1); }
  else if (id === "hook2") { pos.set(0, 1.8, 5.4 - p * 0.3); look.set(0, 1.5, -0.2); }
  else if (id === "title") { pos.set(0, 1.8, 5.4 - p * 0.3); look.set(0, 1.55, -0.2); }
  else if (id === "years") { pos.set(-0.2, 1.8, 5.2 - p * 0.3); look.set(-0.2, 1.55, -0.1); }
  else if (id === "instrumental") { pos.set(0, 1.9, 5.8 - p * 0.3); look.set(0, 1.5, -0.6); }
  else if (id === "twohours") { pos.set(-0.2, 1.8, 5.2 - p * 0.3); look.set(-0.2, 1.55, -0.1); }
  else if (id === "friend") { pos.set(0, 1.8, 5.4 - p * 0.3); look.set(0, 1.5, -0.6); }
  else if (id === "bridge") { pos.set(0, 1.8, 5.0 - p * 0.3); look.set(0, 1.58, 0.1); }
  else if (id === "metaphor") { pos.set(0, 1.8, 5.3 - p * 0.3); look.set(0, 1.55, -0.2); }
  else if (id === "chesterConnect") { pos.set(0, 1.8, 5.4 - p * 0.3); look.set(0, 1.55, -0.2); }
  else if (id === "recording") { pos.set(0, 1.75, 5.0 - p * 0.3); look.set(0, 1.58, 0.1); }
  else if (id === "all") { pos.set(0, 1.9, 5.8 - p * 0.4); look.set(0, 1.55, -0.5); }
  else { pos.set(0, 1.85, 5.2 - p * 0.4); look.set(0, 1.6, 0.1); }
  cam.position.copy(pos); cam.lookAt(look); cam.fov = 44; cam.near = 0.1; cam.far = 100; cam.updateProjectionMatrix();

  const fx = useMemo(() => ({
    ink: new InkPass(scene, cam, { strength: 0.82, widthNear: 4.2, widthFar: 2.6 }),
    lens: new LensBlur({ maxCoC: 18, nearScale: 1.1 }),
    bloom: makeBloom(),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(GRADES.day, GRADE_STRENGTH.day),
  }), [scene, cam]);
  useEffect(() => () => fx.ink.dispose(), [fx]);
  fx.lens.focus = Math.max(0.5, pos.distanceTo(new THREE.Vector3(0, 1.6, 0)));
  fx.lens.cInf = id === "recording" ? 3.5 : 5.0;
  const golden = id === "cta" || id === "all";
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
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const time = frame / fps;
  const { scene } = useThree(); noInkFallback(scene);
  return <><World time={time} /><CameraAndPost time={time} /></>;
};

const OverlayText: React.FC = () => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const t = frame / fps;
  const items: { start: number; end: number; text: string; color?: string }[] = [
    { start: 0.2, end: 4.0, text: "ERA SOBRE CHESTER?", color: "#7fd4ff" },
    { start: 5.7, end: 8.8, text: "A INSPIRAÇÃO VEIO DE OUTRA HISTÓRIA", color: "#ffd166" },
    { start: 10.0, end: 13.6, text: "BREAKING THE HABIT • METEORA 2003", color: "#ffffff" },
    { start: 14.8, end: 18.5, text: "UMA IDEIA DE 5 ANOS", color: "#ffd166" },
    { start: 23.3, end: 27.0, text: "COMEÇOU COMO INSTRUMENTAL", color: "#7fd4ff" },
    { start: 30.5, end: 35.0, text: "A LETRA: CERCA DE 2 HORAS", color: "#ffd166" },
    { start: 39.7, end: 44.0, text: "UM AMIGO DA ÉPOCA DA FACULDADE", color: "#8ecbff" },
    { start: 50.6, end: 55.0, text: "NÃO ERA UMA BIOGRAFIA LITERAL", color: "#cfa0ff" },
    { start: 58.9, end: 63.5, text: "CHESTER SE IDENTIFICOU", color: "#ff9bc0" },
    { start: 68.8, end: 72.5, text: "FOI DIFÍCIL GRAVAR", color: "#ff9bc0" },
    { start: 76.0, end: 79.2, text: "A HISTÓRIA VIROU DE TODOS", color: "#ffffff" },
    { start: 81.0, end: 86.5, text: "ELA FALAVA COM VOCÊ TAMBÉM?", color: "#ffffff" },
  ];
  const active = items.find((it) => t >= it.start && t < it.end);
  if (!active) return null;
  const local = (t - active.start) / Math.max(0.001, active.end - active.start);
  const opacity = local < 0.1 ? local / 0.1 : local > 0.85 ? (1 - local) / 0.15 : 1;
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 230, pointerEvents: "none" }}>
      <div style={{ opacity, transform: `translateY(${interpolate(local, [0, 1], [18, 0])}px)`, color: active.color, fontFamily: "Arial Black, Arial, sans-serif", fontSize: 48, lineHeight: 1.12, textAlign: "center", padding: "16px 28px", maxWidth: 940, textShadow: "0 4px 18px rgba(0,0,0,0.85)" }}>
        {active.text}
      </div>
    </AbsoluteFill>
  );
};

export const BreakingTheHabitOriginShort: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0b1020" }}>
      <ThreeCanvas width={1080} height={1920} camera={{ fov: 42, position: [0, 1.7, 4.6], near: 0.1, far: 100 }} gl={{ antialias: false, stencil: false, powerPreference: "high-performance", toneMappingExposure: 1.0 }}>
        <SceneRoot />
      </ThreeCanvas>
      <OverlayText />
      <Audio src={staticFile("breaking-the-habit-origin/voice.wav")} />
    </AbsoluteFill>
  );
};
