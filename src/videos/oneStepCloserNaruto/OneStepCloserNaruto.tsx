import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { InkPass, noInkFallback, NOINK } from "../jimi3d/ink";
import { LensBlur } from "../jimi3d/lensblur";
import { GradeEffect, GRADES, GRADE_STRENGTH } from "../jimi3d/grade";
import { MaleBaseCharacter, type MouthShape } from "../../characters/base/MaleBaseCharacter";
import { useSvgTexture } from "../../characters/base/useSvgTexture";

export const OSCN_FPS = 30;
export const OSCN_DUR = 59.537;
export const OSCN_FRAMES = Math.ceil(OSCN_DUR * OSCN_FPS);

type SegId =
  | "hook"
  | "studio2000"
  | "producer"
  | "pressure"
  | "closer"
  | "space"
  | "narutoLink"
  | "limit"
  | "beforeBurst"
  | "stepBack"
  | "cta";

const SEGS: { id: SegId; a: number; b: number }[] = [
  { id: "hook", a: 0.096, b: 2.492 },
  { id: "studio2000", a: 2.492, b: 9.375 },
  { id: "producer", a: 9.375, b: 14.016 },
  { id: "pressure", a: 14.016, b: 18.322 },
  { id: "closer", a: 18.322, b: 24.132 },
  { id: "space", a: 24.132, b: 29.653 },
  { id: "narutoLink", a: 29.664, b: 36.007 },
  { id: "limit", a: 36.019, b: 42.604 },
  { id: "beforeBurst", a: 42.789, b: 49.803 },
  { id: "stepBack", a: 49.988, b: 53.9 },
  { id: "cta", a: 53.912, b: 59.537 },
];

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (t: number) => {
  const u = clamp01(t);
  return u * u * (3 - 2 * u);
};
const segInfo = (time: number) => {
  for (const s of SEGS) if (time >= s.a && time < s.b) return { id: s.id, local: time - s.a, dur: Math.max(0.001, s.b - s.a) };
  const last = SEGS[SEGS.length - 1];
  return { id: last.id, local: Math.max(0, Math.min(last.b - last.a, time - last.a)), dur: Math.max(0.001, last.b - last.a) };
};
const makeBloom = () =>
  new BloomEffect({
    blendFunction: BlendFunction.ADD,
    intensity: 0.5,
    luminanceThreshold: 0.86,
    luminanceSmoothing: 0.25,
    mipmapBlur: true,
    levels: 5,
    radius: 0.65,
  });

const Box: React.FC<{ pos: [number, number, number]; args: [number, number, number]; color: string; rot?: [number, number, number]; rough?: number; metal?: number }> = ({ pos, args, color, rot = [0, 0, 0], rough = 0.95, metal = 0 }) => (
  <mesh position={pos} rotation={rot} castShadow receiveShadow>
    <boxGeometry args={args} />
    <meshStandardMaterial color={color} roughness={rough} metalness={metal} />
  </mesh>
);
const Cyl: React.FC<{ pos: [number, number, number]; args: [number, number, number, number?]; color: string; rot?: [number, number, number] }> = ({ pos, args, color, rot = [0, 0, 0] }) => (
  <mesh position={pos} rotation={rot} castShadow receiveShadow>
    <cylinderGeometry args={args} />
    <meshStandardMaterial color={color} roughness={0.8} metalness={0.1} />
  </mesh>
);

const Card: React.FC<{ tex: THREE.Texture | null; pos: [number, number, number]; scale?: number | [number, number, number]; rot?: [number, number, number]; opacity?: number }> = ({ tex, pos, scale = 1, rot = [0, 0, 0], opacity = 1 }) => {
  if (!tex) return null;
  return (
    <mesh position={pos} rotation={rot} scale={scale as any} layers={NOINK}>
      <planeGeometry args={[2.2, 3.3]} />
      <meshBasicMaterial map={tex} transparent alphaTest={0.05} side={THREE.DoubleSide} opacity={opacity} />
    </mesh>
  );
};

const talkMouth = (frame: number, speed = 0.7): MouthShape => {
  const v = Math.sin(frame * speed);
  if (v > 0.55) return "open";
  if (v > 0.2) return "smile";
  return "neutral";
};

type CharKind = "chester" | "mike" | "producer" | "kid";
const CharacterCard: React.FC<{
  kind: CharKind;
  pos: [number, number, number];
  scale?: number;
  rot?: [number, number, number];
  frame: number;
  talking?: boolean;
  mood?: "neutral" | "smile" | "focus" | "sing" | "sad";
  walk?: boolean;
  cap?: boolean;
}> = ({ kind, pos, scale = 1, rot = [0, 0, 0], frame, talking = false, mood = "neutral", walk = false, cap = false }) => {
  const step = frame * 0.28;
  const legSwing = walk ? Math.sin(step) * 12 : 0;
  const armSwing = walk ? Math.sin(step + Math.PI) * 14 : Math.sin(frame * 0.05) * 1.5;
  const bob = walk ? Math.abs(Math.sin(step)) * -3 : Math.sin(frame * 0.04) * -1;
  const eyeOpen = frame % 90 > 84 && frame % 90 < 89 ? 0.08 : 1;
  const mouthShape: MouthShape = talking ? talkMouth(frame, kind === "chester" ? 0.85 : 0.68) : mood === "smile" ? "smile" : mood === "sing" ? "open" : mood === "sad" ? "sad" : "neutral";

  const colors =
    kind === "chester"
      ? { skin: "#F0C29A", hair: "#E7C24A", hairDark: "#B8921A", hairHighlight: "#FFF176", shirt: "#1E1E22", shorts: "#4A5568", goatee: "#B8921A" }
      : kind === "mike"
        ? { skin: "#EFC39B", hair: "#2B2118", hairDark: "#1A130E", shirt: "#3B4A66", shorts: "#2D3748", cap: "#B91C1C", capDetail: "#7F1D1D", hairHighlight: "#4A3A2E" }
        : kind === "producer"
          ? { skin: "#D8AE84", hair: "#4B5563", hairDark: "#374151", shirt: "#374151", shorts: "#1F2937", hairHighlight: "#9CA3AF" }
          : { skin: "#E8BE93", hair: "#2F3A2E", hairDark: "#1E261D", hairHighlight: "#7BA17A", shirt: "#3F5A4A", shorts: "#374151", goatee: "#2F3A2E" };

  const hairVariant = kind === "chester" ? "spiky" : kind === "kid" ? "spiky" : "short";

  const tex = useSvgTexture(
    <MaleBaseCharacter
      width={512}
      height={768}
      hairVariant={hairVariant as any}
      headAccessory={cap ? "cap" : "none"}
      goatee={kind === "chester" || kind === "mike"}
      tattoos={kind === "chester"}
      colors={colors as any}
      pose={{
        bodyY: bob,
        headY: bob * 0.35,
        armLeftRotate: armSwing,
        armRightRotate: -armSwing,
        legLeftRotate: legSwing,
        legRightRotate: -legSwing,
        eyeOpen,
        mouthShape,
      }}
    />,
    [kind, Math.round(frame / 2), talking, mood, walk, cap],
    512,
    768,
  );

  return <Card tex={tex} pos={pos} scale={scale} rot={rot} />;
};

