import React, { useMemo } from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import wordsData from "../../../public/galinheiro-seguro-3d/words.json";

export const GALINHEIRO_FPS = 30;
export const GALINHEIRO_FRAMES = 3420; // ~114s

type Word = { text: string; offset: number; duration: number };
const WORDS = (wordsData as any).words as Word[];

// ---------- helpers ----------
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const noAccent = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const Subtitles: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const idx = WORDS.findIndex((w) => w.offset > t);
  const end = idx === -1 ? WORDS.length : idx;
  const slice = WORDS.slice(Math.max(0, end - 7), end).filter((w) => t - w.offset < 3.2);
  const line = noAccent(slice.map((w) => w.text).join(" "));
  if (!line) return null;
  return (
    <div style={{ position: "absolute", bottom: 90, left: 60, right: 60, textAlign: "center" }}>
      <div style={{ display: "inline-block", padding: "14px 20px", background: "rgba(0,0,0,0.45)", borderRadius: 14, fontFamily: "Arial Black, Arial, sans-serif", fontSize: 40, lineHeight: 1.25, color: "#FFFFFF", textShadow: "0 3px 10px rgba(0,0,0,0.9)" }}>
        {line}
      </div>
    </div>
  );
};

// ---------- 3D assets ----------
const Tree: React.FC<{ position: [number, number, number]; scale?: number }> = ({ position, scale = 1 }) => (
  <group position={position} scale={scale}>
    <mesh position={[0, 0.7, 0]} castShadow><cylinderGeometry args={[0.12, 0.16, 1.4, 8]} /><meshStandardMaterial color="#6D4C41" flatShading /></mesh>
    <mesh position={[0, 1.7, 0]} castShadow><sphereGeometry args={[0.75, 10, 10]} /><meshStandardMaterial color="#4CAF50" flatShading /></mesh>
    <mesh position={[0.2, 2.1, -0.1]} castShadow><sphereGeometry args={[0.55, 10, 10]} /><meshStandardMaterial color="#66BB6A" flatShading /></mesh>
  </group>
);

const StoneFencePost: React.FC<{ position: [number, number, number]; rot?: number }> = ({ position, rot = 0 }) => (
  <group position={position} rotation={[0, rot, 0]}>
    <mesh position={[0, 0.25, 0]} castShadow receiveShadow><boxGeometry args={[1.2, 0.5, 0.25]} /><meshStandardMaterial color="#9E9E9E" flatShading /></mesh>
    <mesh position={[0, 0.55, 0]} castShadow receiveShadow><boxGeometry args={[1.1, 0.15, 0.22]} /><meshStandardMaterial color="#BDBDBD" flatShading /></mesh>
  </group>
);

const StoneFence: React.FC<{ from: [number, number]; to: [number, number] }> = ({ from, to }) => {
  const dx = to[0] - from[0]; const dz = to[1] - from[1];
  const len = Math.sqrt(dx * dx + dz * dz);
  const count = Math.max(1, Math.floor(len / 1.1));
  const ang = Math.atan2(dz, dx);
  return <group>{Array.from({ length: count }).map((_, i) => {
    const t = (i + 0.5) / count;
    return <StoneFencePost key={i} position={[from[0] + dx * t, 0, from[1] + dz * t]} rot={ang} />;
  })}</group>;
};

const House: React.FC<{ position: [number, number, number] }> = ({ position }) => (
  <group position={position}>
    <mesh position={[0, 1.2, 0]} castShadow receiveShadow><boxGeometry args={[3.2, 2.4, 2.6]} /><meshStandardMaterial color="#C62828" flatShading /></mesh>
    <mesh position={[0, 2.8, 0]} rotation={[0, Math.PI / 4, 0]} castShadow><coneGeometry args={[2.7, 1.4, 4]} /><meshStandardMaterial color="#5D4037" flatShading /></mesh>
    <mesh position={[0, 0.7, 1.31]}><boxGeometry args={[0.7, 1.2, 0.05]} /><meshStandardMaterial color="#4E342E" flatShading /></mesh>
    <mesh position={[-0.9, 1.4, 1.31]}><boxGeometry args={[0.6, 0.6, 0.05]} /><meshStandardMaterial color="#BBDEFB" flatShading /></mesh>
    <mesh position={[0.9, 1.4, 1.31]}><boxGeometry args={[0.6, 0.6, 0.05]} /><meshStandardMaterial color="#BBDEFB" flatShading /></mesh>
  </group>
);

