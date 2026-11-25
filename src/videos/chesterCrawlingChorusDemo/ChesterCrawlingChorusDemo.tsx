import React, { Suspense, useEffect, useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useLoader, useThree } from "@react-three/fiber";

export const CHESTER_CRAWLING_DEMO_FPS = 30;
export const CHESTER_CRAWLING_DEMO_FRAMES = 450; // 15s

const NOINK = 1;

const useTex = (name: string) => {
  const tex = useLoader(THREE.TextureLoader, staticFile(`chester-crawling/${name}`));
  useEffect(() => { tex.colorSpace = THREE.SRGBColorSpace; tex.needsUpdate = true; }, [tex]);
  return tex;
};

const Sprite: React.FC<{ tex: THREE.Texture; pos: [number, number, number]; size: [number, number]; opacity?: number; rot?: [number, number, number] }> = ({ tex, pos, size, opacity = 1, rot = [0, 0, 0] }) => (
  <mesh position={pos} rotation={rot}>
    <planeGeometry args={size} />
    <meshBasicMaterial map={tex} transparent alphaTest={0.04} opacity={opacity} side={THREE.DoubleSide} toneMapped={false} depthWrite={false} />
  </mesh>
);

const Chester: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const singing = useTex("chester_singing.png");
  const normal = useTex("chester_normal.png");
  // alternate poses subtly for life
  const tex = Math.sin(t * 2.2) > 0.2 ? singing : normal;
  const bob = Math.sin(t * 1.8) * 0.03;
  const sway = Math.sin(t * 1.2) * 0.015;
  const scale = 1.95 + Math.sin(t * 3.2) * 0.03;
  return <Sprite tex={tex} pos={[0, 0.35 + bob, -0.55]} size={[2.6 * scale, 3.5 * scale]} rot={[0, 0, sway]} />;
};

const Stage: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const pulse = 0.5 + 0.5 * Math.sin(t * 3.2);
  return (
    <group>
      <color attach="background" args={["#0b0a14"]} />
      <fog attach="fog" args={["#121224", 7, 28]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}><planeGeometry args={[18, 16]} /><meshLambertMaterial color="#12121a" /></mesh>
      <mesh position={[0, 2.8, -5.2]}><boxGeometry args={[16, 6, 0.4]} /><meshLambertMaterial color="#181828" /></mesh>
      <mesh position={[0, 0.18, -1.2]}><boxGeometry args={[8.5, 0.36, 4.2]} /><meshLambertMaterial color="#1b1822" /></mesh>
      {/* lights */}
      <pointLight position={[-2.2, 3.5, -1.2]} intensity={1.4 + pulse * 0.6} color="#2b78ff" distance={10} />
      <pointLight position={[2.2, 3.4, -1.2]} intensity={1.2 + (1 - pulse) * 0.6} color="#ff2f52" distance={10} />
      <pointLight position={[0, 3.8, -1.5]} intensity={0.8} color="#b06cff" distance={11} />
      <ambientLight intensity={0.28} color="#9fb0ff" />
      {/* floor glow */}
      <mesh position={[0, 0.02, -0.8]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.4, 32]} />
        <meshBasicMaterial color="#ff2f52" transparent opacity={0.09} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
};

const CameraRig: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const { camera } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  const x = Math.sin(t * 0.35) * 0.25;
  const y = 1.92 + Math.sin(t * 0.5) * 0.04;
  const z = 2.45 - Math.sin(t * 0.25) * 0.15;
  cam.position.set(x, y, z);
  cam.lookAt(0, 1.75, -0.5);
  cam.fov = 33;
  cam.updateProjectionMatrix();
  return null;
};

const Scene: React.FC = () => (
  <>
    <Stage />
    <Suspense fallback={null}><Chester /></Suspense>
    <CameraRig />
  </>
);

export const ChesterCrawlingChorusDemo: React.FC = () => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#090914" }}>
      <ThreeCanvas width={width} height={height} frameloop="demand" dpr={1.0}
        gl={{ antialias: false, alpha: false, powerPreference: "high-performance", toneMapping: THREE.NoToneMapping, outputColorSpace: THREE.SRGBColorSpace }}
        camera={{ fov: 33, position: [0, 1.92, 2.45], near: 0.1, far: 60 }}
        onCreated={({ gl }) => { gl.setClearColor(0x090914, 1); }}
      >
        <Scene />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

export default ChesterCrawlingChorusDemo;