const MicStand: React.FC<{ pos: [number, number, number] }> = ({ pos }) => (
  <group position={pos}>
    <Cyl pos={[0, 0.95, 0]} args={[0.03, 0.03, 1.9, 12]} color="#222" />
    <Cyl pos={[0, 0.02, 0]} args={[0.22, 0.25, 0.04, 16]} color="#1a1a1a" />
    <mesh position={[0, 1.95, 0.08]} rotation={[Math.PI / 2, 0, 0]} castShadow>
      <sphereGeometry args={[0.09, 16, 16]} />
      <meshStandardMaterial color="#9aa0a6" roughness={0.35} metalness={0.7} />
    </mesh>
  </group>
);

const StudioDesk: React.FC<{ pos?: [number, number, number] }> = ({ pos = [0, 0, 0] }) => (
  <group position={pos}>
    <Box pos={[0, 0.72, -0.55]} args={[4.4, 0.1, 1.1]} color="#3a2d24" />
    <Cyl pos={[-1.9, 0.36, -0.55]} args={[0.05, 0.05, 0.72, 10]} color="#2a211b" />
    <Cyl pos={[1.9, 0.36, -0.55]} args={[0.05, 0.05, 0.72, 10]} color="#2a211b" />
    <Box pos={[-0.9, 1.02, -0.75]} args={[0.95, 0.55, 0.08]} color="#111827" />
    <Box pos={[0.15, 0.98, -0.72]} args={[0.9, 0.5, 0.07]} color="#18212f" />
    <Box pos={[1.2, 0.85, -0.45]} args={[0.55, 0.08, 0.35]} color="#111827" />
    {Array.from({ length: 8 }).map((_, i) => (
      <Box key={i} pos={[-1.35 + i * 0.22, 0.8, -0.35]} args={[0.16, 0.03, 0.08]} color={i % 2 ? "#374151" : "#1f2937"} />
    ))}
  </group>
);

const StudioRoom: React.FC<{ dark?: boolean }> = ({ dark = false }) => (
  <group>
    <Box pos={[0, 2.2, -2.8]} args={[10.5, 5.4, 0.2]} color={dark ? "#141824" : "#24314a"} />
    <Box pos={[-5.1, 2.2, -0.2]} args={[0.2, 5.4, 5.5]} color={dark ? "#121622" : "#1f2a40"} />
    <Box pos={[5.1, 2.2, -0.2]} args={[0.2, 5.4, 5.5]} color={dark ? "#121622" : "#1f2a40"} />
    <Box pos={[-2.2, 1.2, -2.69]} args={[1.2, 1.8, 0.05]} color="#4c1d95" />
    <Box pos={[2.2, 1.2, -2.69]} args={[1.2, 1.8, 0.05]} color="#1d4ed8" />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[40, 40]} />
      <meshStandardMaterial color={dark ? "#171b24" : "#23293a"} roughness={1} />
    </mesh>
  </group>
);

const FightArena: React.FC = () => (
  <group>
    <Box pos={[0, 2.2, -3.0]} args={[12, 6.0, 0.2]} color="#7c5a3a" />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[40, 40]} />
      <meshStandardMaterial color="#cfa86a" roughness={1} />
    </mesh>
    {/* arena walls */}
    <Box pos={[-4.8, 0.7, -0.6]} args={[0.5, 1.4, 4.2]} color="#8b6b4a" />
    <Box pos={[4.8, 0.7, -0.6]} args={[0.5, 1.4, 4.2]} color="#8b6b4a" />
    <Box pos={[0, 0.7, -2.5]} args={[10, 1.4, 0.5]} color="#8b6b4a" />
    {/* dust/impact marks */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.2, 0.01, 0.4]} layers={NOINK}>
      <circleGeometry args={[0.9, 24]} />
      <meshBasicMaterial color="#b99263" transparent opacity={0.45} />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.8, 0.01, 0.8]} layers={NOINK}>
      <circleGeometry args={[0.45, 24]} />
      <meshBasicMaterial color="#b99263" transparent opacity={0.35} />
    </mesh>
  </group>
);