const Chicken: React.FC<{ position: [number, number, number]; color?: string; scale?: number; bobSeed?: number; walk?: boolean }> = ({ position, color = "#FFFFFF", scale = 1, bobSeed = 0, walk = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const bob = Math.sin(t * 4 + bobSeed) * 0.03;
  const peck = walk ? Math.sin(t * 6 + bobSeed) * 0.08 : Math.sin(t * 2 + bobSeed) * 0.04;
  const w = walk ? Math.sin(t * 8 + bobSeed) * 0.15 : 0;
  return (
    <group position={[position[0], position[1] + Math.abs(bob), position[2]]} scale={scale}>
      <mesh position={[0, 0.22, 0]} castShadow><sphereGeometry args={[0.22, 10, 10]} /><meshStandardMaterial color={color} flatShading /></mesh>
      <mesh position={[0.18, 0.32, 0]} castShadow><sphereGeometry args={[0.13, 10, 10]} /><meshStandardMaterial color={color} flatShading /></mesh>
      <mesh position={[0.3, 0.3, 0]} rotation={[0, 0, peck]}><coneGeometry args={[0.04, 0.1, 4]} /><meshStandardMaterial color="#FF9800" flatShading /></mesh>
      <mesh position={[0.22, 0.42, 0]}><boxGeometry args={[0.03, 0.06, 0.03]} /><meshStandardMaterial color="#F44336" flatShading /></mesh>
      <mesh position={[-0.18, 0.28, 0]} rotation={[0, 0, 0.4]}><boxGeometry args={[0.12, 0.08, 0.02]} /><meshStandardMaterial color={color} flatShading /></mesh>
      <mesh position={[0.05, 0.02, 0.05]} rotation={[w, 0, 0]}><boxGeometry args={[0.03, 0.1, 0.03]} /><meshStandardMaterial color="#FF9800" flatShading /></mesh>
      <mesh position={[0.05, 0.02, -0.05]} rotation={[-w, 0, 0]}><boxGeometry args={[0.03, 0.1, 0.03]} /><meshStandardMaterial color="#FF9800" flatShading /></mesh>
    </group>
  );
};

const Coop: React.FC<{ position: [number, number, number]; doorOpen?: number }> = ({ position, doorOpen = 1 }) => (
  <group position={position}>
    {/* stone base */}
    <mesh position={[0, 0.2, 0]} castShadow receiveShadow><boxGeometry args={[3.4, 0.4, 3.0]} /><meshStandardMaterial color="#8D8D8D" flatShading /></mesh>
    {/* walls */}
    <mesh position={[0, 1.2, -1.35]} castShadow receiveShadow><boxGeometry args={[3.2, 1.8, 0.15]} /><meshStandardMaterial color="#8B5A2B" flatShading /></mesh>
    <mesh position={[-1.55, 1.2, 0]} castShadow receiveShadow><boxGeometry args={[0.15, 1.8, 2.8]} /><meshStandardMaterial color="#8B5A2B" flatShading /></mesh>
    <mesh position={[1.55, 1.2, 0]} castShadow receiveShadow><boxGeometry args={[0.15, 1.8, 2.8]} /><meshStandardMaterial color="#8B5A2B" flatShading /></mesh>
    <mesh position={[0.95, 1.2, 1.35]} castShadow receiveShadow><boxGeometry args={[1.3, 1.8, 0.15]} /><meshStandardMaterial color="#8B5A2B" flatShading /></mesh>
    <mesh position={[-0.95, 1.55, 1.35]} castShadow receiveShadow><boxGeometry args={[1.3, 1.1, 0.15]} /><meshStandardMaterial color="#8B5A2B" flatShading /></mesh>
    <mesh position={[-0.95, 0.65, 1.35]} castShadow receiveShadow><boxGeometry args={[1.3, 0.7, 0.15]} /><meshStandardMaterial color="#8B5A2B" flatShading /></mesh>
    {/* roof */}
    <mesh position={[0, 2.45, 0]} rotation={[0, 0, 0]} castShadow><boxGeometry args={[3.8, 0.12, 3.4]} /><meshStandardMaterial color="#6D4C41" flatShading /></mesh>
    <mesh position={[0, 2.75, -0.7]} rotation={[0.45, 0, 0]} castShadow><boxGeometry args={[3.8, 0.1, 2.0]} /><meshStandardMaterial color="#795548" flatShading /></mesh>
    <mesh position={[0, 2.75, 0.7]} rotation={[-0.45, 0, 0]} castShadow><boxGeometry args={[3.8, 0.1, 2.0]} /><meshStandardMaterial color="#795548" flatShading /></mesh>
    {/* ramp */}
    <mesh position={[-0.4, 0.25, 2.0]} rotation={[0.45, 0, 0]} castShadow receiveShadow><boxGeometry args={[0.8, 0.08, 1.6]} /><meshStandardMaterial color="#A1887F" flatShading /></mesh>
  </group>
);

const Perch: React.FC<{ position: [number, number, number]; w?: number }> = ({ position, w = 1.8 }) => (
  <group position={position}>
    <mesh castShadow><boxGeometry args={[w, 0.08, 0.08]} /><meshStandardMaterial color="#6D4C41" flatShading /></mesh>
    <mesh position={[-w / 2 + 0.05, -0.35, 0]} castShadow><boxGeometry args={[0.08, 0.7, 0.08]} /><meshStandardMaterial color="#5D4037" flatShading /></mesh>
    <mesh position={[w / 2 - 0.05, -0.35, 0]} castShadow><boxGeometry args={[0.08, 0.7, 0.08]} /><meshStandardMaterial color="#5D4037" flatShading /></mesh>
  </group>
);

const NestBox: React.FC<{ position: [number, number, number]; eggs?: boolean }> = ({ position, eggs }) => (
  <group position={position}>
    <mesh castShadow receiveShadow><boxGeometry args={[0.55, 0.45, 0.55]} /><meshStandardMaterial color="#7B5B3A" flatShading /></mesh>
    <mesh position={[0, 0.2, 0]}><boxGeometry args={[0.45, 0.08, 0.45]} /><meshStandardMaterial color="#FDD835" flatShading /></mesh>
    {eggs && <><mesh position={[-0.07, 0.27, 0]}><sphereGeometry args={[0.05, 8, 8]} /><meshStandardMaterial color="#FFF8E1" /></mesh><mesh position={[0.07, 0.27, 0.03]}><sphereGeometry args={[0.05, 8, 8]} /><meshStandardMaterial color="#FFF8E1" /></mesh></>}
  </group>
);

const Raccoon: React.FC<{ position: [number, number, number]; rotY?: number; dig?: number }> = ({ position, rotY = 0, dig = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const paw = Math.sin(t * 8) * dig * 0.3;
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh position={[0, 0.2, 0]} castShadow><boxGeometry args={[0.55, 0.28, 0.32]} /><meshStandardMaterial color="#757575" flatShading /></mesh>
      <mesh position={[0.32, 0.25, 0]} castShadow><boxGeometry args={[0.22, 0.2, 0.22]} /><meshStandardMaterial color="#9E9E9E" flatShading /></mesh>
      <mesh position={[0.38, 0.18, 0.07]}><boxGeometry args={[0.1, 0.07, 0.08]} /><meshStandardMaterial color="#424242" flatShading /></mesh>
      <mesh position={[0.38, 0.18, -0.07]}><boxGeometry args={[0.1, 0.07, 0.08]} /><meshStandardMaterial color="#424242" flatShading /></mesh>
      <mesh position={[0.44, 0.22, 0]}><boxGeometry args={[0.06, 0.06, 0.08]} /><meshStandardMaterial color="#212121" flatShading /></mesh>
      <mesh position={[-0.32, 0.25, 0]} rotation={[0, 0, Math.sin(t * 3) * 0.2]}><boxGeometry args={[0.35, 0.1, 0.1]} /><meshStandardMaterial color="#616161" flatShading /></mesh>
      {/* legs */}
      {[[-0.15,0.12],[0.15,0.12],[-0.15,-0.12],[0.15,-0.12]].map((p,i)=>(<mesh key={i} position={[p[0],0.05,p[1]]} rotation={[i<2?paw:-paw,0,0]}><boxGeometry args={[0.07,0.12,0.07]} /><meshStandardMaterial color="#424242" flatShading /></mesh>))}
    </group>
  );
};

const WireFence: React.FC<{ from: [number, number]; to: [number, number]; buriedMesh?: boolean }> = ({ from, to, buriedMesh }) => {
  const dx = to[0] - from[0]; const dz = to[1] - from[1];
  const len = Math.sqrt(dx * dx + dz * dz);
  const count = Math.max(1, Math.floor(len / 1.2));
  const ang = Math.atan2(dz, dx);
  return <group>
    {Array.from({ length: count + 1 }).map((_, i) => {
      const t = i / count;
      return <mesh key={i} position={[from[0] + dx * t, 0.6, from[1] + dz * t]} castShadow><cylinderGeometry args={[0.03, 0.03, 1.2, 6]} /><meshStandardMaterial color="#9E9E9E" flatShading /></mesh>;
    })}
    <mesh position={[from[0] + dx / 2, 0.6, from[1] + dz / 2]} rotation={[0, ang, 0]}>
      <boxGeometry args={[len, 1.0, 0.02]} /><meshStandardMaterial color="#B0BEC5" transparent opacity={0.35} wireframe />
    </mesh>
    {buriedMesh && <mesh position={[from[0] + dx / 2, -0.35, from[1] + dz / 2]} rotation={[0, ang, 0]}>
      <boxGeometry args={[len, 0.7, 0.03]} /><meshStandardMaterial color="#90A4AE" metalness={0.6} roughness={0.3} />
    </mesh>}
    {buriedMesh && <mesh position={[from[0] + dx / 2, -0.7, from[1] + dz / 2 + 0.35]} rotation={[Math.PI / 2, 0, ang]}>
      <boxGeometry args={[len, 0.7, 0.03]} /><meshStandardMaterial color="#90A4AE" metalness={0.6} roughness={0.3} />
    </mesh>}
  </group>;
};

const Ground: React.FC<{ night?: number }> = ({ night = 0 }) => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[60, 60]} />
      <meshStandardMaterial color={night > 0.5 ? "#4A7A3A" : "#7CB342"} flatShading />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0, 2]} receiveShadow>
      <circleGeometry args={[5.5, 32]} />
      <meshStandardMaterial color={night > 0.5 ? "#6D4C41" : "#8D6E63"} flatShading />
    </mesh>
  </group>
);

