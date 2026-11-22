import React, { useMemo, useEffect, Suspense } from "react";
import * as THREE from "three";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree, useLoader } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { InkPass, noInkFallback, NOINK } from "../jimi3d/ink";
import { LensBlur } from "../jimi3d/lensblur";
import { GradeEffect, GRADES, GRADE_STRENGTH } from "../jimi3d/grade";

export const QUEEN_FPS = 30;
export const QUEEN_TOTAL_DUR = 83.5; // voice ~80.7s + visual tail
export const QUEEN_FRAMES = Math.ceil(QUEEN_TOTAL_DUR * QUEEN_FPS);

type SceneId = "backstage" | "buildup" | "fail" | "eureka" | "command" | "stomp" | "vibration" | "conclusion" | "cta";

const SCENES: { id: SceneId; a: number; b: number }[] = [
  { id: "backstage",  a: 0.0,   b: 6.843 },   // hook
  { id: "buildup",    a: 6.793, b: 18.472 },  // origem/1977/estádio 80k
  { id: "fail",       a: 18.472,b: 29.733 },  // som falhou/silêncio
  { id: "eureka",     a: 29.733,b: 43.495 },  // estalo/corpo instrumento
  { id: "command",    a: 43.495,b: 51.03 },   // convocação pés/palma
  { id: "stomp",      a: 51.03, b: 56.77 },   // Pisada,pisada,palma + simples/poderoso
  { id: "vibration",  a: 56.77, b: 63.159 },  // vibração intensa
  { id: "conclusion", a: 63.159,b: 73.067 },  // conclusão conexão sem tecnologia
  { id: "cta",        a: 73.067,b: 83.5 },    // CTA final + tail
];

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (t: number) => { const u = clamp01(t); return u * u * (3 - 2 * u); };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const sceneInfo = (time: number) => {
  for (let i = 0; i < SCENES.length; i++) {
    const s = SCENES[i];
    if (time >= s.a && time < s.b) return { ...s, local: time - s.a, dur: Math.max(0.001, s.b - s.a), idx: i };
  }
  const last = SCENES[SCENES.length - 1];
  return { ...last, local: Math.max(0, time - last.a), dur: Math.max(0.001, last.b - last.a), idx: SCENES.length - 1 };
};

const useTex = (name: string) => {
  const tex = useLoader(THREE.TextureLoader, staticFile(`queen-stadium/${name}`));
  useEffect(() => { tex.colorSpace = THREE.SRGBColorSpace; tex.needsUpdate = true; }, [tex]);
  return tex;
};

const Sprite: React.FC<{ tex: THREE.Texture; pos: [number, number, number]; size: [number, number]; opacity?: number; tilt?: number; bob?: number }> = ({ tex, pos, size, opacity = 1, tilt = 0, bob = 0 }) => (
  <mesh position={[pos[0], pos[1] + bob, pos[2]]} rotation={[0, 0, tilt]} layers={NOINK}>
    <planeGeometry args={size} />
    <meshBasicMaterial map={tex} transparent alphaTest={0.04} opacity={opacity} side={THREE.DoubleSide} toneMapped={false} />
  </mesh>
);