const LeeSvg: React.FC<{ frame: number; pose: "ready" | "kick" | "tired" }> = ({ frame, pose }) => {
  const bob = Math.sin(frame * 0.08) * 2;
  const kick = pose === "kick";
  const tired = pose === "tired";
  const eyeOpen = tired ? 0.65 : frame % 90 > 84 && frame % 90 < 89 ? 0.08 : 1;
  const eyeH = 26 * eyeOpen;
  const eyeY = 186 + (26 - eyeH) / 2;
  const mouthD = kick ? "M185 252 C190 246, 210 246, 215 252 C210 264, 190 264, 185 252 Z" : tired ? "M182 258 C190 252, 210 252, 218 258" : "M182 254 C190 260, 210 260, 218 254";
  const mouthFill = kick ? "#6B2D2D" : "none";
  const armL = kick ? -55 : tired ? 20 : -15;
  const armR = kick ? 35 : tired ? -15 : 15;
  const legL = kick ? 25 : 0;
  const legR = kick ? -70 : 0;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 560" width={512} height={768}>
      <ellipse cx="200" cy="520" rx="92" ry="18" fill="#000000" opacity="0.08" />
      <g transform={`translate(0 ${bob + (kick ? -8 : 0)})`}>
        {/* legs */}
        <g transform={`rotate(${legL} 176 395)`}>
          <rect x="162" y="392" width="28" height="72" rx="14" fill="#2F855A" stroke="#241A16" strokeWidth="4" />
          <rect x="156" y="430" width="40" height="34" rx="8" fill="#E8D8C0" stroke="#241A16" strokeWidth="4" />
          <path d="M142 468 C142 458, 150 452, 162 452 L190 452 C202 452, 210 458, 212 468 L216 484 C217 492, 212 498, 204 498 L148 498 C140 498, 135 492, 136 484 Z" fill="#1F2937" stroke="#241A16" strokeWidth="4" />
          <path d="M140 486 L214 486 L212 498 L142 498 Z" fill="#F2F2F2" />
        </g>
        <g transform={`rotate(${legR} 224 395)`}>
          <rect x="210" y="392" width="28" height="72" rx="14" fill="#2F855A" stroke="#241A16" strokeWidth="4" />
          <rect x="204" y="430" width="40" height="34" rx="8" fill="#E8D8C0" stroke="#241A16" strokeWidth="4" />
          <path d="M188 468 C190 458, 198 452, 210 452 L238 452 C250 452, 258 458, 258 468 L264 484 C265 492, 260 498, 252 498 L196 498 C188 498, 183 492, 184 484 Z" fill="#1F2937" stroke="#241A16" strokeWidth="4" />
          <path d="M186 486 L262 486 L260 498 L188 498 Z" fill="#F2F2F2" />
        </g>
        {/* arms */}
        <g transform={`rotate(${armL} 150 305)`}>
          <path d="M144 304 C124 308, 114 324, 118 344 L126 382 C129 394, 140 400, 151 396 C162 392, 168 380, 165 368 L157 336 L160 320" fill="#F0C29A" stroke="#241A16" strokeWidth="4" />
          <path d="M142 300 C126 304, 116 317, 118 332 L124 350 L154 342 L152 316 C151 306, 148 301, 142 300 Z" fill="#2F855A" stroke="#241A16" strokeWidth="4" />
          <rect x="126" y="350" width="34" height="28" rx="8" fill="#EFE6D8" stroke="#241A16" strokeWidth="3" />
        </g>
        <g transform={`rotate(${armR} 250 305)`}>
          <path d="M256 304 C276 308, 286 324, 282 344 L274 382 C271 394, 260 400, 249 396 C238 392, 232 380, 235 368 L243 336 L240 320" fill="#F0C29A" stroke="#241A16" strokeWidth="4" />
          <path d="M258 300 C274 304, 284 317, 282 332 L276 350 L246 342 L248 316 C249 306, 252 301, 258 300 Z" fill="#2F855A" stroke="#241A16" strokeWidth="4" />
          <rect x="240" y="350" width="34" height="28" rx="8" fill="#EFE6D8" stroke="#241A16" strokeWidth="3" />
        </g>
        {/* body */}
        <rect x="184" y="270" width="32" height="28" rx="10" fill="#F0C29A" stroke="#241A16" strokeWidth="4" />
        <path d="M150 298 C150 286, 160 278, 174 276 L184 292 L200 302 L216 292 L226 276 C240 278, 250 286, 250 298 L250 390 C250 404, 240 414, 226 414 L174 414 C160 414, 150 404, 150 390 Z" fill="#2F855A" stroke="#241A16" strokeWidth="4" />
        <path d="M200 302 L200 414" fill="none" stroke="#1F5F42" strokeWidth="4" opacity="0.35" />
        <rect x="178" y="344" width="44" height="18" rx="6" fill="#D97706" stroke="#241A16" strokeWidth="3" />
        {/* head */}
        <g transform={`translate(0 ${bob * 0.2})`}>
          <rect x="116" y="118" width="168" height="168" rx="52" fill="#F0C29A" stroke="#241A16" strokeWidth="5" />
          {/* bowl hair */}
          <path d="M114 168 C114 122, 144 98, 200 96 C256 98, 286 122, 286 168 L286 178 C272 170, 244 166, 200 166 C156 166, 128 170, 114 178 Z" fill="#151515" stroke="#241A16" strokeWidth="4.5" />
          <path d="M114 178 C128 170, 156 166, 200 166 C244 166, 272 170, 286 178" fill="none" stroke="#241A16" strokeWidth="4.5" />
          {/* eyebrows - thick */}
          <path d="M142 168 C152 158, 170 156, 184 162" fill="none" stroke="#111" strokeWidth="8" strokeLinecap="round" />
          <path d="M216 162 C230 156, 248 158, 258 168" fill="none" stroke="#111" strokeWidth="8" strokeLinecap="round" />
          {/* round eyes */}
          <ellipse cx="162" cy={eyeY + eyeH / 2} rx="16" ry={Math.max(2, eyeH / 2)} fill="#fff" stroke="#241A16" strokeWidth="4" />
          <ellipse cx="238" cy={eyeY + eyeH / 2} rx="16" ry={Math.max(2, eyeH / 2)} fill="#fff" stroke="#241A16" strokeWidth="4" />
          <circle cx="162" cy={eyeY + eyeH / 2 + 1} r="6.5" fill="#171717" />
          <circle cx="238" cy={eyeY + eyeH / 2 + 1} r="6.5" fill="#171717" />
          <circle cx="158" cy={eyeY + eyeH / 2 - 3} r="2.5" fill="#fff" />
          <circle cx="234" cy={eyeY + eyeH / 2 - 3} r="2.5" fill="#fff" />
          {/* nose/mouth */}
          <path d="M196 214 C192 222, 192 228, 200 232 C208 228, 208 222, 204 214" fill="none" stroke="#241A16" strokeOpacity="0.45" strokeWidth="4" strokeLinecap="round" />
          <path d={mouthD} fill={mouthFill} stroke="#B35A5A" strokeWidth="5" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
};

