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

export const LP_FPS = 30;
export const LP_TOTAL_DUR = 73.0; // voice ~69.4s + visual tail for CTA (>60s)
export const LP_FRAMES = Math.ceil(LP_TOTAL_DUR * LP_FPS);

type SceneId = "meeting" | "studio" | "fight" | "anthem" | "conclusion" | "cta";

// Aligned to narration/words.json segments (approx): hook/rejeição, erro comercial/cortar, luta/lancaram, hino mundial, conclusão, CTA
const SCENES: { id: SceneId; a: number; b: number }[] = [
  { id: "meeting",    a: 0.0,   b: 12.5 },  // hook + rejeição / gravadora (exec presente)
  { id: "studio",     a: 12.5,  b: 25.0 },  // erro comercial / estúdio (Chester+Mike, exec ainda no contexto inicial)
  { id: "fight",      a: 25.0,  b: 38.0 },  // luta/determinação (Chester+Mike, sem exec)
  { id: "anthem",     a: 38.0,  b: 53.2 },  // hino mundial / palco + multidão lotada (WIDE)
  { id: "conclusion", a: 53.2,  b: 65.0 },  // conclusão emocional (WIDE/close)
  { id: "cta",        a: 65.0,  b: 73.0 },  // CTA final + tail
];

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (t: number) => { const u = clamp01(t); return u * u * (3 - 2 * u); };

const sceneInfo = (time: number) => {
  for (let i = 0; i < SCENES.length; i++) {
    const s = SCENES[i];
    if (time >= s.a && time < s.b) return { ...s, local: time - s.a, dur: Math.max(0.001, s.b - s.a), idx: i };
  }
  const last = SCENES[SCENES.length - 1];
  return { ...last, local: Math.max(0, time - last.a), dur: Math.max(0.001, last.b - last.a), idx: SCENES.length - 1 };
};

const useTex = (name: string) => {
  const tex = useLoader(THREE.TextureLoader, staticFile(`linkin-park-anthem/${name}`));
  useEffect(() => { tex.colorSpace = THREE.SRGBColorSpace; tex.needsUpdate = true; }, [tex]);
  return tex;
};

const Sprite: React.FC<{ tex: THREE.Texture; pos: [number, number, number]; size: [number, number]; opacity?: number; tilt?: number; bob?: number }> = ({ tex, pos, size, opacity = 1, tilt = 0, bob = 0 }) => (
  <mesh position={[pos[0], pos[1] + bob, pos[2]]} rotation={[0, 0, tilt]} layers={NOINK}>
    <planeGeometry args={size} />
    <meshBasicMaterial map={tex} transparent alphaTest={0.04} opacity={opacity} side={THREE.DoubleSide} toneMapped={false} />
  </mesh>
);

