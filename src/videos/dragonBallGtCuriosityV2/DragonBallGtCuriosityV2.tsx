import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import * as THREE from "three";
import wordsData from "../../../public/dragon-ball-gt-curiosity-v2/words.json";
import { useSvgTexture } from "../../characters/base/useSvgTexture";

export const DBGT_CURIOSITY_V2_FPS = 30;
export const DBGT_CURIOSITY_V2_FRAMES = 720; // 24s

const Words = wordsData as any;

// Simple little Baby DB (cartoon style, no original SVG needed yet)
const BabyGobu: React.FC<{ frame: number }> = ({ frame }) => {
  const bob = Math.sin(frame * 0.08) * 4;
  const up = Math.max(0, 1 - Math.cos(Math.max(0, frame - 90) * 0.04)) * 30; // pops in at ~3s
  return (
    <group position={[0, 1.9 + bob - up * 0.4, 0]}>
      {/* hat */}
      <mesh position={[0, 0.45, 0]} rotation={[Math.PI / 4, 0, 0]}>
        <boxGeometry args={[0.7, 0.22, 0.12]} />
        <meshStandardMaterial color="#FB7185" roughness={0.8} />
      </mesh>
      {/* body */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.45, 20, 16]} />
        <meshStandardMaterial color="#F3F4F6" roughness={0.4} />
      </mesh>
      {/* arms */}
      {[-0.5, 0.5].map((x) => (
        <mesh key={x} position={[x, -0.1, 0]} rotation={[Math.sin(frame * 0.15) * 0.3, 0, 0]}>
          <boxGeometry args={[0.12, 0.4, 0.12]} />
          <meshStandardMaterial color="#F3F4F6" roughness={0.4} />
        </mesh>
      ))}
      {/* legs */}
      {[-0.14, 0.14].map((x) => (
        <mesh key={x} position={[x, -0.4, 0]} rotation={[Math.sin(frame * 0.1) * 0.2, 0, 0]}>
          <boxGeometry args={[0.14, 0.35, 0.14]} />
          <meshStandardMaterial color="#E5E7EB" roughness={0.4} />
        </mesh>
      ))}
      {/* hair spikes */}
      {[-0.3, 0, 0.3].map((x) => (
        <mesh key={x} position={[x, 0.5, 0]} rotation={[Math.sin(frame * 0.1) * 0.3, 0, 0]}>
          <coneGeometry args={[0.14, 0.45, 6]} />
          <meshStandardMaterial color="#2B2B2B" roughness={0.8} />
        </mesh>
      ))}
      {/* face */}
      <mesh position={[0, 0.02, 0.35]}>
        <sphereGeometry args={[0.28, 16, 12]} />
        <meshStandardMaterial color="#FCD34D" roughness={0.2} />
      </mesh>
      <mesh position={[0, -0.02, 0.45]}>
        <sphereGeometry args={[0.16, 12, 10]} />
        <meshStandardMaterial color="#F472B6" roughness={0.2} />
      </mesh>
      {[-0.14, 0.14].map((x) => (
        <mesh key={x} position={[x, 0.03, 0.5]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="#000" />
        </mesh>
      ))}
      {/* tiny wings hint (about baby saiyans) */}
      <mesh position={[0, 0.5, -0.1]} rotation={[Math.sin(frame * 0.1) * 0.2, 0, 0]}>
        <planeGeometry args={[0.4, 0.2]} />
        <meshBasicMaterial color="#9333EA" transparent opacity={0.5} />
      </mesh>
    </group>
  );
};

// Soft flying cloud (cartoon style, moves up/down)
const FlyingCloud: React.FC = () => {
  const frame = useCurrentFrame();
  const t = (frame - 60) / 30; // appears after hook
  const visible = frame >= 60;
  if (!visible) return null;
  const up = Math.sin(frame * 0.06) * 0.5;
  return (
    <group position={[0, 1.4 + up, 0]}>
      <mesh>
        <sphereGeometry args={[1.4, 32, 24]} />
        <meshStandardMaterial color="#FFFFFF" roughness={1} emissive="#9333EA" emissiveIntensity={0.6} />
      </mesh>
      {[-0.8, 0, 0.8].map((x) => (
        <mesh key={x} position={[x, 0.4, 0]}>
          <sphereGeometry args={[0.4, 16, 12]} />
          <meshStandardMaterial color="#FFFFFF" roughness={1} />
        </mesh>
      ))}
      <mesh position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.3, 16, 12]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
    </group>
  );
};

