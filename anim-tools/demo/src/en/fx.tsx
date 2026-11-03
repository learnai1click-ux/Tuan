import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "../theme";

export const anton = "'Anton', 'Baloo 2', sans-serif";
export const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);

const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// Máy quay: zoom theo keyframe + rung theo cường độ.
export const Cam: React.FC<{ children: React.ReactNode; zoom?: [number, number][]; shake?: [number, number][]; origin?: string }> = ({ children, zoom = [[0, 1]], shake = [[0, 0]], origin = "50% 55%" }) => {
  const f = useCurrentFrame();
  const z = zoom.length > 1 ? interpolate(f, zoom.map((k) => k[0]), zoom.map((k) => k[1]), { ...cl, easing: easeOut }) : zoom[0][1];
  const s = shake.length > 1 ? interpolate(f, shake.map((k) => k[0]), shake.map((k) => k[1]), cl) : shake[0][1];
  const dx = s * (rnd(f) - 0.5) * 2, dy = s * (rnd(f + 99) - 0.5) * 2;
  return <AbsoluteFill style={{ scale: String(z), translate: `${dx}px ${dy}px`, transformOrigin: origin }}>{children}</AbsoluteFill>;
};

// Đường tốc độ kiểu anime: "radial" toả từ tâm, "h" vệt ngang.
export const SpeedLines: React.FC<{ mode?: "radial" | "h"; color?: string; opacity?: number; cx?: number; cy?: number; n?: number }> = ({ mode = "radial", color = "#fff", opacity = 0.5, cx = 960, cy = 540, n = 48 }) => {
  const f = useCurrentFrame();
  return (
    <svg style={{ position: "absolute", inset: 0, opacity }} width={1920} height={1080}>
      {Array.from({ length: n }).map((_, i) => {
        const seed = rnd(i * 7 + Math.floor(f / 2));
        if (mode === "h") {
          const y = rnd(i * 3) * 1080, len = 200 + seed * 500;
          const x = ((rnd(i * 5) * 2600 - f * 90 * (1 + seed)) % 2600 + 2600) % 2600 - 300;
          return <line key={i} x1={x} y1={y} x2={x + len} y2={y} stroke={color} strokeWidth={2 + seed * 4} strokeLinecap="round" />;
        }
        const a = (i / n) * Math.PI * 2 + rnd(i) * 0.1;
        const r1 = 380 + seed * 260, r2 = r1 + 300 + seed * 500;
        return <line key={i} x1={cx + Math.cos(a) * r1} y1={cy + Math.sin(a) * r1} x2={cx + Math.cos(a) * r2} y2={cy + Math.sin(a) * r2} stroke={color} strokeWidth={3 + seed * 5} strokeLinecap="round" />;
      })}
    </svg>
  );
};

