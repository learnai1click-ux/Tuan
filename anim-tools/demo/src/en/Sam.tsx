import React from "react";
import { Easing } from "remotion";
import { C } from "../theme";

// Con rối "Sam": cùng hình khối với texture AnimatedDrawings, nhưng mặt và tay chân
// điều khiển bằng tham số, nên đổi biểu cảm và cử chỉ mượt theo keyframe.

export type Face = {
  brow: number; // -1 cau mày giận, 0 bình thường, 1 nhíu buồn
  browY: number; // nâng lông mày (px)
  eye: number; // 0 nhắm, 1 mở, 1.4 trợn
  look: number; // liếc ngang (px)
  lookY: number;
  mouth: number; // -1 mếu, 1 cười
  open: number; // 0 khép, 1 há to
  teeth: number; // 0..1 nghiến răng
  blush: number;
  tears: number;
  sweat: number;
};

export const FACES: Record<string, Face> = {
  neutral: { brow: 0, browY: 0, eye: 1, look: 0, lookY: 0, mouth: 0.1, open: 0, teeth: 0, blush: 0, tears: 0, sweat: 0 },
  sleep: { brow: 0.2, browY: -4, eye: 0, look: 0, lookY: 0, mouth: 0, open: 0.15, teeth: 0, blush: 0, tears: 0, sweat: 0 },
  tired: { brow: 0.3, browY: -6, eye: 0.35, look: 0, lookY: 4, mouth: -0.2, open: 0, teeth: 0, blush: 0, tears: 0, sweat: 0 },
  yawn: { brow: 0.6, browY: 6, eye: 0, look: 0, lookY: 0, mouth: 0, open: 1, teeth: 0, blush: 0, tears: 0.3, sweat: 0 },
  bored: { brow: 0, browY: -8, eye: 0.5, look: 14, lookY: 0, mouth: -0.1, open: 0, teeth: 0, blush: 0, tears: 0, sweat: 0 },
  sad: { brow: 1, browY: 4, eye: 0.8, look: 0, lookY: 6, mouth: -0.8, open: 0, teeth: 0, blush: 0, tears: 0, sweat: 0 },
  cry: { brow: 1, browY: 6, eye: 0.55, look: 0, lookY: 6, mouth: -1, open: 0.35, teeth: 0, blush: 0.3, tears: 1, sweat: 0 },
  shock: { brow: 0.4, browY: 16, eye: 1.45, look: 0, lookY: 0, mouth: 0, open: 0.7, teeth: 0, blush: 0, tears: 0, sweat: 1 },
  focus: { brow: -0.6, browY: 0, eye: 0.9, look: 0, lookY: 0, mouth: 0.3, open: 0, teeth: 0, blush: 0, tears: 0, sweat: 0 },
  grit: { brow: -1, browY: -2, eye: 0.75, look: 0, lookY: 0, mouth: 0, open: 0.45, teeth: 1, blush: 0, tears: 0, sweat: 1 },
  shout: { brow: -1, browY: 0, eye: 1.0, look: 0, lookY: 0, mouth: 0, open: 1, teeth: 0, blush: 0.2, tears: 0, sweat: 0 },
  happy: { brow: 0.1, browY: 6, eye: 0, look: 0, lookY: 0, mouth: 1, open: 0.6, teeth: 0, blush: 1, tears: 0, sweat: 0 },
  smirk: { brow: -0.4, browY: 0, eye: 0.85, look: 6, lookY: 0, mouth: 0.6, open: 0, teeth: 0, blush: 0, tears: 0, sweat: 0 },
};

export type Pose = {
  x: number; y: number; // dịch cả người (px trong khung 500x720)
  lean: number; head: number;
  rArm: [number, number]; lArm: [number, number];
  rLeg: [number, number]; lLeg: [number, number];
  sx: number; sy: number; // co giãn (squash & stretch) quanh bàn chân
};

