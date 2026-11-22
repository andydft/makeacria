import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { MaleBaseCharacter } from "../base/MaleBaseCharacter";

export const CHESTER_STAGE_POC_FPS = 30;
export const CHESTER_STAGE_POC_DURATION = 150; // 5s

export const ChesterStagePoc: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Walk in from left offscreen to center stage
  const enter = spring({ frame, fps, config: { damping: 22, mass: 0.8, stiffness: 55 } });
  const x = interpolate(enter, [0, 1], [-520, 0]);
  const walkEnd = 95;
  const walking = frame < walkEnd;
  const walkEase = walking ? interpolate(frame, [walkEnd - 20, walkEnd], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;

  const step = frame * 0.28;
  const legSwing = Math.sin(step) * 14 * walkEase;
  const armSwing = Math.sin(step + Math.PI) * 18 * walkEase + Math.sin(frame * 0.07) * 2;
  const bob = Math.abs(Math.sin(step)) * -6 * walkEase + Math.sin(frame * 0.05) * -1.5;
  const headBob = Math.sin(step * 2 + 0.4) * 1.5 * walkEase + Math.sin(frame * 0.045) * 1.2;

  // Blink
  const blinkCycle = frame % 90;
  const eyeOpen = blinkCycle > 84 && blinkCycle < 89 ? 0.08 : 1;

  // Stage lights pulse
  const light = 0.75 + Math.sin(frame * 0.08) * 0.08;

  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #120d22 0%, #22183f 45%, #0b0b10 100%)" }}>
      {/* Back lights */}
      <div style={{ position: "absolute", left: 120, top: 120, width: 220, height: 220, borderRadius: 999, background: "#ffcc57", opacity: 0.12 * light, filter: "blur(10px)" }} />
      <div style={{ position: "absolute", right: 120, top: 160, width: 220, height: 220, borderRadius: 999, background: "#7dd3fc", opacity: 0.10 * light, filter: "blur(10px)" }} />

      {/* Stage */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 430, background: "linear-gradient(180deg, #2a2238 0%, #171320 100%)" }} />
      <div style={{ position: "absolute", left: 60, right: 60, bottom: 380, height: 26, borderRadius: 12, background: "#3b304d", boxShadow: "0 10px 30px rgba(0,0,0,0.35)" }} />
      <div style={{ position: "absolute", left: 140, right: 140, bottom: 406, height: 90, borderRadius: 20, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }} />

      {/* Spotlight */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 260,
          width: 520,
          height: 900,
          transform: "translateX(-50%)",
          background: "radial-gradient(ellipse at top, rgba(255,245,200,0.22) 0%, rgba(255,245,200,0.07) 35%, rgba(255,245,200,0) 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Character */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: 390,
          transform: `translateX(calc(-50% + ${x}px)) translateY(${bob}px)`,
        }}
      >
        <MaleBaseCharacter
          width={520}
          height={693}
          hairVariant="spiky"
          goatee
          colors={{
            skin: "#F0C29A",
            hair: "#FFD400",
            hairDark: "#C9A000",
            hairHighlight: "#FFF176",
            shirt: "#1E1E22",
            shorts: "#5A6472",
            shoe: "#1B1B1F",
            shoeSole: "#F2F2F2",
            shoeDetail: "#F2F2F2",
            outline: "#241A16",
          }}
          pose={{
            headY: headBob,
            headRotate: walking ? Math.sin(step) * 2 : 0,
            armLeftRotate: armSwing,
            armRightRotate: -armSwing,
            legLeftRotate: legSwing,
            legRightRotate: -legSwing,
            eyeOpen,
            mouthShape: walking ? "neutral" : "smile",
          }}
        />
      </div>

      {/* Caption */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 110,
          textAlign: "center",
          fontFamily: "Arial, sans-serif",
          color: "#F5F7FA",
          fontWeight: 700,
          fontSize: 44,
          letterSpacing: 0.5,
          textShadow: "0 4px 20px rgba(0,0,0,0.45)",
        }}
      >
        Chester base POC
      </div>
    </AbsoluteFill>
  );
};
