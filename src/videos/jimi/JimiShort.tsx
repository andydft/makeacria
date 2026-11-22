import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const JIMI_DURATION = 3957; // ~131.89s @30fps (voice.wav)
const FPS = 30;

type Seg = { from: number; dur: number; id: string };
const seg = (fromSec: number, toSec: number, id: string): Seg => ({
  from: Math.round(fromSec * FPS),
  dur: Math.max(1, Math.round((toSec - fromSec) * FPS)),
  id,
});

// Timing synced to public/jimi/words.json (13 segments, approximate per-word distribution, 131.893s)
const SEGS: Seg[] = [
  seg(0.0, 7.726, "hook"),
  seg(7.976, 19.622, "setting"),
  seg(19.872, 31.849, "broom"),
  seg(32.099, 42.792, "listen"),
  seg(43.042, 57.1, "guitar5"),
  seg(57.35, 66.604, "practice"),
  seg(66.854, 76.396, "snap"),
  seg(76.646, 82.601, "luck1"),
  seg(82.851, 89.028, "luck2"),
  seg(89.278, 103.137, "analogy"),
  seg(103.387, 110.671, "analogy2"),
  seg(110.921, 119.422, "conseq"),
  seg(119.672, 131.893, "callback"),
];

const Fade: React.FC<{ from: number; dur: number; children: React.ReactNode; bg?: string }> = ({
  from,
  dur,
  children,
  bg = "#0b1020",
}) => {
  const f = useCurrentFrame();
  const local = f - from;
  if (local < -10 || local > dur + 10) return null;
  const fade = 12;
  const o = interpolate(local, [0, fade, dur - fade, dur], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ opacity: o, background: bg }}>
      {children}
    </AbsoluteFill>
  );
};

const Broom: React.FC<{ x: number; y: number; rot?: number; scale?: number }> = ({ x, y, rot = -20, scale = 1 }) => (
  <div style={{ position: "absolute", left: x, top: y, transform: `rotate(${rot}deg) scale(${scale})`, transformOrigin: "50% 90%" }}>
    <div style={{ width: 18, height: 420, background: "#a56a3a", borderRadius: 9, margin: "0 auto", boxShadow: "inset -3px 0 0 #7a4a24" }} />
    <div style={{ width: 90, height: 140, background: "#e2c36b", borderRadius: "10px 10px 30px 30px", marginTop: -6, marginLeft: -36, position: "relative", overflow: "hidden" }}>
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} style={{ position: "absolute", left: 4 + i * 7, top: 10, width: 4, height: 120, background: i % 2 ? "#caa84a" : "#efda88", borderRadius: 2 }} />
      ))}
    </div>
  </div>
);

const Guitar: React.FC<{ x: number; y: number; scale?: number; color?: string }> = ({ x, y, scale = 1, color = "#d85c3a" }) => (
  <div style={{ position: "absolute", left: x, top: y, transform: `scale(${scale})` }}>
    <div style={{ width: 26, height: 260, background: "#5a3a22", borderRadius: 10, margin: "0 auto" }} />
    <div style={{ width: 70, height: 60, background: "#2b1e16", borderRadius: 8, margin: "-6px auto 0" }} />
    <div style={{ width: 220, height: 260, background: color, borderRadius: "110px 110px 140px 140px", margin: "-10px auto 0", position: "relative", boxShadow: "inset -18px -20px 0 rgba(0,0,0,0.15)" }}>
      <div style={{ position: "absolute", left: 80, top: 70, width: 60, height: 60, borderRadius: 30, background: "#1a1410" }} />
      <div style={{ position: "absolute", left: 60, top: 150, width: 100, height: 40, borderRadius: 8, background: "#f1ddb0" }} />
    </div>
  </div>
);