export const REST: Pose = { x: 0, y: 0, lean: 0, head: 0, rArm: [0, 0], lArm: [0, 0], rLeg: [0, 0], lLeg: [0, 0], sx: 1, sy: 1 };

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mixPose = (a: Pose, b: Pose, t: number): Pose => ({
  x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), lean: lerp(a.lean, b.lean, t), head: lerp(a.head, b.head, t),
  rArm: [lerp(a.rArm[0], b.rArm[0], t), lerp(a.rArm[1], b.rArm[1], t)],
  lArm: [lerp(a.lArm[0], b.lArm[0], t), lerp(a.lArm[1], b.lArm[1], t)],
  rLeg: [lerp(a.rLeg[0], b.rLeg[0], t), lerp(a.rLeg[1], b.rLeg[1], t)],
  lLeg: [lerp(a.lLeg[0], b.lLeg[0], t), lerp(a.lLeg[1], b.lLeg[1], t)],
  sx: lerp(a.sx, b.sx, t), sy: lerp(a.sy, b.sy, t),
});
const mixFace = (a: Face, b: Face, t: number): Face => {
  const o = { ...a };
  (Object.keys(a) as (keyof Face)[]).forEach((k) => (o[k] = lerp(a[k], b[k], t)));
  return o;
};

export type Key = { f: number; p?: Partial<Pose>; face?: keyof typeof FACES | Face; ease?: "snap" | "smooth" | "linear" };
const snap = Easing.out(Easing.back(1.8));
const smooth = Easing.inOut(Easing.cubic);

// Nội suy keyframe: "snap" vượt đích rồi bật lại, cho động tác dứt khoát.
export const animate = (frame: number, keys: Key[]): { pose: Pose; face: Face } => {
  const full = keys.map((k) => ({
    ...k,
    pose: { ...REST, ...k.p } as Pose,
    faceV: typeof k.face === "string" ? FACES[k.face] : k.face,
  }));
  // mặt giữ giá trị keyframe gần nhất có khai báo
  let lastFace = FACES.neutral;
  const faces = full.map((k) => (lastFace = k.faceV ?? lastFace));
  if (frame <= full[0].f) return { pose: full[0].pose, face: faces[0] };
  for (let i = 0; i < full.length - 1; i++) {
    const a = full[i], b = full[i + 1];
    if (frame <= b.f) {
      const raw = (frame - a.f) / Math.max(1, b.f - a.f);
      const e = b.ease === "linear" ? raw : b.ease === "smooth" ? smooth(raw) : snap(raw);
      const fe = Math.min(1, raw * 1.8);
      return { pose: mixPose(a.pose, b.pose, e), face: mixFace(faces[i], faces[i + 1], smooth(Math.min(1, fe))) };
    }
  }
  return { pose: full[full.length - 1].pose, face: faces[faces.length - 1] };
};

const J = {
  neck: [250, 250], rs: [203, 288], re: [150, 372], rh: [118, 452],
  ls: [297, 288], le: [350, 372], lh: [382, 452],
  rhip: [216, 476], rk: [206, 572], rf: [196, 660],
  lhip: [284, 476], lk: [294, 572], lf: [304, 660], hip: [250, 470],
} as const;
const W = 42, OUT = 5;

const Seg: React.FC<{ a: readonly number[]; b: readonly number[] }> = ({ a, b }) => (
  <>
    <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={C.line} strokeWidth={W + OUT * 2} strokeLinecap="round" />
    <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={C.body} strokeWidth={W} strokeLinecap="round" />
  </>
);

const Hand: React.FC<{ p: readonly number[]; fist: boolean }> = ({ p, fist }) => (
  <g>
    <circle cx={p[0]} cy={p[1]} r={fist ? 27 : 25} fill={C.body} stroke={C.line} strokeWidth={OUT} />
    {fist && (
      <path d={`M${p[0] - 14} ${p[1] - 6} q7 -8 14 0 q7 -8 14 0`} stroke={C.line} strokeWidth={4} fill="none" strokeLinecap="round" />
    )}
  </g>
);

