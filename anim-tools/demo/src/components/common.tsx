import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { C, hand, title } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const ease = Easing.bezier(0.16, 1, 0.3, 1);

// Chuỗi PNG nền trong suốt do AnimatedDrawings render (anim-tools/scripts/render_clip.py).
export const Clip: React.FC<{
  name: string;
  frames: number;
  speed?: number;
  loop?: boolean;
  style?: React.CSSProperties;
}> = ({ name, frames, speed = 1, loop = false, style }) => {
  const f = useCurrentFrame();
  const raw = Math.floor(f * speed);
  const i = loop ? raw % frames : Math.min(raw, frames - 1);
  return <Img src={staticFile(`clips/${name}/${String(i).padStart(4, "0")}.png`)} style={style} />;
};

// Lời dẫn hiện từng chữ, cùng nhịp với giọng đọc.
export const Caption: React.FC<{
  text: string;
  duration: number; // frame
  color?: string;
  size?: number;
  top?: number;
  hold?: number; // frame giữ sau khi đọc xong
  align?: "center" | "left";
  x?: number;
}> = ({ text, duration, color = C.text, size = 62, top = 110, hold = 20, align = "center", x }) => {
  const f = useCurrentFrame();
  const words = text.split(" ");
  const per = duration / words.length;
  const out = interpolate(f, [duration + hold, duration + hold + 10], [1, 0], clamp);
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: x ?? 0,
        width: x === undefined ? "100%" : undefined,
        textAlign: align,
        fontFamily: hand,
        fontSize: size,
        color,
        opacity: out,
        lineHeight: 1.2,
        padding: "0 160px",
        boxSizing: "border-box",
        textShadow: color === C.red ? "0 0 18px rgba(255,60,90,.6)" : "0 2px 12px rgba(0,0,0,.6)",
      }}
    >
      {words.map((w, i) => {
        const a = interpolate(f, [i * per, i * per + 6], [0, 1], { ...clamp, easing: ease });
        return (
          <span key={i} style={{ opacity: a, display: "inline-block", translate: `0 ${(1 - a) * 14}px`, marginRight: "0.28em" }}>
            {w}
          </span>
        );
      })}
    </div>
  );
};

export const DayCounter: React.FC<{ day: number; color?: string }> = ({ day, color = C.dim }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f, fps, config: { damping: 12, stiffness: 180 } });
  return (
    <div
      style={{
        position: "absolute",
        left: 90,
        top: 70,
        fontFamily: title,
        fontWeight: 800,
        fontSize: 44,
        letterSpacing: 4,
        color,
        scale: String(0.6 + 0.4 * s),
        opacity: s,
        transformOrigin: "left center",
      }}
    >
      NGÀY {day}
    </div>
  );
};

export const Floor: React.FC<{ y?: number; color?: string }> = ({ y = 860, color = C.floor }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top: y, height: 3, background: color, borderRadius: 2 }} />
);

export const Vignette: React.FC<{ strength?: number }> = ({ strength = 0.75 }) => (
  <AbsoluteFill style={{ background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,${strength}) 100%)`, pointerEvents: "none" }} />
);

export const Grain: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity: 0.07, mixBlendMode: "overlay", pointerEvents: "none" }}>
      <svg width="100%" height="100%">
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={f % 8} />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};

export const Glow: React.FC<{ x: number; y: number; r: number; color: string; o?: number }> = ({ x, y, r, color, o = 1 }) => (
  <div
    style={{
      position: "absolute",
      left: x - r,
      top: y - r,
      width: r * 2,
      height: r * 2,
      borderRadius: "50%",
      background: `radial-gradient(circle, ${color} 0%, rgba(0,0,0,0) 70%)`,
      opacity: o,
      pointerEvents: "none",
    }}
  />
);

export const Window: React.FC<{ x: number; y: number; moon?: boolean; dawn?: boolean }> = ({ x, y, moon = true, dawn }) => (
  <div style={{ position: "absolute", left: x, top: y, width: 190, height: 190, borderRadius: 14, border: `4px solid ${C.line}`, background: dawn ? "linear-gradient(#3b2a5c,#d9734a)" : "#12131d", overflow: "hidden" }}>
    <div style={{ position: "absolute", left: 93, top: 0, width: 4, height: "100%", background: C.line }} />
    <div style={{ position: "absolute", top: 93, left: 0, height: 4, width: "100%", background: C.line }} />
    {moon && <div style={{ position: "absolute", left: 120, top: 26, width: 36, height: 36, borderRadius: "50%", background: "#e8e6f0", boxShadow: "0 0 30px rgba(230,230,255,.6)" }} />}
  </div>
);

export const Clock: React.FC<{ x: number; y: number; time: string; color?: string }> = ({ x, y, time, color = C.red }) => (
  <div style={{ position: "absolute", left: x, top: y, width: 170, height: 84, borderRadius: 14, background: "#1a1820", border: `3px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace", fontSize: 46, fontWeight: 700, color, textShadow: `0 0 14px ${color}` }}>
    {time}
  </div>
);

// Bàn làm việc nhìn chính diện, che nửa dưới nhân vật.
export const Desk: React.FC<{ x: number; y: number; w?: number; screen?: string; screenText?: string; lit?: number }> = ({
  x, y, w = 760, screen = C.orange, screenText, lit = 1,
}) => (
  <>
    <div style={{ position: "absolute", left: x + w / 2 - 160, top: y - 168, width: 320, height: 174, borderRadius: "16px 16px 4px 4px", background: "#22202b", border: `4px solid ${C.line}`, boxShadow: `0 0 ${80 * lit}px ${screen}55`, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 54, height: 54, borderRadius: "50%", background: screen, opacity: 0.35 + 0.65 * lit, boxShadow: `0 0 40px ${screen}` }} />
      {screenText && <div style={{ position: "absolute", bottom: 18, fontFamily: hand, fontSize: 28, color: C.dim }}>{screenText}</div>}
    </div>
    <div style={{ position: "absolute", left: x, top: y, width: w, height: 30, borderRadius: 10, background: "#2b2833", border: `4px solid ${C.line}` }} />
    <div style={{ position: "absolute", left: x + 30, top: y + 30, width: w - 60, height: 300, background: "linear-gradient(#1f1d26,#16151c)", borderLeft: `4px solid ${C.line}`, borderRight: `4px solid ${C.line}` }} />
  </>
);

export const BigText: React.FC<{ children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties }> = ({ children, size = 150, color = C.text, style }) => (
  <div style={{ fontFamily: title, fontWeight: 800, fontSize: size, color, letterSpacing: 2, lineHeight: 1, ...style }}>{children}</div>
);

export { clamp };
