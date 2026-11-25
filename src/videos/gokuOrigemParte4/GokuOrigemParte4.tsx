import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import wordsData from "../../../public/goku-origem-parte4/words.json";

export const GOKU_ORIGEM4_FPS = 30;
export const GOKU_ORIGEM4_FRAMES = 1350; // 45s

const PX: React.CSSProperties = { imageRendering: "pixelated" };
const GROUND = 1060;
const W = 1080;
type Word = { text: string; offset: number; duration: number };
const WORDS = (wordsData as any).words as Word[];

const Shadow: React.FC<{ x: number; y: number; w: number; h?: number; o?: number }> = ({ x, y, w, h = 26, o = 0.18 }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: h, borderRadius: "50%", background: `rgba(0,0,0,${o})`, filter: "blur(2px)" }} />
);
const SkyBg: React.FC<{ variant?: "day" | "danger" | "dusk" }> = ({ variant = "day" }) => {
  const bg =
    variant === "danger" ? "linear-gradient(180deg,#2B0A0A 0%,#5A1A1A 35%,#8B3A2A 55%,#5A3A1A 55%,#2A1A0A 100%)" :
    variant === "dusk" ? "linear-gradient(180deg,#3A1C71 0%,#D76D77 40%,#FFAF7B 60%,#6A4A2A 60%,#3A2A1A 100%)" :
    "linear-gradient(180deg,#4FA4E6 0%,#8FD0FF 45%,#D9A76A 45%,#B37E44 100%)";
  return <AbsoluteFill style={{ background: bg }} />;
};
const GroundStrip: React.FC<{ color?: string; top?: number }> = ({ color = "#8B6530", top = GROUND }) => (
  <div style={{ position: "absolute", left: 0, top, width: W, height: 1920 - top, background: `linear-gradient(180deg,${color} 0%, #5A3E1B 100%)` }} />
);
const Subtitles: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  if (t > 39.8) return null;
  const idx = WORDS.findIndex(w => w.offset > t);
  const end = idx === -1 ? WORDS.length : idx;
  const start = Math.max(0, end - 7);
  const slice = WORDS.slice(start, end).filter(w => t - w.offset < 3.5);
  const line = slice.map(w => w.text).join(" ");
  if (!line) return null;
  return (
    <div style={{ position: "absolute", bottom: 95, left: 50, right: 50, textAlign: "center", fontFamily: "Arial Black, Arial, sans-serif", fontSize: 40, lineHeight: 1.25, color: "#FFFFFF", textShadow: "0 4px 16px rgba(0,0,0,0.8)", padding: "14px 18px", borderRadius: 18, background: "rgba(17,24,39,0.45)" }}>
      {line}
    </div>
  );
};
const TitleCard: React.FC<{ text: string; sub?: string; color?: string }> = ({ text, sub, color = "#FFF7CC" }) => (
  <div style={{ position: "absolute", top: 95, left: 60, right: 60, textAlign: "center" }}>
    <div style={{ fontFamily: "Arial Black, Arial, sans-serif", fontSize: 44, color, textShadow: "0 4px 14px rgba(0,0,0,0.6)", background: "rgba(18,16,20,0.55)", padding: "18px 20px", borderRadius: 22, border: "4px solid #F2C12E" }}>
      {text}{sub && <div style={{ fontSize: 26, marginTop: 8, color: "#FFFFFF" }}>{sub}</div>}
    </div>
  </div>
);

