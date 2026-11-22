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

export const CRAWL_FPS = 30;
export const CRAWL_TOTAL_DUR = 70.0; // >60s with emotional/CTA tail (voice ~51.7s, music fades to near silence)
export const CRAWL_FRAMES = Math.ceil(CRAWL_TOTAL_DUR * CRAWL_FPS);

type SceneId = "prep" | "start" | "delivery" | "silence_other" | "end" | "cta";

// 6 cenas conforme seção 5 (alinhadas à narração/words.json com cauda visual)
const SCENES: { id: SceneId; a: number; b: number }[] = [
  { id: "prep",          a: 0.0,  b: 8.0  }, // Hook / Preparação
  { id: "start",         a: 8.0,  b: 18.0 }, // O Início
  { id: "delivery",      a: 18.0, b: 30.0 }, // A Entrega
  { id: "silence_other", a: 30.0, b: 42.0 }, // O Silêncio do Outro Lado (banda desfocada atrás do vidro)
  { id: "end",           a: 42.0, b: 55.0 }, // O Final
  { id: "cta",           a: 55.0, b: 70.0 }, // CTA
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
  const tex = useLoader(THREE.TextureLoader, staticFile(`linkin-park-crawling/${name}`));
  useEffect(() => { tex.colorSpace = THREE.SRGBColorSpace; tex.needsUpdate = true; }, [tex]);
  return tex;
};

const Sprite: React.FC<{ tex: THREE.Texture; pos: [number, number, number]; size: [number, number]; opacity?: number; tilt?: number; bob?: number }> = ({ tex, pos, size, opacity = 1, tilt = 0, bob = 0 }) => (
  <mesh position={[pos[0], pos[1] + bob, pos[2]]} rotation={[0, 0, tilt]} layers={NOINK}>
    <planeGeometry args={size} />
    <meshBasicMaterial map={tex} transparent alphaTest={0.04} opacity={opacity} side={THREE.DoubleSide} toneMapped={false} />
  </mesh>
);

type ChesterPose = "prep" | "start" | "singing" | "intense" | "exhausted" | "final" | "silence";