const Hills: React.FC<{ night?: number }> = ({ night = 0 }) => (
  <group>
    <mesh position={[-8, 0.8, -12]}><sphereGeometry args={[5, 12, 12]} /><meshStandardMaterial color={night > 0.5 ? "#3F6F3A" : "#689F38"} flatShading /></mesh>
    <mesh position={[6, 0.6, -14]}><sphereGeometry args={[6, 12, 12]} /><meshStandardMaterial color={night > 0.5 ? "#4C7F45" : "#7CB342"} flatShading /></mesh>
    <mesh position={[0, 0.3, -16]}><sphereGeometry args={[7, 12, 12]} /><meshStandardMaterial color={night > 0.5 ? "#558B4F" : "#8BC34A"} flatShading /></mesh>
  </group>
);

const SkyDome: React.FC<{ night?: number }> = ({ night = 0 }) => {
  const top = night > 0.5 ? "#243B6B" : "#FFB74D";
  const bot = night > 0.5 ? "#355C9A" : "#87CEEB";
  return <><color attach="background" args={[bot]} /><fog attach="fog" args={[bot, 22, 55]} /><mesh position={[0, 8, -10]}><sphereGeometry args={[30, 16, 16]} /><meshBasicMaterial color={top} side={THREE.BackSide} /></mesh></>;
};

