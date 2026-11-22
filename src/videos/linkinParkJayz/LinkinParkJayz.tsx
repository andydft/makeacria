import React, { useEffect, Suspense, useMemo } from "react";
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
export const JAYZ_TOTAL_DUR = 70.0;
export const JAYZ_FRAMES = Math.ceil(JAYZ_TOTAL_DUR * JAYZ_FPS);

// 6 cenas (janelas alinhadas a words.json/cues com cauda visual)
const SCENES = [
  { id: "hook",   a: 0.0,  b: 10.5 },  // 1 Hook / Pegadinha - split (ambos visíveis)
  { id: "send",   a: 10.5, b: 22.5 },  // 2 Envio - foco específico: Mike, depois Jay-Z
  { id: "meet",   a: 22.5, b: 35.5 },  // 3 Encontro - split dinâmico (ambos visíveis)
  { id: "fusion", a: 35.5, b: 49.5 },  // 4 Fusão - WIDE 1 (ambos visíveis, separados)
  { id: "grammy", a: 49.5, b: 61.5 },  // 5 Grammy - ênfase alternada + WIDE 2 (ambos sempre visíveis)
  { id: "cta",    a: 61.5, b: 70.0 },  // 6 CTA - split final (ambos visíveis)
] as const;
type SceneId = (typeof SCENES)[number]["id"];

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

const Sprite: React.FC<{ tex: THREE.Texture; pos: [number, number, number]; size: [number, number]; opacity?: number }> = ({ tex, pos, size, opacity = 1 }) => (
  <mesh position={pos} layers={NOINK}>
    <planeGeometry args={size} />
    <meshBasicMaterial map={tex} transparent alphaTest={0.05} opacity={opacity} side={THREE.DoubleSide} toneMapped={false} depthWrite={false} />
  </mesh>
);

type CExpr = "closed" | "singing" | "triumph";
const Chester: React.FC<{ pos: [number, number, number]; scale?: number; expr: CExpr }> = ({ pos, scale = 1, expr }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const t = frame / fps;
  const tC = useTex("chester_closed.png");
  const tS = useTex("chester_singing.png");
  const tT = useTex("chester_triumph.png");
  const tex = expr === "closed" ? tC : expr === "triumph" ? tT : tS;
  const breathe = 1 + 0.012 * Math.sin(t * 2.2);
  const bob = (expr === "singing" ? Math.abs(Math.sin(t * 2.6)) * 0.03 : Math.sin(t * 1.2) * 0.01);
  const s = scale * breathe;
  return <Sprite tex={tex} pos={[pos[0], pos[1] + bob, pos[2]]} size={[2.35 * s, 3.3 * s]} />;
};

type JExpr = "skeptical" | "surprised" | "confident" | "mic" | "nod";
const JayZ: React.FC<{ pos: [number, number, number]; scale?: number; expr: JExpr }> = ({ pos, scale = 1, expr }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const t = frame / fps;
  const tSk = useTex("jayz_skeptical.png");
  const tSu = useTex("jayz_surprised.png");
  const tCo = useTex("jayz_confident.png");
  const tMi = useTex("jayz_mic.png");
  const tNo = useTex("jayz_nod.png");
  const tex = expr === "skeptical" ? tSk : expr === "surprised" ? tSu : expr === "mic" ? tMi : expr === "nod" ? tNo : tCo;
  const sway = 1 + 0.01 * Math.sin(t * 1.6 + 0.7);
  const bob = (expr === "mic" ? Math.abs(Math.sin(t * 2.3 + 1)) * 0.025 : Math.sin(t * 1.1 + 0.5) * 0.01);
  const s = scale * sway;
  return <Sprite tex={tex} pos={[pos[0], pos[1] + bob, pos[2]]} size={[2.3 * s, 3.25 * s]} />;
};

const MikeSil: React.FC<{ pos: [number, number, number]; scale?: number }> = ({ pos, scale = 1 }) => {
  const tex = useTex("mike_silhouette.png");
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const t = frame / fps;
  return <Sprite tex={tex} pos={[pos[0], pos[1] + Math.sin(t*1.2)*0.01, pos[2]]} size={[2.2 * scale, 3.15 * scale]} />;
};

