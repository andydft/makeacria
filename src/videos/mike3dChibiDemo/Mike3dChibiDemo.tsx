import React, { useMemo, useRef } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";

export const CONFIG = {
  id: "Mike3dChibiDemo",
  width: 1080,
  height: 1920,
  fps: 30,
  durationInFrames: 450,
};

export const MIKE_3D_DEMO_FPS = CONFIG.fps;
export const MIKE_3D_DEMO_FRAMES = CONFIG.durationInFrames;

type SpikeSpec = {
  pos: [number, number, number];
  rot: [number, number, number];
  scale: [number, number, number];
  variant: "base" | "hi" | "shadow";
};

const MikeChibiSinger: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const t = frame / fps;

  const beat = t * Math.PI * 3.2;
  const bodyBob = Math.abs(Math.sin(beat)) * 0.042;
  const bodySway = Math.sin(beat * 0.5 + 0.8) * 0.075;
  const bodyLean = 0.09 + Math.sin(beat) * 0.03;

  const headNodX = 0.07 + Math.sin(beat * 2) * 0.09;
  const headNodY = Math.sin(beat * 0.5 + 0.4) * 0.15;
  const headRollZ = Math.cos(beat) * 0.055;

  const rightArmRotX = -0.78 + Math.sin(beat) * 0.13;
  const rightArmRotZ = -0.2 + Math.cos(beat * 0.5) * 0.07;

  const leftArmRotX = 0.16 + Math.sin(beat + Math.PI) * 0.26;
  const leftArmRotZ = 0.27 + Math.cos(beat) * 0.1;

  // Expressão vocal / sorriso tenso de canto semelhante à foto de referência
  const singWave =
    Math.max(0, Math.sin(t * 7.8 + 0.5)) * 0.55 +
    Math.max(0, Math.sin(t * 12.5)) * 0.3;
  const mouthScaleY = THREE.MathUtils.clamp(0.28 + singWave * 0.65, 0.28, 0.93);
  const mouthScaleX = THREE.MathUtils.clamp(0.78 + singWave * 0.16, 0.78, 0.94);

  // Cabelo espetado azul (visual icônico azul da foto de referência)
  const hairSpikes = useMemo<SpikeSpec[]>(() => {
    const spikes: SpikeSpec[] = [];
    const count = 32;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const ring = i % 3;
      const radius = ring === 0 ? 0.33 : ring === 1 ? 0.23 : 0.11;
      const yBase = ring === 0 ? 0.21 : ring === 1 ? 0.32 : 0.38;

      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius * 0.92;
      const jitter = Math.sin(i * 4.1) * 0.045;

      const rotX = z * 1.35 + jitter;
      const rotZ = -x * 1.35 - jitter;
      const rotY = angle + Math.cos(i * 2.1) * 0.45;

      const len = 0.13 + ((i * 5) % 4) * 0.022;
      const thick = 0.056 + ((i * 3) % 3) * 0.011;

      spikes.push({
        pos: [x, yBase, z],
        rot: [rotX, rotY, rotZ],
        scale: [thick, len, thick],
        variant: i % 5 === 0 ? "hi" : i % 4 === 0 ? "shadow" : "base",
      });
    }
    return spikes;
  }, []);

  return (
    <group
      position={[bodySway * 0.6, bodyBob, 0]}
      rotation={[bodyLean, bodySway, -bodySway * 0.35]}
    >
      {/* PERNAS */}
      <group position={[-0.17, 0.44, 0]}>
        <mesh position={[0, -0.18, 0.02 * Math.sin(beat)]} castShadow>
          <capsuleGeometry args={[0.095, 0.22, 5, 8]} />
          <meshStandardMaterial color="#1A1F2E" roughness={0.8} flatShading />
        </mesh>
        <group position={[0, -0.38, 0.04]}>
          <mesh castShadow>
            <boxGeometry args={[0.17, 0.11, 0.27]} />
            <meshStandardMaterial color="#141720" roughness={0.65} flatShading />
          </mesh>
          <mesh position={[0, -0.04, 0.01]}>
            <boxGeometry args={[0.18, 0.03, 0.29]} />
            <meshStandardMaterial color="#DCE0EC" roughness={0.7} flatShading />
          </mesh>
        </group>
      </group>

      <group position={[0.17, 0.44, 0]}>
        <mesh position={[0, -0.18, -0.02 * Math.sin(beat)]} castShadow>
          <capsuleGeometry args={[0.095, 0.22, 5, 8]} />
          <meshStandardMaterial color="#1A1F2E" roughness={0.8} flatShading />
        </mesh>
        <group position={[0, -0.38, 0.04]}>
          <mesh castShadow>
            <boxGeometry args={[0.17, 0.11, 0.27]} />
            <meshStandardMaterial color="#141720" roughness={0.65} flatShading />
          </mesh>
          <mesh position={[0, -0.04, 0.01]}>
            <boxGeometry args={[0.18, 0.03, 0.29]} />
            <meshStandardMaterial color="#DCE0EC" roughness={0.7} flatShading />
          </mesh>
        </group>
      </group>

      {/* TRONCO (camiseta escura com gola branca discreta por baixo) */}
      <group position={[0, 0.76, 0]}>
        <mesh castShadow>
          <capsuleGeometry args={[0.25, 0.24, 6, 9]} />
          <meshStandardMaterial color="#151822" roughness={0.78} flatShading />
        </mesh>
        <mesh position={[0, 0.23, 0.17]} rotation={[0.4, 0, 0]}>
          <torusGeometry args={[0.09, 0.014, 5, 12]} />
          <meshStandardMaterial color="#D8DCE6" roughness={0.75} flatShading />
        </mesh>
      </group>

      {/* PESCOÇO */}
      <mesh position={[0, 1.04, 0.01]} castShadow>
        <cylinderGeometry args={[0.088, 0.102, 0.12, 7]} />
        <meshStandardMaterial color="#ECC09D" roughness={0.72} flatShading />
      </mesh>

      {/* BRAÇO ESQUERDO */}
      <group position={[-0.31, 0.94, 0]} rotation={[leftArmRotX, 0, leftArmRotZ]}>
        <mesh position={[0, -0.15, 0]} castShadow>
          <capsuleGeometry args={[0.072, 0.18, 5, 8]} />
          <meshStandardMaterial color="#151822" roughness={0.78} flatShading />
        </mesh>
        <mesh position={[0, -0.32, 0.02]} castShadow>
          <capsuleGeometry args={[0.062, 0.14, 5, 8]} />
          <meshStandardMaterial color="#ECC09D" roughness={0.72} flatShading />
        </mesh>
        <mesh position={[0, -0.44, 0.03]} castShadow>
          <sphereGeometry args={[0.078, 7, 7]} />
          <meshStandardMaterial color="#ECC09D" roughness={0.72} flatShading />
        </mesh>
      </group>

      {/* BRAÇO DIREITO + MICROFONE */}
      <group position={[0.31, 0.94, 0.02]} rotation={[rightArmRotX, 0, rightArmRotZ]}>
        <mesh position={[0, -0.14, 0]} castShadow>
          <capsuleGeometry args={[0.072, 0.17, 5, 8]} />
          <meshStandardMaterial color="#151822" roughness={0.78} flatShading />
        </mesh>
        <mesh position={[-0.03, -0.29, 0.07]} rotation={[0.55, 0, 0]} castShadow>
          <capsuleGeometry args={[0.062, 0.14, 5, 8]} />
          <meshStandardMaterial color="#ECC09D" roughness={0.72} flatShading />
        </mesh>
        <mesh position={[-0.07, -0.38, 0.17]} castShadow>
          <sphereGeometry args={[0.082, 7, 7]} />
          <meshStandardMaterial color="#ECC09D" roughness={0.72} flatShading />
        </mesh>

        <group position={[-0.08, -0.34, 0.25]} rotation={[1.18, 0.15, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.032, 0.024, 0.26, 8]} />
            <meshStandardMaterial color="#2A2E39" metalness={0.6} roughness={0.35} flatShading />
          </mesh>
          <mesh position={[0, 0.13, 0]}>
            <cylinderGeometry args={[0.036, 0.036, 0.02, 8]} />
            <meshStandardMaterial color="#9AA5B8" metalness={0.8} roughness={0.25} flatShading />
          </mesh>
          <mesh position={[0, 0.18, 0]} castShadow>
            <sphereGeometry args={[0.065, 8, 8]} />
            <meshStandardMaterial color="#6C7688" metalness={0.75} roughness={0.3} flatShading />
          </mesh>
        </group>
      </group>

      {/* CABEÇA + FEIÇÕES DO MIKE */}
      <group position={[0, 1.32, 0.03]} rotation={[headNodX, headNodY, headRollZ]}>
        <mesh scale={[0.99, 1.05, 1.02]} castShadow>
          <sphereGeometry args={[0.37, 10, 9]} />
          <meshStandardMaterial color="#EEBF9B" roughness={0.7} flatShading />
        </mesh>

        {/* Cavanhaque / barba rala no queixo */}
        <mesh position={[0, -0.225, 0.295]} scale={[0.58, 0.34, 0.42]}>
          <sphereGeometry args={[0.18, 7, 6]} />
          <meshStandardMaterial color="#20222A" roughness={0.85} flatShading />
        </mesh>

        {/* Orelhas + brincos */}
        <mesh position={[-0.36, -0.01, 0]} rotation={[0, 0, 0.2]}>
          <boxGeometry args={[0.06, 0.13, 0.08]} />
          <meshStandardMaterial color="#E2B08A" roughness={0.75} flatShading />
        </mesh>
        <mesh position={[-0.37, -0.08, 0.01]}>
          <torusGeometry args={[0.024, 0.007, 5, 10]} />
          <meshStandardMaterial color="#E6D28E" metalness={0.8} roughness={0.25} flatShading />
        </mesh>

        <mesh position={[0.36, -0.01, 0]} rotation={[0, 0, -0.2]}>
          <boxGeometry args={[0.06, 0.13, 0.08]} />
          <meshStandardMaterial color="#E2B08A" roughness={0.75} flatShading />
        </mesh>
        <mesh position={[0.37, -0.08, 0.01]}>
          <torusGeometry args={[0.024, 0.007, 5, 10]} />
          <meshStandardMaterial color="#E6D28E" metalness={0.8} roughness={0.25} flatShading />
        </mesh>

        {/* Sobrancelhas escuras e marcadas */}
        <mesh position={[-0.135, 0.095, 0.335]} rotation={[0, 0, -0.14]}>
          <boxGeometry args={[0.115, 0.032, 0.035]} />
          <meshStandardMaterial color="#181A22" roughness={0.75} flatShading />
        </mesh>
        <mesh position={[0.135, 0.095, 0.335]} rotation={[0, 0, 0.14]}>
          <boxGeometry args={[0.115, 0.032, 0.035]} />
          <meshStandardMaterial color="#181A22" roughness={0.75} flatShading />
        </mesh>

        {/* Olhos */}
        <group position={[-0.13, 0.035, 0.33]}>
          <mesh scale={[1.15, 0.85, 0.6]}>
            <sphereGeometry args={[0.062, 8, 8]} />
            <meshStandardMaterial color="#F7F8FC" roughness={0.4} flatShading />
          </mesh>
          <mesh position={[0.008, 0, 0.026]}>
            <sphereGeometry args={[0.034, 7, 7]} />
            <meshStandardMaterial color="#161820" roughness={0.3} flatShading />
          </mesh>
          <mesh position={[0.022, 0.014, 0.052]}>
            <sphereGeometry args={[0.013, 5, 5]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.2} />
          </mesh>
        </group>

        <group position={[0.13, 0.035, 0.33]}>
          <mesh scale={[1.15, 0.85, 0.6]}>
            <sphereGeometry args={[0.062, 8, 8]} />
            <meshStandardMaterial color="#F7F8FC" roughness={0.4} flatShading />
          </mesh>
          <mesh position={[-0.008, 0, 0.026]}>
            <sphereGeometry args={[0.034, 7, 7]} />
            <meshStandardMaterial color="#161820" roughness={0.3} flatShading />
          </mesh>
          <mesh position={[0.006, 0.014, 0.052]}>
            <sphereGeometry args={[0.013, 5, 5]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.2} />
          </mesh>
        </group>

        {/* Nariz */}
        <mesh position={[0, -0.02, 0.375]} rotation={[0.25, 0, 0]}>
          <coneGeometry args={[0.04, 0.085, 5]} />
          <meshStandardMaterial color="#E0AA82" roughness={0.72} flatShading />
        </mesh>

        {/* Boca com expressão de canto / sorriso tenso */}
        <group position={[0, -0.14, 0.345]} scale={[mouthScaleX, mouthScaleY, 1]}>
          <mesh>
            <boxGeometry args={[0.088, 0.028, 0.03]} />
            <meshStandardMaterial color="#2A0B14" roughness={0.65} flatShading />
          </mesh>
          <mesh position={[0, 0.015, 0.005]}>
            <boxGeometry args={[0.092, 0.01, 0.03]} />
            <meshStandardMaterial color="#C68870" roughness={0.7} flatShading />
          </mesh>
        </group>

        {/* Cabelo espetado azul */}
        <group position={[0, 0.07, -0.01]}>
          <mesh position={[0, 0.13, -0.02]} scale={[1.02, 0.72, 1.02]}>
            <sphereGeometry args={[0.37, 9, 8]} />
            <meshStandardMaterial color="#1D4ED8" roughness={0.55} flatShading />
          </mesh>

          {hairSpikes.map((spike, idx) => {
            const color =
              spike.variant === "hi"
                ? "#60A5FA"
                : spike.variant === "shadow"
                ? "#1E3A8A"
                : "#2563EB";
            return (
              <mesh
                key={idx}
                position={spike.pos}
                rotation={spike.rot}
                scale={spike.scale}
                castShadow
              >
                <coneGeometry args={[0.85, 1.6, 5]} />
                <meshStandardMaterial color={color} roughness={0.5} flatShading />
              </mesh>
            );
          })}
        </group>
      </group>
    </group>
  );
};

