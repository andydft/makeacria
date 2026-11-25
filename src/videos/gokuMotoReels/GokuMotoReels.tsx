import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame, interpolate, Easing } from "remotion";

export const GOKU_MOTO_FPS = 30;
export const GOKU_MOTO_FRAMES = 1200; // 40s

const PX: React.CSSProperties = { imageRendering: "pixelated" };

const SceneBg: React.FC<{ shake?: number }> = ({ shake = 0 }) => {
  const frame = useCurrentFrame();
  const sx = shake ? Math.sin(frame * 1.7) * shake : 0;
  const sy = shake ? Math.cos(frame * 2.1) * shake * 0.5 : 0;
  return (
    <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px)` }}>
      <Img src={staticFile("cenario-estrada-montanhas-16bit.svg")} style={{ position: "absolute", left: 0, top: 360, width: 1080, height: 648, ...PX }} />
      {/* sky fill above/below to keep 9:16 clean */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 360, background: "linear-gradient(#4FA4E6,#8FD0FF)" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 912, background: "linear-gradient(#D9A76A 0%, #C4874A 35%, #B37E44 100%)" }} />
      <Img src={staticFile("cenario-estrada-montanhas-16bit.svg")} style={{ position: "absolute", left: 0, top: 360, width: 1080, height: 648, ...PX }} />
    </AbsoluteFill>
  );
};

const Moto: React.FC<{ vibrate?: number; x?: number }> = ({ vibrate = 0, x = 640 }) => {
  const frame = useCurrentFrame();
  const vx = vibrate ? Math.sin(frame * 2.5) * vibrate : 0;
  const vy = vibrate ? Math.cos(frame * 3.1) * vibrate * 0.4 : 0;
  return (
    <Img src={staticFile("moto-chibi-16bit.svg")} style={{ position: "absolute", left: x + vx, top: 620 + vy, width: 360, height: 240, ...PX }} />
  );
};

const Goku: React.FC<{ src: string; x: number; y?: number; scale?: number; flip?: boolean }> = ({ src, x, y = 560, scale = 1, flip = false }) => (
  <Img src={staticFile(src)} style={{ position: "absolute", left: x, top: y, width: 280 * scale, height: 336 * scale, transform: flip ? "scaleX(-1)" : undefined, transformOrigin: "center bottom", ...PX }} />
);

const FxImpact: React.FC<{ x: number; y: number; start: number; dur?: number }> = ({ x, y, start, dur = 10 }) => {
  const frame = useCurrentFrame();
  const t = frame - start;
  if (t < 0 || t > dur) return null;
  const p = t / dur;
  const s = interpolate(p, [0, 0.4, 1], [0.3, 1.2, 0.2]);
  const o = interpolate(p, [0, 0.2, 1], [0, 1, 0]);
  return <Img src={staticFile("fx-impact-16bit.svg")} style={{ position: "absolute", left: x, top: y, width: 180, height: 120, transform: `scale(${s})`, opacity: o, ...PX }} />;
};

const FxSmoke: React.FC<{ x: number; y: number }> = ({ x, y }) => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, 60], [0, -40], { extrapolateRight: "clamp" });
  const o = interpolate(frame, [0, 10, 45, 60], [0, 0.9, 0.6, 0], { extrapolateRight: "clamp" });
  return <Img src={staticFile("fx-smoke-16bit.svg")} style={{ position: "absolute", left: x + drift, top: y - frame * 0.3, width: 220, height: 146, opacity: o, ...PX }} />;
};

const FxScared: React.FC<{ x: number; y: number }> = ({ x, y }) => {
  const frame = useCurrentFrame();
  const bob = Math.sin(frame * 0.4) * 4;
  const o = interpolate(frame, [0, 5, 280, 320], [0, 1, 1, 0], { extrapolateRight: "clamp" });
  return <Img src={staticFile("fx-scared-16bit.svg")} style={{ position: "absolute", left: x, top: y + bob, width: 140, height: 140, opacity: o, ...PX }} />;
};

const FxHorn: React.FC<{ x: number; y: number }> = ({ x, y }) => {
  const frame = useCurrentFrame();
  const pulse = frame % 18 < 9 ? 1 : 0.3;
  return <Img src={staticFile("fx-horn-16bit.svg")} style={{ position: "absolute", left: x, top: y, width: 120, height: 120, opacity: pulse, ...PX }} />;
};

const FxShake: React.FC<{ x: number; y: number }> = ({ x, y }) => {
  const frame = useCurrentFrame();
  const on = frame % 8 < 4;
  return on ? <Img src={staticFile("fx-shake-16bit.svg")} style={{ position: "absolute", left: x, top: y, width: 160, height: 110, opacity: 0.85, ...PX }} /> : null;
};

const Dust: React.FC<{ x: number; y: number; intensity?: number }> = ({ x, y, intensity = 1 }) => {
  const frame = useCurrentFrame();
  const spread = Math.sin(frame * 0.2) * 6 * intensity;
  const o = 0.55 * intensity;
  return <Img src={staticFile("fx-dust-16bit.svg")} style={{ position: "absolute", left: x + spread, top: y, width: 220 * intensity, height: 92 * intensity, opacity: o, ...PX }} />;
};

/* Scene 1: 0-300 (0-10s) */
const Scene1: React.FC = () => {
  const frame = useCurrentFrame();
  const breathe = Math.sin(frame * 0.06) * 2;
  return (
    <AbsoluteFill>
      <SceneBg />
      <Dust x={250} y={820} intensity={0.35} />
      <Dust x={680} y={820} intensity={0.35} />
      <Goku src="goku-gt-chibi-16bit-desconfiado.svg" x={250} y={555 + breathe} />
      <Moto />
    </AbsoluteFill>
  );
};

/* Scene 2: 300-600 (10-20s) */
const Scene2: React.FC = () => {
  const frame = useCurrentFrame(); // local to sequence
  const walk = interpolate(frame, [0, 120, 150, 180], [250, 360, 360, 330], { extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) });
  const lean = interpolate(frame, [90, 130, 160, 190], [0, 8, 8, 0], { extrapolateRight: "clamp" });
  const showCutucando = frame > 30;
  return (
    <AbsoluteFill>
      <SceneBg />
      <Dust x={walk + 20} y={820} intensity={0.35} />
      <Dust x={680} y={820} intensity={0.35} />
      {showCutucando ? (
        <div style={{ position: "absolute", left: walk, top: 555 + lean, width: 280, height: 336, ...PX }}>
          <Img src={staticFile("goku-gt-chibi-16bit-cutucando.svg")} style={{ width: "100%", height: "100%", ...PX }} />
        </div>
      ) : (
        <Goku src="goku-gt-chibi-16bit-desconfiado.svg" x={250} y={555} />
      )}
      <Moto />
      <FxImpact x={590} y={700} start={125} dur={12} />
    </AbsoluteFill>
  );
};

/* Scene 3: 600-960 (20-32s) */
const Scene3: React.FC = () => {
  const frame = useCurrentFrame();
  const jump = frame < 30 ? interpolate(frame, [0, 12, 30], [0, -45, 0], { extrapolateRight: "clamp" }) : 0;
  const tremble = frame > 20 ? Math.sin(frame * 1.2) * 4 : 0;
  const gokuX = interpolate(frame, [0, 20], [330, 240], { extrapolateRight: "clamp" });
  const shake = frame < 180 ? 4 : 0;
  return (
    <AbsoluteFill>
      <SceneBg shake={shake} />
      <Dust x={gokuX + 20} y={820} intensity={0.8} />
      <Dust x={680} y={820} intensity={0.9} />
      <Goku src="goku-gt-chibi-16bit-assustado.svg" x={gokuX + tremble} y={555 + jump} />
      <Moto vibrate={frame < 220 ? 3 : 0} />
      {frame < 120 && <FxSmoke x={590} y={650} />}
      {frame < 260 && <FxHorn x={560} y={600} />}
      {frame < 280 && <FxScared x={gokuX - 20} y={430} />}
      {frame < 180 && <FxShake x={gokuX + 140} y={560} />}
      {frame < 180 && <FxShake x={700} y={580} />}
    </AbsoluteFill>
  );
};

/* Scene 4: 960-1200 (32-40s) */
const Scene4: React.FC = () => {
  const frame = useCurrentFrame();
  const sway = Math.sin(frame * 0.05) * 2;
  const dustFade = interpolate(frame, [0, 60], [0.5, 0.1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      <SceneBg />
      <Dust x={260} y={820} intensity={dustFade} />
      <Dust x={690} y={820} intensity={dustFade} />
      <Goku src="goku-gt-chibi-16bit-sorriso-bobo.svg" x={250} y={555 + sway} />
      <Moto />
    </AbsoluteFill>
  );
};

export const GokuMotoReels: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#5AA9E6" }}>
      <Sequence from={0} durationInFrames={300}><Scene1 /></Sequence>
      <Sequence from={300} durationInFrames={300}><Scene2 /></Sequence>
      <Sequence from={600} durationInFrames={360}><Scene3 /></Sequence>
      <Sequence from={960} durationInFrames={240}><Scene4 /></Sequence>

      {/* Narration */}
      <Sequence from={0} durationInFrames={300}><Audio src={staticFile("goku-moto-reels/scene1.wav")} volume={1} /></Sequence>
      <Sequence from={300} durationInFrames={300}><Audio src={staticFile("goku-moto-reels/scene2.wav")} volume={1} /></Sequence>
      <Sequence from={600} durationInFrames={360}><Audio src={staticFile("goku-moto-reels/scene3.wav")} volume={1} /></Sequence>
      <Sequence from={960} durationInFrames={240}><Audio src={staticFile("goku-moto-reels/scene4.wav")} volume={1} /></Sequence>

      {/* BGM + SFX */}
      <Audio src={staticFile("goku-moto-reels/bgm.wav")} volume={0.18} />
      <Sequence from={425}><Audio src={staticFile("goku-moto-reels/sfx-touch.wav")} volume={0.45} /></Sequence>
      <Sequence from={600}><Audio src={staticFile("goku-moto-reels/sfx-motor.wav")} volume={0.4} /></Sequence>
      <Sequence from={620}><Audio src={staticFile("goku-moto-reels/sfx-horn.wav")} volume={0.35} /></Sequence>
      <Sequence from={610}><Audio src={staticFile("goku-moto-reels/sfx-scare.wav")} volume={0.35} /></Sequence>
    </AbsoluteFill>
  );
};

export default GokuMotoReels;
