import React, { useMemo, useEffect, Suspense } from "react";
import * as THREE from "three";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree, useLoader } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { InkPass, noInkFallback, NOINK } from "../jimi3d/ink";
import { LensBlur } from "../jimi3d/lensblur";
import { GradeEffect, GRADES, GRADE_STRENGTH } from "../jimi3d/grade";

export const GATO_FPS = 30;
// Voice (edge-tts pt-BR-AntonioNeural +8%) actual duration ~41.136s; add tail for CTA hold
export const GATO_TOTAL_DUR = 44.0;
export const GATO_FRAMES = Math.ceil(GATO_TOTAL_DUR * GATO_FPS); // 1320

// Scene segments synced to words.json cues (actual TTS timing)
const SEGS = [
  { id: "hook",       a: 0.0,   b: 4.332 },
  { id: "curiosity",  a: 4.282, b: 6.354 },
  { id: "instinct",   a: 6.354, b: 12.916 },
  { id: "protection", a: 12.916,b: 19.861 },
  { id: "family",     a: 19.861,b: 28.553 },
  { id: "cta",        a: 28.553,b: 44.0 },
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
  return { id: last.id as SegId, local: Math.max(0, time - last.a), dur: Math.max(0.001, last.b - last.a), idx: SEGS.length - 1 };
};

const makeBloom = () =>
  new BloomEffect({
    blendFunction: BlendFunction.ADD,
    intensity: 0.38,
    luminanceThreshold: 1.0,
    luminanceSmoothing: 0.2,
    mipmapBlur: true,
    levels: 5,
    radius: 0.55,
  });

/** Single cat asset (public/gato-banheiro/cat.png) reused in ALL scenes.
 *  Variations only: position, scale/zoom, subtle head tilt, breathing. */
const CatSprite: React.FC<{ pos: [number, number, number]; scale?: number; tilt?: number }> = ({
  pos,
  scale = 1,
  tilt = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tex = useLoader(THREE.TextureLoader, staticFile("gato-banheiro/cat.png"));
  useEffect(() => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
  }, [tex]);
  const t = frame / fps;
  // breathing: scale oscillation 1.0..1.02
  const breath = 1 + 0.01 * Math.sin(t * Math.PI * 1.3);
  // subtle blink pulse every ~3.5s
  const blinkPhase = t % 3.6;
  const blink = blinkPhase < 0.09 ? 0.9 : 1.0;
  const s = scale * breath;
  return (
    <mesh position={pos} scale={[s, s * blink, s]} rotation={[0, 0, tilt]} layers={NOINK}>
      <planeGeometry args={[2.6, 2.6]} />
      <meshBasicMaterial map={tex} transparent alphaTest={0.04} side={THREE.DoubleSide} toneMapped={false} />
    </mesh>
  );
};

/** Owner as back silhouette only (no face) - scenes 1 and 4. */
const OwnerSilhouette: React.FC<{ pos: [number, number, number]; scale?: number; opacity?: number }> = ({
  pos,
  scale = 1,
  opacity = 0.85,
}) => {
  const tex = useMemo(() => {
    const w = 256, h = 512;
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#141218";
    // head
    ctx.beginPath(); ctx.ellipse(128, 90, 38, 42, 0, 0, Math.PI * 2); ctx.fill();
    // body/shoulders (back silhouette)
    ctx.beginPath();
    ctx.moveTo(60, 500);
    ctx.lineTo(70, 220);
    ctx.quadraticCurveTo(80, 150, 128, 130);
    ctx.quadraticCurveTo(176, 150, 186, 220);
    ctx.lineTo(196, 500);
    ctx.closePath();
    ctx.fill();
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.needsUpdate = true;
    return t;
  }, []);
  useEffect(() => () => tex.dispose(), [tex]);
  return (
    <mesh position={pos} scale={scale} layers={NOINK}>
      <planeGeometry args={[1.6, 3.2]} />
      <meshBasicMaterial map={tex} transparent opacity={opacity} side={THREE.DoubleSide} toneMapped={false} />
    </mesh>
  );
};

