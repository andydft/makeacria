import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import wordsData from "../../../public/goku-origem-parte2/words.json";

export const GOKU_ORIGEM2_FPS = 30;
export const GOKU_ORIGEM2_FRAMES = 1980; // 66s

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

const SkyBg: React.FC<{ variant?: "day" | "space" | "namek" | "sunset" | "kame" }> = ({ variant = "day" }) => {
  const bg =
    variant === "space" ? "linear-gradient(180deg,#050814 0%,#101B3A 45%,#1A2747 65%,#2A3A2A 65%,#1A2A1A 100%)" :
    variant === "namek" ? "linear-gradient(180deg,#7ED957 0%,#5BC4A8 35%,#7EC8E3 55%,#4A90A4 70%,#2F5F4F 70%,#1F4035 100%)" :
    variant === "sunset" ? "linear-gradient(180deg,#FFB347 0%,#FFCC33 30%,#6EC6FF 60%,#3A8D5C 60%,#2D6E45 100%)" :
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
  if (t > 59.5) return null;
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

const TitleCard: React.FC<{ text: string; sub?: string }> = ({ text, sub }) => (
  <div style={{ position: "absolute", top: 95, left: 60, right: 60, textAlign: "center" }}>
    <div style={{ fontFamily: "Arial Black, Arial, sans-serif", fontSize: 44, color: "#FFF7CC", textShadow: "0 4px 14px rgba(0,0,0,0.6)", background: "rgba(18,16,20,0.55)", padding: "18px 20px", borderRadius: 22, border: "4px solid #F2C12E" }}>
      {text}
      {sub && <div style={{ fontSize: 26, marginTop: 8, color: "#FFFFFF" }}>{sub}</div>}
    </div>
  </div>
);

// S1 0-7.1s (0-213): recap + Goku adulto & Gohan
const Scene1: React.FC = () => {
  const f = useCurrentFrame();
  const enter = interpolate(f, [0, 20], [60, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill>
      <SkyBg variant="sunset" />
      <Img src={staticFile("cenario-estrada-montanhas-16bit.svg")} style={{ position: "absolute", left: 0, top: 340, width: 1080, height: 648, opacity: 0.45, ...PX }} />
      <GroundStrip top={GROUND} color="#A0723A" />
      <TitleCard text="A ORIGEM DO GOKU" sub="Parte 2" />
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

// S2 7.1-26.9s (213-807): Raditz reveal, Saiyajin, capsule, tail
const Scene2: React.FC = () => {
  const f = useCurrentFrame();
  const raditzIn = interpolate(f, [0, 25], [120, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const capsuleIn = interpolate(f, [200, 240], [80, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const showCapsule = f > 180;
  return (
    <AbsoluteFill>
      <SkyBg variant="space" />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 15% 20%, rgba(255,255,255,0.8) 0 1px, transparent 1px), radial-gradient(circle at 75% 12%, rgba(255,255,255,0.7) 0 1px, transparent 1px), radial-gradient(circle at 55% 28%, rgba(255,255,255,0.5) 0 1px, transparent 1px), radial-gradient(circle at 88% 22%, rgba(255,255,255,0.6) 0 1px, transparent 1px)", opacity: 0.9 }} />
      <GroundStrip top={GROUND} color="#3A4A3A" />
      <div style={{ position: "absolute", top: 100, left: 80, right: 80, textAlign: "center", fontFamily: "Arial Black", fontSize: 40, color: "#FF7070", textShadow: "0 3px 10px rgba(0,0,0,0.7)" }}>GOKU ERA UM SAIYAJIN!</div>
      {/* Goku left */}
      <Shadow x={140} y={GROUND - 10} w={250} />
      <div style={{ position: "absolute", left: 120, top: GROUND - 384 }}>
        <Img src={staticFile("goku-adulto-16bit.svg")} style={{ width: 320, height: 384, ...PX }} />
      </div>
      {/* Raditz right */}
      <Shadow x={660} y={GROUND - 10} w={240} />
      <div style={{ position: "absolute", left: 640 + raditzIn, top: GROUND - 384 }}>
        <Img src={staticFile("raditz-16bit.svg")} style={{ width: 320, height: 384, ...PX }} />
      </div>
      {/* Capsule + baby Goku appear as reveal */}
      {showCapsule && (
        <>
          <Shadow x={450} y={GROUND - 10} w={160} o={0.12} />
          <div style={{ position: "absolute", left: 440, top: GROUND - 307 + capsuleIn, opacity: interpolate(f, [180, 210], [0, 1], { extrapolateRight: "clamp" }) }}>
            <Img src={staticFile("capsula-saiyajin-16bit.svg")} style={{ width: 256, height: 307, ...PX }} />
          </div>
          <div style={{ position: "absolute", left: 500, top: GROUND - 220 + capsuleIn, opacity: interpolate(f, [200, 230], [0, 1], { extrapolateRight: "clamp" }) }}>
            <Img src={staticFile("goku-bebe-16bit.svg")} style={{ width: 120, height: 144, ...PX }} />
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};

// S3 26.9-37.8s (807-1134): Vegeta
const Scene3: React.FC = () => {
  const f = useCurrentFrame();
  const vegIn = interpolate(f, [0, 25], [100, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill>
      <SkyBg />
      <Img src={staticFile("cenario-estrada-montanhas-16bit.svg")} style={{ position: "absolute", left: 0, top: 340, width: 1080, height: 648, opacity: 0.35, ...PX }} />
      <GroundStrip top={GROUND} />
      <div style={{ position: "absolute", top: 100, left: 80, right: 80, textAlign: "center", fontFamily: "Arial Black", fontSize: 42, color: "#FFF7CC", textShadow: "0 3px 10px rgba(0,0,0,0.6)" }}>VEGETA, O PRÍNCIPE SAIYAJIN</div>
      <Shadow x={160} y={GROUND - 10} w={240} />
      <div style={{ position: "absolute", left: 140, top: GROUND - 384 }}>
        <Img src={staticFile("goku-adulto-16bit.svg")} style={{ width: 320, height: 384, ...PX }} />
      </div>
      <Shadow x={660} y={GROUND - 10} w={240} />
      <div style={{ position: "absolute", left: 640 + vegIn, top: GROUND - 384 }}>
        <Img src={staticFile("vegeta-16bit.svg")} style={{ width: 320, height: 384, ...PX }} />
      </div>
      {/* small energy sparks */}
      <Img src={staticFile("fx-impact-16bit.svg")} style={{ position: "absolute", left: 480, top: GROUND - 280, width: 120, height: 120, opacity: 0.35, ...PX }} />
    </AbsoluteFill>
  );
};

// S4 37.8-50.5s (1134-1515): SSJ curiosity
const Scene4: React.FC = () => {
  const f = useCurrentFrame();
  const flash = interpolate(f, [60, 80, 110], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const showSSJ = f > 75;
  return (
    <AbsoluteFill>
      <SkyBg variant="sunset" />
      <Img src={staticFile("cenario-estrada-montanhas-16bit.svg")} style={{ position: "absolute", left: 0, top: 340, width: 1080, height: 648, opacity: 0.4, ...PX }} />
      <GroundStrip top={GROUND} color="#A0723A" />
      <div style={{ position: "absolute", top: 100, left: 70, right: 70, textAlign: "center", fontFamily: "Arial Black", fontSize: 38, color: "#FFF7CC", textShadow: "0 3px 10px rgba(0,0,0,0.6)" }}>O SUPER SAIYAJIN NASCEU...</div>
      <Shadow x={430} y={GROUND - 10} w={260} />
      {!showSSJ ? (
        <div style={{ position: "absolute", left: 400, top: GROUND - 384 }}>
          <Img src={staticFile("goku-adulto-16bit.svg")} style={{ width: 320, height: 384, ...PX }} />
        </div>
      ) : (
        <Float amp={3} speed={0.08} x={390} y={GROUND - 384}>
          <Img src={staticFile("goku-adulto-ssj-16bit.svg")} style={{ width: 320, height: 384, ...PX }} />
        </Float>
      )}
      <AbsoluteFill style={{ backgroundColor: "#FFF4B0", opacity: flash * 0.35 }} />
      {showSSJ && <div style={{ position: "absolute", top: 170, left: 0, right: 0, textAlign: "center", fontFamily: "Arial Black", fontSize: 34, color: "#FFE973", textShadow: "0 3px 10px rgba(0,0,0,0.7)" }}>CABELO DOURADO ICÔNICO!</div>}
    </AbsoluteFill>
  );
};

// S5 50.5-66s (1515-1980): Legacy + CTA
const Scene5: React.FC = () => {
  const f = useCurrentFrame();
  const enter = interpolate(f, [0, 25], [0, 1], { extrapolateRight: "clamp" });
  const shenIn = interpolate(f, [20, 60], [80, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill style={{ opacity: enter }}>
      <SkyBg variant="kame" />
      <Img src={staticFile("kame-house-cenario-16bit.svg")} style={{ position: "absolute", left: -130, top: 260, width: 1344, height: 896, opacity: 0.7, ...PX }} />
      <div style={{ position: "absolute", left: 90, top: 170 + shenIn, opacity: 0.95 }}>
        <Img src={staticFile("shenlong-16bit.svg")} style={{ width: 900, height: 520, ...PX }} />
      </div>
      <Shadow x={430} y={GROUND - 10} w={240} />
      <div style={{ position: "absolute", left: 400, top: GROUND - 384 }}>
        <Img src={staticFile("goku-adulto-ssj-16bit.svg")} style={{ width: 320, height: 384, ...PX }} />
      </div>
      <div style={{ position: "absolute", left: 190, top: GROUND - 140 }}>
        <Img src={staticFile("esferas-dragao-7-16bit.svg")} style={{ width: 700, height: 120, ...PX }} />
      </div>
      <div style={{ position: "absolute", bottom: 210, left: 70, right: 70, textAlign: "center", fontFamily: "Arial Black", fontSize: 42, color: "#FFF7CC", textShadow: "0 4px 14px rgba(0,0,0,0.8)" }}>
        De lenda... a saga lendária
      </div>
      <div style={{ position: "absolute", bottom: 120, left: 90, right: 90, textAlign: "center", fontFamily: "Arial Black", fontSize: 34, color: "#FFFFFF", background: "rgba(18,16,20,0.55)", padding: "14px", borderRadius: 16 }}>
        Parte 2 • Continua na próxima...
      </div>
    </AbsoluteFill>
  );
};

export const GokuOrigemParte2: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Sequence from={0} durationInFrames={213}><Scene1 /></Sequence>
      <Sequence from={213} durationInFrames={594}><Scene2 /></Sequence>
      <Sequence from={807} durationInFrames={327}><Scene3 /></Sequence>
      <Sequence from={1134} durationInFrames={381}><Scene4 /></Sequence>
      <Sequence from={1515} durationInFrames={465}><Scene5 /></Sequence>

      <Audio src={staticFile("goku-origem-parte2/voice.wav")} volume={1} />
      <Audio src={staticFile("goku-origem-parte2/bgm.wav")} volume={0.12} loop />
      <Subtitles />
    </AbsoluteFill>
  );
};

export default GokuOrigemParte2;