const DividerLine: React.FC<{ height?: number }> = ({ height = 5.5 }) => (
  <group position={[0, 1.55, -0.15]}>
    <mesh>
      <boxGeometry args={[0.05, height, 0.15]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.75} toneMapped={false} />
    </mesh>
    <mesh position={[0,0,0.04]}>
      <planeGeometry args={[0.12, height]} />
      <meshBasicMaterial color="#cfefff" transparent opacity={0.25} toneMapped={false} />
    </mesh>
  </group>
);

const Crowd: React.FC<{ golden?: boolean; hype?: boolean }> = ({ golden = false, hype = false }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const t = frame / fps;
  const people = useMemo(() => Array.from({ length: 70 }, (_, i) => ({
    x: (i / 69 - 0.5) * 14,
    h: 0.45 + Math.random() * 0.35,
    w: 0.16 + Math.random() * 0.08,
    z: -5.5 - Math.random() * 4.0,
    ph: Math.random() * Math.PI * 2,
  })), []);
  const col = golden ? "#1a1209" : "#0c0c14";
  const amp = hype ? 0.1 : 0.03;
  const spd = hype ? 4.0 : 1.5;
  return (
    <group>
      {people.map((p, i) => {
        const b = Math.abs(Math.sin(t * spd + p.ph)) * amp;
        const arms = hype ? 0.18 + 0.08 * Math.sin(t * spd + p.ph) : 0.04;
        return (
          <group key={i} position={[p.x, 0.3 + b, p.z]}>
            <mesh layers={NOINK} position={[0, p.h * 0.7 + arms, 0]}><sphereGeometry args={[p.w * 0.35, 8, 8]} /><meshBasicMaterial color={col} transparent opacity={0.9} toneMapped={false} /></mesh>
            <mesh layers={NOINK} position={[0, p.h * 0.25, 0]}><capsuleGeometry args={[p.w * 0.28, p.h * 0.45, 4, 8]} /><meshBasicMaterial color={col} transparent opacity={0.9} toneMapped={false} /></mesh>
          </group>
        );
      })}
    </group>
  );
};

const Particles: React.FC<{ color?: string }> = ({ color = "#ffe6a8" }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const t = frame / fps;
  const pts = useMemo(() => Array.from({ length: 35 }, () => ({ x: (Math.random()-0.5)*6, y: 0.6+Math.random()*3.2, z: -0.8+Math.random()*1.8, ph: Math.random()*Math.PI*2, sp: 0.2+Math.random()*0.4 })), []);
  return <group>{pts.map((p,i)=>{ const y=p.y+Math.sin(t*p.sp+p.ph)*0.2; const o=0.15+0.3*Math.abs(Math.sin(t*0.8+p.ph)); return <mesh key={i} position={[p.x,y,p.z]} layers={NOINK}><sphereGeometry args={[0.03,6,6]} /><meshBasicMaterial color={color} transparent opacity={o} toneMapped={false} /></mesh>; })}</group>;
};

