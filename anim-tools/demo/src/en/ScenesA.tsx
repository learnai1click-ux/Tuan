import React from "react";
import { AbsoluteFill, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, sec } from "../theme";
import { Monster } from "../components/Monster";
import { Clock, Desk, Floor, Glow, Window } from "../components/common";
import { animate, FACES, Sam } from "./Sam";
import { anton, Cam, cl, Clip, DayTag, easeOut, Emote, SpeedLines, Vig, Whip } from "./fx";

const Phone: React.FC<{ glow?: number }> = ({ glow = 1 }) => (
  <g transform="translate(-34 -78)">
    <rect width={68} height={118} rx={12} fill="#141320" stroke={C.line} strokeWidth={4} />
    <rect x={7} y={10} width={54} height={98} rx={6} fill={C.blue} opacity={0.3 + 0.7 * glow} />
  </g>
);

const Whisper: React.FC<{ text: string; x: number; y: number; at?: number; size?: number }> = ({ text, x, y, at = 6, size = 60 }) => {
  const f = useCurrentFrame() - at;
  const jit = f > 0 ? Math.sin(f * 2.7) * 2 : 0;
  return (
    <div style={{ position: "absolute", zIndex: 5, left: x, top: y, width: 760, textAlign: "center", fontFamily: anton, fontSize: size, color: C.red, opacity: interpolate(f, [0, 5], [0, 1], cl), translate: `${jit}px 0`, textShadow: "0 0 22px rgba(255,60,90,.7)", letterSpacing: 1 }}>
      {text}
    </div>
  );
};

const MonsterAt: React.FC<{ x: number; y: number; size: number; at?: number }> = ({ x, y, size, at = 0 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - at, fps, config: { damping: 10, stiffness: 200 } });
  return (
    <div style={{ position: "absolute", left: x, top: y + (1 - s) * 80, opacity: s, scale: String(0.6 + 0.4 * s) }}>
      <Monster size={size} t={f} grin={0.5 + 0.35 * Math.sin(f / 4)} />
    </div>
  );
};

