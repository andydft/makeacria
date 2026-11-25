import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import wordsData from "../../../public/goku-lenda-manga-anime/words.json";

export const GOKU_LENDA_FPS = 30;
export const GOKU_LENDA_FRAMES = 960; // 32s (voice ~30s)

const PX: React.CSSProperties = { imageRendering: "pixelated" };
const GROUND_Y = 1015; // bottom line for characters

const Bg: React.FC = () => (
  <AbsoluteFill>
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,#4FA4E6 0%,#8FD0FF 45%,#D9A76A 45%,#B37E44 100%)" }} />
    <Img src={staticFile("cenario-estrada-montanhas-16bit.svg")} style={{ position: "absolute", left: 0, top: 360, width: 1080, height: 648, opacity: 0.45, ...PX }} />
  </AbsoluteFill>
);

const Subtitle: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const words = (wordsData as any).words as { text: string; offset: number; duration: number }[];
  const active = words.filter(w => t >= w.offset - 0.05 && t <= w.offset + w.duration + 0.12);
  const recent = words.filter(w => w.offset <= t).slice(-8);
  const line = (active.length ? active : recent).map(w => w.text).join(" ");
  if (!line || t > 30.2) return null;
  return (
    <div style={{ position: "absolute", bottom: 110, left: 55, right: 55, textAlign: "center", fontFamily: "Arial Black, Arial, sans-serif", fontSize: 42, lineHeight: 1.25, color: "#FFFFFF", textShadow: "0 4px 16px rgba(0,0,0,0.75)", padding: "16px 20px", borderRadius: 18, background: "rgba(17,24,39,0.42)" }}>
      {line}
    </div>
  );
};

const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, 8, 70, 90], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", top: 110, left: 60, right: 60, textAlign: "center", opacity: o }}>
      <div style={{ fontFamily: "Arial Black, Arial, sans-serif", fontSize: 50, color: "#FFF7CC", textShadow: "0 4px 14px rgba(0,0,0,0.6)", background: "rgba(18,16,20,0.55)", padding: "20px", borderRadius: 22, border: "4px solid #F2C12E" }}>
        VOCÊ SABIA?
      </div>
    </div>
  );
};

const CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [800, 825, 940, 960], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", top: 120, left: 70, right: 70, textAlign: "center", opacity: o }}>
      <div style={{ fontFamily: "Arial Black, Arial, sans-serif", fontSize: 40, color: "#FFF7CC", background: "rgba(18,16,20,0.6)", padding: "16px 20px", borderRadius: 20, border: "3px solid #F2C12E" }}>
        Curtiu essa origem? Segue pra mais!
      </div>
    </div>
  );
};

const Float: React.FC<{ children: React.ReactNode; amp?: number; speed?: number }> = ({ children, amp = 6, speed = 0.06 }) => {
  const frame = useCurrentFrame();
  const y = Math.sin(frame * (speed ?? 0.06)) * amp;
  return <div style={{ transform: `translateY(${y}px)` }}>{children}</div>;
};

const GroundShadow: React.FC<{ x: number; y: number; w: number; h?: number; o?: number }> = ({ x, y, w, h = 24, o = 0.18 }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: h, borderRadius: "50%", background: `rgba(0,0,0,${o})`, filter: "blur(2px)" }} />
);

const KameScenery: React.FC<{ opacity?: number; scale?: number; x?: number; y?: number }> = ({ opacity = 1, scale = 1.12, x = -130, y = 260 }) => (
  <AbsoluteFill style={{ opacity }}>
    <Img src={staticFile("kame-house-cenario-16bit.svg")} style={{ position: "absolute", left: x, top: y, width: 1200 * scale, height: 800 * scale, ...PX }} />
  </AbsoluteFill>
);