const Boy: React.FC<{ x: number; y: number; arm?: number; scale?: number }> = ({ x, y, arm = 0, scale = 1 }) => (
  <div style={{ position: "absolute", left: x, top: y, transform: `scale(${scale})` }}>
    <div style={{ width: 120, height: 120, background: "#f2c9a0", borderRadius: 60, margin: "0 auto", position: "relative" }}>
      <div style={{ position: "absolute", left: 28, top: 45, width: 14, height: 14, background: "#2b1f1a", borderRadius: 7 }} />
      <div style={{ position: "absolute", right: 28, top: 45, width: 14, height: 14, background: "#2b1f1a", borderRadius: 7 }} />
      <div style={{ position: "absolute", left: 45, top: 78, width: 30, height: 10, borderBottom: "5px solid #7a4a3a", borderRadius: 20 }} />
      <div style={{ position: "absolute", left: -5, top: -10, width: 130, height: 50, background: "#2b1f1a", borderRadius: "60px 60px 20px 20px" }} />
    </div>
    <div style={{ width: 90, height: 140, background: "#3a6ea5", borderRadius: 20, margin: "-5px auto 0" }} />
    <div style={{ position: "absolute", left: -10, top: 150, width: 30, height: 110, background: "#f2c9a0", borderRadius: 15, transform: `rotate(${-30 + arm}deg)`, transformOrigin: "top center" }} />
    <div style={{ position: "absolute", right: -10, top: 150, width: 30, height: 110, background: "#f2c9a0", borderRadius: 15, transform: `rotate(${30 - arm}deg)`, transformOrigin: "top center" }} />
    <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: -5 }}>
      <div style={{ width: 28, height: 120, background: "#4a3a2a", borderRadius: 12 }} />
      <div style={{ width: 28, height: 120, background: "#4a3a2a", borderRadius: 12 }} />
    </div>
  </div>
);

const Note: React.FC<{ x: number; y: number; size?: number; color?: string; o?: number }> = ({ x, y, size = 40, color = "#ffd86b", o = 1 }) => (
  <div style={{ position: "absolute", left: x, top: y, opacity: o, color, fontSize: size, fontWeight: 700 }}>♪</div>
);

const Vinyl: React.FC<{ x: number; y: number; r: number; spin: number }> = ({ x, y, r, spin }) => (
  <div style={{ position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: r, background: "radial-gradient(circle,#444 0%,#111 40%,#222 41%,#0a0a0a 100%)", transform: `rotate(${spin}deg)` }}>
    <div style={{ position: "absolute", left: r - 30, top: r - 30, width: 60, height: 60, borderRadius: 30, background: "#d85c3a" }} />
    <div style={{ position: "absolute", left: r - 6, top: r - 6, width: 12, height: 12, borderRadius: 6, background: "#f5f0e6" }} />
  </div>
);

const SceneHook: React.FC = () => {
  const f = useCurrentFrame();
  const strum = Math.sin(f * 0.6) * 18;
  const glow = interpolate(Math.sin(f * 0.2), [-1, 1], [0.2, 0.5]);
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg,#1a1a2e,#16213e)" }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 540px 900px, rgba(255,216,107,${glow}), transparent 500px)` }} />
      <Boy x={430} y={900} arm={strum} scale={1.1} />
      <Broom x={360} y={780} rot={-25 + strum * 0.5} scale={1.0} />
      {[0, 1, 2].map((i) => (
        <Note key={i} x={620 + i * 60} y={820 - ((f * 2 + i * 40) % 300)} o={1 - ((f * 2 + i * 40) % 300) / 300} />
      ))}
    </AbsoluteFill>
  );
};

const SceneSetting: React.FC = () => {
  const f = useCurrentFrame();
  const drift = (f % 600) * 0.5;
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg,#5a7ea8,#9bbad1 55%,#6b6b6b 55%,#4a4a4a)" }}>
      {/* rain-ish Seattle mood */}
      {Array.from({ length: 40 }).map((_, i) => (
        <div key={i} style={{ position: "absolute", left: (i * 53 + drift) % 1080, top: (i * 97 + f * 6) % 1920, width: 3, height: 40, background: "rgba(200,220,255,0.25)", borderRadius: 2 }} />
      ))}
      {/* houses */}
      {[80, 260, 430, 620, 800].map((x, i) => (
        <div key={i} style={{ position: "absolute", left: x, top: 980 - (i % 2) * 60, width: 140, height: 180 + (i % 3) * 30, background: ["#7a6a5a", "#6b5c52", "#8a7760"][i % 3] }}>
          <div style={{ position: "absolute", left: 20, top: -70, width: 0, height: 0, borderLeft: "70px solid transparent", borderRight: "70px solid transparent", borderBottom: "70px solid #5a3a2a" }} />
          <div style={{ position: "absolute", left: 50, top: 80, width: 40, height: 60, background: "#ffd86b", opacity: 0.7 }} />
        </div>
      ))}
      {/* radio waves */}
      <div style={{ position: "absolute", left: 760, top: 350, width: 180, height: 220, background: "#7a4a2a", borderRadius: 16 }}>
        <div style={{ margin: 20, height: 80, background: "#e8d8b0", borderRadius: 8 }} />
        <div style={{ margin: "0 30px", height: 10, background: "#333", borderRadius: 5 }} />
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ position: "absolute", left: 720 - i * 30, top: 320 - i * 20, width: 40 + i * 60, height: 40 + i * 60, border: "4px solid rgba(255,216,107,0.25)", borderColor: "rgba(255,216,107,0.25) transparent transparent transparent", borderRadius: 999 }} />
      ))}
      <Boy x={200} y={1180} arm={Math.sin(f * 0.1) * 5} scale={0.9} />
    </AbsoluteFill>
  );
};