const FarmLights: React.FC<{ night?: number }> = ({ night = 0 }) => (
  <>
    <ambientLight intensity={night > 0.5 ? 0.7 : 0.65} color={night > 0.5 ? "#C5CAE9" : "#FFF8E1"} />
    <directionalLight position={[8, 12, 6]} intensity={night > 0.5 ? 0.55 : 1.2} color={night > 0.5 ? "#9FA8DA" : "#FFE082"} castShadow />
    {night > 0.5 && <pointLight position={[0, 3.5, 2]} intensity={3.5} distance={14} color="#FFD180" />}
    {night > 0.5 && <pointLight position={[3, 2.5, 4]} intensity={2.0} distance={10} color="#B3C7FF" />}
  </>
);

// Camera rig
const Cam: React.FC<{ pos: [number, number, number]; look: [number, number, number]; fov?: number }> = ({ pos, look, fov = 45 }) => {
  const { camera } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  cam.position.set(...pos);
  cam.lookAt(...look);
  cam.fov = fov;
  cam.updateProjectionMatrix();
  return null;
};

// ---------- Scenes ----------
const Scene1: React.FC = () => { // 0-7s
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const camZ = lerp(18, 12, t / 7);
  const camY = lerp(5.5, 4.2, t / 7);
  return <ThreeCanvas width={1080} height={1920} shadows camera={{ position: [0, 5.5, 18], fov: 45 }}>
    <SkyDome /><FarmLights /><Ground /><Hills />
    <House position={[-5, 0, -6]} />
    <Tree position={[-8, 0, -3]} scale={1.2} /><Tree position={[7, 0, -5]} scale={1.1} /><Tree position={[9, 0, -2]} scale={0.9} />
    <StoneFence from={[-6, 2]} to={[6, 2]} />
    <Coop position={[0, 0, 0]} />
    <Chicken position={[-1.5, 0.4, 1.2]} color="#FFFFFF" bobSeed={1} walk />
    <Chicken position={[1.2, 0.4, 1.5]} color="#8D6E63" bobSeed={2} walk />
    <Cam pos={[0, camY, camZ]} look={[0, 1, -1]} fov={45} />
  </ThreeCanvas>;
};

