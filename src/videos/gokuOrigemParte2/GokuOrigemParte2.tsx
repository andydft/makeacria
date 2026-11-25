import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import wordsData from "../../../public/goku-origem-parte2/words.json";

export const GOKU_ORIGEM2_FPS = 30;
export const GOKU_ORIGEM2_FRAMES = 1500; // 50s

const PX: React.CSSProperties = { imageRendering: "pixelated" };
const GROUND = 1060;
const W = 1080;
const H = 1920;

type Word = { text: string; offset: number; duration: number };
const WORDS = (wordsData as any).words as Word[];

const Shadow: React.FC<{ x: number; y: number; w: number; h?: number; o?: number }> = ({ x, y, w, h = 26, o = 0.18 }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: h, borderRadius: "50%", background: `rgba(0,0,0,${o})`, filter: "blur(2px)" }} />
);

const Float: React.FC<{ children: React.ReactNode; amp?: number; speed?: number; x?: number; y?: number }> = ({ children, amp = 4, speed = 0.06, x = 0, y = 0 }) => {
  const frame = useCurrentFrame();
  const dy = Math.sin(frame * speed) * amp;
  return <div style={{ position: "absolute", left: x, top: y + dy }}>{children}</div>;
};

const SkyBg: React.FC<{ variant?: "day" | "space" | "danger" | "sunset" }> = ({ variant = "day" }) => {
  const bg =
    variant === "space" ? "linear-gradient(180deg,#050814 0%,#101B3A 45%,#1A2747 65%,#2A3A2A 65%,#1A2A1A 100%)" :
    variant === "danger" ? "linear-gradient(180deg,#2B0A0A 0%,#5A1A1A 35%,#8B3A2A 55%,#5A3A1A 55%,#2A1A0A 100%)" :
    variant === "sunset" ? "linear-gradient(180deg,#FFB347 0%,#FFCC33 30%,#6EC6FF 60%,#3A8D5C 60%,#2D6E45 100%)" :
    "linear-gradient(180deg,#4FA4E6 0%,#8FD0FF 45%,#D9A76A 45%,#B37E44 100%)";
  return <AbsoluteFill style={{ background: bg }} />;
};

const GroundStrip: React.FC<{ color?: string; top?: number }> = ({ color = "#8B6530", top = GROUND }) => (
  <div style={{ position: "absolute", left: 0, top, width: W, height: H - top, background: `linear-gradient(180deg,${color} 0%, #5A3E1B 100%)` }} />
);

const Subtitles: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  if (t > 44.5) return null;
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
      {text}
      {sub && <div style={{ fontSize: 26, marginTop: 8, color: "#FFFFFF" }}>{sub}</div>}
    </div>
  </div>
);