const StageEnv: React.FC<{ mode: "split" | "rock" | "hiphop" | "fusion" | "grammy" | "cta"; leftRock?: boolean; rightHip?: boolean }> = ({ mode, leftRock = true, rightHip = true }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const t = frame / fps;
  const flash = mode === "grammy" ? 0.3 * Math.max(0, Math.sin(t * 8)) : 0;
  return (
    <group>
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,0,0]}><planeGeometry args={[18,16]} /><meshLambertMaterial color={mode === "fusion" || mode === "grammy" ? "#1a1512" : mode === "cta" ? "#24180c" : "#151420"} /></mesh>
      <mesh position={[0,2.8,-5.2]}><boxGeometry args={[16,6,0.4]} /><meshLambertMaterial color={mode === "fusion" || mode === "grammy" ? "#221a14" : mode === "cta" ? "#2d1d10" : "#1a1824"} /></mesh>
      {mode === "split" && leftRock && <mesh position={[-1.8,2.2,-4.9]}><planeGeometry args={[3.6,4.5]} /><meshBasicMaterial color="#2a1014" toneMapped={false} /></mesh>}
      {mode === "split" && rightHip && <mesh position={[1.8,2.2,-4.9]}><planeGeometry args={[3.6,4.5]} /><meshBasicMaterial color="#1a160e" toneMapped={false} /></mesh>}
      {mode === "rock" && <mesh position={[0,2.2,-4.9]}><planeGeometry args={[10,4.5]} /><meshBasicMaterial color="#2a1014" toneMapped={false} /></mesh>}
      {mode === "hiphop" && <mesh position={[0,2.2,-4.9]}><planeGeometry args={[10,4.5]} /><meshBasicMaterial color="#1a160e" toneMapped={false} /></mesh>}
      {mode === "fusion" && <mesh position={[0,2.2,-4.9]}><planeGeometry args={[12,4.8]} /><meshBasicMaterial color="#24160f" toneMapped={false} /></mesh>}
      {mode === "grammy" && <mesh position={[0,2.2,-4.9]}><planeGeometry args={[12,4.8]} /><meshBasicMaterial color="#2a1e12" toneMapped={false} /></mesh>}
      {mode === "cta" && <mesh position={[0,2.2,-4.9]}><planeGeometry args={[10,4.8]} /><meshBasicMaterial color="#3a2412" toneMapped={false} /></mesh>}

      {(mode === "split" || mode === "fusion" || mode === "grammy") && (
        <group>
          <mesh position={[-3.8,0.7,-2.6]}><boxGeometry args={[0.9,1.2,0.7]} /><meshLambertMaterial color="#17171b" /></mesh>
          <mesh position={[-3.2,0.55,-1.8]}><boxGeometry args={[0.7,0.9,0.55]} /><meshLambertMaterial color="#141418" /></mesh>
          <pointLight position={[-2.0,3.6,-1.2]} intensity={1.4 + flash} color="#ff3344" distance={9} />
          <pointLight position={[-1.2,2.8,-2.0]} intensity={0.7} color="#2a6cff" distance={7} />
        </group>
      )}
      {(mode === "split" || mode === "fusion" || mode === "grammy") && (
        <group>
          <mesh position={[3.8,0.8,-2.4]}><boxGeometry args={[0.7,1.4,0.6]} /><meshLambertMaterial color="#141418" /></mesh>
          <mesh position={[3.2,0.55,-1.7]}><boxGeometry args={[0.55,0.9,0.5]} /><meshLambertMaterial color="#101014" /></mesh>
          <pointLight position={[2.0,3.6,-1.2]} intensity={1.3 + flash} color="#ffd36b" distance={9} />
          <pointLight position={[1.2,2.8,-2.0]} intensity={0.7} color="#ffcc66" distance={7} />
        </group>
      )}
      {mode === "rock" && <><pointLight position={[-0.8,3.4,-1.2]} intensity={1.3} color="#ff3344" distance={9} /><pointLight position={[0.8,3.0,-1.8]} intensity={0.6} color="#2a6cff" distance={7} /></>}
      {mode === "hiphop" && <><pointLight position={[0.6,3.4,-1.2]} intensity={1.2} color="#ffd36b" distance={9} /><pointLight position={[-0.6,2.8,-1.8]} intensity={0.5} color="#ffe0a0" distance={7} /></>}
      {(mode === "fusion" || mode === "grammy") && <pointLight position={[0,4.2,-1.5]} intensity={1.4 + flash} color={mode === "grammy" ? "#fff6d8" : "#ffe6c0"} distance={12} />}
      {mode === "cta" && <><pointLight position={[-1.4,3.2,-1.2]} intensity={1.0} color="#ffd36b" distance={8} /><pointLight position={[1.4,3.2,-1.2]} intensity={1.0} color="#ffe0a0" distance={8} /></>}
      <ambientLight intensity={mode === "fusion" || mode === "grammy" ? 0.55 : 0.45} color={mode === "fusion" || mode === "grammy" || mode === "cta" ? "#ffe4c0" : "#d8e4ff"} />
    </group>
  );
};

const Envelope: React.FC<{ pos: [number, number, number]; rot?: number }> = ({ pos, rot = 0 }) => (
  <group position={pos} rotation={[0,0,rot]}>
    <mesh layers={NOINK}><planeGeometry args={[0.45,0.28]} /><meshBasicMaterial color="#f3efe6" toneMapped={false} /></mesh>
    <mesh layers={NOINK} position={[0,0.03,0.01]}><planeGeometry args={[0.45,0.18]} /><meshBasicMaterial color="#e7decc" toneMapped={false} /></mesh>
  </group>
);

