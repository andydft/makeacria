path = r"C:\Users\Pichau\cartoon-short\jimi-broom-short\src\videos\chesterCrawling\ChesterCrawling.tsx"
rest = r'''
const World: React.FC<{ time: number }> = ({ time }) => {
  const { id, local, dur } = sceneInfo(time);
  const p = smooth(local / dur);
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const t = frame / fps;

  return (
    <group>
      {id === "hook" && (
        <group>
          <color attach="background" args={["#080812"]} />
          <fog attach="fog" args={["#090914", 7, 26]} />
          <StudioSet />
          <FloorGlow color="#2a8bff" />
          {/* face close-up punch in -> pull back */}
          {p < 0.55 ? (
            <Suspense fallback={null}><Chester pose="normal" pos={[0, 0.25, -0.45]} scale={2.1 + p*0.15} tilt={Math.sin(t*1.2)*0.01} /></Suspense>
          ) : (
            <Suspense fallback={null}><Chester pose="normal" pos={[0, 1.5, -0.9]} scale={1.05} tilt={Math.sin(t*0.8)*0.008} /></Suspense>
          )}
        </group>
      )}

      {id === "song" && (
        <group>
          <color attach="background" args={["#0b0b16"]} />
          <fog attach="fog" args={["#101022", 7, 28]} />
          <StudioSet />
          <MicStand pos={[0.85, 0, -0.45]} />
          <Cable from={[0.85,0.1,-0.45]} to={[3.2,0.2,-2.5]} />
          <FloorGlow color="#ff3355" pos={[0.2,0.02,-0.8]} scale={1.8} />
          {/* medium establishing -> close on face */}
          {p < 0.5 ? (
            <Suspense fallback={null}><Chester pose="normal" pos={[lerp(-0.25,0.1,p*2), 1.5, -0.95]} scale={1.0} /></Suspense>
          ) : (
            <Suspense fallback={null}><Chester pose="normal" pos={[0.05, 0.45, -0.55]} scale={1.75} tilt={-0.01} /></Suspense>
          )}
        </group>
      )}

      {id === "conflict" && (
        <group>
          <color attach="background" args={["#070910"]} />
          <fog attach="fog" args={["#0a1020", 6, 24]} />
          <ConflictSet />
          <FloorGlow color="#4d6fff" pos={[-0.5,0.02,-0.8]} scale={1.8} />
          {/* sad Chester medium, then face close-up, subtle mirror silhouette */}
          {p < 0.35 ? (
            <Suspense fallback={null}><Chester pose="sad" pos={[-0.55, 1.45, -0.85]} scale={1.05} tilt={-0.015} /></Suspense>
          ) : p < 0.7 ? (
            <Suspense fallback={null}><Chester pose="sad" pos={[-0.25, 0.35, -0.5]} scale={1.9} tilt={-0.01} /></Suspense>
          ) : (
            <Suspense fallback={null}><Chester pose="sad" pos={[-0.5, 1.45, -0.85]} scale={1.02} /></Suspense>
          )}
          <Suspense fallback={null}><Chester pose="sad" pos={[1.7, 1.45, -3.72]} scale={0.72} opacity={0.14} /></Suspense>
        </group>
      )}

      {id === "reveal" && (
        <group>
          <color attach="background" args={["#0b0a14"]} />
          <fog attach="fog" args={["#121224", 7, 28]} />
          <StageSet mode="reveal" />
          <MicStand pos={[0.8, 0, -0.4]} />
          <Cable from={[0.8,0.1,-0.4]} to={[3.5,0.2,-2.6]} />
          <FloorGlow color="#ff2f52" scale={2.4} />
          {/* SINGING - dynamic: medium, face close, wide */}
          {p < 0.33 ? (
            <Suspense fallback={null}><Chester pose="singing" pos={[0, 1.5, -0.85]} scale={1.08} energy={1} tilt={Math.sin(t*2)*0.01} /></Suspense>
          ) : p < 0.66 ? (
            <Suspense fallback={null}><Chester pose="singing" pos={[0.05, 0.2, -0.45]} scale={2.15} energy={1} tilt={Math.sin(t*2.5)*0.008} /></Suspense>
          ) : (
            <Suspense fallback={null}><Chester pose="singing" pos={[-0.1, 1.45, -1.0]} scale={1.0} energy={0.8} /></Suspense>
          )}
        </group>
      )}

      {id === "responsibility" && (
        <group>
          <color attach="background" args={["#0a0a12"]} />
          <fog attach="fog" args={["#11111d", 7, 28]} />
          <StageSet mode="empty" />
          <MicStand pos={[1.4, 0, -0.7]} />
          <FloorGlow color="#6fa8ff" pos={[-0.2,0.02,-0.9]} scale={2.0} />
          {p < 0.5 ? (
            <Suspense fallback={null}><Chester pose="sad" pos={[-0.2, 1.48, -0.95]} scale={1.0} tilt={-0.008} /></Suspense>
          ) : (
            <Suspense fallback={null}><Chester pose="normal" pos={[-0.1, 0.35, -0.55]} scale={1.85} /></Suspense>
          )}
        </group>
      )}

      {id === "grammy" && (
        <group>
          <color attach="background" args={["#120e08"]} />
          <fog attach="fog" args={["#2a1e10", 7, 28]} />
          <GrammySet />
          <Crowd color="#0e0d14" hype={p>0.25} />
          <Trophy pos={[1.5, 0.36, -0.35]} scale={1.0} />
          <FloorGlow color="#ffd36b" pos={[-0.2,0.02,-0.8]} scale={2.2} />
          {p < 0.45 ? (
            <Suspense fallback={null}><Chester pose="normal" pos={[-0.35, 1.5, -0.9]} scale={1.02} /></Suspense>
          ) : (
            <Suspense fallback={null}><Chester pose="normal" pos={[-0.15, 0.3, -0.5]} scale={1.95} tilt={0.005} /></Suspense>
          )}
        </group>
      )}

      {id === "final" && (
        <group>
          <color attach="background" args={["#100d18"]} />
          <fog attach="fog" args={["#1a1530", 7, 28]} />
          <StageSet mode="final" />
          <Crowd color="#100f18" hype />
          <FloorGlow color="#b07cff" scale={2.4} />
          {p < 0.45 ? (
            <Suspense fallback={null}><Chester pose="normal" pos={[0, 1.5, -0.85]} scale={1.05} energy={0.3} /></Suspense>
          ) : (
            <Suspense fallback={null}><Chester pose="sad" pos={[0, 0.25, -0.5]} scale={2.05} /></Suspense>
          )}
        </group>
      )}
    </group>
  );
};
'''
with open(path, 'a', encoding='utf-8') as f:
    f.write(rest)
print('ok')
