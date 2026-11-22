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
import wordsData from "../../../public/linkin-park-jayz/words.json";

export const JAYZ_FPS = 30;
export const JAYZ_TOTAL_DUR = 70.0; // >60s com cauda visual/CTA
export const JAYZ_FRAMES = Math.ceil(JAYZ_TOTAL_DUR * JAYZ_FPS);

type SceneId = "hook" | "send" | "meet" | "fusion" | "grammy" | "cta";

// Janelas alinhadas aos cues/words.json (voz ~48s) + cauda visual para >60s
// cue0 0.1-6.03 (pegadinha) | cue1 5.98-12.89 (Mike criou/enviou) | cue2 12.89-16.62 (Jay-Z achou sério?) 
// cue3 16.62-19.54 (mistura diferente) | cue4 19.54-22.67 (encaixavam) | cue5 22.67-26.50 (encontraram/gravaram)
// cue6 26.50-28.01 (resultado?) | cue7 28.01-35.98 (Collision Course, Grammy 2006) | cue8 35.98-40.35 (mundos opostos)
// cue9 40.35-42.01 (Rock ou Rap?) | cue10 42.01-48.01 (CTA)
const SCENES: { id: SceneId; a: number; b: number }[] = [
  { id: "hook",   a: 0.0,  b: 10.5 },  // Cena 1: Hook / pegadinha (tela dividida)
  { id: "send",   a: 10.5, b: 22.5 },  // Cena 2: O Envio (alternada: Mike -> Jay-Z)
  { id: "meet",   a: 22.5, b: 35.5 },  // Cena 3: O Encontro (tela dividida dinâmica)
  { id: "fusion", a: 35.5, b: 49.5 },  // Cena 4: A Fusão (PLANO GERAL WIDE)
  { id: "grammy", a: 49.5, b: 61.5 },  // Cena 5: Grammy Lendário (close alternado + WIDE)
  { id: "cta",    a: 61.5, b: 70.0 },  // Cena 6: CTA final (tela dividida)
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
  const tex = useLoader(THREE.TextureLoader, staticFile(`linkin-park-jayz/${name}`));
  useEffect(() => { tex.colorSpace = THREE.SRGBColorSpace; tex.needsUpdate = true; }, [tex]);
  return tex;
};

const Sprite: React.FC<{ tex: THREE.Texture; pos: [number, number, number]; size: [number, number]; opacity?: number; tilt?: number; bob?: number }> = ({ tex, pos, size, opacity = 1, tilt = 0, bob = 0 }) => (
  <mesh position={[pos[0], pos[1] + bob, pos[2]]} rotation={[0, 0, tilt]} layers={NOINK}>
    <planeGeometry args={size} />
    <meshBasicMaterial map={tex} transparent alphaTest={0.04} opacity={opacity} side={THREE.DoubleSide} toneMapped={false} />
  </mesh>
);

