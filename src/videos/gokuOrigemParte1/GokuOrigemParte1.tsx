import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import wordsData from "../../../public/goku-origem-parte1/words.json";

export const GOKU_ORIGEM1_FPS = 30;
export const GOKU_ORIGEM1_FRAMES = 2250; // 75s

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

const SkyBg: React.FC<{ variant?: "day" | "sunset" | "night" | "kame" }> = ({ variant = "day" }) => {
  const bg =
    variant === "sunset" ? "linear-gradient(180deg,#FFB347 0%,#FFCC33 30%,#6EC6FF 60%,#3A8D5C 60%,#2D6E45 100%)" :
    variant === "night" ? "linear-gradient(180deg,#0B1026 0%,#1B2A4A 45%,#243B55 65%,#1A3A2A 65%,#122A1E 100%)" :
    variant === "kame" ? "linear-gradient(180deg,#63BEFF 0%,#2B7FD4 45%,#2182D6 70%,#07264D 100%)" :
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
  if (t > 69.5) return null;
  // show a window of words around current time
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
    <div style={{ fontFamily: "Arial Black, Arial, sans-serif", fontSize: 46, color, textShadow: "0 4px 14px rgba(0,0,0,0.6)", background: "rgba(18,16,20,0.55)", padding: "18px 20px", borderRadius: 22, border: "4px solid #F2C12E" }}>
      {text}
      {sub && <div style={{ fontSize: 28, marginTop: 8, color: "#FFFFFF" }}>{sub}</div>}
    </div>
  </div>
);