// ── 0-7s: báo thức, đập nút báo lại, trùm chăn, giật mình 8:47 ─────────────
export const SceneAlarm: React.FC = () => {
  const f = useCurrentFrame();
  const ring = f < 40 || (f >= 180 && f < 196);
  const slam = 40;
  const { pose, face } = animate(f, [
    { f: 0, p: { lean: 6, head: 14, rArm: [6, -8], lArm: [10, 20] }, face: "sleep" },
    { f: 26, p: { lean: 4, head: 10, rArm: [6, -8], lArm: [-115, -30] }, face: "tired" },
    { f: slam, p: { lean: 10, head: 16, rArm: [6, -8], lArm: [-62, -6] }, face: { ...FACES.tired, brow: -0.6 } },
    { f: 70, p: { lean: 6, head: 14, rArm: [6, -8], lArm: [10, 20] }, face: "sleep", ease: "smooth" },
    { f: 176, p: { lean: 6, head: 14, rArm: [6, -8], lArm: [10, 20] }, face: "sleep" },
    { f: 186, p: { lean: -4, head: -6, y: -40, rArm: [-60, -30], lArm: [60, 30], sy: 1.06 }, face: "shock" },
    { f: 210, p: { lean: -2, head: -4, y: -30, rArm: [-50, -20], lArm: [50, 20] }, face: "shock" },
  ]);
  const blanket = interpolate(f, [112, 128, 178, 186], [0, 1, 1, 0], { ...cl, easing: easeOut });
  const clockSquash = f >= slam && f < slam + 8 ? 0.78 : 1;
  const time = f < 150 ? "5:00" : f < 178 ? ["5:47", "6:31", "7:12", "7:58", "8:20", "8:39"][Math.floor((f - 150) / 5) % 6] : "8:47";
  const day = interpolate(f, [150, 180], [0, 1], cl);
  return (
    <Cam zoom={[[0, 1.02], [180, 1.08], [186, 1.16], [210, 1.12]]} shake={[[0, 0], [slam - 1, 0], [slam, 14], [slam + 8, 0], [185, 0], [186, 10], [196, 0]]}>
      <AbsoluteFill style={{ background: `linear-gradient(${C.bg}, ${day > 0 ? "#1c2030" : C.bg})` }}>
        <Window x={240} y={330} moon={day < 0.5} dawn={day > 0.5} />
        {day > 0 && <Glow x={330} y={430} r={420} color={`rgba(255,200,120,${0.25 * day})`} />}
        <Floor y={880} />
        <div style={{ position: "absolute", left: 560, top: 420, width: 800, height: 300, borderRadius: "28px 28px 0 0", background: "#1d1b25", border: `4px solid ${C.line}` }} />
        <div style={{ position: "absolute", left: 640, top: 300 }}>
          <Sam pose={pose} face={face} hideLegs width={420} />
        </div>
        <div style={{ position: "absolute", left: 520, top: 690 - blanket * 170, width: 880, height: 200 + blanket * 170, borderRadius: "60px 60px 10px 10px", background: "linear-gradient(#3b4a7a,#2b365c)", border: `4px solid ${C.line}` }} />
        <div style={{ position: "absolute", left: 1400, top: 690, width: 220, height: 190, borderRadius: 12, background: "#1d1b25", border: `4px solid ${C.line}` }} />
        <div style={{ position: "absolute", left: 0, top: 0, scale: `1 ${clockSquash}`, transformOrigin: "1510px 690px", translate: ring ? `${Math.sin(f * 2.2) * 6}px 0` : "0 0" }}>
          <Clock x={1425} y={600} time={time} />
          {ring && [0, 1].map((i) => <div key={i} style={{ position: "absolute", left: i ? 1610 : 1385, top: 590, fontFamily: anton, fontSize: 44, color: C.red, rotate: i ? "20deg" : "-20deg" }}>{"///"}</div>)}
        </div>
        {f < 26 && <Emote kind="zzz" x={930} y={330} />}
        {f >= 70 && f < 112 && <Emote kind="zzz" x={930} y={330} at={70} />}
        <Emote kind="anger" x={980} y={300} at={slam} size={f > slam + 26 ? 0 : 1} />
        {f >= 186 && <Emote kind="!" x={1000} y={170} at={186} />}
        {f >= 188 && <Emote kind="sweat" x={1040} y={330} at={188} />}
        <Vig />
      </AbsoluteFill>
    </Cam>
  );
};

// ── 7-15s: viện cớ, 5 cú cắt nhanh ───────────────────────────────────────
const DeskBase: React.FC<{ children: React.ReactNode; screen?: string; lit?: number; text?: string }> = ({ children, screen = "#6b7280", lit = 0.35, text }) => (
  <AbsoluteFill style={{ background: C.bg }}>
    <Floor y={880} />
    <Glow x={940} y={420} r={360} color="rgba(94,168,255,.18)" />
    {children}
    <Desk x={580} y={700} screen={screen} lit={lit} screenText={text} />
  </AbsoluteFill>
);

const ShotYawn: React.FC = () => {
  const f = useCurrentFrame();
  const { pose, face } = animate(f, [
    { f: 0, p: { rArm: [-20, -40], lArm: [20, 40] }, face: "tired" },
    { f: 10, p: { lean: -4, head: -10, rArm: [140, 30], lArm: [-140, -30], sy: 1.05 }, face: "yawn", ease: "smooth" },
    { f: 36, p: { lean: -4, head: -8, rArm: [150, 20], lArm: [-150, -20], sy: 1.05 }, face: "yawn" },
    { f: 48, p: { rArm: [-20, -40], lArm: [20, 40] }, face: "tired", ease: "smooth" },
  ]);
  return (
    <DeskBase text="workout_plan.pdf">
      <div style={{ position: "absolute", left: 740, top: 150 }}><Sam pose={pose} face={face} hideLegs width={440} /></div>
      <MonsterAt x={1290} y={360} size={200} at={8} />
      <Whisper text="Just one more video." x={1020} y={210} at={10} />
    </DeskBase>
  );
};