// S1 0-6.9s (0-207): peace, Goku + Gohan
const Scene1: React.FC = () => {
  const f = useCurrentFrame();
  const enter = interpolate(f, [0, 20], [60, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill>
      <SkyBg variant="sunset" />
      <Img src={staticFile("cenario-estrada-montanhas-16bit.svg")} style={{ position: "absolute", left: 0, top: 340, width: 1080, height: 648, opacity: 0.45, ...PX }} />
      <GroundStrip top={GROUND} color="#A0723A" />
      <TitleCard text="A ORIGEM DO GOKU" sub="Parte 2: A Chegada de Raditz" />
      <Shadow x={180} y={GROUND - 10} w={260} />
      <div style={{ position: "absolute", left: 160, top: GROUND - 384 + enter }}>
        <Img src={staticFile("goku-adulto-16bit.svg")} style={{ width: 320, height: 384, ...PX }} />
      </div>
      <Shadow x={640} y={GROUND - 10} w={200} />
      <div style={{ position: "absolute", left: 620, top: GROUND - 307 + enter }}>
        <Img src={staticFile("gohan-crianca-16bit.svg")} style={{ width: 256, height: 307, ...PX }} />
      </div>
    </AbsoluteFill>
  );
};

// S2 6.9-15.5s (207-465): Raditz appears
const Scene2: React.FC = () => {
  const f = useCurrentFrame();
  const raditzIn = interpolate(f, [20, 55], [-150, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill>
      <SkyBg variant="space" />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 15% 20%, rgba(255,255,255,0.8) 0 1px, transparent 1px), radial-gradient(circle at 75% 12%, rgba(255,255,255,0.7) 0 1px, transparent 1px), radial-gradient(circle at 55% 28%, rgba(255,255,255,0.5) 0 1px, transparent 1px)", opacity: 0.9 }} />
      <GroundStrip top={GROUND} color="#3A4A3A" />
      <TitleCard text="UM GUERREIRO MISTERIOSO" color="#FF7070" />
      <Shadow x={180} y={GROUND - 10} w={240} />
      <div style={{ position: "absolute", left: 160, top: GROUND - 384 }}>
        <Img src={staticFile("goku-adulto-16bit.svg")} style={{ width: 320, height: 384, ...PX }} />
      </div>
      <Shadow x={650} y={GROUND - 10} w={240} />
      <div style={{ position: "absolute", left: 630 + raditzIn, top: GROUND - 384 }}>
        <Img src={staticFile("raditz-16bit.svg")} style={{ width: 320, height: 384, ...PX }} />
      </div>
    </AbsoluteFill>
  );
};

// S3 15.5-27.7s (465-831): reveal Saiyajin/Kakaroto
const Scene3: React.FC = () => {
  const f = useCurrentFrame();
  const capIn = interpolate(f, [80, 120], [60, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const capO = interpolate(f, [80, 110], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      <SkyBg variant="space" />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 20% 15%, rgba(255,255,255,0.8) 0 1px, transparent 1px), radial-gradient(circle at 80% 25%, rgba(255,255,255,0.6) 0 1px, transparent 1px)", opacity: 0.8 }} />
      <GroundStrip top={GROUND} color="#3A4A3A" />
      <div style={{ position: "absolute", top: 100, left: 70, right: 70, textAlign: "center", fontFamily: "Arial Black", fontSize: 40, color: "#FF7070", textShadow: "0 3px 10px rgba(0,0,0,0.7)" }}>GOKU ERA UM SAIYAJIN!</div>
      <Shadow x={120} y={GROUND - 10} w={230} />
      <div style={{ position: "absolute", left: 100, top: GROUND - 384 }}>
        <Img src={staticFile("goku-adulto-16bit.svg")} style={{ width: 320, height: 384, ...PX }} />
      </div>
      <Shadow x={680} y={GROUND - 10} w={230} />
      <div style={{ position: "absolute", left: 660, top: GROUND - 384 }}>
        <Img src={staticFile("raditz-16bit.svg")} style={{ width: 320, height: 384, ...PX }} />
      </div>
      {/* Capsule reveal */}
      <div style={{ position: "absolute", left: 430, top: GROUND - 320 + capIn, opacity: capO }}>
        <Shadow x={20} y={310} w={160} o={0.12} />
        <Img src={staticFile("capsula-saiyajin-16bit.svg")} style={{ width: 240, height: 288, ...PX }} />
        <div style={{ position: "absolute", left: 70, top: 90 }}>
          <Img src={staticFile("goku-bebe-16bit.svg")} style={{ width: 100, height: 120, ...PX }} />
        </div>
      </div>
      <div style={{ position: "absolute", top: 170, left: 0, right: 0, textAlign: "center", fontFamily: "Arial Black", fontSize: 34, color: "#FFE08A", textShadow: "0 3px 10px rgba(0,0,0,0.8)", opacity: capO }}>KAKAROTO</div>
    </AbsoluteFill>
  );
};

// S4 27.7-39.4s (831-1182): Raditz kidnaps Gohan
const Scene4: React.FC = () => {
  const f = useCurrentFrame();
  const gohanX = interpolate(f, [60, 120], [0, 280], { extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });
  const gohanY = interpolate(f, [60, 120], [0, -80], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const shake = f > 70 && f < 130 ? Math.sin(f * 0.8) * 4 : 0;
  return (
    <AbsoluteFill style={{ transform: `translateX(${shake}px)` }}>
      <SkyBg variant="danger" />
      <Img src={staticFile("cenario-estrada-montanhas-16bit.svg")} style={{ position: "absolute", left: 0, top: 340, width: 1080, height: 648, opacity: 0.25, ...PX }} />
      <GroundStrip top={GROUND} color="#6A3A2A" />
      <TitleCard text="RADITZ SEQUESTRA GOHAN!" color="#FF8080" />
      {/* Goku left desperate */}
      <Shadow x={130} y={GROUND - 10} w={240} />
      <div style={{ position: "absolute", left: 110, top: GROUND - 384 }}>
        <Img src={staticFile("goku-adulto-16bit.svg")} style={{ width: 320, height: 384, ...PX }} />
      </div>
      {/* Gohan being taken */}
      <Shadow x={430 + gohanX * 0.5} y={GROUND - 10} w={160} o={0.12} />
      <div style={{ position: "absolute", left: 420 + gohanX, top: GROUND - 307 + gohanY }}>
        <Img src={staticFile("gohan-crianca-16bit.svg")} style={{ width: 256, height: 307, ...PX }} />
      </div>
      {/* Raditz right */}
      <Shadow x={720} y={GROUND - 10} w={240} />
      <div style={{ position: "absolute", left: 700, top: GROUND - 384 }}>
        <Img src={staticFile("raditz-16bit.svg")} style={{ width: 320, height: 384, ...PX }} />
      </div>
      <Img src={staticFile("fx-impact-16bit.svg")} style={{ position: "absolute", left: 560, top: GROUND - 420, width: 140, height: 140, opacity: interpolate(f, [60, 80, 120], [0, 0.8, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), ...PX }} />
    </AbsoluteFill>
  );
};

// S5 39.4-50s (1182-1500): cliffhanger
const Scene5: React.FC = () => {
  const f = useCurrentFrame();
  const enter = interpolate(f, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ opacity: enter }}>
      <SkyBg variant="danger" />
      <Img src={staticFile("cenario-estrada-montanhas-16bit.svg")} style={{ position: "absolute", left: 0, top: 340, width: 1080, height: 648, opacity: 0.2, ...PX }} />
      <GroundStrip top={GROUND} color="#5A2A1A" />
      <Shadow x={390} y={GROUND - 10} w={280} />
      <div style={{ position: "absolute", left: 370, top: GROUND - 384 }}>
        <Img src={staticFile("goku-adulto-16bit.svg")} style={{ width: 320, height: 384, ...PX }} />
      </div>
      <div style={{ position: "absolute", top: 120, left: 80, right: 80, textAlign: "center", fontFamily: "Arial Black", fontSize: 46, color: "#FFF7CC", textShadow: "0 4px 14px rgba(0,0,0,0.7)" }}>
        GOKU VAI ENFRENTAR O PRÓPRIO IRMÃO...
      </div>
      <div style={{ position: "absolute", bottom: 230, left: 70, right: 70, textAlign: "center", fontFamily: "Arial Black", fontSize: 40, color: "#FFFFFF", textShadow: "0 4px 14px rgba(0,0,0,0.8)" }}>
        ...para salvar Gohan!
      </div>
      <div style={{ position: "absolute", bottom: 120, left: 90, right: 90, textAlign: "center", fontFamily: "Arial Black", fontSize: 34, color: "#FFFFFF", background: "rgba(18,16,20,0.55)", padding: "14px", borderRadius: 16 }}>
        Parte 2 • Continua na Parte 3...
      </div>
    </AbsoluteFill>
  );
};

export const GokuOrigemParte2: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Sequence from={0} durationInFrames={207}><Scene1 /></Sequence>
      <Sequence from={207} durationInFrames={258}><Scene2 /></Sequence>
      <Sequence from={465} durationInFrames={366}><Scene3 /></Sequence>
      <Sequence from={831} durationInFrames={351}><Scene4 /></Sequence>
      <Sequence from={1182} durationInFrames={318}><Scene5 /></Sequence>

      <Audio src={staticFile("goku-origem-parte2/voice.wav")} volume={1} />
      <Audio src={staticFile("goku-origem-parte2/bgm.wav")} volume={0.12} loop />
      <Subtitles />
    </AbsoluteFill>
  );
};

export default GokuOrigemParte2;