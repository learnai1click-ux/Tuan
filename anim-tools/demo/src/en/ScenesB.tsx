import React from "react";
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from "remotion";
import { C } from "../theme";
import { Monster } from "../components/Monster";
import { Desk, Floor, Glow } from "../components/common";
import { animate, FACES, Sam } from "./Sam";
import { anton, Cam, cl, Clip, DayTag, Emote, Flash, Rain, SpeedLines, Vig, Whip } from "./fx";

// Montage 27-47s. Mỗi phần tử: [frame bắt đầu (trong montage), số frame, ngày, cảnh].
const Street: React.FC<{ sky: string; speed?: number; children: React.ReactNode; wet?: boolean }> = ({ sky, speed = 30, children, wet }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: sky }}>
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} style={{ position: "absolute", left: ((i * 260 - f * speed * 0.35) % 2600 + 2600) % 2600 - 300, bottom: 220, width: 170 + (i % 3) * 30, height: 220 + ((i * 53) % 200), background: "#120f1c", borderRadius: "10px 10px 0 0" }} />
      ))}
      {Array.from({ length: 4 }).map((_, i) => {
        const x = ((i * 600 - f * speed) % 2400 + 2400) % 2400 - 200;
        return (
          <React.Fragment key={i}>
            <div style={{ position: "absolute", left: x, bottom: 222, width: 8, height: 330, background: "#2a2833" }} />
            <Glow x={x + 4} y={1080 - 560} r={90} color="rgba(255,200,110,.5)" />
          </React.Fragment>
        );
      })}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 222, background: wet ? "linear-gradient(#16182a,#0b0c14)" : "#0d0b14" }} />
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} style={{ position: "absolute", left: ((i * 300 - f * speed) % 2400 + 2400) % 2400 - 200, bottom: 110, width: 120, height: 8, borderRadius: 4, background: "#2a2833" }} />
      ))}
      {children}
    </AbsoluteFill>
  );
};

const Runner: React.FC<{ trail?: number }> = ({ trail = 2 }) => (
  <Clip name="run" frames={36} loop speed={1} trail={trail} style={{ left: 960 - 380, top: 1080 - 222 - 760 * 0.86, width: 760, height: 760 }} />
);

const RunNight: React.FC = () => (
  <Cam zoom={[[0, 1.12], [60, 1.0]]}>
    <Street sky="linear-gradient(#07070d,#141225)" speed={36}>
      <Runner />
      <SpeedLines mode="h" opacity={0.18} />
      <div style={{ position: "absolute", right: 90, top: 70, fontFamily: anton, fontSize: 46, color: C.dim, letterSpacing: 6 }}>5:12 AM</div>
    </Street>
  </Cam>
);

const ClipShot: React.FC<{ name: string; frames: number; speed?: number; bg?: string; children?: React.ReactNode; size?: number; x?: number; offset?: number }> = ({ name, frames, speed = 1, bg = C.bg, children, size = 780, x = 960, offset = 0 }) => (
  <AbsoluteFill style={{ background: bg }}>
    <Floor y={870} />
    <Glow x={x} y={560} r={460} color="rgba(255,138,61,.18)" />
    {children}
    <Clip name={name} frames={frames} speed={speed} offset={offset} trail={1} style={{ left: x - size / 2, top: 870 - size * 0.86, width: size, height: size }} />
  </AbsoluteFill>
);

const TypingFast: React.FC<{ late?: boolean }> = ({ late }) => {
  const f = useCurrentFrame();
  const a = Math.sin(f * 1.6) * 12, b = Math.sin(f * 1.6 + 1.7) * 12;
  return (
    <AbsoluteFill style={{ background: late ? "#06060a" : C.bg }}>
      <Floor y={880} />
      <Glow x={960} y={460} r={440} color={late ? "rgba(94,168,255,.22)" : "rgba(255,138,61,.3)"} />
      {late && <div style={{ position: "absolute", left: 170, top: 150, fontFamily: "monospace", fontSize: 64, color: C.red, textShadow: `0 0 14px ${C.red}` }}>23:58</div>}
      <div style={{ position: "absolute", left: 740, top: 150 + Math.abs(Math.sin(f * 0.5)) * 5 }}>
        <Sam pose={{ head: Math.sin(f / 6) * 3, rArm: [-28, -60 + a], lArm: [28, 60 + b] }} face={late ? { ...FACES.focus, eye: 0.7, sweat: 0.6 } : "grit"} scarf blink={f % 50 > 47} hideLegs width={440} />
      </div>
      <Desk x={580} y={700} screen={late ? C.blue : C.orange} lit={1} />
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} style={{ position: "absolute", left: 1230, top: 640 - i * 34, width: 210, height: 30, borderRadius: 4, background: [C.orange, C.blue, C.green, C.gold, C.purple][i], opacity: interpolate(f, [i * 5, i * 5 + 3], [0, 1], cl), border: `3px solid ${C.line}` }} />
      ))}
      <div style={{ position: "absolute", left: 1240, top: 230, fontFamily: "monospace", fontSize: 30, color: late ? C.blue : C.orange }}>
        {["> chapter 3 ✓", "> 50 squats ✓", "> project v0.2 ✓"].map((l, i) => <div key={i} style={{ opacity: f > i * 10 ? 1 : 0, marginBottom: 10 }}>{l}</div>)}
      </div>
    </AbsoluteFill>
  );
};

