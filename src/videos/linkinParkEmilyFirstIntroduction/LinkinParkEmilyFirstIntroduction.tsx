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

export const LPEI_FPS = 30;
export const LPEI_DURATION = 3000; // 100s
export const LPEI_FRAMES = LPEI_DURATION;

const SEGS = [
  { id: "hook", a: 0.096, b: 4.934 },
  { id: "loss", a: 5.729, b: 10.0 },
  { id: "return", a: 10.799, b: 16.296 },
  { id: "back", a: 17.095, b: 19.965 },
  { id: "emilyName", a: 20.764, b: 21.736 },
  { id: "announce", a: 22.546, b: 29.34 },
  { id: "notHidden", a: 29.352, b: 32.35 },
  { id: "emptiness", a: 32.361, b: 37.789 },
  { id: "daysLater", a: 37.801, b: 42.025 },
  { id: "kiaIntro", a: 42.037, b: 50.0 },
  { id: "reaction", a: 50.012, b: 53.31 },
  { id: "arena", a: 53.322, b: 60.752 },
  { id: "classics", a: 60.764, b: 64.792 },
  { id: "support", a: 64.803, b: 69.826 },
  { id: "notChester", a: 69.838, b: 72.963 },
  { id: "herOwn", a: 72.975, b: 77.847 },
  { id: "newChapter", a: 77.859, b: 84.664 },
  { id: "presented", a: 84.896, b: 88.472 },
  { id: "place", a: 88.484, b: 92.338 },
  { id: "cta", a: 92.35, b: 100.0 },
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
const makeBloom = () => new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.45, luminanceThreshold: 0.9, luminanceSmoothing: 0.25, mipmapBlur: true, levels: 5, radius: 0.6 });
function makeTex(draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, w = 512, h = 768) {
  const canvas = document.createElement("canvas"); canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d")!; draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; tex.needsUpdate = true; return tex;
}

const YELLOW = "#f4d21b";
const YELLOW_DARK = "#d8b800";

