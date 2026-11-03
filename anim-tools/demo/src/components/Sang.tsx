import React from "react";
import { C } from "../theme";

// Con rối SVG của nhân vật Sáng, cùng hình khối với texture dùng cho AnimatedDrawings
// (anim-tools/scripts/make_character.py) để hai nguồn hình khớp nhau.
// Toạ độ theo khung 500x720 của texture. Góc tính bằng độ, quay quanh khớp,
// dương = theo chiều kim đồng hồ trên màn hình.

export type Mood = "tired" | "focus" | "happy" | "sad" | "shock";

export type Pose = {
  lean?: number; // cả người quanh hông
  head?: number; // đầu quanh cổ
  rArm?: [number, number]; // tay bên trái màn hình: vai, khuỷu
  lArm?: [number, number]; // tay bên phải màn hình
  rLeg?: [number, number];
  lLeg?: [number, number];
};

const J = {
  neck: [250, 250],
  rs: [203, 288], re: [150, 372], rh: [118, 452],
  ls: [297, 288], le: [350, 372], lh: [382, 452],
  rhip: [216, 476], rk: [206, 572], rf: [196, 660],
  lhip: [284, 476], lk: [294, 572], lf: [304, 660],
  hip: [250, 470],
} as const;

const W = 42;
const OUT = 5;

const Seg: React.FC<{ a: readonly number[]; b: readonly number[] }> = ({ a, b }) => (
  <>
    <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={C.line} strokeWidth={W + OUT * 2} strokeLinecap="round" />
    <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={C.body} strokeWidth={W} strokeLinecap="round" />
  </>
);

const Dot: React.FC<{ p: readonly number[]; r: number }> = ({ p, r }) => (
  <circle cx={p[0]} cy={p[1]} r={r} fill={C.body} stroke={C.line} strokeWidth={OUT} />
);

const Limb: React.FC<{
  a: readonly number[]; b: readonly number[]; c: readonly number[];
  ang: [number, number]; end: "hand" | "foot"; side: 1 | -1;
}> = ({ a, b, c, ang, end, side }) => (
  <g transform={`rotate(${ang[0]} ${a[0]} ${a[1]})`}>
    <Seg a={a} b={b} />
    <g transform={`rotate(${ang[1]} ${b[0]} ${b[1]})`}>
      <Seg a={b} b={c} />
      {end === "hand" ? (
        <Dot p={c} r={25} />
      ) : (
        <ellipse cx={c[0] + side * 10} cy={c[1] + 1} rx={30} ry={19} fill={C.body} stroke={C.line} strokeWidth={OUT} />
      )}
    </g>
  </g>
);

const Face: React.FC<{ mood: Mood; blink: boolean; look: number }> = ({ mood, blink, look }) => {
  const cx = 250 + look;
  const ey = 164;
  if (mood === "tired" || mood === "sad") {
    return (
      <g>
        {[cx - 32, cx + 32].map((ex) => (
          <g key={ex}>
            <path d={`M${ex - 15} ${ey} A15 12 0 0 0 ${ex + 15} ${ey} Z`} fill={C.ink} />
            <line x1={ex - 17} y1={ey} x2={ex + 17} y2={ey} stroke={C.ink} strokeWidth={5} strokeLinecap="round" />
            <path d={`M${ex - 12} ${ey + 16} Q${ex} ${ey + 22} ${ex + 12} ${ey + 16}`} stroke="#968ca0" strokeWidth={3} fill="none" />
          </g>
        ))}
        {mood === "sad" ? (
          <path d={`M${cx - 16} ${ey + 46} Q${cx} ${ey + 36} ${cx + 16} ${ey + 46}`} stroke={C.ink} strokeWidth={5} fill="none" strokeLinecap="round" />
        ) : (
          <line x1={cx - 14} y1={ey + 40} x2={cx + 14} y2={ey + 40} stroke={C.ink} strokeWidth={5} strokeLinecap="round" />
        )}
      </g>
    );
  }
  if (mood === "happy") {
    return (
      <g>
        {[cx - 32, cx + 32].map((ex) => (
          <path key={ex} d={`M${ex - 14} ${ey + 4} Q${ex} ${ey - 14} ${ex + 14} ${ey + 4}`} stroke={C.ink} strokeWidth={6} fill="none" strokeLinecap="round" />
        ))}
        <path d={`M${cx - 24} ${ey + 28} Q${cx} ${ey + 62} ${cx + 24} ${ey + 28} Z`} fill={C.ink} />
        <ellipse cx={cx - 58} cy={ey + 30} rx={13} ry={7} fill="#F0A096" />
        <ellipse cx={cx + 58} cy={ey + 30} rx={13} ry={7} fill="#F0A096" />
      </g>
    );
  }
  const shock = mood === "shock";
  return (
    <g>
      {[cx - 32, cx + 32].map((ex, i) => (
        <g key={ex}>
          {blink ? (
            <line x1={ex - 11} y1={ey} x2={ex + 11} y2={ey} stroke={C.ink} strokeWidth={5} strokeLinecap="round" />
          ) : (
            <>
              <ellipse cx={ex} cy={ey} rx={shock ? 13 : 11} ry={shock ? 15 : 12} fill={C.ink} />
              <circle cx={ex + 3} cy={ey - 5} r={3} fill="#fff" />
            </>
          )}
          {!shock && (
            <line x1={ex - 18} y1={ey - 30 - (i === 0 ? 6 : -6)} x2={ex + 18} y2={ey - 30 + (i === 0 ? 6 : -6)} stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
          )}
        </g>
      ))}
      {shock ? (
        <ellipse cx={cx} cy={ey + 44} rx={10} ry={13} fill={C.ink} />
      ) : (
        <path d={`M${cx - 18} ${ey + 34} Q${cx} ${ey + 50} ${cx + 18} ${ey + 34}`} stroke={C.ink} strokeWidth={5} fill="none" strokeLinecap="round" />
      )}
    </g>
  );
};

