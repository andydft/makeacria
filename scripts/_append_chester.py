path = r"C:\Users\Pichau\cartoon-short\jimi-broom-short\src\videos\chesterCrawling\ChesterCrawling.tsx"
rest = r'''
const StudioSet: React.FC = () => (
  <group>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,0,0]}><planeGeometry args={[18,16]} /><meshLambertMaterial color="#171724" /></mesh>
    <mesh position={[0,2.8,-5.2]}><boxGeometry args={[16,6,0.4]} /><meshLambertMaterial color="#141428" /></mesh>
    <mesh position={[-3.2,0.7,-2.8]}><boxGeometry args={[1.8,1.2,0.9]} /><meshLambertMaterial color="#1b1b24" /></mesh>
    <mesh position={[-3.2,1.45,-2.8]}><boxGeometry args={[1.4,0.4,0.5]} /><meshLambertMaterial color="#252530" /></mesh>
    <SpeakerStack pos={[3.6,0,-2.6]} />
    <SpeakerStack pos={[-3.8,0,-2.2]} scale={0.9} />
    <LightBar pos={[0,4.2,-3.5]} color="#2a8bff" intensity={1.3} />
    <AlbumFrame pos={[2.8,2.6,-4.95]} rot={[0,-0.15,0]} />
    <pointLight position={[-1.5,3.2,-1]} intensity={1.5} color="#2a8bff" distance={10} />
    <pointLight position={[1.8,2.8,-1.2]} intensity={1.2} color="#ff3355" distance={9} />
    <pointLight position={[0,2.0,1.5]} intensity={0.7} color="#cfe8ff" distance={8} />
    <ambientLight intensity={0.35} color="#a8b8ff" />
  </group>
);

const ConflictSet: React.FC = () => (
  <group>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,0,0]}><planeGeometry args={[16,14]} /><meshLambertMaterial color="#101018" /></mesh>
    <mesh position={[0,2.6,-4.8]}><boxGeometry args={[14,5.5,0.4]} /><meshLambertMaterial color="#141722" /></mesh>
    <mesh position={[1.8,2.1,-3.8]}><boxGeometry args={[2.4,3.4,0.08]} /><meshLambertMaterial color="#1d1f28" /></mesh>
    <mesh position={[1.8,2.1,-3.75]}><planeGeometry args={[2.1,3.1]} /><meshBasicMaterial color="#1b2433" toneMapped={false} /></mesh>
    <mesh position={[1.8,2.1,-3.74]}><planeGeometry args={[2.1,3.1]} /><meshBasicMaterial color="#6fa8ff" transparent opacity={0.06} toneMapped={false} /></mesh>
    <mesh position={[-2.4,0.7,-2.5]}><boxGeometry args={[1.2,1.2,0.8]} /><meshLambertMaterial color="#15151c" /></mesh>
    <pointLight position={[-0.5,3.0,-0.8]} intensity={1.0} color="#88b7ff" distance={8} />
    <pointLight position={[2.2,2.2,-2.8]} intensity={0.8} color="#4d6fff" distance={6} />
    <ambientLight intensity={0.22} color="#8aa0c8" />
  </group>
);

const StageSet: React.FC<{ mode: "reveal" | "empty" | "final" }> = ({ mode }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const t = frame / fps;
  const pulse = 0.5 + 0.5 * Math.sin(t * 3.2);
  return (
    <group>
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,0,0]}><planeGeometry args={[18,16]} /><meshLambertMaterial color={mode === "final" ? "#14101d" : "#12121a"} /></mesh>
      <mesh position={[0,2.8,-5.2]}><boxGeometry args={[16,6,0.4]} /><meshLambertMaterial color={mode === "final" ? "#1a1430" : "#181828"} /></mesh>
      <mesh position={[0,0.18,-1.2]}><boxGeometry args={[8.5,0.36,4.2]} /><meshLambertMaterial color="#1b1822" /></mesh>
      <SpeakerStack pos={[-3.8,0.36,-2.8]} scale={0.95} />
      <SpeakerStack pos={[3.8,0.36,-2.8]} scale={0.95} />
      <LightBar pos={[-1.8,4.3,-3.8]} color="#2b78ff" intensity={1.2 + pulse * 0.4} />
      <LightBar pos={[1.8,4.3,-3.8]} color="#ff2f52" intensity={1.0 + (1-pulse) * 0.4} />
      <pointLight position={[-2.2,3.5,-1.2]} intensity={1.4 + pulse * 0.5} color="#2b78ff" distance={10} />
      <pointLight position={[2.2,3.4,-1.2]} intensity={1.2 + (1-pulse)*0.5} color="#ff2f52" distance={10} />
      {mode === "final" && <><pointLight position={[0,3.8,-1.8]} intensity={1.3} color="#b06cff" distance={11} /><LightBar pos={[0,4.6,-3.5]} color="#b06cff" intensity={1.0} /></>}
      <ambientLight intensity={0.28} color={mode === "final" ? "#c8b8ff" : "#9fb0ff"} />
    </group>
  );
};

const GrammySet: React.FC = () => (
  <group>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,0,0]}><planeGeometry args={[18,16]} /><meshLambertMaterial color="#18120a" /></mesh>
    <mesh position={[0,2.8,-5.2]}><boxGeometry args={[16,6,0.4]} /><meshLambertMaterial color="#241b10" /></mesh>
    <mesh position={[0,0.18,-1.2]}><boxGeometry args={[8.5,0.36,4.2]} /><meshLambertMaterial color="#22190f" /></mesh>
    <mesh position={[-3.2,2.2,-4.9]}><planeGeometry args={[1.2,4.5]} /><meshBasicMaterial color="#ffd36b" transparent opacity={0.08} toneMapped={false} /></mesh>
    <mesh position={[3.2,2.2,-4.9]}><planeGeometry args={[1.2,4.5]} /><meshBasicMaterial color="#ffd36b" transparent opacity={0.08} toneMapped={false} /></mesh>
    <LightBar pos={[0,4.4,-3.8]} color="#ffd36b" intensity={1.2} />
    <pointLight position={[-1.6,3.4,-1]} intensity={1.4} color="#ffd36b" distance={10} />
    <pointLight position={[1.6,3.2,-1.2]} intensity={1.1} color="#5aa2ff" distance={10} />
    <pointLight position={[0,4.0,-1.5]} intensity={0.9} color="#fff0c8" distance={12} />
    <ambientLight intensity={0.35} color="#ffe2b0" />
  </group>
);
'''
with open(path, 'a', encoding='utf-8') as f:
    f.write(rest)
print('ok')