const Chester: React.FC<{ pos: [number, number, number]; scale?: number; tilt?: number; expr: "frustrated" | "determined" | "triumph" | "neutral" | "singing"; bob?: number; opacity?: number }> = ({ pos, scale = 1, tilt = 0, expr, bob = 0, opacity = 1 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const tN = useTex("chester.png");
  const tF = useTex("chester_frustrated.png");
  const tD = useTex("chester_determined.png");
  const tT = useTex("chester_triumph.png");
  const tS = useTex("chester_singing.png");
  const tex = expr === "frustrated" ? tF : expr === "determined" ? tD : expr === "triumph" ? tT : expr === "singing" ? tS : tN;
  const breath = 1 + 0.012 * Math.sin(t * Math.PI * 1.5);
  const s = scale * breath;
  return <Sprite tex={tex} pos={pos} size={[2.7 * s, 3.75 * s]} tilt={tilt} bob={bob} opacity={opacity} />;
};

const Mike: React.FC<{ pos: [number, number, number]; scale?: number; tilt?: number; expr: "neutral" | "determined" | "triumph"; bob?: number; opacity?: number }> = ({ pos, scale = 1, tilt = 0, expr, bob = 0, opacity = 1 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const tN = useTex("mike.png");
  const tD = useTex("mike_determined.png");
  const tT = useTex("mike_triumph.png");
  const tex = expr === "determined" ? tD : expr === "triumph" ? tT : tN;
  const breath = 1 + 0.012 * Math.sin(t * Math.PI * 1.4 + 1);
  const s = scale * breath;
  return <Sprite tex={tex} pos={pos} size={[2.5 * s, 3.5 * s]} tilt={tilt} bob={bob} opacity={opacity} />;
};

const Executive: React.FC<{ pos: [number, number, number]; scale?: number; tilt?: number; bob?: number; opacity?: number }> = ({ pos, scale = 1, tilt = 0, bob = 0, opacity = 1 }) => {
  const tex = useTex("executive.png");
  return <Sprite tex={tex} pos={pos} size={[2.5 * scale, 3.5 * scale]} tilt={tilt} bob={bob} opacity={opacity} />;
};

type CrowdMode = "idle" | "react" | "hype" | "delirium" | "soft";

const CrowdLayer: React.FC<{ count: number; yBase: number; z: number; spreadX: number; scaleBase: number; depthJitter: number; mode: CrowdMode; color: string; opacity?: number }> = ({ count, yBase, z, spreadX, scaleBase, depthJitter, mode, color, opacity = 0.9 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const items = useMemo(() => Array.from({ length: count }, () => {
    const x = (Math.random() - 0.5) * spreadX;
    const h = 0.35 + Math.random() * 0.35;
    const w = 0.16 + Math.random() * 0.12;
    const ph = Math.random() * Math.PI * 2;
    const dz = (Math.random() - 0.5) * depthJitter;
    return { x, h, w, ph, dz, arm: Math.random() > 0.45 };
  }), [count, spreadX, depthJitter]);

  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 64; c.height = 128;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, 64, 128);
    ctx.fillStyle = "#ffffff";
    ctx.beginPath(); ctx.ellipse(32, 22, 10, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(12, 128); ctx.lineTo(16, 48); ctx.quadraticCurveTo(20, 30, 32, 28); ctx.quadraticCurveTo(44, 30, 48, 48); ctx.lineTo(52, 128); ctx.closePath(); ctx.fill();
    ctx.fillRect(6, 44, 8, 28);
    ctx.fillRect(50, 44, 8, 28);
    const tt = new THREE.CanvasTexture(c); tt.colorSpace = THREE.SRGBColorSpace; tt.needsUpdate = true; return tt;
  }, []);
  useEffect(() => () => tex.dispose(), [tex]);

  let amp = 0.02, speed = 1.2, armsUp = 0.2;
  if (mode === "idle") { amp = 0.01; speed = 0.8; armsUp = 0.05; }
  else if (mode === "react") { amp = 0.04; speed = 1.8; armsUp = 0.35; }
  else if (mode === "hype") { amp = 0.08; speed = 3.6; armsUp = 0.7; }
  else if (mode === "delirium") { amp = 0.11; speed = 4.8; armsUp = 0.95; }
  else if (mode === "soft") { amp = 0.03; speed = 1.1; armsUp = 0.5; }

  const beat = (mode === "hype" || mode === "delirium") ? Math.max(0, Math.sin((t - 44.5) * Math.PI * 2 / 0.8)) : 0;

  return (
    <group position={[0, yBase, z]}>
      {items.map((it, i) => {
        const bounce = Math.abs(Math.sin(t * speed + it.ph)) * amp + beat * 0.03;
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
  const base = golden ? "#1f150b" : "#0b0b14";
  const mid = golden ? "#2a1c10" : "#12121e";
  const back = golden ? "#332313" : "#171728";
  return (
    <group>
      <CrowdLayer count={70} yBase={0.05} z={-2.2} spreadX={14} scaleBase={1.0} depthJitter={0.5} mode={mode} color={base} opacity={0.92} />
      <CrowdLayer count={90} yBase={0.6} z={-4.5} spreadX={16} scaleBase={0.95} depthJitter={0.6} mode={mode} color={mid} opacity={0.9} />
      <CrowdLayer count={90} yBase={1.1} z={-6.0} spreadX={18} scaleBase={0.9} depthJitter={0.7} mode={mode} color={mid} opacity={0.86} />
      <CrowdLayer count={80} yBase={1.8} z={-7.5} spreadX={20} scaleBase={0.85} depthJitter={0.8} mode={mode} color={back} opacity={0.82} />
      <CrowdLayer count={70} yBase={2.4} z={-8.8} spreadX={22} scaleBase={0.8} depthJitter={0.9} mode={mode} color={back} opacity={0.78} />
    </group>
  );
};

const MeetingRoom: React.FC = () => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}><planeGeometry args={[18, 18]} /><meshLambertMaterial color="#1b2230" /></mesh>
    <mesh position={[0, 2.6, -4.2]}><boxGeometry args={[14, 5.5, 0.3]} /><meshLambertMaterial color="#243044" /></mesh>
    <mesh position={[-6.8, 2.6, -0.8]} rotation={[0, Math.PI / 2, 0]}><boxGeometry args={[9, 5.5, 0.3]} /><meshLambertMaterial color="#202a3b" /></mesh>
    <mesh position={[6.8, 2.6, -0.8]} rotation={[0, -Math.PI / 2, 0]}><boxGeometry args={[9, 5.5, 0.3]} /><meshLambertMaterial color="#202a3b" /></mesh>
    <mesh position={[0, 5.2, 0]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[14, 11]} /><meshLambertMaterial color="#2a3448" /></mesh>
    {/* glass table */}
    <mesh position={[0, 0.75, -1.0]}><boxGeometry args={[4.2, 0.08, 1.8]} /><meshPhysicalMaterial color="#8fd3ff" transparent opacity={0.25} roughness={0.1} /></mesh>
    <mesh position={[-1.7, 0.38, -1.0]}><boxGeometry args={[0.1, 0.75, 0.1]} /><meshLambertMaterial color="#556" /></mesh>
    <mesh position={[1.7, 0.38, -1.0]}><boxGeometry args={[0.1, 0.75, 0.1]} /><meshLambertMaterial color="#556" /></mesh>
    <mesh position={[-1.7, 0.38, -0.3]}><boxGeometry args={[0.1, 0.75, 0.1]} /><meshLambertMaterial color="#556" /></mesh>
    <mesh position={[1.7, 0.38, -0.3]}><boxGeometry args={[0.1, 0.75, 0.1]} /><meshLambertMaterial color="#556" /></mesh>
    {/* chairs hints */}
    <mesh position={[0, 0.55, 0.2]}><boxGeometry args={[0.9, 0.1, 0.8]} /><meshLambertMaterial color="#2a2f3d" /></mesh>
    <mesh position={[-1.8, 0.55, -1.8]}><boxGeometry args={[0.8, 0.1, 0.7]} /><meshLambertMaterial color="#2a2f3d" /></mesh>
    <mesh position={[1.8, 0.55, -1.8]}><boxGeometry args={[0.8, 0.1, 0.7]} /><meshLambertMaterial color="#2a2f3d" /></mesh>
    {/* fluorescent lights */}
    <mesh position={[-1.8, 4.9, -1.5]}><boxGeometry args={[2.2, 0.08, 0.5]} /><meshBasicMaterial color="#bfe8ff" /></mesh>
    <mesh position={[1.8, 4.9, -1.5]}><boxGeometry args={[2.2, 0.08, 0.5]} /><meshBasicMaterial color="#bfe8ff" /></mesh>
    <pointLight position={[0, 4.2, -1]} intensity={1.6} color="#9fdcff" distance={12} />
  </group>
);

const StudioSet: React.FC = () => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}><planeGeometry args={[18, 18]} /><meshLambertMaterial color="#151318" /></mesh>
    <mesh position={[0, 2.5, -4.0]}><boxGeometry args={[14, 5.2, 0.3]} /><meshLambertMaterial color="#1d1a24" /></mesh>
    <mesh position={[-6.5, 2.5, -1.0]} rotation={[0, Math.PI / 2, 0]}><boxGeometry args={[8, 5.2, 0.3]} /><meshLambertMaterial color="#181520" /></mesh>
    <mesh position={[6.5, 2.5, -1.0]} rotation={[0, -Math.PI / 2, 0]}><boxGeometry args={[8, 5.2, 0.3]} /><meshLambertMaterial color="#181520" /></mesh>
    <mesh position={[0, 5.0, 0]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[14, 10]} /><meshLambertMaterial color="#221e2c" /></mesh>
    {/* mixing desk / keyboard */}
    <mesh position={[1.8, 0.75, -1.4]}><boxGeometry args={[2.6, 0.12, 1.1]} /><meshLambertMaterial color="#2a2733" /></mesh>
    <mesh position={[1.2, 0.4, -1.4]}><boxGeometry args={[0.1, 0.8, 0.1]} /><meshLambertMaterial color="#222" /></mesh>
    <mesh position={[2.4, 0.4, -1.4]}><boxGeometry args={[0.1, 0.8, 0.1]} /><meshLambertMaterial color="#222" /></mesh>
    <mesh position={[1.8, 0.9, -1.4]}><boxGeometry args={[2.0, 0.08, 0.5]} /><meshLambertMaterial color="#111" /></mesh>
    {/* monitors / speakers */}
    <mesh position={[0.9, 1.2, -1.6]}><boxGeometry args={[0.4, 0.5, 0.35]} /><meshLambertMaterial color="#202028" /></mesh>
    <mesh position={[2.7, 1.2, -1.6]}><boxGeometry args={[0.4, 0.5, 0.35]} /><meshLambertMaterial color="#202028" /></mesh>
    {/* mic stand for Chester */}
    <mesh position={[-1.6, 1.2, -0.8]}><cylinderGeometry args={[0.03, 0.03, 2.0, 8]} /><meshLambertMaterial color="#7a7a80" /></mesh>
    <mesh position={[-1.6, 2.2, -0.8]}><sphereGeometry args={[0.11, 12, 12]} /><meshLambertMaterial color="#cfcfd8" /></mesh>
    {/* cables */}
    <mesh position={[0.2, 0.05, -1.0]} rotation={[0, 0.4, 0]}><boxGeometry args={[2.2, 0.05, 0.08]} /><meshLambertMaterial color="#222" /></mesh>
    <mesh position={[-0.6, 0.05, -0.6]} rotation={[0, -0.2, 0]}><boxGeometry args={[1.8, 0.05, 0.08]} /><meshLambertMaterial color="#222" /></mesh>
    {/* LED lights red/green */}
    <mesh position={[-2.4, 3.2, -3.8]}><boxGeometry args={[1.6, 0.08, 0.08]} /><meshBasicMaterial color="#ff3b4a" /></mesh>
    <mesh position={[2.4, 3.4, -3.8]}><boxGeometry args={[1.6, 0.08, 0.08]} /><meshBasicMaterial color="#39ff88" /></mesh>
    <pointLight position={[-2.2, 2.8, -2.8]} intensity={1.2} color="#ff4a5a" distance={8} />
    <pointLight position={[2.2, 2.9, -2.8]} intensity={1.1} color="#3aff90" distance={8} />
  </group>
);

const StageBase: React.FC<{ golden?: boolean }> = ({ golden = false }) => {
  const floor = golden ? "#2a1e12" : "#161320";
  const wall = golden ? "#3a2818" : "#181424";
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}><planeGeometry args={[36, 36]} /><meshLambertMaterial color={floor} /></mesh>
      <mesh position={[0, 0.28, -1.2]}><boxGeometry args={[9.5, 0.56, 3.2]} /><meshLambertMaterial color={golden ? "#3b2a18" : "#1d1826"} /></mesh>
      <mesh position={[0, 3.8, -10.5]}><boxGeometry args={[28, 9, 0.5]} /><meshLambertMaterial color={wall} /></mesh>
      <mesh position={[-11, 3.2, -6.5]} rotation={[0, 0.42, 0]}><boxGeometry args={[12, 8, 0.5]} /><meshLambertMaterial color={wall} /></mesh>
      <mesh position={[11, 3.2, -6.5]} rotation={[0, -0.42, 0]}><boxGeometry args={[12, 8, 0.5]} /><meshLambertMaterial color={wall} /></mesh>
      <mesh position={[0, 1.2, -5.2]}><boxGeometry args={[20, 0.4, 1.2]} /><meshLambertMaterial color={wall} /></mesh>
      <mesh position={[0, 1.9, -6.6]}><boxGeometry args={[22, 0.4, 1.2]} /><meshLambertMaterial color={wall} /></mesh>
      <mesh position={[0, 2.6, -8.0]}><boxGeometry args={[24, 0.4, 1.2]} /><meshLambertMaterial color={wall} /></mesh>
      {/* stage monitors */}
      <mesh position={[-2.8, 0.6, -0.4]} rotation={[-0.4, 0, 0]}><boxGeometry args={[1.0, 0.5, 0.6]} /><meshLambertMaterial color="#222" /></mesh>
      <mesh position={[2.8, 0.6, -0.4]} rotation={[-0.4, 0, 0]}><boxGeometry args={[1.0, 0.5, 0.6]} /><meshLambertMaterial color="#222" /></mesh>
    </group>
  );
};