// Biểu tượng cảm xúc bật lên cạnh nhân vật.
export const Emote: React.FC<{ kind: "!" | "?" | "anger" | "zzz" | "sparkle" | "sweat" | "steam"; x: number; y: number; size?: number; at?: number }> = ({ kind, x, y, size = 1, at = 0 }) => {
  const f = useCurrentFrame() - at;
  const { fps } = useVideoConfig();
  if (f < 0) return null;
  const s = spring({ frame: f, fps, config: { damping: 8, stiffness: 260 } });
  const wob = Math.sin(f / 3) * 4;
  const base: React.CSSProperties = { position: "absolute", left: x, top: y, scale: String(s * size), transformOrigin: "center" };
  if (kind === "!" || kind === "?")
    return <div style={{ ...base, fontFamily: anton, fontSize: 130, color: C.gold, textShadow: "0 0 20px rgba(255,200,87,.7)", rotate: `${wob}deg` }}>{kind}</div>;
  if (kind === "anger")
    return (
      <svg style={{ ...base }} width={90} height={90} viewBox="-45 -45 90 90">
        {[0, 90, 180, 270].map((r) => <path key={r} transform={`rotate(${r + wob * 2})`} d="M8 -36 Q14 -14 36 -8" stroke={C.red} strokeWidth={9} fill="none" strokeLinecap="round" />)}
      </svg>
    );
  if (kind === "zzz")
    return (
      <div style={{ ...base, fontFamily: anton, color: "#9db4ff" }}>
        {[0, 1, 2].map((i) => {
          const t = (f + i * 15) % 45;
          return <div key={i} style={{ position: "absolute", left: i * 34 + t * 0.8, top: -i * 40 - t * 1.4, fontSize: 40 + i * 14, opacity: interpolate(t, [0, 8, 36, 45], [0, 1, 1, 0]) }}>Z</div>;
        })}
      </div>
    );
  if (kind === "sparkle")
    return (
      <svg style={{ ...base, rotate: `${f * 3}deg` }} width={120} height={120} viewBox="-60 -60 120 120">
        <path d="M0 -55 L10 -10 L55 0 L10 10 L0 55 L-10 10 L-55 0 L-10 -10 Z" fill={C.gold} opacity={interpolate(f, [0, 20, 30], [1, 1, 0], cl)} />
      </svg>
    );
  if (kind === "steam")
    return (
      <div style={base}>
        {[0, 1].map((i) => {
          const t = (f + i * 10) % 24;
          return <div key={i} style={{ position: "absolute", left: i * 70, top: -t * 3, width: 44, height: 44, borderRadius: "50%", background: "#fff", opacity: interpolate(t, [0, 6, 24], [0, 0.6, 0]), scale: String(0.6 + t / 24) }} />;
        })}
      </div>
    );
  return (
    <div style={base}>
      {[0, 1, 2, 3].map((i) => {
        const a = -0.6 - i * 0.5, t = Math.min(f, 18);
        return <div key={i} style={{ position: "absolute", left: Math.cos(a) * t * 7, top: Math.sin(a) * t * 7 + 0.4 * t * t * 0.3, width: 16, height: 22, borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%", background: "#78BEFF", opacity: interpolate(f, [0, 14, 22], [1, 1, 0], cl) }} />;
      })}
    </div>
  );
};

// Vào cảnh bằng cú lia nhanh (whip pan) có nhoè.
export const Whip: React.FC<{ children: React.ReactNode; dir?: 1 | -1; dur?: number }> = ({ children, dir = 1, dur = 6 }) => {
  const f = useCurrentFrame();
  const k = interpolate(f, [0, dur], [1, 0], { ...cl, easing: easeOut });
  return <AbsoluteFill style={{ translate: `${dir * k * 260}px 0`, filter: k > 0.02 ? `blur(${k * 26}px)` : undefined }}>{children}</AbsoluteFill>;
};

export const Flash: React.FC<{ at: number; dur?: number; color?: string; peak?: number }> = ({ at, dur = 10, color = "#fff", peak = 1 }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [at - 1, at, at + dur], [0, peak, 0], cl);
  return o > 0 ? <AbsoluteFill style={{ background: color, opacity: o, pointerEvents: "none" }} /> : null;
};

export const Rain: React.FC<{ n?: number; opacity?: number }> = ({ n = 90, opacity = 0.5 }) => {
  const f = useCurrentFrame();
  return (
    <svg style={{ position: "absolute", inset: 0, opacity }} width={1920} height={1080}>
      {Array.from({ length: n }).map((_, i) => {
        const x = rnd(i) * 2100 - 100, sp = 40 + rnd(i * 3) * 30;
        const y = ((rnd(i * 9) * 1200 + f * sp) % 1300) - 120;
        return <line key={i} x1={x} y1={y} x2={x - 14} y2={y + 60} stroke="#9fb8ff" strokeWidth={2} />;
      })}
    </svg>
  );
};

// Chuỗi PNG nền trong suốt; trail > 0 vẽ thêm bóng mờ khung trước (nhoè chuyển động).
export const Clip: React.FC<{ name: string; frames: number; speed?: number; offset?: number; loop?: boolean; trail?: number; style?: React.CSSProperties }> = ({ name, frames, speed = 1, offset = 0, loop = false, trail = 0, style }) => {
  const f = useCurrentFrame();
  const idx = (k: number) => {
    const raw = Math.floor((f - k) * speed) + offset;
    return Math.max(0, loop ? ((raw % frames) + frames) % frames : Math.min(raw, frames - 1));
  };
  const src = (i: number) => staticFile(`en/clips/${name}/${String(i).padStart(4, "0")}.png`);
  return (
    <div style={{ position: "absolute", ...style }}>
      {Array.from({ length: trail }).map((_, k) => (
        <Img key={k} src={src(idx(trail - k + 1))} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.12 * (k + 1) }} />
      ))}
      <Img src={src(idx(0))} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
    </div>
  );
};

// Phụ đề kiểu video truyền động lực: chữ in hoa đậm, bật từng từ, từ khoá đổi màu.
export const Punchline: React.FC<{ text: string; duration: number; keys?: string[]; size?: number; top?: number; color?: string; hold?: number }> = ({ text, duration, keys = [], size = 84, top = 96, color = C.text, hold = 10 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(" ");
  const per = duration / words.length;
  const out = interpolate(f, [duration + hold, duration + hold + 8], [1, 0], cl);
  return (
    <div style={{ position: "absolute", top, left: 0, width: "100%", textAlign: "center", padding: "0 140px", boxSizing: "border-box", fontFamily: anton, fontSize: size, lineHeight: 1.12, color, opacity: out, textTransform: "uppercase", letterSpacing: 1.5, textShadow: "0 4px 18px rgba(0,0,0,.75)" }}>
      {words.map((w, i) => {
        const s = spring({ frame: f - i * per, fps, config: { damping: 11, stiffness: 240 } });
        const key = keys.some((k) => w.toLowerCase().replace(/[^a-z']/g, "") === k);
        return (
          <span key={i} style={{ display: "inline-block", marginRight: "0.26em", opacity: Math.min(1, s * 1.5), scale: String(0.4 + 0.6 * s), color: key ? C.orange : undefined }}>
            {w}
          </span>
        );
      })}
    </div>
  );
};

export const DayTag: React.FC<{ day: number | string; color?: string }> = ({ day, color = C.orange }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f, fps, config: { damping: 10, stiffness: 260 } });
  return (
    <div style={{ position: "absolute", left: 80, bottom: 56, fontFamily: anton, fontSize: 58, letterSpacing: 4, color, opacity: s, scale: String(0.5 + 0.5 * s), transformOrigin: "left center" }}>
      DAY {day}
    </div>
  );
};

export const Vig: React.FC<{ s?: number }> = ({ s = 0.75 }) => (
  <AbsoluteFill style={{ background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,${s}) 100%)`, pointerEvents: "none" }} />
);
