import React, { useMemo, useRef } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";

export const CONFIG = {
  id: "Chester3dChibiDemo",
  width: 1080,
  height: 1920,
  fps: 30,
  durationInFrames: 450,
};

export const CHESTER_3D_DEMO_FPS = CONFIG.fps;
export const CHESTER_3D_DEMO_FRAMES = CONFIG.durationInFrames;

type SpikeSpec = {
  pos: [number, number, number];
  rot: [number, number, number];
  scale: [number, number, number];
  variant: "base" | "hi" | "shadow";
};

const ChesterChibiSinger: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const t = frame / fps;

  const beat = t * Math.PI * 3.2;
  const bodyBob = Math.abs(Math.sin(beat)) * 0.045;
  const bodySway = Math.sin(beat * 0.5) * 0.08;
  const bodyLean = 0.08 + Math.sin(beat) * 0.03;

  const headNodX = 0.06 + Math.sin(beat * 2) * 0.09;
  const headNodY = Math.sin(beat * 0.5) * 0.16;
  const headRollZ = Math.cos(beat) * 0.06;

  const rightArmRotX = -0.82 + Math.sin(beat) * 0.14;
  const rightArmRotZ = -0.22 + Math.cos(beat * 0.5) * 0.07;

  const leftArmRotX = 0.18 + Math.sin(beat + Math.PI) * 0.28;
  const leftArmRotZ = 0.28 + Math.cos(beat) * 0.1;

  // Boca mais compacta e natural (sem exagerar na abertura para não ficar bocudo)
  const singWave =
    Math.max(0, Math.sin(t * 7.5)) * 0.6 +
    Math.max(0, Math.sin(t * 13.0 + 1.1)) * 0.3;
  const mouthScaleY = THREE.MathUtils.clamp(0.25 + singWave * 0.65, 0.25, 0.9);
  const mouthScaleX = THREE.MathUtils.clamp(0.72 + singWave * 0.18, 0.72, 0.9);

  const hairSpikes = useMemo<SpikeSpec[]>(() => {
    const spikes: SpikeSpec[] = [];
    const count = 34;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const ring = i % 3;
      const radius = ring === 0 ? 0.34 : ring === 1 ? 0.24 : 0.12;
      const yBase = ring === 0 ? 0.22 : ring === 1 ? 0.33 : 0.39;

      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius * 0.92;
      const jitter = Math.sin(i * 4.7) * 0.05;

      const rotX = z * 1.45 + jitter;
      const rotZ = -x * 1.45 - jitter;
      const rotY = angle + Math.cos(i * 2.3) * 0.5;

      const len = 0.15 + ((i * 7) % 5) * 0.025;
      const thick = 0.058 + ((i * 3) % 3) * 0.012;

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
          <meshStandardMaterial color="#1D2230" roughness={0.8} flatShading />
        </mesh>
        <group position={[0, -0.38, 0.04]}>
          <mesh castShadow>
            <boxGeometry args={[0.17, 0.11, 0.27]} />
            <meshStandardMaterial color="#151822" roughness={0.65} flatShading />
          </mesh>
          <mesh position={[0, -0.04, 0.01]}>
            <boxGeometry args={[0.18, 0.03, 0.29]} />
            <meshStandardMaterial color="#E6E8F0" roughness={0.7} flatShading />
          </mesh>
        </group>
      </group>

      <group position={[0.17, 0.44, 0]}>
        <mesh position={[0, -0.18, -0.02 * Math.sin(beat)]} castShadow>
          <capsuleGeometry args={[0.095, 0.22, 5, 8]} />
          <meshStandardMaterial color="#1D2230" roughness={0.8} flatShading />
        </mesh>
        <group position={[0, -0.38, 0.04]}>
          <mesh castShadow>
            <boxGeometry args={[0.17, 0.11, 0.27]} />
            <meshStandardMaterial color="#151822" roughness={0.65} flatShading />
          </mesh>
          <mesh position={[0, -0.04, 0.01]}>
            <boxGeometry args={[0.18, 0.03, 0.29]} />
            <meshStandardMaterial color="#E6E8F0" roughness={0.7} flatShading />
          </mesh>
        </group>
      </group>

      {/* TRONCO */}
      <group position={[0, 0.76, 0]}>
        <mesh castShadow>
          <capsuleGeometry args={[0.25, 0.24, 6, 9]} />
          <meshStandardMaterial color="#171921" roughness={0.78} flatShading />
        </mesh>
        <mesh position={[0, 0.03, 0.235]}>
          <boxGeometry args={[0.18, 0.14, 0.03]} />
          <meshStandardMaterial color="#272B3A" roughness={0.75} flatShading />
        </mesh>
        <mesh position={[0, 0.24, 0.18]} rotation={[0.45, 0, 0]}>
          <torusGeometry args={[0.085, 0.012, 5, 12]} />
          <meshStandardMaterial color="#C8D0E0" metalness={0.5} roughness={0.35} flatShading />
        </mesh>
      </group>

      {/* PESCOÇO */}
      <mesh position={[0, 1.04, 0.01]} castShadow>
        <cylinderGeometry args={[0.085, 0.1, 0.12, 7]} />
        <meshStandardMaterial color="#F2C6A5" roughness={0.72} flatShading />
      </mesh>

      {/* BRAÇO ESQUERDO */}
      <group position={[-0.31, 0.94, 0]} rotation={[leftArmRotX, 0, leftArmRotZ]}>
        <mesh position={[0, -0.15, 0]} castShadow>
          <capsuleGeometry args={[0.072, 0.18, 5, 8]} />
          <meshStandardMaterial color="#171921" roughness={0.78} flatShading />
        </mesh>
        <mesh position={[0, -0.32, 0.02]} castShadow>
          <capsuleGeometry args={[0.062, 0.14, 5, 8]} />
          <meshStandardMaterial color="#F2C6A5" roughness={0.72} flatShading />
        </mesh>
        <mesh position={[0, -0.44, 0.03]} castShadow>
          <sphereGeometry args={[0.078, 7, 7]} />
          <meshStandardMaterial color="#F2C6A5" roughness={0.72} flatShading />
        </mesh>
      </group>

      {/* BRAÇO DIREITO + MICROFONE */}
      <group position={[0.31, 0.94, 0.02]} rotation={[rightArmRotX, 0, rightArmRotZ]}>
        <mesh position={[0, -0.14, 0]} castShadow>
          <capsuleGeometry args={[0.072, 0.17, 5, 8]} />
          <meshStandardMaterial color="#171921" roughness={0.78} flatShading />
        </mesh>
        <mesh position={[-0.03, -0.29, 0.07]} rotation={[0.55, 0, 0]} castShadow>
          <capsuleGeometry args={[0.062, 0.14, 5, 8]} />
          <meshStandardMaterial color="#F2C6A5" roughness={0.72} flatShading />
        </mesh>
        <mesh position={[-0.07, -0.38, 0.17]} castShadow>
          <sphereGeometry args={[0.082, 7, 7]} />
          <meshStandardMaterial color="#F2C6A5" roughness={0.72} flatShading />
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

      {/* CABEÇA + FEIÇÕES DO CHESTER */}
      <group position={[0, 1.32, 0.03]} rotation={[headNodX, headNodY, headRollZ]}>
        <mesh scale={[0.98, 1.06, 1.02]} castShadow>
          <sphereGeometry args={[0.37, 10, 9]} />
          <meshStandardMaterial color="#F4C9A8" roughness={0.7} flatShading />
        </mesh>

        {/* Queixo + piercing característico */}
        <mesh position={[0, -0.22, 0.28]} scale={[0.7, 0.44, 0.55]}>
          <sphereGeometry args={[0.24, 7, 6]} />
          <meshStandardMaterial color="#EAB893" roughness={0.72} flatShading />
        </mesh>
        <mesh position={[0, -0.225, 0.348]}>
          <sphereGeometry args={[0.016, 6, 6]} />
          <meshStandardMaterial color="#D8E0EC" metalness={0.85} roughness={0.2} flatShading />
        </mesh>

        {/* Orelhas */}
        <mesh position={[-0.36, -0.01, 0]} rotation={[0, 0, 0.2]}>
          <boxGeometry args={[0.06, 0.13, 0.08]} />
          <meshStandardMaterial color="#EAB893" roughness={0.75} flatShading />
        </mesh>
        <mesh position={[0.36, -0.01, 0]} rotation={[0, 0, -0.2]}>
          <boxGeometry args={[0.06, 0.13, 0.08]} />
          <meshStandardMaterial color="#EAB893" roughness={0.75} flatShading />
        </mesh>

        {/* Sobrancelhas */}
        <mesh position={[-0.135, 0.095, 0.335]} rotation={[0, 0, -0.18]}>
          <boxGeometry args={[0.115, 0.028, 0.035]} />
          <meshStandardMaterial color="#5E492B" roughness={0.75} flatShading />
        </mesh>
        <mesh position={[0.135, 0.095, 0.335]} rotation={[0, 0, 0.18]}>
          <boxGeometry args={[0.115, 0.028, 0.035]} />
          <meshStandardMaterial color="#5E492B" roughness={0.75} flatShading />
        </mesh>

        {/* Olhos */}
        <group position={[-0.13, 0.035, 0.33]}>
          <mesh scale={[1.15, 0.85, 0.6]}>
            <sphereGeometry args={[0.062, 8, 8]} />
            <meshStandardMaterial color="#F7F8FC" roughness={0.4} flatShading />
          </mesh>
          <mesh position={[0.008, 0, 0.026]}>
            <sphereGeometry args={[0.034, 7, 7]} />
            <meshStandardMaterial color="#1B1E28" roughness={0.3} flatShading />
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
            <meshStandardMaterial color="#1B1E28" roughness={0.3} flatShading />
          </mesh>
          <mesh position={[0.006, 0.014, 0.052]}>
            <sphereGeometry args={[0.013, 5, 5]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.2} />
          </mesh>
        </group>

        {/* Nariz */}
        <mesh position={[0, -0.02, 0.375]} rotation={[0.25, 0, 0]}>
          <coneGeometry args={[0.038, 0.085, 5]} />
          <meshStandardMaterial color="#E7B38C" roughness={0.72} flatShading />
        </mesh>

        {/* Boca discreta e proporcional (sem ficar bocuda) */}
        <group position={[0, -0.14, 0.345]} scale={[mouthScaleX, mouthScaleY, 1]}>
          <mesh>
            <boxGeometry args={[0.082, 0.026, 0.03]} />
            <meshStandardMaterial color="#2A0B14" roughness={0.65} flatShading />
          </mesh>
          <mesh position={[0, 0.015, 0.005]}>
            <boxGeometry args={[0.086, 0.01, 0.03]} />
            <meshStandardMaterial color="#C88A72" roughness={0.7} flatShading />
          </mesh>
        </group>

        {/* Cabelo loiro espetado */}
        <group position={[0, 0.07, -0.01]}>
          <mesh position={[0, 0.13, -0.02]} scale={[1.02, 0.72, 1.02]}>
            <sphereGeometry args={[0.37, 9, 8]} />
            <meshStandardMaterial color="#E8C95A" roughness={0.55} flatShading />
          </mesh>

          {hairSpikes.map((spike, idx) => {
            const color =
              spike.variant === "hi"
                ? "#FFF19E"
                : spike.variant === "shadow"
                ? "#C39F35"
                : "#F0D368";
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

export const Chester3dChibiDemo: React.FC = () => {
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
        <ChesterChibiSinger frame={frame} fps={fps} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

export default Chester3dChibiDemo;