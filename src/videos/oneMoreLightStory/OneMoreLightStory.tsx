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

export const OMLS_FPS = 30;
export const OMLS_DURATION = 2700; // 90s
export const OMLS_FRAMES = OMLS_DURATION;

const SEGS = [
  { id: "hook", a: 0.0, b: 5.521 },
  { id: "amy", a: 5.521, b: 12.326 },
  { id: "writing", a: 12.326, b: 16.806 },
  { id: "song", a: 16.806, b: 23.021 },
  { id: "chrisLoss", a: 23.021, b: 29.375 },
  { id: "kimmel", a: 29.375, b: 34.039 },
  { id: "change", a: 34.039, b: 36.574 },
  { id: "tribute", a: 36.574, b: 40.648 },
  { id: "emotion", a: 40.648, b: 44.688 },
  { id: "twoMonths", a: 44.688, b: 49.132 },
  { id: "memory", a: 49.132, b: 55.359 },
  { id: "names", a: 56.157, b: 59.062 },
  { id: "threeStars", a: 59.062, b: 62.234 },
  { id: "message", a: 62.234, b: 68.773 },
  { id: "cta", a: 68.773, b: 75.764 },
  { id: "finale", a: 75.764, b: 90.0 },
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
const makeBloom = () => new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.55, luminanceThreshold: 0.85, luminanceSmoothing: 0.25, mipmapBlur: true, levels: 5, radius: 0.7 });
function makeTex(draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, w = 512, h = 768) {
  const canvas = document.createElement("canvas"); canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d")!; draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; tex.needsUpdate = true; return tex;
}

