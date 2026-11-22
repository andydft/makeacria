import React, { useMemo, useEffect } from "react";
import * as THREE from "three";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { InkPass, noInkFallback, NOINK } from "./ink";
import { LensBlur } from "./lensblur";
import { GradeEffect, GRADES, GRADE_STRENGTH } from "./grade";

export const JIMI3D_FPS = 30;
export const JIMI3D_DURATION = 3957; // ~131.893s

const SEGS = [
  { id: "hook", a: 0.0, b: 7.726 },
  { id: "setting", a: 7.976, b: 19.622 },
  { id: "broom", a: 19.872, b: 31.849 },
  { id: "listen", a: 32.099, b: 42.792 },
  { id: "guitar5", a: 43.042, b: 57.1 },
  { id: "practice", a: 57.35, b: 66.604 },
  { id: "snap", a: 66.854, b: 76.396 },
  { id: "luck1", a: 76.646, b: 82.601 },
  { id: "luck2", a: 82.851, b: 89.028 },
  { id: "analogy", a: 89.278, b: 103.137 },
  { id: "analogy2", a: 103.387, b: 110.671 },
  { id: "conseq", a: 110.921, b: 119.422 },
  { id: "callback", a: 119.672, b: 131.893 },
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
  if (time >= last.b) return { id: last.id as SegId, local: last.b - last.a, dur: last.b - last.a, idx: SEGS.length - 1 };
  return { id: SEGS[0].id as SegId, local: 0, dur: SEGS[0].b - SEGS[0].a, idx: 0 };
};

const makeBloom = () => {
  const b = new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.4, luminanceThreshold: 1.0, luminanceSmoothing: 0.2, mipmapBlur: true, levels: 5, radius: 0.55 });
  return b;
};

function drawBoy(ctx: CanvasRenderingContext2D, w: number, h: number, opts: { prop: "none" | "broom" | "guitar"; strum: number; mood: "neutral" | "happy" | "focus" }) {
  ctx.clearRect(0, 0, w, h);
  const cx = w * 0.5, by = h * 0.92;
  const ink = "#1a1a22";
  const skin = "#f2c9a0";
  const shirt = "#3a6ea5";
  const pants = "#4a3a2a";
  const line = (lw = 6) => { ctx.lineWidth = lw; ctx.strokeStyle = ink; ctx.lineCap = "round"; ctx.lineJoin = "round"; };
  const fillStroke = (fill: string) => { ctx.fillStyle = fill; ctx.fill(); ctx.stroke(); };

  // legs
  line(7);
  ctx.beginPath(); ctx.ellipse(cx - 28, by - 70, 18, 55, 0, 0, Math.PI * 2); fillStroke(pants);
  ctx.beginPath(); ctx.ellipse(cx + 28, by - 70, 18, 55, 0, 0, Math.PI * 2); fillStroke(pants);
  // body
  ctx.beginPath(); ctx.ellipse(cx, by - 170, 55, 70, 0, 0, Math.PI * 2); fillStroke(shirt);
  // arms
  const sa = opts.strum * 0.25;
  ctx.save(); ctx.translate(cx - 55, by - 190); ctx.rotate(0.5 - sa);
  ctx.beginPath(); ctx.ellipse(0, 40, 14, 45, 0, 0, Math.PI * 2); fillStroke(skin); ctx.restore();
  ctx.save(); ctx.translate(cx + 55, by - 190); ctx.rotate(-0.5 + sa);
  ctx.beginPath(); ctx.ellipse(0, 40, 14, 45, 0, 0, Math.PI * 2); fillStroke(skin); ctx.restore();
  // head
  ctx.beginPath(); ctx.ellipse(cx, by - 275, 52, 56, 0, 0, Math.PI * 2); fillStroke(skin);
  // hair
  ctx.beginPath(); ctx.ellipse(cx, by - 300, 54, 32, 0, Math.PI, Math.PI * 2); ctx.fillStyle = "#2b1f1a"; ctx.fill(); ctx.stroke();
  // eyes
  ctx.fillStyle = "#1a1a22";
  ctx.beginPath(); ctx.ellipse(cx - 16, by - 280, 5, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 16, by - 280, 5, 6, 0, 0, Math.PI * 2); ctx.fill();
  // mouth
  line(4); ctx.beginPath();
  if (opts.mood === "happy") ctx.arc(cx, by - 258, 12, 0.1 * Math.PI, 0.9 * Math.PI);
  else if (opts.mood === "focus") { ctx.moveTo(cx - 10, by - 255); ctx.lineTo(cx + 10, by - 255); }
  else { ctx.moveTo(cx - 8, by - 252); ctx.quadraticCurveTo(cx, by - 248, cx + 8, by - 252); }
  ctx.stroke();

  // prop
  if (opts.prop === "broom") {
    const bx = cx + 40, byp = by - 210, ang = -0.35 + sa * 0.4;
    ctx.save(); ctx.translate(bx, byp); ctx.rotate(ang);
    line(8); ctx.strokeStyle = "#7a4a22"; ctx.beginPath(); ctx.moveTo(0, -140); ctx.lineTo(0, 120); ctx.stroke();
    ctx.fillStyle = "#e2c36b"; ctx.strokeStyle = ink; line(5);
    ctx.beginPath(); ctx.moveTo(-22, 120); ctx.lineTo(22, 120); ctx.lineTo(28, 170); ctx.lineTo(-28, 170); ctx.closePath(); fillStroke("#e2c36b");
    ctx.restore();
  } else if (opts.prop === "guitar") {
    const gx = cx + 20, gy = by - 150;
    ctx.save(); ctx.translate(gx, gy); ctx.rotate(-0.15 + sa * 0.2);
    // neck
    line(6); ctx.fillStyle = "#5a3a22"; ctx.strokeStyle = ink;
    ctx.beginPath(); ctx.rect(-8, -150, 16, 130); fillStroke("#5a3a22");
    ctx.beginPath(); ctx.rect(-18, -165, 36, 28); fillStroke("#2b1e16");
    // body
    ctx.beginPath(); ctx.ellipse(0, 20, 42, 46, 0, 0, Math.PI * 2); fillStroke("#b86a3a");
    ctx.beginPath(); ctx.ellipse(0, 70, 36, 40, 0, 0, Math.PI * 2); fillStroke("#b86a3a");
    ctx.beginPath(); ctx.ellipse(0, 45, 14, 14, 0, 0, Math.PI * 2); fillStroke("#1a1410");
    // strings
    line(2); ctx.strokeStyle = "#e8dcc8";
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 3, -140); ctx.lineTo(i * 2.2, 60); ctx.stroke(); }
    ctx.restore();
  }
}