const Scarf: React.FC = () => (
  <g>
    <rect x={186} y={238} width={128} height={36} rx={18} fill={C.orangeDark} />
    <rect x={190} y={232} width={120} height={32} rx={16} fill={C.orange} />
    <polygon points="278,254 306,254 318,332 292,338" fill={C.orange} />
  </g>
);

export const Sang: React.FC<{
  pose?: Pose;
  mood?: Mood;
  scarf?: boolean;
  blink?: boolean;
  look?: number;
  hideLegs?: boolean;
  style?: React.CSSProperties;
  children?: React.ReactNode; // vẽ thêm phía trước tay (ví dụ điện thoại)
  handProp?: React.ReactNode; // vật cầm ở tay phải màn hình (theo khớp tay)
}> = ({ pose = {}, mood = "focus", scarf = false, blink = false, look = 0, hideLegs, style, children, handProp }) => {
  const p = {
    lean: 0, head: 0, rArm: [0, 0] as [number, number], lArm: [0, 0] as [number, number],
    rLeg: [0, 0] as [number, number], lLeg: [0, 0] as [number, number], ...pose,
  };
  return (
    <svg viewBox="0 0 500 720" style={{ overflow: "visible", ...style }}>
      <g transform={`rotate(${p.lean} ${J.hip[0]} ${J.hip[1]})`}>
        {!hideLegs && (
          <>
            <Limb a={J.rhip} b={J.rk} c={J.rf} ang={p.rLeg} end="foot" side={-1} />
            <Limb a={J.lhip} b={J.lk} c={J.lf} ang={p.lLeg} end="foot" side={1} />
          </>
        )}
        <rect x={178} y={236} width={144} height={262} rx={72} fill={C.body} stroke={C.line} strokeWidth={OUT} />
        <Limb a={J.rs} b={J.re} c={J.rh} ang={p.rArm} end="hand" side={-1} />
        <g>
          <Limb a={J.ls} b={J.le} c={J.lh} ang={p.lArm} end="hand" side={1} />
          {handProp && (
            <g transform={`rotate(${p.lArm[0]} ${J.ls[0]} ${J.ls[1]}) rotate(${p.lArm[1]} ${J.le[0]} ${J.le[1]}) translate(${J.lh[0]} ${J.lh[1]}) rotate(${-(p.lArm[0] + p.lArm[1])})`}>
              {handProp}
            </g>
          )}
        </g>
        <g transform={`rotate(${p.head} ${J.neck[0]} ${J.neck[1]})`}>
          <circle cx={250} cy={160} r={96} fill={C.body} stroke={C.line} strokeWidth={OUT} />
          <Face mood={mood} blink={blink} look={look} />
          {scarf && <Scarf />}
        </g>
        {children}
      </g>
    </svg>
  );
};