// Scene 1: Hook + Legend (0-351, 0-11.7s)
const SceneLegend: React.FC = () => {
  const frame = useCurrentFrame();
  const scrollIn = interpolate(frame, [0, 25], [-80, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const monkeyIn = interpolate(frame, [30, 60], [120, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const gokuIn = interpolate(frame, [10, 35], [60, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill>
      <Bg />
      {/* Scroll on ground-left */}
      <GroundShadow x={155} y={GROUND_Y - 8} w={320} />
      <div style={{ position: "absolute", left: 120, top: GROUND_Y - 336 + scrollIn }}>
        <Float amp={3}><Img src={staticFile("pergaminho-lenda-16bit.svg")} style={{ width: 420, height: 336, ...PX }} /></Float>
      </div>
      {/* Rei Macaco on ground-right */}
      <GroundShadow x={660} y={GROUND_Y - 8} w={260} />
      <div style={{ position: "absolute", left: 640, top: GROUND_Y - 408 + monkeyIn }}>
        <Float amp={4} speed={0.05}><Img src={staticFile("rei-macaco-chibi-16bit.svg")} style={{ width: 340, height: 408, ...PX }} /></Float>
      </div>
      {/* Goku front-left */}
      <GroundShadow x={80} y={GROUND_Y - 8} w={190} o={0.14} />
      <div style={{ position: "absolute", left: 60, top: GROUND_Y - 288 + gokuIn }}>
        <Img src={staticFile("goku-gt-chibi-16bit-desconfiado.svg")} style={{ width: 240, height: 288, ...PX }} />
      </div>
    </AbsoluteFill>
  );
};

// Scene 2: Manga (351-528, 11.7-17.6s)
const SceneManga: React.FC = () => {
  const frame = useCurrentFrame();
  const pop = interpolate(frame, [0, 20], [0.85, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.back(1.4)) });
  const slide = interpolate(frame, [0, 25], [40, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill>
      <Bg />
      {/* Manga panel on ground-left */}
      <GroundShadow x={130} y={GROUND_Y - 8} w={360} />
      <div style={{ position: "absolute", left: 90, top: GROUND_Y - 390, transform: `scale(${pop})`, transformOrigin: "bottom center" }}>
        <div style={{ width: 440, height: 390, background: "#FFFDF5", border: "8px solid #121014", borderRadius: 8, boxShadow: "0 12px 0 rgba(0,0,0,0.15)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 14, left: 14, right: 14, height: 48, background: "#121014", color: "#fff", fontFamily: "Arial Black", fontSize: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>DRAGON BALL • 1984</div>
          <Img src={staticFile("goku-gt-chibi-16bit-cutucando.svg")} style={{ position: "absolute", left: 80, top: 78, width: 250, height: 300, ...PX }} />
          <div style={{ position: "absolute", right: 20, bottom: 18, fontFamily: "Arial Black", fontSize: 22, color: "#121014" }}>Akira Toriyama</div>
        </div>
      </div>
      {/* Goku on ground-right */}
      <GroundShadow x={700} y={GROUND_Y - 8} w={220} />
      <div style={{ position: "absolute", left: 680, top: GROUND_Y - 336 + slide }}>
        <Float amp={4}><Img src={staticFile("goku-gt-chibi-16bit.svg")} style={{ width: 280, height: 336, ...PX }} /></Float>
      </div>
    </AbsoluteFill>
  );
};

// Scene 3: Anime/TV on Kame scenery (528-783, 17.6-26.1s)
const SceneAnime: React.FC = () => {
  const frame = useCurrentFrame();
  const tvIn = interpolate(frame, [0, 25], [80, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const bgFade = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  // Kame scenery: x=-130, y=260, w=1344, h=896. Island surface in SVG y~97 => 260 + 97/160*896 = 803
  const islandY = 803;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,#63BEFF 0%,#2B7FD4 45%,#2182D6 70%,#07264D 100%)" }} />
      <KameScenery opacity={bgFade} scale={1.12} x={-130} y={260} />
      {/* TV sitting on island right side */}
      <GroundShadow x={720} y={islandY - 4} w={240} o={0.12} />
      <div style={{ position: "absolute", left: 700, top: islandY - 256 + tvIn }}>
        <Float amp={3}><Img src={staticFile("tv-crt-16bit.svg")} style={{ width: 320, height: 256, ...PX }} /></Float>
      </div>
      {/* Goku on island center-left */}
      <GroundShadow x={390} y={islandY - 4} w={220} o={0.12} />
      <div style={{ position: "absolute", left: 370, top: islandY - 336 }}>
        <Float amp={3} speed={0.04}><Img src={staticFile("goku-gt-chibi-16bit-sorriso-bobo.svg")} style={{ width: 280, height: 336, ...PX }} /></Float>
      </div>
    </AbsoluteFill>
  );
};

// Scene 4: Outro/CTA (783-960)
const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const islandY = 803;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,#63BEFF 0%,#2B7FD4 45%,#2182D6 70%,#07264D 100%)" }} />
      <KameScenery opacity={o} scale={1.12} x={-130} y={260} />
      <GroundShadow x={430} y={islandY - 4} w={220} o={0.12} />
      <Img src={staticFile("goku-gt-chibi-16bit-sorriso-bobo.svg")} style={{ position: "absolute", width: 300, height: 360, left: 390, top: islandY - 360, opacity: o, ...PX }} />
      <div style={{ position: "absolute", bottom: 220, left: 80, right: 80, textAlign: "center", fontFamily: "Arial Black, Arial, sans-serif", fontSize: 46, color: "#FFF7CC", textShadow: "0 4px 14px rgba(0,0,0,0.7)", opacity: o }}>
        De lenda... a mangá... a anime.
      </div>
    </AbsoluteFill>
  );
};

export const GokuLendaMangaAnime: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#4FA4E6" }}>
      <Sequence from={0} durationInFrames={351}><SceneLegend /></Sequence>
      <Sequence from={351} durationInFrames={177}><SceneManga /></Sequence>
      <Sequence from={528} durationInFrames={255}><SceneAnime /></Sequence>
      <Sequence from={783} durationInFrames={177}><Outro /></Sequence>

      <Audio src={staticFile("goku-lenda-manga-anime/voice.wav")} volume={1} />
      <Audio src={staticFile("goku-lenda-manga-anime/bgm.wav")} volume={0.14} />

      <Hook />
      <CTA />
      <Subtitle />
    </AbsoluteFill>
  );
};

export default GokuLendaMangaAnime;
