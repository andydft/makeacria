import React, { useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";

export const CHESTER_3D_DEMO_FPS = 30;
export const CHESTER_3D_DEMO_FRAMES = 450;

const ChibiSinger: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const bob = Math.sin(t * 2.2) * 0.06;
  const sway = Math.sin(t * 1.4) * 0.08;
  const sing = Math.sin(t * 6) * 0.5 + 0.5; // 0..1
  const armL = Math.sin(t * 2.4) * 0.4;
  const armR = Math.sin(t * 2.4 + 1.2) * 0.5 + 0.3;
  const headNod = Math.sin(t * 2.8) * 0.08;

  const skin = "#F2C39B";
  const shirt = "#1E1E24";
  const pants = "#2A2A35";
  const hair = "#D6B06A";
  const mic = "#333844";

  return (
    <group position={[0, 0.1 + bob, 0]} rotation={[0, sway * 0.3, 0]}>
      {/* legs */}
      <mesh position={[-0.18, 0.45, 0]}><capsuleGeometry args={[0.11, 0.45, 4, 8]} /><meshStandardMaterial color={pants} /></mesh>
      <mesh position={[0.18, 0.45, 0]}><capsuleGeometry args={[0.11, 0.45, 4, 8]} /><meshStandardMaterial color={pants} /></mesh>
      {/* shoes */}
      <mesh position={[-0.18, 0.12, 0.05]}><boxGeometry args={[0.18, 0.12, 0.3]} /><meshStandardMaterial color="#111118" /></mesh>
      <mesh position={[0.18, 0.12, 0.05]}><boxGeometry args={[0.18, 0.12, 0.3]} /><meshStandardMaterial color="#111118" /></mesh>
      {/* body */}
      <mesh position={[0, 1.05, 0]}><capsuleGeometry args={[0.32, 0.55, 4, 8]} /><meshStandardMaterial color={shirt} /></mesh>
      {/* arms */}
      <group position={[-0.42, 1.25, 0]} rotation={[armL, 0, 0.5]}>
        <mesh position={[0, -0.28, 0]}><capsuleGeometry args={[0.08, 0.42, 4, 8]} /><meshStandardMaterial color={shirt} /></mesh>
        <mesh position={[0, -0.56, 0]}><sphereGeometry args={[0.09, 8, 8]} /><meshStandardMaterial color={skin} /></mesh>
      </group>
      <group position={[0.42, 1.25, 0.05]} rotation={[-0.8 + armR * 0.2, 0, -0.7]}>
        <mesh position={[0, -0.28, 0]}><capsuleGeometry args={[0.08, 0.42, 4, 8]} /><meshStandardMaterial color={shirt} /></mesh>
        <mesh position={[0, -0.56, 0]}><sphereGeometry args={[0.09, 8, 8]} /><meshStandardMaterial color={skin} /></mesh>
        {/* mic */}
        <group position={[0, -0.62, 0.12]} rotation={[0.4, 0, 0]}>
          <mesh><cylinderGeometry args={[0.025, 0.025, 0.25, 8]} /><meshStandardMaterial color={mic} metalness={0.6} roughness={0.3} /></mesh>
          <mesh position={[0, 0.15, 0]}><sphereGeometry args={[0.07, 10, 10]} /><meshStandardMaterial color="#4A4F5A" metalness={0.5} roughness={0.35} /></mesh>
        </group>
      </group>
      {/* neck */}
      <mesh position={[0, 1.48, 0]}><cylinderGeometry args={[0.09, 0.11, 0.14, 8]} /><meshStandardMaterial color={skin} /></mesh>
      {/* head */}
      <group position={[0, 1.78, 0]} rotation={[headNod, 0, 0]}>
        <mesh><sphereGeometry args={[0.34, 16, 16]} /><meshStandardMaterial color={skin} /></mesh>
        {/* hair */}
        <mesh position={[0, 0.12, -0.02]}><sphereGeometry args={[0.35, 16, 16, 0, Math.PI * 2, 0, Math.PI / 1.8]} /><meshStandardMaterial color={hair} /></mesh>
        <mesh position={[-0.18, 0.22, 0.05]} rotation={[0.2, 0, 0.5]}><boxGeometry args={[0.12, 0.22, 0.12]} /><meshStandardMaterial color={hair} /></mesh>
        <mesh position={[0.18, 0.22, 0.05]} rotation={[0.2, 0, -0.5]}><boxGeometry args={[0.12, 0.22, 0.12]} /><meshStandardMaterial color={hair} /></mesh>
        {/* eyes */}
        <mesh position={[-0.1, 0.02, 0.3]}><sphereGeometry args={[0.035, 8, 8]} /><meshStandardMaterial color="#1A1A1A" /></mesh>
        <mesh position={[0.1, 0.02, 0.3]}><sphereGeometry args={[0.035, 8, 8]} /><meshStandardMaterial color="#1A1A1A" /></mesh>
        {/* mouth singing */}
        <mesh position={[0, -0.12, 0.3]} scale={[1, 0.4 + sing * 0.8, 1]}>
          <sphereGeometry args={[0.055, 8, 8]} />
          <meshStandardMaterial color="#3A1A1A" />
        </mesh>
      </group>
    </group>
  );
};

const Stage: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const pulse = 0.5 + 0.5 * Math.sin(t * 3.2);
  return (
    <group>
      <color attach="background" args={["#120E1F"]} />
      <fog attach="fog" args={["#120E1F", 8, 22]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#1E1A2E" />
      </mesh>
      <mesh position={[0, 2.5, -4]}><boxGeometry args={[14, 6, 0.3]} /><meshStandardMaterial color="#19162A" /></mesh>
      {/* stage platform */}
      <mesh position={[0, 0.08, 0]}><cylinderGeometry args={[2.2, 2.4, 0.16, 24]} /><meshStandardMaterial color="#2A2540" /></mesh>
      <pointLight position={[-3, 4, 2]} intensity={1.8 + pulse * 0.6} color="#7B6CFF" distance={12} />
      <pointLight position={[3, 3.5, 2]} intensity={1.4 + (1 - pulse) * 0.6} color="#FF5C8A" distance={12} />
      <pointLight position={[0, 4.5, -2]} intensity={1.0} color="#5ED3FF" distance={12} />
      <ambientLight intensity={0.35} color="#C8C0FF" />
    </group>
  );
};

const CameraRig: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const { camera } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  cam.position.set(Math.sin(t * 0.35) * 0.5, 2.0 + Math.sin(t * 0.4) * 0.08, 4.8 - Math.sin(t * 0.2) * 0.2);
  cam.lookAt(0, 1.4, 0);
  cam.fov = 34;
  cam.updateProjectionMatrix();
  return null;
};

export const Chester3dChibiDemo: React.FC = () => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#120E1F" }}>
      <ThreeCanvas width={width} height={height} frameloop="demand" dpr={1.0}
        gl={{ antialias: true, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping, outputColorSpace: THREE.SRGBColorSpace }}
        camera={{ fov: 34, position: [0, 2, 4.8], near: 0.1, far: 40 }}
      >
        <Stage />
        <ChibiSinger />
        <CameraRig />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

export default Chester3dChibiDemo;