const Limb: React.FC<{ a: readonly number[]; b: readonly number[]; c: readonly number[]; ang: [number, number]; end: "hand" | "foot"; side: 1 | -1; fist?: boolean }> = ({ a, b, c, ang, end, side, fist = false }) => (
  <g transform={`rotate(${ang[0]} ${a[0]} ${a[1]})`}>
    <Seg a={a} b={b} />
    <g transform={`rotate(${ang[1]} ${b[0]} ${b[1]})`}>
      <Seg a={b} b={c} />
      {end === "hand" ? <Hand p={c} fist={fist} /> : <ellipse cx={c[0] + side * 10} cy={c[1] + 1} rx={30} ry={19} fill={C.body} stroke={C.line} strokeWidth={OUT} />}
    </g>
  </g>
);

const FaceView: React.FC<{ f: Face; blink: boolean }> = ({ f, blink }) => {
  const cx = 250 + f.look, cy = 160 + f.lookY, ey = cy + 4;
  const eye = blink ? 0 : f.eye;
  return (
    <g>
      {f.blush > 0.01 &&
        [cx - 58, cx + 58].map((x) => <ellipse key={x} cx={x} cy={cy + 30} rx={14} ry={8} fill="#F0A096" opacity={f.blush} />)}
      {[-1, 1].map((side) => {
        const ex = cx + side * 32;
        // brow > 0: đầu trong (gần giữa mặt) nhô lên = buồn; brow < 0: đầu trong hạ = giận
        const by = ey - 30 - f.browY;
        const innerY = by - f.brow * 10;
        const outerY = by + f.brow * 5;
        const x1 = ex - 18, x2 = ex + 18;
        const y1 = side < 0 ? outerY : innerY; // mắt trái màn hình: đầu trong là x2
        const y2 = side < 0 ? innerY : outerY;
        return (
          <g key={side}>
            {eye < 0.12 ? (
              <path d={f.mouth > 0.5 ? `M${ex - 14} ${ey + 4} Q${ex} ${ey - 12} ${ex + 14} ${ey + 4}` : `M${ex - 15} ${ey} Q${ex} ${ey + 8} ${ex + 15} ${ey}`} stroke={C.ink} strokeWidth={6} fill="none" strokeLinecap="round" />
            ) : eye > 1.15 ? (
              <>
                <ellipse cx={ex} cy={ey} rx={16} ry={17} fill="#fff" stroke={C.ink} strokeWidth={4} />
                <circle cx={ex} cy={ey} r={6} fill={C.ink} />
              </>
            ) : (
              <>
                <ellipse cx={ex} cy={ey} rx={11} ry={12 * eye} fill={C.ink} />
                {eye > 0.5 && <circle cx={ex + 3} cy={ey - 5 * eye} r={3} fill="#fff" />}
                {eye < 0.6 && <line x1={ex - 16} y1={ey - 12 * eye} x2={ex + 16} y2={ey - 12 * eye} stroke={C.ink} strokeWidth={5} strokeLinecap="round" />}
              </>
            )}
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
            {f.tears > 0.05 && (
              <path d={`M${ex - 5} ${ey + 14} L${ex + 5} ${ey + 14} L${ex + 7} ${ey + 14 + 34 * f.tears} Q${ex} ${ey + 22 + 36 * f.tears} ${ex - 7} ${ey + 14 + 34 * f.tears} Z`} fill="#78BEFF" opacity={0.9} />
            )}
          </g>
        );
      })}
      {(() => {
        const my = cy + 42, w = 20 + 6 * Math.abs(f.mouth), curve = f.mouth * 14, op = f.open * 26;
        if (f.teeth > 0.5) {
          return (
            <g>
              <rect x={cx - 26} y={my - 12} width={52} height={24} rx={6} fill="#fafafa" stroke={C.ink} strokeWidth={4} />
              <line x1={cx - 26} y1={my} x2={cx + 26} y2={my} stroke={C.ink} strokeWidth={3} />
              {[-9, 9].map((d) => <line key={d} x1={cx + d} y1={my - 12} x2={cx + d} y2={my + 12} stroke={C.ink} strokeWidth={3} />)}
            </g>
          );
        }
        if (op < 3) return <path d={`M${cx - w} ${my} Q${cx} ${my + curve} ${cx + w} ${my}`} stroke={C.ink} strokeWidth={5} fill="none" strokeLinecap="round" />;
        return (
          <g>
            <path d={`M${cx - w} ${my - op * 0.3} Q${cx} ${my - op * 0.3 + curve * 0.5} ${cx + w} ${my - op * 0.3} Q${cx} ${my + op + curve} ${cx - w} ${my - op * 0.3} Z`} fill={C.ink} />
            {op > 12 && <ellipse cx={cx} cy={my + op * 0.55} rx={w * 0.45} ry={op * 0.22} fill="#D95A6A" />}
          </g>
        );
      })()}
      {f.sweat > 0.05 && (
        <path d={`M${cx + 80} ${cy - 46} Q${cx + 70} ${cy - 24} ${cx + 80} ${cy - 16} Q${cx + 90} ${cy - 24} ${cx + 80} ${cy - 46} Z`} fill="#78BEFF" opacity={f.sweat} />
      )}
    </g>
  );
};

