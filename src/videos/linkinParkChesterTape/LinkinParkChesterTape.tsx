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

export const CHESTER_TAPE_FPS = 30;
export const CHESTER_TAPE_DURATION = 2315; // ~77.16s
export const CHESTER_TAPE_FRAMES = CHESTER_TAPE_DURATION;

const SEGS = [
  { id: "hook", a: 0.096, b: 4.807 },
  { id: "xero", a: 5.602, b: 12.616 },
  { id: "missing", a: 13.414, b: 22.847 },
  { id: "opportunity", a: 23.646, b: 34.387 },
  { id: "demo", a: 34.398, b: 44.56 },
  { id: "audition", a: 44.572, b: 56.181 },
  { id: "transform", a: 56.192, b: 66.134 },
  { id: "cta", a: 66.146, b: 75.66 },
] as const;
type SegId = (typeof SEGS)[number]["id"];

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (t: number) => { const u = clamp01(t); return u * u * (3 - 2 * u); };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const segInfo = (time: number) => {
  for (let i = 0; i < SEGS.length; i++) {
    const s = SEGS[i];
    if (time >= s.a && time < s.b) return { id: s.id as SegId, local: time - s.a, dur: Math.max(0.001, s.b - s.a), idx: i };
  }
  const last = SEGS[SEGS.length - 1];
  if (time >= last.b) return { id: last.id as SegId, local: last.b - last.a, dur: Math.max(0.001, last.b - last.a), idx: SEGS.length - 1 };
  return { id: SEGS[0].id as SegId, local: 0, dur: SEGS[0].b - SEGS[0].a, idx: 0 };
};

const makeBloom = () => new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.45, luminanceThreshold: 0.92, luminanceSmoothing: 0.25, mipmapBlur: true, levels: 5, radius: 0.6 });

type Mood = "neutral" | "focus" | "sing" | "hope" | "intense";

function drawChester(ctx: CanvasRenderingContext2D, w: number, h: number, opts: { mood: Mood; sing?: number }) {
  ctx.clearRect(0, 0, w, h);
  const cx = w * 0.5, by = h * 0.93;
  const ink = "#1a1820";
  const skin = "#f1c7a3";
  const shirt = "#2f3136"; // dark shirt
  const pants = "#25262b";
  const hair = "#e2c675"; // short blond spiky hair
  const line = (lw = 6) => { ctx.lineWidth = lw; ctx.strokeStyle = ink; ctx.lineCap = "round"; ctx.lineJoin = "round"; };
  const fillStroke = (fill: string) => { ctx.fillStyle = fill; ctx.fill(); ctx.stroke(); };

  // legs
  line(7);
  ctx.beginPath(); ctx.ellipse(cx - 30, by - 72, 18, 56, 0, 0, Math.PI * 2); fillStroke(pants);
  ctx.beginPath(); ctx.ellipse(cx + 30, by - 72, 18, 56, 0, 0, Math.PI * 2); fillStroke(pants);
  // shoes
  ctx.beginPath(); ctx.ellipse(cx - 32, by - 18, 22, 10, 0, 0, Math.PI * 2); fillStroke("#1d1d22");
  ctx.beginPath(); ctx.ellipse(cx + 32, by - 18, 22, 10, 0, 0, Math.PI * 2); fillStroke("#1d1d22");
  // torso
  ctx.beginPath(); ctx.ellipse(cx, by - 175, 58, 72, 0, 0, Math.PI * 2); fillStroke(shirt);
  // collar detail
  line(4); ctx.beginPath(); ctx.moveTo(cx - 18, by - 235); ctx.lineTo(cx, by - 210); ctx.lineTo(cx + 18, by - 235); ctx.stroke();
  // arms
  const sa = (opts.sing ?? 0) * 0.25;
  ctx.save(); ctx.translate(cx - 58, by - 195); ctx.rotate(0.55 - sa);
  ctx.beginPath(); ctx.ellipse(0, 42, 14, 46, 0, 0, Math.PI * 2); fillStroke(skin); ctx.restore();
  ctx.save(); ctx.translate(cx + 58, by - 195); ctx.rotate(-0.55 + sa);
  ctx.beginPath(); ctx.ellipse(0, 42, 14, 46, 0, 0, Math.PI * 2); fillStroke(skin); ctx.restore();
  // neck
  ctx.beginPath(); ctx.roundRect(cx - 16, by - 255, 32, 28, 10); fillStroke(skin);
  // head
  ctx.beginPath(); ctx.ellipse(cx, by - 292, 54, 58, 0, 0, Math.PI * 2); fillStroke(skin);
  // short spiky blond hair
  ctx.fillStyle = hair; ctx.strokeStyle = ink;
  line(4);
  ctx.beginPath();
  ctx.moveTo(cx - 52, by - 300);
  ctx.quadraticCurveTo(cx - 54, by - 330, cx - 40, by - 338);
  ctx.lineTo(cx - 46, by - 352); ctx.lineTo(cx - 30, by - 342);
  ctx.lineTo(cx - 28, by - 360); ctx.lineTo(cx - 14, by - 344);
  ctx.lineTo(cx - 6, by - 363); ctx.lineTo(cx + 4, by - 345);
  ctx.lineTo(cx + 16, by - 361); ctx.lineTo(cx + 28, by - 342);
  ctx.lineTo(cx + 42, by - 354); ctx.lineTo(cx + 40, by - 336);
  ctx.quadraticCurveTo(cx + 54, by - 328, cx + 52, by - 300);
  ctx.quadraticCurveTo(cx + 30, by - 312, cx, by - 310);
  ctx.quadraticCurveTo(cx - 30, by - 312, cx - 52, by - 300);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // hair texture
  line(2.5); ctx.strokeStyle = "rgba(60,45,20,0.35)";
  for (let i = -4; i <= 4; i++) {
    const x = cx + i * 9;
    ctx.beginPath(); ctx.moveTo(x, by - 336 + Math.abs(i) * 2); ctx.lineTo(x + (i * 0.4), by - 318); ctx.stroke();
  }
  ctx.strokeStyle = ink;
  // ears
  line(4);
  ctx.beginPath(); ctx.ellipse(cx - 54, by - 290, 6, 9, 0, 0, Math.PI * 2); fillStroke(skin);
  ctx.beginPath(); ctx.ellipse(cx + 54, by - 290, 6, 9, 0, 0, Math.PI * 2); fillStroke(skin);
  // eyebrows
  line(5);
  const browLift = opts.mood === "intense" ? -4 : opts.mood === "hope" ? -2 : 0;
  ctx.beginPath(); ctx.moveTo(cx - 34, by - 307 + browLift); ctx.lineTo(cx - 12, by - 312 + browLift); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 12, by - 312 + browLift); ctx.lineTo(cx + 34, by - 307 + browLift); ctx.stroke();
  // eyes
  ctx.fillStyle = "#1a1820";
  if (opts.mood === "focus") {
    line(4); ctx.beginPath(); ctx.moveTo(cx - 28, by - 294); ctx.lineTo(cx - 10, by - 294); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 10, by - 294); ctx.lineTo(cx + 28, by - 294); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.ellipse(cx - 18, by - 294, 5, opts.mood === "intense" ? 4 : 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + 18, by - 294, 5, opts.mood === "intense" ? 4 : 6, 0, 0, Math.PI * 2); ctx.fill();
  }
  // nose
  line(4); ctx.beginPath(); ctx.moveTo(cx + 2, by - 288); ctx.lineTo(cx - 4, by - 274); ctx.lineTo(cx + 6, by - 274); ctx.stroke();
  // mouth
  line(4); ctx.beginPath();
  if (opts.mood === "sing" || opts.mood === "intense") { ctx.ellipse(cx, by - 260, 10, 7, 0, 0, Math.PI * 2); ctx.stroke(); }
  else if (opts.mood === "hope") { ctx.arc(cx, by - 265, 12, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); }
  else { ctx.moveTo(cx - 10, by - 260); ctx.quadraticCurveTo(cx, by - 255, cx + 10, by - 260); ctx.stroke(); }
  // jawline accent
  line(3); ctx.beginPath(); ctx.moveTo(cx - 28, by - 255); ctx.quadraticCurveTo(cx, by - 242, cx + 28, by - 255); ctx.stroke();
}