const Spotlights: React.FC<{ golden: boolean; intensity?: number }> = ({ golden, intensity = 1 }) => {
  const color = golden ? "#ffd36b" : "#dfe8ff";
  const op = (golden ? 0.1 : 0.06) * intensity;
  const i = (golden ? 2.2 : 1.0) * intensity;
  return (
    <group>
      <mesh position={[-2.6, 4.6, -4]} rotation={[0.2, 0.22, 0]}><planeGeometry args={[1.3, 8.5]} /><meshBasicMaterial color={color} transparent opacity={op} /></mesh>
      <mesh position={[2.6, 4.6, -4]} rotation={[0.2, -0.22, 0]}><planeGeometry args={[1.3, 8.5]} /><meshBasicMaterial color={color} transparent opacity={op} /></mesh>
      <mesh position={[0, 4.8, -4.5]} rotation={[0.15, 0, 0]}><planeGeometry args={[1.1, 8]} /><meshBasicMaterial color={golden ? "#ffb84d" : "#b8d0ff"} transparent opacity={op * 0.8} /></mesh>
      <pointLight position={[0, 4.2, -1]} intensity={i} color={golden ? "#ffd080" : "#c8d8ff"} distance={14} />
    </group>
  );
};

const Lighters: React.FC<{ active: boolean }> = ({ active }) => {
  const pts = useMemo(() => Array.from({ length: 50 }, () => ({
    x: (Math.random() - 0.5) * 16, y: 1.0 + Math.random() * 2.2, z: -4 - Math.random() * 4.5, ph: Math.random() * Math.PI * 2
  })), []);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  if (!active) return null;
  return <group>{pts.map((p, i) => {
    const o = 0.3 + 0.7 * Math.abs(Math.sin(t * 2.5 + p.ph));
    return <mesh key={i} position={[p.x, p.y, p.z]} layers={NOINK}><sphereGeometry args={[0.05, 6, 6]} /><meshBasicMaterial color="#ffd37a" transparent opacity={o} toneMapped={false} /></mesh>;
  })}</group>;
};