const Scarf: React.FC<{ wind: number }> = ({ wind }) => (
  <g>
    <rect x={186} y={238} width={128} height={36} rx={18} fill={C.orangeDark} />
    <rect x={190} y={232} width={120} height={32} rx={16} fill={C.orange} />
    <polygon points={`278,254 306,254 ${318 + wind * 60},${332 - wind * 40} ${292 + wind * 64},${338 - wind * 30}`} fill={C.orange} />
  </g>
);

export const Sam: React.FC<{
  pose?: Partial<Pose>;
  face?: Face | keyof typeof FACES;
  scarf?: boolean;
  blink?: boolean;
  fists?: boolean;
  wind?: number;
  hideLegs?: boolean;
  width?: number;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  handProp?: React.ReactNode;
}> = ({ pose = {}, face = "neutral", scarf = false, blink = false, fists = false, wind = 0, hideLegs, width = 420, style, children, handProp }) => {
  const p: Pose = { ...REST, ...pose };
  const f: Face = typeof face === "string" ? FACES[face] : face;
  return (
    <svg viewBox="0 0 500 720" width={width} height={width * 1.44} style={{ overflow: "visible", ...style }}>
      <g transform={`translate(${p.x} ${p.y}) translate(250 680) scale(${p.sx} ${p.sy}) translate(-250 -680) rotate(${p.lean} ${J.hip[0]} ${J.hip[1]})`}>
        {!hideLegs && (
          <>
            <Limb a={J.rhip} b={J.rk} c={J.rf} ang={p.rLeg} end="foot" side={-1} />
            <Limb a={J.lhip} b={J.lk} c={J.lf} ang={p.lLeg} end="foot" side={1} />
          </>
        )}
        <rect x={178} y={236} width={144} height={262} rx={72} fill={C.body} stroke={C.line} strokeWidth={OUT} />
        <Limb a={J.rs} b={J.re} c={J.rh} ang={p.rArm} end="hand" side={-1} fist={fists} />
        <Limb a={J.ls} b={J.le} c={J.lh} ang={p.lArm} end="hand" side={1} fist={fists} />
        {handProp && (
          <g transform={`rotate(${p.lArm[0]} ${J.ls[0]} ${J.ls[1]}) rotate(${p.lArm[1]} ${J.le[0]} ${J.le[1]}) translate(${J.lh[0]} ${J.lh[1]}) rotate(${-(p.lArm[0] + p.lArm[1])})`}>
            {handProp}
          </g>
        )}
        <g transform={`rotate(${p.head} ${J.neck[0]} ${J.neck[1]})`}>
          <circle cx={250} cy={160} r={96} fill={C.body} stroke={C.line} strokeWidth={OUT} />
          <FaceView f={f} blink={blink} />
          {scarf && <Scarf wind={wind} />}
        </g>
        {children}
      </g>
    </svg>
  );
};
