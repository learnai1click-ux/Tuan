import React from "react";
import { AbsoluteFill, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, hand, sec } from "../theme";
import { Sang } from "../components/Sang";
import { Monster } from "../components/Monster";
import { clamp, Clock, DayCounter, Desk, ease, Floor, Glow, Vignette, Window } from "../components/common";

// Điện thoại nhỏ trên tay Sáng (toạ độ của con rối, cầm ở tay phải màn hình).
const Phone: React.FC<{ on?: number }> = ({ on = 1 }) => (
  <g transform="translate(-34 -78)">
    <rect width={68} height={118} rx={12} fill="#141320" stroke={C.line} strokeWidth={4} />
    <rect x={7} y={10} width={54} height={98} rx={6} fill={C.blue} opacity={0.25 + 0.75 * on} />
  </g>
);

// Sáng ngồi trên giường đắp chăn, tay cầm điện thoại.
const BedShot: React.FC<{ clock: string; mood?: "tired" | "sad"; monster?: number; whisper?: string; head?: number }> = ({
  clock, mood = "tired", monster = 0, whisper, head = 0,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const zoom = interpolate(f, [0, 8 * fps], [1, 1.08], clamp);
  const flick = 0.85 + 0.15 * Math.sin(f / 3) * Math.sin(f / 7);
  const m = spring({ frame: f - 20, fps, config: { damping: 14 } }) * monster;
  return (
    <AbsoluteFill style={{ background: C.bg, scale: String(zoom) }}>
      <Window x={240} y={140} />
      <Floor y={880} />
      {/* đầu giường + gối */}
      <div style={{ position: "absolute", left: 560, top: 420, width: 800, height: 300, borderRadius: "28px 28px 0 0", background: "#1d1b25", border: `4px solid ${C.line}` }} />
      <div style={{ position: "absolute", left: 640, top: 520, width: 300, height: 110, borderRadius: 50, background: "#3a3848", border: `4px solid ${C.line}` }} />
      <Glow x={870} y={470} r={330} color={`rgba(94,168,255,${0.33 * flick})`} />
      <div style={{ position: "absolute", left: 640, top: 300, width: 420 }}>
        <Sang
          mood={mood}
          hideLegs
          blink={f % 90 > 84}
          pose={{ lean: -4, head: -6 + head, rArm: [8, -10], lArm: [62, 98] }}
          handProp={<Phone on={flick} />}
          style={{ width: 420 }}
        />
      </div>
      {/* chăn */}
      <div style={{ position: "absolute", left: 520, top: 690, width: 880, height: 200, borderRadius: "60px 60px 10px 10px", background: "linear-gradient(#3b4a7a,#2b365c)", border: `4px solid ${C.line}` }} />
      {/* tủ đầu giường + đồng hồ */}
      <div style={{ position: "absolute", left: 300, top: 690, width: 200, height: 190, borderRadius: 12, background: "#1d1b25", border: `4px solid ${C.line}` }} />
      <Clock x={315} y={600} time={clock} />
      {/* tim / like bay lên từ điện thoại */}
      {[0, 1, 2, 3].map((i) => {
        const t = (f + i * 22) % 88;
        return (
          <div key={i} style={{ position: "absolute", left: 980 + i * 18, top: 470 - t * 3, fontSize: 36, color: i % 2 ? C.red : C.blue, opacity: interpolate(t, [0, 10, 70, 88], [0, 0.9, 0.6, 0]), fontFamily: "sans-serif" }}>
            {i % 2 ? "♥" : "▶"}
          </div>
        );
      })}
      {monster > 0 && (
        <div style={{ position: "absolute", left: 1180, top: 330 - m * 40, opacity: m, scale: String(0.5 + 0.5 * m) }}>
          <Monster size={150 + 90 * monster} t={f} grin={0.5 + 0.3 * Math.sin(f / 6)} />
        </div>
      )}
      {whisper && monster > 0 && (
        <div style={{ position: "absolute", left: 1060, top: 150, width: 700, textAlign: "center", fontFamily: hand, fontSize: 56, color: C.red, opacity: interpolate(f, [25, 35], [0, 1], clamp), textShadow: "0 0 18px rgba(255,60,90,.6)" }}>
          {whisper}
        </div>
      )}
      <Vignette />
    </AbsoluteFill>
  );
};

// Gục trên bàn, laptop phủ bụi, quái vật lớn dần.
const DeskShot: React.FC<{ whisper: string; slump: number; monster: number }> = ({ whisper, slump, monster }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const m = spring({ frame: f - 12, fps, config: { damping: 14 } });
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Floor y={880} />
      <Glow x={760} y={420} r={300} color="rgba(94,168,255,.18)" />
      <div style={{ position: "absolute", left: 540, top: 170 + slump * 90, width: 440 }}>
        <Sang mood="tired" hideLegs pose={{ lean: slump * 12, head: 8 + slump * 22, rArm: [-30 - slump * 20, -40], lArm: [30 + slump * 10, 60] }} style={{ width: 440 }} />
      </div>
      <Desk x={380} y={700} screen="#6b7280" lit={0.25} screenText="Bài 1: AI là gì?" />
      <div style={{ position: "absolute", left: 1150, top: 380 - 40 * m, opacity: m }}>
        <Monster size={180 + 120 * monster} t={f} grin={0.7} />
      </div>
      <div style={{ position: "absolute", left: 1040, top: 220, width: 760, textAlign: "center", fontFamily: hand, fontSize: 58, color: C.red, opacity: interpolate(f, [20, 30], [0, 1], clamp), textShadow: "0 0 18px rgba(255,60,90,.6)" }}>
        {whisper}
      </div>
      <Vignette />
    </AbsoluteFill>
  );
};

