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

export const EML_FPS = 30;
export const EML_DURATION = 2626; // ~87.53s
export const EML_FRAMES = EML_DURATION;

const SEGS = [
  { id: "hook", a: 0.093, b: 5.8 },
  { id: "origin", a: 6.543, b: 8.587 },
  { id: "2019", a: 9.337, b: 17.033 },
  { id: "notTest", a: 17.043, b: 23.696 },
  { id: "explore", a: 23.707, b: 30.348 },
  { id: "shift", a: 30.359, b: 33.087 },
  { id: "voiceFit", a: 33.098, b: 41.261 },
  { id: "turning", a: 41.272, b: 44.891 },
  { id: "joeAsk", a: 44.902, b: 52.011 },
  { id: "mikeSurprise", a: 52.022, b: 58.696 },
  { id: "part", a: 58.707, b: 65.598 },
  { id: "invite", a: 65.609, b: 69.587 },
  { id: "newEra", a: 69.598, b: 75.826 },
  { id: "notAudition", a: 75.837, b: 81.859 },
  { id: "cta", a: 81.87, b: 87.533 },
] as const;
type SegId = (typeof SEGS)[number]["id"];

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (t: number) => { const u = clamp01(t); return u * u * (3 - 2 * u); };
const segInfo = (time: number) => {
  for (let i = 0; i < SEGS.length; i++) { const s = SEGS[i]; if (time >= s.a && time < s.b) return { id: s.id as SegId, local: time - s.a, dur: Math.max(0.001, s.b - s.a) }; }
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

const YELLOW = "#f4d21b"; // Emily's characteristic yellow outfit - consistent
const YELLOW_DARK = "#d8b800";

function drawChibiBase(ctx: CanvasRenderingContext2D, w: number, h: number, opts: { skin: string; hair: string; shirt: string; pants: string; hairStyle: "short" | "long" | "cap" | "spiky"; mood?: "soft" | "focus" | "sing" | "surprised" | "happy" }) {
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
  // hair
  ctx.fillStyle = opts.hair; ctx.strokeStyle = ink; line(4);
  if (opts.hairStyle === "cap") {
    ctx.beginPath(); ctx.ellipse(cx, hy - 38, 78, 30, 0, Math.PI, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(cx - 10, hy - 52, 98, 14, 6); ctx.fill(); ctx.stroke();
  } else if (opts.hairStyle === "long") {
    ctx.beginPath(); ctx.ellipse(cx, hy - 18, 82, 62, 0, Math.PI, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(cx - 84, hy - 10, 22, 95, 11); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(cx + 62, hy - 10, 22, 95, 11); ctx.fill(); ctx.stroke();
  } else if (opts.hairStyle === "spiky") {
    ctx.beginPath(); ctx.moveTo(cx - 74, hy - 12); ctx.quadraticCurveTo(cx - 76, hy - 55, cx - 44, hy - 66);
    ctx.lineTo(cx - 50, hy - 84); ctx.lineTo(cx - 32, hy - 72); ctx.lineTo(cx - 28, hy - 92); ctx.lineTo(cx - 12, hy - 74);
    ctx.lineTo(cx - 2, hy - 95); ctx.lineTo(cx + 12, hy - 75); ctx.lineTo(cx + 26, hy - 93); ctx.lineTo(cx + 38, hy - 72);
    ctx.lineTo(cx + 52, hy - 86); ctx.lineTo(cx + 46, hy - 64); ctx.quadraticCurveTo(cx + 76, hy - 52, cx + 74, hy - 12);
    ctx.quadraticCurveTo(cx + 30, hy - 28, cx, hy - 26); ctx.quadraticCurveTo(cx - 30, hy - 28, cx - 74, hy - 12);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(cx - 76, hy - 10); ctx.quadraticCurveTo(cx - 78, hy - 62, cx - 35, hy - 72);
    ctx.lineTo(cx - 20, hy - 84); ctx.lineTo(cx - 5, hy - 74); ctx.lineTo(cx + 10, hy - 86); ctx.lineTo(cx + 28, hy - 72);
    ctx.quadraticCurveTo(cx + 78, hy - 60, cx + 76, hy - 10);
    ctx.quadraticCurveTo(cx + 35, hy - 30, cx, hy - 28); ctx.quadraticCurveTo(cx - 35, hy - 30, cx - 76, hy - 10);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  // cheeks
  ctx.fillStyle = "rgba(255,150,150,0.2)";
  ctx.beginPath(); ctx.ellipse(cx - 42, hy + 12, 14, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 42, hy + 12, 14, 9, 0, 0, Math.PI * 2); ctx.fill();
  // eyes
  const eyeY = hy - 2;
  const drawEye = (ex: number) => {
    ctx.fillStyle = "#fff"; ctx.strokeStyle = ink; line(3);
    ctx.beginPath(); ctx.ellipse(ex, eyeY, 14, 16, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#2a1f24"; ctx.beginPath(); ctx.ellipse(ex, eyeY + 1, 8.5, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(ex - 4, eyeY - 4, 3.5, 4, 0, 0, Math.PI * 2); ctx.fill();
  };
  drawEye(cx - 24); drawEye(cx + 24);
  line(4); ctx.strokeStyle = ink;
  const brow = opts.mood === "surprised" ? -3 : 0;
  ctx.beginPath(); ctx.moveTo(cx - 38, hy - 24 + brow); ctx.quadraticCurveTo(cx - 24, hy - 30 + brow, cx - 10, hy - 24 + brow); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 10, hy - 24 + brow); ctx.quadraticCurveTo(cx + 24, hy - 30 + brow, cx + 38, hy - 24 + brow); ctx.stroke();
  line(3.5); ctx.beginPath();
  if (opts.mood === "sing") { ctx.ellipse(cx, hy + 34, 9, 6, 0, 0, Math.PI * 2); ctx.stroke(); }
  else if (opts.mood === "surprised") { ctx.ellipse(cx, hy + 34, 8, 7, 0, 0, Math.PI * 2); ctx.stroke(); }
  else if (opts.mood === "happy") { ctx.arc(cx, hy + 30, 11, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); }
  else { ctx.moveTo(cx - 9, hy + 33); ctx.quadraticCurveTo(cx, hy + 37, cx + 9, hy + 33); ctx.stroke(); }
}

function drawEmily(ctx: CanvasRenderingContext2D, w: number, h: number, mood: "soft" | "focus" | "sing" | "surprised" | "happy" = "soft") {
  drawChibiBase(ctx, w, h, { skin: "#f2c9a7", hair: "#e7c66a", shirt: YELLOW, pants: "#2b2d33", hairStyle: "long", mood });
  // yellow outfit detail (consistent identity)
  const cx = w * 0.5, by = h * 0.93; const ink = "#1b1820";
  ctx.strokeStyle = ink; ctx.lineWidth = 4; ctx.strokeStyle = YELLOW_DARK;
  ctx.beginPath(); ctx.moveTo(cx - 20, by - 170); ctx.lineTo(cx, by - 140); ctx.lineTo(cx + 20, by - 170); ctx.stroke();
  ctx.strokeStyle = ink;
}

function drawMike(ctx: CanvasRenderingContext2D, w: number, h: number, mood: "soft" | "focus" | "surprised" = "soft") {
  drawChibiBase(ctx, w, h, { skin: "#efc39b", hair: "#c23b3b", shirt: "#3b4a66", pants: "#30323a", hairStyle: "cap", mood });
}
function drawJoe(ctx: CanvasRenderingContext2D, w: number, h: number) {
  drawChibiBase(ctx, w, h, { skin: "#f0c8a0", hair: "#1f1a17", shirt: "#2f2f35", pants: "#25262b", hairStyle: "short", mood: "focus" });
}
function drawDave(ctx: CanvasRenderingContext2D, w: number, h: number) {
  drawChibiBase(ctx, w, h, { skin: "#efc39b", hair: "#5a4636", shirt: "#4a5568", pants: "#2f323a", hairStyle: "short", mood: "soft" });
}

const Card: React.FC<{ tex: THREE.Texture; pos: [number, number, number]; scale?: number | [number, number, number]; rot?: [number, number, number]; opacity?: number }> = ({ tex, pos, scale = 1, rot = [0, 0, 0], opacity = 1 }) => (
  <mesh position={pos} rotation={rot} scale={scale as any} layers={NOINK}><planeGeometry args={[2.2, 3.3]} /><meshBasicMaterial map={tex} transparent alphaTest={0.05} side={THREE.DoubleSide} opacity={opacity} /></mesh>
);
const Label3D: React.FC<{ text: string; pos: [number, number, number]; color?: string; bg?: string; w?: number; h?: number; scale?: number }> = ({ text, pos, color = "#fff", bg = "rgba(0,0,0,0.45)", w = 860, h = 128, scale = 1 }) => {
  const tex = useMemo(() => makeTex((ctx, W, H) => { ctx.clearRect(0, 0, W, H); ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(20, 20, W - 40, H - 40, 20); ctx.fill(); ctx.fillStyle = color; ctx.font = "bold 44px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(text, W / 2, H / 2); }, w, h), [text, color, bg, w, h]);
  return <Card tex={tex} pos={pos} scale={[scale * 2.4, scale * 0.55, 1] as any} />;
};
const BoxProp: React.FC<{ pos: [number, number, number]; args: [number, number, number]; color: string; rot?: [number, number, number] }> = ({ pos, args, color, rot = [0, 0, 0] }) => (<mesh position={pos} rotation={rot} castShadow receiveShadow><boxGeometry args={args} /><meshLambertMaterial color={color} /></mesh>);
const Cyl: React.FC<{ pos: [number, number, number]; args: [number, number, number, number?]; color: string; rot?: [number, number, number] }> = ({ pos, args, color, rot = [0, 0, 0] }) => (<mesh position={pos} rotation={rot} castShadow receiveShadow><cylinderGeometry args={args} /><meshLambertMaterial color={color} /></mesh>);
const MicStand: React.FC<{ pos: [number, number, number] }> = ({ pos }) => (<group position={pos}><Cyl pos={[0, 0.9, 0]} args={[0.03, 0.03, 1.8, 12]} color="#222" /><Cyl pos={[0, 0.02, 0]} args={[0.22, 0.25, 0.04, 16]} color="#1a1a1a" /><mesh position={[0, 1.85, 0.08]} rotation={[Math.PI / 2, 0, 0]} castShadow><sphereGeometry args={[0.09, 16, 16]} /><meshLambertMaterial color="#9aa0a6" /></mesh></group>);
const StudioDesk: React.FC<{ pos: [number, number, number] }> = ({ pos }) => (<group position={pos}><BoxProp pos={[0, 0.45, 0]} args={[2.4, 0.08, 0.9]} color="#3a2a20" /><BoxProp pos={[-1.05, 0.22, 0]} args={[0.08, 0.44, 0.8]} color="#2e2118" /><BoxProp pos={[1.05, 0.22, 0]} args={[0.08, 0.44, 0.8]} color="#2e2118" /><BoxProp pos={[0.2, 0.62, -0.15]} args={[0.9, 0.22, 0.35]} color="#1f232b" /></group>);
const KeyboardProp: React.FC<{ pos: [number, number, number] }> = ({ pos }) => (<group position={pos}><BoxProp pos={[0, 0, 0]} args={[1.2, 0.08, 0.35]} color="#22262f" /><BoxProp pos={[0, 0.05, 0]} args={[1.05, 0.02, 0.22]} color="#f0f0f0" /></group>);

const World: React.FC<{ time: number }> = ({ time }) => {
  const { id, local, dur } = segInfo(time);
  const p = smooth(local / dur);
  const emily = useMemo(() => makeTex((c, w, h) => drawEmily(c, w, h, id === "voiceFit" || id === "part" || id === "newEra" ? "sing" : id === "invite" ? "surprised" : id === "cta" ? "happy" : "soft"), 512, 768), [id]);
  const mike = useMemo(() => makeTex((c, w, h) => drawMike(c, w, h, id === "voiceFit" ? "focus" : id === "mikeSurprise" ? "surprised" : "soft"), 512, 768), [id]);
  const joe = useMemo(() => makeTex((c, w, h) => drawJoe(c, w, h), 512, 768), []);
  const dave = useMemo(() => makeTex((c, w, h) => drawDave(c, w, h), 512, 768), []);
  useEffect(() => () => { emily.dispose(); }, [emily]);
  useEffect(() => () => { mike.dispose(); }, [mike]);

  const bg = id === "hook" ? "#10183a" : id === "2019" || id === "notTest" ? "#1b1a33" : id === "explore" ? "#182238" : id === "voiceFit" ? "#141a30" : id === "joeAsk" || id === "mikeSurprise" ? "#171d30" : "#121a2e";
  return (
    <group>
      <color attach="background" args={[bg]} />
      <fog attach="fog" args={[bg, 8, 30]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 7, 4]} intensity={1.15} color="#fff0d8" />
      <directionalLight position={[-4, 4, -2]} intensity={0.45} color="#7cc0ff" />
      <pointLight position={[0, 3.2, 2]} intensity={1.4} color={YELLOW} distance={10} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow><planeGeometry args={[40, 40]} /><meshLambertMaterial color="#23293a" /></mesh>
      <mesh position={[0, 3.2, -6]} receiveShadow><planeGeometry args={[20, 8]} /><meshLambertMaterial color="#1d2436" /></mesh>

      {id === "hook" && (<group>
        <Card tex={emily} pos={[0, 1.58, 0.2]} scale={1.0} />
        <MicStand pos={[0.9, 0, -0.5]} />
        <Label3D text="NÃO FOI UMA AUDIÇÃO" pos={[0, 3.45, -2.3]} color={YELLOW} />
      </group>)}

      {id === "origin" && (<group>
        <Card tex={emily} pos={[0.8, 1.5, -0.5]} scale={0.9} />
        <Card tex={mike} pos={[-0.2, 1.5, 0.1]} scale={0.9} />
        <Card tex={joe} pos={[-1.2, 1.45, -0.9]} scale={0.85} />
        <StudioDesk pos={[0, 0, -1.6]} />
        <Label3D text="UMA IDEIA DE JOE HAHN" pos={[0, 3.45, -2.4]} color="#7fd4ff" />
      </group>)}

      {id === "2019" && (<group>
        <StudioDesk pos={[0, 0, -1.5]} />
        <KeyboardProp pos={[0.1, 0.55, -1.4]} />
        <Card tex={mike} pos={[-0.8, 1.5, 0.1]} scale={0.92} />
        <Card tex={emily} pos={[0.8, 1.5, -0.5]} scale={0.92} />
        <Label3D text="2019" pos={[0, 3.45, -2.3]} color={YELLOW} />
      </group>)}

      {id === "notTest" && (<group>
        <StudioDesk pos={[0, 0, -1.5]} />
        <KeyboardProp pos={[0.1, 0.55, -1.4]} />
        <MicStand pos={[1.4, 0, -0.8]} />
        <Card tex={mike} pos={[-0.8, 1.5, 0.1]} scale={0.92} />
        <Card tex={emily} pos={[0.8, 1.52, -0.4]} scale={0.92} />
        <Label3D text="ERAM SESSÕES DE COMPOSIÇÃO" pos={[0, 3.45, -2.4]} w={920} scale={0.72} color="#7fd4ff" />
      </group>)}

      {id === "explore" && (<group>
        <StudioDesk pos={[-0.2, 0, -1.7]} />
        <KeyboardProp pos={[0, 0.55, -1.6]} />
        <Card tex={mike} pos={[-1.0, 1.48, -0.2]} scale={0.88} />
        <Card tex={joe} pos={[0.2, 1.45, -1.0]} scale={0.84} />
        <Card tex={dave} pos={[1.2, 1.45, -1.2]} scale={0.84} />
        <Label3D text="A BANDA ESTAVA RECOMEÇANDO" pos={[0, 3.45, -2.4]} w={920} scale={0.72} color="#ffffff" />
      </group>)}

      {id === "shift" && (<group>
        <Card tex={emily} pos={[0, 1.58, 0.2]} scale={1.0} />
        <MicStand pos={[0.8, 0, -0.5]} />
        <Label3D text="ALGO COMEÇOU A MUDAR" pos={[0, 3.45, -2.3]} color={YELLOW} />
      </group>)}

      {id === "voiceFit" && (<group>
        <MicStand pos={[0.9, 0, -0.5]} />
        <Card tex={emily} pos={[0.2, 1.58, 0.2]} scale={1.0} />
        <Card tex={mike} pos={[-1.1, 1.45, -0.9]} scale={0.88} />
        <Label3D text="A VOZ COMEÇOU A ENCAIXAR" pos={[0, 3.45, -2.4]} w={920} scale={0.72} color={YELLOW} />
      </group>)}

      {id === "turning" && (<group>
        <StudioDesk pos={[0, 0, -1.6]} />
        <Card tex={mike} pos={[-0.8, 1.48, 0.0]} scale={0.9} />
        <Card tex={joe} pos={[0.8, 1.48, -0.6]} scale={0.9} />
        <Label3D text="A VIRADA NO ESTÚDIO" pos={[0, 3.45, -2.3]} color="#7fd4ff" />
      </group>)}

      {id === "joeAsk" && (<group>
        <StudioDesk pos={[0, 0, -1.6]} />
        <Card tex={mike} pos={[-1.0, 1.48, -0.1]} scale={0.88} />
        <Card tex={joe} pos={[0, 1.48, -0.7]} scale={0.88} />
        <Card tex={dave} pos={[1.0, 1.45, -1.1]} scale={0.84} />
        <Card tex={emily} pos={[0.6, 1.45, -2.0]} scale={0.75} />
        <Label3D text="E SE ELA CANTASSE A MÚSICA INTEIRA?" pos={[0, 3.45, -2.4]} w={980} scale={0.66} color="#ffd166" />
      </group>)}

      {id === "mikeSurprise" && (<group>
        <StudioDesk pos={[0, 0, -1.6]} />
        <Card tex={mike} pos={[-0.5, 1.52, 0.1]} scale={0.95} />
        <Card tex={joe} pos={[0.8, 1.46, -0.8]} scale={0.88} />
        <Label3D text="JOE TAMBÉM ACREDITOU" pos={[0, 3.45, -2.3]} color="#7fd4ff" />
      </group>)}

      {id === "part" && (<group>
        <MicStand pos={[0.8, 0, -0.5]} />
        <Card tex={emily} pos={[0.2, 1.58, 0.2]} scale={1.0} />
        <Card tex={mike} pos={[-1.0, 1.45, -0.9]} scale={0.86} />
        <Card tex={joe} pos={[1.4, 1.42, -1.2]} scale={0.82} />
        <Label3D text="A CONEXÃO VIROU MÚSICA" pos={[0, 3.45, -2.4]} color={YELLOW} />
      </group>)}

      {id === "invite" && (<group>
        <StudioDesk pos={[0, 0, -1.6]} />
        <Card tex={emily} pos={[0, 1.55, 0.2]} scale={1.0} />
        <Card tex={mike} pos={[-1.1, 1.45, -0.8]} scale={0.86} />
        <Label3D text="O CONVITE" pos={[0, 3.45, -2.3]} color={YELLOW} />
      </group>)}

      {id === "newEra" && (<group>
        <MicStand pos={[0.7, 0, -0.4]} />
        <Card tex={emily} pos={[0, 1.58, 0.2]} scale={1.02} />
        <Card tex={mike} pos={[-1.1, 1.45, -0.9]} scale={0.88} />
        <pointLight position={[-2.5, 4, 2]} intensity={1.8} color="#4da6ff" distance={12} />
        <pointLight position={[2.5, 4, 2]} intensity={1.8} color="#ff4d8d" distance={12} />
        <Label3D text="UMA NOVA FASE" pos={[0, 3.45, -2.3]} color="#ffffff" />
      </group>)}

      {id === "notAudition" && (<group>
        <Card tex={emily} pos={[0.4, 1.55, 0.1]} scale={0.98} />
        <Card tex={mike} pos={[-0.8, 1.48, -0.7]} scale={0.9} />
        <Label3D text="NÃO FOI UMA AUDIÇÃO COMUM" pos={[0, 3.45, -2.4]} w={920} scale={0.72} color={YELLOW} />
      </group>)}

      {id === "cta" && (<group>
        <Card tex={emily} pos={[0, 1.58, 0.2]} scale={1.02} />
        <MicStand pos={[0.8, 0, -0.5]} />
        <Label3D text="EMILY COMBINA COM O LINKIN PARK?" pos={[0, 3.45, -2.4]} w={960} scale={0.68} color={YELLOW} />
      </group>)}
    </group>
  );
};

const CameraAndPost: React.FC<{ time: number }> = ({ time }) => {
  const { camera, scene } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  const { id, local, dur } = segInfo(time);
  const p = smooth(local / dur);
  const pos = new THREE.Vector3(); const look = new THREE.Vector3();
  // centered, pulled back for 9:16
  pos.set(0, 1.82, 5.4 - p * 0.25);
  look.set(0, 1.55, -0.2);
  if (id === "joeAsk") { pos.set(0, 1.85, 5.8 - p * 0.2); look.set(0, 1.5, -0.6); }
  if (id === "explore") { pos.set(0, 1.85, 5.8 - p * 0.2); look.set(0, 1.5, -0.6); }
  cam.position.copy(pos); cam.lookAt(look); cam.fov = 44; cam.near = 0.1; cam.far = 100; cam.updateProjectionMatrix();

  const fx = useMemo(() => ({
    ink: new InkPass(scene, cam, { strength: 0.82, widthNear: 4.2, widthFar: 2.6 }),
    lens: new LensBlur({ maxCoC: 18, nearScale: 1.1 }),
    bloom: makeBloom(),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(GRADES.day, GRADE_STRENGTH.day),
  }), [scene, cam]);
  useEffect(() => () => fx.ink.dispose(), [fx]);
  fx.lens.focus = Math.max(0.5, pos.distanceTo(new THREE.Vector3(0, 1.55, 0)));
  fx.lens.cInf = 4.8;
  const golden = id === "newEra" || id === "cta";
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
    { start: 0.2, end: 4.5, text: "NÃO FOI UMA AUDIÇÃO", color: YELLOW },
    { start: 6.6, end: 8.4, text: "UMA IDEIA DE JOE HAHN", color: "#7fd4ff" },
    { start: 9.5, end: 12.0, text: "2019", color: YELLOW },
    { start: 17.2, end: 21.0, text: "ERAM SESSÕES DE COMPOSIÇÃO", color: "#7fd4ff" },
    { start: 23.9, end: 27.5, text: "A BANDA ESTAVA RECOMEÇANDO", color: "#ffffff" },
    { start: 33.3, end: 38.0, text: "A VOZ COMEÇOU A ENCAIXAR", color: YELLOW },
    { start: 45.1, end: 49.5, text: "E SE ELA CANTASSE A MÚSICA INTEIRA?", color: "#ffd166" },
    { start: 52.2, end: 56.0, text: "JOE TAMBÉM ACREDITOU", color: "#7fd4ff" },
    { start: 58.9, end: 63.0, text: "A CONEXÃO VIROU MÚSICA", color: YELLOW },
    { start: 65.8, end: 69.0, text: "O CONVITE", color: YELLOW },
    { start: 69.8, end: 74.0, text: "UMA NOVA FASE", color: "#ffffff" },
    { start: 82.0, end: 87.3, text: "EMILY COMBINA COM O LINKIN PARK?", color: YELLOW },
  ];
  const active = items.find((it) => t >= it.start && t < it.end);
  if (!active) return null;
  const local = (t - active.start) / Math.max(0.001, active.end - active.start);
  const opacity = local < 0.1 ? local / 0.1 : local > 0.85 ? (1 - local) / 0.15 : 1;
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 230, pointerEvents: "none" }}>
      <div style={{ opacity, transform: `translateY(${interpolate(local, [0, 1], [18, 0])}px)`, color: active.color, fontFamily: "Arial Black, Arial, sans-serif", fontSize: 48, lineHeight: 1.12, textAlign: "center", padding: "16px 28px", maxWidth: 940, textShadow: "0 4px 18px rgba(0,0,0,0.85)" }}>{active.text}</div>
    </AbsoluteFill>
  );
};

export const EmilyArmstrongLinkinParkOriginShort: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0b1020" }}>
      <ThreeCanvas width={1080} height={1920} camera={{ fov: 44, position: [0, 1.8, 5.4], near: 0.1, far: 100 }} gl={{ antialias: false, stencil: false, powerPreference: "high-performance", toneMappingExposure: 1.0 }}>
        <SceneRoot />
      </ThreeCanvas>
      <OverlayText />
      <Audio src={staticFile("emily-armstrong-linkin-park-origin/voice.wav")} />
    </AbsoluteFill>
  );
};
