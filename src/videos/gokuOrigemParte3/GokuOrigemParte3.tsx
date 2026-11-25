import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import wordsData from "../../../public/goku-origem-parte3/words.json";

export const GOKU_ORIGEM3_FPS = 30;
export const GOKU_ORIGEM3_FRAMES = 1260; // 42s

const PX: React.CSSProperties = { imageRendering: "pixelated" };
const GROUND = 1060;
const W = 1080;
type Word = { text: string; offset: number; duration: number };
const WORDS = (wordsData as any).words as Word[];

const Shadow: React.FC<{ x: number; y: number; w: number; h?: number; o?: number }> = ({ x, y, w, h = 26, o = 0.18 }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: h, borderRadius: "50%", background: `rgba(0,0,0,${o})`, filter: "blur(2px)" }} />
);

const SkyBg: React.FC<{ variant?: "danger" | "dusk" | "dark" }> = ({ variant = "danger" }) => {
  const bg =
    variant === "dark" ? "linear-gradient(180deg,#120808 0%,#2B1010 35%,#5A2A1A 55%,#3A2414 55%,#1A120A 100%)" :
    variant === "dusk" ? "linear-gradient(180deg,#3A1C71 0%,#D76D77 40%,#FFAF7B 60%,#6A4A2A 60%,#3A2A1A 100%)" :
    "linear-gradient(180deg,#2B0A0A 0%,#5A1A1A 35%,#8B3A2A 55%,#5A3A1A 55%,#2A1A0A 100%)";
  return <AbsoluteFill style={{ background: bg }} />;
};

const GroundStrip: React.FC<{ color?: string; top?: number }> = ({ color = "#6A3A2A", top = GROUND }) => (
  <div style={{ position: "absolute", left: 0, top, width: W, height: 1920 - top, background: `linear-gradient(180deg,${color} 0%, #3A1E12 100%)` }} />
);

const Subtitles: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  if (t > 38.2) return null;
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