const SceneBroom: React.FC = () => {
  const f = useCurrentFrame();
  const strum = Math.sin(f * 0.7) * 22;
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg,#2c1e3a,#1a1025)" }}>
      <div style={{ position: "absolute", left: 140, top: 300, right: 140, bottom: 400, background: "#3a2a22", borderRadius: 20, opacity: 0.6 }} />
      <Boy x={420} y={980} arm={strum} scale={1.15} />
      <Broom x={330} y={860} rot={-28 + strum * 0.6} scale={1.05} />
      {Array.from({ length: 6 }).map((_, i) => (
        <Note key={i} x={300 + (i % 3) * 180} y={700 - ((f * 1.5 + i * 50) % 400)} color={i % 2 ? "#ffd86b" : "#7fd4ff"} o={0.8 - ((f * 1.5 + i * 50) % 400) / 500} size={36 + (i % 3) * 10} />
      ))}
    </AbsoluteFill>
  );
};

const SceneListen: React.FC = () => {
  const f = useCurrentFrame();
  const spin = f * 4;
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg,#201a2e,#0f1724)" }}>
      <Vinyl x={540} y={650} r={220} spin={spin} />
      <div style={{ position: "absolute", left: 700, top: 520, width: 18, height: 260, background: "#c0c0c0", borderRadius: 9, transform: "rotate(25deg)", transformOrigin: "top center" }} />
      <Boy x={380} y={1100} arm={Math.sin(f * 0.15) * 8} scale={0.95} />
      {Array.from({ length: 8 }).map((_, i) => (
        <Note key={i} x={120 + i * 110} y={350 + Math.sin((f + i * 20) * 0.08) * 80} color={["#ffd86b", "#ff8fa3", "#7fd4ff"][i % 3]} size={34} o={0.7} />
      ))}
    </AbsoluteFill>
  );
};

const SceneGuitar5: React.FC = () => {
  const f = useCurrentFrame();
  const strum = Math.sin(f * 0.5) * 15;
  const tagPulse = interpolate(Math.sin(f * 0.15), [-1, 1], [0.9, 1.1]);
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg,#2a2438,#3a2f2a)" }}>
      <div style={{ position: "absolute", left: 760, top: 260, width: 180, height: 120, background: "#f5f0d8", borderRadius: 8, transform: `scale(${tagPulse})`, border: "4px solid #c9b07a" }}>
        <div style={{ textAlign: "center", marginTop: 18, fontSize: 52, fontWeight: 800, color: "#2b5a2b" }}>$5</div>
      </div>
      <div style={{ position: "absolute", left: 820, top: 360, fontSize: 36, color: "#e8e0d0", fontWeight: 600, opacity: 0 }}>1958</div>
      <Boy x={360} y={920} arm={strum} scale={1.05} />
      <Guitar x={320} y={820} scale={0.85} color="#b86a3a" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Note key={i} x={650 + i * 50} y={880 - ((f * 1.8 + i * 35) % 260)} o={1 - ((f * 1.8 + i * 35) % 260) / 260} />
      ))}
    </AbsoluteFill>
  );
};

