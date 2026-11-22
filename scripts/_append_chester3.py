path = r"C:\Users\Pichau\cartoon-short\jimi-broom-short\src\videos\chesterCrawling\ChesterCrawling.tsx"
rest = r'''
const CameraAndPost: React.FC<{ time: number }> = ({ time }) => {
  const { camera, scene } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  const { id, local, dur } = sceneInfo(time);
  const p = smooth(local / dur);
  const pos = new THREE.Vector3();
  const look = new THREE.Vector3(0, 1.45, -0.85);
  let fov = 44;

  if (id === "hook") {
    if (p < 0.55) { pos.set(0, 1.95, 2.2 - p*0.15); look.set(0, 1.95, -0.45); fov = 34; } // face zoom
    else { pos.set(0.15, 1.75, 3.9); look.set(0, 1.45, -0.9); fov = 44; }
  } else if (id === "song") {
    if (p < 0.5) { pos.set(-0.3 + p*0.8, 1.8, 4.2 - p*0.4); look.set(0, 1.45, -0.9); fov = 43; }
    else { pos.set(0.05, 1.95, 2.5); look.set(0.05, 1.9, -0.55); fov = 34; } // face close
  } else if (id === "conflict") {
    if (p < 0.35) { pos.set(-0.45, 1.75, 3.8); look.set(-0.45, 1.45, -0.85); fov = 42; }
    else if (p < 0.7) { pos.set(-0.2, 1.9, 2.45); look.set(-0.22, 1.85, -0.5); fov = 33; } // face close-up
    else { pos.set(-0.7, 1.7, 3.6); look.set(-0.4, 1.45, -0.85); fov = 43; }
  } else if (id === "reveal") {
    if (p < 0.33) { pos.set(0.1, 1.75, 3.8); look.set(0, 1.5, -0.85); fov = 42; }
    else if (p < 0.66) { pos.set(0.05, 1.9, 2.35); look.set(0.05, 1.85, -0.45); fov = 33; } // singing face
    else { pos.set(-0.4, 1.85, 4.3); look.set(-0.05, 1.45, -0.95); fov = 46; }
  } else if (id === "responsibility") {
    if (p < 0.5) { pos.set(0.1, 1.85, 4.5); look.set(-0.1, 1.45, -0.95); fov = 46; }
    else { pos.set(-0.05, 1.9, 2.5); look.set(-0.08, 1.85, -0.55); fov = 34; }
  } else if (id === "grammy") {
    if (p < 0.45) { pos.set(-0.2, 1.8, 4.2); look.set(-0.2, 1.45, -0.85); fov = 44; }
    else { pos.set(-0.1, 1.9, 2.45); look.set(-0.12, 1.85, -0.5); fov = 34; }
  } else {
    if (p < 0.45) { pos.set(0.2, 1.75, 4.0 - p*0.3); look.set(0, 1.48, -0.85); fov = 43; }
    else { pos.set(0, 1.9, 2.4); look.set(0, 1.85, -0.5); fov = 33; } // final face CTA
  }

  cam.position.copy(pos);
  cam.lookAt(look);
  cam.fov = fov;
  cam.near = 0.1; cam.far = 140;
  cam.updateProjectionMatrix();

  const fx = useMemo(() => ({
    ink: new InkPass(scene, cam, { strength: 0.8, widthNear: 4.2, widthFar: 2.6 }),
    lens: new LensBlur({ maxCoC: 18, nearScale: 1.0 }),
    bloom: new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.5, luminanceThreshold: 0.9, luminanceSmoothing: 0.25, mipmapBlur: true, levels: 5, radius: 0.65 }),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(GRADES.day, GRADE_STRENGTH.day),
  }), [scene, cam]);
  useEffect(() => () => fx.ink.dispose(), [fx]);

  const golden = id === "grammy";
  fx.lens.focus = Math.max(2.2, pos.distanceTo(look));
  fx.lens.cInf = 4.0;
  fx.grade.set(golden ? GRADES.golden : GRADES.day);
  fx.grade.amount = golden ? GRADE_STRENGTH.golden : 0.9;
  (fx.bloom as BloomEffect).intensity = id === "reveal" ? 0.8 : id === "grammy" ? 0.72 : id === "conflict" ? 0.35 : 0.55;

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
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const time = frame / fps;
  const { scene } = useThree();
  noInkFallback(scene);
  return <><World time={time} /><CameraAndPost time={time} /></>;
};

const overlayBase: React.CSSProperties = {
  position: "absolute", left: "6%", right: "12%", top: "8%", bottom: "24%",
  display: "flex", alignItems: "flex-start", justifyContent: "center", textAlign: "center",
  fontFamily: '"Montserrat","Bebas Neue","Arial Black",sans-serif', fontWeight: 900, lineHeight: 1.04,
  color: "#ffffff", textShadow: "0 4px 0 rgba(0,0,0,.7),0 10px 30px rgba(0,0,0,.75),3px 3px 0 #000,-3px -3px 0 #000,3px -3px 0 #000,-3px 3px 0 #000",
  letterSpacing: 1.4, pointerEvents: "none", whiteSpace: "pre-line",
};

const TextPop: React.FC<{ text: string; from: number; to: number; top?: string; fontSize?: number; color?: string }> = ({ text, from, to, top = "8%", fontSize = 62, color = "#ffffff" }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const t = frame / fps;
  if (t < from || t > to) return null;
  const local = t - from;
  const enter = Math.min(1, local / 0.16);
  const exit = Math.min(1, Math.max(0, (to - t) / 0.22));
  const opacity = clamp01(enter) * clamp01(exit);
  const y = (1 - clamp01(enter)) * 28;
  const sc = 0.86 + 0.14 * clamp01(enter);
  return <div style={{ ...overlayBase, top, fontSize, color, opacity, transform: `translateY(${y}px) scale(${sc})` }}>{text}</div>;
};

export const ChesterCrawling: React.FC = () => {
  const cues = ((wordsData as any).cues || []) as { start: number; end: number; text: string }[];
  const c = (i: number) => cues[i] || { start: 0, end: 0, text: "" };
  const d = CHESTER_CRAWL_DUR;
  return (
    <AbsoluteFill style={{ backgroundColor: "#090914" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@800;900&family=Bebas+Neue&display=swap');`}</style>
      <ThreeCanvas width={1080} height={1920} camera={{ fov: 45, position: [0, 1.75, 3.35], near: 0.1, far: 140 }} gl={{ antialias: false, stencil: false, powerPreference: "high-performance", toneMappingExposure: 1.0 }}>
        <SceneRoot />
      </ThreeCanvas>

      <TextPop text={"ELE GANHOU\nUM GRAMMY…"} from={Math.max(0.2, c(0).start)} to={c(0).end + 0.3} top="8%" fontSize={68} color="#FFD54A" />
      <TextPop text={"CRAWLING • 2000"} from={c(2).start} to={c(2).end + 0.4} top="8%" fontSize={62} color="#7fd4ff" />
      <TextPop text={"UMA BATALHA\nINTERNA"} from={c(4).start} to={c(5).end + 0.4} top="8%" fontSize={64} color="#9ec5ff" />
      <TextPop text={"PERDER O\nCONTROLE"} from={c(4).start + 2.2} to={c(4).end + 0.2} top="62%" fontSize={56} color="#ff4b66" />
      <TextPop text={"ASSUMIR O\nCONTROLE"} from={c(8).start} to={c(8).end + 0.3} top="8%" fontSize={62} color="#ffffff" />
      <TextPop text={"GRAMMY • 2002"} from={c(10).start} to={c(10).end + 0.4} top="8%" fontSize={66} color="#FFD54A" />
      <TextPop text={"A VOZ QUE\nMARCOU GERAÇÕES"} from={c(12).start} to={c(12).end + 0.5} top="8%" fontSize={56} color="#c8b8ff" />
      <TextPop text={"QUAL MÚSICA\nMARCOU SUA VIDA?"} from={c(13).start} to={d} top="8%" fontSize={58} color="#FFD54A" />

      <Audio src={staticFile("chester-crawling/voice.wav")} />
      <Audio src={staticFile("chester-crawling/music.mp3")} volume={0.11} />
      <Sequence from={Math.floor(0.5 * CHESTER_CRAWL_FPS)} durationInFrames={Math.floor(0.5 * CHESTER_CRAWL_FPS)}>
        <Audio src={staticFile("chester-crawling/sfx_whoosh.wav")} volume={0.16} />
      </Sequence>
      <Sequence from={Math.floor(12.0 * CHESTER_CRAWL_FPS)} durationInFrames={Math.floor(0.35 * CHESTER_CRAWL_FPS)}>
        <Audio src={staticFile("chester-crawling/sfx_impact.wav")} volume={0.12} />
      </Sequence>
      <Sequence from={Math.floor(32.0 * CHESTER_CRAWL_FPS)} durationInFrames={Math.floor(0.5 * CHESTER_CRAWL_FPS)}>
        <Audio src={staticFile("chester-crawling/sfx_whoosh.wav")} volume={0.12} />
      </Sequence>
      <Sequence from={Math.floor(52.0 * CHESTER_CRAWL_FPS)} durationInFrames={Math.floor(3.0 * CHESTER_CRAWL_FPS)}>
        <Audio src={staticFile("chester-crawling/sfx_crowd.wav")} volume={0.13} />
      </Sequence>
    </AbsoluteFill>
  );
};

export default ChesterCrawling;
'''
with open(path, 'a', encoding='utf-8') as f:
    f.write(rest)
print('ok')