const Freddie: React.FC<{ pos: [number, number, number]; scale?: number; tilt?: number; expr: "confident" | "worried" | "eureka" | "triumph"; bob?: number; opacity?: number }> = ({ pos, scale = 1, tilt = 0, expr, bob = 0, opacity = 1 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const tConf = useTex("freddie_confident.png");
  const tWor = useTex("freddie_worried.png");
  const tEur = useTex("freddie_eureka.png");
  const tTri = useTex("freddie_triumph.png");
  const tex = expr === "worried" ? tWor : expr === "eureka" ? tEur : expr === "triumph" ? tTri : tConf;
  const breath = 1 + 0.012 * Math.sin(t * Math.PI * 1.4);
  const s = scale * breath;
  return <Sprite tex={tex} pos={pos} size={[2.6 * s, 3.6 * s]} tilt={tilt} bob={bob} opacity={opacity} />;
};

const BandMember: React.FC<{ name: "brian" | "roger" | "john"; pos: [number, number, number]; scale?: number; bob?: number; tilt?: number; opacity?: number }> = ({ name, pos, scale = 1, bob = 0, tilt = 0, opacity = 1 }) => {
  const tex = useTex(`${name}.png`);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const b = bob + Math.sin(t * 2.2 + (name === "brian" ? 0 : name === "roger" ? 1.5 : 3)) * 0.015;
  const size: [number, number] = name === "roger" ? [2.5 * scale, 3.4 * scale] : [2.4 * scale, 3.4 * scale];
  return <Sprite tex={tex} pos={pos} size={size} tilt={tilt} bob={b} opacity={opacity} />;
};

type CrowdMode = "tense" | "react" | "stomp" | "delirium" | "soft";

const CrowdLayer: React.FC<{ count: number; yBase: number; z: number; spreadX: number; scaleBase: number; depthJitter: number; mode: CrowdMode; color: string; opacity?: number }> = ({ count, yBase, z, spreadX, scaleBase, depthJitter, mode, color, opacity = 0.95 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const items = useMemo(() => Array.from({ length: count }, (_, i) => {
    const x = (Math.random() - 0.5) * spreadX;
    const h = 0.35 + Math.random() * 0.35;
    const w = 0.16 + Math.random() * 0.12;
    const ph = Math.random() * Math.PI * 2;
    const dz = (Math.random() - 0.5) * depthJitter;
    return { x, h, w, ph, dz, arm: Math.random() > 0.5 };
  }), [count, spreadX, depthJitter]);

  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 64; c.height = 128;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0,0,64,128);
    ctx.fillStyle = "#ffffff";
    // head
    ctx.beginPath(); ctx.ellipse(32, 22, 10, 12, 0, 0, Math.PI*2); ctx.fill();
    // body
    ctx.beginPath(); ctx.moveTo(12,128); ctx.lineTo(16,48); ctx.quadraticCurveTo(20,30,32,28); ctx.quadraticCurveTo(44,30,48,48); ctx.lineTo(52,128); ctx.closePath(); ctx.fill();
    // arms up hint
    ctx.fillRect(6, 44, 8, 28);
    ctx.fillRect(50, 44, 8, 28);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true; return t;
  }, []);
  useEffect(() => () => tex.dispose(), [tex]);

  let amp = 0.02, speed = 1.2, armsUp = 0.1;
  if (mode === "tense") { amp = 0.005; speed = 0.6; armsUp = 0.0; }
  else if (mode === "react") { amp = 0.04; speed = 2.0; armsUp = 0.25; }
  else if (mode === "stomp") { amp = 0.09; speed = 4.2; armsUp = 0.7; }
  else if (mode === "delirium") { amp = 0.11; speed = 5.0; armsUp = 0.95; }
  else if (mode === "soft") { amp = 0.03; speed = 1.2; armsUp = 0.5; }

  // stomp beat pulse aligned roughly to 51.03 start (visual)
  const stompBeat = mode === "stomp" ? Math.max(0, Math.sin((t - 51.03) * Math.PI * 2 / 0.95)) : 0;

  return (
    <group position={[0, yBase, z]}>
      {items.map((it, i) => {
        const bounce = Math.abs(Math.sin(t * speed + it.ph)) * amp + stompBeat * 0.03;
        const armLift = it.arm ? armsUp * (0.6 + 0.4 * Math.sin(t * speed * 0.9 + it.ph)) : armsUp * 0.3;
        const sc = scaleBase;
        return (
          <mesh key={i} position={[it.x, bounce + armLift * 0.08, it.dz]} scale={[sc, sc * (1 + armLift * 0.15), sc]} layers={NOINK}>
            <planeGeometry args={[it.w, it.h]} />
            <meshBasicMaterial map={tex} transparent opacity={opacity} color={color} toneMapped={false} />
          </mesh>
        );
      })}
    </group>
  );
};

const CrowdMass: React.FC<{ mode: CrowdMode; golden?: boolean }> = ({ mode, golden = false }) => {
  const base = golden ? "#1f150b" : "#0d0b12";
  const mid = golden ? "#2a1c10" : "#14121c";
  const back = golden ? "#332313" : "#191724";
  return (
    <group>
      {/* front floor crowd */}
      <CrowdLayer count={70} yBase={0.05} z={-2.2} spreadX={14} scaleBase={1.0} depthJitter={0.5} mode={mode} color={base} opacity={0.9} />
      {/* mid stands */}
      <CrowdLayer count={90} yBase={0.6} z={-4.5} spreadX={16} scaleBase={0.95} depthJitter={0.6} mode={mode} color={mid} opacity={0.88} />
      <CrowdLayer count={90} yBase={1.1} z={-6.0} spreadX={18} scaleBase={0.9} depthJitter={0.7} mode={mode} color={mid} opacity={0.85} />
      {/* upper stands/back mass */}
      <CrowdLayer count={80} yBase={1.8} z={-7.5} spreadX={20} scaleBase={0.85} depthJitter={0.8} mode={mode} color={back} opacity={0.8} />
      <CrowdLayer count={70} yBase={2.4} z={-8.8} spreadX={22} scaleBase={0.8} depthJitter={0.9} mode={mode} color={back} opacity={0.75} />
    </group>
  );
};