const Particles: React.FC = () => {
  const pts = useMemo(() => Array.from({ length: 40 }, () => ({ x: (Math.random() - 0.5) * 6, y: 0.5 + Math.random() * 3, z: -1 + Math.random() * 2, ph: Math.random() * Math.PI * 2, sp: 0.2 + Math.random() * 0.4 })), []);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  return <group>{pts.map((p, i) => {
    const y = p.y + Math.sin(t * p.sp + p.ph) * 0.2;
    const o = 0.15 + 0.25 * Math.abs(Math.sin(t * 0.8 + p.ph));
    return <mesh key={i} position={[p.x, y, p.z]} layers={NOINK}><sphereGeometry args={[0.03, 6, 6]} /><meshBasicMaterial color="#ffe6a8" transparent opacity={o} toneMapped={false} /></mesh>;
  })}</group>;
};

const World: React.FC<{ time: number }> = ({ time }) => {
  const { id, local, dur } = sceneInfo(time);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const onStage = id === "anthem" || id === "conclusion" || id === "cta";
  const inStudio = id === "studio" || id === "fight";
  const inMeeting = id === "meeting";

  // Crowd: required visible scenes 4-6
  const showCrowd = onStage;
  let crowdMode: CrowdMode = "soft";
  if (id === "anthem") crowdMode = local < (dur * 0.35) ? "react" : "delirium"; // explodes at "hino mundial"
  else if (id === "conclusion") crowdMode = local < 3 ? "hype" : "soft";
  else if (id === "cta") crowdMode = "soft";

  const golden = id === "anthem" || id === "conclusion" || id === "cta";

  // Character expressions & positions (NO occlusion)
  // Exec present only in scenes 1-2 (brief context, side/back, never blocking or taking focus from Chester/Mike)
  const showExec = id === "meeting" || (id === "studio" && local < 3.0);
  // Chester & Mike visible and central in all relevant scenes 1-6
  let cExpr: "frustrated" | "determined" | "triumph" | "neutral" | "singing" = "neutral";
  let mExpr: "neutral" | "determined" | "triumph" = "neutral";
  if (id === "meeting") { cExpr = "frustrated"; mExpr = "determined"; }
  else if (id === "studio") { cExpr = "determined"; mExpr = "determined"; }
  else if (id === "fight") { cExpr = "singing"; mExpr = "determined"; }
  else if (id === "anthem") { cExpr = "singing"; mExpr = "triumph"; }
  else if (id === "conclusion") { cExpr = "triumph"; mExpr = "triumph"; }
  else { cExpr = "triumph"; mExpr = "triumph"; }

  // Positions: Chester is lead and always prominent; Mike close partner; no occlusion
  let chPos: [number, number, number] = [-0.4, 1.52, -0.6];
  let miPos: [number, number, number] = [1.5, 1.45, -1.1];
  let exPos: [number, number, number] = [2.2, 1.4, -1.8];
  let chScale = 1.12, miScale = 1.0, exScale = 0.9;
  let chBob = Math.sin(t * 1.2) * 0.012, miBob = Math.sin(t * 1.3 + 1) * 0.01;

  if (inMeeting) {
    // Chester & Mike in front reacting; exec briefly at side/back, never covering
    exPos = [2.5, 1.36, -2.2]; exScale = 0.82;
    chPos = [-0.9, 1.5, -0.7]; miPos = [0.9, 1.46, -0.9];
    chScale = 1.1; miScale = 1.02;
  } else if (inStudio) {
    exPos = [2.6, 1.34, -2.4]; exScale = 0.8; // brief background only if shown
    // both together in studio, Chester more central
    miPos = [1.45, 1.45, -1.1];
    chPos = [-0.7, 1.52, -0.7];
    chScale = 1.12; miScale = 1.0;
    if (id === "fight") {
      // Chester singing/passion at mic, Mike still clearly visible
      chPos = [-0.6, 1.55, -0.55];
      miPos = [1.55, 1.45, -1.25];
      chScale = 1.14; miScale = 0.98;
      chBob += Math.abs(Math.sin(t * 2.6)) * 0.035;
      miBob += Math.sin(t * 1.8) * 0.012;
    }
  } else if (onStage) {
    // Stage: Chester lead center-left/front, Mike center-right, crowd behind - all visible
    chPos = [-0.6, 1.58, -0.6];
    miPos = [1.45, 1.52, -1.05];
    chScale = 1.14; miScale = 1.02;
    const hype = (id === "anthem" && local > dur * 0.25) || id === "conclusion";
    if (hype) {
      chBob += Math.abs(Math.sin(t * 3.2)) * 0.045;
      miBob += Math.abs(Math.sin(t * 2.8)) * 0.03;
    }
    if (id === "conclusion") {
      chPos = [-0.35, 1.58, -0.5];
      miPos = [1.45, 1.5, -1.15];
      chScale = 1.16; miScale = 1.0;
    } else if (id === "cta") {
      chPos = [-0.25, 1.6, -0.45]; // Chester close hero, Mike still visible on stage in DOF
      miPos = [1.5, 1.48, -1.3];
      chScale = 1.18; miScale = 0.98;
    }
  }

  const sky = golden ? "#2a1a0e" : inMeeting ? "#0e1422" : inStudio ? "#120f18" : "#0d0b18";
  const fogC = golden ? "#4a3018" : inMeeting ? "#1a2740" : inStudio ? "#221828" : "#1a1830";

  return (
    <group>
      <color attach="background" args={[sky]} />
      <fog attach="fog" args={[fogC, 7, 28]} />

      <ambientLight intensity={golden ? 0.55 : inMeeting ? 0.5 : 0.4} color={golden ? "#ffdcb0" : inMeeting ? "#cfe8ff" : "#d8d0ff"} />
      <directionalLight position={[4, 7, 4]} intensity={golden ? 1.7 : inMeeting ? 1.0 : 1.1} color={golden ? "#ffe0a8" : inMeeting ? "#bfe4ff" : "#ffd0c0"} />
      <directionalLight position={[-4, 4, -2]} intensity={golden ? 0.55 : 0.35} color={golden ? "#ff9a50" : inMeeting ? "#8098ff" : "#ff6060"} />

      {inMeeting && <MeetingRoom />}
      {inStudio && <StudioSet />}
      {onStage && <StageBase golden={golden} />}
      {showCrowd && <CrowdMass mode={crowdMode} golden={golden} />}
      {onStage && <Spotlights golden={golden} intensity={id === "anthem" ? 1.3 : 1} />}

      {/* Characters - no occlusion: exec minimal/behind, Mike visible, Chester lead front */}
      {showExec && <Suspense fallback={null}><Executive pos={exPos} scale={exScale} opacity={0.85} /></Suspense>}
      <Suspense fallback={null}><Mike pos={miPos} scale={miScale} expr={mExpr} bob={miBob} /></Suspense>
      <Suspense fallback={null}><Chester pos={chPos} scale={chScale} expr={cExpr} bob={chBob} /></Suspense>

      {onStage && id === "anthem" && local > dur * 0.2 && <Lighters active={true} />}
      {(id === "conclusion" || id === "cta") && <Lighters active={true} />}
      {(id === "conclusion" || id === "cta") && <Particles />}

      {/* dynamic lights */}
      {inMeeting && <pointLight position={[-0.5, 3.6, -0.2]} intensity={1.1} color="#cfe8ff" distance={10} />}
      {inStudio && <>
        <pointLight position={[-1.8, 2.6, -1.2]} intensity={1.1} color="#ff4a5a" distance={8} />
        <pointLight position={[1.8, 2.6, -1.5]} intensity={0.9} color="#3aff90" distance={8} />
      </>}
      {id === "anthem" && <pointLight position={[-0.2, 4, 1]} intensity={2.8 + Math.sin(t * 5) * 0.5} color="#ffb050" distance={13} />}
      {(id === "conclusion" || id === "cta") && <pointLight position={[-0.2, 3.6, 1]} intensity={2.0} color="#ffd080" distance={11} />}
    </group>
  );
};