function drawMike(ctx: CanvasRenderingContext2D, w: number, h: number, opts: { mood: Mood }) {
  ctx.clearRect(0, 0, w, h);
  const cx = w * 0.5, by = h * 0.93;
  const ink = "#1a1820"; const skin = "#efc39b"; const shirt = "#3b4a66"; const pants = "#30323a";
  const line = (lw = 6) => { ctx.lineWidth = lw; ctx.strokeStyle = ink; ctx.lineCap = "round"; ctx.lineJoin = "round"; };
  const fillStroke = (fill: string) => { ctx.fillStyle = fill; ctx.fill(); ctx.stroke(); };
  line(7);
  ctx.beginPath(); ctx.ellipse(cx - 28, by - 72, 18, 55, 0, 0, Math.PI * 2); fillStroke(pants);
  ctx.beginPath(); ctx.ellipse(cx + 28, by - 72, 18, 55, 0, 0, Math.PI * 2); fillStroke(pants);
  ctx.beginPath(); ctx.ellipse(cx, by - 172, 56, 70, 0, 0, Math.PI * 2); fillStroke(shirt);
  ctx.save(); ctx.translate(cx - 56, by - 192); ctx.rotate(0.5); ctx.beginPath(); ctx.ellipse(0, 40, 14, 44, 0, 0, Math.PI * 2); fillStroke(skin); ctx.restore();
  ctx.save(); ctx.translate(cx + 56, by - 192); ctx.rotate(-0.5); ctx.beginPath(); ctx.ellipse(0, 40, 14, 44, 0, 0, Math.PI * 2); fillStroke(skin); ctx.restore();
  ctx.beginPath(); ctx.ellipse(cx, by - 288, 52, 55, 0, 0, Math.PI * 2); fillStroke(skin);
  // cap
  ctx.fillStyle = "#c23b3b"; ctx.strokeStyle = ink; line(5);
  ctx.beginPath(); ctx.ellipse(cx, by - 318, 54, 20, 0, Math.PI, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.roundRect(cx - 10, by - 328, 70, 12, 6); ctx.fill(); ctx.stroke();
  // face
  ctx.fillStyle = ink;
  ctx.beginPath(); ctx.ellipse(cx - 16, by - 290, 4.5, 5.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 16, by - 290, 4.5, 5.5, 0, 0, Math.PI * 2); ctx.fill();
  line(4); ctx.beginPath(); ctx.moveTo(cx - 9, by - 262); ctx.quadraticCurveTo(cx, by - 257, cx + 9, by - 262); ctx.stroke();
}

function drawBandMember(ctx: CanvasRenderingContext2D, w: number, h: number, opts: { shirt: string; hair: string; cap?: boolean; guitar?: boolean }) {
  ctx.clearRect(0, 0, w, h);
  const cx = w * 0.5, by = h * 0.93;
  const ink = "#1a1820"; const skin = "#efc39b"; const pants = "#2f3138";
  const line = (lw = 6) => { ctx.lineWidth = lw; ctx.strokeStyle = ink; ctx.lineCap = "round"; ctx.lineJoin = "round"; };
  const fillStroke = (fill: string) => { ctx.fillStyle = fill; ctx.fill(); ctx.stroke(); };
  line(6);
  ctx.beginPath(); ctx.ellipse(cx - 24, by - 68, 16, 50, 0, 0, Math.PI * 2); fillStroke(pants);
  ctx.beginPath(); ctx.ellipse(cx + 24, by - 68, 16, 50, 0, 0, Math.PI * 2); fillStroke(pants);
  ctx.beginPath(); ctx.ellipse(cx, by - 160, 50, 64, 0, 0, Math.PI * 2); fillStroke(opts.shirt);
  ctx.save(); ctx.translate(cx - 50, by - 178); ctx.rotate(0.5); ctx.beginPath(); ctx.ellipse(0, 36, 12, 40, 0, 0, Math.PI * 2); fillStroke(skin); ctx.restore();
  ctx.save(); ctx.translate(cx + 50, by - 178); ctx.rotate(-0.5); ctx.beginPath(); ctx.ellipse(0, 36, 12, 40, 0, 0, Math.PI * 2); fillStroke(skin); ctx.restore();
  ctx.beginPath(); ctx.ellipse(cx, by - 266, 46, 50, 0, 0, Math.PI * 2); fillStroke(skin);
  ctx.fillStyle = opts.hair; ctx.strokeStyle = ink; line(4);
  if (opts.cap) {
    ctx.beginPath(); ctx.ellipse(cx, by - 292, 48, 18, 0, Math.PI, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(cx - 8, by - 300, 60, 10, 5); ctx.fill(); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.ellipse(cx, by - 292, 48, 24, 0, Math.PI, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  ctx.fillStyle = ink;
  ctx.beginPath(); ctx.ellipse(cx - 14, by - 268, 4, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 14, by - 268, 4, 5, 0, 0, Math.PI * 2); ctx.fill();
  line(3); ctx.beginPath(); ctx.moveTo(cx - 8, by - 246); ctx.quadraticCurveTo(cx, by - 242, cx + 8, by - 246); ctx.stroke();
  if (opts.guitar) {
    ctx.save(); ctx.translate(cx + 18, by - 140); ctx.rotate(-0.2);
    line(5); ctx.fillStyle = "#8b4a2b"; ctx.strokeStyle = ink;
    ctx.beginPath(); ctx.rect(-6, -120, 12, 100); fillStroke("#5a3520");
    ctx.beginPath(); ctx.ellipse(0, 18, 34, 38, 0, 0, Math.PI * 2); fillStroke("#b0633a");
    ctx.beginPath(); ctx.ellipse(0, 50, 28, 32, 0, 0, Math.PI * 2); fillStroke("#b0633a");
    ctx.restore();
  }
}

function makeTex(draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, w = 512, h = 768) {
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

const Card: React.FC<{ tex: THREE.Texture; pos: [number, number, number]; scale?: number | [number, number, number]; rot?: [number, number, number]; opacity?: number }> = ({ tex, pos, scale = 1, rot = [0, 0, 0], opacity = 1 }) => {
  return (
    <mesh position={pos} rotation={rot} scale={scale as any} layers={NOINK}>
      <planeGeometry args={[2.2, 3.3]} />
      <meshBasicMaterial map={tex} transparent alphaTest={0.05} side={THREE.DoubleSide} opacity={opacity} />
    </mesh>
  );
};

const Label3D: React.FC<{ text: string; pos: [number, number, number]; color?: string; bg?: string; w?: number; h?: number; scale?: number }> = ({ text, pos, color = "#ffffff", bg = "rgba(0,0,0,0.45)", w = 512, h = 128, scale = 1 }) => {
  const tex = useMemo(() => makeTex((ctx, W, H) => {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(20, 20, W - 40, H - 40, 20); ctx.fill();
    ctx.fillStyle = color; ctx.font = "bold 52px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(text, W / 2, H / 2);
  }, w, h), [text, color, bg, w, h]);
  return <Card tex={tex} pos={pos} scale={[scale * 2.2, scale * 0.55, 1] as any} />;
};

const BoxProp: React.FC<{ pos: [number, number, number]; args: [number, number, number]; color: string; rot?: [number, number, number] }> = ({ pos, args, color, rot = [0, 0, 0] }) => (
  <mesh position={pos} rotation={rot} castShadow receiveShadow>
    <boxGeometry args={args} />
    <meshLambertMaterial color={color} />
  </mesh>
);
const CylProp: React.FC<{ pos: [number, number, number]; args: [number, number, number, number?]; color: string; rot?: [number, number, number] }> = ({ pos, args, color, rot = [0, 0, 0] }) => (
  <mesh position={pos} rotation={rot} castShadow receiveShadow>
    <cylinderGeometry args={args} />
    <meshLambertMaterial color={color} />
  </mesh>
);

const MicStand: React.FC<{ pos: [number, number, number] }> = ({ pos }) => (
  <group position={pos}>
    <CylProp pos={[0, 0.9, 0]} args={[0.03, 0.03, 1.8, 12]} color="#222" />
    <CylProp pos={[0, 0.02, 0]} args={[0.22, 0.25, 0.04, 16]} color="#1a1a1a" />
    <mesh position={[0, 1.85, 0.08]} rotation={[Math.PI / 2, 0, 0]} castShadow>
      <sphereGeometry args={[0.09, 16, 16]} /><meshLambertMaterial color="#9aa0a6" />
    </mesh>
  </group>
);

const GuitarProp: React.FC<{ pos: [number, number, number]; rot?: [number, number, number]; color?: string }> = ({ pos, rot = [0, 0, 0], color = "#b0633a" }) => (
  <group position={pos} rotation={rot}>
    <BoxProp pos={[0, 0.7, 0]} args={[0.08, 1.0, 0.05]} color="#4a3222" />
    <BoxProp pos={[0, 1.25, 0]} args={[0.16, 0.18, 0.06]} color="#2a211a" />
    <mesh position={[0, 0.1, 0]} castShadow><sphereGeometry args={[0.22, 16, 16]} /><meshLambertMaterial color={color} /></mesh>
    <mesh position={[0, -0.22, 0]} castShadow><sphereGeometry args={[0.19, 16, 16]} /><meshLambertMaterial color={color} /></mesh>
  </group>
);

const DrumKit: React.FC<{ pos: [number, number, number]; scale?: number }> = ({ pos, scale = 1 }) => (
  <group position={pos} scale={scale}>
    <CylProp pos={[0, 0.45, 0]} args={[0.45, 0.45, 0.5, 24]} color="#cc3333" />
    <CylProp pos={[-0.55, 0.35, 0.2]} args={[0.28, 0.28, 0.35, 20]} color="#cc3333" />
    <CylProp pos={[0.55, 0.35, 0.2]} args={[0.28, 0.28, 0.35, 20]} color="#cc3333" />
    <CylProp pos={[0, 0.75, -0.15]} args={[0.22, 0.22, 0.12, 20]} color="#dddddd" rot={[Math.PI / 2.5, 0, 0]} />
    <CylProp pos={[0.7, 1.1, -0.2]} args={[0.01, 0.01, 1.4, 8]} color="#888" />
    <mesh position={[0.7, 1.8, -0.2]} rotation={[0.2, 0, 0]} castShadow><cylinderGeometry args={[0.35, 0.35, 0.02, 24]} /><meshLambertMaterial color="#d4af37" /></mesh>
  </group>
);

const Amp: React.FC<{ pos: [number, number, number] }> = ({ pos }) => (
  <group position={pos}>
    <BoxProp pos={[0, 0.35, 0]} args={[0.9, 0.7, 0.45]} color="#1d1f24" />
    <BoxProp pos={[0, 0.82, 0]} args={[0.85, 0.25, 0.4]} color="#22252b" />
    <mesh position={[0, 0.35, 0.23]}><circleGeometry args={[0.18, 24]} /><meshBasicMaterial color="#333" /></mesh>
    <mesh position={[0.25, 0.35, 0.23]}><circleGeometry args={[0.12, 24]} /><meshBasicMaterial color="#333" /></mesh>
  </group>
);

const Cassette: React.FC<{ pos: [number, number, number]; rot?: [number, number, number]; scale?: number }> = ({ pos, rot = [0, 0, 0], scale = 1 }) => (
  <group position={pos} rotation={rot} scale={scale}>
    {/* main body */}
    <BoxProp pos={[0, 0, 0]} args={[1.0, 0.64, 0.08]} color="#1f2229" />
    <BoxProp pos={[0, -0.27, 0.01]} args={[0.92, 0.08, 0.08]} color="#181b21" />
    {/* top edge */}
    <BoxProp pos={[0, 0.285, 0.01]} args={[0.72, 0.05, 0.07]} color="#2a2e36" />
    {/* label */}
    <BoxProp pos={[0, 0.08, 0.045]} args={[0.78, 0.34, 0.01]} color="#efe4c8" />
    <BoxProp pos={[0, 0.19, 0.051]} args={[0.72, 0.07, 0.005]} color="#d94b4b" />
    <BoxProp pos={[0, 0.11, 0.051]} args={[0.62, 0.015, 0.004]} color="#b8afa0" />
    <BoxProp pos={[0, 0.06, 0.051]} args={[0.62, 0.015, 0.004]} color="#b8afa0" />
    {/* reel window */}
    <BoxProp pos={[0, -0.02, 0.046]} args={[0.52, 0.16, 0.012]} color="#cfc7b4" />
    <mesh position={[-0.16, -0.02, 0.055]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.075, 0.075, 0.03, 20]} />
      <meshLambertMaterial color="#f3efe4" />
    </mesh>
    <mesh position={[0.16, -0.02, 0.055]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.075, 0.075, 0.03, 20]} />
      <meshLambertMaterial color="#f3efe4" />
    </mesh>
    <mesh position={[-0.16, -0.02, 0.072]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.03, 0.03, 0.02, 12]} />
      <meshLambertMaterial color="#3a3f48" />
    </mesh>
    <mesh position={[0.16, -0.02, 0.072]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.03, 0.03, 0.02, 12]} />
      <meshLambertMaterial color="#3a3f48" />
    </mesh>
    {/* tape window */}
    <BoxProp pos={[0, -0.015, 0.057]} args={[0.16, 0.07, 0.01]} color="#6b5a44" />
    {/* screws */}
    {[[-0.44, 0.27], [0.44, 0.27], [-0.44, -0.27], [0.44, -0.27]].map(([x, y], i) => (
      <mesh key={i} position={[x, y, 0.045]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 0.01, 8]} />
        <meshLambertMaterial color="#8a9099" />
      </mesh>
    ))}
  </group>
);