const World: React.FC<{ time: number }> = ({ time }) => {
  const { id, local, dur } = sceneInfo(time);
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const t = frame / fps;
  const p = smooth(local / dur);

  // expressões por cena/batida (sincronizadas à história)
  let cExpr: CExpr = "closed";
  let jExpr: JExpr = "confident";
  if (id === "hook") { cExpr = "closed"; jExpr = "skeptical"; }
  else if (id === "send") { cExpr = "closed"; jExpr = local < dur*0.55 ? "surprised" : "confident"; }
  else if (id === "meet") { cExpr = local < dur*0.45 ? "closed" : "singing"; jExpr = local < dur*0.45 ? "confident" : "nod"; }
  else if (id === "fusion") { cExpr = "singing"; jExpr = "mic"; }
  else if (id === "grammy") { cExpr = "singing"; jExpr = "mic"; }
  else { cExpr = "triumph"; jExpr = "nod"; }

  const sky = (id === "fusion" || id === "grammy") ? "#1a120c" : id === "cta" ? "#201409" : "#0c0b14";
  const fogC = (id === "fusion" || id === "grammy") ? "#3a2414" : id === "cta" ? "#3a2510" : "#17172a";

  // Chester SEMPRE à esquerda, Jay-Z SEMPRE à direita quando juntos.
  // Posições mais próximas do centro para ambos aparecerem inteiros na tela (sem cortes).
  const leftX = -0.62;
  const rightX = 0.62;
  const baseY = 1.5;
  const pairScale = 0.9;

  return (
    <group>
      <color attach="background" args={[sky]} />
      <fog attach="fog" args={[fogC, 7, 30]} />

      {id === "hook" && (
        <group>
          <StageEnv mode="split" />
          <DividerLine />
          {/* Ambos visíveis o tempo todo (início): Chester à esq, Jay-Z à dir */}
          <Suspense fallback={null}><Chester pos={[leftX, baseY, -0.75]} scale={pairScale} expr={cExpr} /></Suspense>
          <Suspense fallback={null}><JayZ pos={[rightX, baseY, -0.75]} scale={pairScale} expr={jExpr} /></Suspense>
        </group>
      )}

      {id === "send" && (
        <group>
          {local < dur * 0.52 ? (
            <group>
              {/* Foco específico: Mike Shinoda enviando o mashup */}
              <StageEnv mode="rock" />
              <Suspense fallback={null}><MikeSil pos={[0, baseY-0.05, -0.85]} scale={1.0} /></Suspense>
              <Envelope pos={[0.35 + local*0.12, 1.95 + Math.sin(local*1.6)*0.08, -0.45]} rot={-0.2 + Math.sin(local*2)*0.1} />
              <pointLight position={[0.8,3.2,-1.0]} intensity={0.9} color="#7fd4ff" distance={8} />
            </group>
          ) : (
            <group>
              {/* Foco específico: Jay-Z ouvindo/surpreso */}
              <StageEnv mode="hiphop" />
              <mesh position={[0.05, 2.55, -0.5]}><torusGeometry args={[0.24, 0.03, 8, 24, Math.PI]} /><meshLambertMaterial color="#222" /></mesh>
              <mesh position={[-0.18, 2.35, -0.48]}><boxGeometry args={[0.1,0.18,0.1]} /><meshLambertMaterial color="#1a1a1e" /></mesh>
              <mesh position={[0.28, 2.35, -0.48]}><boxGeometry args={[0.1,0.18,0.1]} /><meshLambertMaterial color="#1a1a1e" /></mesh>
              <Suspense fallback={null}><JayZ pos={[0.05, baseY, -0.75]} scale={1.05} expr={jExpr} /></Suspense>
            </group>
          )}
        </group>
      )}

      {id === "meet" && (
        <group>
          <StageEnv mode="split" />
          <DividerLine />
          {/* Ambos visíveis o tempo todo, se encontrando */}
          <Suspense fallback={null}><Chester pos={[leftX, baseY, -0.72]} scale={pairScale} expr={cExpr} /></Suspense>
          <Suspense fallback={null}><JayZ pos={[rightX, baseY, -0.72]} scale={pairScale} expr={jExpr} /></Suspense>
          <pointLight position={[0,3.0,-0.8]} intensity={0.7 + 0.2*Math.sin(t*2)} color="#ffe0b0" distance={6} />
        </group>
      )}

      {id === "fusion" && (
        <group>
          <StageEnv mode="fusion" />
          <Crowd golden={false} hype={p > 0.35} />
          <mesh layers={NOINK} position={[-1.2,0.6,-1.4]}><sphereGeometry args={[0.7,10,10]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.12} toneMapped={false} /></mesh>
          <mesh layers={NOINK} position={[1.2,0.7,-1.2]}><sphereGeometry args={[0.8,10,10]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.1} toneMapped={false} /></mesh>
          {/* WIDE 1: ambos visíveis e separados no mesmo palco (Chester esq, Jay-Z dir) */}
          <Suspense fallback={null}><Chester pos={[-1.4, baseY, -0.9]} scale={0.95} expr={cExpr} /></Suspense>
          <Suspense fallback={null}><JayZ pos={[1.4, baseY, -0.9]} scale={0.93} expr={jExpr} /></Suspense>
        </group>
      )}

      {id === "grammy" && (
        <group>
          <StageEnv mode="grammy" />
          <Crowd golden hype />
          <mesh layers={NOINK} position={[0,0.7,-1.4]}><sphereGeometry args={[0.9,10,10]} /><meshBasicMaterial color="#fff6d8" transparent opacity={0.1} toneMapped={false} /></mesh>
          {/* Ambos SEMPRE visíveis; ênfase alternada mas sem esconder ninguém (wide final = WIDE 2) */}
          <Suspense fallback={null}><Chester pos={[local >= 7.8 ? -1.4 : -0.85, baseY, -0.85]} scale={local >= 7.8 ? 0.95 : 0.92} expr={cExpr} /></Suspense>
          <Suspense fallback={null}><JayZ pos={[local >= 7.8 ? 1.4 : 0.85, baseY, -0.85]} scale={local >= 7.8 ? 0.93 : 0.9} expr={jExpr} /></Suspense>
        </group>
      )}

      {id === "cta" && (
        <group>
          <StageEnv mode="cta" />
          <DividerLine height={5.0} />
          <Particles />
          {/* Ambos visíveis o tempo todo no CTA */}
          <Suspense fallback={null}><Chester pos={[leftX, baseY, -0.72]} scale={pairScale} expr={cExpr} /></Suspense>
          <Suspense fallback={null}><JayZ pos={[rightX, baseY, -0.72]} scale={pairScale} expr={jExpr} /></Suspense>
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
  let targetFov = 46;

  if (id === "hook") {
    // Ambos bem visíveis e próximos (início) - enquadramento que mostra os dois inteiros
    pos.set(0, 1.65, 4.1 - p*0.1); look.set(0, 1.42, -0.75); targetFov = 47;
  } else if (id === "send") {
    if (local < dur * 0.52) { // Mike enviando (foco específico)
      pos.set(0.05, 1.7, 3.9); look.set(0.1, 1.45, -0.8); targetFov = 44;
    } else { // Jay-Z surpreso (foco específico)
      pos.set(0.05, 1.7, 3.85); look.set(0.05, 1.45, -0.75); targetFov = 44;
    }
  } else if (id === "meet") {
    // Ambos visíveis, leve dinâmica mantendo os dois em quadro
    if (p < 0.5) { pos.set(-0.08, 1.65, 4.1); look.set(-0.05, 1.42, -0.72); }
    else { pos.set(0.08, 1.65, 4.05); look.set(0.05, 1.42, -0.72); }
    targetFov = 47;
  } else if (id === "fusion") {
    // PLANO GERAL 1 (WIDE) - fusão, ambos visíveis e separados, multidão
    if (p < 0.55) { pos.set(0, 2.45, 6.6 - p*0.3); look.set(0, 1.4, -1.6); } // WIDE 1 (mais próximo que antes)
    else { pos.set(0, 2.2, 6.0); look.set(0, 1.4, -1.2); } // médio-wide, ambos visíveis
    targetFov = 48;
  } else if (id === "grammy") {
    // Ambos SEMPRE visíveis: ênfase alternada leve (pan) + WIDE 2
    if (local < 2.6) { pos.set(0, 1.75, 4.5); look.set(-0.2, 1.45, -0.85); targetFov = 46; } // ênfase Chester, Jay-Z visível
    else if (local < 5.2) { pos.set(0, 1.75, 4.5); look.set(0.2, 1.45, -0.85); targetFov = 46; } // ênfase Jay-Z, Chester visível
    else if (local < 7.8) { pos.set(0, 1.75, 4.45); look.set(-0.15, 1.45, -0.85); targetFov = 46; } // ênfase Chester
    else { pos.set(0, 2.45, 6.5); look.set(0, 1.4, -1.6); targetFov = 48; } // WIDE 2 (Grammy), ambos visíveis
  } else { // cta split final
    pos.set(0, 1.65, 4.15 + p*0.1); look.set(0, 1.42, -0.72); targetFov = 47;
  }

  cam.position.copy(pos);
  cam.lookAt(look);
  cam.fov = targetFov;
  cam.near = 0.1; cam.far = 140;
  cam.updateProjectionMatrix();

  const fx = useMemo(() => ({
    ink: new InkPass(scene, cam, { strength: 0.8, widthNear: 4.2, widthFar: 2.6 }),
    lens: new LensBlur({ maxCoC: 18, nearScale: 1.0 }),
    bloom: new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.45, luminanceThreshold: 0.92, luminanceSmoothing: 0.25, mipmapBlur: true, levels: 5, radius: 0.6 }),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(GRADES.day, GRADE_STRENGTH.day),
  }), [scene, cam]);
  useEffect(() => () => fx.ink.dispose(), [fx]);

  const golden = id === "fusion" || id === "grammy" || id === "cta";
  // foco amplo: personagens sempre nítidos e legíveis
  fx.lens.focus = 4.5;
  fx.lens.cInf = 5.0;
  fx.grade.set(golden ? GRADES.golden : GRADES.day);
  fx.grade.amount = golden ? GRADE_STRENGTH.golden : 0.85;
  (fx.bloom as BloomEffect).intensity = id === "grammy" ? 0.8 : id === "fusion" ? 0.7 : 0.45;

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
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const time = frame / fps;
  const { scene } = useThree();
  noInkFallback(scene);
  return (<><World time={time} /><CameraAndPost time={time} /></>);
};

const overlayBase: React.CSSProperties = {
  position: "absolute",
  left: "6%",
  right: "12%",
  top: "7%",
  bottom: "24%",
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "center",
  textAlign: "center",
  fontFamily: '"Montserrat","Bebas Neue","Poppins","Arial Black","Arial",sans-serif',
  fontWeight: 900,
  lineHeight: 1.05,
  color: "#ffffff",
  textShadow: "0 4px 0 rgba(0,0,0,0.7), 0 10px 30px rgba(0,0,0,0.7), 3px 3px 0 #000, -3px -3px 0 #000, 3px -3px 0 #000, -3px 3px 0 #000",
  letterSpacing: 1.5,
  pointerEvents: "none",
  whiteSpace: "pre-line",
};

const TextPop: React.FC<{ text: string; fromSec: number; toSec: number; top?: string; fontSize?: number; accent?: boolean; accentColor?: string }> = ({ text, fromSec, toSec, top = "9%", fontSize = 60, accent = false, accentColor = "#FFD54A" }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const t = frame / fps;
  if (t < fromSec || t > toSec) return null;
  const local = t - fromSec;
  const enter = Math.min(1, local / 0.16);
  const exit = Math.min(1, Math.max(0, (toSec - t) / 0.22));
  const opacity = clamp01(enter) * clamp01(exit);
  const y = (1 - clamp01(enter)) * 28;
  const sc = 0.86 + 0.14 * clamp01(enter);
  const color = accent ? accentColor : "#ffffff";
  return <div style={{ ...overlayBase, top, fontSize, color, opacity, transform: `translateY(${y}px) scale(${sc})` }}>{text}</div>;
};

export const LinkinParkJayz: React.FC = () => {
  const cues = (wordsData as any).cues as { start: number; end: number; text: string }[];
  const c = (i: number) => cues[i] || { start: 0, end: 0, text: "" };
  const d = JAYZ_TOTAL_DUR;
  return (
    <AbsoluteFill style={{ backgroundColor: "#0c0b14" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@800;900&family=Bebas+Neue&display=swap');`}</style>
      <ThreeCanvas width={1080} height={1920} camera={{ fov: 46, position: [0, 1.65, 4.1], near: 0.1, far: 140 }} gl={{ antialias: false, stencil: false, powerPreference: "high-performance", toneMappingExposure: 1.0 }}>
        <SceneRoot />
      </ThreeCanvas>

      {/* Textos sincronizados a cues (zonas seguras, sem cobrir rostos) */}
      <TextPop text={"UMA PEGADINHA?"} fromSec={Math.max(0.2, c(0).start)} toSec={c(0).end + 0.2} top="8%" fontSize={70} accent accentColor="#FFD54A" />
      <TextPop text={"MIKE SHINODA\nENVIOU O MASHUP"} fromSec={c(1).start} toSec={c(1).end - 0.3} top="8%" fontSize={52} />
      <TextPop text={"\"ISSO NÃO PODE\nSER SÉRIO\""} fromSec={c(2).start} toSec={c(2).end + 0.2} top="8%" fontSize={54} accent accentColor="#ff3b3b" />
      <TextPop text={"ROCK + RAP\nSE ENCAIXAVAM"} fromSec={c(4).start - 0.1} toSec={c(4).end + 0.3} top="8%" fontSize={56} accent accentColor="#FFD54A" />
      <TextPop text={"GRAVARAM JUNTOS"} fromSec={c(5).start} toSec={c(5).end + 0.3} top="8%" fontSize={60} />
      <TextPop text={"COLLISION COURSE"} fromSec={c(7).start + 0.2} toSec={c(7).start + 2.8} top="8%" fontSize={58} accent accentColor="#FFD54A" />
      <TextPop text={"GRAMMY 2006\nLENDÁRIO"} fromSec={c(7).start + 2.9} toSec={c(7).end + 0.4} top="8%" fontSize={56} accent accentColor="#ffffff" />
      <TextPop text={"DOIS MUNDOS\nOPOSTOS"} fromSec={c(8).start} toSec={c(8).start + 2.3} top="8%" fontSize={58} />
      <TextPop text={"ALGO ÚNICO"} fromSec={c(8).start + 2.4} toSec={c(8).end + 0.6} top="9%" fontSize={70} accent accentColor="#FFD54A" />
      <TextPop text={"ROCK OU RAP?"} fromSec={c(9).start} toSec={c(10).start + 1.2} top="8%" fontSize={68} accent accentColor="#ffffff" />
      <TextPop text={"COMENTA QUAL LADO\nVOCÊ CURTE MAIS 👇"} fromSec={c(10).start + 1.3} toSec={d} top="8%" fontSize={50} accent accentColor="#FFD54A" />

      {/* Áudio (voz dominante, música ~-20dB) */}
      <Audio src={staticFile("linkin-park-jayz/voice.wav")} />
      <Audio src={staticFile("linkin-park-jayz/music.mp3")} volume={0.1} />
      {/* SFX discretos */}
      <Sequence from={Math.floor(11.0 * JAYZ_FPS)} durationInFrames={Math.floor(0.6 * JAYZ_FPS)}>
        <Audio src={staticFile("linkin-park-jayz/sfx_whoosh.wav")} volume={0.18} />
      </Sequence>
      <Sequence from={Math.floor(36.0 * JAYZ_FPS)} durationInFrames={Math.floor(3.0 * JAYZ_FPS)}>
        <Audio src={staticFile("linkin-park-jayz/sfx_crowd.wav")} volume={0.12} />
      </Sequence>
      <Sequence from={Math.floor(45.0 * JAYZ_FPS)} durationInFrames={Math.floor(3.0 * JAYZ_FPS)}>
        <Audio src={staticFile("linkin-park-jayz/sfx_crowd.wav")} volume={0.16} />
      </Sequence>
      <Sequence from={Math.floor(52.0 * JAYZ_FPS)} durationInFrames={Math.floor(0.25 * JAYZ_FPS)}>
        <Audio src={staticFile("linkin-park-jayz/sfx_flash.wav")} volume={0.15} />
      </Sequence>
      <Sequence from={Math.floor(55.0 * JAYZ_FPS)} durationInFrames={Math.floor(0.25 * JAYZ_FPS)}>
        <Audio src={staticFile("linkin-park-jayz/sfx_flash.wav")} volume={0.13} />
      </Sequence>
      <Sequence from={Math.floor(58.0 * JAYZ_FPS)} durationInFrames={Math.floor(0.25 * JAYZ_FPS)}>
        <Audio src={staticFile("linkin-park-jayz/sfx_flash.wav")} volume={0.13} />
      </Sequence>
    </AbsoluteFill>
  );
};

export default LinkinParkJayz;