type ChesterExpr = "closed" | "singing" | "triumph";
const Chester: React.FC<{ pos: [number, number, number]; scale?: number; tilt?: number; expr: ChesterExpr; bob?: number; opacity?: number }> = ({ pos, scale = 1, tilt = 0, expr, bob = 0, opacity = 1 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const tC = useTex("chester_closed.png");
  const tS = useTex("chester_singing.png");
  const tT = useTex("chester_triumph.png");
  const tex = expr === "closed" ? tC : expr === "triumph" ? tT : tS;
  const breath = 1 + 0.012 * Math.sin(t * Math.PI * 1.4);
  const effort = expr === "singing" ? 1 + 0.015 * Math.abs(Math.sin(t * 3.0)) : 1;
  const s = scale * breath * effort;
  return <Sprite tex={tex} pos={pos} size={[2.6 * s, 3.6 * s]} tilt={tilt} bob={bob} opacity={opacity} />;
};

type JayzExpr = "skeptical" | "surprised" | "confident" | "mic" | "nod";
const JayZ: React.FC<{ pos: [number, number, number]; scale?: number; tilt?: number; expr: JayzExpr; bob?: number; opacity?: number }> = ({ pos, scale = 1, tilt = 0, expr, bob = 0, opacity = 1 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const tSk = useTex("jayz_skeptical.png");
  const tSu = useTex("jayz_surprised.png");
  const tCo = useTex("jayz_confident.png");
  const tMi = useTex("jayz_mic.png");
  const tNo = useTex("jayz_nod.png");
  const tex = expr === "skeptical" ? tSk : expr === "surprised" ? tSu : expr === "mic" ? tMi : expr === "nod" ? tNo : tCo;
  const sway = 1 + 0.01 * Math.sin(t * 1.6 + 0.5);
  const s = scale * sway;
  return <Sprite tex={tex} pos={pos} size={[2.55 * s, 3.55 * s]} tilt={tilt} bob={bob} opacity={opacity} />;
};

const MikeSilhouette: React.FC<{ pos: [number, number, number]; scale?: number; bob?: number }> = ({ pos, scale = 1, bob = 0 }) => {
  const tex = useTex("mike_silhouette.png");
  return <Sprite tex={tex} pos={pos} size={[2.4 * scale, 3.4 * scale]} bob={bob} opacity={0.95} />;
};

const Envelope: React.FC<{ pos: [number, number, number]; scale?: number; tilt?: number }> = ({ pos, scale = 1, tilt = 0 }) => (
  <group position={pos} rotation={[0, 0, tilt]} scale={scale}>
    <mesh layers={NOINK}>
      <planeGeometry args={[0.5, 0.32]} />
      <meshBasicMaterial color="#f2eee6" transparent opacity={0.95} toneMapped={false} />
    </mesh>
    <mesh layers={NOINK} position={[0, 0.04, 0.01]}>
      <planeGeometry args={[0.5, 0.22]} />
      <meshBasicMaterial color="#e6dfcf" transparent opacity={0.9} toneMapped={false} />
    </mesh>
  </group>
);

const Divider: React.FC<{ height?: number; glow?: number }> = ({ height = 6, glow = 0.4 }) => (
  <group position={[0, height / 2 - 0.2, -0.5]}>
    <mesh>
      <boxGeometry args={[0.08, height, 0.3]} />
      <meshBasicMaterial color="#e8f4ff" transparent opacity={0.25} toneMapped={false} />
    </mesh>
    <mesh position={[0, 0, 0.05]} layers={NOINK}>
      <planeGeometry args={[0.18, height]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={glow} toneMapped={false} />
    </mesh>
  </group>
);

const CrowdSilhouettes: React.FC<{ mode: "idle" | "hype"; golden?: boolean }> = ({ mode, golden = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const people = useMemo(() => Array.from({ length: 60 }, (_, i) => ({
    x: (i / 59 - 0.5) * 12 + (Math.random() - 0.5) * 0.3,
    h: 0.5 + Math.random() * 0.4,
    w: 0.18 + Math.random() * 0.1,
    ph: Math.random() * Math.PI * 2,
    z: -6 - Math.random() * 3,
  })), []);
  const amp = mode === "hype" ? 0.09 : 0.02;
  const arm = mode === "hype" ? 0.18 : 0.04;
  const col = golden ? "#1b130a" : "#0b0b12";
  return (
    <group>
      {people.map((p, i) => {
        const bounce = Math.abs(Math.sin(t * (mode === "hype" ? 4.0 : 1.2) + p.ph)) * amp;
        const armsUp = mode === "hype" ? (Math.sin(t * 3.5 + p.ph) > 0.2 ? arm : arm * 0.3) : 0;
        return (
          <group key={i} position={[p.x, 0.4 + bounce, p.z]}>
            <mesh layers={NOINK} position={[0, p.h * 0.7 + armsUp, 0]}>
              <sphereGeometry args={[p.w * 0.35, 8, 8]} />
              <meshBasicMaterial color={col} transparent opacity={0.85} toneMapped={false} />
            </mesh>
            <mesh layers={NOINK} position={[0, p.h * 0.25, 0]}>
              <capsuleGeometry args={[p.w * 0.28, p.h * 0.45, 4, 8]} />
              <meshBasicMaterial color={col} transparent opacity={0.85} toneMapped={false} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

const RockSide: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2.2, 0, -1]}><planeGeometry args={[6, 10]} /><meshLambertMaterial color="#1a0f12" transparent opacity={opacity} /></mesh>
    <mesh position={[-4.8, 2.4, -2.5]}><boxGeometry args={[0.3, 5, 8]} /><meshLambertMaterial color="#140c10" transparent opacity={opacity} /></mesh>
    <mesh position={[-2.2, 2.4, -4.2]}><boxGeometry args={[6, 5, 0.3]} /><meshLambertMaterial color="#1b1014" transparent opacity={opacity} /></mesh>
    {/* amps */}
    <mesh position={[-3.6, 0.7, -2.2]}><boxGeometry args={[0.9, 1.2, 0.7]} /><meshLambertMaterial color="#17171b" /></mesh>
    <mesh position={[-3.6, 1.5, -2.2]}><boxGeometry args={[0.85, 0.5, 0.65]} /><meshLambertMaterial color="#111115" /></mesh>
    <mesh position={[-3.2, 0.6, -1.2]}><boxGeometry args={[0.7, 1.0, 0.6]} /><meshLambertMaterial color="#19191d" /></mesh>
    <pointLight position={[-2.4, 3.6, -1.0]} intensity={1.4} color="#ff3344" distance={8} />
    <pointLight position={[-3.2, 2.4, -2.2]} intensity={0.8} color="#2a6cff" distance={7} />
  </group>
);

const HipHopSide: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2.2, 0, -1]}><planeGeometry args={[6, 10]} /><meshLambertMaterial color="#0f0f12" transparent opacity={opacity} /></mesh>
    <mesh position={[4.8, 2.4, -2.5]}><boxGeometry args={[0.3, 5, 8]} /><meshLambertMaterial color="#0b0b10" transparent opacity={opacity} /></mesh>
    <mesh position={[2.2, 2.4, -4.2]}><boxGeometry args={[6, 5, 0.3]} /><meshLambertMaterial color="#101014" transparent opacity={opacity} /></mesh>
    {/* speakers */}
    <mesh position={[3.6, 0.8, -2.0]}><boxGeometry args={[0.7, 1.4, 0.6]} /><meshLambertMaterial color="#141418" /></mesh>
    <mesh position={[3.2, 0.6, -1.2]}><boxGeometry args={[0.6, 1.0, 0.5]} /><meshLambertMaterial color="#101014" /></mesh>
    <pointLight position={[2.4, 3.6, -1.0]} intensity={1.3} color="#ffd36b" distance={8} />
    <pointLight position={[3.0, 2.6, -2.0]} intensity={0.7} color="#ffcc66" distance={7} />
  </group>
);

const FusionStage: React.FC<{ golden?: boolean }> = ({ golden = false }) => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -1]}><planeGeometry args={[16, 14]} /><meshLambertMaterial color={golden ? "#1a140e" : "#151218"} /></mesh>
    <mesh position={[0, 2.8, -5.0]}><boxGeometry args={[14, 6, 0.4]} /><meshLambertMaterial color={golden ? "#241a10" : "#181422"} /></mesh>
    {/* mixed lights rigs */}
    <pointLight position={[-2.8, 4.2, -1.2]} intensity={1.8} color="#ff3344" distance={10} />
    <pointLight position={[2.8, 4.2, -1.2]} intensity={1.8} color="#ffd36b" distance={10} />
    <pointLight position={[0, 4.5, -2.0]} intensity={1.6} color={golden ? "#fff0cc" : "#ffffff"} distance={12} />
    {/* amps left hint + speakers right hint */}
    <mesh position={[-4.2, 0.7, -2.6]}><boxGeometry args={[0.9, 1.2, 0.7]} /><meshLambertMaterial color="#17171b" /></mesh>
    <mesh position={[4.2, 0.8, -2.6]}><boxGeometry args={[0.7, 1.4, 0.6]} /><meshLambertMaterial color="#141418" /></mesh>
  </group>
);

const Smoke: React.FC<{ intensity?: number }> = ({ intensity = 0.18 }) => {
  const pts = useMemo(() => Array.from({ length: 18 }, () => ({
    x: (Math.random() - 0.5) * 6, y: 0.2 + Math.random() * 1.2, z: -1.5 + Math.random() * 2.5, r: 0.5 + Math.random() * 0.7, ph: Math.random() * Math.PI * 2
  })), []);
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const t = frame / fps;
  return <group>{pts.map((p,i)=>{
    const y = p.y + Math.sin(t*0.4 + p.ph)*0.15;
    return <mesh key={i} position={[p.x,y,p.z]} layers={NOINK}><sphereGeometry args={[p.r, 10, 10]} /><meshBasicMaterial color="#ffffff" transparent opacity={intensity} toneMapped={false} /></mesh>;
  })}</group>;
};

const ParticlesGold: React.FC = () => {
  const pts = useMemo(() => Array.from({ length: 40 }, () => ({ x: (Math.random() - 0.5) * 6, y: 0.5 + Math.random() * 3.2, z: -1 + Math.random() * 2, ph: Math.random() * Math.PI * 2, sp: 0.2 + Math.random() * 0.4 })), []);
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const t = frame / fps;
  return <group>{pts.map((p, i) => {
    const y = p.y + Math.sin(t * p.sp + p.ph) * 0.2;
    const o = 0.15 + 0.3 * Math.abs(Math.sin(t * 0.8 + p.ph));
    return <mesh key={i} position={[p.x, y, p.z]} layers={NOINK}><sphereGeometry args={[0.03, 6, 6]} /><meshBasicMaterial color="#ffe6a8" transparent opacity={o} toneMapped={false} /></mesh>;
  })}</group>;
};

const World: React.FC<{ time: number }> = ({ time }) => {
  const { id, local, dur } = sceneInfo(time);
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const t = frame / fps;

  const sky = id === "fusion" || id === "grammy" ? "#1a120c" : id === "cta" ? "#1f160c" : "#0b0a12";
  const fogC = id === "fusion" || id === "grammy" ? "#3a2414" : id === "cta" ? "#3b2712" : "#151525";

  // Character expressions/poses per scene (synced to story/cues)
  let chExpr: ChesterExpr = "closed";
  let jzExpr: JayzExpr = "confident";
  if (id === "hook") { chExpr = "closed"; jzExpr = "skeptical"; }
  else if (id === "send") { chExpr = "closed"; jzExpr = local < dur * 0.55 ? "surprised" : "confident"; }
  else if (id === "meet") { chExpr = local < dur * 0.5 ? "closed" : "singing"; jzExpr = local < dur * 0.5 ? "confident" : "nod"; }
  else if (id === "fusion") { chExpr = "singing"; jzExpr = "mic"; }
  else if (id === "grammy") { chExpr = "singing"; jzExpr = "mic"; }
  else { chExpr = "triumph"; jzExpr = "nod"; }

  const bobC = (id === "fusion" || id === "grammy") ? Math.abs(Math.sin(t * 2.6)) * 0.03 : Math.sin(t * 1.2) * 0.01;
  const bobJ = (id === "fusion" || id === "grammy") ? Math.abs(Math.sin(t * 2.2 + 1)) * 0.025 : Math.sin(t * 1.1 + 0.5) * 0.01;

  return (
    <group>
      <color attach="background" args={[sky]} />
      <fog attach="fog" args={[fogC, 6, 26]} />
      <ambientLight intensity={id === "fusion" || id === "grammy" ? 0.5 : 0.4} color={id === "fusion" || id === "grammy" ? "#ffe4c0" : "#d8e4ff"} />

      {/* Cena 1: Hook - tela dividida (esq rock, dir hip-hop) */}
      {id === "hook" && (
        <group>
          <RockSide /><HipHopSide /><Divider glow={0.35} />
          <Suspense fallback={null}><Chester pos={[-2.0, 1.55, -0.9]} scale={1.08} expr={chExpr} bob={bobC} /></Suspense>
          <Suspense fallback={null}><JayZ pos={[2.0, 1.52, -0.9]} scale={1.06} expr={jzExpr} bob={bobJ} /></Suspense>
        </group>
      )}

      {/* Cena 2: Envio - alternada (Mike estúdio -> Jay-Z estúdio) */}
      {id === "send" && (
        <group>
          {local < dur * 0.52 ? (
            <group>
              {/* estúdio de Mike (silhueta enviando) */}
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0,0,-1]}><planeGeometry args={[10,10]} /><meshLambertMaterial color="#14121a" /></mesh>
              <mesh position={[0,2.4,-3.8]}><boxGeometry args={[10,5,0.3]} /><meshLambertMaterial color="#1a1824" /></mesh>
              <pointLight position={[-1.5,3.2,-1.5]} intensity={0.9} color="#7fd4ff" distance={8} />
              <pointLight position={[1.8,2.6,-1.8]} intensity={0.7} color="#ffd36b" distance={7} />
              <Suspense fallback={null}><MikeSilhouette pos={[-0.6, 1.45, -1.2]} scale={1.05} bob={Math.sin(t*1.2)*0.01} /></Suspense>
              {/* envelope voando (enviado) */}
              <Envelope pos={[0.2 + local * 0.12, 1.9 + Math.sin(local*1.5)*0.1, -0.8]} scale={1.0} tilt={-0.2 + Math.sin(local*2)*0.1} />
            </group>
          ) : (
            <group>
              {/* estúdio hip-hop minimalista, Jay-Z com fones/surpresa */}
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0,0,-1]}><planeGeometry args={[10,10]} /><meshLambertMaterial color="#101014" /></mesh>
              <mesh position={[0,2.4,-3.8]}><boxGeometry args={[10,5,0.3]} /><meshLambertMaterial color="#141418" /></mesh>
              <pointLight position={[0.5,3.4,-1.2]} intensity={1.2} color="#ffd36b" distance={8} />
              <pointLight position={[-1.8,2.6,-2.0]} intensity={0.5} color="#ffe6a8" distance={7} />
              {/* fones simples sugeridos */}
              <mesh position={[-0.35, 2.55, -0.75]}><torusGeometry args={[0.28, 0.04, 8, 20, Math.PI]} /><meshLambertMaterial color="#222" /></mesh>
              <mesh position={[-0.62, 2.35, -0.72]}><boxGeometry args={[0.12,0.2,0.12]} /><meshLambertMaterial color="#1a1a1e" /></mesh>
              <mesh position={[-0.08, 2.35, -0.72]}><boxGeometry args={[0.12,0.2,0.12]} /><meshLambertMaterial color="#1a1a1e" /></mesh>
              <Suspense fallback={null}><JayZ pos={[-0.2, 1.5, -0.9]} scale={1.1} expr={jzExpr} bob={Math.sin(t*1.3)*0.012} /></Suspense>
            </group>
          )}
        </group>
      )}

      {/* Cena 3: Encontro - tela dividida dinâmica */}
      {id === "meet" && (
        <group>
          <RockSide /><HipHopSide />
          <Divider glow={0.55 + 0.15 * Math.sin(t * 3)} />
          <Suspense fallback={null}><Chester pos={[-2.0, 1.55, -0.85]} scale={1.1} expr={chExpr} bob={bobC} tilt={Math.sin(t*0.8)*0.01} /></Suspense>
          <Suspense fallback={null}><JayZ pos={[2.0, 1.52, -0.85]} scale={1.08} expr={jzExpr} bob={bobJ} tilt={-Math.sin(t*0.8)*0.01} /></Suspense>
          {/* leve energia no encontro */}
          <pointLight position={[0,3.2,-1.0]} intensity={0.8 + 0.3*Math.sin(t*2)} color="#ffe0b0" distance={6} />
        </group>
      )}

      {/* Cena 4: Fusão - PLANO GERAL WIDE, mesmo palco, Chester esq / Jay-Z dir, sem divisão */}
      {id === "fusion" && (
        <group>
          <FusionStage />
          <CrowdSilhouettes mode="hype" golden={false} />
          <Smoke intensity={0.16} />
          <Suspense fallback={null}><Chester pos={[-2.3, 1.58, -0.9]} scale={1.12} expr={chExpr} bob={bobC} /></Suspense>
          <Suspense fallback={null}><JayZ pos={[2.3, 1.55, -0.9]} scale={1.1} expr={jzExpr} bob={bobJ} /></Suspense>
        </group>
      )}

      {/* Cena 5: Grammy Lendário - alternado rápido + WIDE, palco dourado/branco, público delírio */}
      {id === "grammy" && (
        <group>
          <FusionStage golden />
          <CrowdSilhouettes mode="hype" golden />
          <Smoke intensity={0.14} />
          <pointLight position={[0,4.6,-1.5]} intensity={2.0 + Math.sin(t*8)*0.4} color="#fff6d8" distance={12} />
          <Suspense fallback={null}><Chester pos={[-2.2, 1.58, -0.9]} scale={1.12} expr={chExpr} bob={bobC} /></Suspense>
          <Suspense fallback={null}><JayZ pos={[2.2, 1.55, -0.9]} scale={1.1} expr={jzExpr} bob={bobJ} /></Suspense>
        </group>
      )}

      {/* Cena 6: CTA - tela dividida final, fundo gradiente dourado com partículas */}
      {id === "cta" && (
        <group>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0,0,-1]}><planeGeometry args={[14,12]} /><meshLambertMaterial color="#2a1b0b" /></mesh>
          <mesh position={[0,2.6,-4.2]}><planeGeometry args={[12,6]} /><meshBasicMaterial color="#3a2410" transparent opacity={0.8} toneMapped={false} /></mesh>
          <pointLight position={[-1.8,3.2,-1.2]} intensity={1.1} color="#ffd36b" distance={8} />
          <pointLight position={[1.8,3.2,-1.2]} intensity={1.1} color="#ffe0a0" distance={8} />
          <Divider glow={0.25} height={5.5} />
          <ParticlesGold />
          <Suspense fallback={null}><Chester pos={[-2.0, 1.55, -0.85]} scale={1.1} expr={chExpr} bob={Math.sin(t*1.0)*0.01} /></Suspense>
          <Suspense fallback={null}><JayZ pos={[2.0, 1.52, -0.85]} scale={1.08} expr={jzExpr} bob={Math.sin(t*1.0+1)*0.01} /></Suspense>
        </group>
      )}
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
  let focusTarget = new THREE.Vector3(0, 1.7, -0.9);

  if (id === "hook") {
    // tela dividida: mostrar ambos separados (Chester esq, Jay-Z dir)
    if (p < 0.5) { pos.set(0, 1.85, 4.6); look.set(0, 1.55, -0.9); focusTarget.set(0, 1.55, -0.9); }
    else { pos.set(0.15, 1.8, 4.3); look.set(0, 1.55, -0.9); focusTarget.set(0.5, 1.55, -0.9); }
  } else if (id === "send") {
    // alternada: primeiro Mike (envio), depois Jay-Z (surpresa)
    if (local < dur * 0.52) {
      const pp = clamp01(local / (dur * 0.52));
      pos.set(-0.2 + pp * 0.3, 1.8, 4.2 - pp * 0.2); look.set(0.0, 1.6, -1.0); focusTarget.set(-0.2, 1.6, -1.0);
    } else {
      const pp = clamp01((local - dur * 0.52) / (dur * 0.48));
      if (pp < 0.5) { pos.set(-0.1, 1.85, 3.9); look.set(-0.2, 1.6, -0.9); focusTarget.set(-0.2, 1.55, -0.9); } // close Jay-Z surpresa
      else { pos.set(0.1, 1.9, 4.2); look.set(-0.15, 1.55, -0.9); focusTarget.set(-0.15, 1.55, -0.9); }
    }
  } else if (id === "meet") {
    // tela dividida dinâmica, encontro visual
    if (p < 0.45) { pos.set(0, 1.85, 4.5); look.set(0, 1.55, -0.85); focusTarget.set(0, 1.55, -0.85); }
    else if (p < 0.75) { pos.set(-0.25, 1.8, 4.2); look.set(-0.2, 1.55, -0.85); focusTarget.set(-1.0, 1.55, -0.85); } // pende Chester
    else { pos.set(0.25, 1.8, 4.2); look.set(0.2, 1.55, -0.85); focusTarget.set(1.0, 1.55, -0.85); } // pende Jay-Z
  } else if (id === "fusion") {
    // PLANO GERAL (WIDE) - fusão, ambos visíveis separados, multidão
    if (p < 0.55) { pos.set(0, 2.6, 7.6 - p * 0.4); look.set(0, 1.55, -1.6); focusTarget.set(0, 1.55, -1.2); } // WIDE 1
    else { pos.set(0.2, 2.3, 6.6); look.set(0, 1.55, -1.2); focusTarget.set(0, 1.55, -1.0); } // médio-wide energia
  } else if (id === "grammy") {
    // close alternado rápido + WIDE de contexto (WIDE 2)
    const seg = local;
    if (seg < 2.6) { pos.set(-0.6, 1.85, 4.0); look.set(-2.0, 1.6, -0.9); focusTarget.set(-2.2, 1.58, -0.9); } // close Chester
    else if (seg < 5.2) { pos.set(0.6, 1.85, 4.0); look.set(2.0, 1.58, -0.9); focusTarget.set(2.2, 1.55, -0.9); } // close Jay-Z
    else if (seg < 7.8) { pos.set(-0.4, 1.82, 3.9); look.set(-2.0, 1.6, -0.9); focusTarget.set(-2.2, 1.58, -0.9); } // Chester
    else { pos.set(0, 2.55, 7.4); look.set(0, 1.55, -1.6); focusTarget.set(0, 1.55, -1.2); } // WIDE 2 Grammy
  } else { // cta
    // tela dividida final + leve pullback
    const out = p > 0.7 ? (p - 0.7) / 0.3 : 0;
    pos.set(0, 1.85, 4.4 + out * 0.3); look.set(0, 1.55, -0.85); focusTarget.set(0, 1.55, -0.85);
  }

  cam.position.copy(pos);
  cam.lookAt(look);
  cam.fov = (id === "fusion" || (id === "grammy" && local >= 7.8)) ? 44 : 41;
  cam.near = 0.1; cam.far = 140;
  cam.updateProjectionMatrix();

  const fx = useMemo(() => ({
    ink: new InkPass(scene, cam, { strength: 0.82, widthNear: 4.4, widthFar: 2.8 }),
    lens: new LensBlur({ maxCoC: 20, nearScale: 1.05 }),
    bloom: new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.5, luminanceThreshold: 0.92, luminanceSmoothing: 0.25, mipmapBlur: true, levels: 5, radius: 0.6 }),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(GRADES.day, GRADE_STRENGTH.day),
  }), [scene, cam]);
  useEffect(() => () => fx.ink.dispose(), [fx]);

  const golden = id === "fusion" || id === "grammy" || id === "cta";
  fx.lens.focus = Math.max(0.5, pos.distanceTo(focusTarget));
  fx.lens.cInf = golden ? 2.4 : 2.8;
  fx.grade.set(golden ? GRADES.golden : GRADES.day);
  fx.grade.amount = golden ? GRADE_STRENGTH.golden : 0.85;
  (fx.bloom as BloomEffect).intensity = id === "fusion" ? 0.75 : id === "grammy" ? 0.85 : golden ? 0.55 : 0.45;

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
  right: "13%", // ~10% lateral direita reservada
  top: "10%",
  bottom: "22%", // ~20% inferior reservado
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "center",
  textAlign: "center",
  fontFamily: '"Montserrat","Bebas Neue","Poppins","Arial Black","Arial",sans-serif',
  fontWeight: 900,
  lineHeight: 1.05,
  color: "#ffffff",
  textShadow: "0 4px 0 rgba(0,0,0,0.65), 0 10px 30px rgba(0,0,0,0.65), 3px 3px 0 #000, -3px -3px 0 #000, 3px -3px 0 #000, -3px 3px 0 #000",
  letterSpacing: 1.5,
  pointerEvents: "none",
  whiteSpace: "pre-line",
};