function drawChibiBase(ctx: CanvasRenderingContext2D, w: number, h: number, opts: { skin: string; hair: string; shirt: string; pants: string; hairStyle: "short" | "long" | "cap"; mood?: "soft" | "focus" | "sing" | "happy" | "surprised" }) {
  ctx.clearRect(0, 0, w, h);
  const cx = w * 0.5, by = h * 0.93; const ink = "#1b1820";
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
  if (opts.hairStyle === "cap") {
    ctx.beginPath(); ctx.ellipse(cx, hy - 38, 78, 30, 0, Math.PI, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(cx - 10, hy - 52, 98, 14, 6); ctx.fill(); ctx.stroke();
  } else if (opts.hairStyle === "long") {
    ctx.beginPath(); ctx.ellipse(cx, hy - 18, 82, 62, 0, Math.PI, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(cx - 84, hy - 10, 22, 95, 11); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(cx + 62, hy - 10, 22, 95, 11); ctx.fill(); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(cx - 76, hy - 10); ctx.quadraticCurveTo(cx - 78, hy - 62, cx - 35, hy - 72);
    ctx.lineTo(cx - 20, hy - 84); ctx.lineTo(cx - 5, hy - 74); ctx.lineTo(cx + 10, hy - 86); ctx.lineTo(cx + 28, hy - 72);
    ctx.quadraticCurveTo(cx + 78, hy - 60, cx + 76, hy - 10); ctx.quadraticCurveTo(cx + 35, hy - 30, cx, hy - 28); ctx.quadraticCurveTo(cx - 35, hy - 30, cx - 76, hy - 10); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  ctx.fillStyle = "rgba(255,150,150,0.2)";
  ctx.beginPath(); ctx.ellipse(cx - 42, hy + 12, 14, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 42, hy + 12, 14, 9, 0, 0, Math.PI * 2); ctx.fill();
  const eyeY = hy - 2;
  const drawEye = (ex: number) => { ctx.fillStyle = "#fff"; ctx.strokeStyle = ink; line(3); ctx.beginPath(); ctx.ellipse(ex, eyeY, 14, 16, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#2a1f24"; ctx.beginPath(); ctx.ellipse(ex, eyeY + 1, 8.5, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(ex - 4, eyeY - 4, 3.5, 4, 0, 0, Math.PI * 2); ctx.fill(); };
  drawEye(cx - 24); drawEye(cx + 24);
  line(4); ctx.strokeStyle = ink;
  ctx.beginPath(); ctx.moveTo(cx - 38, hy - 24); ctx.quadraticCurveTo(cx - 24, hy - 30, cx - 10, hy - 24); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 10, hy - 24); ctx.quadraticCurveTo(cx + 24, hy - 30, cx + 38, hy - 24); ctx.stroke();
  line(3.5); ctx.beginPath();
  if (opts.mood === "sing") { ctx.ellipse(cx, hy + 34, 9, 6, 0, 0, Math.PI * 2); ctx.stroke(); }
  else if (opts.mood === "happy") { ctx.arc(cx, hy + 30, 11, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); }
  else { ctx.moveTo(cx - 9, hy + 33); ctx.quadraticCurveTo(cx, hy + 37, cx + 9, hy + 33); ctx.stroke(); }
}
function drawEmily(ctx: CanvasRenderingContext2D, w: number, h: number, mood: "soft" | "focus" | "sing" | "happy" | "surprised" = "soft") {
  drawChibiBase(ctx, w, h, { skin: "#f2c9a7", hair: "#e7c66a", shirt: YELLOW, pants: "#2b2d33", hairStyle: "long", mood });
  const cx = w * 0.5, by = h * 0.93; ctx.strokeStyle = YELLOW_DARK; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(cx - 20, by - 170); ctx.lineTo(cx, by - 140); ctx.lineTo(cx + 20, by - 170); ctx.stroke();
}
function drawMike(ctx: CanvasRenderingContext2D, w: number, h: number, mood: "soft" | "focus" | "happy" = "soft") { drawChibiBase(ctx, w, h, { skin: "#efc39b", hair: "#c23b3b", shirt: "#3b4a66", pants: "#30323a", hairStyle: "cap", mood }); }

const Card: React.FC<{ tex: THREE.Texture; pos: [number, number, number]; scale?: number | [number, number, number]; rot?: [number, number, number]; opacity?: number }> = ({ tex, pos, scale = 1, rot = [0, 0, 0], opacity = 1 }) => (
  <mesh position={pos} rotation={rot} scale={scale as any} layers={NOINK}><planeGeometry args={[2.2, 3.3]} /><meshBasicMaterial map={tex} transparent alphaTest={0.05} side={THREE.DoubleSide} opacity={opacity} /></mesh>
);
const Label3D: React.FC<{ text: string; pos: [number, number, number]; color?: string; bg?: string; w?: number; h?: number; scale?: number }> = ({ text, pos, color = "#fff", bg = "rgba(0,0,0,0.45)", w = 900, h = 128, scale = 1 }) => {
  const tex = useMemo(() => makeTex((ctx, W, H) => { ctx.clearRect(0, 0, W, H); ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(20, 20, W - 40, H - 40, 20); ctx.fill(); ctx.fillStyle = color; ctx.font = "bold 44px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(text, W / 2, H / 2); }, w, h), [text, color, bg, w, h]);
  return <Card tex={tex} pos={pos} scale={[scale * 2.4, scale * 0.55, 1] as any} />;
};
const BoxProp: React.FC<{ pos: [number, number, number]; args: [number, number, number]; color: string; rot?: [number, number, number] }> = ({ pos, args, color, rot = [0, 0, 0] }) => (<mesh position={pos} rotation={rot} castShadow receiveShadow><boxGeometry args={args} /><meshLambertMaterial color={color} /></mesh>);
const Cyl: React.FC<{ pos: [number, number, number]; args: [number, number, number, number?]; color: string; rot?: [number, number, number] }> = ({ pos, args, color, rot = [0, 0, 0] }) => (<mesh position={pos} rotation={rot} castShadow receiveShadow><cylinderGeometry args={args} /><meshLambertMaterial color={color} /></mesh>);
const MicStand: React.FC<{ pos: [number, number, number] }> = ({ pos }) => (<group position={pos}><Cyl pos={[0, 0.9, 0]} args={[0.03, 0.03, 1.8, 12]} color="#222" /><Cyl pos={[0, 0.02, 0]} args={[0.22, 0.25, 0.04, 16]} color="#1a1a1a" /><mesh position={[0, 1.85, 0.08]} rotation={[Math.PI / 2, 0, 0]} castShadow><sphereGeometry args={[0.09, 16, 16]} /><meshLambertMaterial color="#9aa0a6" /></mesh></group>);
const StageLights: React.FC = () => (<group><pointLight position={[-3, 5.5, 2]} intensity={2.0} color="#4da6ff" distance={18} /><pointLight position={[3, 5.5, 2]} intensity={2.0} color="#ff4d8d" distance={18} /><pointLight position={[0, 4.5, -2]} intensity={1.6} color={YELLOW} distance={14} /></group>);

const Crowd: React.FC = () => (
  <group position={[0, 0, -3.2]}>
    {Array.from({ length: 22 }).map((_, i) => (
      <mesh key={i} position={[-5 + i * 0.48, 0.55 + (i % 3) * 0.12, 0]}>
        <boxGeometry args={[0.28, 0.9 + (i % 4) * 0.1, 0.2]} />
        <meshLambertMaterial color={i % 2 ? "#121826" : "#1a2233"} />
      </mesh>
    ))}
  </group>
);

const World: React.FC<{ time: number }> = ({ time }) => {
  const { id, local, dur } = segInfo(time);
  const p = smooth(local / dur);
  const emily = useMemo(() => makeTex((c, w, h) => drawEmily(c, w, h, ["emptiness", "arena", "classics", "herOwn", "place"].includes(id) ? "sing" : ["newChapter", "cta"].includes(id) ? "happy" : "soft"), 512, 768), [id]);
  const mike = useMemo(() => makeTex((c, w, h) => drawMike(c, w, h, ["support", "newChapter"].includes(id) ? "happy" : "soft"), 512, 768), [id]);
  useEffect(() => () => { emily.dispose(); }, [emily]);
  useEffect(() => () => { mike.dispose(); }, [mike]);

  const bg = ["loss", "return"].includes(id) ? "#121827" : ["kiaIntro", "reaction", "arena", "classics", "support"].includes(id) ? "#10162a" : "#0f1830";
  return (
    <group>
      <color attach="background" args={[bg]} />
      <fog attach="fog" args={[bg, 8, 32]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 7, 4]} intensity={1.15} color="#fff0d8" />
      <directionalLight position={[-4, 4, -2]} intensity={0.45} color="#7cc0ff" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow><planeGeometry args={[40, 40]} /><meshLambertMaterial color="#23293a" /></mesh>
      <mesh position={[0, 3.2, -6]} receiveShadow><planeGeometry args={[20, 8]} /><meshLambertMaterial color="#1d2436" /></mesh>

      {id === "hook" && (<group><StageLights /><Card tex={mike} pos={[-0.9, 1.5, -0.5]} scale={0.92} /><Card tex={emily} pos={[0.7, 1.58, 0.2]} scale={1.0} /><Label3D text="UMA NOVA VOZ" pos={[0, 3.45, -2.4]} color={YELLOW} /></group>)}
      {id === "loss" && (<group><MicStand pos={[0, 0, -0.8]} /><pointLight position={[0, 3, 0]} intensity={1.2} color="#ffffff" distance={8} /><Label3D text="7 ANOS DEPOIS..." pos={[0, 3.45, -2.4]} color="#ffffff" /></group>)}
      {id === "return" && (<group><Card tex={mike} pos={[0, 1.55, 0.2]} scale={1.0} /><StageLights /><Label3D text="O LINKIN PARK ESTAVA DE VOLTA" pos={[0, 3.45, -2.4]} w={960} scale={0.7} color="#7fd4ff" /></group>)}
      {id === "back" && (<group><Card tex={mike} pos={[-0.6, 1.52, 0.0]} scale={0.95} /><Card tex={emily} pos={[0.8, 1.55, -0.5]} scale={0.95} /><Label3D text="COM UMA NOVA VOZ" pos={[0, 3.45, -2.4]} color={YELLOW} /></group>)}
      {id === "emilyName" && (<group><Card tex={emily} pos={[0, 1.58, 0.2]} scale={1.02} /><Label3D text="EMILY ARMSTRONG" pos={[0, 3.45, -2.4]} color={YELLOW} /></group>)}
      {id === "announce" && (<group><StageLights /><Card tex={mike} pos={[-0.9, 1.5, -0.5]} scale={0.9} /><Card tex={emily} pos={[0.8, 1.55, 0.1]} scale={0.95} /><Label3D text="5 DE SETEMBRO DE 2024" pos={[0, 3.45, -2.4]} color="#7fd4ff" /></group>)}
      {id === "notHidden" && (<group><Card tex={emily} pos={[0, 1.58, 0.2]} scale={1.0} /><MicStand pos={[0.8, 0, -0.4]} /><Label3D text="ELA ENTRA NO PALCO" pos={[0, 3.45, -2.4]} color={YELLOW} /></group>)}
      {id === "emptiness" && (<group><StageLights /><MicStand pos={[0.8, 0, -0.4]} /><Card tex={emily} pos={[0.2, 1.58, 0.2]} scale={1.0} /><Card tex={mike} pos={[-1.0, 1.48, -0.8]} scale={0.88} /><Label3D text="THE EMPTINESS MACHINE" pos={[0, 3.45, -2.4]} w={920} scale={0.72} color={YELLOW} /></group>)}
      {id === "daysLater" && (<group><BoxProp pos={[0, 1.5, -1.2]} args={[3.2, 2.0, 0.1]} color="#22304a" /><Label3D text="ALGUNS DIAS DEPOIS" pos={[0, 3.45, -2.4]} color="#ffffff" /><Label3D text="KIA FORUM • LOS ANGELES" pos={[0, 2.85, -1.8]} color="#7fd4ff" w={920} scale={0.7} /></group>)}
      {id === "kiaIntro" && (<group><Crowd /><StageLights /><Card tex={mike} pos={[-0.7, 1.55, 0.0]} scale={0.95} /><Card tex={emily} pos={[0.8, 1.55, -0.5]} scale={0.95} /><Label3D text="VOCÊS JÁ CONHECEM A EMILY?" pos={[0, 3.45, -2.4]} w={960} scale={0.68} color={YELLOW} /></group>)}
      {id === "reaction" && (<group><Crowd /><StageLights /><Card tex={emily} pos={[0, 1.58, 0.2]} scale={1.0} /><Label3D text="A ARENA RESPONDEU" pos={[0, 3.45, -2.4]} color="#ffffff" /></group>)}
      {id === "arena" && (<group><Crowd /><StageLights /><MicStand pos={[0.8, 0, -0.4]} /><Card tex={emily} pos={[0.2, 1.58, 0.2]} scale={1.0} /><Card tex={mike} pos={[-1.0, 1.48, -0.8]} scale={0.88} /><Label3D text="A PRIMEIRA NOITE DA TURNÊ" pos={[0, 3.45, -2.4]} w={920} scale={0.72} color="#7fd4ff" /></group>)}
      {id === "classics" && (<group><Crowd /><StageLights /><Card tex={emily} pos={[0, 1.58, 0.2]} scale={1.0} /><Label3D text="ELA ENCAROU OS CLÁSSICOS" pos={[0, 3.45, -2.4]} w={920} scale={0.72} color={YELLOW} /></group>)}
      {id === "support" && (<group><Crowd /><StageLights /><Card tex={mike} pos={[-0.7, 1.55, 0.0]} scale={0.95} /><Card tex={emily} pos={[0.8, 1.55, -0.5]} scale={0.95} /><Label3D text="MOSTREM CARINHO PELA EMILY" pos={[0, 3.45, -2.4]} w={940} scale={0.7} color="#ffd166" /></group>)}
      {id === "notChester" && (<group><Card tex={emily} pos={[0, 1.58, 0.2]} scale={1.0} /><Label3D text="ELA NÃO ESTAVA TENTANDO SER CHESTER" pos={[0, 3.45, -2.4]} w={980} scale={0.66} color="#ffffff" /></group>)}
      {id === "herOwn" && (<group><StageLights /><MicStand pos={[0.8, 0, -0.4]} /><Card tex={emily} pos={[0, 1.58, 0.2]} scale={1.0} /><Label3D text="SUA PRÓPRIA VOZ" pos={[0, 3.45, -2.4]} color={YELLOW} /></group>)}
      {id === "newChapter" && (<group><StageLights /><Card tex={mike} pos={[-0.7, 1.52, 0.0]} scale={0.94} /><Card tex={emily} pos={[0.8, 1.55, -0.4]} scale={0.96} /><Label3D text="NÃO APAGAR O PASSADO. COMEÇAR DE NOVO." pos={[0, 3.45, -2.4]} w={980} scale={0.64} color="#ffffff" /></group>)}
      {id === "presented" && (<group><Crowd /><Card tex={emily} pos={[0, 1.58, 0.2]} scale={1.0} /><Label3D text="APRESENTADA AO PÚBLICO" pos={[0, 3.45, -2.4]} color={YELLOW} /></group>)}
      {id === "place" && (<group><StageLights /><Crowd /><Card tex={emily} pos={[0, 1.58, 0.2]} scale={1.02} /><Label3D text="ELA CONQUISTOU SEU LUGAR" pos={[0, 3.45, -2.4]} color={YELLOW} /></group>)}
      {id === "cta" && (<group><StageLights /><Card tex={emily} pos={[0, 1.58, 0.2]} scale={1.02} /><Label3D text="VOCÊ LEMBRA DESSE MOMENTO?" pos={[0, 3.45, -2.4]} w={940} scale={0.7} color="#ffffff" /></group>)}
    </group>
  );
};

const CameraAndPost: React.FC<{ time: number }> = ({ time }) => {
  const { camera, scene } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  const { id, local, dur } = segInfo(time);
  const p = smooth(local / dur);
  const pos = new THREE.Vector3(0, 1.82, 5.5 - p * 0.2); const look = new THREE.Vector3(0, 1.55, -0.2);
  if (["arena", "reaction", "classics", "support", "presented", "place"].includes(id)) { pos.set(0, 1.9, 6.0 - p * 0.2); look.set(0, 1.5, -0.8); }
  if (id === "loss") { pos.set(0, 1.8, 5.2 - p * 0.2); look.set(0, 1.7, -0.4); }
  cam.position.copy(pos); cam.lookAt(look); cam.fov = 44; cam.near = 0.1; cam.far = 100; cam.updateProjectionMatrix();
  const fx = useMemo(() => ({ ink: new InkPass(scene, cam, { strength: 0.82, widthNear: 4.2, widthFar: 2.6 }), lens: new LensBlur({ maxCoC: 18, nearScale: 1.1 }), bloom: makeBloom(), tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }), grade: new GradeEffect(GRADES.day, GRADE_STRENGTH.day) }), [scene, cam]);
  useEffect(() => () => fx.ink.dispose(), [fx]);
  fx.lens.focus = Math.max(0.5, pos.distanceTo(new THREE.Vector3(0, 1.55, 0))); fx.lens.cInf = 5.0;
  const golden = ["newChapter", "cta", "place"].includes(id);
  fx.grade.set(golden ? GRADES.golden : GRADES.day); fx.grade.amount = golden ? GRADE_STRENGTH.golden : GRADE_STRENGTH.day;
  return (<EffectComposer multisampling={4}><primitive object={fx.ink} dispose={null} /><primitive object={fx.lens.pre} dispose={null} /><primitive object={fx.lens.main} dispose={null} /><primitive object={fx.bloom} dispose={null} /><primitive object={fx.tone} dispose={null} /><primitive object={fx.grade} dispose={null} /></EffectComposer>);
};

const SceneRoot: React.FC = () => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const time = frame / fps; const { scene } = useThree(); noInkFallback(scene); return <><World time={time} /><CameraAndPost time={time} /></>; };

const OverlayText: React.FC = () => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const t = frame / fps;
  const items: { start: number; end: number; text: string; color?: string }[] = [
    { start: 0.2, end: 4.5, text: "UMA NOVA VOZ", color: YELLOW },
    { start: 5.9, end: 9.5, text: "7 ANOS DEPOIS...", color: "#ffffff" },
    { start: 11.0, end: 15.5, text: "O LINKIN PARK ESTAVA DE VOLTA", color: "#7fd4ff" },
    { start: 20.8, end: 21.7, text: "EMILY ARMSTRONG", color: YELLOW },
    { start: 22.7, end: 27.0, text: "5 DE SETEMBRO DE 2024", color: "#7fd4ff" },
    { start: 32.5, end: 36.5, text: "THE EMPTINESS MACHINE", color: YELLOW },
    { start: 38.0, end: 41.5, text: "ALGUNS DIAS DEPOIS", color: "#ffffff" },
    { start: 42.2, end: 46.5, text: "KIA FORUM • LOS ANGELES", color: "#7fd4ff" },
    { start: 50.2, end: 53.0, text: "A ARENA RESPONDEU", color: "#ffffff" },
    { start: 60.9, end: 64.5, text: "ELA ENCAROU OS CLÁSSICOS", color: YELLOW },
    { start: 65.0, end: 69.5, text: "MOSTREM CARINHO PELA EMILY", color: "#ffd166" },
    { start: 78.0, end: 83.5, text: "NÃO APAGAR O PASSADO. COMEÇAR DE NOVO.", color: "#ffffff" },
    { start: 92.5, end: 99.5, text: "VOCÊ LEMBRA DESSE MOMENTO?", color: YELLOW },
  ];
  const active = items.find((it) => t >= it.start && t < it.end);
  if (!active) return null;
  const local = (t - active.start) / Math.max(0.001, active.end - active.start);
  const opacity = local < 0.1 ? local / 0.1 : local > 0.85 ? (1 - local) / 0.15 : 1;
  return (<AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 230, pointerEvents: "none" }}><div style={{ opacity, transform: `translateY(${interpolate(local, [0, 1], [18, 0])}px)`, color: active.color, fontFamily: "Arial Black, Arial, sans-serif", fontSize: 46, lineHeight: 1.12, textAlign: "center", padding: "16px 28px", maxWidth: 940, textShadow: "0 4px 18px rgba(0,0,0,0.85)" }}>{active.text}</div></AbsoluteFill>);
};

export const LinkinParkEmilyFirstIntroductionShort: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#0b1020" }}>
    <ThreeCanvas width={1080} height={1920} camera={{ fov: 44, position: [0, 1.8, 5.5], near: 0.1, far: 100 }} gl={{ antialias: false, stencil: false, powerPreference: "high-performance", toneMappingExposure: 1.0 }}>
      <SceneRoot />
    </ThreeCanvas>
    <OverlayText />
    <Audio src={staticFile("linkin-park-emily-first-introduction/voice.wav")} />
  </AbsoluteFill>
);
