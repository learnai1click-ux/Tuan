import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "../theme";
import { Monster } from "../components/Monster";
import { Glow } from "../components/common";
import { anton, Cam, cl, Clip, easeOut, Emote, Flash, SpeedLines, Vig } from "./fx";

// 47-53s: chạy lên cầu thang, quái vật khổng lồ, bật nhảy xuyên qua, chớp trắng ở 52s.
export const Climax: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const grow = spring({ frame: f - 4, fps, config: { damping: 16, mass: 1.4 } });
  const jumpAt = 96, flash = 150;
  const climb = interpolate(f, [0, jumpAt], [0, 1], cl);
  const jump = interpolate(f, [jumpAt, flash], [0, 1], { ...cl, easing: easeOut });
  const shake = f > 60 && f < flash ? interpolate(f, [60, flash], [2, 18], cl) : 0;
  const shattered = f >= flash;
  const sx = 40 + climb * 700 + jump * 480, sy = 1080 - 640 - climb * 260 - jump * 170;
  return (
    <Cam shake={[[0, shake], [1, shake]]} zoom={[[0, 1.0], [jumpAt, 1.06], [flash, 1.2], [180, 1.1]]}>
      <AbsoluteFill style={{ background: "#0a0910" }}>
        {Array.from({ length: 9 }).map((_, i) => {
          const lit = interpolate(f, [i * 9, i * 9 + 8], [0, 1], cl);
          return <div key={i} style={{ position: "absolute", left: 60 + i * 200, top: 940 - i * 84, width: 210, height: 140 + i * 84, background: "#17151f", borderTop: `5px solid rgba(255,138,61,${0.25 + 0.75 * lit})`, boxShadow: `0 -10px 34px rgba(255,138,61,${0.3 * lit})` }} />;
        })}
        {!shattered && (
          <>
            <Glow x={1460} y={320} r={760 * grow} color="rgba(255,60,90,.28)" />
            <div style={{ position: "absolute", left: 1460 - 280 * (0.6 + 1.5 * grow), top: 40, opacity: grow }}>
              <Monster size={280 * (0.6 + 1.5 * grow)} t={f} grin={0.95} />
            </div>
            <div style={{ position: "absolute", left: 120, top: 330, fontFamily: anton, fontSize: 110, color: C.red, opacity: interpolate(f, [14, 20, 60, 70], [0, 1, 1, 0], cl), textShadow: "0 0 26px rgba(255,60,90,.7)", translate: `${Math.sin(f * 3) * 3}px 0` }}>
              YOU CAN&apos;T.
            </div>
          </>
        )}
        {shattered &&
          Array.from({ length: 30 }).map((_, i) => {
            const t = f - flash, a = (i / 30) * Math.PI * 2;
            return <div key={i} style={{ position: "absolute", left: 1460 + Math.cos(a) * t * (16 + (i % 5) * 4), top: 420 + Math.sin(a) * t * (16 + (i % 4) * 4) + t * t * 0.45, width: 30, height: 30, background: i % 2 ? "#3b1f6b" : C.red, rotate: `${t * 14 + i * 40}deg`, opacity: interpolate(t, [0, 30], [1, 0], cl) }} />;
          })}
        <div style={{ position: "absolute", left: sx, top: sy }}>
          {f < jumpAt ? (
            <Clip name="run" frames={36} loop trail={2} style={{ left: 0, top: 0, width: 640, height: 640 }} />
          ) : (
            <Clip name="jump" frames={45} offset={8} trail={3} speed={1.2} style={{ left: 0, top: 0, width: 640, height: 640 }} />
          )}
        </div>
        {f >= jumpAt && <SpeedLines opacity={0.5} cx={sx + 320} cy={sy + 300} />}
        <Flash at={flash} dur={20} />
        <Vig s={0.8} />
      </AbsoluteFill>
    </Cam>
  );
};

// 53-60s: bình minh trên đỉnh, ăn mừng, thẻ kết.
export const Finale: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const card = 120; // 57.0s
  const sunUp = interpolate(f, [0, 110], [90, 0], { ...cl, easing: easeOut });
  const c = spring({ frame: f - card, fps, config: { damping: 13 } });
  const fade = interpolate(f, [195, 210], [1, 0], cl);
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <Cam zoom={[[0, 1.12], [card, 1.0]]}>
        <AbsoluteFill style={{ background: "linear-gradient(#25203f 0%, #6b3a5a 50%, #e0874e 100%)" }}>
          <Glow x={1380} y={760 + sunUp} r={560} color="rgba(255,210,140,.65)" />
          <div style={{ position: "absolute", left: 1270, top: 650 + sunUp, width: 220, height: 220, borderRadius: "50%", background: "#ffd59a", boxShadow: "0 0 90px rgba(255,200,120,.85)" }} />
          <svg style={{ position: "absolute", inset: 0 }} width={1920} height={1080}>
            <path d="M0 820 Q400 700 800 790 T1920 760 L1920 1080 L0 1080 Z" fill="#3a2440" />
            <path d="M0 900 Q300 860 620 760 Q760 720 900 770 Q1300 900 1920 880 L1920 1080 L0 1080 Z" fill="#160f1c" />
          </svg>
          <Clip name="celebrate" frames={78} speed={1.1} loop style={{ left: 760 - 380, top: 770 - 660, width: 760, height: 760 }} />
          <Emote kind="sparkle" x={980} y={170} at={20} />
          <Emote kind="sparkle" x={560} y={260} at={34} size={0.7} />
          <Emote kind="sparkle" x={1040} y={320} at={52} size={0.5} />
          <div style={{ position: "absolute", left: 1660, top: 905, rotate: "-14deg", opacity: 0.9 }}><Monster size={56} glow={0.1} grin={0.1} t={f} /></div>
        </AbsoluteFill>
      </Cam>
      <AbsoluteFill style={{ background: C.bg, opacity: c * 0.95 }} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: c, scale: String(0.85 + 0.15 * c) }}>
        <div style={{ fontFamily: anton, fontSize: 230, color: C.text, letterSpacing: 6, lineHeight: 1 }}>START NOW.</div>
        <svg width={1000} height={44} style={{ marginTop: 10 }}>
          <path d="M10 24 Q 250 6 500 24 T 990 20" stroke={C.orange} strokeWidth={12} fill="none" strokeLinecap="round" strokeDasharray={1100} strokeDashoffset={1100 * (1 - interpolate(f - card, [4, 26], [0, 1], { ...cl, easing: easeOut }))} />
        </svg>
        <div style={{ marginTop: 26, fontFamily: anton, fontSize: 56, color: C.dim, letterSpacing: 6, opacity: interpolate(f - card, [16, 28], [0, 1], cl) }}>
          DAY <span style={{ color: C.orange }}>1</span> IS TODAY
        </div>
      </AbsoluteFill>
      <Vig s={0.5} />
    </AbsoluteFill>
  );
};