const StageAndLights: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const t = frame / fps;
  const p1Ref = useRef<THREE.PointLight>(null);
  const p2Ref = useRef<THREE.PointLight>(null);

  const p1Pos: [number, number, number] = [
    Math.cos(t * 1.4) * 2.4,
    2.1 + Math.sin(t * 2.1) * 0.35,
    1.8 + Math.sin(t * 1.4) * 0.8,
  ];

  const p2Pos: [number, number, number] = [
    Math.sin(t * 1.2 + 1.5) * 2.4,
    1.6 + Math.cos(t * 1.9) * 0.3,
    -1.2 + Math.cos(t * 1.2) * 0.9,
  ];

  return (
    <>
      <color attach="background" args={["#120E1F"]} />
      <fog attach="fog" args={["#120E1F", 5.5, 14]} />

      <ambientLight color="#C8C0FF" intensity={0.35} />
      <pointLight ref={p1Ref} position={p1Pos} color="#7B6CFF" intensity={4.2} distance={9} />
      <pointLight ref={p2Ref} position={p2Pos} color="#FF5C8A" intensity={3.8} distance={9} />
      <pointLight position={[0, 2.8, 2.6]} color="#5ED3FF" intensity={2.4} distance={10} />

      <mesh position={[0, -0.06, 0]} receiveShadow>
        <cylinderGeometry args={[1.55, 1.72, 0.12, 24]} />
        <meshStandardMaterial color="#1E1833" roughness={0.65} metalness={0.2} flatShading />
      </mesh>

      <mesh position={[0, 1.8, -2.4]} receiveShadow>
        <boxGeometry args={[6.5, 4.5, 0.25]} />
        <meshStandardMaterial color="#19132B" roughness={0.85} flatShading />
      </mesh>
    </>
  );
};

export const Mike3dChibiDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;

  const camX = interpolate(Math.sin(t * 0.75), [-1, 1], [-0.45, 0.45]);
  const camY = interpolate(Math.cos(t * 0.55), [-1, 1], [1.35, 1.65]);
  const camZ = interpolate(Math.sin(t * 0.4), [-1, 1], [3.35, 3.85]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#120E1F" }}>
      <ThreeCanvas
        width={width}
        height={height}
        shadows
        camera={{
          position: [camX, camY, camZ],
          fov: 34,
          near: 0.1,
          far: 40,
        }}
        onCreated={({ camera }) => {
          camera.lookAt(0, 1.4, 0);
        }}
      >
        <StageAndLights frame={frame} fps={fps} />
        <MikeChibiSinger frame={frame} fps={fps} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

export default Mike3dChibiDemo;