const CorridorBG: React.FC = () => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 2]} receiveShadow>
      <planeGeometry args={[14, 20]} />
      <meshLambertMaterial color="#6a5a48" />
    </mesh>
    <mesh position={[-3.2, 2.2, 0]} rotation={[0, Math.PI / 2, 0]}>
      <boxGeometry args={[20, 4.6, 0.3]} />
      <meshLambertMaterial color="#bfae96" />
    </mesh>
    <mesh position={[3.2, 2.2, 0]} rotation={[0, -Math.PI / 2, 0]}>
      <boxGeometry args={[20, 4.6, 0.3]} />
      <meshLambertMaterial color="#b7a78f" />
    </mesh>
    <mesh position={[0, 2.2, -6]}>
      <boxGeometry args={[7, 4.6, 0.3]} />
      <meshLambertMaterial color="#a9967e" />
    </mesh>
    <mesh position={[0, 4.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <planeGeometry args={[7, 20]} />
      <meshLambertMaterial color="#d8ccb8" />
    </mesh>
  </group>
);

const BathroomDoorBG: React.FC = () => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 1]} receiveShadow>
      <planeGeometry args={[12, 14]} />
      <meshLambertMaterial color="#6b5b4a" />
    </mesh>
    <mesh position={[0, 2.3, -2]}>
      <boxGeometry args={[10, 4.8, 0.3]} />
      <meshLambertMaterial color="#cbbfa8" />
    </mesh>
    {/* door frame */}
    <mesh position={[-1.15, 1.8, -1.85]}><boxGeometry args={[0.15, 3.6, 0.2]} /><meshLambertMaterial color="#5a4634" /></mesh>
    <mesh position={[1.15, 1.8, -1.85]}><boxGeometry args={[0.15, 3.6, 0.2]} /><meshLambertMaterial color="#5a4634" /></mesh>
    <mesh position={[0, 3.55, -1.85]}><boxGeometry args={[2.45, 0.15, 0.2]} /><meshLambertMaterial color="#5a4634" /></mesh>
    {/* door (closed) */}
    <mesh position={[0, 1.8, -1.7]}><boxGeometry args={[2.1, 3.4, 0.12]} /><meshLambertMaterial color="#8a6a4a" /></mesh>
    <mesh position={[0.65, 1.8, -1.62]}><sphereGeometry args={[0.07, 12, 12]} /><meshLambertMaterial color="#d4b06a" /></mesh>
  </group>
);

const LivingRoomBG: React.FC = () => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 1]} receiveShadow>
      <planeGeometry args={[14, 14]} />
      <meshLambertMaterial color="#6e5b49" />
    </mesh>
    <mesh position={[0, 2.3, -3]}>
      <boxGeometry args={[12, 4.8, 0.3]} />
      <meshLambertMaterial color="#d8cdb8" />
    </mesh>
    {/* sofa */}
    <mesh position={[0, 0.55, -1.8]} castShadow><boxGeometry args={[4.2, 1.1, 1.6]} /><meshLambertMaterial color="#4a6a78" /></mesh>
    <mesh position={[0, 1.15, -2.35]}><boxGeometry args={[4.2, 1.1, 0.5]} /><meshLambertMaterial color="#3f5c68" /></mesh>
    <mesh position={[-1.9, 0.95, -1.8]}><boxGeometry args={[0.4, 1.1, 1.6]} /><meshLambertMaterial color="#3f5c68" /></mesh>
    <mesh position={[1.9, 0.95, -1.8]}><boxGeometry args={[0.4, 1.1, 1.6]} /><meshLambertMaterial color="#3f5c68" /></mesh>
    <mesh position={[2.8, 2.2, -2.6]}><planeGeometry args={[1.2, 2.2]} /><meshBasicMaterial color="#ffd9a0" transparent opacity={0.12} /></mesh>
  </group>
);