const Chester: React.FC<{ pos: [number, number, number]; scale?: number; tilt?: number; pose: ChesterPose; bob?: number; opacity?: number }> = ({ pos, scale = 1, tilt = 0, pose, bob = 0, opacity = 1 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const tPrep = useTex("chester_prep.png");
  const tStart = useTex("chester_start.png");
  const tSing = useTex("chester_singing.png");
  const tInt = useTex("chester_intense.png");
  const tEx = useTex("chester_exhausted.png");
  const tFin = useTex("chester_final.png");
  const tSil = useTex("chester_silence.png");
  const tex = pose === "prep" ? tPrep : pose === "start" ? tStart : pose === "singing" ? tSing : pose === "intense" ? tInt : pose === "exhausted" ? tEx : pose === "silence" ? tSil : tFin;
  const breath = 1 + 0.01 * Math.sin(t * Math.PI * 1.2);
  const effort = (pose === "singing" || pose === "intense") ? 1 + 0.015 * Math.abs(Math.sin(t * 3.2)) : 1;
  const s = scale * breath * effort;
  return <Sprite tex={tex} pos={pos} size={[2.7 * s, 3.75 * s]} tilt={tilt} bob={bob} opacity={opacity} />;
};

// Silhuetas da banda atrás do vidro (APENAS cenas 4-5, SEMPRE desfocadas/sem rostos ou detalhes)
// "emotion" (0..1): por ~2s transmitem emoção/respeito (cabeças baixas, gesto de mão no rosto)
// mantendo-se apenas contornos/silhuetas escuras, sem rostos nem detalhes nítidos.
const BandSilhouettes: React.FC<{ opacity?: number; emotion?: number; time?: number }> = ({ opacity = 0.55, emotion = 0, time = 0 }) => {
  const people = useMemo(() => [
    { x: -1.6, h: 1.9, w: 0.55, lean: 0.02, hand: false },
    { x: -0.8, h: 2.05, w: 0.6, lean: -0.01, hand: true },
    { x: 0.0, h: 1.85, w: 0.55, lean: 0.03, hand: false },
    { x: 0.85, h: 2.0, w: 0.58, lean: 0.01, hand: true },
    { x: 1.65, h: 1.9, w: 0.55, lean: -0.02, hand: false },
  ], []);
  const e = clamp01(emotion);
  const sway = Math.sin(time * 0.8) * 0.008 * e;
  return (
    <group position={[0, 0.95, -5.6]}>
      {people.map((p, i) => {
        const bow = e * (0.1 + (i % 3) * 0.03); // cabeças levemente baixas (emoção)
        const lean = p.lean + e * 0.025 * (i % 2 === 0 ? 1 : -0.6);
        const hx = Math.sin(time * 0.6 + i) * 0.008 * e;
        return (
          <group key={i} position={[p.x + hx, 0, 0]} rotation={[lean, 0, sway * (i % 2 === 0 ? 1 : -1)]}>
            <group position={[0, p.h / 2, 0]}>
              {/* cabeça (abaixa levemente quando emocionada) - silhueta sem rosto */}
              <mesh layers={NOINK} position={[0, p.h * 0.35 - bow * 0.22, e * 0.03]}>
                <sphereGeometry args={[p.w * 0.28, 12, 12]} />
                <meshBasicMaterial color="#050508" transparent opacity={opacity} toneMapped={false} />
              </mesh>
              {/* corpo */}
              <mesh layers={NOINK} position={[0, 0, 0]}>
                <capsuleGeometry args={[p.w * 0.22, p.h * 0.55, 6, 10]} />
                <meshBasicMaterial color="#040406" transparent opacity={opacity} toneMapped={false} />
              </mesh>
              {/* gesto de mão no rosto (silhueta simples, sem detalhes) */}
              {p.hand && e > 0.01 && (
                <mesh layers={NOINK} position={[p.w * 0.16, p.h * 0.16 - bow * 0.18, 0.06]}>
                  <sphereGeometry args={[p.w * 0.15, 10, 10]} />
                  <meshBasicMaterial color="#050508" transparent opacity={opacity * (0.85 * e)} toneMapped={false} />
                </mesh>
              )}
            </group>
          </group>
        );
      })}
      {/* leve névoa escura para reforçar silhueta desfocada atrás do vidro */}
      <mesh layers={NOINK} position={[0, 1.0, 0.1]}>
        <planeGeometry args={[5.5, 3.2]} />
        <meshBasicMaterial color="#05050a" transparent opacity={0.18 + 0.05 * e} toneMapped={false} />
      </mesh>
    </group>
  );
};

const BoothSet: React.FC<{ lightMode: "blue" | "blueRed" | "gold" | "red" | "goldSoft"; sceneId: SceneId }> = ({ lightMode, sceneId }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const pulse = (Math.sin(t * 2.2) + 1) / 2;

  const wall = "#0b0c12";
  const floor = "#0a0a10";
  const blue = "#2aa7ff";
  const red = "#ff2a3a";
  const gold = "#ffcc66";
  const sideCol = lightMode === "blueRed" ? (pulse > 0.5 ? red : blue) : lightMode === "red" ? red : lightMode === "gold" || lightMode === "goldSoft" ? gold : blue;
  const otherCol = lightMode === "blueRed" ? (pulse > 0.5 ? blue : red) : blue;

  return (
    <group>
      {/* chão e paredes da cabine (escura) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[14, 14]} />
        <meshLambertMaterial color={floor} />
      </mesh>
      <mesh position={[0, 2.6, -4.2]}>
        <boxGeometry args={[12, 5.4, 0.25]} />
        <meshLambertMaterial color={wall} />
      </mesh>
      <mesh position={[-5.8, 2.6, -0.8]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[8, 5.4, 0.25]} />
        <meshLambertMaterial color="#0c0d14" />
      </mesh>
      <mesh position={[5.8, 2.6, -0.8]} rotation={[0, -Math.PI / 2, 0]}>
        <boxGeometry args={[8, 5.4, 0.25]} />
        <meshLambertMaterial color="#0c0d14" />
      </mesh>
      <mesh position={[0, 5.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 9]} />
        <meshLambertMaterial color="#0d0e16" />
      </mesh>

      {/* vidro da cabine (separando sala de controle ao fundo) */}
      <mesh position={[0, 2.1, -4.05]}>
        <planeGeometry args={[5.6, 3.4]} />
        <meshPhysicalMaterial color="#6aaad0" transparent opacity={0.12} roughness={0.05} transmission={0.2} />
      </mesh>
      <mesh position={[0, 2.1, -4.02]}>
        <planeGeometry args={[5.7, 3.5]} />
        <meshBasicMaterial color="#7fd4ff" transparent opacity={0.04} toneMapped={false} />
      </mesh>
      {/* moldura do vidro */}
      <mesh position={[0, 3.82, -4.0]}><boxGeometry args={[5.8, 0.08, 0.08]} /><meshLambertMaterial color="#1a1c24" /></mesh>
      <mesh position={[0, 0.38, -4.0]}><boxGeometry args={[5.8, 0.08, 0.08]} /><meshLambertMaterial color="#1a1c24" /></mesh>
      <mesh position={[-2.86, 2.1, -4.0]}><boxGeometry args={[0.08, 3.5, 0.08]} /><meshLambertMaterial color="#1a1c24" /></mesh>
      <mesh position={[2.86, 2.1, -4.0]}><boxGeometry args={[0.08, 3.5, 0.08]} /><meshLambertMaterial color="#1a1c24" /></mesh>

      {/* sala de controle escura além do vidro (fundo) */}
      <mesh position={[0, 2.2, -6.2]}>
        <planeGeometry args={[10, 5]} />
        <meshLambertMaterial color="#05060a" />
      </mesh>

      {/* microfone de estúdio em destaque (apoio visual, Chester segura o mic no sprite) */}
      <mesh position={[0.05, 1.55, -0.35]}>
        <cylinderGeometry args={[0.025, 0.025, 1.4, 10]} />
        <meshLambertMaterial color="#505058" />
      </mesh>
      <mesh position={[0.05, 2.3, -0.35]}>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshLambertMaterial color="#bfc3cc" />
      </mesh>

      {/* tiras/feixes de luz dramáticos */}
      <mesh position={[-3.2, 3.6, -3.2]} rotation={[0, 0.2, 0]}>
        <boxGeometry args={[0.08, 0.08, 3.2]} />
        <meshBasicMaterial color={sideCol} toneMapped={false} />
      </mesh>
      <mesh position={[3.2, 3.7, -3.2]} rotation={[0, -0.2, 0]}>
        <boxGeometry args={[0.08, 0.08, 3.2]} />
        <meshBasicMaterial color={lightMode === "blueRed" ? otherCol : sideCol} toneMapped={false} />
      </mesh>

      {/* feixe dourado de topo para cenas de entrega/final */}
      {(lightMode === "gold" || lightMode === "goldSoft") && (
        <mesh position={[0.0, 3.8, -1.8]} rotation={[0.35, 0, 0]}>
          <planeGeometry args={[1.2, 6.5]} />
          <meshBasicMaterial color={gold} transparent opacity={lightMode === "gold" ? 0.12 : 0.08} toneMapped={false} />
        </mesh>
      )}

      {/* luzes de cena */}
      <pointLight position={[-2.2, 3.4, -1.5]} intensity={lightMode === "blue" ? 1.4 : 1.1} color={lightMode === "red" ? "#ff5a6a" : lightMode === "gold" || lightMode === "goldSoft" ? "#ffc86a" : blue} distance={10} />
      <pointLight position={[2.2, 3.4, -1.5]} intensity={lightMode === "blueRed" ? 1.2 : 0.9} color={lightMode === "blueRed" ? red : lightMode === "gold" || lightMode === "goldSoft" ? "#ffd080" : blue} distance={10} />
      {(lightMode === "gold" || lightMode === "goldSoft") && <pointLight position={[0, 4.2, -0.8]} intensity={lightMode === "gold" ? 1.6 : 1.1} color="#ffd070" distance={9} />}
      {lightMode === "red" && <pointLight position={[0, 2.8, -1.2]} intensity={1.0} color="#ff3344" distance={8} />}
    </group>
  );
};

// partículas de poeira/luz flutuando em TODAS as cenas
const DustParticles: React.FC<{ warm?: boolean; intensity?: number }> = ({ warm = false, intensity = 1 }) => {
  const pts = useMemo(() => Array.from({ length: 55 }, () => ({
    x: (Math.random() - 0.5) * 3.2,
    y: 0.6 + Math.random() * 3.2,
    z: -1.6 + Math.random() * 2.6,
    ph: Math.random() * Math.PI * 2,
    sp: 0.15 + Math.random() * 0.35,
    r: 0.015 + Math.random() * 0.02,
  })), []);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const col = warm ? "#ffe2a8" : "#bfe8ff";
  return (
    <group>
      {pts.map((p, i) => {
        const y = p.y + Math.sin(t * p.sp + p.ph) * 0.18;
        const x = p.x + Math.sin(t * p.sp * 0.7 + p.ph) * 0.06;
        const o = (0.12 + 0.22 * Math.abs(Math.sin(t * 0.9 + p.ph))) * intensity;
        return (
          <mesh key={i} position={[x, y, p.z]} layers={NOINK}>
            <sphereGeometry args={[p.r, 6, 6]} />
            <meshBasicMaterial color={col} transparent opacity={o} toneMapped={false} />
          </mesh>
        );
      })}
    </group>
  );
};

const World: React.FC<{ time: number }> = ({ time }) => {
  const { id, local, dur } = sceneInfo(time);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  // Chester é o ÚNICO em foco em todas as cenas
  let pose: ChesterPose = "prep";
  let chPos: [number, number, number] = [-0.05, 1.48, -0.6];
  let chScale = 1.1;
  let chTilt = 0;
  let chBob = Math.sin(t * 1.1) * 0.008;

  if (id === "prep") {
    pose = "prep"; chPos = [-0.05, 1.5, -0.55]; chScale = 1.12; chTilt = Math.sin(t * 0.6) * 0.01;
  } else if (id === "start") {
    pose = "start"; chPos = [-0.05, 1.5, -0.6]; chScale = 1.08; chTilt = Math.sin(t * 0.8) * 0.012;
  } else if (id === "delivery") {
    pose = local < dur * 0.55 ? "singing" : "intense"; chPos = [-0.05, 1.52, -0.5]; chScale = 1.14;
    chBob += Math.abs(Math.sin(t * 2.4)) * 0.02; chTilt = Math.sin(t * 1.6) * 0.015;
  } else if (id === "silence_other") {
    // perfil (simulado por leve tilt/posicionamento e enquadramento), exaustão contida
    pose = local < dur * 0.5 ? "exhausted" : "silence"; chPos = [0.05, 1.48, -0.65]; chScale = 1.08;
    chTilt = -0.04 + Math.sin(t * 0.7) * 0.01;
  } else if (id === "end") {
    pose = local < dur * 0.6 ? "exhausted" : "silence"; chPos = [-0.03, 1.5, -0.5]; chScale = 1.14;
    chTilt = 0.02; chBob = Math.sin(t * 0.8) * 0.006;
  } else { // cta
    pose = "final"; chPos = [-0.02, 1.52, -0.48]; chScale = 1.15; chTilt = Math.sin(t * 0.5) * 0.008;
  }

  let lightMode: "blue" | "blueRed" | "gold" | "red" | "goldSoft" = "blue";
  if (id === "prep") lightMode = "blue";
  else if (id === "start") lightMode = "blueRed";
  else if (id === "delivery") lightMode = "gold";
  else if (id === "silence_other") lightMode = "red";
  else if (id === "end") lightMode = "goldSoft";
  else lightMode = "goldSoft";

  const showBand = id === "silence_other" || id === "end"; // silhuetas atrás do vidro APENAS cenas 4-5
  const warmParticles = id === "delivery" || id === "end" || id === "cta";

  // ~2s de emoção/respeito na banda (cabeças baixas/gesto) no silêncio absoluto - ainda silhuetas desfocadas, sem rostos
  let bandEmotion = 0;
  if (id === "silence_other") {
    // pico ~36s–38s (respeito absoluto), dentro da cena 4
    const up = smooth((local - 5.5) / 0.8);
    const down = 1 - smooth((local - 8.5) / 1.0);
    bandEmotion = clamp01(up * down);
  } else if (id === "end") {
    // permanece suavemente emocionada no início da cena final
    bandEmotion = clamp01(1 - smooth(local / 2.5)) * 0.45;
  }

  const sky = id === "cta" ? "#2a1b0b" : id === "silence_other" ? "#12080c" : id === "delivery" ? "#120e0a" : "#060810";
  const fogC = id === "cta" ? "#3a2410" : id === "silence_other" ? "#1a0c12" : "#0c1018";

  return (
    <group>
      <color attach="background" args={[sky]} />
      <fog attach="fog" args={[fogC, 6, 22]} />

      <ambientLight intensity={id === "end" ? 0.28 : 0.35} color={warmParticles ? "#ffe0b8" : "#cfe8ff"} />

      <BoothSet lightMode={lightMode} sceneId={id} />

      {/* Banda no vidro: somente cenas 4-5, sempre atrás do vidro e desfocada (sem rostos/detalhes) */}
      {showBand && <BandSilhouettes opacity={0.5 + 0.12 * bandEmotion} emotion={bandEmotion} time={t} />}

      {/* Chester: único personagem em foco */}
      <Suspense fallback={null}>
        <Chester pos={chPos} scale={chScale} pose={pose} tilt={chTilt} bob={chBob} />
      </Suspense>

      {/* Partículas de poeira/luz em todas as cenas */}
      <DustParticles warm={warmParticles} intensity={id === "delivery" ? 1.1 : id === "end" ? 0.9 : 1.0} />

      {/* brilho sutil frontal para legibilidade do rosto */}
      <pointLight position={[-0.2, 2.2, 1.2]} intensity={id === "end" ? 0.6 : 0.8} color={warmParticles ? "#ffdcb0" : "#d8ecff"} distance={6} />
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
  let focusTarget = new THREE.Vector3(-0.05, 2.55, -0.55); // rosto de Chester (aprox)

  if (id === "prep") {
    // Cena 1: close extremo rosto, olhos fechados, respirando fundo
    if (p < 0.5) { pos.set(0.0, 2.45, 1.55); look.set(-0.02, 2.5, -0.55); focusTarget.set(-0.02, 2.5, -0.55); }
    else { pos.set(0.06, 2.42, 1.45); look.set(0.0, 2.48, -0.55); focusTarget.set(0.0, 2.48, -0.55); }
  } else if (id === "start") {
    // Cena 2: plano médio (busto), segurando mic com as duas mãos, vidro ao fundo vazio
    if (p < 0.5) { pos.set(-0.05, 2.05, 2.85); look.set(-0.03, 2.2, -0.6); focusTarget.set(-0.03, 2.15, -0.6); }
    else { pos.set(0.12, 2.0, 2.65); look.set(0.02, 2.18, -0.6); focusTarget.set(0.02, 2.15, -0.6); } // detalhe leve/médio dinâmico
  } else if (id === "delivery") {
    // Cena 3: close extremo no rosto, intensidade (boca aberta, veia, suor), feixe dourado
    if (p < 0.45) { pos.set(-0.02, 2.48, 1.5); look.set(-0.03, 2.52, -0.5); focusTarget.set(-0.03, 2.52, -0.5); }
    else if (p < 0.75) { pos.set(0.08, 2.5, 1.35); look.set(0.0, 2.52, -0.5); focusTarget.set(0.0, 2.52, -0.5); } // punch-in
    else { pos.set(-0.04, 2.46, 1.45); look.set(-0.02, 2.5, -0.5); focusTarget.set(-0.02, 2.5, -0.5); }
  } else if (id === "silence_other") {
    // Cena 4: plano médio/perfil, Chester com mic; ao fundo vidro com silhuetas desfocadas (DOF forte)
    if (p < 0.5) { pos.set(0.35, 2.05, 2.75); look.set(0.05, 2.18, -0.7); focusTarget.set(0.05, 2.12, -0.65); }
    else { pos.set(0.15, 2.1, 3.0); look.set(0.0, 2.2, -0.9); focusTarget.set(0.0, 2.15, -0.7); } // mostra vidro/fundo desfocado
  } else if (id === "end") {
    // Cena 5: close extremo rosto, olhos fechados/cabeça baixa, exaustão, feixe dourado suave
    if (p < 0.55) { pos.set(0.0, 2.44, 1.5); look.set(-0.02, 2.46, -0.5); focusTarget.set(-0.02, 2.46, -0.5); }
    else { pos.set(0.05, 2.4, 1.42); look.set(0.0, 2.44, -0.5); focusTarget.set(0.0, 2.44, -0.5); }
  } else { // cta
    // Cena 6: close Chester, olhar penetrante para a câmera, fundo gradiente dourado/partículas
    const drift = p * 0.08;
    pos.set(-0.02 + Math.sin(p * 1.2) * 0.03, 2.46, 1.48 + drift); look.set(-0.01, 2.5, -0.48); focusTarget.set(-0.01, 2.5, -0.48);
  }

  cam.position.copy(pos);
  cam.lookAt(look);
  cam.fov = (id === "prep" || id === "delivery" || id === "end" || id === "cta") ? 38 : 41;
  cam.near = 0.1; cam.far = 120;
  cam.updateProjectionMatrix();

  const fx = useMemo(() => ({
    ink: new InkPass(scene, cam, { strength: 0.82, widthNear: 4.4, widthFar: 2.8 }),
    lens: new LensBlur({ maxCoC: 22, nearScale: 1.05 }),
    bloom: new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.5, luminanceThreshold: 0.92, luminanceSmoothing: 0.25, mipmapBlur: true, levels: 5, radius: 0.6 }),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(GRADES.day, GRADE_STRENGTH.day),
  }), [scene, cam]);
  useEffect(() => () => fx.ink.dispose(), [fx]);

  const golden = id === "delivery" || id === "end" || id === "cta";
  fx.lens.focus = Math.max(0.4, pos.distanceTo(focusTarget));
  // DOF forte: Chester nítido; banda/vidro/fundo desfocados (cenas 4-5 especialmente)
  if (id === "silence_other") {
    fx.lens.cInf = 1.9; // fundo (silhuetas atrás do vidro) bem desfocado
  } else if (id === "end") {
    fx.lens.cInf = 2.1;
  } else if (id === "delivery") {
    fx.lens.cInf = 2.3;
  } else {
    fx.lens.cInf = 2.6;
  }
  fx.grade.set(golden ? GRADES.golden : GRADES.day);
  fx.grade.amount = golden ? (id === "delivery" ? 0.95 : 0.9) : 0.85;
  (fx.bloom as BloomEffect).intensity = id === "delivery" ? 0.75 : golden ? 0.6 : id === "start" ? 0.5 : 0.45;

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
  right: "13%", // reserva ~lateral direita para UI
  top: "10%",
  bottom: "22%", // reserva ~20% inferior para UI
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

const TextPop: React.FC<{ text: string; fromSec: number; toSec: number; top?: string; fontSize?: number; accent?: boolean; accentColor?: string }> = ({ text, fromSec, toSec, top = "11%", fontSize = 64, accent = false, accentColor = "#ff3b3b" }) => {
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

export const LinkinParkCrawling: React.FC = () => {
  const durationSec = CRAWL_TOTAL_DUR;
  return (
    <AbsoluteFill style={{ backgroundColor: "#06070d" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@800;900&family=Bebas+Neue&display=swap');`}</style>
      <ThreeCanvas width={1080} height={1920} camera={{ fov: 40, position: [0, 2.2, 2.8], near: 0.1, far: 120 }} gl={{ antialias: false, stencil: false, powerPreference: "high-performance", toneMappingExposure: 1.0 }}>
        <SceneRoot />
      </ThreeCanvas>

      {/* Textos dinâmicos (sincronizados à narração/cues, zonas seguras, sem cobrir rosto) */}
      <TextPop text={"UMA ÚNICA TOMADA"} fromSec={0.4} toSec={5.0} top="12%" fontSize={70} accent accentColor="#ffffff" />
      <TextPop text={"SEM CORTES.\nSEM SEGUNDA CHANCE."} fromSec={5.1} toSec={8.6} top="13%" fontSize={56} accent accentColor="#ff3b3b" />

      <TextPop text={"CHESTER ENTROU\nNA CABINE..."} fromSec={8.9} toSec={11.8} top="13%" fontSize={56} />
      <TextPop text={"COMO SE FOSSE\nA ÚLTIMA VEZ"} fromSec={12.0} toSec={15.7} top="13%" fontSize={58} accent accentColor="#7fd4ff" />

      <TextPop text={"DOR REAL.\nVULNERABILIDADE PURA."} fromSec={16.0} toSec={21.0} top="13%" fontSize={54} accent accentColor="#ff3b3b" />

      <TextPop text={"DO OUTRO LADO DO VIDRO..."} fromSec={21.2} toSec={24.9} top="12%" fontSize={50} />
      <TextPop text={"SILÊNCIO"} fromSec={25.0} toSec={27.4} top="14%" fontSize={72} accent accentColor="#ffffff" />
      <TextPop text={"NINGUÉM SE MEXEU"} fromSec={28.8} toSec={30.5} top="13%" fontSize={56} />

      <TextPop text={"EXAUSTO..."} fromSec={32.0} toSec={34.2} top="14%" fontSize={62} accent accentColor="#ffd36b" />
      <TextPop text={"NINGUÉM FALOU NADA"} fromSec={34.4} toSec={36.2} top="13%" fontSize={56} />
      <TextPop text={"RESPEITO ABSOLUTO"} fromSec={36.4} toSec={39.0} top="13%" fontSize={58} accent accentColor="#ffd36b" />

      <TextPop text={"ALGO VERDADEIRO"} fromSec={39.2} toSec={43.0} top="13%" fontSize={60} accent accentColor="#ffffff" />

      <TextPop text={"ESSA HISTÓRIA\nTE DEU ARREPIOS?"} fromSec={43.2} toSec={47.5} top="13%" fontSize={56} />
      <TextPop text={"COMENTA \"CRAWLING\" 👇"} fromSec={47.6} toSec={durationSec} top="12%" fontSize={58} accent accentColor="#ff3b3b" />

      {/* Áudio (voz dominante, música ~-20 dB, SFX discretos) */}
      <Audio src={staticFile("linkin-park-crawling/voice.wav")} />
      <Audio src={staticFile("linkin-park-crawling/music.mp3")} volume={0.1} />
      {/* respiração profunda no início */}
      <Sequence from={0} durationInFrames={Math.floor(1.8 * CRAWL_FPS)}>
        <Audio src={staticFile("linkin-park-crawling/sfx_breath.wav")} volume={0.22} />
      </Sequence>
      {/* chiado sutil de estúdio (discreto) */}
      <Sequence from={Math.floor(2.0 * CRAWL_FPS)} durationInFrames={Math.floor(6.0 * CRAWL_FPS)}>
        <Audio src={staticFile("linkin-park-crawling/sfx_hiss.wav")} volume={0.08} />
      </Sequence>
      <Sequence from={Math.floor(18.0 * CRAWL_FPS)} durationInFrames={Math.floor(6.0 * CRAWL_FPS)}>
        <Audio src={staticFile("linkin-park-crawling/sfx_hiss.wav")} volume={0.06} />
      </Sequence>
    </AbsoluteFill>
  );
};

export default LinkinParkCrawling;