const StudioDesk: React.FC<{ pos: [number, number, number] }> = ({ pos }) => (
  <group position={pos}>
    <BoxProp pos={[0, 0.45, 0]} args={[2.2, 0.08, 0.9]} color="#3a2a20" />
    <BoxProp pos={[-0.95, 0.22, 0]} args={[0.08, 0.44, 0.8]} color="#2e2118" />
    <BoxProp pos={[0.95, 0.22, 0]} args={[0.08, 0.44, 0.8]} color="#2e2118" />
    <BoxProp pos={[0, 0.62, -0.15]} args={[0.8, 0.22, 0.35]} color="#1f232b" />
    <BoxProp pos={[-0.55, 0.58, 0.15]} args={[0.35, 0.18, 0.25]} color="#252a33" />
  </group>
);

const Speaker: React.FC<{ pos: [number, number, number] }> = ({ pos }) => (
  <group position={pos}>
    <BoxProp pos={[0, 0.6, 0]} args={[0.6, 1.2, 0.5]} color="#1a1c22" />
    <mesh position={[0, 0.78, 0.26]}><circleGeometry args={[0.16, 20]} /><meshBasicMaterial color="#2d313a" /></mesh>
    <mesh position={[0, 0.38, 0.26]}><circleGeometry args={[0.2, 20]} /><meshBasicMaterial color="#2d313a" /></mesh>
  </group>
);