const GaaraSvg: React.FC<{ frame: number; pose: "stance" | "attack" | "guard" }> = ({ frame, pose }) => {
  const bob = Math.sin(frame * 0.06) * 1.5;
  const attack = pose === "attack";
  const guard = pose === "guard";
  const eyeOpen = frame % 100 > 94 && frame % 100 < 99 ? 0.08 : 1;
  const eyeH = 24 * eyeOpen;
  const eyeY = 188 + (24 - eyeH) / 2;
  const mouthD = attack ? "M185 252 C190 246, 210 246, 215 252 C210 262, 190 262, 185 252 Z" : "M184 254 C192 258, 208 258, 216 254";
  const mouthFill = attack ? "#6B2D2D" : "none";
  const armL = attack ? -45 : guard ? -28 : -10;
  const armR = attack ? -35 : guard ? -22 : 10;
  const sandArm = attack ? 1 : 0.3;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 560" width={512} height={768}>
      <ellipse cx="200" cy="520" rx="92" ry="18" fill="#000000" opacity="0.08" />
      <g transform={`translate(0 ${bob})`}>
        {/* gourd on back */}
        <ellipse cx="248" cy="330" rx="34" ry="44" fill="#B45309" stroke="#241A16" strokeWidth="4" />
        <ellipse cx="248" cy="286" rx="24" ry="28" fill="#92400E" stroke="#241A16" strokeWidth="4" />
        <path d="M232 360 L264 360 L258 392 L238 392 Z" fill="#78350F" stroke="#241A16" strokeWidth="3" />
        {/* legs */}
        <g>
          <rect x="162" y="392" width="28" height="72" rx="14" fill="#6B3A2A" stroke="#241A16" strokeWidth="4" />
          <path d="M142 468 C142 458, 150 452, 162 452 L190 452 C202 452, 210 458, 212 468 L216 484 C217 492, 212 498, 204 498 L148 498 C140 498, 135 492, 136 484 Z" fill="#1F2937" stroke="#241A16" strokeWidth="4" />
          <path d="M140 486 L214 486 L212 498 L142 498 Z" fill="#F2F2F2" />
        </g>
        <g>
          <rect x="210" y="392" width="28" height="72" rx="14" fill="#6B3A2A" stroke="#241A16" strokeWidth="4" />
          <path d="M188 468 C190 458, 198 452, 210 452 L238 452 C250 452, 258 458, 258 468 L264 484 C265 492, 260 498, 252 498 L196 498 C188 498, 183 492, 184 484 Z" fill="#1F2937" stroke="#241A16" strokeWidth="4" />
          <path d="M186 486 L262 486 L260 498 L188 498 Z" fill="#F2F2F2" />
        </g>
        {/* arms */}
        <g transform={`rotate(${armL} 150 305)`}>
          <path d="M144 304 C124 308, 114 324, 118 344 L126 382 C129 394, 140 400, 151 396 C162 392, 168 380, 165 368 L157 336 L160 320" fill="#F2CCAA" stroke="#241A16" strokeWidth="4" />
          <path d="M142 300 C126 304, 116 317, 118 332 L124 350 L154 342 L152 316 C151 306, 148 301, 142 300 Z" fill="#7B341E" stroke="#241A16" strokeWidth="4" />
        </g>
        <g transform={`rotate(${armR} 250 305)`}>
          <path d="M256 304 C276 308, 286 324, 282 344 L274 382 C271 394, 260 400, 249 396 C238 392, 232 380, 235 368 L243 336 L240 320" fill="#F2CCAA" stroke="#241A16" strokeWidth="4" />
          <path d="M258 300 C274 304, 284 317, 282 332 L276 350 L246 342 L248 316 C249 306, 252 301, 258 300 Z" fill="#7B341E" stroke="#241A16" strokeWidth="4" />
        </g>
        {/* sand effect near arm when attacking */}
        {attack && <path d="M92 360 C70 340, 74 314, 96 302 C108 294, 120 298, 124 310" fill="none" stroke="#DDB978" strokeWidth="8" strokeLinecap="round" opacity={sandArm} />}
        {/* body */}
        <rect x="184" y="270" width="32" height="28" rx="10" fill="#F2CCAA" stroke="#241A16" strokeWidth="4" />
        <path d="M150 298 C150 286, 160 278, 174 276 L184 292 L200 302 L216 292 L226 276 C240 278, 250 286, 250 298 L250 390 C250 404, 240 414, 226 414 L174 414 C160 414, 150 404, 150 390 Z" fill="#7B341E" stroke="#241A16" strokeWidth="4" />
        {/* head */}
        <g transform={`translate(0 ${bob * 0.2})`}>
          <rect x="116" y="118" width="168" height="168" rx="52" fill="#F2CCAA" stroke="#241A16" strokeWidth="5" />
          {/* red spiky hair */}
          <path d="M120 156 C120 114, 148 92, 200 90 C252 92, 280 114, 280 156 C280 164, 277 171, 272 176 C260 164, 244 158, 228 156 C218 164, 210 168, 200 168 C190 168, 182 164, 172 156 C156 158, 140 164, 128 176 C123 171, 120 164, 120 156 Z" fill="#B91C1C" stroke="#241A16" strokeWidth="4.5" />
          <g stroke="#241A16" strokeWidth="3.5" strokeLinejoin="round" fill="#B91C1C">
            <path d="M140 148 L128 120 L156 140 Z" />
            <path d="M162 138 L160 108 L178 132 Z" />
            <path d="M186 132 L200 102 L214 132 Z" />
            <path d="M222 132 L240 108 L238 138 Z" />
            <path d="M244 140 L272 120 L260 148 Z" />
          </g>
          {/* forehead mark (stylized) */}
          <path d="M200 146 C194 146, 190 150, 190 155 C190 161, 195 166, 200 172 C205 166, 210 161, 210 155 C210 150, 206 146, 200 146 Z" fill="#DC2626" stroke="#7F1D1D" strokeWidth="2.2" />
          <path d="M196 156 L200 152 L204 156 L200 160 Z" fill="#FEE2E2" opacity="0.9" />
          {/* dark eye rings */}
          <ellipse cx="162" cy="200" rx="24" ry="18" fill="#1F2937" opacity="0.22" />
          <ellipse cx="238" cy="200" rx="24" ry="18" fill="#1F2937" opacity="0.22" />
          {/* eyes */}
          <ellipse cx="162" cy={eyeY + eyeH / 2} rx="14" ry={Math.max(2, eyeH / 2)} fill="#F8FAFC" stroke="#241A16" strokeWidth="4" />
          <ellipse cx="238" cy={eyeY + eyeH / 2} rx="14" ry={Math.max(2, eyeH / 2)} fill="#F8FAFC" stroke="#241A16" strokeWidth="4" />
          <circle cx="164" cy={eyeY + eyeH / 2 + 1} r="5.5" fill="#0F766E" />
          <circle cx="240" cy={eyeY + eyeH / 2 + 1} r="5.5" fill="#0F766E" />
          <circle cx="162" cy={eyeY + eyeH / 2 - 2} r="2.2" fill="#fff" />
          <circle cx="238" cy={eyeY + eyeH / 2 - 2} r="2.2" fill="#fff" />
          {/* eyebrows */}
          <path d="M142 174 C152 166, 170 164, 182 168" fill="none" stroke="#7F1D1D" strokeWidth="5" strokeLinecap="round" />
          <path d="M218 168 C230 164, 248 166, 258 174" fill="none" stroke="#7F1D1D" strokeWidth="5" strokeLinecap="round" />
          <path d="M196 214 C192 222, 192 228, 200 232 C208 228, 208 222, 204 214" fill="none" stroke="#241A16" strokeOpacity="0.45" strokeWidth="4" strokeLinecap="round" />
          <path d={mouthD} fill={mouthFill} stroke="#7F1D1D" strokeWidth="5" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
};