const CameraAndPost: React.FC<{ time: number }> = ({ time }) => {
  const { camera, scene } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  const { id, local, dur } = sceneInfo(time);
  const p = smooth(local / dur);
  const pos = new THREE.Vector3();
  const look = new THREE.Vector3();
  let focusTarget = new THREE.Vector3(-0.4, 1.52, -0.7);

  if (id === "meeting") {
    // Cena 1: foco em Chester e Mike (protagonistas); executivo só contexto breve/lateral
    if (p < 0.35) { pos.set(0.0, 1.72, 4.3); look.set(-0.2, 1.5, -0.8); focusTarget.set(-0.2, 1.48, -0.8); }
    else if (p < 0.7) { pos.set(-0.25, 1.7, 3.95); look.set(-0.7, 1.52, -0.7); focusTarget.set(-0.8, 1.5, -0.7); } // close Chester reação
    else { pos.set(0.3, 1.72, 4.15); look.set(0.2, 1.48, -0.85); focusTarget.set(0.1, 1.47, -0.85); } // Chester + Mike juntos
  } else if (id === "studio") {
    // Cena 2: estúdio - Chester e Mike em destaque (erro comercial / cumplicidade)
    if (p < 0.5) { pos.set(0.0, 1.72, 4.25); look.set(0.2, 1.48, -0.9); focusTarget.set(0.2, 1.48, -0.9); } // médio Mike+Chester
    else { pos.set(-0.2, 1.7, 3.9); look.set(-0.5, 1.52, -0.7); focusTarget.set(-0.6, 1.52, -0.7); } // close Chester determinado
  } else if (id === "fight") {
    // Cena 3: luta - Chester cantando com paixão (protagonista), Mike visível e nítido
    if (p < 0.4) { pos.set(-0.15, 1.74, 3.85); look.set(-0.55, 1.56, -0.55); focusTarget.set(-0.6, 1.55, -0.55); } // close Chester cantando
    else if (p < 0.7) { pos.set(0.15, 1.72, 4.2); look.set(0.2, 1.5, -0.85); focusTarget.set(0.3, 1.5, -0.9); } // médio Chester+Mike
    else { pos.set(-0.1, 1.72, 3.95); look.set(-0.5, 1.55, -0.55); focusTarget.set(-0.55, 1.55, -0.55); } // close Chester
  } else if (id === "anthem") {
    // Cena 4: WIDE obrigatório (palco+Chester+Mike+multidão) e médios com Chester/Mike em foco
    if (p < 0.4) { pos.set(0, 2.55, 7.8 - p * 0.5); look.set(0.1, 1.5, -1.7); focusTarget.set(0.2, 1.5, -0.9); } // WIDE 1 (foco no palco/banda)
    else if (p < 0.7) { pos.set(-0.1, 1.9, 5.0); look.set(-0.2, 1.55, -0.8); focusTarget.set(-0.3, 1.55, -0.75); } // médio Chester+Mike energia
    else { pos.set(0.2, 2.15, 6.2); look.set(0.1, 1.5, -1.2); focusTarget.set(0.2, 1.5, -0.9); } // médio-wide todos visíveis
  } else if (id === "conclusion") {
    // Cena 5: WIDE obrigatório + close emocional de Chester com Mike/multidão visíveis
    if (p < 0.4) { pos.set(0, 2.45, 7.3); look.set(0.1, 1.48, -1.6); focusTarget.set(0.2, 1.5, -0.9); } // WIDE 2
    else { pos.set(-0.05, 1.72, 4.0); look.set(-0.25, 1.58, -0.45); focusTarget.set(-0.3, 1.58, -0.5); } // close Chester triunfante, Mike visível
  } else { // cta
    const out = p > 0.7 ? (p - 0.7) / 0.3 : 0;
    pos.set(-0.02, 1.7, 3.85 + out * 0.25); look.set(-0.2, 1.6, -0.4); focusTarget.set(-0.25, 1.6, -0.45); // Chester hero CTA
  }

  cam.position.copy(pos);
  cam.lookAt(look);
  cam.fov = 42;
  cam.near = 0.1; cam.far = 140;
  cam.updateProjectionMatrix();

  const fx = useMemo(() => ({
    ink: new InkPass(scene, cam, { strength: 0.82, widthNear: 4.4, widthFar: 2.8 }),
    lens: new LensBlur({ maxCoC: 18, nearScale: 1.05 }),
    bloom: new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.45, luminanceThreshold: 0.95, luminanceSmoothing: 0.25, mipmapBlur: true, levels: 5, radius: 0.6 }),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(GRADES.day, GRADE_STRENGTH.day),
  }), [scene, cam]);
  useEffect(() => () => fx.ink.dispose(), [fx]);

  const golden = id === "anthem" || id === "conclusion" || id === "cta";
  fx.lens.focus = Math.max(0.5, pos.distanceTo(focusTarget));
  // keep Chester/Mike sharp; gentle DOF for depth (crowd/background) without blurring protagonists
  fx.lens.cInf = golden ? 2.2 : id === "meeting" ? 2.4 : 2.3;
  fx.grade.set(golden ? GRADES.golden : GRADES.day);
  fx.grade.amount = golden ? GRADE_STRENGTH.golden : 0.85;
  (fx.bloom as BloomEffect).intensity = id === "anthem" ? 0.8 : golden ? 0.55 : inStudioScene(id) ? 0.45 : 0.4;

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