// S1 0-5.5s (0-165): recap, Raditz holding Gohan threat implied
const Scene1: React.FC = () => {
  const f = useCurrentFrame();
  const enter = interpolate(f, [0, 20], [60, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill>
      <SkyBg variant="danger" />
      <Img src={staticFile("cenario-estrada-montanhas-16bit.svg")} style={{ position: "absolute", left: 0, top: 340, width: 1080, height: 648, opacity: 0.25, ...PX }} />
      <GroundStrip top={GROUND} />
      <TitleCard text="A ORIGEM DO GOKU" sub="Parte 3: A Luta Contra Raditz" />
      <Shadow x={170} y={GROUND - 10} w={240} />
      <div style={{ position: "absolute", left: 150, top: GROUND - 384 + enter }}>
        <Img src={staticFile("goku-adulto-16bit.svg")} style={{ width: 320, height: 384, ...PX }} />
      </div>
      <Shadow x={660} y={GROUND - 10} w={240} />
      <div style={{ position: "absolute", left: 640, top: GROUND - 384 + enter }}>
        <Img src={staticFile("raditz-16bit.svg")} style={{ width: 320, height: 384, ...PX }} />
      </div>
      <div style={{ position: "absolute", left: 500, top: GROUND - 240, opacity: 0.9 }}>
        <Img src={staticFile("gohan-crianca-16bit.svg")} style={{ width: 180, height: 216, ...PX }} />
      </div>
    </AbsoluteFill>
  );
};

// S2 5.5-14.5s (165-435): fight
const Scene2: React.FC = () => {
  const f = useCurrentFrame();
  const shake = Math.sin(f * 0.9) * (f > 30 ? 4 : 0);
  const gokuX = 120 + Math.sin(f * 0.12) * 40;
  const raditzX = 640 - Math.sin(f * 0.12) * 40;
  const impact1 = f > 60 && f < 80;
  const impact2 = f > 140 && f < 160;
  const impact3 = f > 210 && f < 230;
  const showBlast = f > 170 && f < 220;
  return (
    <AbsoluteFill style={{ transform: `translateX(${shake}px)` }}>
      <SkyBg variant="danger" />
      <Img src={staticFile("cenario-estrada-montanhas-16bit.svg")} style={{ position: "absolute", left: 0, top: 340, width: 1080, height: 648, opacity: 0.2, ...PX }} />
      <GroundStrip top={GROUND} color="#5A2A1A" />
      <TitleCard text="GOKU VS RADITZ!" color="#FF8080" />
      <Shadow x={gokuX + 40} y={GROUND - 10} w={230} />
      <div style={{ position: "absolute", left: gokuX, top: GROUND - 384 }}>
        <Img src={staticFile("goku-adulto-luta-16bit.svg")} style={{ width: 320, height: 384, ...PX }} />
      </div>
      <Shadow x={raditzX + 40} y={GROUND - 10} w={230} />
      <div style={{ position: "absolute", left: raditzX, top: GROUND - 384 }}>
        <Img src={staticFile("raditz-luta-16bit.svg")} style={{ width: 320, height: 384, ...PX }} />
      </div>
      {(impact1 || impact2 || impact3) && <Img src={staticFile("fx-impact-16bit.svg")} style={{ position: "absolute", left: 470, top: GROUND - 360, width: 160, height: 160, opacity: 0.95, ...PX }} />}
      {showBlast && <Img src={staticFile("ki-blast-16bit.svg")} style={{ position: "absolute", left: interpolate(f, [170, 220], [420, 620]), top: GROUND - 300, width: 128, height: 128, ...PX }} />}
      <Img src={staticFile("fx-dust-16bit.svg")} style={{ position: "absolute", left: 300, top: GROUND - 120, width: 480, height: 120, opacity: 0.35, ...PX }} />
    </AbsoluteFill>
  );
};

// S3 14.5-20.5s (435-615): Gohan rage breach
const Scene3: React.FC = () => {
  const f = useCurrentFrame();
  const burst = interpolate(f, [30, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const shake = f > 40 && f < 90 ? Math.sin(f * 1.2) * 6 : 0;
  return (
    <AbsoluteFill style={{ transform: `translateX(${shake}px)` }}>
      <SkyBg variant="dark" />
      <Img src={staticFile("cenario-estrada-montanhas-16bit.svg")} style={{ position: "absolute", left: 0, top: 340, width: 1080, height: 648, opacity: 0.18, ...PX }} />
      <GroundStrip top={GROUND} color="#4A2218" />
      <div style={{ position: "absolute", top: 100, left: 60, right: 60, textAlign: "center", fontFamily: "Arial Black", fontSize: 42, color: "#FFE08A", textShadow: "0 3px 10px rgba(0,0,0,0.8)" }}>A FÚRIA DE GOHAN!</div>
      <Shadow x={180} y={GROUND - 10} w={220} />
      <div style={{ position: "absolute", left: 160, top: GROUND - 384 }}>
        <Img src={staticFile("goku-adulto-ferido-16bit.svg")} style={{ width: 320, height: 384, ...PX }} />
      </div>
      <Shadow x={690} y={GROUND - 10} w={220} />
      <div style={{ position: "absolute", left: 670, top: GROUND - 384 }}>
        <Img src={staticFile("raditz-luta-16bit.svg")} style={{ width: 320, height: 384, ...PX }} />
      </div>
      {/* Gohan bursts */}
      <div style={{ position: "absolute", left: 460, top: GROUND - 307 - burst * 30, transform: `scale(${1 + burst * 0.15})`, transformOrigin: "bottom center" }}>
        <Img src={staticFile("gohan-crianca-16bit.svg")} style={{ width: 256, height: 307, ...PX }} />
      </div>
      {f > 40 && f < 100 && <Img src={staticFile("fx-impact-16bit.svg")} style={{ position: "absolute", left: 640, top: GROUND - 340, width: 180, height: 180, opacity: 0.9, ...PX }} />}
    </AbsoluteFill>
  );
};

// S4 20.5-27.5s (615-825): decisive moment
const Scene4: React.FC = () => {
  const f = useCurrentFrame();
  const flash = interpolate(f, [70, 85, 110], [0, 0.6, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const shake = f > 70 && f < 120 ? Math.sin(f * 1.5) * 5 : 0;
  return (
    <AbsoluteFill style={{ transform: `translateX(${shake}px)` }}>
      <SkyBg variant="danger" />
      <GroundStrip top={GROUND} color="#4A2218" />
      <div style={{ position: "absolute", top: 100, left: 60, right: 60, textAlign: "center", fontFamily: "Arial Black", fontSize: 42, color: "#FFB0B0", textShadow: "0 3px 10px rgba(0,0,0,0.8)" }}>ATAQUE DECISIVO!</div>
      {/* Goku holding Raditz */}
      <Shadow x={420} y={GROUND - 10} w={320} />
      <div style={{ position: "absolute", left: 320, top: GROUND - 384 }}>
        <Img src={staticFile("goku-adulto-ferido-16bit.svg")} style={{ width: 320, height: 384, ...PX }} />
      </div>
      <div style={{ position: "absolute", left: 500, top: GROUND - 384, opacity: 0.95 }}>
        <Img src={staticFile("raditz-ferido-16bit.svg")} style={{ width: 320, height: 384, ...PX }} />
      </div>
      {f > 70 && <Img src={staticFile("ki-blast-16bit.svg")} style={{ position: "absolute", left: 620, top: GROUND - 320, width: 180, height: 180, opacity: interpolate(f, [70, 90, 130], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), ...PX }} />}
      <AbsoluteFill style={{ backgroundColor: "#FFF6D0", opacity: flash }} />
    </AbsoluteFill>
  );
};

// S5 27.5-42s (825-1260): warning + hook
const Scene5: React.FC = () => {
  const f = useCurrentFrame();
  const enter = interpolate(f, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ opacity: enter }}>
      <SkyBg variant="dusk" />
      <Img src={staticFile("cenario-estrada-montanhas-16bit.svg")} style={{ position: "absolute", left: 0, top: 340, width: 1080, height: 648, opacity: 0.3, ...PX }} />
      <GroundStrip top={GROUND} color="#6A4A2A" />
      <Shadow x={200} y={GROUND - 10} w={220} o={0.12} />
      <div style={{ position: "absolute", left: 180, top: GROUND - 384, opacity: 0.85 }}>
        <Img src={staticFile("goku-adulto-ferido-16bit.svg")} style={{ width: 320, height: 384, ...PX }} />
      </div>
      <Shadow x={660} y={GROUND - 10} w={200} o={0.1} />
      <div style={{ position: "absolute", left: 660, top: GROUND - 384, opacity: 0.45 }}>
        <Img src={staticFile("raditz-ferido-16bit.svg")} style={{ width: 320, height: 384, filter: "grayscale(0.4)", ...PX }} />
      </div>
      <div style={{ position: "absolute", top: 120, left: 80, right: 80, textAlign: "center", fontFamily: "Arial Black", fontSize: 42, color: "#FFB0B0", textShadow: "0 4px 14px rgba(0,0,0,0.7)" }}>
        “Outros Saiyajins virão...”
      </div>
      <div style={{ position: "absolute", bottom: 230, left: 70, right: 70, textAlign: "center", fontFamily: "Arial Black", fontSize: 40, color: "#FFFFFF", textShadow: "0 4px 14px rgba(0,0,0,0.8)" }}>
        A luta acabou... mas o perigo não.
      </div>
      <div style={{ position: "absolute", bottom: 120, left: 90, right: 90, textAlign: "center", fontFamily: "Arial Black", fontSize: 34, color: "#FFFFFF", background: "rgba(18,16,20,0.55)", padding: "14px", borderRadius: 16 }}>
        Parte 3 • Continua na Parte 4...
      </div>
    </AbsoluteFill>
  );
};

export const GokuOrigemParte3: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Sequence from={0} durationInFrames={165}><Scene1 /></Sequence>
      <Sequence from={165} durationInFrames={270}><Scene2 /></Sequence>
      <Sequence from={435} durationInFrames={180}><Scene3 /></Sequence>
      <Sequence from={615} durationInFrames={210}><Scene4 /></Sequence>
      <Sequence from={825} durationInFrames={435}><Scene5 /></Sequence>

      <Audio src={staticFile("goku-origem-parte3/voice.wav")} volume={1} />
      <Audio src={staticFile("goku-origem-parte3/bgm.wav")} volume={0.12} loop />
      <Subtitles />
    </AbsoluteFill>
  );
};

export default GokuOrigemParte3;