const Scene2: React.FC = () => { // 7-13s
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const t = frame / fps;
  const camX = lerp(-2, 2, t / 6);
  return <ThreeCanvas width={1080} height={1920} shadows camera={{ position: [0, 2.2, 6], fov: 50 }}>
    <SkyDome /><FarmLights /><Ground /><Hills />
    <House position={[-5, 0, -6]} /><Tree position={[7, 0, -5]} />
    <StoneFence from={[-6, 2]} to={[6, 2]} />
    <Coop position={[0, 0, -1]} />
    <Chicken position={[-1.2, 0.4, 2.2]} color="#FFFFFF" bobSeed={1} walk />
    <Chicken position={[0.5, 0.4, 2.8]} color="#6D4C41" bobSeed={2} walk />
    <Chicken position={[1.8, 0.4, 2.0]} color="#212121" bobSeed={3} walk />
    <Chicken position={[-2.2, 0.4, 3.0]} color="#FFFFFF" bobSeed={4} walk />
    <Chicken position={[2.5, 0.4, 3.2]} color="#A1887F" bobSeed={5} walk />
    <Cam pos={[camX, 1.8, 5.5]} look={[0, 0.5, 1]} fov={50} />
  </ThreeCanvas>;
};

const Scene3: React.FC = () => { // 13-22s
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const t = frame / fps;
  const camZ = lerp(7, 4.2, t / 9);
  const camY = lerp(3.2, 2.0, t / 9);
  return <ThreeCanvas width={1080} height={1920} shadows camera={{ position: [0, 3.2, 7], fov: 45 }}>
    <SkyDome /><FarmLights /><Ground /><Hills />
    <House position={[-6, 0, -8]} /><Tree position={[7, 0, -6]} />
    <Coop position={[0, 0, 0]} />
    <Chicken position={[-0.8, 0.4, 2.0]} color="#FFFFFF" bobSeed={1} walk />
    <Chicken position={[0.3, 0.4, 2.4]} color="#8D6E63" bobSeed={2} walk />
    <Cam pos={[0, camY, camZ]} look={[0, 1.0, 0.5]} fov={45} />
  </ThreeCanvas>;
};