const PageFlip: React.FC = () => {
  const f = useCurrentFrame();
  const k = interpolate(f, [4, 22], [0, 180], cl);
  return (
    <Cam zoom={[[0, 1.15], [33, 1.0]]}>
      <AbsoluteFill style={{ background: "#0d0c12", perspective: 1400 }}>
        <Glow x={960} y={540} r={560} color="rgba(255,200,120,.2)" />
        <div style={{ position: "absolute", left: 460, top: 300, width: 1000, height: 560, borderRadius: 18, background: "#2a2430" }} />
        <div style={{ position: "absolute", left: 480, top: 320, width: 480, height: 520, background: "#efe8da", borderRadius: "12px 0 0 12px" }} />
        <div style={{ position: "absolute", left: 960, top: 320, width: 480, height: 520, background: "#f4eee2", borderRadius: "0 12px 12px 0" }} />
        <div style={{ position: "absolute", left: 960, top: 320, width: 480, height: 520, background: "#fbf7ef", borderRadius: "0 12px 12px 0", transformOrigin: "left center", rotate: `y ${-k}deg`, boxShadow: "0 0 40px rgba(0,0,0,.25)" }} />
        {[0, 1, 2, 3, 4, 5, 6].map((i) => <div key={i} style={{ position: "absolute", left: 530, top: 380 + i * 60, width: 360 - (i % 3) * 50, height: 10, borderRadius: 5, background: "#c9bfae" }} />)}
        <div style={{ position: "absolute", right: 120, top: 90, fontFamily: anton, fontSize: 80, color: C.gold }}>PAGE 142</div>
      </AbsoluteFill>
    </Cam>
  );
};

const RunDawn: React.FC<{ mile?: boolean; strong?: boolean }> = ({ mile, strong }) => {
  const f = useCurrentFrame();
  return (
    <Cam zoom={strong ? [[0, 1.0], [60, 1.12]] : [[0, 1.08], [45, 1.0]]}>
      <Street sky="linear-gradient(#1a1530 0%, #47284f 55%, #d0683f 100%)" speed={strong ? 52 : 40}>
        <Glow x={1500} y={780} r={480} color="rgba(255,190,110,.5)" />
        <Runner trail={strong ? 3 : 2} />
        <SpeedLines mode="h" opacity={strong ? 0.35 : 0.2} />
        {mile && (
          <div style={{ position: "absolute", right: 110, top: 80, fontFamily: anton, fontSize: 88, color: C.text }}>
            {interpolate(f, [0, 40], [0, 1], cl).toFixed(2)} <span style={{ color: C.orange }}>MI</span>
          </div>
        )}
      </Street>
    </Cam>
  );
};

const RunRain: React.FC = () => {
  return (
    <Cam shake={[[0, 0], [30, 0], [31, 12], [40, 0]]}>
      <Street sky="linear-gradient(#05060c,#121527)" speed={34} wet>
        <Runner />
        <Rain />
        <Emote kind="sweat" x={1010} y={300} at={12} />
        <Flash at={30} dur={8} color="#c8d4ff" peak={0.7} />
      </Street>
    </Cam>
  );
};