const ShotScroll: React.FC = () => {
  const f = useCurrentFrame();
  const flick = 0.8 + 0.2 * Math.sin(f / 2.3);
  return (
    <DeskBase>
      <Glow x={980} y={330} r={260} color={`rgba(94,168,255,${0.35 * flick})`} />
      <div style={{ position: "absolute", left: 740, top: 150 + Math.sin(f / 9) * 3 }}>
        <Sam pose={{ lean: 3, head: 8, rArm: [-30, -50], lArm: [58, 100] }} face={{ ...FACES.bored, look: 10, lookY: 6 }} blink={f % 30 > 27} hideLegs width={440} handProp={<Phone glow={flick} />} />
      </div>
      {Array.from({ length: 4 }).map((_, i) => {
        const t = (f + i * 12) % 48;
        return <div key={i} style={{ position: "absolute", left: 1030 + i * 20, top: 420 - t * 4, fontSize: 40, color: i % 2 ? C.red : C.blue, opacity: interpolate(t, [0, 8, 40, 48], [0, 1, 0.6, 0]) }}>{i % 2 ? "♥" : "▶"}</div>;
      })}
      <MonsterAt x={1320} y={360} size={230} at={6} />
      <Whisper text="You're too tired." x={1060} y={210} at={8} />
    </DeskBase>
  );
};

const ShotShrug: React.FC = () => {
  const f = useCurrentFrame();
  const { pose, face } = animate(f, [
    { f: 0, p: { rArm: [-20, -40], lArm: [20, 40] }, face: "bored" },
    { f: 8, p: { head: 10, rArm: [-70, 110], lArm: [70, -110], y: -8 }, face: { ...FACES.smirk, brow: 0.6, browY: 10 } },
    { f: 30, p: { head: 8, rArm: [-66, 106], lArm: [66, -106], y: -6 }, face: { ...FACES.smirk, brow: 0.6, browY: 10 } },
    { f: 44, p: { rArm: [-20, -40], lArm: [20, 40] }, face: "bored", ease: "smooth" },
  ]);
  return (
    <DeskBase>
      <div style={{ position: "absolute", left: 740, top: 150 }}><Sam pose={pose} face={face} hideLegs width={440} /></div>
      <Emote kind="?" x={1110} y={150} at={10} size={0.8} />
      <MonsterAt x={1320} y={340} size={260} at={4} />
      <Whisper text="Start on Monday." x={1060} y={200} at={6} />
    </DeskBase>
  );
};

const ShotTrudge: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#0e0e14" }}>
      {Array.from({ length: 12 }).map((_, i) => {
        const x = 2000 - ((f * (22 + (i % 4) * 6) + i * 260) % 2400);
        return (
          <div key={i} style={{ position: "absolute", left: x, top: 120 + ((i * 137) % 560), width: 120, height: 140, borderRadius: 10, background: "#1c1a24", border: `3px solid ${C.line}`, rotate: `${(i % 5) * 9 - 18 + f * 2}deg`, fontFamily: anton, color: C.dim, fontSize: 54, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {120 + i * 11}
          </div>
        );
      })}
      <Floor y={860} />
      <Clip name="sadwalk" frames={150} speed={1.6} style={{ left: 600, top: 860 - 760 * 0.86, width: 760, height: 760 }} />
      <MonsterAt x={1300} y={420} size={170} at={2} />
    </AbsoluteFill>
  );
};

const ShotFacepalm: React.FC = () => {
  const f = useCurrentFrame();
  const { pose, face } = animate(f, [
    { f: 0, p: { rArm: [-20, -40], lArm: [20, 40] }, face: "tired" },
    { f: 10, p: { lean: 8, head: 14, rArm: [-14, 150], lArm: [24, 50] }, face: { ...FACES.sad, eye: 0 } },
    { f: 48, p: { lean: 12, head: 18, rArm: [-10, 152], lArm: [26, 52] }, face: { ...FACES.sad, eye: 0 } },
  ]);
  return (
    <DeskBase lit={0.15}>
      <div style={{ position: "absolute", left: 120, top: 120, fontFamily: anton, fontSize: 420, color: "#1d1b27", lineHeight: 1 }}>365</div>
      <div style={{ position: "absolute", left: 740, top: 150 }}><Sam pose={pose} face={face} hideLegs width={440} /></div>
      <MonsterAt x={1220} y={140} size={420} at={2} />
      <Whisper text="Everyone's ahead of you." x={1060} y={760} at={6} size={64} />
    </DeskBase>
  );
};