const Scene4: React.FC = () => { // 22-34s
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const t = frame / fps;
  const camZ = lerp(2.2, 0.8, t / 12);
  const camY = lerp(1.6, 1.4, t / 12);
  return <ThreeCanvas width={1080} height={1920} shadows camera={{ position: [0, 1.6, 2.2], fov: 55 }}>
    <SkyDome night={0} /><FarmLights /><Ground />
    <Coop position={[0, 0, 0]} />
    {/* interior floor straw */}
    <mesh position={[0, 0.41, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[2.8, 2.4]} /><meshStandardMaterial color="#D7CCC8" flatShading /></mesh>
    <Perch position={[-0.6, 1.1, -0.3]} w={1.2} />
    <Perch position={[0.7, 1.4, -0.6]} w={1.0} />
    <Chicken position={[-0.7, 1.18, -0.3]} color="#FFFFFF" bobSeed={1} />
    <Chicken position={[0.6, 1.48, -0.6]} color="#8D6E63" bobSeed={2} />
    <Chicken position={[0.2, 0.42, 0.3]} color="#212121" bobSeed={3} walk />
    <Cam pos={[0, camY, camZ]} look={[0, 1.1, -0.5]} fov={55} />
  </ThreeCanvas>;
};

const Scene5: React.FC = () => { // 34-44s
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const t = frame / fps;
  const camX = lerp(-0.8, 0.6, t / 10);
  return <ThreeCanvas width={1080} height={1920} shadows camera={{ position: [-0.8, 1.3, 1.2], fov: 50 }}>
    <SkyDome /><FarmLights /><Ground />
    <Coop position={[0, 0, 0]} />
    <mesh position={[0, 0.41, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[2.8, 2.4]} /><meshStandardMaterial color="#D7CCC8" flatShading /></mesh>
    <Perch position={[-0.5, 1.1, -0.2]} w={1.4} />
    <Perch position={[0.6, 1.45, -0.5]} w={1.1} />
    <Chicken position={[-0.8, 1.18, -0.2]} color="#A1887F" bobSeed={6} />
    <Chicken position={[-0.2, 1.18, -0.2]} color="#FFFFFF" bobSeed={7} />
    <Chicken position={[0.5, 1.53, -0.5]} color="#6D4C41" bobSeed={8} />
    <Cam pos={[camX, 1.35, 1.3]} look={[0, 1.2, -0.3]} fov={50} />
  </ThreeCanvas>;
};

const Scene6: React.FC = () => { // 44-56s
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const t = frame / fps;
  const camX = lerp(-1.2, 1.2, t / 12);
  return <ThreeCanvas width={1080} height={1920} shadows camera={{ position: [-1.2, 1.2, 1.8], fov: 50 }}>
    <SkyDome /><FarmLights /><Ground />
    <Coop position={[0, 0, 0]} />
    <mesh position={[0, 0.41, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[2.8, 2.4]} /><meshStandardMaterial color="#D7CCC8" flatShading /></mesh>
    <NestBox position={[-0.9, 0.65, -1.0]} eggs />
    <NestBox position={[-0.3, 0.65, -1.0]} />
    <NestBox position={[0.3, 0.65, -1.0]} eggs />
    <NestBox position={[0.9, 0.65, -1.0]} />
    <Chicken position={[-0.3, 0.42, -0.3]} color="#FFFFFF" bobSeed={1} walk />
    <Chicken position={[0.8, 0.42, 0.0]} color="#A1887F" bobSeed={2} />
    <Cam pos={[camX, 1.2, 1.6]} look={[0, 0.8, -0.8]} fov={50} />
  </ThreeCanvas>;
};

const Scene7: React.FC = () => { // 56-66s night predator
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const t = frame / fps;
  const rx = lerp(5, 2.5, clamp(t / 10, 0, 1));
  return <ThreeCanvas width={1080} height={1920} shadows camera={{ position: [3, 1.2, 5], fov: 50 }}>
    <SkyDome night={1} /><FarmLights night={1} /><Ground night={1} /><Hills night={1} />
    <Coop position={[0, 0, 0]} />
    <WireFence from={[-3, 3]} to={[3, 3]} />
    <WireFence from={[-3, 3]} to={[-3, -2]} />
    <WireFence from={[3, 3]} to={[3, -2]} />
    <Raccoon position={[rx, 0.4, 3.5]} rotY={Math.PI} />
    <Cam pos={[3.5, 1.0, 5.5]} look={[2.5, 0.4, 3.2]} fov={50} />
  </ThreeCanvas>;
};

const Scene8: React.FC = () => { // 66-78s digging cutaway
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const t = frame / fps;
  const dig = clamp(t / 8, 0, 1);
  const racX = lerp(2.2, 0.8, dig);
  return <ThreeCanvas width={1080} height={1920} shadows camera={{ position: [2.5, 0.8, 4.5], fov: 50 }}>
    <SkyDome night={1} /><FarmLights night={1} />
    <Ground night={1} />
    {/* cutaway soil */}
    <mesh position={[1.5, -0.7, 3]}><boxGeometry args={[5, 1.4, 2]} /><meshStandardMaterial color="#5D4037" flatShading /></mesh>
    <mesh position={[1.5, -0.05, 3]}><boxGeometry args={[5, 0.1, 2]} /><meshStandardMaterial color="#3E2723" flatShading /></mesh>
    {/* tunnel */}
    <mesh position={[lerp(2.2, 1.2, dig), -0.35, 3.0]}><boxGeometry args={[1.8 * dig + 0.2, 0.35, 0.45]} /><meshStandardMaterial color="#2E1B14" flatShading /></mesh>
    <WireFence from={[-1, 3]} to={[4, 3]} />
    <Raccoon position={[racX, dig > 0.3 ? -0.2 : 0.4, 3.2]} rotY={Math.PI} dig={dig} />
    <Coop position={[0, 0, 0]} />
    <Cam pos={[2.5, 0.5, 5.2]} look={[1.5, -0.1, 3.0]} fov={52} />
  </ThreeCanvas>;
};

const Scene9: React.FC = () => { // 78-90s protection
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const t = frame / fps;
  const racX = lerp(2.6, 1.8, clamp(t / 4, 0, 1));
  const bounce = t > 4 ? Math.sin((t - 4) * 6) * 0.03 : 0;
  return <ThreeCanvas width={1080} height={1920} shadows camera={{ position: [2.8, 0.8, 4.8], fov: 50 }}>
    <SkyDome night={1} /><FarmLights night={1} /><Ground night={1} />
    <mesh position={[1.5, -0.7, 3]}><boxGeometry args={[5, 1.4, 2]} /><meshStandardMaterial color="#5D4037" flatShading /></mesh>
    <WireFence from={[-1, 3]} to={[4, 3]} buriedMesh />
    <Raccoon position={[racX + bounce, 0.4, 3.3]} rotY={Math.PI} dig={t > 4 ? 0.6 : 0} />
    <Coop position={[0, 0, 0]} />
    <Cam pos={[2.8, 0.6, 5.0]} look={[1.8, -0.1, 3.0]} fov={50} />
  </ThreeCanvas>;
};

const Scene10: React.FC = () => { // 90-114s final
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const t = frame / fps;
  const camZ = lerp(10, 16, clamp(t / 20, 0, 1));
  const camY = lerp(4, 6, clamp(t / 20, 0, 1));
  return <ThreeCanvas width={1080} height={1920} shadows camera={{ position: [0, 4, 10], fov: 45 }}>
    <SkyDome /><FarmLights /><Ground /><Hills />
    <House position={[-5, 0, -6]} />
    <Tree position={[-8, 0, -3]} scale={1.2} /><Tree position={[7, 0, -5]} scale={1.1} /><Tree position={[9, 0, -2]} scale={0.9} /><Tree position={[-9, 0, -8]} scale={1.0} />
    <StoneFence from={[-6, 2]} to={[6, 2]} />
    <WireFence from={[-3, 3.5]} to={[3, 3.5]} buriedMesh />
    <WireFence from={[-3, 3.5]} to={[-3, -1.5]} buriedMesh />
    <WireFence from={[3, 3.5]} to={[3, -1.5]} buriedMesh />
    <Coop position={[0, 0, 0]} />
    <Chicken position={[-1.2, 0.4, 2.0]} color="#FFFFFF" bobSeed={1} walk />
    <Chicken position={[0.8, 0.4, 2.5]} color="#8D6E63" bobSeed={2} walk />
    <Chicken position={[1.8, 0.4, 1.8]} color="#212121" bobSeed={3} walk />
    <Chicken position={[-2.0, 0.4, 2.8]} color="#A1887F" bobSeed={4} walk />
    <Cam pos={[0, camY, camZ]} look={[0, 0.8, 0]} fov={45} />
  </ThreeCanvas>;
};

export const GalinheiroSeguro3d: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Sequence from={0} durationInFrames={210}><Scene1 /></Sequence>
      <Sequence from={210} durationInFrames={180}><Scene2 /></Sequence>
      <Sequence from={390} durationInFrames={270}><Scene3 /></Sequence>
      <Sequence from={660} durationInFrames={360}><Scene4 /></Sequence>
      <Sequence from={1020} durationInFrames={300}><Scene5 /></Sequence>
      <Sequence from={1320} durationInFrames={360}><Scene6 /></Sequence>
      <Sequence from={1680} durationInFrames={300}><Scene7 /></Sequence>
      <Sequence from={1980} durationInFrames={360}><Scene8 /></Sequence>
      <Sequence from={2340} durationInFrames={360}><Scene9 /></Sequence>
      <Sequence from={2700} durationInFrames={720}><Scene10 /></Sequence>

      <Audio src={staticFile("galinheiro-seguro-3d/voice.wav")} volume={1} />
      <Audio src={staticFile("galinheiro-seguro-3d/bgm.wav")} volume={0.18} loop />
      <Subtitles />
    </AbsoluteFill>
  );
};

export default GalinheiroSeguro3d;