export const SceneNight: React.FC = () => (
  <BedShot clock="23:47" />
);

export const SceneExcuses: React.FC = () => (
  <>
    <Sequence durationInFrames={sec(2.6)}>
      <BedShot clock="00:31" monster={0.6} whisper="Xem thêm một video thôi..." />
      <DayCounter day={2} />
    </Sequence>
    <Sequence from={sec(2.6)} durationInFrames={sec(2.7)}>
      <DeskShot whisper="Mai học cũng được mà." slump={0.4} monster={0.6} />
      <DayCounter day={19} />
    </Sequence>
    <Sequence from={sec(5.3)} durationInFrames={sec(2.7)}>
      <BedShot clock="01:58" mood="sad" monster={1.2} whisper="Bạn bận lắm." head={6} />
      <DayCounter day={47} color={C.red} />
    </Sequence>
  </>
);

// Ngồi ôm gối dưới cột sáng.
export const SceneAlone: React.FC = () => {
  const f = useCurrentFrame();
  const zoom = interpolate(f, [0, 180], [1.0, 1.12], clamp);
  return (
    <AbsoluteFill style={{ background: "#08080c", scale: String(zoom) }}>
      <div style={{ position: "absolute", left: 660, top: -100, width: 600, height: 1100, background: "linear-gradient(rgba(255,255,255,.16), rgba(255,255,255,.03))", clipPath: "polygon(40% 0, 60% 0, 100% 100%, 0 100%)" }} />
      <div style={{ position: "absolute", left: 660, top: 860, width: 600, height: 60, borderRadius: "50%", background: "radial-gradient(rgba(255,255,255,.18), rgba(0,0,0,0) 70%)" }} />
      {Array.from({ length: 18 }).map((_, i) => {
        const x = 760 + ((i * 97) % 400);
        const y = 100 + ((i * 173 + f * (0.6 + (i % 3) * 0.3)) % 760);
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: 4, height: 4, borderRadius: 2, background: "#fff", opacity: 0.25 }} />;
      })}
      {/* dáng ngồi ôm gối: chân co, hai tay vòng trước */}
      <div style={{ position: "absolute", left: 780, top: 470, width: 360 }}>
        <Sang mood="sad" pose={{ head: 10, rArm: [-48, -62], lArm: [48, 62], rLeg: [0, 0], lLeg: [0, 0] }} hideLegs style={{ width: 360 }}>
          <ellipse cx={205} cy={470} rx={58} ry={72} fill={C.body} stroke={C.line} strokeWidth={5} />
          <ellipse cx={295} cy={470} rx={58} ry={72} fill={C.body} stroke={C.line} strokeWidth={5} />
          <ellipse cx={185} cy={560} rx={44} ry={24} fill={C.body} stroke={C.line} strokeWidth={5} />
          <ellipse cx={315} cy={560} rx={44} ry={24} fill={C.body} stroke={C.line} strokeWidth={5} />
        </Sang>
      </div>
      <Vignette strength={0.85} />
    </AbsoluteFill>
  );
};

// Cận cảnh điện thoại, ngón tay bấm nút nguồn.
export const ScenePowerOff: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const press = sec(2.6);
  const off = f >= press + 2;
  const handIn = interpolate(f, [sec(1.2), press], [0, 1], { ...clamp, easing: ease });
  const shake = f >= press && f < press + 8 ? Math.sin(f * 3) * 10 : 0;
  const glitch = f >= press - 4 && f < press + 2;
  const zoom = interpolate(f, [0, press], [1, 1.12], clamp);
  const m = spring({ frame: f, fps, config: { damping: 12 } });
  return (
    <AbsoluteFill style={{ background: "#06060a", scale: String(zoom), translate: `${shake}px 0` }}>
      {!off && <Glow x={960} y={540} r={520} color="rgba(139,92,246,.35)" />}
      <div style={{ position: "absolute", left: 960 - 230, top: 540 - 400, width: 460, height: 800, borderRadius: 60, background: "#141320", border: `6px solid ${C.line}` }}>
        <div style={{ position: "absolute", inset: 24, borderRadius: 40, background: off ? "#050507" : "linear-gradient(#3b1f6b,#1b0f33)", overflow: "hidden", filter: glitch ? "hue-rotate(90deg) contrast(2)" : undefined }}>
          {!off && (
            <div style={{ position: "absolute", left: 60, top: 140, opacity: m, translate: glitch ? "18px -6px" : "0 0" }}>
              <Monster size={280} t={f} grin={0.8} glow={0.6} />
            </div>
          )}
          {off && <div style={{ position: "absolute", left: "30%", top: "8%", width: "40%", height: "60%", background: "linear-gradient(120deg, rgba(255,255,255,.06), rgba(255,255,255,0))", borderRadius: 20 }} />}
        </div>
        {/* nút nguồn */}
        <div style={{ position: "absolute", right: -16, top: 200, width: 12, height: 90, borderRadius: 6, background: C.line, translate: f >= press && f < press + 6 ? "-6px 0" : "0 0" }} />
      </div>
      {/* bàn tay Sáng */}
      <div style={{ position: "absolute", left: 1220 + (1 - handIn) * 600, top: 300, width: 520, height: 150, borderRadius: 75, background: C.body, border: `6px solid ${C.line}` }}>
        <div style={{ position: "absolute", left: -30, top: 30, width: 120, height: 90, borderRadius: 45, background: C.body, border: `6px solid ${C.line}` }} />
      </div>
      <Vignette strength={0.9} />
    </AbsoluteFill>
  );
};