const StageBase: React.FC<{ golden?: boolean; fail?: boolean }> = ({ golden = false, fail = false }) => {
  const floor = golden ? "#2a1e12" : fail ? "#0e0c14" : "#15121d";
  const wall = golden ? "#3a2818" : fail ? "#12101a" : "#181424";
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}><planeGeometry args={[36, 36]} /><meshLambertMaterial color={floor} /></mesh>
      {/* riser */}
      <mesh position={[0, 0.28, -1.2]}><boxGeometry args={[9.5, 0.56, 3.2]} /><meshLambertMaterial color={golden ? "#3b2a18" : "#1d1826"} /></mesh>
      {/* back wall / stands structures */}
      <mesh position={[0, 3.8, -10.5]}><boxGeometry args={[28, 9, 0.5]} /><meshLambertMaterial color={wall} /></mesh>
      <mesh position={[-11, 3.2, -6.5]} rotation={[0, 0.42, 0]}><boxGeometry args={[12, 8, 0.5]} /><meshLambertMaterial color={wall} /></mesh>
      <mesh position={[11, 3.2, -6.5]} rotation={[0, -0.42, 0]}><boxGeometry args={[12, 8, 0.5]} /><meshLambertMaterial color={wall} /></mesh>
      {/* stand tiers */}
      <mesh position={[0, 1.2, -5.2]}><boxGeometry args={[20, 0.4, 1.2]} /><meshLambertMaterial color={wall} /></mesh>
      <mesh position={[0, 1.9, -6.6]}><boxGeometry args={[22, 0.4, 1.2]} /><meshLambertMaterial color={wall} /></mesh>
      <mesh position={[0, 2.6, -8.0]}><boxGeometry args={[24, 0.4, 1.2]} /><meshLambertMaterial color={wall} /></mesh>
      {/* amps and cables */}
      <mesh position={[-3.8, 0.8, -1.8]}><boxGeometry args={[0.9, 0.9, 0.7]} /><meshLambertMaterial color="#1a1a1e" /></mesh>
      <mesh position={[3.8, 0.8, -1.8]}><boxGeometry args={[0.9, 0.9, 0.7]} /><meshLambertMaterial color="#1a1a1e" /></mesh>
      <mesh position={[-2.2, 0.65, -0.6]}><boxGeometry args={[1.2, 0.2, 0.15]} /><meshLambertMaterial color="#222" /></mesh>
      <mesh position={[2.0, 0.65, -0.7]} rotation={[0,0.2,0]}><boxGeometry args={[1.4, 0.15, 0.12]} /><meshLambertMaterial color="#222" /></mesh>
      {/* mic stand (center) */}
      <mesh position={[0, 1.2, -0.6]}><cylinderGeometry args={[0.03,0.03,2.0,8]} /><meshLambertMaterial color="#7a7a80" /></mesh>
      <mesh position={[0, 2.2, -0.6]}><sphereGeometry args={[0.12,12,12]} /><meshLambertMaterial color="#cfcfd8" /></mesh>
    </group>
  );
};

const BackstageSet: React.FC = () => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}><planeGeometry args={[16, 16]} /><meshLambertMaterial color="#181420" /></mesh>
    <mesh position={[0, 2.4, -3.8]}><boxGeometry args={[12, 5, 0.3]} /><meshLambertMaterial color="#201833" /></mesh>
    <mesh position={[-5.8, 2.4, -0.8]} rotation={[0, Math.PI / 2, 0]}><boxGeometry args={[8, 5, 0.3]} /><meshLambertMaterial color="#1a1528" /></mesh>
    <mesh position={[5.8, 2.4, -0.8]} rotation={[0, -Math.PI / 2, 0]}><boxGeometry args={[8, 5, 0.3]} /><meshLambertMaterial color="#1a1528" /></mesh>
    <mesh position={[0, 4.6, 0]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[12, 10]} /><meshLambertMaterial color="#241c34" /></mesh>
    {/* mirror with lights */}
    <mesh position={[2.2, 2.1, -3.6]}><boxGeometry args={[1.6, 2.2, 0.1]} /><meshLambertMaterial color="#2a2a38" /></mesh>
    <mesh position={[2.2, 2.1, -3.54]}><planeGeometry args={[1.3, 1.9]} /><meshBasicMaterial color="#8890b0" transparent opacity={0.5} /></mesh>
    {[[-0.55,-0.85],[0.55,-0.85],[-0.55,0],[0.55,0],[-0.55,0.85],[0.55,0.85]].map((p,i)=>(
      <mesh key={i} position={[2.2+p[0],2.1+p[1],-3.5]}><sphereGeometry args={[0.07,10,10]} /><meshBasicMaterial color="#ffe7a8" /></mesh>
    ))}
    {/* table with objects */}
    <mesh position={[-2.4, 0.6, -2.6]}><boxGeometry args={[1.8, 0.1, 0.8]} /><meshLambertMaterial color="#3a2d24" /></mesh>
    <mesh position={[-3.1, 0.3, -2.6]}><boxGeometry args={[0.08,0.6,0.08]} /><meshLambertMaterial color="#2a201a" /></mesh>
    <mesh position={[-1.7, 0.3, -2.6]}><boxGeometry args={[0.08,0.6,0.08]} /><meshLambertMaterial color="#2a201a" /></mesh>
    <mesh position={[-2.1, 0.75, -2.5]}><cylinderGeometry args={[0.08,0.08,0.25,8]} /><meshLambertMaterial color="#6ab0d8" /></mesh>
    <mesh position={[-2.6, 0.72, -2.7]}><boxGeometry args={[0.35,0.06,0.25]} /><meshLambertMaterial color="#e8e2d8" /></mesh>
    {/* clothes rack */}
    <mesh position={[-4.2, 1.4, -2.8]}><cylinderGeometry args={[0.04,0.04,2.8,8]} /><meshLambertMaterial color="#555" /></mesh>
    <mesh position={[-4.2, 2.8, -2.4]}><boxGeometry args={[0.1,0.1,1.2]} /><meshLambertMaterial color="#555" /></mesh>
    <mesh position={[-4.2, 2.0, -2.2]}><boxGeometry args={[0.6,1.2,0.2]} /><meshLambertMaterial color="#4a3a5a" /></mesh>
    {/* neon lights */}
    <mesh position={[-2.5, 3.3, -3.6]}><boxGeometry args={[2.0, 0.08, 0.08]} /><meshBasicMaterial color="#7a5cff" /></mesh>
    <mesh position={[2.5, 3.5, -3.6]}><boxGeometry args={[2.0, 0.08, 0.08]} /><meshBasicMaterial color="#4cc8ff" /></mesh>
    <pointLight position={[-2.5, 3.0, -2.8]} intensity={1.5} color="#7a5cff" distance={9} />
    <pointLight position={[2.5, 3.1, -2.8]} intensity={1.3} color="#4cc8ff" distance={9} />
  </group>
);