const LeeCard: React.FC<{ pos: [number, number, number]; scale?: number; rot?: [number, number, number]; frame: number; pose: "ready" | "kick" | "tired" }> = ({ pos, scale = 1, rot = [0, 0, 0], frame, pose }) => {
  const tex = useSvgTexture(<LeeSvg frame={frame} pose={pose} />, ["lee", Math.round(frame / 2), pose], 512, 768);
  return <Card tex={tex} pos={pos} scale={scale} rot={rot} />;
};

const GaaraCard: React.FC<{ pos: [number, number, number]; scale?: number; rot?: [number, number, number]; frame: number; pose: "stance" | "attack" | "guard" }> = ({ pos, scale = 1, rot = [0, 0, 0], frame, pose }) => {
  const tex = useSvgTexture(<GaaraSvg frame={frame} pose={pose} />, ["gaara", Math.round(frame / 2), pose], 512, 768);
  return <Card tex={tex} pos={pos} scale={scale} rot={rot} />;
};

const SandGourd: React.FC<{ pos: [number, number, number]; scale?: number }> = ({ pos, scale = 1 }) => (
  <group position={pos} scale={scale}>
    <mesh position={[0, 0.55, -0.18]} castShadow>
      <sphereGeometry args={[0.32, 20, 20]} />
      <meshStandardMaterial color="#b45309" roughness={0.9} />
    </mesh>
    <mesh position={[0, 0.95, -0.14]} castShadow>
      <sphereGeometry args={[0.22, 20, 20]} />
      <meshStandardMaterial color="#92400e" roughness={0.9} />
    </mesh>
    <Cyl pos={[0, 0.25, -0.18]} args={[0.06, 0.06, 0.4, 10]} color="#78350f" />
  </group>
);

const SandEffect: React.FC<{ frame: number; intensity?: number }> = ({ frame, intensity = 1 }) => (
  <group>
    {Array.from({ length: 12 }).map((_, i) => {
      const a = (i / 12) * Math.PI * 2 + frame * 0.04;
      const r = 0.7 + (i % 3) * 0.25;
      return (
        <mesh key={i} position={[0.8 + Math.cos(a) * r, 1.2 + Math.sin(a * 1.7) * 0.35, 0.2 + Math.sin(a) * 0.2]} layers={NOINK}>
          <sphereGeometry args={[0.05 + (i % 4) * 0.015, 10, 10]} />
          <meshBasicMaterial color="#ddb978" transparent opacity={0.35 * intensity} />
        </mesh>
      );
    })}
  </group>
);