type Mood = "soft" | "sad" | "sing" | "focus";
function drawChibiBase(ctx: CanvasRenderingContext2D, w: number, h: number, opts: { skin: string; hair: string; shirt: string; pants: string; hairStyle: "short" | "long" | "spiky"; mood: Mood; beard?: boolean }) {
  ctx.clearRect(0, 0, w, h);
  const cx = w * 0.5, by = h * 0.93, ink = "#1b1820";
  const line = (lw = 6) => { ctx.lineWidth = lw; ctx.strokeStyle = ink; ctx.lineCap = "round"; ctx.lineJoin = "round"; };
  const fs = (fill: string) => { ctx.fillStyle = fill; ctx.fill(); ctx.stroke(); };
  line(6);
  ctx.beginPath(); ctx.ellipse(cx - 22, by - 48, 14, 38, 0, 0, Math.PI * 2); fs(opts.pants);
  ctx.beginPath(); ctx.ellipse(cx + 22, by - 48, 14, 38, 0, 0, Math.PI * 2); fs(opts.pants);
  ctx.beginPath(); ctx.ellipse(cx, by - 120, 46, 52, 0, 0, Math.PI * 2); fs(opts.shirt);
  ctx.save(); ctx.translate(cx - 46, by - 132); ctx.rotate(0.45); ctx.beginPath(); ctx.ellipse(0, 30, 11, 34, 0, 0, Math.PI * 2); fs(opts.skin); ctx.restore();
  ctx.save(); ctx.translate(cx + 46, by - 132); ctx.rotate(-0.45); ctx.beginPath(); ctx.ellipse(0, 30, 11, 34, 0, 0, Math.PI * 2); fs(opts.skin); ctx.restore();
  const hy = by - 265;
  ctx.beginPath(); ctx.ellipse(cx, hy, 78, 74, 0, 0, Math.PI * 2); fs(opts.skin);
  ctx.fillStyle = opts.hair; ctx.strokeStyle = ink; line(4);
  if (opts.hairStyle === "long") {
    ctx.beginPath(); ctx.ellipse(cx, hy - 18, 82, 62, 0, Math.PI, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(cx - 84, hy - 10, 22, 110, 11); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(cx + 62, hy - 10, 22, 110, 11); ctx.fill(); ctx.stroke();
  } else if (opts.hairStyle === "spiky") {
    ctx.beginPath(); ctx.moveTo(cx - 76, hy - 10); ctx.quadraticCurveTo(cx - 78, hy - 58, cx - 35, hy - 68);
    ctx.lineTo(cx - 20, hy - 84); ctx.lineTo(cx - 5, hy - 72); ctx.lineTo(cx + 10, hy - 86); ctx.lineTo(cx + 28, hy - 70);
    ctx.quadraticCurveTo(cx + 78, hy - 56, cx + 76, hy - 10); ctx.quadraticCurveTo(cx + 35, hy - 28, cx, hy - 26); ctx.quadraticCurveTo(cx - 35, hy - 28, cx - 76, hy - 10); ctx.closePath(); ctx.fill(); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.ellipse(cx, hy - 24, 80, 50, 0, Math.PI, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  if (opts.beard) {
    ctx.strokeStyle = opts.hair; line(3); ctx.beginPath(); ctx.moveTo(cx - 20, hy + 30); ctx.quadraticCurveTo(cx, hy + 26, cx + 20, hy + 30); ctx.stroke();
    ctx.fillStyle = "rgba(60,40,30,0.2)"; ctx.beginPath(); ctx.moveTo(cx - 28, hy + 34); ctx.quadraticCurveTo(cx, hy + 56, cx + 28, hy + 34); ctx.quadraticCurveTo(cx, hy + 44, cx - 28, hy + 34); ctx.fill();
  }
  ctx.fillStyle = "rgba(255,150,150,0.18)";
  ctx.beginPath(); ctx.ellipse(cx - 42, hy + 12, 14, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 42, hy + 12, 14, 9, 0, 0, Math.PI * 2); ctx.fill();
  const eyeY = hy - 2;
  const drawEye = (ex: number) => {
    ctx.fillStyle = "#fff"; ctx.strokeStyle = ink; line(3); ctx.beginPath(); ctx.ellipse(ex, eyeY, 14, opts.mood === "sad" ? 13 : 16, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#2a1f24"; ctx.beginPath(); ctx.ellipse(ex, eyeY + 2, 8.5, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(ex - 4, eyeY - 4, 3.5, 4, 0, 0, Math.PI * 2); ctx.fill();
    if (opts.mood === "sad") { ctx.fillStyle = "rgba(120,200,255,0.45)"; ctx.beginPath(); ctx.ellipse(ex + 11, eyeY + 18, 3, 5, 0, 0, Math.PI * 2); ctx.fill(); }
  };
  drawEye(cx - 24); drawEye(cx + 24);
  line(4); ctx.strokeStyle = ink;
  if (opts.mood === "sad") {
    ctx.beginPath(); ctx.moveTo(cx - 38, hy - 20); ctx.quadraticCurveTo(cx - 24, hy - 30, cx - 10, hy - 26); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 10, hy - 26); ctx.quadraticCurveTo(cx + 24, hy - 30, cx + 38, hy - 20); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(cx - 38, hy - 24); ctx.quadraticCurveTo(cx - 24, hy - 30, cx - 10, hy - 24); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 10, hy - 24); ctx.quadraticCurveTo(cx + 24, hy - 30, cx + 38, hy - 24); ctx.stroke();
  }
  line(3.5); ctx.beginPath();
  if (opts.mood === "sing") { ctx.ellipse(cx, hy + 34, 8, 5, 0, 0, Math.PI * 2); ctx.stroke(); }
  else if (opts.mood === "sad") { ctx.arc(cx, hy + 40, 9, 1.2 * Math.PI, 1.8 * Math.PI); ctx.stroke(); }
  else { ctx.moveTo(cx - 9, hy + 33); ctx.quadraticCurveTo(cx, hy + 37, cx + 9, hy + 33); ctx.stroke(); }
}

function drawChester(ctx: CanvasRenderingContext2D, w: number, h: number, mood: Mood = "soft") {
  drawChibiBase(ctx, w, h, { skin: "#efc39b", hair: "#d8c07a", shirt: "#2d2d2d", pants: "#1f1f1f", hairStyle: "short", mood });
}
function drawMike(ctx: CanvasRenderingContext2D, w: number, h: number, mood: Mood = "soft") {
  drawChibiBase(ctx, w, h, { skin: "#efc39b", hair: "#1a1a1a", shirt: "#3b4a66", pants: "#2b2b2b", hairStyle: "spiky", mood });
}
function drawChris(ctx: CanvasRenderingContext2D, w: number, h: number, mood: Mood = "soft") {
  drawChibiBase(ctx, w, h, { skin: "#efc39b", hair: "#5b4636", shirt: "#222222", pants: "#1a1a1a", hairStyle: "long", mood, beard: true });
}
function drawAmy(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  const cx = w * 0.5, by = h * 0.93, ink = "#1b1820";
  const line = (lw = 6) => { ctx.lineWidth = lw; ctx.strokeStyle = ink; ctx.lineCap = "round"; ctx.lineJoin = "round"; };
  const fs = (fill: string) => { ctx.fillStyle = fill; ctx.fill(); ctx.stroke(); };
  line(6);
  ctx.beginPath(); ctx.ellipse(cx, by - 120, 44, 52, 0, 0, Math.PI * 2); fs("#7a6a9e");
  ctx.beginPath(); ctx.ellipse(cx, by - 260, 72, 68, 0, 0, Math.PI * 2); fs("#efc39b");
  ctx.fillStyle = "#8b5a2b"; ctx.strokeStyle = ink; line(4);
  ctx.beginPath(); ctx.ellipse(cx, hyFix(by) - 18, 76, 58, 0, Math.PI, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.roundRect(cx - 78, hyFix(by) - 5, 20, 90, 10); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.roundRect(cx + 58, hyFix(by) - 5, 20, 90, 10); ctx.fill(); ctx.stroke();
  // gentle back-facing/symbolic feel: soft eyes
  ctx.fillStyle = "#2a1f24"; ctx.beginPath(); ctx.ellipse(cx - 20, hyFix(by), 5, 3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 20, hyFix(by), 5, 3, 0, 0, Math.PI * 2); ctx.fill();
  line(3); ctx.beginPath(); ctx.moveTo(cx - 8, hyFix(by) + 28); ctx.quadraticCurveTo(cx, hyFix(by) + 32, cx + 8, hyFix(by) + 28); ctx.stroke();
}
function hyFix(by: number) { return by - 265; }

const Card: React.FC<{ tex: THREE.Texture; pos: [number, number, number]; scale?: number | [number, number, number]; rot?: [number, number, number]; opacity?: number }> = ({ tex, pos, scale = 1, rot = [0, 0, 0], opacity = 1 }) => (
  <mesh position={pos} rotation={rot} scale={scale as any} layers={NOINK}><planeGeometry args={[2.2, 3.3]} /><meshBasicMaterial map={tex} transparent alphaTest={0.05} side={THREE.DoubleSide} opacity={opacity} /></mesh>
);
const Box: React.FC<{ pos: [number, number, number]; args: [number, number, number]; color: string; rot?: [number, number, number] }> = ({ pos, args, color, rot = [0, 0, 0] }) => (<mesh position={pos} rotation={rot} castShadow receiveShadow><boxGeometry args={args} /><meshLambertMaterial color={color} /></mesh>);
const Cyl: React.FC<{ pos: [number, number, number]; args: [number, number, number, number?]; color: string; rot?: [number, number, number] }> = ({ pos, args, color, rot = [0, 0, 0] }) => (<mesh position={pos} rotation={rot} castShadow receiveShadow><cylinderGeometry args={args} /><meshLambertMaterial color={color} /></mesh>);

const Star: React.FC<{ pos: [number, number, number]; size?: number; color?: string }> = ({ pos, size = 0.08, color = "#ffd976" }) => (
  <mesh position={pos} layers={NOINK}><sphereGeometry args={[size, 12, 12]} /><meshBasicMaterial color={color} transparent opacity={0.95} /></mesh>
);

const StarField: React.FC<{ count?: number }> = ({ count = 120 }) => {
  const stars = useMemo(() => Array.from({ length: count }).map(() => [ (Math.random() - 0.5) * 18, 1.5 + Math.random() * 8, -4 - Math.random() * 8 ] as [number, number, number]), [count]);
  return <group>{stars.map((p, i) => <Star key={i} pos={p} size={0.03 + (i % 4) * 0.01} color={i % 7 === 0 ? "#fff3c4" : "#ffffff"} />)}</group>;
};

const Mic: React.FC<{ pos: [number, number, number] }> = ({ pos }) => (
  <group position={pos}>
    <Cyl pos={[0, 0.95, 0]} args={[0.03, 0.03, 1.9, 12]} color="#222" />
    <Cyl pos={[0, 0.02, 0]} args={[0.22, 0.25, 0.04, 16]} color="#1a1a1a" />
    <mesh position={[0, 1.95, 0.08]} rotation={[Math.PI / 2, 0, 0]} castShadow><sphereGeometry args={[0.09, 16, 16]} /><meshLambertMaterial color="#9aa0a6" /></mesh>
  </group>
);

const Stage: React.FC = () => (
  <group>
    <Box pos={[0, 0.3, -0.2]} args={[8, 0.6, 4]} color="#1a1d27" />
    <Box pos={[0, 2.8, -2.2]} args={[9, 4.5, 0.2]} color="#141824" />
    <pointLight position={[-2.5, 4.5, 1]} intensity={1.8} color="#7db6ff" distance={14} />
    <pointLight position={[2.5, 4.5, 1]} intensity={1.8} color="#ffcf7d" distance={14} />
  </group>
);

const World: React.FC<{ time: number }> = ({ time }) => {
  const { id, local, dur } = segInfo(time);
  const p = smooth(local / dur);
  const enter = smooth(clamp01(local / 1.4));
  const walkX = (1 - enter) * -1.6;
  const chesterMood: Mood = id === "tribute" || id === "emotion" ? "sing" : id === "memory" || id === "twoMonths" ? "sad" : "soft";
  const mikeMood: Mood = id === "writing" ? "focus" : "soft";
  const chrisMood: Mood = "soft";

  const chesterTex = useMemo(() => makeTex((c, w, h) => drawChester(c, w, h, chesterMood), 512, 768), [chesterMood]);
  const mikeTex = useMemo(() => makeTex((c, w, h) => drawMike(c, w, h, mikeMood), 512, 768), [mikeMood]);
  const chrisTex = useMemo(() => makeTex((c, w, h) => drawChris(c, w, h, chrisMood), 512, 768), [chrisMood]);
  const amyTex = useMemo(() => makeTex((c, w, h) => drawAmy(c, w, h), 512, 768), []);
  useEffect(() => () => { chesterTex.dispose(); }, [chesterTex]);
  useEffect(() => () => { mikeTex.dispose(); }, [mikeTex]);
  useEffect(() => () => { chrisTex.dispose(); }, [chrisTex]);
  useEffect(() => () => { amyTex.dispose(); }, [amyTex]);

  const dark = ["hook", "chrisLoss", "twoMonths", "memory", "names", "threeStars", "message", "cta", "finale"].includes(id);
  const bg = dark ? "#070b16" : "#141b2d";

  return (
    <group>
      <color attach="background" args={[bg]} />
      <fog attach="fog" args={[bg, 10, 35]} />
      <ambientLight intensity={dark ? 0.35 : 0.55} />
      <directionalLight position={[4, 7, 4]} intensity={dark ? 0.8 : 1.15} color="#fff0d8" />

      {(dark || id === "song") && <StarField count={dark ? 160 : 60} />}

      {/* Ground/base */}
      {!["hook", "names", "threeStars", "message", "cta", "finale"].includes(id) && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow><planeGeometry args={[40, 40]} /><meshLambertMaterial color="#23293a" /></mesh>
      )}

      {id === "hook" && (
        <group>
          <Star pos={[0, 3.5, -2]} size={0.18} color="#ffe8a3" />
          <pointLight position={[0, 3.5, -1.2]} intensity={2.2} color="#ffd976" distance={8} />
        </group>
      )}

      {id === "amy" && (
        <group>
          <Box pos={[0, 2.2, -2.2]} args={[8, 4.5, 0.2]} color="#201a2d" />
          <Box pos={[0, 0.72, -0.45]} args={[3.2, 0.1, 0.9]} color="#4a3b32" />
          <Cyl pos={[-1.3, 0.36, -0.45]} args={[0.05, 0.05, 0.72, 10]} color="#2f2620" />
          <Cyl pos={[1.3, 0.36, -0.45]} args={[0.05, 0.05, 0.72, 10]} color="#2f2620" />
          <Card tex={amyTex} pos={[0.2, 1.45, 0.55]} scale={0.95} />
          <Box pos={[-1.2, 1.25, -0.85]} args={[0.8, 0.5, 0.05]} color="#151515" />
        </group>
      )}

      {id === "writing" && (
        <group>
          <Box pos={[0, 2.2, -2.2]} args={[8, 4.5, 0.2]} color="#1f2433" />
          <Box pos={[0.8, 0.72, -0.35]} args={[2.8, 0.1, 0.9]} color="#4a3b32" />
          <Cyl pos={[-0.3, 0.36, -0.35]} args={[0.05, 0.05, 0.72, 10]} color="#2f2620" />
          <Cyl pos={[1.9, 0.36, -0.35]} args={[0.05, 0.05, 0.72, 10]} color="#2f2620" />
          <Card tex={mikeTex} pos={[-0.8, 1.45, 0.55]} scale={0.98} />
          <Box pos={[0.9, 0.82, -0.2]} args={[0.7, 0.05, 0.45]} color="#ddd3c2" />
          <Cyl pos={[1.25, 0.83, -0.2]} args={[0.015, 0.015, 0.35, 8]} color="#222" rot={[0, 0, Math.PI / 2]} />
        </group>
      )}

      {id === "song" && (
        <group>
          <Stage />
          <Card tex={mikeTex} pos={[-1.0 + walkX * 0.5, 2.15, 0.2]} scale={0.95} />
          <Card tex={chesterTex} pos={[0.8 + walkX, 2.15, 0.45]} scale={0.95} />
          <Mic pos={[0.8, 0.6, 0.95]} />
        </group>
      )}

      {id === "chrisLoss" && (
        <group>
          <Stage />
          <Card tex={chrisTex} pos={[0 + walkX * 0.3, 2.15, 0.45]} scale={1.0} />
          <Mic pos={[0, 0.6, 0.95]} />
          <pointLight position={[0, 4.5, 1]} intensity={1.2} color="#a7c7ff" distance={10} />
        </group>
      )}

      {(id === "kimmel" || id === "change" || id === "tribute" || id === "emotion") && (
        <group>
          <Stage />
          <Card tex={chesterTex} pos={[0.1 + (id === "kimmel" ? walkX : 0), 2.18, 0.5]} scale={1.02} />
          <Mic pos={[0.1, 0.6, 1.0]} />
          <Card tex={mikeTex} pos={[-1.4, 2.05, -0.2]} scale={0.85} />
        </group>
      )}

      {id === "twoMonths" && (
        <group>
          <Box pos={[0, 2.2, -2.2]} args={[6, 3.2, 0.15]} color="#1e2434" />
          <Star pos={[-1.2, 2.8, -1.5]} size={0.05} />
          <Star pos={[1.3, 3.2, -1.8]} size={0.04} />
        </group>
      )}

      {id === "memory" && (
        <group>
          <Stage />
          <Mic pos={[0, 0.6, 0.9]} />
          <pointLight position={[0, 4.2, 1]} intensity={1.4} color="#ffd976" distance={9} />
        </group>
      )}

      {(id === "names" || id === "threeStars" || id === "message" || id === "cta" || id === "finale") && (
        <group>
          <Star pos={[-1.2, 3.0 + p * 0.2, -2.5]} size={0.12} color="#ffd976" />
          <Star pos={[0, 3.35 + p * 0.25, -2.7]} size={0.13} color="#ffe39b" />
          <Star pos={[1.2, 2.9 + p * 0.2, -2.5]} size={0.12} color="#ffd976" />
          <pointLight position={[-1.2, 3.0, -1.8]} intensity={1.4} color="#ffd976" distance={6} />
          <pointLight position={[0, 3.35, -1.9]} intensity={1.5} color="#ffe39b" distance={6} />
          <pointLight position={[1.2, 2.9, -1.8]} intensity={1.4} color="#ffd976" distance={6} />
        </group>
      )}
    </group>
  );
};

const CameraRig: React.FC<{ time: number }> = ({ time }) => {
  const { camera } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  const { id, local, dur } = segInfo(time);
  const p = smooth(local / dur);
  let pos = new THREE.Vector3(0, 1.8, 5.6 - p * 0.2);
  let look = new THREE.Vector3(0, 1.6, 0);
  if (id === "hook") { pos.set(0, 2.8, 6.2 - p * 0.6); look.set(0, 3.3, -2); }
  if (["names", "threeStars", "message", "cta", "finale"].includes(id)) { pos.set(0, 2.7, 6.8 - p * 0.3); look.set(0, 3.1, -2.4); }
  if (id === "emotion") { pos.set(0, 1.9, 4.9 - p * 0.15); look.set(0.1, 1.75, 0.5); }
  if (id === "memory") { pos.set(0, 1.8, 5.4 - p * 0.2); look.set(0, 1.6, 0.5); }
  useEffect(() => { cam.position.copy(pos); cam.lookAt(look); cam.fov = 45; cam.near = 0.1; cam.far = 100; cam.updateProjectionMatrix(); }, [cam, pos.x, pos.y, pos.z, look.x, look.y, look.z]);
  return null;
};

const PostFX: React.FC<{ time: number }> = ({ time }) => {
  const { scene, camera } = useThree();
  const { id } = segInfo(time);
  const fx = useMemo(() => ({ ink: new InkPass(scene, camera as THREE.PerspectiveCamera, { strength: 0.8, widthNear: 4.0, widthFar: 2.5 }), lens: new LensBlur({ maxCoC: 18, nearScale: 1.0 }), bloom: makeBloom(), tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }), grade: new GradeEffect(GRADES.day, GRADE_STRENGTH.day) }), [scene, camera]);
  useEffect(() => () => fx.ink.dispose(), [fx]);
  fx.lens.focus = 5.0; fx.lens.cInf = 5.2;
  const golden = ["amy", "writing", "song", "kimmel", "change", "tribute", "emotion"].includes(id);
  fx.grade.set(golden ? GRADES.golden : GRADES.day);
  fx.grade.amount = golden ? GRADE_STRENGTH.golden : GRADE_STRENGTH.day;
  return (<EffectComposer multisampling={4}><primitive object={fx.ink} dispose={null} /><primitive object={fx.lens.pre} dispose={null} /><primitive object={fx.lens.main} dispose={null} /><primitive object={fx.bloom} dispose={null} /><primitive object={fx.tone} dispose={null} /><primitive object={fx.grade} dispose={null} /></EffectComposer>);
};