const Spotlights: React.FC<{ on: boolean; golden: boolean; flicker?: number }> = ({ on, golden, flicker = 0 }) => {
  const color = golden ? "#ffd36b" : "#dfe8ff";
  const op = on ? (golden ? 0.1 : 0.06) : 0.01 + flicker * 0.03;
  const i = on ? (golden ? 2.2 : 1.2) : 0.2 + flicker * 0.4;
  return (
    <group>
      <mesh position={[-2.6, 4.6, -4]} rotation={[0.2, 0.22, 0]}><planeGeometry args={[1.3, 8.5]} /><meshBasicMaterial color={color} transparent opacity={op} /></mesh>
      <mesh position={[2.6, 4.6, -4]} rotation={[0.2, -0.22, 0]}><planeGeometry args={[1.3, 8.5]} /><meshBasicMaterial color={color} transparent opacity={op} /></mesh>
      <mesh position={[0, 4.8, -4.5]} rotation={[0.15, 0, 0]}><planeGeometry args={[1.1, 8]} /><meshBasicMaterial color={golden ? "#ffb84d" : "#b8d0ff"} transparent opacity={op*0.8} /></mesh>
      <pointLight position={[0, 4.2, -1]} intensity={i} color={golden ? "#ffd080" : "#c8d8ff"} distance={14} />
    </group>
  );
};

const Lighters: React.FC<{ active: boolean }> = ({ active }) => {
  const pts = useMemo(() => Array.from({ length: 50 }, () => ({
    x: (Math.random()-0.5)*16, y: 1.0+Math.random()*2.2, z: -4 - Math.random()*4.5, ph: Math.random()*Math.PI*2
  })), []);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  if (!active) return null;
  return <group>{pts.map((p,i)=>{
    const o = 0.3 + 0.7*Math.abs(Math.sin(t*2.5 + p.ph));
    return <mesh key={i} position={[p.x,p.y,p.z]} layers={NOINK}><sphereGeometry args={[0.05,6,6]} /><meshBasicMaterial color="#ffd37a" transparent opacity={o} toneMapped={false} /></mesh>;
  })}</group>;
};

const Particles: React.FC = () => {
  const pts = useMemo(() => Array.from({ length: 40 }, () => ({ x:(Math.random()-0.5)*6, y:0.5+Math.random()*3, z:-1+Math.random()*2, ph:Math.random()*Math.PI*2, sp:0.2+Math.random()*0.4 })), []);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  return <group>{pts.map((p,i)=>{
    const y = p.y + Math.sin(t*p.sp + p.ph)*0.2;
    const o = 0.15 + 0.25*Math.abs(Math.sin(t*0.8 + p.ph));
    return <mesh key={i} position={[p.x,y,p.z]} layers={NOINK}><sphereGeometry args={[0.03,6,6]} /><meshBasicMaterial color="#ffe6a8" transparent opacity={o} toneMapped={false} /></mesh>;
  })}</group>;
};

