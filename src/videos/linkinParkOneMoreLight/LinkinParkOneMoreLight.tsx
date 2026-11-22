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

export const OML_FPS = 30;
export const OML_DURATION = 2250; // 75s
export const OML_FRAMES = OML_DURATION;

const SEGS = [
  { id: "hook", a: 0.098, b: 3.968 },
  { id: "loss", a: 4.796, b: 16.755 },
  { id: "writing", a: 16.947, b: 26.671 },
  { id: "message", a: 26.683, b: 34.964 },
  { id: "title", a: 34.976, b: 46.695 },
  { id: "release", a: 46.707, b: 55.252 },
  { id: "cta", a: 55.264, b: 75.0 },
] as const;
type SegId = (typeof SEGS)[number]["id"];

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (t: number) => { const u = clamp01(t); return u * u * (3 - 2 * u); };
const segInfo = (time: number) => {
  for (let i = 0; i < SEGS.length; i++) {
    const s = SEGS[i];
    if (time >= s.a && time < s.b) return { id: s.id as SegId, local: time - s.a, dur: Math.max(0.001, s.b - s.a), idx: i };
  }
  const last = SEGS[SEGS.length - 1];
  if (time >= last.b) return { id: last.id as SegId, local: Math.min(last.b - last.a, time - last.a), dur: Math.max(0.001, last.b - last.a), idx: SEGS.length - 1 };
  return { id: SEGS[0].id as SegId, local: 0, dur: SEGS[0].b - SEGS[0].a, idx: 0 };
};

const makeBloom = () => new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.5, luminanceThreshold: 0.9, luminanceSmoothing: 0.25, mipmapBlur: true, levels: 5, radius: 0.65 });

type Mood = "neutral" | "soft" | "sad" | "sing" | "hope" | "focus";

