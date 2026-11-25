import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import wordsData from "../../../public/dragon-ball-gt-curiosity/words.json";

export const DBGT_CURIOSITY_FPS = 30;
export const DBGT_CURIOSITY_FRAMES = 720; // 24s

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const ease = (t: number) => { const u = clamp01(t); return u * u * (3 - 2 * u); };

const IntroSpark: React.FC = () => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, 24, 160], [0, 0.9, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (o <= 0) return null;
  return <circle cx={200} cy={260} r={72} fill="none" stroke="#B91C1C" strokeWidth={3} opacity={o * 0.25} strokeDasharray="6 6" />;
};

const KidHead: React.FC = () => {
  const frame = useCurrentFrame();
  const bob = Math.sin(frame * 0.08) * 3;
  return (
    <group position={[0, 42 + bob, 0]}>
      {/* hair spikes */}
      {[-0.5, 0, 0.5].map((i) => (
        <mesh key={i} position={[i, 0.5, 0]} rotation={[Math.sin(frame * 0.1) * 0.2, 0, 0]}>
          <coneGeometry args={[0.22, 0.6, 6]} />
          <meshStandardMaterial color="#B6A686" />
        </mesh>
      ))}
      {/* face white */}
      <mesh position={[0, 0, 0.35]}>
        <sphereGeometry args={[0.43, 20, 16]} />
        <meshStandardMaterial color="#F4D0A6" />
      </mesh>
      {/* face pink */}
      <mesh position={[0, -0.03, 0.48]}>
        <sphereGeometry args={[0.22, 14, 10]} />
        <meshStandardMaterial color="#FFB3C6" />
      </mesh>
      {/* eyes */}
      {[-0.15, 0.15].map((x) => (
        <mesh key={x} position={[x, 0.04, 0.5]}>
          <sphereGeometry args={[0.055, 8, 8]} />
          <meshStandardMaterial color="#000" />
        </mesh>
      ))}
      {/* toar mask */}
      <mesh position={[0, -0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.0, 0.08, 8, 16]} />
        <meshBasicMaterial color="#2B2B2B" />
      </mesh>
    </group>
  );
};

const MapFlat: React.FC = () => (
  <group>
    {/* world map circle */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
      <circleGeometry args={[1.5, 64]} />
      <meshStandardMaterial color="#92420A" roughness={1} />
    </mesh>
    {/* GT red stripe */}
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.1, 0.15]}>
      <planeGeometry args={[2.6, 0.12]} />
      <meshBasicMaterial color="#B91C1C" />
    </mesh>
    {/* DB spark over G */}
    <mesh position={[0.1, 0.06, 0.3]}>
      <planeGeometry args={[0.14, 0.1]} />
      <meshBasicMaterial color="#FCD34D" />
    </mesh>
    {/* GT 1999 strip below map */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.45, 0]}>
      <planeGeometry args={[1.9, 0.3]} />
      <meshBasicMaterial color="#2B2B2B" />
    </mesh>
  </group>
);

const Leans: React.FC = () => (
  <group>
    {/* leaned props (ostentação) */}
    <mesh position={[-0.65, 0.12, -0.4]} rotation={[0, 0.8, 0]}>
      <boxGeometry args={[0.22, 0.09, 0.09]} />
      <meshStandardMaterial color="#F4D0A6" />
    </mesh>
    <mesh position={[0.65, 0.12, -0.4]} rotation={[0, -0.8, 0]}>
      <boxGeometry args={[0.22, 0.09, 0.09]} />
      <meshStandardMaterial color="#F4D0A6" />
    </mesh>
    {/* ball on palm */}
    <mesh position={[1.6, 0.3, 0]} rotation={[0, 0, 0.4]}>
      <sphereGeometry args={[0.36, 32, 24]} />
      <meshStandardMaterial color="#FCD34D" />
    </mesh>
    {/* red square eyebrow opens */}
    {[-0.3, 0.3].map((x) => (
      <mesh key={x} position={[x, 0.3, -0.3]}>
        <boxGeometry args={[0.2, 0.07, 0]} />
        <meshBasicMaterial color="#FF3B30" />
      </mesh>
    ))}
  </group>
);

const CuriosidadeList: React.FC = () => (
  <group>
    <mesh position={[0, 2.05, 0]}>
      <planeGeometry args={[2.5, 0.07]} />
      <meshBasicMaterial color="#FF3B30" />
    </mesh>
    {["GT hoje é diferente da Z!", "O tom e a cronologia mudaram", "Detalhes na conta regressiva: 1990 → 1999"].map((line, i) => (
      <mesh key={i} position={[0, 1.0 - i * 0.38, 0.25]}>
        <planeGeometry args={[2.4, 0.07]} />
        <meshBasicMaterial color="#2B2B2B" />
      </mesh>
    ))}
  </group>
);

const Scene: React.FC = () => (
  <group position={[0, 2.9, 0]}>
    <MapFlat />
    <KidHead />
    <Leans />
    <CuriosidadeList />
  </group>
);

const OverlayText: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const words = (wordsData as any).words as { text: string; offset: number; duration: number }[];
  const active = words.filter((w) => t >= w.offset - 0.04 && t <= w.offset + w.duration + 0.1);
  const recent = words.filter((w) => w.offset <= t).slice(-6);
  const line = (active.length ? active : recent).map((w) => w.text).join(" ");
  if (!line) return null;
  const o = ease(interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" })) * 0.8;
  return (
    <div style={{ position: "absolute", bottom: 135, left: 55, right: 55, textAlign: "center", opacity: o, fontFamily: "Arial Black, Arial, sans-serif", fontSize: 38, lineHeight: 1.3, color: "#FFFFFF", textShadow: "0 4px 18px rgba(0,0,0,0.55)" }}>
      <span style={{ color: "#FF3B30", fontWeight: 900 }}>{line.split(" ")[0] ?? ""} </span>
      <span style={{ color: "#FFFFFF", fontWeight: 700 }}>{line.split(" ").slice(1).join(" ")}</span>
    </div>
  );
};

const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, 8, 60, 80], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (o <= 0) return null;
  return (
    <div style={{ position: "absolute", top: 110, left: 45, right: 45, textAlign: "center", opacity: o }}>
      <div style={{ fontFamily: "Arial Black, Arial, sans-serif", fontSize: 44, color: "#FF3B30", textShadow: "0 6px 24px rgba(0,0,0,0.55)", background: "rgba(0,0,0,0.72)", padding: "14px 20px", borderRadius: 18 }}>
        Ei, você sabia?
        <div style={{ fontSize: 26, marginTop: 6, color: "#FFD966" }}>Dragon Ball GT tem um detalhe nostálgico que quase ninguém percebeu</div>
      </div>
    </div>
  );
};

const CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [DBGT_CURIOSITY_FRAMES - 100, DBGT_CURIOSITY_FRAMES - 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", top: 140, left: 50, right: 50, textAlign: "center", opacity: o }}>
      <div style={{ fontFamily: "Arial Black, Arial, sans-serif", fontSize: 34, color: "#FF3B30", background: "rgba(0,0,0,0.65)", padding: "14px 18px", borderRadius: 18, border: "2px solid #FFD966" }}>
        Curte, segue e compartilha!
      </div>
    </div>
  );
};

export const DragonBallGtCuriosity: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#2B2B2B" }}>
    <Audio src={staticFile("dragon-ball-gt-curiosity/voice.wav")} />
    <IntroSpark />
    <Hook />
    <OverlayText />
    <CTA />
    <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
      <Scene />
    </AbsoluteFill>
  </AbsoluteFill>
);

export default DragonBallGtCuriosity;