const World: React.FC<{ time: number }> = ({ time }) => {
  const { id, local, dur } = sceneInfo(time);
  const p = smooth(local / dur);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = time;

  const inStadium = id !== "backstage" && id !== "cta"; // cta can show stadium bg faint, but checklist: cena 8 fundo dourado com particulas; stadium/crowd visible vibrando ao fundo
  const showBandOnStage = id === "buildup" || id === "fail" || id === "eureka" || id === "command" || id === "stomp" || id === "vibration" || id === "conclusion";
  const showCrowd = id === "buildup" || id === "fail" || id === "eureka" || id === "command" || id === "stomp" || id === "vibration" || id === "conclusion" || id === "cta";

  let crowdMode: CrowdMode = "soft";
  if (id === "fail" || (id === "eureka" && local < dur*0.4)) crowdMode = "tense";
  else if (id === "eureka" || id === "command") crowdMode = "react";
  else if (id === "stomp") crowdMode = "stomp";
  else if (id === "vibration") crowdMode = "delirium";

  let fExpr: "confident" | "worried" | "eureka" | "triumph" = "confident";
  if (id === "fail") fExpr = "worried";
  else if (id === "eureka") fExpr = local < dur*0.35 ? "worried" : "eureka";
  else if (id === "command") fExpr = "eureka";
  else if (id === "stomp" || id === "vibration" || id === "conclusion" || id === "cta") fExpr = "triumph";

  const golden = id === "stomp" || id === "vibration" || id === "conclusion" || id === "cta";
  const purple = id === "backstage";
  const dark = id === "fail";
  const sky = golden ? "#2a1a0e" : purple ? "#120e22" : dark ? "#070710" : "#0d0b18";
  const fogC = golden ? "#4a3018" : purple ? "#241a40" : dark ? "#101020" : "#1a1830";

  // Freddie acting/position (offset so he never blocks other band members; no character occludes another)
  let fPos: [number, number, number] = [-0.6, 1.5, -0.6];
  let fScale = 1.0; let fTilt = 0; let fBob = 0;
  if (id === "backstage") {
    fPos = [0.0, 1.45, 0.2]; fScale = 1.05; fTilt = 0.02 + Math.sin(t * 0.8) * 0.02; // solo in dressing room
  } else if (id === "buildup") {
    fPos = [-0.6, 1.55, -0.6]; fScale = 0.98; fTilt = Math.sin(t * 1.2) * 0.02;
  } else if (id === "fail") {
    fPos = [-0.5, 1.5, -0.55]; fScale = 1.0; fTilt = -0.03 + Math.sin(t * 1.5) * 0.02; fBob = Math.sin(t * 2) * 0.01;
  } else if (id === "eureka") {
    const k = clamp01((local - dur * 0.25) / (dur * 0.35));
    fPos = [-0.55, 1.55 + k * 0.04, -0.55]; fScale = 1.0 + k * 0.04; fTilt = -0.02 + k * 0.05; fBob = k * 0.02;
  } else if (id === "command") {
    fPos = [-0.5, 1.55, -0.5]; fScale = 1.02; fTilt = 0.04 + Math.sin(t * 3.5) * 0.04; fBob = Math.abs(Math.sin(t * 2.8)) * 0.04;
  } else if (id === "stomp") {
    const beat = Math.max(0, Math.sin((t - 51.03) * Math.PI * 2 / 0.95));
    fPos = [-0.55, 1.58 + beat * 0.05, -0.55]; fScale = 1.04 + beat * 0.03; fTilt = Math.sin(t * 4) * 0.03; fBob = beat * 0.05;
  } else if (id === "vibration") {
    fPos = [-0.6, 1.55, -0.55]; fScale = 1.02; fTilt = Math.sin(t * 2.5) * 0.03; fBob = Math.abs(Math.sin(t * 3)) * 0.04;
  } else if (id === "conclusion") {
    fPos = [-0.45, 1.55, -0.5]; fScale = 1.05; fTilt = Math.sin(t * 0.8) * 0.02;
  } else { // cta
    fPos = [-0.4, 1.55, -0.45]; fScale = 1.06; fTilt = Math.sin(t * 0.6) * 0.015;
  }

  // Band positions on stage (spread layout: John left, Freddie center-left, Brian right, Roger back-right elevated)
  // Roger is offset so he is never directly behind Freddie; all four remain visible in group shots.
  const bandY = 1.45;
  const brianPos: [number, number, number] = [2.5, bandY, -0.8];
  const rogerPos: [number, number, number] = [0.9, bandY + 0.35, -1.9]; // back/elevated, offset (not behind Freddie)
  const johnPos: [number, number, number] = [-2.5, bandY, -0.8];
  const bandScale = id === "conclusion" || id === "cta" ? 0.92 : 0.98;
  const bandBob = id === "stomp" || id === "vibration" ? Math.abs(Math.sin(t * 3)) * 0.04 : 0.01;
  const bandOpacity = (id === "conclusion") ? 0.85 : (id === "cta" ? 0.7 : 1);

  // In close-up Freddie scenes (eureka peak, conclusion close, cta close) band/crowd still present but can be behind/DOF - we keep them rendered
  const stageMode = golden ? "gold" : dark ? "fail" : "dark";

  return (
    <group>
      <color attach="background" args={[sky]} />
      <fog attach="fog" args={[fogC, 7, 28]} />

      <ambientLight intensity={golden ? 0.55 : purple ? 0.45 : dark ? 0.22 : 0.4} color={golden ? "#ffdcb0" : purple ? "#d6ccff" : "#c8d0ff"} />
      <directionalLight position={[4, 7, 4]} intensity={golden ? 1.7 : purple ? 1.0 : dark ? 0.45 : 1.1} color={golden ? "#ffe0a8" : purple ? "#b8a0ff" : "#dfe8ff"} />
      <directionalLight position={[-4, 4, -2]} intensity={golden ? 0.55 : 0.3} color={golden ? "#ff9a50" : "#8090ff"} />

      {id === "backstage" && <BackstageSet />}

      {id !== "backstage" && <StageBase golden={golden} fail={id === "fail"} />}
      {showCrowd && <CrowdMass mode={crowdMode} golden={golden} />}

      {id !== "backstage" && id !== "cta" && <Spotlights on={!(id === "fail")} golden={golden} flicker={id === "fail" ? (Math.sin(t*18)>0.3?1:0) : 0} />}
      {id === "cta" && <Spotlights on={true} golden={true} />}

      {/* Full band on stage for stadium scenes (3-8 mapped as buildup onward in stadium context): Brian, Roger, John always with Freddie */}
      {showBandOnStage && (
        <group>
          <BandMember name="brian" pos={brianPos} scale={bandScale} bob={bandBob} opacity={bandOpacity} />
          <BandMember name="roger" pos={rogerPos} scale={bandScale} bob={bandBob*0.8} opacity={bandOpacity} />
          <BandMember name="john" pos={johnPos} scale={bandScale} bob={bandBob} opacity={bandOpacity} />
        </group>
      )}

      {/* Freddie always */}
      <Suspense fallback={null}>
        <Freddie pos={fPos} scale={fScale} tilt={fTilt} expr={fExpr} bob={fBob} opacity={1} />
      </Suspense>

      {id === "vibration" && <Lighters active={true} />}
      {id === "cta" && <Lighters active={true} />}
      {(id === "conclusion" || id === "cta") && <Particles />}

      {/* dynamic lights */}
      {id === "stomp" && <>
        <pointLight position={[0, 4, 1]} intensity={2.4 + Math.sin(t*6)*0.5} color="#ffcc66" distance={12} />
        <pointLight position={[-3, 3, -1]} intensity={1.1} color="#ff6a3a" distance={10} />
        <pointLight position={[3, 3, -1]} intensity={1.1} color="#ffd36b" distance={10} />
      </>}
      {id === "vibration" && <pointLight position={[0, 4, 1]} intensity={2.6 + Math.sin(t*5)*0.4} color="#ffb050" distance={13} />}
      {(id === "conclusion" || id === "cta") && <pointLight position={[0, 3.5, 1]} intensity={1.9} color="#ffd080" distance={11} />}
      {id === "eureka" && <pointLight position={[0.3, 3.2, 0.5]} intensity={1.1 + p*0.8} color="#fff0c0" distance={9} />}
      {id === "fail" && <pointLight position={[0, 3, 0]} intensity={0.25} color="#6680aa" distance={8} />}
    </group>
  );
};