const World: React.FC<{ time: number; frame: number }> = ({ time, frame }) => {
  const { id, local, dur } = segInfo(time);
  const p = smooth(local / dur);
  const dark = id === "hook" || id === "pressure" || id === "closer" || id === "narutoLink" || id === "limit" || id === "beforeBurst";
  const bg =
    id === "narutoLink" || id === "limit" ? "#6b5336" : dark ? "#101625" : id === "stepBack" ? "#1a2438" : "#18243a";

  // Sparse talking: narrator carries most; characters talk only in key moments.
  const chesterTalking = id === "hook" || (id === "pressure" && local > 1.2) || (id === "closer" && local > 2.5 && local < 5.2);
  const mikeTalking = false;
  const producerTalking = id === "producer" && local > 0.5 && local < 3.8;

  return (
    <group>
      <color attach="background" args={[bg]} />
      <fog attach="fog" args={[bg, 10, 38]} />
      <ambientLight intensity={dark ? 0.42 : 0.58} />
      <directionalLight position={[4, 7, 4]} intensity={dark ? 0.95 : 1.2} color="#fff0d8" />
      <pointLight position={[-3, 4.2, 2]} intensity={id === "closer" ? 1.8 : 0.7} color={id === "closer" ? "#ff6b6b" : "#7db6ff"} distance={14} />

      {id === "hook" && (
        <group>
          <StudioRoom dark />
          <StudioDesk />
          <CharacterCard kind="chester" pos={[-0.2, 2.05, 0.45]} scale={1.02} frame={frame} talking={chesterTalking} mood="focus" />
          <MicStand pos={[0.55, 0.6, 0.95]} />
          <Box pos={[0.55, 1.25, 0.95]} args={[0.9, 0.55, 0.02]} color="#000000" />
          <pointLight position={[0.5, 2.2, 1.2]} intensity={1.6 + Math.sin(frame * 0.2) * 0.3} color="#ef4444" distance={8} />
        </group>
      )}

      {id === "studio2000" && (
        <group>
          <StudioRoom />
          <StudioDesk />
          <CharacterCard kind="chester" pos={[-0.55, 2.05, 0.5]} scale={1.0} frame={frame} talking={false} mood="focus" />
          <CharacterCard kind="mike" pos={[0.85, 2.0, 0.15]} scale={0.96} frame={frame} talking={mikeTalking} mood="neutral" cap />
          <MicStand pos={[-0.55, 0.6, 1.0]} />
        </group>
      )}

      {id === "producer" && (
        <group>
          <StudioRoom />
          <StudioDesk />
          <CharacterCard kind="chester" pos={[-0.75, 2.04, 0.55]} scale={0.98} frame={frame} talking={false} mood="sad" />
          <CharacterCard kind="producer" pos={[0.85, 2.02, 0.2]} scale={0.98} frame={frame} talking={producerTalking} mood="focus" />
          <Box pos={[0.1, 0.82, -0.35]} args={[0.34, 0.02, 0.24]} color="#f8fafc" rot={[0, -0.2, 0]} />
          <Box pos={[0.18, 0.83, -0.32]} args={[0.34, 0.02, 0.24]} color="#e2e8f0" rot={[0, 0.15, 0]} />
        </group>
      )}

      {id === "pressure" && (
        <group>
          <StudioRoom dark />
          <StudioDesk />
          <CharacterCard kind="chester" pos={[-0.35, 2.06, 0.5]} scale={1.04} frame={frame} talking={chesterTalking} mood="focus" />
          <MicStand pos={[0.45, 0.6, 0.95]} />
          {Array.from({ length: 6 }).map((_, i) => (
            <Box key={i} pos={[-1.8 + i * 0.72, 3.6 - (i % 2) * 0.25, -1.8]} args={[0.5, 0.06, 0.02]} color="#ef4444" rot={[0, 0, -0.35 + i * 0.14]} />
          ))}
          <pointLight position={[0.2, 2.8, 1.4]} intensity={1.2 + Math.sin(frame * 0.35) * 0.4} color="#f87171" distance={9} />
        </group>
      )}

      {id === "closer" && (
        <group>
          <StudioRoom dark />
          <StudioDesk />
          <CharacterCard kind="chester" pos={[-0.35, 2.08, 0.5]} scale={1.06} frame={frame} talking={chesterTalking} mood="sing" />
          <MicStand pos={[0.45, 0.6, 0.95]} />
          <pointLight position={[0.3, 3.2, 1.4]} intensity={2.2} color="#ff4d4d" distance={10} />
          <pointLight position={[-1.8, 2.8, 1.2]} intensity={1.1} color="#60a5fa" distance={10} />
        </group>
      )}

      {id === "space" && (
        <group>
          <StudioRoom />
          <StudioDesk />
          <CharacterCard kind="chester" pos={[-0.35, 2.04, 0.5]} scale={1.0} frame={frame} talking={false} mood="sad" />
          <CharacterCard kind="mike" pos={[0.85, 2.0, 0.15]} scale={0.95} frame={frame} talking={false} mood="neutral" cap />
          <pointLight position={[0, 3.5, 1.2]} intensity={0.9} color="#93c5fd" distance={10} />
        </group>
      )}

      {id === "narutoLink" && (
        <group>
          <FightArena />
          <LeeCard pos={[-0.72, 2.05, 0.55]} scale={0.98} frame={frame} pose={local < 2.0 ? "ready" : "kick"} rot={[0, 0.12, 0]} />
          <GaaraCard pos={[0.72, 2.03, 0.35]} scale={0.98} frame={frame} pose={local < 2.0 ? "stance" : "guard"} rot={[0, -0.12, 0]} />
          <SandGourd pos={[0.98, 0.95, 0.15]} scale={1.0} />
          <SandEffect frame={frame} intensity={0.8 + Math.sin(frame * 0.12) * 0.2} />
          <pointLight position={[0, 3.6, 1.8]} intensity={1.6} color="#ffe0b2" distance={12} />
          <pointLight position={[-1.5, 2.4, 1.2]} intensity={0.8} color="#86efac" distance={8} />
        </group>
      )}

      {id === "limit" && (
        <group>
          <FightArena />
          <LeeCard pos={[-0.68, 2.02, 0.55]} scale={1.0} frame={frame} pose={local < 2.5 ? "kick" : "tired"} rot={[0, 0.1, 0]} />
          <GaaraCard pos={[0.72, 2.03, 0.35]} scale={1.0} frame={frame} pose={local < 2.5 ? "attack" : "stance"} rot={[0, -0.12, 0]} />
          <SandGourd pos={[0.98, 0.95, 0.15]} scale={1.0} />
          <SandEffect frame={frame} intensity={1.2} />
          {/* impact dust */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0.55]} layers={NOINK}>
            <circleGeometry args={[0.5 + Math.sin(frame * 0.2) * 0.05, 24]} />
            <meshBasicMaterial color="#e6c28b" transparent opacity={0.35} />
          </mesh>
          <pointLight position={[0.2, 3.2, 1.6]} intensity={1.8} color="#ffd8a8" distance={12} />
        </group>
      )}

      {id === "beforeBurst" && (
        <group>
          <StudioRoom dark />
          <StudioDesk />
          <CharacterCard kind="chester" pos={[-0.35, 2.05, 0.5]} scale={1.02} frame={frame} talking={false} mood="focus" />
          <MicStand pos={[0.45, 0.6, 0.95]} />
          <mesh position={[1.4, 2.5, -1.2]} layers={NOINK}>
            <ringGeometry args={[0.35, 0.42, 48]} />
            <meshBasicMaterial color="#fca5a5" transparent opacity={0.9} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[1.4, 2.5, -1.19]} rotation={[0, 0, -frame * 0.08]} layers={NOINK}>
            <planeGeometry args={[0.05, 0.34]} />
            <meshBasicMaterial color="#fecaca" transparent opacity={0.95} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}

      {id === "stepBack" && (
        <group>
          <StudioRoom />
          <StudioDesk />
          <CharacterCard kind="chester" pos={[-0.45, 2.03, 0.55]} scale={1.0} frame={frame} talking={false} mood="smile" />
          <CharacterCard kind="mike" pos={[0.75, 2.0, 0.2]} scale={0.95} frame={frame} talking={false} mood="smile" cap />
          <pointLight position={[0.2, 3.6, 1.4]} intensity={1.3} color="#bfdbfe" distance={11} />
        </group>
      )}

      {id === "cta" && (
        <group>
          <StudioRoom />
          <StudioDesk />
          <CharacterCard kind="chester" pos={[-0.55, 2.04, 0.45]} scale={1.0} frame={frame} talking={false} mood="smile" />
          <CharacterCard kind="mike" pos={[0.55, 2.04, 0.45]} scale={1.0} frame={frame} talking={false} mood="smile" />
          <MicStand pos={[-0.55, 0.6, 0.98]} />
          <MicStand pos={[0.55, 0.6, 0.98]} />
        </group>
      )}
    </group>
  );
};