const SceneRoot: React.FC = () => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const time = frame / fps;
  const { scene } = useThree(); noInkFallback(scene);
  return <><World time={time} /><CameraRig time={time} /><PostFX time={time} /></>;
};

const Overlay: React.FC = () => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const t = frame / fps;
  const items: { start: number; end: number; text: string; color?: string; size?: number }[] = [
    { start: 0.2, end: 4.8, text: "UMA PESSOA… TRÊS DESPEDIDAS", color: "#ffd976", size: 46 },
    { start: 5.7, end: 11.8, text: "AMY ZARET", color: "#d8cfff", size: 44 },
    { start: 23.2, end: 28.8, text: "CHRIS CORNELL", color: "#a7c7ff", size: 44 },
    { start: 36.7, end: 40.2, text: "ONE MORE LIGHT", color: "#ffd976", size: 46 },
    { start: 44.9, end: 48.8, text: "DOIS MESES DEPOIS", color: "#ffffff", size: 42 },
    { start: 56.3, end: 62.0, text: "AMY. CHRIS. CHESTER.", color: "#ffd976", size: 46 },
    { start: 64.0, end: 68.5, text: "Uma luz pode se apagar.\nMas nunca deixa de significar algo.", color: "#fff3c4", size: 40 },
    { start: 69.0, end: 75.5, text: "Se essa história te tocou,\nsegue o perfil pra ajudar o canal a chegar em mais gente.\nAinda vem muito conteúdo por aí.", color: "#7CFF9B", size: 34 },
    { start: 76.5, end: 89.5, text: "ONE MORE LIGHT — LINKIN PARK", color: "#ffd976", size: 42 },
  ];
  const active = items.find((it) => t >= it.start && t < it.end);
  if (!active) return null;
  const local = (t - active.start) / Math.max(0.001, active.end - active.start);
  const opacity = local < 0.12 ? local / 0.12 : local > 0.85 ? (1 - local) / 0.15 : 1;
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 220, pointerEvents: "none" }}>
      <div style={{ opacity, whiteSpace: "pre-line", color: active.color, fontFamily: "Arial Black, Arial, sans-serif", fontSize: active.size ?? 44, lineHeight: 1.15, textAlign: "center", padding: "16px 28px", maxWidth: 940, textShadow: "0 4px 20px rgba(0,0,0,0.9)" }}>
        {active.text}
      </div>
    </AbsoluteFill>
  );
};

export const OneMoreLightStoryShort: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#070b16" }}>
    <ThreeCanvas width={1080} height={1920} camera={{ fov: 45, position: [0, 1.8, 5.6], near: 0.1, far: 100 }} gl={{ antialias: false, stencil: false, powerPreference: "high-performance", toneMappingExposure: 1.0 }}>
      <SceneRoot />
    </ThreeCanvas>
    <Overlay />
    <Audio src={staticFile("one-more-light-story/voice.wav")} />
  </AbsoluteFill>
);