export const SceneExcuses: React.FC = () => {
  const S = sec(1.6);
  const shots: [number, React.ReactNode][] = [[1, <ShotYawn key="a" />], [37, <ShotScroll key="b" />], [112, <ShotShrug key="c" />], [240, <ShotTrudge key="d" />], [365, <ShotFacepalm key="e" />]];
  return (
    <>
      {shots.map(([d, node], i) => (
        <Sequence key={i} from={i * S} durationInFrames={i === shots.length - 1 ? sec(8) - i * S : S}>
          <Whip dir={i % 2 ? -1 : 1}>{node}</Whip>
          <Vig />
          <DayTag day={d} color={i === shots.length - 1 ? C.red : C.dim} />
        </Sequence>
      ))}
    </>
  );
};

// ── 15-22s: chạm đáy, khóc rồi ngẩng lên ─────────────────────────────────
export const SceneBottom: React.FC = () => {
  const f = useCurrentFrame();
  const lift = sec(5.5); // 20.5s
  const sob = f < lift ? Math.abs(Math.sin(f / 5)) * 8 : 0;
  const { pose, face } = animate(f, [
    { f: 0, p: { head: 14, rArm: [-48, -62], lArm: [48, 62] }, face: "cry" },
    { f: lift, p: { head: 14, rArm: [-48, -62], lArm: [48, 62] }, face: "cry" },
    { f: lift + 14, p: { head: -2, rArm: [-46, -66], lArm: [46, 66], y: -6 }, face: { ...FACES.sad, tears: 0.4, brow: 0.2 }, ease: "smooth" },
    { f: lift + 34, p: { head: 0, rArm: [-46, -70], lArm: [46, 70], y: -10 }, face: { ...FACES.grit, tears: 0.3 } },
  ]);
  return (
    <Cam zoom={[[0, 1], [sec(4), 1.08], [lift + 10, 1.2], [sec(7), 1.55]]} origin="50% 52%">
      <AbsoluteFill style={{ background: "#07070b" }}>
        <div style={{ position: "absolute", left: 660, top: -100, width: 600, height: 1100, background: "linear-gradient(rgba(255,255,255,.17), rgba(255,255,255,.03))", clipPath: "polygon(40% 0, 60% 0, 100% 100%, 0 100%)" }} />
        <div style={{ position: "absolute", left: 660, top: 860, width: 600, height: 60, borderRadius: "50%", background: "radial-gradient(rgba(255,255,255,.18), rgba(0,0,0,0) 70%)" }} />
        {Array.from({ length: 18 }).map((_, i) => (
          <div key={i} style={{ position: "absolute", left: 760 + ((i * 97) % 400), top: 100 + ((i * 173 + f * (0.6 + (i % 3) * 0.3)) % 760), width: 4, height: 4, borderRadius: 2, background: "#fff", opacity: 0.25 }} />
        ))}
        <div style={{ position: "absolute", left: 780, top: 470 + sob }}>
          <Sam pose={pose} face={face} hideLegs width={360}>
            <ellipse cx={205} cy={470} rx={58} ry={72} fill={C.body} stroke={C.line} strokeWidth={5} />
            <ellipse cx={295} cy={470} rx={58} ry={72} fill={C.body} stroke={C.line} strokeWidth={5} />
            <ellipse cx={185} cy={560} rx={44} ry={24} fill={C.body} stroke={C.line} strokeWidth={5} />
            <ellipse cx={315} cy={560} rx={44} ry={24} fill={C.body} stroke={C.line} strokeWidth={5} />
          </Sam>
        </div>
        {f > lift + 30 && <Emote kind="steam" x={1060} y={470} at={lift + 30} />}
        <Vig s={0.88} />
      </AbsoluteFill>
    </Cam>
  );
};

