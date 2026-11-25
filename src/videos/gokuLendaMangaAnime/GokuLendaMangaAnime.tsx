import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame, interpolate, Easing } from "remotion";

export const GOKU_LENDA_FPS = 30;
export const GOKU_LENDA_FRAMES = 960; // 32s

const PX: React.CSSProperties = { imageRendering: "pixelated" };

const Bg: React.FC = () => (
  <AbsoluteFill>
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,#4FA4E6 0%,#8FD0FF 45%,#D9A76A 45%,#B37E44 100%)" }} />
    <Img src={staticFile("cenario-estrada-montanhas-16bit.svg")} style={{ position: "absolute", left: 0, top: 360, width: 1080, height: 648, opacity: 0.35, ...PX }} />
  </AbsoluteFill>
);

const Subtitle: React.FC = () => {
  const frame = useCurrentFrame();
  // simple timed captions based on narration beats
  const lines: { from: number; to: number; text: string }[] = [
    { from: 0, to: 90, text: "Você sabia que o Goku nasceu\nde uma lenda antiga?" },
    { from: 90, to: 210, text: "Inspiração: Rei Macaco, Sun Wukong\nLenda chinesa Jornada ao Oeste" },
    { from: 210, to: 330, text: "Muito famosa também no Japão" },
    { from: 330, to: 540, text: "1984: Akira Toriyama\ncriou Dragon Ball em mangá" },
    { from: 540, to: 750, text: "Depois virou anime na TV\npara o mundo inteiro" },
    { from: 750, to: 960, text: "E o Goku virou um dos heróis\nmais conhecidos de todos os tempos" },
  ];
  const line = lines.find(l => frame >= l.from && frame < l.to);
  if (!line) return null;
  const local = frame - line.from;
  const o = interpolate(local, [0, 8, (line.to - line.from) - 8, line.to - line.from], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", bottom: 110, left: 60, right: 60, textAlign: "center", fontFamily: "Arial Black, Arial, sans-serif", fontSize: 44, lineHeight: 1.25, color: "#FFFFFF", textShadow: "0 4px 16px rgba(0,0,0,0.7)", whiteSpace: "pre-line", opacity: o, padding: "16px 20px", borderRadius: 18, background: "rgba(17,24,39,0.35)" }}>
      {line.text}
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

const Float: React.FC<{ children: React.ReactNode; amp?: number; speed?: number }> = ({ children, amp = 6, speed = 0.06 }) => {
  const frame = useCurrentFrame();
  const y = Math.sin(frame * speed) * amp;
  return <div style={{ transform: `translateY(${y}px)` }}>{children}</div>;
};

const SceneLegend: React.FC = () => {
  const frame = useCurrentFrame();
  const scrollIn = interpolate(frame, [0, 25], [-80, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const monkeyIn = interpolate(frame, [30, 60], [120, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill>
      <Bg />
      <div style={{ position: "absolute", left: 120, top: 430 + scrollIn }}>
        <Float amp={4}><Img src={staticFile("pergaminho-lenda-16bit.svg")} style={{ width: 420, height: 336, ...PX }} /></Float>
      </div>
      <div style={{ position: "absolute", right: 120, top: 500 + monkeyIn }}>
        <Float amp={5} speed={0.05}><Img src={staticFile("rei-macaco-chibi-16bit.svg")} style={{ width: 340, height: 408, ...PX }} /></Float>
      </div>
      <div style={{ position: "absolute", left: 170, top: 820 }}>
        <Img src={staticFile("goku-gt-chibi-16bit-desconfiado.svg")} style={{ width: 240, height: 288, ...PX }} />
      </div>
    </AbsoluteFill>
  );
};

const SceneManga: React.FC = () => {
  const frame = useCurrentFrame();
  const pop = interpolate(frame, [0, 20], [0.8, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.back(1.5)) });
  return (
    <AbsoluteFill>
      <Bg />
      <div style={{ position: "absolute", left: 90, top: 420, transform: `scale(${pop})`, transformOrigin: "center" }}>
        <div style={{ width: 420, height: 360, background: "#FFFDF5", border: "8px solid #121014", borderRadius: 8, boxShadow: "0 12px 0 rgba(0,0,0,0.15)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 16, left: 16, right: 16, height: 50, background: "#121014", color: "#fff", fontFamily: "Arial Black", fontSize: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>DRAGON BALL • 1984</div>
          <Img src={staticFile("goku-gt-chibi-16bit-cutucando.svg")} style={{ position: "absolute", left: 70, top: 80, width: 260, height: 312, ...PX }} />
          <div style={{ position: "absolute", right: 24, bottom: 24, fontFamily: "Arial Black", fontSize: 24, color: "#121014" }}>Akira Toriyama</div>
        </div>
      </div>
      <div style={{ position: "absolute", right: 100, top: 500 }}>
        <Float amp={5}><Img src={staticFile("goku-gt-chibi-16bit.svg")} style={{ width: 300, height: 360, ...PX }} /></Float>
      </div>
    </AbsoluteFill>
  );
};

const KameScenery: React.FC<{ opacity?: number; scale?: number; x?: number; y?: number }> = ({ opacity = 1, scale = 1, x = -60, y = 320 }) => (
  <AbsoluteFill style={{ opacity }}>
    <Img src={staticFile("kame-house-cenario-16bit.svg")} style={{ position: "absolute", left: x, top: y, width: 1200 * scale, height: 800 * scale, ...PX }} />
  </AbsoluteFill>
);

const SceneAnime: React.FC = () => {
  const frame = useCurrentFrame();
  const tvIn = interpolate(frame, [0, 25], [80, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const bgFade = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,#63BEFF 0%,#2B7FD4 45%,#2182D6 70%,#07264D 100%)" }} />
      <KameScenery opacity={bgFade} scale={1.02} x={-70} y={300} />
      <div style={{ position: "absolute", right: 70, top: 350 + tvIn }}>
        <Float amp={4}><Img src={staticFile("tv-crt-16bit.svg")} style={{ width: 320, height: 256, ...PX }} /></Float>
      </div>
      <div style={{ position: "absolute", left: 360, top: 760 }}>
        <Float amp={3} speed={0.04}><Img src={staticFile("goku-gt-chibi-16bit-sorriso-bobo.svg")} style={{ width: 280, height: 336, ...PX }} /></Float>
      </div>
    </AbsoluteFill>
  );
};

const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,#63BEFF 0%,#2B7FD4 45%,#2182D6 70%,#07264D 100%)" }} />
      <KameScenery opacity={o} scale={1.02} x={-70} y={280} />
      <Img src={staticFile("goku-gt-chibi-16bit-sorriso-bobo.svg")} style={{ position: "absolute", width: 300, height: 360, left: 390, top: 760, opacity: o, ...PX }} />
      <div style={{ position: "absolute", bottom: 150, left: 80, right: 80, textAlign: "center", fontFamily: "Arial Black, Arial, sans-serif", fontSize: 48, color: "#FFF7CC", textShadow: "0 4px 14px rgba(0,0,0,0.6)", opacity: o }}>
        De lenda... a mangá... a anime.
      </div>
    </AbsoluteFill>
  );
};

export const GokuLendaMangaAnime: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#4FA4E6" }}>
      <Sequence from={0} durationInFrames={330}><SceneLegend /></Sequence>
      <Sequence from={330} durationInFrames={210}><SceneManga /></Sequence>
      <Sequence from={540} durationInFrames={240}><SceneAnime /></Sequence>
      <Sequence from={780} durationInFrames={180}><Outro /></Sequence>

      <Audio src={staticFile("goku-lenda-manga-anime/voice.wav")} volume={1} />
      <Audio src={staticFile("goku-lenda-manga-anime/bgm.wav")} volume={0.14} />

      <Hook />
      <Subtitle />
    </AbsoluteFill>
  );
};

export default GokuLendaMangaAnime;