function inStudioScene(id: SceneId) { return id === "studio" || id === "fight"; }

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

const TextPop: React.FC<{ text: string; fromSec: number; toSec: number; top?: string; fontSize?: number; accent?: boolean; accentColor?: string }> = ({ text, fromSec, toSec, top = "11%", fontSize = 64, accent = false, accentColor = "#ff3b3b" }) => {
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
  const color = accent ? accentColor : "#ffffff";
  return <div style={{ ...overlayBase, top, fontSize, color, opacity, transform: `translateY(${y}px) scale(${sc})` }}>{text}</div>;
};

export const LinkinParkAnthem: React.FC = () => {
  const durationSec = LP_TOTAL_DUR;
  return (
    <AbsoluteFill style={{ backgroundColor: "#0b0912" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@800;900&family=Bebas+Neue&display=swap');`}</style>
      <ThreeCanvas width={1080} height={1920} camera={{ fov: 42, position: [0, 1.6, 4.4], near: 0.1, far: 140 }} gl={{ antialias: false, stencil: false, powerPreference: "high-performance", toneMappingExposure: 1.0 }}>
        <SceneRoot />
      </ThreeCanvas>

      {/* Texts synced to narration cues/segments (approx word timings) */}
      <TextPop text={"A MÚSICA MAIS ICÔNICA\nDO LINKIN PARK..."} fromSec={0.3} toSec={3.4} top="12%" fontSize={60} />
      <TextPop text={"QUASE FOI JOGADA\nNO LIXO"} fromSec={3.5} toSec={6.4} top="12%" fontSize={68} accent accentColor="#ff3b3b" />
      <TextPop text={"ANOS 90 • HYBRID THEORY"} fromSec={6.8} toSec={10.5} top="13%" fontSize={54} />
      <TextPop text={"RAP + ROCK + PIANO"} fromSec={10.6} toSec={14.8} top="13%" fontSize={58} accent accentColor="#ffffff" />
      <TextPop text={"\"ERRO COMERCIAL\""} fromSec={15.0} toSec={18.6} top="13%" fontSize={66} accent accentColor="#ff3b3b" />
      <TextPop text={"\"CORTEM A FAIXA\""} fromSec={20.9} toSec={25.0} top="13%" fontSize={66} accent accentColor="#ff3b3b" />
      <TextPop text={"CHESTER E MIKE\nRECUSARAM"} fromSec={25.1} toSec={29.1} top="13%" fontSize={60} />
      <TextPop text={"ELA PRECISAVA\nEXISTIR"} fromSec={33.2} toSec={37.0} top="13%" fontSize={62} accent accentColor="#ffffff" />
      <TextPop text={"ELES LUTARAM"} fromSec={37.2} toSec={41.0} top="13%" fontSize={64} />
      <TextPop text={"LANÇARAM AO MUNDO"} fromSec={41.1} toSec={44.4} top="13%" fontSize={60} accent accentColor="#ffffff" />
      <TextPop text={"O RESULTADO?"} fromSec={44.5} toSec={46.0} top="18%" fontSize={72} accent accentColor="#ff3b3b" />
      <TextPop text={"EXPLODIU.\nDEFINIU UMA GERAÇÃO."} fromSec={46.1} toSec={50.2} top="12%" fontSize={56} />
      <TextPop text={"UM HINO MUNDIAL"} fromSec={50.3} toSec={53.1} top="13%" fontSize={66} accent accentColor="#ffd36b" />
      <TextPop text={"A ARTE NÃO PEDE\nPERMISSÃO"} fromSec={53.2} toSec={56.7} top="13%" fontSize={58} />
      <TextPop text={"CORAGEM PARA IGNORAR\nOS ESPECIALISTAS"} fromSec={56.9} toSec={60.4} top="13%" fontSize={54} accent accentColor="#ffd36b" />
      <TextPop text={"ESSA HISTÓRIA\nTE ARREPIA?"} fromSec={60.6} toSec={62.6} top="13%" fontSize={60} />
      <TextPop text={"COMENTA \"LP\""} fromSec={62.7} toSec={65.4} top="12%" fontSize={66} accent accentColor="#ff3b3b" />
      <TextPop text={"MANDA PARA AQUELE AMIGO\nQUE AMA LINKIN PARK"} fromSec={65.5} toSec={durationSec} top="12%" fontSize={50} accent accentColor="#ffd36b" />

      <Audio src={staticFile("linkin-park-anthem/voice.wav")} />
      <Audio src={staticFile("linkin-park-anthem/music.mp3")} volume={0.1} />
      {/* SFX (discretos, voz dominante) */}
      <Sequence from={0} durationInFrames={Math.floor(2.2 * LP_FPS)}><Audio src={staticFile("linkin-park-anthem/sfx_rewind.wav")} volume={0.18} /></Sequence>
      <Sequence from={Math.floor(44.5 * LP_FPS)} durationInFrames={Math.floor(0.5 * LP_FPS)}><Audio src={staticFile("linkin-park-anthem/sfx_kick1.wav")} volume={0.22} /></Sequence>
      <Sequence from={Math.floor(46.1 * LP_FPS)} durationInFrames={Math.floor(0.5 * LP_FPS)}><Audio src={staticFile("linkin-park-anthem/sfx_kick2.wav")} volume={0.2} /></Sequence>
      <Sequence from={Math.floor(38.0 * LP_FPS)} durationInFrames={Math.floor(6.0 * LP_FPS)}><Audio src={staticFile("linkin-park-anthem/sfx_crowd.wav")} volume={0.16} /></Sequence>
      <Sequence from={Math.floor(50.0 * LP_FPS)} durationInFrames={Math.floor(6.0 * LP_FPS)}><Audio src={staticFile("linkin-park-anthem/sfx_crowd.wav")} volume={0.12} /></Sequence>
    </AbsoluteFill>
  );
};

export default LinkinParkAnthem;