const CameraRig: React.FC<{ time: number }> = ({ time }) => {
  const { camera } = useThree();
  const { id, local, dur } = segInfo(time);
  const p = smooth(local / dur);
  const pos = new THREE.Vector3(0, 2.45, 7.2);
  const look = new THREE.Vector3(0, 2.0, 0.2);

  if (id === "hook") { pos.set(-0.2, 2.35, 6.4 - p * 0.2); look.set(-0.15, 2.0, 0.3); }
  if (id === "studio2000") { pos.set(0.2 - p * 0.3, 2.45, 7.1 - p * 0.2); look.set(0.1, 2.0, 0.25); }
  if (id === "producer") { pos.set(0.3 - p * 0.5, 2.4, 6.8); look.set(0.1, 1.98, 0.25); }
  if (id === "pressure") { pos.set(-0.15 + Math.sin(p * Math.PI) * 0.08, 2.38, 6.3 - p * 0.15); look.set(-0.2, 2.02, 0.3); }
  if (id === "closer") { pos.set(0, 2.45, 6.7 - p * 0.25); look.set(-0.1, 2.05, 0.35); }
  if (id === "space") { pos.set(0.15 - p * 0.2, 2.45, 7.0); look.set(0.1, 2.0, 0.25); }
  if (id === "narutoLink") { pos.set(0, 2.55, 7.6 - p * 0.25); look.set(0, 1.95, 0.35); }
  if (id === "limit") { pos.set(0.1 - p * 0.2, 2.5, 7.3 - p * 0.15); look.set(0, 1.95, 0.35); }
  if (id === "beforeBurst") { pos.set(-0.1, 2.4, 6.6 - p * 0.15); look.set(-0.1, 2.02, 0.3); }
  if (id === "stepBack") { pos.set(0.1 - p * 0.2, 2.48, 7.1 - p * 0.2); look.set(0.1, 2.0, 0.25); }
  if (id === "cta") { pos.set(0, 2.5, 7.2 - p * 0.15); look.set(0, 2.02, 0.35); }

  camera.position.copy(pos);
  camera.lookAt(look);
  camera.fov = 38;
  camera.updateProjectionMatrix();
  return null;
};