const PunchMonster: React.FC = () => {
  const f = useCurrentFrame();
  const hit = 16;
  const { pose, face } = animate(f, [
    { f: 0, p: { rArm: [10, 120], lArm: [-10, -120], lean: 4 }, face: "grit" },
    { f: 10, p: { rArm: [-10, 130], lArm: [-20, -130], lean: 10, x: 20 }, face: "grit" },
    { f: hit, p: { rArm: [62, 4], lArm: [-30, -120], lean: -12, x: -50 }, face: "shout" },
    { f: 42, p: { rArm: [56, 10], lArm: [-30, -120], lean: -8, x: -40 }, face: "shout" },
  ]);
  const fly = Math.max(0, f - hit);
  return (
    <Cam shake={[[0, 0], [hit, 0], [hit + 1, 26], [hit + 12, 0]]} zoom={[[0, 1], [hit, 1.05], [hit + 2, 1.15], [42, 1.08]]}>
      <AbsoluteFill style={{ background: C.bg }}>
        <Floor y={880} />
        <div style={{ position: "absolute", left: 520 - fly * 70, top: 330 - fly * 24 + fly * fly * 0.9, rotate: `${-fly * 30}deg` }}>
          <Monster size={240} t={f} grin={fly ? 0 : 0.8} glow={fly ? 0.4 : 1} />
        </div>
        {f < hit && <div style={{ position: "absolute", left: 340, top: 300, width: 560, textAlign: "center", fontFamily: anton, fontSize: 96, color: C.red, textShadow: "0 0 22px rgba(255,60,90,.7)" }}>QUIT.</div>}
        <div style={{ position: "absolute", left: 820, top: 300 }}><Sam pose={pose} face={face} scarf fists width={420} wind={0.5} /></div>
        {f >= hit && f < hit + 6 && (
          <svg style={{ position: "absolute", left: 560, top: 380 }} width={260} height={260} viewBox="-130 -130 260 260">
            <path d="M0 -120 L26 -36 L114 -36 L44 14 L70 102 L0 48 L-70 102 L-44 14 L-114 -36 L-26 -36 Z" fill={C.gold} />
          </svg>
        )}
        {f >= hit && <SpeedLines opacity={0.35} cx={700} cy={500} />}
        <Flash at={hit} dur={4} peak={0.5} />
        <Vig />
      </AbsoluteFill>
    </Cam>
  );
};

// 44-47s: chớp lại các cảnh, đếm ngày tăng vọt, rồi dáng siêu anh hùng.
const Recap: React.FC = () => {
  const f = useCurrentFrame();
  const day = Math.round(interpolate(f, [0, 45], [66, 100], cl));
  const flashes = ["lift", "jj", "kick", "run", "celebrate", "lift"];
  return (
    <AbsoluteFill style={{ background: "#09080e" }}>
      {f < 45 ? (
        <>
          <Clip name={flashes[Math.floor(f / 8) % flashes.length]} frames={30} offset={(f * 3) % 30} loop style={{ left: 960 - 400, top: 870 - 800 * 0.86, width: 800, height: 800, filter: "contrast(1.2)" }} />
          <SpeedLines opacity={0.45} />
          <div style={{ position: "absolute", left: 80, top: 60, fontFamily: anton, fontSize: 120, color: C.orange }}>DAY {day}</div>
        </>
      ) : (
        <Cam zoom={[[45, 1.15], [90, 1.0]]}>
          <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 60%, #3a2216, #0a0910 70%)" }}>
            <Floor y={870} />
            <Clip name="hero" frames={100} speed={1.6} style={{ left: 960 - 420, top: 870 - 840 * 0.86, width: 840, height: 840 }} />
            <Emote kind="sparkle" x={1180} y={240} at={52} />
            <Emote kind="sparkle" x={700} y={330} at={58} size={0.6} />
          </AbsoluteFill>
        </Cam>
      )}
      <Flash at={45} dur={8} />
    </AbsoluteFill>
  );
};

export const SHOTS: [number, number, number | null, React.ReactNode][] = [
  [0, 60, 1, <RunNight key="1" />],
  [60, 30, 3, <ClipShot key="2" name="jj" frames={64} speed={1.3} bg="linear-gradient(#1a1530,#47284f)" />],
  [90, 42, 6, <TypingFast key="3" />],
  [132, 30, 9, <ClipShot key="4" name="kick" frames={52} speed={1.2} />],
  [162, 36, 12, <ClipShot key="5" name="lift" frames={90} speed={1.6} offset={10} />],
  [198, 33, 15, <PageFlip key="6" />],
  [231, 45, 21, <RunDawn key="7" mile />],
  [276, 72, 30, <RunRain key="8" />],
  [348, 42, 38, <PunchMonster key="9" />],
  [390, 60, 51, <TypingFast key="10" late />],
  [450, 60, 66, <RunDawn key="11" strong />],
  [510, 90, null, <Recap key="12" />],
];

export const Montage: React.FC = () => (
  <>
    {SHOTS.map(([from, dur, day, node], i) => (
      <Sequence key={i} from={from} durationInFrames={dur}>
        <Whip dir={i % 2 ? -1 : 1} dur={5}>{node}</Whip>
        <Vig s={0.6} />
        {day !== null && <DayTag day={day} />}
      </Sequence>
    ))}
  </>
);