function drawChibi(ctx: CanvasRenderingContext2D, w: number, h: number, opts: {
  mood: Mood; skin?: string; hair?: string; shirt?: string; pants?: string; hairStyle?: "spiky" | "short" | "cap" | "long";
  accessory?: "mic" | "guitar" | "none"; eyeScale?: number;
}) {
  ctx.clearRect(0, 0, w, h);
  const cx = w * 0.5, by = h * 0.93;
  const ink = "#1b1820";
  const skin = opts.skin ?? "#f1c7a3";
  const shirt = opts.shirt ?? "#2f3136";
  const pants = opts.pants ?? "#25262b";
  const hair = opts.hair ?? "#e2c675";
  const line = (lw = 6) => { ctx.lineWidth = lw; ctx.strokeStyle = ink; ctx.lineCap = "round"; ctx.lineJoin = "round"; };
  const fs = (fill: string) => { ctx.fillStyle = fill; ctx.fill(); ctx.stroke(); };

  // chibi proportions: bigger head, smaller body
  // legs
  line(6);
  ctx.beginPath(); ctx.ellipse(cx - 22, by - 48, 14, 38, 0, 0, Math.PI * 2); fs(pants);
  ctx.beginPath(); ctx.ellipse(cx + 22, by - 48, 14, 38, 0, 0, Math.PI * 2); fs(pants);
  ctx.beginPath(); ctx.ellipse(cx - 24, by - 12, 18, 8, 0, 0, Math.PI * 2); fs("#1d1d22");
  ctx.beginPath(); ctx.ellipse(cx + 24, by - 12, 18, 8, 0, 0, Math.PI * 2); fs("#1d1d22");
  // body
  ctx.beginPath(); ctx.ellipse(cx, by - 120, 46, 52, 0, 0, Math.PI * 2); fs(shirt);
  // arms
  ctx.save(); ctx.translate(cx - 46, by - 132); ctx.rotate(0.45); ctx.beginPath(); ctx.ellipse(0, 30, 11, 34, 0, 0, Math.PI * 2); fs(skin); ctx.restore();
  ctx.save(); ctx.translate(cx + 46, by - 132); ctx.rotate(-0.45); ctx.beginPath(); ctx.ellipse(0, 30, 11, 34, 0, 0, Math.PI * 2); fs(skin); ctx.restore();
  // neck
  ctx.beginPath(); ctx.roundRect(cx - 14, by - 182, 28, 20, 8); fs(skin);
  // big head
  const hy = by - 265;
  ctx.beginPath(); ctx.ellipse(cx, hy, 78, 74, 0, 0, Math.PI * 2); fs(skin);
  // hair
  ctx.fillStyle = hair; ctx.strokeStyle = ink; line(4);
  if (opts.hairStyle === "cap") {
    ctx.beginPath(); ctx.ellipse(cx, hy - 38, 78, 30, 0, Math.PI, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(cx - 12, hy - 52, 95, 14, 6); ctx.fill(); ctx.stroke();
  } else if (opts.hairStyle === "short") {
    ctx.beginPath(); ctx.moveTo(cx - 76, hy - 10); ctx.quadraticCurveTo(cx - 78, hy - 62, cx - 35, hy - 72);
    ctx.lineTo(cx - 20, hy - 84); ctx.lineTo(cx - 5, hy - 74); ctx.lineTo(cx + 10, hy - 86); ctx.lineTo(cx + 28, hy - 72);
    ctx.quadraticCurveTo(cx + 78, hy - 60, cx + 76, hy - 10);
    ctx.quadraticCurveTo(cx + 35, hy - 30, cx, hy - 28); ctx.quadraticCurveTo(cx - 35, hy - 30, cx - 76, hy - 10);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (opts.hairStyle === "long") {
    ctx.beginPath(); ctx.ellipse(cx, hy - 18, 82, 62, 0, Math.PI, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(cx - 84, hy - 20, 24, 90, 12); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(cx + 60, hy - 20, 24, 90, 12); ctx.fill(); ctx.stroke();
  } else { // spiky
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
  }

  // cheeks
  ctx.fillStyle = "rgba(255,150,150,0.22)";
  ctx.beginPath(); ctx.ellipse(cx - 42, hy + 12, 14, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 42, hy + 12, 14, 9, 0, 0, Math.PI * 2); ctx.fill();

  // eyes (big cute)
  const es = opts.eyeScale ?? 1;
  const eyeY = hy - 2;
  const drawEye = (ex: number) => {
    ctx.fillStyle = "#ffffff"; ctx.strokeStyle = ink; line(3);
    ctx.beginPath(); ctx.ellipse(ex, eyeY, 14 * es, 16 * es, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#2a1f24";
    if (opts.mood === "sad") {
      ctx.beginPath(); ctx.ellipse(ex, eyeY + 3, 8 * es, 9 * es, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(ex - 3, eyeY - 2, 3, 3, 0, 0, Math.PI * 2); ctx.fill();
    } else if (opts.mood === "focus") {
      line(4); ctx.beginPath(); ctx.moveTo(ex - 10, eyeY); ctx.lineTo(ex + 10, eyeY); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.ellipse(ex, eyeY + 1, 8.5 * es, 10 * es, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath(); ctx.ellipse(ex - 4, eyeY - 4, 3.5, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(ex + 3, eyeY + 4, 2, 2, 0, 0, Math.PI * 2); ctx.fill();
    }
  };
  drawEye(cx - 24);
  drawEye(cx + 24);

  // eyebrows
  line(4); ctx.strokeStyle = ink;
  const brow = opts.mood === "sad" ? 4 : opts.mood === "hope" ? -2 : 0;
  ctx.beginPath(); ctx.moveTo(cx - 38, hy - 24 + brow); ctx.quadraticCurveTo(cx - 24, hy - 30 + brow, cx - 10, hy - 24 + brow); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 10, hy - 24 + brow); ctx.quadraticCurveTo(cx + 24, hy - 30 + brow, cx + 38, hy - 24 + brow); ctx.stroke();

  // nose & mouth
  line(3); ctx.beginPath(); ctx.moveTo(cx, hy + 12); ctx.lineTo(cx - 3, hy + 20); ctx.lineTo(cx + 3, hy + 20); ctx.stroke();
  line(3.5);
  ctx.beginPath();
  if (opts.mood === "sing") { ctx.ellipse(cx, hy + 34, 9, 6, 0, 0, Math.PI * 2); ctx.stroke(); }
  else if (opts.mood === "hope") { ctx.arc(cx, hy + 30, 11, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); }
  else if (opts.mood === "sad") { ctx.arc(cx, hy + 38, 10, 1.2 * Math.PI, 1.8 * Math.PI); ctx.stroke(); }
  else { ctx.moveTo(cx - 9, hy + 33); ctx.quadraticCurveTo(cx, hy + 37, cx + 9, hy + 33); ctx.stroke(); }

  if (opts.accessory === "mic") {
    ctx.save(); ctx.translate(cx + 42, by - 150); ctx.rotate(-0.2);
    line(5); ctx.strokeStyle = "#333"; ctx.beginPath(); ctx.moveTo(0, -40); ctx.lineTo(0, 60); ctx.stroke();
    ctx.fillStyle = "#9aa0a6"; ctx.strokeStyle = ink; line(3); ctx.beginPath(); ctx.ellipse(0, -48, 12, 14, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  if (opts.accessory === "guitar") {
    ctx.save(); ctx.translate(cx + 20, by - 105); ctx.rotate(-0.15);
    line(4); ctx.fillStyle = "#7a4a2f"; ctx.strokeStyle = ink;
    ctx.beginPath(); ctx.rect(-5, -90, 10, 70); fs("#5a3520");
    ctx.beginPath(); ctx.ellipse(0, 10, 26, 30, 0, 0, Math.PI * 2); fs("#b0633a");
    ctx.beginPath(); ctx.ellipse(0, 35, 22, 24, 0, 0, Math.PI * 2); fs("#b0633a");
    ctx.restore();
  }
}

function makeTex(draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, w = 512, h = 768) {
  const canvas = document.createElement("canvas"); canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d")!; draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; tex.needsUpdate = true; return tex;
}

const Card: React.FC<{ tex: THREE.Texture; pos: [number, number, number]; scale?: number | [number, number, number]; rot?: [number, number, number]; opacity?: number }> = ({ tex, pos, scale = 1, rot = [0, 0, 0], opacity = 1 }) => (
  <mesh position={pos} rotation={rot} scale={scale as any} layers={NOINK}>
    <planeGeometry args={[2.2, 3.3]} />
    <meshBasicMaterial map={tex} transparent alphaTest={0.05} side={THREE.DoubleSide} opacity={opacity} />
  </mesh>
);

const Label3D: React.FC<{ text: string; pos: [number, number, number]; color?: string; bg?: string; w?: number; h?: number; scale?: number }> = ({ text, pos, color = "#ffffff", bg = "rgba(0,0,0,0.45)", w = 640, h = 128, scale = 1 }) => {
  const tex = useMemo(() => makeTex((ctx, W, H) => {
    ctx.clearRect(0, 0, W, H); ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(20, 20, W - 40, H - 40, 20); ctx.fill();
    ctx.fillStyle = color; ctx.font = "bold 48px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(text, W / 2, H / 2);
  }, w, h), [text, color, bg, w, h]);
  return <Card tex={tex} pos={pos} scale={[scale * 2.4, scale * 0.55, 1] as any} />;
};

const BoxProp: React.FC<{ pos: [number, number, number]; args: [number, number, number]; color: string; rot?: [number, number, number] }> = ({ pos, args, color, rot = [0, 0, 0] }) => (
  <mesh position={pos} rotation={rot} castShadow receiveShadow><boxGeometry args={args} /><meshLambertMaterial color={color} /></mesh>
);
const Cyl: React.FC<{ pos: [number, number, number]; args: [number, number, number, number?]; color: string; rot?: [number, number, number] }> = ({ pos, args, color, rot = [0, 0, 0] }) => (
  <mesh position={pos} rotation={rot} castShadow receiveShadow><cylinderGeometry args={args} /><meshLambertMaterial color={color} /></mesh>
);

const WarmLightSymbol: React.FC<{ pos: [number, number, number]; scale?: number; intensity?: number }> = ({ pos, scale = 1, intensity = 1.6 }) => (
  <group position={pos} scale={scale}>
    <pointLight intensity={intensity} color="#ffd89a" distance={8} />
    <mesh layers={NOINK}><sphereGeometry args={[0.18, 20, 20]} /><meshBasicMaterial color="#fff1c2" transparent opacity={0.95} /></mesh>
    <mesh layers={NOINK}><sphereGeometry args={[0.34, 20, 20]} /><meshBasicMaterial color="#ffd89a" transparent opacity={0.18} /></mesh>
  </group>
);

const MicStand: React.FC<{ pos: [number, number, number] }> = ({ pos }) => (
  <group position={pos}>
    <Cyl pos={[0, 0.9, 0]} args={[0.03, 0.03, 1.8, 12]} color="#222" />
    <Cyl pos={[0, 0.02, 0]} args={[0.22, 0.25, 0.04, 16]} color="#1a1a1a" />
    <mesh position={[0, 1.85, 0.08]} rotation={[Math.PI / 2, 0, 0]} castShadow><sphereGeometry args={[0.09, 16, 16]} /><meshLambertMaterial color="#9aa0a6" /></mesh>
  </group>
);

const StudioDesk: React.FC<{ pos: [number, number, number] }> = ({ pos }) => (
  <group position={pos}>
    <BoxProp pos={[0, 0.45, 0]} args={[2.4, 0.08, 0.9]} color="#3a2a20" />
    <BoxProp pos={[-1.05, 0.22, 0]} args={[0.08, 0.44, 0.8]} color="#2e2118" />
    <BoxProp pos={[1.05, 0.22, 0]} args={[0.08, 0.44, 0.8]} color="#2e2118" />
    <BoxProp pos={[0.2, 0.62, -0.15]} args={[0.9, 0.22, 0.35]} color="#1f232b" />
    <BoxProp pos={[-0.7, 0.58, 0.15]} args={[0.35, 0.18, 0.25]} color="#252a33" />
  </group>
);

const KeyboardProp: React.FC<{ pos: [number, number, number] }> = ({ pos }) => (
  <group position={pos}>
    <BoxProp pos={[0, 0, 0]} args={[1.2, 0.08, 0.35]} color="#22262f" />
    <BoxProp pos={[0, 0.05, 0]} args={[1.05, 0.02, 0.22]} color="#f0f0f0" />
  </group>
);

const Vinyl: React.FC<{ pos: [number, number, number]; rot?: [number, number, number]; scale?: number }> = ({ pos, rot = [0, 0, 0], scale = 1 }) => (
  <group position={pos} rotation={rot} scale={scale}>
    <mesh castShadow><cylinderGeometry args={[0.7, 0.7, 0.03, 32]} /><meshLambertMaterial color="#111216" /></mesh>
    <mesh position={[0, 0.02, 0]}><cylinderGeometry args={[0.22, 0.22, 0.01, 24]} /><meshLambertMaterial color="#d8d0c0" /></mesh>
  </group>
);

const DrumKit: React.FC<{ pos: [number, number, number]; scale?: number }> = ({ pos, scale = 1 }) => (
  <group position={pos} scale={scale}>
    <Cyl pos={[0, 0.45, 0]} args={[0.45, 0.45, 0.5, 24]} color="#cc3333" />
    <Cyl pos={[-0.55, 0.35, 0.2]} args={[0.28, 0.28, 0.35, 20]} color="#cc3333" />
    <Cyl pos={[0.55, 0.35, 0.2]} args={[0.28, 0.28, 0.35, 20]} color="#cc3333" />
    <mesh position={[0.7, 1.8, -0.2]} rotation={[0.2, 0, 0]} castShadow><cylinderGeometry args={[0.35, 0.35, 0.02, 24]} /><meshLambertMaterial color="#d4af37" /></mesh>
  </group>
);

const Amp: React.FC<{ pos: [number, number, number] }> = ({ pos }) => (
  <group position={pos}><BoxProp pos={[0, 0.35, 0]} args={[0.9, 0.7, 0.45]} color="#1d1f24" /><BoxProp pos={[0, 0.82, 0]} args={[0.85, 0.25, 0.4]} color="#22252b" /></group>
);

const World: React.FC<{ time: number }> = ({ time }) => {
  const { id, local, dur } = segInfo(time);
  const p = smooth(local / dur);
  const chester = useMemo(() => makeTex((c, w, h) => drawChibi(c, w, h, { mood: id === "title" || id === "cta" ? "hope" : "soft", hair: "#e2c675", hairStyle: "spiky", shirt: "#2f3136", accessory: id === "title" ? "mic" : "none" }), 512, 768), [id]);
  const mike = useMemo(() => makeTex((c, w, h) => drawChibi(c, w, h, { mood: id === "writing" || id === "message" ? "focus" : "soft", hair: "#2b2118", hairStyle: "short", shirt: "#3b4a66" }), 512, 768), [id]);
  const eg = useMemo(() => makeTex((c, w, h) => drawChibi(c, w, h, { mood: "soft", hair: "#6b4a2f", hairStyle: "short", shirt: "#5a4a42", accessory: "guitar" }), 512, 768), []);
  const brad = useMemo(() => makeTex((c, w, h) => drawChibi(c, w, h, { mood: "neutral", hair: "#3a2f2a", hairStyle: "short", shirt: "#4a5568", accessory: "guitar" }), 512, 768), []);
  const rob = useMemo(() => makeTex((c, w, h) => drawChibi(c, w, h, { mood: "neutral", hair: "#1f1a17", hairStyle: "short", shirt: "#39414f" }), 512, 768), []);
  useEffect(() => () => { chester.dispose(); }, [chester]);
  useEffect(() => () => { mike.dispose(); }, [mike]);

  const bg = id === "hook" ? "#0d1020" : id === "loss" ? "#141a2a" : id === "writing" ? "#201a16" : id === "message" ? "#1a1820" : id === "title" ? "#171a2a" : id === "release" ? "#120f1d" : "#0d1424";
  const ground = id === "writing" ? "#3a2f28" : id === "release" ? "#221d2e" : "#242a36";

  return (
    <group>
      <color attach="background" args={[bg]} />
      <fog attach="fog" args={[bg, 8, 30]} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 7, 4]} intensity={1.1} color="#fff0d8" />
      <directionalLight position={[-5, 4, -2]} intensity={0.35} color="#8cc7ff" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow><planeGeometry args={[40, 40]} /><meshLambertMaterial color={ground} /></mesh>
      <mesh position={[0, 3.2, -6]} receiveShadow><planeGeometry args={[20, 8]} /><meshLambertMaterial color={id === "writing" ? "#4a3e35" : "#1e2638"} /></mesh>

      {/* Warm light symbol (Amy) - always present subtly */}
      <WarmLightSymbol pos={id === "hook" ? [0, 2.4, 0.2] : id === "loss" ? [2.6, 2.6, -2.2] : id === "writing" ? [2.4, 2.8, -1.8] : id === "message" ? [1.8, 2.6, -1.2] : id === "title" ? [0, 3.1, -2.5] : id === "release" ? [0, 3.0, -2.0] : [0, 3.2, -1.5]} scale={id === "cta" ? 1.4 : 1} intensity={id === "cta" ? 2.2 : 1.4} />

      {id === "hook" && (
        <group>
          <Vinyl pos={[0, 1.0, 0.7]} rot={[Math.PI / 2.5, 0, 0]} scale={1.4} />
          <MicStand pos={[-1.8, 0, -0.8]} />
          <Amp pos={[2.2, 0, -1.5]} />
          <Label3D text="UMA DESPEDIDA VIROU NOME DE ÁLBUM" pos={[0, 3.4, -2.2]} w={900} scale={0.8} />
        </group>
      )}

      {id === "loss" && (
        <group>
          <BoxProp pos={[0, 2.8, -4]} args={[12, 5.5, 0.2]} color="#1f2940" />
          {[ -3.5,-2,-0.5,1,2.5,4 ].map((x,i)=>(<BoxProp key={i} pos={[x,2.4,-3.9]} args={[0.9,0.9,0.05]} color={i%2?"#d4af37":"#c0c0c0"} />))}
          <BoxProp pos={[0, 0.45, -1.8]} args={[2.8, 0.08, 0.9]} color="#3b2f27" />
          <Card tex={mike} pos={[-1.4, 1.55, 0.2]} scale={1.0} />
          <Label3D text="2015" pos={[0, 3.4, -2.3]} color="#ffd89a" bg="rgba(0,0,0,0.35)" />
        </group>
      )}

      {id === "writing" && (
        <group>
          <BoxProp pos={[0, 2.8, -4]} args={[12, 5.5, 0.2]} color="#4a3f37" />
          <StudioDesk pos={[0, 0, -1.6]} />
          <KeyboardProp pos={[0.4, 0.55, -1.5]} />
          <MicStand pos={[-1.8, 0, -0.8]} />
          <Amp pos={[3.2, 0, -2.2]} />
          {/* 2+ chars with depth: Mike front, Eg behind/right */}
          <Card tex={mike} pos={[-1.0, 1.55, 0.3]} scale={1.05} />
          <Card tex={eg} pos={[1.4, 1.48, -0.8]} scale={0.95} />
          <Label3D text="NO ESTÚDIO" pos={[0, 3.45, -2.4]} color="#ffd89a" bg="rgba(0,0,0,0.35)" />
        </group>
      )}

      {id === "message" && (
        <group>
          <BoxProp pos={[0, 2.8, -4]} args={[12, 5.5, 0.2]} color="#2a2735" />
          <StudioDesk pos={[-0.5, 0, -1.6]} />
          <KeyboardProp pos={[-0.2, 0.55, -1.5]} />
          <MicStand pos={[1.8, 0, -0.9]} />
          <Card tex={mike} pos={[-1.2, 1.55, 0.2]} scale={1.05} />
          <Card tex={eg} pos={[1.2, 1.45, -1.0]} scale={0.9} />
          <Label3D text="MOSTRE QUE VOCÊ SE IMPORTA" pos={[0, 3.4, -2.4]} w={920} scale={0.72} color="#fff1c2" bg="rgba(40,20,40,0.35)" />
        </group>
      )}

      {id === "title" && (
        <group>
          <BoxProp pos={[0, 2.8, -4]} args={[12, 5.5, 0.2]} color="#20263a" />
          <DrumKit pos={[0, 0, -2.8]} scale={1.0} />
          <Amp pos={[-3.4, 0, -2.3]} />
          <Amp pos={[3.4, 0, -2.3]} />
          <Vinyl pos={[0, 0.9, -0.2]} rot={[Math.PI / 2.3, 0, 0]} scale={1.1} />
          {/* band in depth layers */}
          <Card tex={rob} pos={[0.2, 1.45, -2.2]} scale={0.82} />
          <Card tex={brad} pos={[2.2, 1.45, -1.2]} scale={0.88} />
          <Card tex={mike} pos={[-2.2, 1.5, -1.0]} scale={0.9} />
          <Card tex={chester} pos={[-0.6, 1.6, 0.3]} scale={1.08} />
          <Label3D text="ONE MORE LIGHT" pos={[0, 3.5, -2.4]} color="#fff1c2" bg="rgba(0,0,0,0.35)" />
        </group>
      )}

      {id === "release" && (
        <group>
          <BoxProp pos={[0, 2.8, -4]} args={[12, 5.5, 0.2]} color="#1a1630" />
          <pointLight position={[-3, 4.5, 2]} intensity={2.0} color="#ff4d8d" distance={14} />
          <pointLight position={[3, 4.5, 2]} intensity={2.0} color="#4da6ff" distance={14} />
          {p < 0.55 ? (
            <group>
              <DrumKit pos={[0, 0, -2.6]} scale={0.9} />
              <MicStand pos={[-0.8, 0, -0.4]} />
              <Card tex={chester} pos={[-0.8, 1.58, 0.2]} scale={1.05} />
              <Card tex={mike} pos={[1.6, 1.48, -1.0]} scale={0.9} />
              <Label3D text="19 MAI 2017" pos={[0, 3.45, -2.4]} color="#ffd89a" bg="rgba(0,0,0,0.35)" />
            </group>
          ) : (
            <group>
              <MicStand pos={[0, 0, -0.6]} />
              <mesh position={[0, 2.2, -0.6]} layers={NOINK}><sphereGeometry args={[0.25, 20, 20]} /><meshBasicMaterial color="#fff1c2" transparent opacity={0.55} /></mesh>
              <Label3D text="20 JUL 2017" pos={[0, 3.45, -2.4]} color="#ffffff" bg="rgba(0,0,0,0.35)" />
            </group>
          )}
        </group>
      )}

      {id === "cta" && (
        <group>
          <BoxProp pos={[0, 2.8, -4]} args={[12, 5.5, 0.2]} color="#18243a" />
          {/* crowd lights */}
          {Array.from({ length: 20 }).map((_, i) => (
            <mesh key={i} position={[-4.5 + i * 0.47, 0.6 + (i % 3) * 0.15, -2.8]} layers={NOINK}>
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshBasicMaterial color={i % 2 ? "#fff1c2" : "#a7d8ff"} />
            </mesh>
          ))}
          <Card tex={mike} pos={[-1.8, 1.45, -1.2]} scale={0.85} />
          <Card tex={brad} pos={[1.8, 1.42, -1.4]} scale={0.82} />
          {/* respectful silhouette for Chester, not a dramatic death scene */}
          <mesh position={[0, 1.45, -0.6]} layers={NOINK}>
            <planeGeometry args={[1.4, 2.6]} />
            <meshBasicMaterial color="#111827" transparent opacity={0.85} />
          </mesh>
          <MicStand pos={[0, 0, -0.5]} />
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
  if (id === "hook") { pos.set(0.4 - p * 0.3, 1.8, 4.4 - p * 0.5); look.set(0, 1.6, 0.4); }
  else if (id === "loss") { pos.set(-1.6 + p * 0.6, 1.8, 4.6 - p * 0.4); look.set(-0.8, 1.6, -0.2); }
  else if (id === "writing") { pos.set(-1.8 + p * 2.2, 1.85, 4.8 - p * 0.5); look.set(0.2, 1.55, -0.4); }
  else if (id === "message") { pos.set(-1.4 + p * 1.6, 1.75, 4.4 - p * 0.4); look.set(-0.1, 1.55, -0.4); }
  else if (id === "title") { pos.set(-2.0 + p * 3.0, 2.0, 5.2 - p * 0.8); look.set(0, 1.55, -0.8); }
  else if (id === "release") { pos.set(0 + Math.sin(time * 0.2) * 0.3, 1.85, 4.8 - p * 0.6); look.set(0, 1.7, -0.8); }
  else { pos.set(0, 2.0 - p * 0.2, 5.4 - p * 1.0); look.set(0, 1.7, -1.0); }
  cam.position.copy(pos); cam.lookAt(look); cam.fov = id === "message" ? 38 : 42; cam.near = 0.1; cam.far = 100; cam.updateProjectionMatrix();

  const fx = useMemo(() => ({
    ink: new InkPass(scene, cam, { strength: 0.8, widthNear: 4.2, widthFar: 2.6 }),
    lens: new LensBlur({ maxCoC: 18, nearScale: 1.1 }),
    bloom: makeBloom(),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(GRADES.day, GRADE_STRENGTH.day),
  }), [scene, cam]);
  useEffect(() => () => fx.ink.dispose(), [fx]);
  fx.lens.focus = Math.max(0.5, pos.distanceTo(new THREE.Vector3(0, 1.6, 0)));
  fx.lens.cInf = id === "message" || id === "cta" ? 3.8 : 5.2;
  const golden = id === "cta" || id === "hook";
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
    { start: 0.2, end: 3.8, text: "UMA DESPEDIDA VIROU NOME DE ÁLBUM", color: "#fff1c2" },
    { start: 4.9, end: 8.5, text: "2015", color: "#ffd89a" },
    { start: 17.1, end: 21.5, text: "NO ESTÚDIO", color: "#ffd89a" },
    { start: 26.9, end: 32.5, text: "MOSTRE QUE VOCÊ SE IMPORTA", color: "#fff1c2" },
    { start: 35.1, end: 41.0, text: "ONE MORE LIGHT", color: "#fff1c2" },
    { start: 46.9, end: 50.8, text: "19 MAI 2017", color: "#ffd89a" },
    { start: 50.8, end: 55.1, text: "20 JUL 2017", color: "#ffffff" },
    { start: 61.0, end: 74.5, text: "QUAL MÚSICA TE ACOMPANHOU\nQUANDO VOCÊ MAIS PRECISOU?", color: "#ffffff" },
  ];
  const active = items.find((it) => t >= it.start && t < it.end);
  if (!active) return null;
  const local = (t - active.start) / Math.max(0.001, active.end - active.start);
  const opacity = local < 0.1 ? local / 0.1 : local > 0.85 ? (1 - local) / 0.15 : 1;
  const y = interpolate(local, [0, 1], [18, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 230, pointerEvents: "none" }}>
      <div style={{ opacity, transform: `translateY(${y}px)`, color: active.color, fontFamily: "Arial Black, Arial, sans-serif", fontSize: 50, lineHeight: 1.12, textAlign: "center", padding: "16px 28px", maxWidth: 940, textShadow: "0 4px 18px rgba(0,0,0,0.85)", whiteSpace: "pre-line" }}>
        {active.text}
      </div>
      {t > 73.5 && t < 75 && <div style={{ position: "absolute", bottom: 150, color: "rgba(255,255,255,0.85)", fontSize: 28, fontFamily: "Arial, sans-serif", textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>Se precisar, converse com alguém de confiança.</div>}
    </AbsoluteFill>
  );
};

export const LinkinParkOneMoreLightShort: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0b1020" }}>
      <ThreeCanvas width={1080} height={1920} camera={{ fov: 42, position: [0, 1.7, 4.6], near: 0.1, far: 100 }} gl={{ antialias: false, stencil: false, powerPreference: "high-performance", toneMappingExposure: 1.0 }}>
        <SceneRoot />
      </ThreeCanvas>
      <OverlayText />
      <Audio src={staticFile("linkin-park-one-more-light/voice.wav")} />
    </AbsoluteFill>
  );
};