// Scene 1: Hook - legend (0-6s / 0-180)
const Scene1: React.FC = () => {
  const f = useCurrentFrame();
  const enter = interpolate(f, [0, 20], [60, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill>
      <SkyBg variant="sunset" />
      <Img src={staticFile("cenario-estrada-montanhas-16bit.svg")} style={{ position: "absolute", left: 0, top: 340, width: 1080, height: 648, opacity: 0.45, ...PX }} />
      <GroundStrip top={GROUND} color="#A0723A" />
      <TitleCard text="A ORIGEM DO GOKU" sub="Parte 1" />
      <Shadow x={140} y={GROUND - 10} w={320} />
      <div style={{ position: "absolute", left: 100, top: GROUND - 336 + enter }}>
        <Img src={staticFile("pergaminho-lenda-16bit.svg")} style={{ width: 400, height: 320, ...PX }} />
      </div>
      <Shadow x={660} y={GROUND - 10} w={260} />
      <Float amp={4} speed={0.05} x={640} y={GROUND - 408}>
        <Img src={staticFile("rei-macaco-chibi-16bit.svg")} style={{ width: 340, height: 408, ...PX }} />
      </Float>
    </AbsoluteFill>
  );
};

// Scene 2: Sun Wukong inspiration (6-18s / 180-540)
const Scene2: React.FC = () => {
  const f = useCurrentFrame();
  const gokuIn = interpolate(f, [0, 25], [80, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill>
      <SkyBg variant="sunset" />
      <Img src={staticFile("cenario-estrada-montanhas-16bit.svg")} style={{ position: "absolute", left: 0, top: 340, width: 1080, height: 648, opacity: 0.4, ...PX }} />
      <GroundStrip top={GROUND} color="#A0723A" />
      <div style={{ position: "absolute", top: 100, left: 80, right: 80, textAlign: "center", fontFamily: "Arial Black", fontSize: 42, color: "#FFE08A", textShadow: "0 3px 10px rgba(0,0,0,0.6)" }}>SUN WUKONG • REI MACACO</div>
      <Shadow x={620} y={GROUND - 10} w={280} />
      <Float amp={4} speed={0.05} x={600} y={GROUND - 408}>
        <Img src={staticFile("rei-macaco-chibi-16bit.svg")} style={{ width: 340, height: 408, ...PX }} />
      </Float>
      <Shadow x={140} y={GROUND - 10} w={220} />
      <div style={{ position: "absolute", left: 120, top: GROUND - 312 + gokuIn }}>
        <Img src={staticFile("goku-gt-chibi-16bit-desconfiado.svg")} style={{ width: 260, height: 312, ...PX }} />
      </div>
    </AbsoluteFill>
  );
};

// Scene 3: Staff, cloud, monkey traits (18-31.3s / 540-939)
const Scene3: React.FC = () => {
  const f = useCurrentFrame();
  const staffIn = interpolate(f, [10, 35], [-120, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const cloudIn = interpolate(f, [70, 100], [120, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill>
      <SkyBg />
      <Img src={staticFile("cenario-estrada-montanhas-16bit.svg")} style={{ position: "absolute", left: 0, top: 340, width: 1080, height: 648, opacity: 0.35, ...PX }} />
      <GroundStrip top={GROUND} />
      <div style={{ position: "absolute", top: 100, left: 80, right: 80, textAlign: "center", fontFamily: "Arial Black", fontSize: 38, color: "#FFF7CC", textShadow: "0 3px 10px rgba(0,0,0,0.6)" }}>BASTÃO • NUVEM • CAUDA</div>
      {/* Bastao on left, standing on ground */}
      <Shadow x={130} y={GROUND - 8} w={80} o={0.15} />
      <div style={{ position: "absolute", left: 140, top: GROUND - 500 + staffIn }}>
        <Img src={staticFile("bastao-magico-16bit.svg")} style={{ width: 60, height: 500, ...PX }} />
      </div>
      {/* Goku center */}
      <Shadow x={430} y={GROUND - 10} w={220} />
      <div style={{ position: "absolute", left: 410, top: GROUND - 336 }}>
        <Img src={staticFile("goku-gt-chibi-16bit.svg")} style={{ width: 280, height: 336, ...PX }} />
      </div>
      {/* Cloud on right, sitting on ground (not floating in air) */}
      <Shadow x={720} y={GROUND - 8} w={260} o={0.15} />
      <div style={{ position: "absolute", left: 700, top: GROUND - 160 + cloudIn }}>
        <Img src={staticFile("nuvem-voadora-16bit.svg")} style={{ width: 320, height: 160, ...PX }} />
      </div>
    </AbsoluteFill>
  );
};

// Scene 4: Manga debut (31.3-42.1s / 939-1263)
const Scene4: React.FC = () => {
  const f = useCurrentFrame();
  const pop = interpolate(f, [0, 20], [0.85, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.back(1.4)) });
  return (
    <AbsoluteFill>
      <SkyBg />
      <Img src={staticFile("cenario-estrada-montanhas-16bit.svg")} style={{ position: "absolute", left: 0, top: 340, width: 1080, height: 648, opacity: 0.35, ...PX }} />
      <GroundStrip top={GROUND} />
      <div style={{ position: "absolute", top: 100, left: 60, right: 60, textAlign: "center", fontFamily: "Arial Black", fontSize: 40, color: "#FFF7CC", textShadow: "0 3px 10px rgba(0,0,0,0.6)" }}>20 NOV 1984 • WEEKLY SHONEN JUMP</div>
      {/* Manga panel */}
      <Shadow x={120} y={GROUND - 8} w={420} />
      <div style={{ position: "absolute", left: 80, top: GROUND - 420, transform: `scale(${pop})`, transformOrigin: "bottom center" }}>
        <div style={{ width: 460, height: 420, background: "#FFFDF5", border: "8px solid #121014", borderRadius: 8, boxShadow: "0 12px 0 rgba(0,0,0,0.15)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 14, left: 14, right: 14, height: 46, background: "#121014", color: "#fff", fontFamily: "Arial Black", fontSize: 26, display: "flex", alignItems: "center", justifyContent: "center" }}>DRAGON BALL</div>
          <Img src={staticFile("goku-gt-chibi-16bit-cutucando.svg")} style={{ position: "absolute", left: 90, top: 80, width: 240, height: 288, ...PX }} />
          <div style={{ position: "absolute", bottom: 16, left: 0, right: 0, textAlign: "center", fontFamily: "Arial Black", fontSize: 20, color: "#121014" }}>Aventura em busca das Esferas</div>
        </div>
      </div>
      {/* Dragon balls on ground right */}
      <Shadow x={640} y={GROUND - 8} w={340} o={0.12} />
      <div style={{ position: "absolute", left: 600, top: GROUND - 140 }}>
        <Img src={staticFile("esferas-dragao-7-16bit.svg")} style={{ width: 420, height: 72, ...PX }} />
      </div>
      <div style={{ position: "absolute", left: 660, top: GROUND - 380 }}>
        <Float amp={4}><Img src={staticFile("goku-gt-chibi-16bit-sorriso-bobo.svg")} style={{ width: 260, height: 312, ...PX }} /></Float>
      </div>
    </AbsoluteFill>
  );
};

// Scene 5: Tail / Oozaru (42.1-50.1s / 1263-1503)
const Scene5: React.FC = () => {
  const f = useCurrentFrame();
  const moonIn = interpolate(f, [0, 30], [-60, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const ozIn = interpolate(f, [60, 100], [0, 1], { extrapolateRight: "clamp" });
  const shake = f > 70 && f < 110 ? Math.sin(f * 1.2) * 3 : 0;
  return (
    <AbsoluteFill style={{ transform: `translateX(${shake}px)` }}>
      <SkyBg variant="night" />
      {/* Stars */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.8) 0 1px, transparent 1px), radial-gradient(circle at 70% 15%, rgba(255,255,255,0.7) 0 1px, transparent 1px), radial-gradient(circle at 85% 30%, rgba(255,255,255,0.6) 0 1px, transparent 1px), radial-gradient(circle at 35% 10%, rgba(255,255,255,0.6) 0 1px, transparent 1px)", opacity: 0.8 }} />
      <GroundStrip top={GROUND} color="#2A4A2A" />
      {/* Moon */}
      <div style={{ position: "absolute", right: 100, top: 120 + moonIn }}>
        <Img src={staticFile("lua-cheia-16bit.svg")} style={{ width: 240, height: 240, ...PX }} />
      </div>
      {/* Oozaru silhouette behind */}
      <div style={{ position: "absolute", left: 560, top: GROUND - 520, opacity: ozIn }}>
        <Img src={staticFile("oozaru-silhueta-16bit.svg")} style={{ width: 420, height: 520, ...PX, filter: "brightness(0.7)" }} />
      </div>
      {/* Goku on ground left */}
      <Shadow x={170} y={GROUND - 10} w={220} />
      <div style={{ position: "absolute", left: 150, top: GROUND - 336 }}>
        <Img src={staticFile("goku-gt-chibi-16bit-assustado.svg")} style={{ width: 280, height: 336, ...PX }} />
      </div>
      <div style={{ position: "absolute", top: 100, left: 80, right: 300, fontFamily: "Arial Black", fontSize: 38, color: "#FFE08A", textShadow: "0 3px 10px rgba(0,0,0,0.8)" }}>A CAUDA... E A LUA CHEIA</div>
    </AbsoluteFill>
  );
};

// Scene 6: Tournament / martial arts (50.1-57.2s / 1503-1716)
const Scene6: React.FC = () => {
  const f = useCurrentFrame();
  const gokuX = interpolate(f, [0, 30], [-80, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const impact = f > 55 && f < 75;
  return (
    <AbsoluteFill>
      <SkyBg />
      <GroundStrip top={GROUND} color="#8B6530" />
      {/* Arena on ground */}
      <div style={{ position: "absolute", left: 90, top: GROUND - 260 }}>
        <Img src={staticFile("arena-torneio-16bit.svg")} style={{ width: 900, height: 260, ...PX }} />
      </div>
      {/* Goku on arena */}
      <Shadow x={430} y={GROUND - 275} w={200} o={0.12} />
      <div style={{ position: "absolute", left: 420 + gokuX, top: GROUND - 275 - 336 }}>
        <Img src={staticFile("goku-gt-chibi-16bit-cutucando.svg")} style={{ width: 280, height: 336, ...PX }} />
      </div>
      {impact && <Img src={staticFile("fx-impact-16bit.svg")} style={{ position: "absolute", left: 520, top: GROUND - 420, width: 160, height: 160, opacity: 0.9, ...PX }} />}
      <div style={{ position: "absolute", top: 100, left: 80, right: 80, textAlign: "center", fontFamily: "Arial Black", fontSize: 42, color: "#FFF7CC", textShadow: "0 3px 10px rgba(0,0,0,0.6)" }}>TORNEIOS E ARTES MARCIAIS</div>
    </AbsoluteFill>
  );
};

// Scene 7: Anime on TV / Kame House (57.2-61.9s / 1716-1857)
const Scene7: React.FC = () => {
  const f = useCurrentFrame();
  const tvIn = interpolate(f, [0, 20], [60, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const islandY = 803;
  return (
    <AbsoluteFill>
      <SkyBg variant="kame" />
      <Img src={staticFile("kame-house-cenario-16bit.svg")} style={{ position: "absolute", left: -130, top: 260, width: 1344, height: 896, ...PX }} />
      <Shadow x={700} y={islandY - 4} w={240} o={0.12} />
      <div style={{ position: "absolute", left: 680, top: islandY - 256 + tvIn }}>
        <Img src={staticFile("tv-crt-16bit.svg")} style={{ width: 320, height: 256, ...PX }} />
      </div>
      <Shadow x={370} y={islandY - 4} w={220} o={0.12} />
      <div style={{ position: "absolute", left: 350, top: islandY - 336 }}>
        <Img src={staticFile("goku-gt-chibi-16bit-sorriso-bobo.svg")} style={{ width: 280, height: 336, ...PX }} />
      </div>
      <div style={{ position: "absolute", top: 100, left: 80, right: 80, textAlign: "center", fontFamily: "Arial Black", fontSize: 44, color: "#FFF7CC", textShadow: "0 3px 10px rgba(0,0,0,0.6)" }}>1986 • O ANIME NASCE</div>
    </AbsoluteFill>
  );
};

// Scene 8: Final - Shenlong + legacy (61.9-75s / 1857-2250)
const Scene8: React.FC = () => {
  const f = useCurrentFrame();
  const enter = interpolate(f, [0, 25], [0, 1], { extrapolateRight: "clamp" });
  const shenIn = interpolate(f, [20, 60], [80, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill style={{ opacity: enter }}>
      <SkyBg variant="kame" />
      <Img src={staticFile("kame-house-cenario-16bit.svg")} style={{ position: "absolute", left: -130, top: 260, width: 1344, height: 896, opacity: 0.7, ...PX }} />
      <div style={{ position: "absolute", left: 90, top: 180 + shenIn, opacity: 0.95 }}>
        <Img src={staticFile("shenlong-16bit.svg")} style={{ width: 900, height: 520, ...PX }} />
      </div>
      <Shadow x={430} y={GROUND - 10} w={240} />
      <div style={{ position: "absolute", left: 400, top: GROUND - 360 }}>
        <Img src={staticFile("goku-gt-chibi-16bit-sorriso-bobo.svg")} style={{ width: 300, height: 360, ...PX }} />
      </div>
      <div style={{ position: "absolute", left: 190, top: GROUND - 140 }}>
        <Img src={staticFile("esferas-dragao-7-16bit.svg")} style={{ width: 700, height: 120, ...PX }} />
      </div>
      <div style={{ position: "absolute", bottom: 210, left: 70, right: 70, textAlign: "center", fontFamily: "Arial Black", fontSize: 44, color: "#FFF7CC", textShadow: "0 4px 14px rgba(0,0,0,0.8)" }}>
        De uma lenda antiga... ao maior herói dos animes
      </div>
      <div style={{ position: "absolute", bottom: 120, left: 90, right: 90, textAlign: "center", fontFamily: "Arial Black", fontSize: 34, color: "#FFFFFF", background: "rgba(18,16,20,0.55)", padding: "14px", borderRadius: 16 }}>
        Parte 1 • Continua na próxima...
      </div>
    </AbsoluteFill>
  );
};

export const GokuOrigemParte1: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Sequence from={0} durationInFrames={180}><Scene1 /></Sequence>
      <Sequence from={180} durationInFrames={360}><Scene2 /></Sequence>
      <Sequence from={540} durationInFrames={399}><Scene3 /></Sequence>
      <Sequence from={939} durationInFrames={324}><Scene4 /></Sequence>
      <Sequence from={1263} durationInFrames={240}><Scene5 /></Sequence>
      <Sequence from={1503} durationInFrames={213}><Scene6 /></Sequence>
      <Sequence from={1716} durationInFrames={141}><Scene7 /></Sequence>
      <Sequence from={1857} durationInFrames={393}><Scene8 /></Sequence>

      <Audio src={staticFile("goku-origem-parte1/voice.wav")} volume={1} />
      <Audio src={staticFile("goku-origem-parte1/bgm.wav")} volume={0.12} loop />
      <Subtitles />
    </AbsoluteFill>
  );
};

export default GokuOrigemParte1;