const TextPop: React.FC<{ text: string; fromSec: number; toSec: number; top?: string; fontSize?: number; accent?: boolean; accentColor?: string }> = ({ text, fromSec, toSec, top = "11%", fontSize = 62, accent = false, accentColor = "#FFD54A" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  if (t < fromSec || t > toSec) return null;
  const local = t - fromSec;
  const enter = Math.min(1, local / 0.16);
  const exit = Math.min(1, Math.max(0, (toSec - t) / 0.22));
  const opacity = clamp01(enter) * clamp01(exit);
  const y = (1 - clamp01(enter)) * 32;
  const sc = 0.84 + 0.16 * clamp01(enter);
  const color = accent ? accentColor : "#ffffff";
  return <div style={{ ...overlayBase, top, fontSize, color, opacity, transform: `translateY(${y}px) scale(${sc})` }}>{text}</div>;
};

export const LinkinParkJayz: React.FC = () => {
  const cues = (wordsData as any).cues as { start: number; end: number; text: string }[];
  // cue helpers for sync
  const c = (i: number) => cues[i] || { start: 0, end: 0, text: "" };
  const durationSec = JAYZ_TOTAL_DUR;
  return (
    <AbsoluteFill style={{ backgroundColor: "#0b0a12" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@800;900&family=Bebas+Neue&display=swap');`}</style>
      <ThreeCanvas width={1080} height={1920} camera={{ fov: 42, position: [0, 1.85, 4.6], near: 0.1, far: 140 }} gl={{ antialias: false, stencil: false, powerPreference: "high-performance", toneMappingExposure: 1.0 }}>
        <SceneRoot />
      </ThreeCanvas>

      {/* Textos dinâmicos sincronizados aos cues/words.json (zonas seguras) */}
      <TextPop text={"UMA PEGADINHA?"} fromSec={Math.max(0.3, c(0).start)} toSec={Math.min(6.0, c(0).end + 0.2)} top="12%" fontSize={72} accent accentColor="#FFD54A" />
      <TextPop text={"MIKE SHINODA\nENVIOU O MASHUP"} fromSec={c(1).start} toSec={c(1).end - 0.2} top="12%" fontSize={54} />
      <TextPop text={"\"ISSO NÃO PODE\nSER SÉRIO\""} fromSec={c(2).start} toSec={c(2).end + 0.2} top="13%" fontSize={56} accent accentColor="#ff3b3b" />
      <TextPop text={"ROCK + RAP\nSE ENCAIXAVAM"} fromSec={c(4).start - 0.1} toSec={c(4).end + 0.3} top="13%" fontSize={58} accent accentColor="#FFD54A" />
      <TextPop text={"GRAVARAM JUNTOS"} fromSec={c(5).start} toSec={c(5).end + 0.2} top="13%" fontSize={62} />
      <TextPop text={"COLLISION COURSE"} fromSec={c(7).start + 0.2} toSec={c(7).start + 2.6} top="13%" fontSize={60} accent accentColor="#FFD54A" />
      <TextPop text={"GRAMMY 2006\nLENDÁRIO"} fromSec={c(7).start + 2.7} toSec={c(7).end + 0.4} top="12%" fontSize={58} accent accentColor="#ffffff" />
      <TextPop text={"DOIS MUNDOS\nOPOSTOS"} fromSec={c(8).start} toSec={c(8).start + 2.2} top="13%" fontSize={60} />
      <TextPop text={"ALGO ÚNICO"} fromSec={c(8).start + 2.3} toSec={c(8).end + 0.6} top="14%" fontSize={70} accent accentColor="#FFD54A" />
      <TextPop text={"ROCK OU RAP?"} fromSec={c(9).start} toSec={c(10).start + 1.2} top="12%" fontSize={70} accent accentColor="#ffffff" />
      <TextPop text={"COMENTA QUAL LADO\nVOCÊ CURTE MAIS 👇"} fromSec={c(10).start + 1.3} toSec={durationSec} top="12%" fontSize={52} accent accentColor="#FFD54A" />

      {/* Áudio (voz dominante) */}
      <Audio src={staticFile("linkin-park-jayz/voice.wav")} />
      <Audio src={staticFile("linkin-park-jayz/music.mp3")} volume={0.1} />
      {/* SFX discretos */}
      <Sequence from={Math.floor(11.0 * JAYZ_FPS)} durationInFrames={Math.floor(0.6 * JAYZ_FPS)}>
        <Audio src={staticFile("linkin-park-jayz/sfx_whoosh.wav")} volume={0.18} />
      </Sequence>
      <Sequence from={Math.floor(30.0 * JAYZ_FPS)} durationInFrames={Math.floor(3.0 * JAYZ_FPS)}>
        <Audio src={staticFile("linkin-park-jayz/sfx_crowd.wav")} volume={0.14} />
      </Sequence>
      <Sequence from={Math.floor(45.0 * JAYZ_FPS)} durationInFrames={Math.floor(3.0 * JAYZ_FPS)}>
        <Audio src={staticFile("linkin-park-jayz/sfx_crowd.wav")} volume={0.18} />
      </Sequence>
      <Sequence from={Math.floor(52.0 * JAYZ_FPS)} durationInFrames={Math.floor(0.25 * JAYZ_FPS)}>
        <Audio src={staticFile("linkin-park-jayz/sfx_flash.wav")} volume={0.16} />
      </Sequence>
      <Sequence from={Math.floor(55.0 * JAYZ_FPS)} durationInFrames={Math.floor(0.25 * JAYZ_FPS)}>
        <Audio src={staticFile("linkin-park-jayz/sfx_flash.wav")} volume={0.14} />
      </Sequence>
      <Sequence from={Math.floor(58.0 * JAYZ_FPS)} durationInFrames={Math.floor(0.25 * JAYZ_FPS)}>
        <Audio src={staticFile("linkin-park-jayz/sfx_flash.wav")} volume={0.14} />
      </Sequence>
    </AbsoluteFill>
  );
};

export default LinkinParkJayz;
