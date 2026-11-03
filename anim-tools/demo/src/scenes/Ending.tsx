import React from "react";
import { AbsoluteFill, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, hand, sec, title } from "../theme";
import { Monster } from "../components/Monster";
import { BigText, clamp, Clip, ease, Glow, Vignette } from "../components/common";

const FLASH = sec(5.0); // 51.0s trên timeline tổng

// Cầu thang khối sáng, quái vật khổng lồ chặn ở trên, Sáng bật nhảy xuyên qua.
export const Climax: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const grow = spring({ frame: f - 6, fps, config: { damping: 18, mass: 1.6 } });
  const jumpStart = sec(2.6);
  const shake = f > sec(3.2) && f < FLASH ? Math.sin(f * 2.3) * interpolate(f, [sec(3.2), FLASH], [2, 14], clamp) : 0;
  const climb = interpolate(f, [0, jumpStart], [0, 1], clamp);
  const flash = interpolate(f, [FLASH - 3, FLASH, FLASH + 18], [0, 1, 0], clamp);
  const shattered = f >= FLASH;
  return (
    <AbsoluteFill style={{ background: "#0a0910", translate: `${shake}px ${shake * 0.4}px` }}>
      {Array.from({ length: 9 }).map((_, i) => {
        const lit = interpolate(f, [i * 7, i * 7 + 10], [0, 1], clamp);
        return (
          <div key={i} style={{ position: "absolute", left: 80 + i * 190, top: 900 - i * 82, width: 200, height: 82 + i * 82, background: "#17151f", borderTop: `4px solid rgba(255,138,61,${0.25 + 0.75 * lit})`, boxShadow: `0 -8px 30px rgba(255,138,61,${0.25 * lit})` }} />
        );
      })}
      {!shattered && (
        <>
          <Glow x={1500} y={300} r={700 * grow} color="rgba(255,60,90,.25)" />
          <div style={{ position: "absolute", left: 1500 - 260 * (0.6 + 1.4 * grow), top: 60, scale: "1", opacity: grow }}>
            <Monster size={260 * (0.6 + 1.4 * grow)} t={f} grin={0.9} />
          </div>
          <div style={{ position: "absolute", left: 150, top: 300, fontFamily: hand, fontSize: 70, color: C.red, opacity: interpolate(f, [sec(1.7), sec(1.95), sec(2.5), sec(2.8)], [0, 1, 1, 0], clamp), textShadow: "0 0 20px rgba(255,60,90,.7)" }}>
            Bạn không làm được đâu.
          </div>
        </>
      )}
      {shattered &&
        Array.from({ length: 26 }).map((_, i) => {
          const t = f - FLASH;
          const a = (i / 26) * Math.PI * 2;
          return <div key={i} style={{ position: "absolute", left: 1500 + Math.cos(a) * t * (14 + (i % 5) * 4), top: 400 + Math.sin(a) * t * (14 + (i % 4) * 4) + t * t * 0.4, width: 26, height: 26, background: i % 2 ? "#3b1f6b" : C.red, rotate: `${t * 12 + i * 40}deg`, opacity: interpolate(t, [0, 40], [1, 0], clamp) }} />;
        })}
      {/* Sáng lấy đà rồi bật nhảy lên đỉnh cầu thang */}
      <div style={{ position: "absolute", left: 60 + climb * 260, top: 1080 - 640 - climb * 60 }}>
        {f < jumpStart ? (
          <Clip name="jump" frames={72} speed={0} style={{ width: 1138, height: 640 }} />
        ) : (
          <Sequence from={jumpStart} layout="none">
            <JumpClip />
          </Sequence>
        )}
      </div>
      <AbsoluteFill style={{ background: "#fff", opacity: flash }} />
      <Vignette strength={0.8} />
    </AbsoluteFill>
  );
};

const JumpClip: React.FC = () => {
  const f = useCurrentFrame();
  const rise = interpolate(f, [0, 60], [0, -380], { ...clamp, easing: ease });
  return (
    <div style={{ translate: `${interpolate(f, [0, 60], [0, 420], clamp)}px ${rise}px` }}>
      <Clip name="jump" frames={72} style={{ width: 1138, height: 640 }} />
    </div>
  );
};

// Bình minh trên đồi, Sáng vẫy tay, thẻ kết.
export const Finale: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const endCard = sec(4.1);
  const sunUp = interpolate(f, [0, sec(4)], [80, 0], { ...clamp, easing: ease });
  const card = spring({ frame: f - endCard, fps, config: { damping: 16 } });
  const fadeOut = interpolate(f, [sec(7.4), sec(8)], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ background: "linear-gradient(#25203f 0%, #6b3a5a 50%, #e0874e 100%)", opacity: fadeOut }}>
      <Glow x={1380} y={760 + sunUp} r={520} color="rgba(255,210,140,.65)" />
      <div style={{ position: "absolute", left: 1380 - 110, top: 650 + sunUp, width: 220, height: 220, borderRadius: "50%", background: "#ffd59a", boxShadow: "0 0 80px rgba(255,200,120,.8)" }} />
      <svg style={{ position: "absolute", inset: 0 }} width={1920} height={1080}>
        <path d="M0 820 Q400 700 800 790 T1920 760 L1920 1080 L0 1080 Z" fill="#3a2440" />
        <path d="M0 900 Q300 860 620 760 Q760 720 900 770 Q1300 900 1920 880 L1920 1080 L0 1080 Z" fill="#160f1c" />
      </svg>
      <Clip name="wave_happy" frames={126} style={{ position: "absolute", left: 560, top: 770 - 620, width: 720, height: 720, opacity: 1 - card }} />
      {/* quái vật nhỏ xíu ngủ gật ở góc */}
      <div style={{ position: "absolute", left: 1640, top: 900, opacity: 1 - card, rotate: "-12deg" }}>
        <Monster size={60} glow={0.15} grin={0.1} t={f} />
      </div>
      <AbsoluteFill style={{ background: C.bg, opacity: card * 0.96 }} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: card, scale: String(0.9 + 0.1 * card) }}>
        <BigText size={170}>NGAY HÔM NAY.</BigText>
        <svg width={900} height={40} style={{ marginTop: 6 }}>
          <path d="M10 22 Q 225 6 450 22 T 890 18" stroke={C.orange} strokeWidth={10} fill="none" strokeLinecap="round" strokeDasharray={1000} strokeDashoffset={1000 * (1 - interpolate(f - endCard, [6, 30], [0, 1], { ...clamp, easing: ease }))} />
        </svg>
        <div style={{ marginTop: 30, fontFamily: hand, fontSize: 56, color: C.dim, opacity: interpolate(f - endCard, [18, 30], [0, 1], clamp) }}>
          Bắt đầu học AI cùng <span style={{ color: C.orange, fontFamily: title, fontWeight: 800 }}>AI 1 Click</span>
        </div>
      </AbsoluteFill>
      <Vignette strength={0.5} />
    </AbsoluteFill>
  );
};