// ── 22-27s: báo thức lần nữa, mắt mở bừng, hất văng quái vật, đứng dậy ───
export const SceneDecision: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <>
      <Sequence durationInFrames={30}>
        <Cam zoom={[[0, 1.25], [30, 1.4]]} shake={[[0, 8], [30, 8]]}>
          <AbsoluteFill style={{ background: "#08080c", alignItems: "center", justifyContent: "center" }}>
            <div style={{ scale: "3.2", translate: `${Math.sin(f * 2.3) * 3}px 0` }}><Clock x={-85} y={-42} time="5:00" /></div>
            <SpeedLines color={C.red} opacity={0.35} />
          </AbsoluteFill>
        </Cam>
      </Sequence>
      <Sequence from={30} durationInFrames={24}>
        <EyesOpen />
      </Sequence>
      <Sequence from={54} durationInFrames={18}>
        <Swat />
      </Sequence>
      <Sequence from={72} durationInFrames={78}>
        <Rise />
      </Sequence>
    </>
  );
};

const EyesOpen: React.FC = () => {
  const f = useCurrentFrame();
  const face = f < 6 ? FACES.sleep : f < 12 ? FACES.shock : FACES.grit;
  return (
    <Cam zoom={[[0, 2.3], [8, 2.7], [24, 2.8]]} origin="50% 47%" shake={[[0, 0], [6, 0], [7, 16], [14, 0]]}>
      <AbsoluteFill style={{ background: "#0b0b10" }}>
        <Glow x={960} y={500} r={500} color="rgba(255,138,61,.25)" />
        <div style={{ position: "absolute", left: 750, top: 372 }}><Sam face={face} hideLegs width={420} /></div>
        {f >= 6 && <SpeedLines opacity={0.4} cx={960} cy={510} />}
      </AbsoluteFill>
    </Cam>
  );
};

const Swat: React.FC = () => {
  const f = useCurrentFrame();
  const { pose, face } = animate(f, [
    { f: 0, p: { rArm: [80, -40], lArm: [20, 30], lean: -6 }, face: "grit" },
    { f: 6, p: { rArm: [-120, -10], lArm: [30, 40], lean: 8, head: -6 }, face: "shout" },
    { f: 18, p: { rArm: [-110, -6], lArm: [30, 40], lean: 6 }, face: "shout" },
  ]);
  const hit = 6;
  const fly = Math.max(0, f - hit);
  return (
    <Cam shake={[[0, 0], [hit, 0], [hit + 1, 22], [hit + 10, 0]]}>
      <AbsoluteFill style={{ background: C.bg }}>
        <Floor y={880} />
        <div style={{ position: "absolute", left: 720, top: 300 }}><Sam pose={pose} face={face} scarf fists width={420} /></div>
        <div style={{ position: "absolute", left: 520 - fly * 90, top: 420 - fly * 30 + fly * fly * 1.2, rotate: `${-fly * 40}deg` }}>
          <Monster size={200} t={f} grin={fly > 0 ? 0.1 : 0.6} glow={fly > 0 ? 0.3 : 1} />
        </div>
        {f >= hit && f < hit + 5 && (
          <svg style={{ position: "absolute", left: 470, top: 360 }} width={220} height={220} viewBox="-110 -110 220 220">
            <path d="M0 -100 L22 -30 L95 -30 L36 12 L58 85 L0 40 L-58 85 L-36 12 L-95 -30 L-22 -30 Z" fill={C.gold} />
          </svg>
        )}
        {f >= hit && <SpeedLines mode="h" opacity={0.25} />}
        <Vig />
      </AbsoluteFill>
    </Cam>
  );
};

const Rise: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <Cam zoom={[[0, 1.0], [70, 1.18], [78, 1.3]]} origin="50% 70%" shake={[[0, 0], [60, 0], [78, 14]]}>
      <AbsoluteFill style={{ background: "linear-gradient(#0b0b12, #1a1424)" }}>
        <Glow x={960} y={760} r={600} color="rgba(255,138,61,.22)" />
        <Floor y={900} />
        <Clip name="getup_grit" frames={155} offset={40} speed={1.3} trail={1} style={{ left: 960 - 450, top: 900 - 900 * 0.86, width: 900, height: 900 }} />
        <SpeedLines opacity={interpolate(f, [50, 78], [0, 0.55], cl)} cx={960} cy={560} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 40, textAlign: "center", fontFamily: anton, fontSize: 40, color: C.dim, letterSpacing: 8, opacity: interpolate(f, [10, 20], [0, 1], cl) }}>5:01 AM</div>
        <Vig />
      </AbsoluteFill>
    </Cam>
  );
};