const ScenePractice: React.FC = () => {
  const f = useCurrentFrame();
  const cycle = f % 60;
  const good = cycle > 30;
  const strum = Math.sin(f * 0.8) * 20;
  return (
    <AbsoluteFill style={{ background: good ? "linear-gradient(180deg,#1e2a3a,#243b55)" : "linear-gradient(180deg,#2a1e2a,#3b2430)" }}>
      <Boy x={400} y={940} arm={strum} scale={1.05} />
      <Guitar x={360} y={840} scale={0.85} color="#b86a3a" />
      {good ? (
        <Note x={680} y={780} size={70} color="#7CFF8A" o={interpolate(cycle, [30, 45, 60], [0, 1, 0])} />
      ) : (
        <Note x={680} y={780} size={60} color="#ff6b6b" o={interpolate(cycle, [0, 15, 30], [0, 1, 0])} />
      )}
      <div style={{ position: "absolute", left: 100, right: 100, bottom: 260, height: 24, background: "#333", borderRadius: 12 }}>
        <div style={{ width: `${interpolate(f, [0, 270], [10, 95], { extrapolateRight: "clamp" })}%`, height: "100%", background: "linear-gradient(90deg,#ff8fa3,#ffd86b,#7CFF8A)", borderRadius: 12 }} />
      </div>
    </AbsoluteFill>
  );
};

const SceneSnap: React.FC = () => {
  const f = useCurrentFrame();
  const flash = interpolate(f, [0, 10, 25], [0, 0.8, 0], { extrapolateRight: "clamp" });
  const zoom = interpolate(f, [0, 120], [1, 1.08], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg,#102a43,#243b53)", transform: `scale(${zoom})` }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 540px 850px, rgba(124,255,138,0.35), transparent 450px)` }} />
      <Boy x={380} y={900} arm={5} scale={1.1} />
      <Guitar x={340} y={800} scale={0.9} color="#d85c3a" />
      {[0, 1, 2, 3, 4].map((i) => (
        <Note key={i} x={540 + Math.cos(i * 1.2) * (120 + f * 1.5)} y={820 + Math.sin(i * 1.2) * (80 + f)} color="#7CFF8A" size={44} o={interpolate(f, [0, 20, 120], [0, 1, 0.2], { extrapolateRight: "clamp" })} />
      ))}
      <AbsoluteFill style={{ background: "white", opacity: flash }} />
    </AbsoluteFill>
  );
};

const SceneLuck: React.FC<{ flip?: boolean }> = ({ flip }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: flip ? "linear-gradient(180deg,#2b1d3a,#1a1025)" : "linear-gradient(180deg,#1d2b3a,#102030)" }}>
      <div style={{ position: "absolute", left: 140, top: 500, right: 140, height: 500, border: "6px dashed rgba(255,255,255,0.2)", borderRadius: 30, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 260, height: 360, borderRadius: 20, background: "rgba(255,255,255,0.06)", transform: `rotate(${flip ? 8 : -8}deg)` }} />
      </div>
      <Boy x={420} y={1100} arm={Math.sin(f * 0.2) * 6} scale={1.0} />
      <Guitar x={380} y={1000} scale={0.75} color="#b86a3a" />
    </AbsoluteFill>
  );
};

const SceneAnalogy: React.FC = () => {
  const f = useCurrentFrame();
  const t = (f % 90) / 90;
  // ball bouncing to wall in dark and returning (listening/adjusting metaphor)
  const wallX = 880;
  const startX = 180;
  const hit = t < 0.5;
  const bx = hit ? interpolate(t, [0, 0.5], [startX, wallX]) : interpolate(t, [0.5, 1], [wallX, startX + f * 0.05 % 80]);
  const by = 900 + Math.sin(t * Math.PI) * -120;
  const ear = interpolate(Math.abs(bx - (startX + 40)), [0, 400, 700], [1, 0.5, 0.2]);
  return (
    <AbsoluteFill style={{ background: "#05070d" }}>
      <div style={{ position: "absolute", right: 160, top: 300, width: 40, height: 1200, background: "#6b7280", borderRadius: 8 }} />
      <div style={{ position: "absolute", left: bx - 30, top: by - 30, width: 60, height: 60, borderRadius: 30, background: "#ff8fa3", boxShadow: "0 0 30px rgba(255,143,163,0.5)" }} />
      <Boy x={80} y={980} arm={hit ? -10 : 20} scale={0.9} />
      {/* sound waves returning */}
      {!hit && [0, 1, 2].map((i) => (
        <div key={i} style={{ position: "absolute", left: wallX - 60 - i * 50 - (t - 0.5) * 200, top: 870 - i * 20, width: 20, height: 80 + i * 40, border: "4px solid rgba(127,212,255,0.35)", borderColor: "rgba(127,212,255,0.35) transparent transparent transparent", borderRadius: 999, transform: "rotate(-90deg)", opacity: ear }} />
      ))}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 500, background: "linear-gradient(transparent, rgba(5,7,13,0.95))" }} />
    </AbsoluteFill>
  );
};