const CameraAndPost: React.FC<{ time: number }> = ({ time }) => {
  const { camera, scene } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  const { id, local, dur } = sceneInfo(time);
  const p = smooth(local / dur);
  const t = time;

  const pos = new THREE.Vector3();
  const look = new THREE.Vector3();

  if (id === "backstage") {
    const micro = Math.floor(p * 3);
    if (micro === 0) { pos.set(0.2, 1.6, 4.2 - p * 0.2); look.set(0, 1.45, 0.1); }
    else if (micro === 1) { pos.set(-0.3, 1.65, 3.8); look.set(0, 1.5, 0.15); } // close mirror side
    else { pos.set(0.4, 1.55, 4.5); look.set(0.05, 1.4, 0.05); }
  } else if (id === "buildup") {
    // WIDE/medium shots that always include Freddie + full band + crowd (no occlusion)
    const m = local;
    if (m < 3.5) { pos.set(0.2, 1.75, 5.3); look.set(0, 1.5, -0.8); }
    else if (m < 6.5) { pos.set(0, 2.5, 7.7 - (m - 3.5) / 3 * 0.5); look.set(0, 1.5, -1.8); } // WIDE stadium 80k
    else { pos.set(-0.2, 1.85, 5.7); look.set(0, 1.45, -0.9); }
  } else if (id === "fail") {
    if (local < 5.0) { pos.set(0.1, 1.8, 5.4); look.set(0, 1.45, -0.9); } // medium: Freddie worried, full band visible
    else if (local < 8.0) { pos.set(-0.2, 1.75, 4.7); look.set(-0.25, 1.5, -0.6); } // close concern (offset)
    else { pos.set(0.2, 2.2, 7.0); look.set(0, 1.4, -1.6); } // wide silence tense
  } else if (id === "eureka") {
    if (p < 0.35) { pos.set(0, 1.8, 5.1); look.set(-0.1, 1.5, -0.8); }
    else if (p < 0.7) { pos.set(-0.2, 1.75, 4.5); look.set(-0.35, 1.55, -0.5); } // close illumination (offset)
    else { pos.set(0.2, 1.9, 5.5); look.set(0, 1.5, -0.8); }
  } else if (id === "command") {
    if (p < 0.5) { pos.set(0.1, 1.8, 5.1); look.set(-0.1, 1.5, -0.7); }
    else { pos.set(-0.2, 2.0, 6.1); look.set(0, 1.4, -1.3); }
  } else if (id === "stomp") {
    const beatPhase = local / 0.95;
    if (local < 3.2) {
      const b = Math.floor(beatPhase) % 3;
      pos.set(b === 0 ? -0.3 : b === 1 ? 0.3 : 0.0, 1.95, b === 2 ? 5.5 : 5.9);
      look.set(0, 1.5, -0.9);
    } else {
      pos.set(0, 2.6, 8.0 - (local - 3.2) / 2.5 * 0.4); look.set(0, 1.5, -2.0); // WIDE palco+banda+estadio lotado
    }
  } else if (id === "vibration") {
    if (p < 0.55) { pos.set(0, 2.7, 8.2); look.set(0, 1.5, -2.2); } // WIDE delirio
    else { pos.set(0.2, 2.0, 5.7); look.set(0, 1.5, -1.0); }
  } else if (id === "conclusion") {
    if (local < 3.5) { pos.set(0, 2.3, 6.9); look.set(0, 1.4, -1.6); } // wide golden
    else { pos.set(-0.15, 1.75, 4.4); look.set(-0.3, 1.55, -0.4); } // close Freddie offset, band behind
  } else { // cta
    const out = p > 0.7 ? (p - 0.7) / 0.3 : 0;
    pos.set(-0.1, 1.7, 4.1 + out * 0.35); look.set(-0.25, 1.55, -0.35);
  }

  cam.position.copy(pos);
  cam.lookAt(look);
  cam.fov = (id === "stomp" && local < 3.2) ? 40 : 42;
  cam.near = 0.1; cam.far = 140;
  cam.updateProjectionMatrix();

  const fx = useMemo(() => ({
    ink: new InkPass(scene, cam, { strength: 0.82, widthNear: 4.4, widthFar: 2.8 }),
    lens: new LensBlur({ maxCoC: 18, nearScale: 1.1 }),
    bloom: new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.45, luminanceThreshold: 0.95, luminanceSmoothing: 0.25, mipmapBlur: true, levels: 5, radius: 0.6 }),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(GRADES.day, GRADE_STRENGTH.day),
  }), [scene, cam]);
  useEffect(() => () => fx.ink.dispose(), [fx]);

  const golden = id === "stomp" || id === "vibration" || id === "conclusion" || id === "cta";
  const wide = (id === "buildup" && local > 3.5 && local < 6.5) || (id === "fail" && local >= 8.0) || (id === "stomp" && local >= 3.2) || (id === "vibration" && p < 0.55) || (id === "conclusion" && local < 3.5);
  const focusTarget = wide ? new THREE.Vector3(0, 1.4, -1.6) : new THREE.Vector3(-0.35, 1.5, -0.5);
  fx.lens.focus = Math.max(0.5, pos.distanceTo(focusTarget));
  fx.lens.cInf = golden ? 3.6 : id === "fail" ? 4.8 : 4.2;
  fx.grade.set(golden ? GRADES.golden : GRADES.day);
  fx.grade.amount = golden ? GRADE_STRENGTH.golden : 0.85;
  (fx.bloom as BloomEffect).intensity = id === "stomp" || id === "vibration" ? 0.75 : golden ? 0.55 : id === "backstage" ? 0.5 : 0.4;

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
  return (<><World time={time} /><CameraAndPost time={time} /></>);
};