// S1 0-10s (0-300): aftermath warning
const Scene1: React.FC = () => {
  const f = useCurrentFrame();
  const enter = interpolate(f, [0, 20], [60, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill>
      <SkyBg variant="dusk" />
      <Img src={staticFile("cenario-estrada-montanhas-16bit.svg")} style={{ position: "absolute", left: 0, top: 340, width: 1080, height: 648, opacity: 0.35, ...PX }} />
      <GroundStrip top={GROUND} color="#7A5A3A" />
      <TitleCard text="A ORIGEM DO GOKU" sub="Parte 4: Vegeta Chega" />
      <Shadow x={180} y={GROUND - 10} w={240} />
      <div style={{ position: "absolute", left: 160, top: GROUND - 384 + enter }}>
        <Img src={staticFile("goku-adulto-16bit.svg")} style={{ width: 320, height: 384, ...PX }} />
      </div>
      <Shadow x={660} y={GROUND - 10} w={220} o={0.12} />
      <div style={{ position: "absolute", left: 660, top: GROUND - 384, opacity: 0.45 }}>
        <Img src={staticFile("raditz-16bit.svg")} style={{ width: 320, height: 384, filter: "grayscale(0.5)", ...PX }} />
      </div>
      <div style={{ position: "absolute", top: 220, left: 600, right: 80, textAlign: "center", fontFamily: "Arial Black", fontSize: 30, color: "#FFB0B0", textShadow: "0 3px 10px rgba(0,0,0,0.7)" }}>â€œDois Saiyajins vÃªm aÃ­...â€</div>
    </AbsoluteFill>
  );
};

// S2 10-20s (300-600): Vegeta arrives
const Scene2: React.FC = () => {
  const f = useCurrentFrame();
  const vegIn = interpolate(f, [20, 55], [140, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill>
      <SkyBg variant="danger" />
      <Img src={staticFile("cenario-estrada-montanhas-16bit.svg")} style={{ position: "absolute", left: 0, top: 340, width: 1080, height: 648, opacity: 0.25, ...PX }} />
      <GroundStrip top={GROUND} color="#6A3A2A" />
      <TitleCard text="VEGETA, PRÃNCIPE DOS SAIYAJINS" color="#FFCC66" />
      <Shadow x={650} y={GROUND - 10} w={260} />
      <div style={{ position: "absolute", left: 620 + vegIn, top: GROUND - 384 }}>
        <Img src={staticFile("vegeta-16bit.svg")} style={{ width: 320, height: 384, ...PX }} />
      </div>
      <Shadow x={170} y={GROUND - 10} w={240} />
      <div style={{ position: "absolute", left: 150, top: GROUND - 384 }}>
        <Img src={staticFile("goku-adulto-16bit.svg")} style={{ width: 320, height: 384, ...PX }} />
      </div>
    </AbsoluteFill>
  );
};

// S3 20-35s (600-1050): battle
const Scene3: React.FC = () => {
  const f = useCurrentFrame();
  const shake = f > 40 && f < 300 ? Math.sin(f * 0.7) * 3 : 0;
  const impact = f > 120 && f < 160;
  const impact2 = f > 260 && f < 300;
  return (
    <AbsoluteFill style={{ transform: `translateX(${shake}px)` }}>
      <SkyBg variant="danger" />
      <Img src={staticFile("cenario-estrada-montanhas-16bit.svg")} style={{ position: "absolute", left: 0, top: 340, width: 1080, height: 648, opacity: 0.2, ...PX }} />
      <GroundStrip top={GROUND} color="#5A2A1A" />
      <TitleCard text="BATALHA SAIYAJIN" color="#FF8080" />
      <Shadow x={170} y={GROUND - 10} w={240} />
      <div style={{ position: "absolute", left: 150 + Math.sin(f * 0.05) * 10, top: GROUND - 384 }}>
        <Img src={staticFile("goku-adulto-16bit.svg")} style={{ width: 320, height: 384, ...PX }} />
      </div>
      <Shadow x={650} y={GROUND - 10} w={240} />
      <div style={{ position: "absolute", left: 630 - Math.sin(f * 0.05) * 10, top: GROUND - 384 }}>
        <Img src={staticFile("vegeta-16bit.svg")} style={{ width: 320, height: 384, ...PX }} />
      </div>
      {(impact || impact2) && <Img src={staticFile("fx-impact-16bit.svg")} style={{ position: "absolute", left: 470, top: GROUND - 360, width: 160, height: 160, opacity: 0.9, ...PX }} />}
    </AbsoluteFill>
  );
};

// S4 35-45s (1050-1350): Vegeta survives, rivalry, CTA
const Scene4: React.FC = () => {
  const f = useCurrentFrame();
  const enter = interpolate(f, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ opacity: enter }}>
      <SkyBg variant="dusk" />
      <Img src={staticFile("cenario-estrada-montanhas-16bit.svg")} style={{ position: "absolute", left: 0, top: 340, width: 1080, height: 648, opacity: 0.3, ...PX }} />
      <GroundStrip top={GROUND} color="#6A4A2A" />
      <Shadow x={190} y={GROUND - 10} w={240} />
      <div style={{ position: "absolute", left: 170, top: GROUND - 384 }}>
        <Img src={staticFile("goku-adulto-16bit.svg")} style={{ width: 320, height: 384, ...PX }} />
      </div>
      <Shadow x={650} y={GROUND - 10} w={240} />
      <div style={{ position: "absolute", left: 630, top: GROUND - 384 }}>
        <Img src={staticFile("vegeta-16bit.svg")} style={{ width: 320, height: 384, ...PX }} />
      </div>
      <div style={{ position: "absolute", top: 120, left: 80, right: 80, textAlign: "center", fontFamily: "Arial Black", fontSize: 44, color: "#FFF7CC", textShadow: "0 4px 14px rgba(0,0,0,0.7)" }}>
        VEGETA SOBREVIVEU...
      </div>
      <div style={{ position: "absolute", bottom: 230, left: 70, right: 70, textAlign: "center", fontFamily: "Arial Black", fontSize: 40, color: "#FFFFFF", textShadow: "0 4px 14px rgba(0,0,0,0.8)" }}>
        E a rivalidade sÃ³ comeÃ§ou!
      </div>
      <div style={{ position: "absolute", bottom: 120, left: 90, right: 90, textAlign: "center", fontFamily: "Arial Black", fontSize: 34, color: "#FFFFFF", background: "rgba(18,16,20,0.55)", padding: "14px", borderRadius: 16 }}>
        Parte 3 â€¢ Continua na Parte 4...
      </div>
    </AbsoluteFill>
  );
};

export const GokuOrigemParte4: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Sequence from={0} durationInFrames={300}><Scene1 /></Sequence>
      <Sequence from={300} durationInFrames={300}><Scene2 /></Sequence>
      <Sequence from={600} durationInFrames={450}><Scene3 /></Sequence>
      <Sequence from={1050} durationInFrames={300}><Scene4 /></Sequence>

      <Audio src={staticFile("goku-origem-parte4/voice.wav")} volume={1} />
      <Audio src={staticFile("goku-origem-parte4/bgm.wav")} volume={0.12} loop />
      <Subtitles />
    </AbsoluteFill>
  );
};

export default GokuOrigemParte4;