const World: React.FC<{ time: number }> = ({ time }) => {
  const { id, local, dur } = segInfo(time);
  const p = smooth(local / dur);
  const t = time;

  const golden = id === "family" || id === "cta" || id === "hook";
  const sky = golden ? "#6b5a3a" : "#5f6a74";
  const fogC = golden ? "#9a8158" : "#8f99a3";

  // cat transforms per scene (same asset only)
  let catPos: [number, number, number] = [0, 1.3, 0.2];
  let catScale = 1.0;
  let catTilt = 0;
  let showOwner = false;
  let ownerPos: [number, number, number] = [1.5, 1.35, -1.8];
  let ownerScale = 0.95;
  let ownerOpacity = 0.85;

  if (id === "hook") {
    // close, looking at camera, corridor, dolly-in feel via camera; owner silhouette far/back disappearing
    catPos = [0, 1.35, 0.25];
    catScale = 1.15;
    catTilt = Math.sin(t * 0.8) * 0.03 + p * 0.04; // subtle head inclination
    showOwner = true;
    ownerPos = [1.6, 1.25, -2.5 - p * 1.0];
    ownerOpacity = lerp(0.7, 0.0, p); // disappearing
  } else if (id === "curiosity") {
    // in front of closed bathroom door
    catPos = [-0.55, 1.25, 0.25];
    catScale = 1.0;
    catTilt = -0.02 + Math.sin(t * 1.4) * 0.06; // inclines head / looks to knob area
    showOwner = false;
  } else if (id === "instinct") {
    // close on eyes -> zoom/scale up
    catPos = [0, 1.55 + p * 0.08, 0.45];
    catScale = 1.45 + p * 0.25;
    catTilt = Math.sin(t * 0.7) * 0.015;
    showOwner = false;
  } else if (id === "protection") {
    // beside owner silhouette (back) in front of door
    catPos = [-0.75, 1.25, 0.3];
    catScale = 0.95;
    catTilt = -0.03 + Math.sin(t * 0.8) * 0.03; // looks up toward owner/camera
    showOwner = true;
    ownerPos = [0.85, 1.45, -0.1];
    ownerScale = 1.05;
    ownerOpacity = 0.9;
  } else if (id === "family") {
    // cozy living room, warm, caring expression (asset same)
    catPos = [0, 1.3, 0.35];
    catScale = 1.05;
    catTilt = Math.sin(t * 0.5) * 0.02;
    showOwner = false;
  } else {
    // CTA: close final, gentle dolly-out handled by camera
    catPos = [0, 1.35, 0.4];
    catScale = 1.12;
    catTilt = Math.sin(t * 0.7) * 0.03 + (p > 0.7 ? (p - 0.7) * 0.12 : 0);
    showOwner = false;
  }

  return (
    <group>
      <color attach="background" args={[sky]} />
      <fog attach="fog" args={[fogC, 6, 22]} />
      <ambientLight intensity={golden ? 0.6 : 0.55} color={golden ? "#ffdcb0" : "#dfe8ff"} />
      <directionalLight position={[4, 6, 4]} intensity={golden ? 1.5 : 1.1} color={golden ? "#ffe6c0" : "#f4efe6"} />
      <directionalLight position={[-3, 3, -2]} intensity={0.3} color={golden ? "#9ab0ff" : "#8aa0c8"} />

      {id === "hook" && <CorridorBG />}
      {(id === "curiosity" || id === "instinct" || id === "protection") && <BathroomDoorBG />}
      {(id === "family" || id === "cta") && <LivingRoomBG />}

      <Suspense fallback={null}>
        <CatSprite pos={catPos} scale={catScale} tilt={catTilt} />
      </Suspense>
      {showOwner && <OwnerSilhouette pos={ownerPos} scale={ownerScale} opacity={ownerOpacity} />}

      {(id === "family" || id === "cta") && <pointLight position={[0, 3, 1]} intensity={1.2} color="#ffd7a0" distance={10} />}
      {id === "hook" && <pointLight position={[0, 3, 1]} intensity={0.8} color="#ffd8a8" distance={10} />}
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
  if (id === "hook") {
    pos.set(0.0, 1.55, 4.6 - p * 0.5); // dolly-in slow
    look.set(0, 1.35, 0.1);
  } else if (id === "curiosity") {
    pos.set(-0.15 + Math.sin(time * 0.2) * 0.04, 1.55, 4.3 - p * 0.12);
    look.set(-0.35, 1.25, 0.1);
  } else if (id === "instinct") {
    pos.set(0.0, 1.7, 3.9 - p * 0.85); // zoom in (eyes close)
    look.set(0, 1.58, 0.25);
  } else if (id === "protection") {
    pos.set(-0.15, 1.6, 4.4 - p * 0.18);
    look.set(-0.2, 1.3, 0.1);
  } else if (id === "family") {
    pos.set(0.12 * Math.sin(time * 0.15), 1.55, 4.2 - p * 0.22);
    look.set(0, 1.3, 0.15);
  } else {
    // CTA: dolly-out very slow at end
    const out = p > 0.55 ? (p - 0.55) / 0.45 : 0;
    pos.set(0.0, 1.55, 3.8 + out * 0.7);
    look.set(0, 1.35, 0.2);
  }

  cam.position.copy(pos);
  cam.lookAt(look);
  cam.fov = id === "instinct" ? 36 : 42;
  cam.near = 0.1; cam.far = 100;
  cam.updateProjectionMatrix();

  const fx = useMemo(() => ({
    ink: new InkPass(scene, cam, { strength: 0.82, widthNear: 4.4, widthFar: 2.8 }),
    lens: new LensBlur({ maxCoC: 18, nearScale: 1.1 }),
    bloom: makeBloom(),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(GRADES.day, GRADE_STRENGTH.day),
  }), [scene, cam]);
  useEffect(() => () => fx.ink.dispose(), [fx]);

  const focusTarget =
    id === "instinct" ? new THREE.Vector3(0, 1.58, 0.25)
      : id === "protection" ? new THREE.Vector3(-0.3, 1.3, 0.1)
      : new THREE.Vector3(0, 1.35, 0.15);
  fx.lens.focus = Math.max(0.5, pos.distanceTo(focusTarget));
  fx.lens.cInf = id === "instinct" ? 2.6 : id === "family" || id === "cta" ? 3.8 : 4.4;

  const golden = id === "family" || id === "cta" || id === "hook";
  fx.grade.set(golden ? GRADES.golden : GRADES.day);
  fx.grade.amount = golden ? GRADE_STRENGTH.golden : GRADE_STRENGTH.day;
  fx.bloom.intensity = id === "cta" ? 0.5 : 0.38;

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

const overlayBase: React.CSSProperties = {
  position: "absolute",
  left: "6%",
  right: "12%", // keep clear of right UI zone
  top: "12%",
  bottom: "22%", // keep clear of bottom UI zone (~20%)
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "center",
  textAlign: "center",
  fontFamily: '"Montserrat","Poppins","Arial Black","Arial",sans-serif',
  fontWeight: 900,
  lineHeight: 1.1,
  color: "#ffffff",
  textShadow:
    "0 4px 0 rgba(0,0,0,0.55), 0 8px 24px rgba(0,0,0,0.55), 2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000",
  letterSpacing: 1.2,
  pointerEvents: "none",
  whiteSpace: "pre-line",
};

const TextPop: React.FC<{ text: string; fromSec: number; toSec: number; top?: string; fontSize?: number }> = ({
  text, fromSec, toSec, top = "12%", fontSize = 64,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  if (t < fromSec || t > toSec) return null;
  const local = t - fromSec;
  const enter = Math.min(1, local / 0.2);
  const exit = Math.min(1, Math.max(0, (toSec - t) / 0.25));
  const opacity = clamp01(enter) * clamp01(exit);
  const y = (1 - clamp01(enter)) * 24;
  return (
    <div style={{ ...overlayBase, top, fontSize, opacity, transform: `translateY(${y}px)` }}>
      {text}
    </div>
  );
};

export const GatoBanheiro: React.FC = () => {
  const durationSec = GATO_TOTAL_DUR;
  return (
    <AbsoluteFill style={{ backgroundColor: "#1a1510" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@800;900&family=Poppins:wght@800&display=swap');`}</style>
      <ThreeCanvas
        width={1080}
        height={1920}
        camera={{ fov: 42, position: [0, 1.55, 4.6], near: 0.1, far: 100 }}
        gl={{ antialias: false, stencil: false, powerPreference: "high-performance", toneMappingExposure: 1.0 }}
      >
        <SceneRoot />
      </ThreeCanvas>

      {/* On-screen texts synced to words.json timing (safe zones respected) */}
      <TextPop text="POR QUE ELE TE SEGUE?" fromSec={1.0} toSec={4.2} top="13%" fontSize={68} />
      <TextPop text={"NÃO É SÓ CURIOSIDADE..."} fromSec={4.6} toSec={6.8} top="13%" fontSize={58} />
      <TextPop text="1. INSTINTO" fromSec={7.0} toSec={12.7} top="14%" fontSize={64} />
      <TextPop text="2. PROTEÇÃO" fromSec={13.8} toSec={19.6} top="14%" fontSize={64} />
      <TextPop text="3. VOCÊ É A FAMÍLIA" fromSec={20.8} toSec={28.3} top="14%" fontSize={60} />
      <TextPop text={"ELE SÓ QUER FICAR\nPERTO DE VOCÊ"} fromSec={29.2} toSec={35.2} top="12%" fontSize={56} />
      <TextPop text={"SEU GATO FAZ ISSO?\n👇 COMENTA AÍ"} fromSec={35.6} toSec={durationSec} top="14%" fontSize={54} />

      <Audio src={staticFile("gato-banheiro/voice.wav")} />
      <Audio src={staticFile("gato-banheiro/music.wav")} volume={0.1} />
    </AbsoluteFill>
  );
};