const StageLights: React.FC<{ t: number }> = ({ t }) => (
  <group>
    <pointLight position={[-3, 5.5, 2]} intensity={2.2 + Math.sin(t * 3) * 0.5} color="#4da6ff" distance={18} />
    <pointLight position={[3, 5.5, 2]} intensity={2.0 + Math.cos(t * 2.6) * 0.5} color="#ff4d6d" distance={18} />
    <pointLight position={[0, 4.5, -2]} intensity={1.6} color="#c77dff" distance={16} />
  </group>
);

const CrowdSilhouettes: React.FC = () => {
  const items = useMemo(() => Array.from({ length: 18 }, (_, i) => ({ x: -4.2 + i * 0.5, h: 0.9 + (i % 4) * 0.12, p: i * 0.7 })), []);
  return (
    <group position={[0, 0, -3.5]}>
      {items.map((it, i) => (
        <mesh key={i} position={[it.x, it.h / 2, 0]}>
          <boxGeometry args={[0.32, it.h, 0.25]} />
          <meshLambertMaterial color={i % 2 ? "#141420" : "#1b1b2a"} />
        </mesh>
      ))}
    </group>
  );
};

const World: React.FC<{ time: number }> = ({ time }) => {
  const { id, local, dur } = segInfo(time);
  const p = smooth(local / dur);
  const t = time;

  const chesterTex = useMemo(() => makeTex((c, w, h) => drawChester(c, w, h, { mood: id === "demo" || id === "audition" ? "sing" : id === "opportunity" ? "focus" : id === "transform" ? "hope" : "neutral", sing: Math.sin(t * 8) * 0.5 + 0.5 }), 512, 768), [id, Math.floor(t * 4)]);
  useEffect(() => () => { chesterTex.dispose(); }, [chesterTex]);
  const mikeTex = useMemo(() => makeTex((c, w, h) => drawMike(c, w, h, { mood: "neutral" }), 512, 768), []);
  const band1Tex = useMemo(() => makeTex((c, w, h) => drawBandMember(c, w, h, { shirt: "#4d6b3f", hair: "#2b2118", guitar: true }), 512, 768), []);
  const band2Tex = useMemo(() => makeTex((c, w, h) => drawBandMember(c, w, h, { shirt: "#6b4a3f", hair: "#3a2b20" }), 512, 768), []);
  const band3Tex = useMemo(() => makeTex((c, w, h) => drawBandMember(c, w, h, { shirt: "#4a5568", hair: "#1f1a17", cap: true }), 512, 768), []);

  const bg =
    id === "hook" ? "#0b1020" :
    id === "xero" ? "#1a1e2e" :
    id === "missing" ? "#141828" :
    id === "opportunity" ? "#1b2230" :
    id === "demo" ? "#191428" :
    id === "audition" ? "#171c2b" :
    id === "transform" ? "#0f1728" : "#120f24";

  const ground =
    id === "hook" ? "#1a1d26" :
    id === "xero" ? "#2a2f3b" :
    id === "missing" ? "#222838" :
    id === "opportunity" ? "#3a3028" :
    id === "demo" ? "#241f2d" :
    id === "audition" ? "#2b3040" :
    id === "transform" ? "#1f2433" : "#2a2138";

  return (
    <group>
      <color attach="background" args={[bg]} />
      <fog attach="fog" args={[bg, 8, 30]} />
      <ambientLight intensity={id === "demo" ? 0.35 : 0.55} />
      <directionalLight position={[4, 7, 4]} intensity={id === "hook" ? 0.8 : 1.2} color="#fff0d8" />
      <directionalLight position={[-5, 4, -2]} intensity={0.45} color="#7cc0ff" />
      {id === "demo" && <><pointLight position={[0, 2.5, 1.5]} intensity={2.2} color="#ff4d6d" distance={8} /><pointLight position={[1.5, 2.2, 1]} intensity={1.4} color="#4da6ff" distance={8} /></>}
      {id === "audition" && <StageLights t={t} />}
      {id === "transform" && <><pointLight position={[0, 4, 2]} intensity={2.2} color="#ffd166" distance={12} /><pointLight position={[-2, 3, 1]} intensity={1.2} color="#4da6ff" distance={10} /></>}
      {id === "cta" && <><pointLight position={[0, 4.5, 2]} intensity={2.5} color="#c77dff" distance={14} /><pointLight position={[-3, 3.5, 1]} intensity={1.5} color="#ff4d6d" distance={12} /><pointLight position={[3, 3.5, 1]} intensity={1.5} color="#4da6ff" distance={12} /></>}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshLambertMaterial color={ground} />
      </mesh>
      <mesh position={[0, 3.2, -6]} receiveShadow>
        <planeGeometry args={[20, 8]} />
        <meshLambertMaterial color={id === "opportunity" ? "#4a3f35" : "#202636"} />
      </mesh>

      {/* HOOK: envelope/cassette */}
      {id === "hook" && (
        <group>
          <BoxProp pos={[0, 2.6, -3.5]} args={[12, 6, 0.2]} color="#16203a" />
          <BoxProp pos={[0, 0.25, -1.2]} args={[8, 0.5, 5]} color="#1a1f2b" />
          {/* envelope behind */}
          <mesh position={[0.35, 1.15, 0.35]} rotation={[-0.12, 0.18, 0.08]}>
            <boxGeometry args={[2.4, 1.5, 0.03]} />
            <meshLambertMaterial color="#d8ccb2" />
          </mesh>
          <mesh position={[0.35, 1.72, 0.37]} rotation={[-0.12, 0.18, 0.08]}>
            <boxGeometry args={[2.2, 0.9, 0.03]} />
            <meshLambertMaterial color="#cfc2a6" />
          </mesh>
          {/* cassette front and clear */}
          <Cassette pos={[0, 1.45, 0.95]} rot={[-0.08, 0.15, -0.03]} scale={2.4} />
          <Label3D text="XERO DEMO" pos={[0, 2.75, 0.4]} color="#ffffff" bg="rgba(20,30,60,0.72)" />
          <MicStand pos={[-2.6, 0, -1.0]} />
          <Amp pos={[2.8, 0, -1.4]} />
          <GuitarProp pos={[-2.0, 0.7, -1.8]} rot={[0.1, 0.5, 0.15]} color="#4da6ff" />
        </group>
      )}

      {/* XERO rehearsal */}
      {id === "xero" && (
        <group>
          <BoxProp pos={[0, 2.8, -4]} args={[12, 5.5, 0.2]} color="#283044" />
          <DrumKit pos={[0, 0, -2.2]} scale={1.1} />
          <Amp pos={[-3.2, 0, -2.2]} />
          <Amp pos={[3.2, 0, -2.2]} />
          <GuitarProp pos={[-1.8, 0.8, -1.2]} rot={[0, 0.2, 0.1]} color="#5aa0c8" />
          <GuitarProp pos={[1.8, 0.8, -1.2]} rot={[0, -0.2, -0.1]} color="#b0633a" />
          <Card tex={band1Tex} pos={[-2.1, 1.55, -0.8]} scale={0.95} />
          <Card tex={mikeTex} pos={[0.1, 1.55, -0.4]} scale={0.95} />
          <Card tex={band3Tex} pos={[2.2, 1.55, -0.8]} scale={0.95} />
          <Label3D text="XERO" pos={[0, 3.4, -2.8]} color="#7fd4ff" bg="rgba(0,0,0,0.35)" />
        </group>
      )}

      {/* Missing voice */}
      {id === "missing" && (
        <group>
          <BoxProp pos={[0, 2.8, -4]} args={[12, 5.5, 0.2]} color="#232a3d" />
          <DrumKit pos={[2.8, 0, -2.6]} scale={1} />
          <Amp pos={[-3.4, 0, -2.4]} />
          <Amp pos={[3.6, 0, -1.6]} />
          <GuitarProp pos={[-2.2, 0.8, -1.8]} rot={[0, 0.4, 0.15]} />
          <MicStand pos={[0, 0, -0.8]} />
          <mesh position={[0, 1.55, -0.7]} layers={NOINK}>
            <ringGeometry args={[0.45, 0.55, 48]} />
            <meshBasicMaterial color="#ff4d6d" transparent opacity={0.7} side={THREE.DoubleSide} />
          </mesh>
          <Label3D text="FALTAVA UMA VOZ" pos={[0, 3.2, -2.5]} color="#ffffff" bg="rgba(80,20,40,0.45)" />
        </group>
      )}

      {/* Opportunity */}
      {id === "opportunity" && (
        <group>
          <BoxProp pos={[0, 2.8, -4]} args={[12, 5.5, 0.2]} color="#5a4a3d" />
          <StudioDesk pos={[1.6, 0, -1.2]} />
          <Cassette pos={[1.4, 0.75, -1.0]} rot={[0, 0.3, 0]} scale={1.1} />
          <BoxProp pos={[2.0, 0.82, -1.1]} args={[0.5, 0.25, 0.35]} color="#2a2f38" />
          <Speaker pos={[-3.2, 0, -2.2]} />
          <GuitarProp pos={[-2.1, 0.7, -1.8]} rot={[0.1, 0.4, 0.2]} color="#7a4a2f" />
          <Card tex={chesterTex} pos={[-0.3, 1.55, 0.2]} scale={1.05} />
          <Label3D text="1999 • PHOENIX" pos={[0, 3.35, -2.4]} color="#ffd166" bg="rgba(0,0,0,0.35)" />
        </group>
      )}

      {/* Demo recording */}
      {id === "demo" && (
        <group>
          <BoxProp pos={[0, 2.8, -4]} args={[12, 5.5, 0.2]} color="#211a33" />
          <MicStand pos={[0.6, 0, -0.5]} />
          <StudioDesk pos={[-2.1, 0, -1.8]} />
          <BoxProp pos={[-2.1, 0.88, -1.85]} args={[1.2, 0.35, 0.5]} color="#151922" />
          <Amp pos={[3.0, 0, -2.2]} />
          <Speaker pos={[-3.8, 0, -2.3]} />
          <Card tex={chesterTex} pos={[-0.4, 1.55, 0.2]} scale={1.08} />
          <mesh position={[0.6, 2.4, -0.5]}><sphereGeometry args={[0.12, 16, 16]} /><meshBasicMaterial color="#ff3b5c" /></mesh>
          <Label3D text="DEMO" pos={[0, 3.35, -2.4]} color="#ff7b9c" bg="rgba(30,0,20,0.4)" />
        </group>
      )}

      {/* Audition */}
      {id === "audition" && (
        <group>
          <BoxProp pos={[0, 2.8, -4]} args={[12, 5.5, 0.2]} color="#232b3f" />
          <DrumKit pos={[2.6, 0, -2.4]} />
          <Amp pos={[-3.4, 0, -2.4]} />
          <Amp pos={[3.6, 0, -1.4]} />
          <MicStand pos={[-0.8, 0, -0.5]} />
          <Card tex={chesterTex} pos={[-0.9, 1.55, 0.2]} scale={1.05} />
          <Card tex={mikeTex} pos={[1.2, 1.5, -0.9]} scale={0.9} />
          <Card tex={band1Tex} pos={[2.4, 1.45, -1.4]} scale={0.85} />
          <Card tex={band2Tex} pos={[-2.6, 1.45, -1.4]} scale={0.85} />
          <Label3D text="LOS ANGELES" pos={[0, 3.4, -2.5]} color="#8ecbff" bg="rgba(0,0,0,0.35)" />
        </group>
      )}

      {/* Transform */}
      {id === "transform" && (
        <group>
          <BoxProp pos={[0, 2.8, -4]} args={[12, 5.5, 0.2]} color="#1b2438" />
          <StageLights t={t} />
          <DrumKit pos={[0, 0, -2.8]} scale={1.05} />
          <Amp pos={[-3.6, 0, -2.4]} />
          <Amp pos={[3.6, 0, -2.4]} />
          <GuitarProp pos={[-2.3, 0.8, -1.2]} rot={[0, 0.2, 0.1]} color="#4da6ff" />
          <Card tex={band1Tex} pos={[-2.2, 1.5, -0.9]} scale={0.9} />
          <Card tex={chesterTex} pos={[-0.2, 1.58, 0.1]} scale={1.05} />
          <Card tex={mikeTex} pos={[1.5, 1.5, -0.7]} scale={0.92} />
          <Label3D text={p < 0.45 ? "XERO" : p < 0.75 ? "HYBRID THEORY" : "LINKIN PARK"} pos={[0, 3.45, -2.4]} color={p < 0.75 ? "#ffd166" : "#ffffff"} bg="rgba(0,0,0,0.35)" />
        </group>
      )}

      {/* CTA */}
      {id === "cta" && (
        <group>
          <BoxProp pos={[0, 2.8, -4]} args={[12, 5.5, 0.2]} color="#211936" />
          <CrowdSilhouettes />
          <StageLights t={t} />
          <DrumKit pos={[1.6, 0, -2.5]} scale={0.9} />
          <Amp pos={[-3.4, 0, -2.3]} />
          <Amp pos={[3.4, 0, -2.3]} />
          <MicStand pos={[-0.8, 0, -0.4]} />
          <Card tex={chesterTex} pos={[-0.7, 1.6, 0.3]} scale={1.12} />
          <Card tex={mikeTex} pos={[1.4, 1.5, -0.8]} scale={0.9} />
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

  const pos = new THREE.Vector3();
  const look = new THREE.Vector3();
  if (id === "hook") { pos.set(0.5 - p * 0.6, 1.85, 4.4 - p * 0.7); look.set(0, 1.55, 0.7); }
  else if (id === "xero") { pos.set(-2.2 + p * 4.0, 2.0, 5.2 - p * 0.6); look.set(0, 1.4, -1.2); }
  else if (id === "missing") { pos.set(0 + Math.sin(time * 0.4) * 0.2, 1.8, 4.6 - p * 0.4); look.set(0, 1.6, -0.6); }
  else if (id === "opportunity") { pos.set(-1.8 + p * 1.2, 1.75, 4.4 - p * 0.5); look.set(-0.2, 1.55, 0); }
  else if (id === "demo") { pos.set(-1.2 + p * 0.8, 1.65, 4.0 - p * 0.4); look.set(-0.2, 1.55, 0); }
  else if (id === "audition") { pos.set(-2.0 + p * 2.6, 1.85, 4.8 - p * 0.6); look.set(-0.2, 1.5, -0.4); }
  else if (id === "transform") { pos.set(-1.5 + p * 3.0, 2.1, 5.4 - p * 0.8); look.set(0, 1.6, -1.0); }
  else { pos.set(-1.4 + p * 0.8, 1.75, 4.6 - p * 0.8); look.set(-0.5, 1.55, 0.1); }

  cam.position.copy(pos);
  cam.lookAt(look);
  cam.fov = id === "demo" ? 36 : id === "cta" ? 38 : 42;
  cam.near = 0.1; cam.far = 100;
  cam.updateProjectionMatrix();

  const fx = useMemo(() => ({
    ink: new InkPass(scene, cam, { strength: 0.8, widthNear: 4.2, widthFar: 2.6 }),
    lens: new LensBlur({ maxCoC: 18, nearScale: 1.1 }),
    bloom: makeBloom(),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(GRADES.day, GRADE_STRENGTH.day),
  }), [scene, cam]);
  useEffect(() => () => fx.ink.dispose(), [fx]);

  const focusDist = pos.distanceTo(new THREE.Vector3(0, 1.5, 0));
  fx.lens.focus = Math.max(0.5, focusDist);
  fx.lens.cInf = id === "demo" || id === "cta" ? 3.5 : 5;
  const golden = id === "transform" || id === "cta";
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
  return (
    <>
      <World time={time} />
      <CameraAndPost time={time} />
    </>
  );
};

const OverlayText: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const items: { start: number; end: number; text: string; color?: string }[] = [
    { start: 0.2, end: 4.2, text: "A VOZ CHEGOU NUMA FITA", color: "#ffffff" },
    { start: 5.8, end: 9.5, text: "XERO", color: "#7fd4ff" },
    { start: 13.6, end: 18.5, text: "FALTAVA UMA VOZ", color: "#ff7b9c" },
    { start: 23.8, end: 29.5, text: "1999 • CHESTER BENNINGTON", color: "#ffd166" },
    { start: 34.6, end: 39.5, text: "A DEMO", color: "#ff7b9c" },
    { start: 44.8, end: 50.0, text: "A AUDIÇÃO • LOS ANGELES", color: "#8ecbff" },
    { start: 56.4, end: 60.5, text: "HYBRID THEORY", color: "#ffd166" },
    { start: 60.5, end: 66.0, text: "LINKIN PARK", color: "#ffffff" },
    { start: 70.0, end: 75.6, text: "QUAL MÚSICA MARCOU A SUA VIDA?", color: "#ffffff" },
  ];
  const active = items.find((it) => t >= it.start && t < it.end);
  if (!active) return null;
  const local = (t - active.start) / Math.max(0.001, active.end - active.start);
  const opacity = local < 0.1 ? local / 0.1 : local > 0.85 ? (1 - local) / 0.15 : 1;
  const y = interpolate(local, [0, 1], [18, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 230, pointerEvents: "none" }}>
      <div style={{
        opacity, transform: `translateY(${y}px)`, color: active.color, fontFamily: "Arial Black, Arial, sans-serif",
        fontSize: 52, lineHeight: 1.1, textAlign: "center", padding: "16px 28px", maxWidth: 920,
        textShadow: "0 4px 18px rgba(0,0,0,0.85), 0 0 8px rgba(0,0,0,0.9)",
        letterSpacing: 1.2,
      }}>
        {active.text}
      </div>
    </AbsoluteFill>
  );
};

export const LinkinParkChesterTapeShort: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0b1020" }}>
      <ThreeCanvas width={1080} height={1920} camera={{ fov: 42, position: [0, 1.7, 4.6], near: 0.1, far: 100 }} gl={{ antialias: false, stencil: false, powerPreference: "high-performance", toneMappingExposure: 1.0 }}>
        <SceneRoot />
      </ThreeCanvas>
      <OverlayText />
      <Audio src={staticFile("linkin-park-chester-tape/voice.wav")} />
    </AbsoluteFill>
  );
};
