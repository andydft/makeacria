import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import wordsData from "../../../public/goku-origem-parte3/words.json";

export const GOKU_ORIGEM3_FPS = 30;
export const GOKU_ORIGEM3_FRAMES = 1350; // 45s

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
  if (t > 43.8) return null;
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

const MakankosappoBeam: React.FC<{ progress: number }> = ({ progress }) => {
  const w = interpolate(progress, [0, 1], [0, 420], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: 320, top: GROUND - 250, width: w, height: 24, overflow: "visible" }}>
      <div style={{ width: "100%", height: 24, background: "linear-gradient(180deg,#FFF7B0 0%,#FFE04A 40%,#F2B300 100%)", boxShadow: "0 0 18px rgba(255,224,74,0.9)", borderRadius: 12 }} />
      <div style={{ position: "absolute", left: -10, top: -10, width: 44, height: 44, borderRadius: "50%", background: "radial-gradient(circle,#FFFAC0 0%,#FFE04A 50%,rgba(255,224,74,0) 70%)" }} />
    </div>
  );
};

// S1 0-6s (0-180): alliance
const Scene1: React.FC = () => {
  const f = useCurrentFrame();
  const enter = interpolate(f, [0, 20], [60, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const piccIn = interpolate(f, [40, 70], [120, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill>
      <SkyBg variant="danger" />
      <Img src={staticFile("cenario-estrada-montanhas-16bit.svg")} style={{ position: "absolute", left: 0, top: 340, width: 1080, height: 648, opacity: 0.25, ...PX }} />
      <GroundStrip top={GROUND} />
      <TitleCard text="A ORIGEM DO GOKU" sub="Parte 3: Goku, Piccolo e Raditz" />
      <Shadow x={80} y={GROUND - 10} w={220} />
      <div style={{ position: "absolute", left: 60, top: GROUND - 384 + enter }}>
        <Img src={staticFile("goku-adulto-16bit.svg")} style={{ width: 320, height: 384, ...PX }} />
      </div>
      <Shadow x={330} y={GROUND - 10} w={220} />
      <div style={{ position: "absolute", left: 310 + piccIn, top: GROUND - 384 }}>
        <Img src={staticFile("piccolo-16bit.svg")} style={{ width: 320, height: 384, ...PX }} />
      </div>
      <Shadow x={730} y={GROUND - 10} w={220} />
      <div style={{ position: "absolute", left: 710, top: GROUND - 384 }}>
        <Img src={staticFile("raditz-16bit.svg")} style={{ width: 320, height: 384, transform: "scaleX(-1)", ...PX }} />
      </div>
      <div style={{ position: "absolute", top: 210, left: 250, right: 250, textAlign: "center", fontFamily: "Arial Black", fontSize: 30, color: "#B9F28A", textShadow: "0 3px 10px rgba(0,0,0,0.7)" }}>Aliança improvável</div>
    </AbsoluteFill>
  );
};

// S2 6-14s (180-420): fight together
const Scene2: React.FC = () => {
  const f = useCurrentFrame();
  const shake = f > 30 ? Math.sin(f * 0.9) * 3 : 0;
  const gokuX = 40 + Math.sin(f * 0.11) * 25;
  const piccX = 280 + Math.sin(f * 0.11 + 1) * 20;
  const raditzX = 660 - Math.sin(f * 0.11) * 30;
  const impact = (f > 60 && f < 78) || (f > 130 && f < 148) || (f > 190 && f < 208);
  return (
    <AbsoluteFill style={{ transform: `translateX(${shake}px)` }}>
      <SkyBg variant="danger" />
      <Img src={staticFile("cenario-estrada-montanhas-16bit.svg")} style={{ position: "absolute", left: 0, top: 340, width: 1080, height: 648, opacity: 0.2, ...PX }} />
      <GroundStrip top={GROUND} color="#5A2A1A" />
      <TitleCard text="GOKU + PICCOLO VS RADITZ" color="#FF8080" />
      <Shadow x={gokuX + 50} y={GROUND - 10} w={210} />
      <div style={{ position: "absolute", left: gokuX, top: GROUND - 384 }}>
        <Img src={staticFile("goku-adulto-luta-16bit.svg")} style={{ width: 320, height: 384, ...PX }} />
      </div>
      <Shadow x={piccX + 50} y={GROUND - 10} w={210} />
      <div style={{ position: "absolute", left: piccX, top: GROUND - 384 }}>
        <Img src={staticFile("piccolo-luta-16bit.svg")} style={{ width: 320, height: 384, ...PX }} />
      </div>
      <Shadow x={raditzX + 50} y={GROUND - 10} w={230} />
      <div style={{ position: "absolute", left: raditzX, top: GROUND - 384 }}>
        <Img src={staticFile("raditz-luta-16bit.svg")} style={{ width: 320, height: 384, transform: "scaleX(-1)", ...PX }} />
      </div>
      {impact && <Img src={staticFile("fx-impact-16bit.svg")} style={{ position: "absolute", left: 560, top: GROUND - 360, width: 160, height: 160, opacity: 0.95, ...PX }} />}
      <Img src={staticFile("fx-dust-16bit.svg")} style={{ position: "absolute", left: 280, top: GROUND - 120, width: 520, height: 120, opacity: 0.35, ...PX }} />
    </AbsoluteFill>
  );
};

// S3 14-20s (420-600): Gohan rage
const Scene3: React.FC = () => {
  const f = useCurrentFrame();
  const burst = interpolate(f, [30, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const shake = f > 40 && f < 100 ? Math.sin(f * 1.2) * 6 : 0;
  return (
    <AbsoluteFill style={{ transform: `translateX(${shake}px)` }}>
      <SkyBg variant="dark" />
      <Img src={staticFile("cenario-estrada-montanhas-16bit.svg")} style={{ position: "absolute", left: 0, top: 340, width: 1080, height: 648, opacity: 0.18, ...PX }} />
      <GroundStrip top={GROUND} color="#4A2218" />
      <div style={{ position: "absolute", top: 100, left: 60, right: 60, textAlign: "center", fontFamily: "Arial Black", fontSize: 42, color: "#FFE08A", textShadow: "0 3px 10px rgba(0,0,0,0.8)" }}>A FÚRIA DE GOHAN!</div>
      <Shadow x={80} y={GROUND - 10} w={200} />
      <div style={{ position: "absolute", left: 60, top: GROUND - 384 }}>
        <Img src={staticFile("goku-adulto-ferido-16bit.svg")} style={{ width: 320, height: 384, ...PX }} />
      </div>
      <Shadow x={280} y={GROUND - 10} w={180} />
      <div style={{ position: "absolute", left: 270, top: GROUND - 384 }}>
        <Img src={staticFile("piccolo-luta-16bit.svg")} style={{ width: 320, height: 384, ...PX }} />
      </div>
      <Shadow x={720} y={GROUND - 10} w={220} />
      <div style={{ position: "absolute", left: 700, top: GROUND - 384 }}>
        <Img src={staticFile("raditz-luta-16bit.svg")} style={{ width: 320, height: 384, transform: "scaleX(-1)", ...PX }} />
      </div>
      <div style={{ position: "absolute", left: 500, top: GROUND - 307 - burst * 30, transform: `scale(${1 + burst * 0.15})`, transformOrigin: "bottom center" }}>
        <Img src={staticFile("gohan-crianca-16bit.svg")} style={{ width: 256, height: 307, ...PX }} />
      </div>
      {f > 40 && f < 100 && <Img src={staticFile("fx-impact-16bit.svg")} style={{ position: "absolute", left: 660, top: GROUND - 340, width: 180, height: 180, opacity: 0.9, ...PX }} />}
    </AbsoluteFill>
  );
};

// S4 20-29s (600-870): hold + Makankosappo
const Scene4: React.FC = () => {
  const f = useCurrentFrame();
  const beamProgress = interpolate(f, [120, 170], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const flash = interpolate(f, [150, 165, 195], [0, 0.7, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const shake = f > 140 && f < 210 ? Math.sin(f * 1.5) * 6 : 0;
  return (
    <AbsoluteFill style={{ transform: `translateX(${shake}px)` }}>
      <SkyBg variant="danger" />
      <GroundStrip top={GROUND} color="#4A2218" />
      <div style={{ position: "absolute", top: 100, left: 60, right: 60, textAlign: "center", fontFamily: "Arial Black", fontSize: 42, color: "#FFE04A", textShadow: "0 3px 10px rgba(0,0,0,0.8)" }}>MAKANKŌSAPPŌ!</div>
      {/* Piccolo charging left */}
      <Shadow x={70} y={GROUND - 10} w={220} />
      <div style={{ position: "absolute", left: 50, top: GROUND - 384 }}>
        <Img src={staticFile(f < 110 ? "piccolo-makankosappo-16bit.svg" : "piccolo-luta-16bit.svg")} style={{ width: 320, height: 384, ...PX }} />
      </div>
      {/* Goku holding Raditz */}
      <Shadow x={450} y={GROUND - 10} w={360} />
      <div style={{ position: "absolute", left: 430, top: GROUND - 384 }}>
        <Img src={staticFile("goku-adulto-ferido-16bit.svg")} style={{ width: 320, height: 384, ...PX }} />
      </div>
      <div style={{ position: "absolute", left: 590, top: GROUND - 384 }}>
        <Img src={staticFile("raditz-ferido-16bit.svg")} style={{ width: 320, height: 384, transform: "scaleX(-1)", ...PX }} />
      </div>
      {f > 110 && <MakankosappoBeam progress={beamProgress} />}
      {f > 150 && <Img src={staticFile("fx-impact-16bit.svg")} style={{ position: "absolute", left: 640, top: GROUND - 360, width: 180, height: 180, opacity: interpolate(f, [150, 170, 210], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), ...PX }} />}
      <AbsoluteFill style={{ backgroundColor: "#FFF6D0", opacity: flash }} />
    </AbsoluteFill>
  );
};

// S5 29-45s (870-1350): aftermath + warning
const Scene5: React.FC = () => {
  const f = useCurrentFrame();
  const enter = interpolate(f, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ opacity: enter }}>
      <SkyBg variant="dusk" />
      <Img src={staticFile("cenario-estrada-montanhas-16bit.svg")} style={{ position: "absolute", left: 0, top: 340, width: 1080, height: 648, opacity: 0.3, ...PX }} />
      <GroundStrip top={GROUND} color="#6A4A2A" />
      {/* fallen Goku and Raditz */}
      <Shadow x={220} y={GROUND - 10} w={220} o={0.12} />
      <div style={{ position: "absolute", left: 200, top: GROUND - 360, opacity: 0.8, transform: "rotate(-8deg)" }}>
        <Img src={staticFile("goku-adulto-ferido-16bit.svg")} style={{ width: 300, height: 360, ...PX }} />
      </div>
      <Shadow x={640} y={GROUND - 10} w={220} o={0.1} />
      <div style={{ position: "absolute", left: 620, top: GROUND - 360, opacity: 0.45, transform: "rotate(8deg)" }}>
        <Img src={staticFile("raditz-ferido-16bit.svg")} style={{ width: 300, height: 360, filter: "grayscale(0.4)", transform: "scaleX(-1)", ...PX }} />
      </div>
      {/* Piccolo standing */}
      <Shadow x={470} y={GROUND - 10} w={180} o={0.14} />
      <div style={{ position: "absolute", left: 450, top: GROUND - 384 }}>
        <Img src={staticFile("piccolo-16bit.svg")} style={{ width: 280, height: 336, ...PX }} />
      </div>
      <div style={{ position: "absolute", top: 120, left: 80, right: 80, textAlign: "center", fontFamily: "Arial Black", fontSize: 40, color: "#FFB0B0", textShadow: "0 4px 14px rgba(0,0,0,0.7)" }}>
        O ataque também atingiu Goku...
      </div>
      <div style={{ position: "absolute", bottom: 250, left: 70, right: 70, textAlign: "center", fontFamily: "Arial Black", fontSize: 36, color: "#FFFFFF", textShadow: "0 4px 14px rgba(0,0,0,0.8)" }}>
        “Outros Saiyajins virão à Terra...”
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
      <Sequence from={0} durationInFrames={180}><Scene1 /></Sequence>
      <Sequence from={180} durationInFrames={240}><Scene2 /></Sequence>
      <Sequence from={420} durationInFrames={180}><Scene3 /></Sequence>
      <Sequence from={600} durationInFrames={270}><Scene4 /></Sequence>
      <Sequence from={870} durationInFrames={480}><Scene5 /></Sequence>

      <Audio src={staticFile("goku-origem-parte3/voice.wav")} volume={1} />
      <Audio src={staticFile("goku-origem-parte3/bgm.wav")} volume={0.12} loop />
      <Subtitles />
    </AbsoluteFill>
  );
};

export default GokuOrigemParte3;