const OverlayText: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const words = Words.words as { text: string; offset: number; duration: number }[];
  const active = words.filter((w) => t >= w.offset - 0.05 && t <= w.offset + w.duration + 0.12);
  const recent = words.filter((w) => w.offset <= t).slice(-5);
  const line = (active.length ? active : recent).map((w) => w.text).join(" ");
  if (!line) return null;
  const opacity = frame < 20 ? interpolate(frame, [0, 18], [0, 1]) : 1;
  return (
    <div style={{ position: "absolute", bottom: 120, left: 50, right: 50, textAlign: "center", opacity, fontFamily: "Arial Black, Arial, sans-serif", fontSize: 38, lineHeight: 1.25, color: "#FFFFFF", textShadow: "0 4px 18px rgba(0,0,0,0.55)" }}>
      <span style={{ color: "#F472B6", fontWeight: 900 }}>{line.split(" ")[0] ?? ""} </span>
      <span style={{ color: "#FFFFFF", fontWeight: 700 }}>{line.split(" ").slice(1).join(" ")}</span>
    </div>
  );
};

const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, 8, 50, 70], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (o <= 0) return null;
  return (
    <div style={{ position: "absolute", top: 100, left: 50, right: 50, textAlign: "center", opacity: o }}>
      <div style={{ fontFamily: "Arial Black, Arial, sans-serif", fontSize: 42, color: "#F472B6", background: "rgba(0,0,0,0.75)", padding: "14px 20px", borderRadius: 18, border: "2px solid #FBC211" }}>
        Did you know? <span style={{ color: "#FFFFFF", fontSize: 28 }}>Dragon Ball GT has a secret fact:</span>
      </div>
    </div>
  );
};

const CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [DBGT_CURIOSITY_V2_FRAMES - 110, DBGT_CURIOSITY_V2_FRAMES - 80], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", top: 140, left: 50, right: 50, textAlign: "center", opacity: o }}>
      <div style={{ fontFamily: "Arial Black, Arial, sans-serif", fontSize: 34, color: "#F472B6", background: "rgba(0,0,0,0.65)", padding: "14px 18px", borderRadius: 18, border: "2px solid #FBC211" }}>
        Curte, segue e compartilha!
      </div>
    </div>
  );
};

const SonGokuCard: React.FC<{ frame: number }> = ({ frame }) => {
  const bob = Math.sin(frame * 0.07) * 0.03;
  const tex = useSvgTexture(<img src="dbgt-goku-gt-simple.svg" alt="Goku GT" /> as any, ["dbgt-goku-v1", Math.round(frame / 3)], 420, 560);
  if (!tex) return null;
  return (
    <mesh position={[0, 2.6 + bob, -0.2]} scale={0.9}>
      <planeGeometry args={[2.4, 3.0]} />
      <meshBasicMaterial map={tex} transparent />
    </mesh>
  );
};

const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      <ambientLight intensity={0.8} color="#FFD166" />
      <pointLight position={[1.2, 2.2, 1.0]} intensity={2.5} color="#F472B6" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.2, 0]}>
        <circleGeometry args={[1.6, 32]} />
        <meshBasicMaterial color="#0B1020" opacity={0.7} />
      </mesh>
      <group position={[0, 1.4, 0]}>
        <SonGokuCard frame={frame} />
        <FlyingCloud />
      </group>
    </>
  );
};

export const DragonBallGtCuriosityV2: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: "#0B1020" }}>
      <Audio src={staticFile("dragon-ball-gt-curiosity-v2/voice.wav")} />
      <Hook />
      <OverlayText />
      <CTA />
      <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
        <Scene />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default DragonBallGtCuriosityV2;