const overlayBase: React.CSSProperties = {
  position: "absolute",
  left: "7%",
  right: "13%",
  top: "10%",
  bottom: "22%",
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "center",
  textAlign: "center",
  fontFamily: '"Montserrat","Bebas Neue","Poppins","Arial Black","Arial",sans-serif',
  fontWeight: 900,
  lineHeight: 1.05,
  color: "#ffffff",
  textShadow: "0 4px 0 rgba(0,0,0,0.6), 0 10px 30px rgba(0,0,0,0.6), 3px 3px 0 #000, -3px -3px 0 #000, 3px -3px 0 #000, -3px 3px 0 #000",
  letterSpacing: 1.5,
  pointerEvents: "none",
  whiteSpace: "pre-line",
};

const TextPop: React.FC<{ text: string; fromSec: number; toSec: number; top?: string; fontSize?: number; accent?: boolean }> = ({ text, fromSec, toSec, top = "11%", fontSize = 64, accent = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  if (t < fromSec || t > toSec) return null;
  const local = t - fromSec;
  const enter = Math.min(1, local / 0.18);
  const exit = Math.min(1, Math.max(0, (toSec - t) / 0.22));
  const opacity = clamp01(enter) * clamp01(exit);
  const y = (1 - clamp01(enter)) * 30;
  const sc = 0.85 + 0.15 * clamp01(enter);
  const color = accent ? "#FFD54A" : "#ffffff";
  return <div style={{ ...overlayBase, top, fontSize, color, opacity, transform: `translateY(${y}px) scale(${sc})` }}>{text}</div>;
};

const StompWords: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const base = 51.03;
  const words = [ { w: "PISADA", at: base + 0.0 }, { w: "PISADA", at: base + 0.95 }, { w: "PALMA!", at: base + 1.9 } ];
  return <>{words.map((it, i) => {
    if (t < it.at || t > it.at + 0.85) return null;
    const local = t - it.at;
    const k = clamp01(local / 0.12);
    const o = clamp01(1 - local / 0.85);
    const sc = 0.6 + 0.55 * k;
    return <div key={i} style={{ position: "absolute", left: "10%", right: "12%", top: "46%", textAlign: "center", fontFamily: '"Montserrat","Bebas Neue","Arial Black",sans-serif', fontWeight: 900, fontSize: i === 2 ? 110 : 96, color: i === 2 ? "#FFD54A" : "#ffffff", textShadow: "0 6px 0 rgba(0,0,0,0.6), 4px 4px 0 #000, -4px -4px 0 #000, 4px -4px 0 #000, -4px 4px 0 #000, 0 12px 40px rgba(0,0,0,0.7)", opacity: o, transform: `scale(${sc})`, pointerEvents: "none" }}>{it.w}</div>;
  })}</>;
};