const Overlay: React.FC<{ time: number }> = ({ time }) => {
  const items: { start: number; end: number; text: string; color?: string; size?: number; y?: number }[] = [
    { start: 0.2, end: 2.35, text: "UM PASSO DO LIMITE", color: "#fca5a5", size: 52, y: 120 },
    { start: 3.3, end: 9.0, text: "HYBRID THEORY • 2000\nGRAVAÇÕES SOB PRESSÃO", color: "#93c5fd", size: 42, y: 110 },
    { start: 9.5, end: 13.8, text: "DON GILMORE\n\"REESCREVE DE NOVO\"", color: "#fbbf24", size: 42, y: 115 },
    { start: 18.4, end: 23.8, text: "ONE STEP CLOSER", color: "#ff6b6b", size: 58, y: 120 },
    { start: 24.3, end: 29.2, text: "NÃO ERA SÓ REVOLTA\nERA PEDIDO DE ESPAÇO", color: "#e5e7eb", size: 40, y: 115 },
    { start: 29.8, end: 35.8, text: "NARUTO NOS ANOS 2000\nFEBRE QUE MARCOU GERAÇÕES", color: "#fcd34d", size: 40, y: 115 },
    { start: 36.1, end: 42.4, text: "ROCK LEE vs GAARA\nNO LIMITE, SEM DESISTIR", color: "#a7f3d0", size: 42, y: 115 },
    { start: 42.9, end: 49.6, text: "ATÉ HOJE, UMA DAS BATALHAS\nMAIS LEMBRADAS PELOS FÃS", color: "#fca5a5", size: 40, y: 118 },
    { start: 50.0, end: 53.7, text: "UM PASSO ATRÁS\nTAMBÉM É FORÇA", color: "#bfdbfe", size: 44, y: 118 },
    { start: 54.0, end: 59.3, text: "SEGUE PRA MAIS\nHISTÓRIAS DA MÚSICA", color: "#7CFF9B", size: 44, y: 118 },
  ];

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {items.map((it, i) => {
        const visible = time >= it.start && time <= it.end;
        const o = visible
          ? interpolate(time, [it.start, it.start + 0.25, it.end - 0.25, it.end], [0, 1, 1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          : 0;
        if (o <= 0) return null;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 70,
              right: 70,
              top: it.y ?? 120,
              textAlign: "center",
              opacity: o,
              transform: `translateY(${(1 - o) * 18}px)`,
            }}
          >
            <div
              style={{
                fontFamily: "Arial Black, Arial, sans-serif",
                fontSize: it.size ?? 42,
                color: it.color ?? "#fff",
                lineHeight: 1.15,
                textShadow: "0 6px 24px rgba(0,0,0,0.7)",
                whiteSpace: "pre-line",
              }}
            >
              {it.text}
            </div>
          </div>
        );
      })}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 70,
          textAlign: "center",
          fontFamily: "Arial, sans-serif",
          fontSize: 24,
          color: "rgba(255,255,255,0.72)",
          letterSpacing: 1.2,
        }}
      >
        ONE STEP CLOSER • LINKIN PARK
      </div>
    </AbsoluteFill>
  );
};

const PostFX: React.FC<{ time: number }> = ({ time }) => {
  const { scene, camera } = useThree();
  const { id } = segInfo(time);
  const fx = useMemo(
    () => ({
      ink: new InkPass(scene, camera as THREE.PerspectiveCamera, { strength: 0.72, widthNear: 4.0, widthFar: 2.5 }),
      lens: new LensBlur({ maxCoC: 14, nearScale: 1.0 }),
      bloom: makeBloom(),
      tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
      grade: new GradeEffect(GRADES.day, GRADE_STRENGTH.day),
    }),
    [scene, camera],
  );
  useEffect(() => () => fx.ink.dispose(), [fx]);
  fx.lens.focus = 5.0;
  fx.lens.cInf = 5.0;
  const intense = ["hook", "pressure", "closer", "beforeBurst"].includes(id);
  const cool = ["narutoLink", "limit", "stepBack"].includes(id);
  fx.grade.set(intense ? GRADES.golden : GRADES.day);
  fx.grade.amount = intense ? 0.85 : cool ? 0.9 : 1;
  (fx.bloom as any).intensity = intense ? 0.62 : 0.45;
  return (
    <EffectComposer multisampling={4}>
      <primitive object={fx.ink} dispose={null} />
      <primitive object={fx.lens.pre} dispose={null} />
      <primitive object={fx.lens.main} dispose={null} />
      <primitive object={fx.bloom} dispose={null} />
      <primitive object={fx.tone} dispose={null} />
      <primitive object={fx.grade} dispose={null} />
    </EffectComposer>
  );
};

const SceneRoot: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;
  const { scene } = useThree();
  noInkFallback(scene);
  return (
    <>
      <World time={time} frame={frame} />
      <CameraRig time={time} />
      <PostFX time={time} />
    </>
  );
};

export const OneStepCloserNaruto: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;
  const { id } = segInfo(time);
  const dark = ["hook", "pressure", "closer", "narutoLink", "limit", "beforeBurst"].includes(id);
  const bg = id === "narutoLink" || id === "limit" ? "#6b5336" : dark ? "#101625" : "#18243a";
  return (
    <AbsoluteFill style={{ backgroundColor: bg }}>
      <ThreeCanvas
        width={1080}
        height={1920}
        frameloop="demand"
        dpr={[1, 2]}
        gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}
        camera={{ fov: 38, position: [0, 2.45, 7.2] }}
      >
        <SceneRoot />
      </ThreeCanvas>
      <Overlay time={time} />
      <Audio src={staticFile("one-step-closer-naruto-link/voice.wav")} />
    </AbsoluteFill>
  );
};

export const OneStepCloserNarutoShort = OneStepCloserNaruto;
export default OneStepCloserNaruto;