const SceneConseq: React.FC = () => {
  const f = useCurrentFrame();
  const pulse = interpolate(Math.sin(f * 0.12), [-1, 1], [0.8, 1]);
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg,#0f1724,#1a2740)" }}>
      <div style={{ position: "absolute", left: 340, top: 500, width: 400, height: 400, borderRadius: 200, background: `radial-gradient(circle, rgba(127,212,255,${0.25 * pulse}), transparent 70%)` }} />
      {/* ear/listening focus */}
      <div style={{ position: "absolute", left: 470, top: 620, width: 140, height: 200, border: "14px solid #f2c9a0", borderColor: "#f2c9a0 #f2c9a0 #f2c9a0 transparent", borderRadius: "80px 80px 80px 80px", transform: "rotate(10deg)" }} />
      <Broom x={420} y={1100} rot={-10} scale={0.7} />
      {Array.from({ length: 10 }).map((_, i) => (
        <Note key={i} x={150 + (i * 83) % 780} y={300 + (i * 137) % 900} size={28} color="rgba(127,212,255,0.6)" o={0.4 + 0.3 * Math.sin(f * 0.1 + i)} />
      ))}
    </AbsoluteFill>
  );
};

const SceneCallback: React.FC = () => {
  const f = useCurrentFrame();
  const rise = interpolate(f, [0, 120], [80, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const glow = interpolate(Math.sin(f * 0.18), [-1, 1], [0.4, 0.9]);
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg,#120a1e,#2b1055 50%,#7597de)" }}>
      <div style={{ position: "absolute", left: 540 - 400, top: 400, width: 800, height: 800, borderRadius: 400, background: `radial-gradient(circle, rgba(255,216,107,${glow}), transparent 70%)` }} />
      {/* stage */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 250, height: 200, background: "#2a1a12" }} />
      <div style={{ position: "absolute", left: 420, top: 720 + rise }}>
        <Boy x={0} y={120} arm={Math.sin(f * 0.7) * 25} scale={1.2} />
        <Guitar x={-40} y={20} scale={1.0} color="#e05a3a" />
      </div>
      {Array.from({ length: 12 }).map((_, i) => (
        <Note key={i} x={100 + (i * 90) % 880} y={250 + ((f * 2 + i * 60) % 500)} color={["#ffd86b", "#ff8fa3", "#7fd4ff", "#7CFF8A"][i % 4]} size={30 + (i % 4) * 8} o={1 - ((f * 2 + i * 60) % 500) / 500} />
      ))}
    </AbsoluteFill>
  );
};

const pickScene = (id: string) => {
  switch (id) {
    case "hook": return <SceneHook />;
    case "setting": return <SceneSetting />;
    case "broom": return <SceneBroom />;
    case "listen": return <SceneListen />;
    case "guitar5": return <SceneGuitar5 />;
    case "practice": return <ScenePractice />;
    case "snap": return <SceneSnap />;
    case "luck1": return <SceneLuck />;
    case "luck2": return <SceneLuck flip />;
    case "analogy":
    case "analogy2": return <SceneAnalogy />;
    case "conseq": return <SceneConseq />;
    case "callback": return <SceneCallback />;
    default: return <AbsoluteFill style={{ background: "#111" }} />;
  }
};

export const JimiShort: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0b1020" }}>
      {SEGS.map((s) => (
        <Fade key={s.id} from={s.from} dur={s.dur} >
          {pickScene(s.id)}
        </Fade>
      ))}
      <Audio src={staticFile("jimi/voice.wav")} />
    </AbsoluteFill>
  );
};