export const QueenStadium: React.FC = () => {
  const durationSec = QUEEN_TOTAL_DUR;
  return (
    <AbsoluteFill style={{ backgroundColor: "#0b0912" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@800;900&family=Bebas+Neue&display=swap');`}</style>
      <ThreeCanvas width={1080} height={1920} camera={{ fov: 42, position: [0, 1.6, 4.4], near: 0.1, far: 140 }} gl={{ antialias: false, stencil: false, powerPreference: "high-performance", toneMappingExposure: 1.0 }}>
        <SceneRoot />
      </ThreeCanvas>

      {/* Texts synced to cues/words */}
      <TextPop text={"O RITMO MAIS ICÔNICO\nDO ROCK..."} fromSec={0.4} toSec={4.2} top="12%" fontSize={62} />
      <TextPop text={"NÃO FOI CRIADO\nPARA SER LEGAL"} fromSec={4.3} toSec={6.8} top="12%" fontSize={60} accent />
      <TextPop text={"FOI UMA EMERGÊNCIA\nGENIAL"} fromSec={6.9} toSec={10.2} top="12%" fontSize={62} accent />
      <TextPop text={"1977\nUM ESTÁDIO GIGANTE"} fromSec={10.5} toSec={13.1} top="13%" fontSize={60} />
      <TextPop text={"MAIS DE 80 MIL\nPESSOAS"} fromSec={13.2} toSec={18.3} top="13%" fontSize={64} accent />
      <TextPop text={"O SOM FALHOU\nCOMPLETAMENTE"} fromSec={18.8} toSec={23.3} top="13%" fontSize={62} />
      <TextPop text={"O SOM DESAPARECEU"} fromSec={23.5} toSec={26.1} top="13%" fontSize={60} />
      <TextPop text={"SILÊNCIO."} fromSec={26.3} toSec={29.6} top="18%" fontSize={72} accent />
      <TextPop text={"FREDDIE TEVE\nUM ESTALO"} fromSec={30.0} toSec={34.0} top="13%" fontSize={62} />
      <TextPop text={"O CORPO HUMANO\nCOMO INSTRUMENTO"} fromSec={34.1} toSec={43.3} top="13%" fontSize={56} accent />
      <TextPop text={"DUAS VEZES OS PÉS..."} fromSec={43.7} toSec={47.9} top="13%" fontSize={58} />
      <TextPop text={"E UMA PALMA!"} fromSec={48.0} toSec={50.9} top="13%" fontSize={64} accent />
      <StompWords />
      <TextPop text={"SIMPLES. PODEROSO."} fromSec={53.9} toSec={56.7} top="13%" fontSize={62} accent />
      <TextPop text={"A VIBRAÇÃO MAIS\nINTENSA DO ESTÁDIO"} fromSec={56.9} toSec={63.0} top="13%" fontSize={56} />
      <TextPop text={"CONEXÃO NÃO PRECISA\nDE TECNOLOGIA"} fromSec={66.7} toSec={70.5} top="13%" fontSize={56} />
      <TextPop text={"SÓ DE RITMO,\nUNIÃO E ENERGIA"} fromSec={70.6} toSec={73.0} top="13%" fontSize={58} accent />
      <TextPop text={"AGORA VOCÊ NUNCA MAIS\nVAI OUVIR IGUAL"} fromSec={73.2} toSec={76.9} top="12%" fontSize={54} />
      <TextPop text={"MANDA ESSE VÍDEO\nPARA QUEM AMA QUEEN!"} fromSec={77.1} toSec={durationSec} top="12%" fontSize={54} accent />

      <Audio src={staticFile("queen-stadium/voice.wav")} />
      <Audio src={staticFile("queen-stadium/music.mp3")} volume={0.1} />
      {/* SFX */}
      <Sequence from={Math.floor(18.5 * QUEEN_FPS)} durationInFrames={Math.floor(2.2 * QUEEN_FPS)}><Audio src={staticFile("queen-stadium/sfx_fail.wav")} volume={0.22} /></Sequence>
      <Sequence from={Math.floor(29.7 * QUEEN_FPS)} durationInFrames={Math.floor(0.7 * QUEEN_FPS)}><Audio src={staticFile("queen-stadium/sfx_whoosh.wav")} volume={0.18} /></Sequence>
      <Sequence from={Math.floor(43.4 * QUEEN_FPS)} durationInFrames={Math.floor(0.7 * QUEEN_FPS)}><Audio src={staticFile("queen-stadium/sfx_whoosh.wav")} volume={0.15} /></Sequence>
      <Sequence from={Math.floor(51.03 * QUEEN_FPS)} durationInFrames={Math.floor(0.45 * QUEEN_FPS)}><Audio src={staticFile("queen-stadium/sfx_stomp.wav")} volume={0.28} /></Sequence>
      <Sequence from={Math.floor(51.98 * QUEEN_FPS)} durationInFrames={Math.floor(0.45 * QUEEN_FPS)}><Audio src={staticFile("queen-stadium/sfx_stomp.wav")} volume={0.28} /></Sequence>
      <Sequence from={Math.floor(52.93 * QUEEN_FPS)} durationInFrames={Math.floor(0.45 * QUEEN_FPS)}><Audio src={staticFile("queen-stadium/sfx_stomp.wav")} volume={0.3} /></Sequence>
    </AbsoluteFill>
  );
};

export default QueenStadium;