function makeBoyTexture(prop: "none" | "broom" | "guitar", strum: number, mood: "neutral" | "happy" | "focus") {
  const w = 512, h = 768;
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  drawBoy(ctx, w, h, { prop, strum, mood });
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

const BoyCard: React.FC<{ prop: "none" | "broom" | "guitar"; mood: "neutral" | "happy" | "focus"; strum: number; pos: [number, number, number]; scale?: number }> = ({ prop, mood, strum, pos, scale = 1 }) => {
  // quantize strum a bit to limit texture churn
  const q = Math.round(strum * 4) / 4;
  const tex = useMemo(() => makeBoyTexture(prop, q, mood), [prop, q, mood]);
  useEffect(() => () => tex.dispose(), [tex]);
  return (
    <mesh position={pos} scale={scale} layers={NOINK}>
      <planeGeometry args={[2.2, 3.3]} />
      <meshBasicMaterial map={tex} transparent alphaTest={0.05} side={THREE.DoubleSide} />
    </mesh>
  );
};

const House: React.FC<{ pos: [number, number, number]; w?: number; h?: number; d?: number; wall?: string; roof?: string }> = ({ pos, w = 2, h = 1.8, d = 1.6, wall = "#7a6a5a", roof = "#5a3a2a" }) => (
  <group position={pos}>
    <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
      <boxGeometry args={[w, h, d]} />
      <meshLambertMaterial color={wall} />
    </mesh>
    <mesh position={[0, h + 0.45, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
      <coneGeometry args={[Math.max(w, d) * 0.78, 0.9, 4]} />
      <meshLambertMaterial color={roof} />
    </mesh>
  </group>
);

const NoteSprite: React.FC<{ pos: [number, number, number]; color?: string; scale?: number }> = ({ pos, color = "#ffd86b", scale = 1 }) => (
  <group position={pos} scale={scale} layers={NOINK}>
    <mesh>
      <sphereGeometry args={[0.09, 12, 12]} />
      <meshBasicMaterial color={color} transparent opacity={0.95} />
    </mesh>
    <mesh position={[0.05, 0.22, 0]}>
      <cylinderGeometry args={[0.015, 0.015, 0.4, 8]} />
      <meshBasicMaterial color={color} />
    </mesh>
  </group>
);

const WorldScene: React.FC<{ time: number }> = ({ time }) => {
  const { id, local, dur } = segInfo(time);
  const p = smooth(local / dur);
  const strum = Math.sin(time * 10) * 0.4;
  const t = time;

  const boyProp: "none" | "broom" | "guitar" =
    (id === "hook" || id === "broom" || id === "setting") ? "broom" :
    (id === "listen") ? "none" : "guitar";
  const mood: "neutral" | "happy" | "focus" =
    (id === "snap" || id === "callback") ? "happy" : (id === "practice" || id === "guitar5") ? "focus" : "neutral";

  const showHouses = id === "setting" || id === "hook";
  const showRoom = id === "broom" || id === "listen" || id === "guitar5" || id === "practice" || id === "snap" || id === "luck1" || id === "luck2" || id === "conseq";
  const showWall = id === "analogy" || id === "analogy2";
  const showStage = id === "callback";
  const isNight = id === "snap" || id === "callback";

  const groundColor = showStage ? "#2a2230" : showHouses ? "#6b7a5a" : showWall ? "#64686e" : "#5a4b3a";
  const skyColor = isNight ? "#0e1830" : showHouses ? "#7fb0d6" : "#6aa0cc";

  return (
    <group>
      <color attach="background" args={[skyColor]} />
      <fog attach="fog" args={[isNight ? "#101828" : "#9fc0d8", 8, 28]} />
      <ambientLight intensity={isNight ? 0.45 : 0.75} />
      <directionalLight position={[5, 8, 4]} intensity={isNight ? 0.9 : 1.6} color={isNight ? "#ffe0b0" : "#fff4df"} castShadow />
      <directionalLight position={[-4, 3, -2]} intensity={0.35} color="#a8c8ff" />

      {/* ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshLambertMaterial color={groundColor} />
      </mesh>

      {/* simple horizon hills/building blocks for depth */}
      {showHouses && (
        <group>
          <House pos={[-4.5, 0, -6]} w={2.2} h={1.6} wall="#8a7a6a" />
          <House pos={[-1.8, 0, -7]} w={2.0} h={2.0} wall="#6f6a5e" />
          <House pos={[1.2, 0, -6.5]} w={2.4} h={1.7} wall="#7e6b58" />
          <House pos={[4.2, 0, -7.5]} w={2.1} h={2.2} wall="#75685a" />
          <mesh position={[0, 0.8, -10]}><boxGeometry args={[18, 1.6, 2]} /><meshLambertMaterial color="#7a7f88" /></mesh>
        </group>
      )}

      {showRoom && (
        <group>
          <mesh position={[0, 2.2, -3]} receiveShadow><boxGeometry args={[10, 4.5, 0.2]} /><meshLambertMaterial color="#7a6a58" /></mesh>
          <mesh position={[-5, 2.2, 0]} rotation={[0, Math.PI / 2, 0]}><boxGeometry args={[7, 4.5, 0.2]} /><meshLambertMaterial color="#6f6152" /></mesh>
          <mesh position={[5, 2.2, 0]} rotation={[0, Math.PI / 2, 0]}><boxGeometry args={[7, 4.5, 0.2]} /><meshLambertMaterial color="#6f6152" /></mesh>
          {/* radio/table hint */}
          <mesh position={[2.2, 0.5, -1.5]} castShadow><boxGeometry args={[1.2, 1.0, 0.7]} /><meshLambertMaterial color="#5a4634" /></mesh>
          <mesh position={[2.2, 1.15, -1.5]} castShadow><boxGeometry args={[0.8, 0.3, 0.3]} /><meshLambertMaterial color="#3a2f28" /></mesh>
        </group>
      )}

      {showWall && (
        <group>
          <mesh position={[3.5, 2.0, -1.5]} receiveShadow castShadow>
            <boxGeometry args={[0.3, 4.2, 6]} />
            <meshLambertMaterial color="#6b7280" />
          </mesh>
          {(() => {
            const tt = (local % 3) / 3;
            const hit = tt < 0.5;
            const bx = hit ? lerp(-2.5, 3.2, tt * 2) : lerp(3.2, -1.2, (tt - 0.5) * 2);
            const by = 0.35 + Math.sin(tt * Math.PI) * 1.0;
            return <mesh position={[bx, by, 0.2]} castShadow><sphereGeometry args={[0.2, 20, 20]} /><meshLambertMaterial color="#ff8fa3" /></mesh>;
          })()}
        </group>
      )}

      {showStage && (
        <group>
          <mesh position={[0, 0.2, -1]} receiveShadow><boxGeometry args={[8, 0.4, 4]} /><meshLambertMaterial color="#3a2a3f" /></mesh>
          <mesh position={[0, 3.2, -3]}><planeGeometry args={[10, 5]} /><meshBasicMaterial color="#ffd86b" transparent opacity={0.08} /></mesh>
          <pointLight position={[0, 4, 1]} intensity={isNight ? 2.2 : 0.8} color="#ffdca8" distance={12} />
        </group>
      )}

      <BoyCard prop={boyProp} mood={mood} strum={strum} pos={[0, 1.55, 0]} scale={1} />

      {/* floating notes */}
      {(id === "hook" || id === "broom" || id === "listen" || id === "guitar5" || id === "practice" || id === "snap" || id === "callback") && (
        <group>
          {[0,1,2,3,4].map((i) => {
            const yy = 1.0 + ((t * 0.7 + i * 0.55) % 2.4);
            const xx = -1.6 + i * 0.8 + Math.sin(t * 1.4 + i) * 0.18;
            const colors = isNight ? ["#7CFF8A","#ffd86b","#7fd4ff","#ff8fa3","#ffd86b"] : ["#ffd86b","#ffcc66","#ffe08a","#ffd86b","#ffcc66"];
            return <NoteSprite key={i} pos={[xx, yy, 0.8]} color={colors[i]} scale={0.9 + (i%3)*0.12} />;
          })}
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
  const t = time;

  const pos = new THREE.Vector3();
  const look = new THREE.Vector3();
  if (id === "hook") { pos.set(Math.sin(t*0.25)*0.3, 1.7, 4.6 - p*0.4); look.set(0, 1.5, 0); }
  else if (id === "setting") { pos.set(-2.5 + p*4.5, 2.2, 6.5 - p*1.0); look.set(0, 1.1, -2); }
  else if (id === "broom") { pos.set(0.4, 1.6, 4.0 - p*0.3); look.set(0.2, 1.5, 0); }
  else if (id === "listen") { pos.set(1.4 - p*1.0, 1.8, 4.2); look.set(0.3, 1.5, 0); }
  else if (id === "guitar5") { pos.set(0.5, 1.6, 4.1 - p*0.5); look.set(0.1, 1.45, 0); }
  else if (id === "practice") { pos.set(-0.3 + Math.sin(t*0.5)*0.1, 1.55, 3.8); look.set(0, 1.45, 0); }
  else if (id === "snap") { pos.set(0, 1.5, 3.6 - p*0.5); look.set(0, 1.5, 0); }
  else if (id === "luck1") { pos.set(-0.8, 1.7, 4.3); look.set(0, 1.5, 0); }
  else if (id === "luck2") { pos.set(0.8, 1.7, 4.3); look.set(0, 1.5, 0); }
  else if (id === "analogy") { pos.set(-2.0 + p*1.2, 1.7, 5.4 - p*0.4); look.set(0.8, 1.1, 0); }
  else if (id === "analogy2") { pos.set(-1.0 + p*0.8, 1.6, 4.8); look.set(0.6, 1.0, 0); }
  else if (id === "conseq") { pos.set(0.2, 1.7, 4.0); look.set(0, 1.5, 0); }
  else { pos.set(0, 1.9 - p*0.2, 5.0 - p*1.4); look.set(0, 1.5, -0.5); }

  cam.position.copy(pos);
  cam.lookAt(look);
  cam.fov = id === "practice" || id === "snap" ? 38 : 42;
  cam.near = 0.1; cam.far = 100;
  cam.updateProjectionMatrix();

  const fx = useMemo(() => ({
    ink: new InkPass(scene, cam, { strength: 0.85, widthNear: 4.5, widthFar: 2.8 }),
    lens: new LensBlur({ maxCoC: 18, nearScale: 1.1 }),
    bloom: makeBloom(),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(GRADES.day, GRADE_STRENGTH.day),
  }), [scene, cam]);
  useEffect(() => () => fx.ink.dispose(), [fx]);

  // focus on character plane approx
  const fwd = new THREE.Vector3(); cam.getWorldDirection(fwd);
  const targetDist = pos.distanceTo(new THREE.Vector3(0, 1.5, 0));
  fx.lens.focus = Math.max(0.5, targetDist);
  fx.lens.cInf = id === "setting" ? 6 : id === "practice" || id === "snap" ? 3 : 4;
  fx.grade.set(id === "callback" || id === "snap" ? GRADES.golden : GRADES.day);
  fx.grade.amount = id === "callback" || id === "snap" ? GRADE_STRENGTH.golden : GRADE_STRENGTH.day;

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
  const root = useMemo(() => new THREE.Group(), []);
  // noInkFallback will be called in inner; scene traversal done via camera/post component effect not needed, but we add it:
  const { scene } = useThree();
  noInkFallback(scene);
  return (
    <>
      <primitive object={root} />
      <WorldScene time={time} />
      <CameraAndPost time={time} />
    </>
  );
};

export const Jimi3DShort: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0b1020" }}>
      <ThreeCanvas width={1080} height={1920} camera={{ fov: 42, position: [0, 1.7, 4.6], near: 0.1, far: 100 }} gl={{ antialias: false, stencil: false, powerPreference: "high-performance", toneMappingExposure: 1.0 }}>
        <SceneRoot />
      </ThreeCanvas>
      <Audio src={staticFile("jimi/voice.wav")} />
    </AbsoluteFill>
  );
};
