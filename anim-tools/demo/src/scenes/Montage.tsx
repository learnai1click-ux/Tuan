import React from "react";
import { AbsoluteFill, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, hand, sec, title } from "../theme";
import { Sang } from "../components/Sang";
import { Monster } from "../components/Monster";
import { clamp, Clip, DayCounter, Desk, ease, Floor, Glow, Vignette } from "../components/common";

export const SHOT = sec(2.5);

// Sáng gõ phím sau bàn, laptop sáng cam.
const Typing: React.FC<{ fast?: boolean; children?: React.ReactNode }> = ({ fast, children }) => {
  const f = useCurrentFrame();
  const sp = fast ? 1.7 : 1;
  const a = Math.sin(f * 0.9 * sp) * 8;
  const b = Math.sin(f * 0.9 * sp + 1.7) * 8;
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Floor y={880} />
      <Glow x={960} y={460} r={420} color="rgba(255,138,61,.28)" />
      <div style={{ position: "absolute", left: 740, top: 150 + Math.abs(Math.sin(f * 0.15)) * 4, width: 440 }}>
        <Sang mood="focus" scarf hideLegs blink={f % 70 > 66} look={0} pose={{ head: Math.sin(f / 20) * 2, rArm: [-28, -60 + a], lArm: [28, 60 + b] }} style={{ width: 440 }} />
      </div>
      <Desk x={580} y={700} screen={C.orange} lit={1} />
      {children}
      <Vignette />
    </AbsoluteFill>
  );
};

const CodeLines: React.FC<{ lines: string[] }> = ({ lines }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: 1240, top: 230, fontFamily: "monospace", fontSize: 30, color: C.orange }}>
      {lines.map((l, i) => {
        const shown = Math.max(0, Math.floor((f - i * 18) * 1.4));
        return (
          <div key={i} style={{ opacity: f > i * 18 ? 1 : 0, marginBottom: 12, textShadow: "0 0 12px rgba(255,138,61,.5)" }}>
            {l.slice(0, shown)}
            {shown < l.length && f > i * 18 ? "▌" : ""}
          </div>
        );
      })}
    </div>
  );
};

// Ngoài trời lúc bình minh.
const Dawn: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "linear-gradient(#1a1530 0%, #47284f 55%, #b5583a 100%)" }}>
      <Glow x={1500} y={760} r={420} color="rgba(255,190,110,.45)" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <div key={i} style={{ position: "absolute", left: i * 250 - 40 - ((f * 1.5) % 250), bottom: 220, width: 160 + (i % 3) * 30, height: 200 + ((i * 53) % 160), background: "#120f1c", borderRadius: "10px 10px 0 0" }} />
      ))}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 222, background: "#0d0b14" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 222, height: 3, background: C.line }} />
      {children}
      <Vignette strength={0.5} />
    </AbsoluteFill>
  );
};

const Card: React.FC<{ x: number; y: number; w: number; children: React.ReactNode; delay?: number }> = ({ x, y, w, children, delay = 4 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - delay, fps, config: { damping: 13 } });
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, padding: "26px 32px", borderRadius: 28, background: "#1c1a24", border: `3px solid ${C.line}`, boxShadow: "0 20px 60px rgba(0,0,0,.5)", scale: String(0.7 + 0.3 * s), opacity: s, fontFamily: hand, fontSize: 48, color: C.text }}>
      {children}
    </div>
  );
};

const Typewriter: React.FC<{ text: string; start?: number; cps?: number }> = ({ text, start = 10, cps = 1.1 }) => {
  const f = useCurrentFrame();
  const n = Math.max(0, Math.floor((f - start) * cps));
  return <>{text.slice(0, n)}{n < text.length && f > start ? "▌" : ""}</>;
};

const Stamp: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - 14, fps, config: { damping: 9, stiffness: 220 } });
  return (
    <div style={{ position: "absolute", left: 1150, top: 260, rotate: "-8deg", scale: String(2.2 - 1.2 * s), opacity: s, border: `8px solid ${C.green}`, borderRadius: 22, padding: "16px 34px", fontFamily: title, fontWeight: 800, fontSize: 76, color: C.green, textShadow: "0 0 24px rgba(74,222,128,.5)" }}>
      HOÀN THÀNH ✓
    </div>
  );
};

const Confetti: React.FC = () => {
  const f = useCurrentFrame();
  const cols = [C.orange, C.gold, C.green, C.blue, C.red];
  return (
    <>
      {Array.from({ length: 46 }).map((_, i) => {
        const t = Math.max(0, f - 12);
        const vx = ((i * 37) % 21) - 10;
        const vy = -18 - ((i * 13) % 12);
        const x = 960 + vx * t * 1.6;
        const y = 620 + vy * t + 0.55 * t * t;
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: 14, height: 22, background: cols[i % 5], rotate: `${t * (8 + (i % 7)) + i * 30}deg`, opacity: f > 12 ? 1 : 0, borderRadius: 3 }} />;
      })}
    </>
  );
};

const ToolOrbit: React.FC = () => {
  const f = useCurrentFrame();
  const items = ["Ảnh", "Video", "Văn bản", "Giọng nói", "Tự động"];
  return (
    <>
      {items.map((t, i) => {
        const a = (i / items.length) * Math.PI * 2 + f / 22;
        const x = 960 + Math.cos(a) * 520;
        const y = 520 + Math.sin(a) * 210;
        return (
          <div key={t} style={{ position: "absolute", left: x - 110, top: y - 40, width: 220, textAlign: "center", padding: "14px 0", borderRadius: 40, background: "#1c1a24", border: `3px solid ${[C.orange, C.blue, C.gold, C.green, C.purple][i]}`, fontFamily: hand, fontSize: 40, color: C.text, opacity: interpolate(f, [i * 3, i * 3 + 8], [0, 1], clamp), zIndex: Math.sin(a) > 0 ? 2 : 0 }}>
            {t}
          </div>
        );
      })}
    </>
  );
};

const Workflow: React.FC = () => {
  const f = useCurrentFrame();
  const nodes = [
    { x: 1180, y: 250, t: "Khách nhắn tin" },
    { x: 1420, y: 430, t: "AI trả lời" },
    { x: 1180, y: 610, t: "Lưu đơn hàng" },
  ];
  return (
    <>
      <svg style={{ position: "absolute", inset: 0 }} width={1920} height={1080}>
        {nodes.slice(1).map((n, i) => {
          const p = nodes[i];
          const k = interpolate(f, [10 + i * 18, 26 + i * 18], [0, 1], clamp);
          return <line key={i} x1={p.x + 130} y1={p.y + 40} x2={p.x + 130 + (n.x - p.x) * k} y2={p.y + 40 + (n.y - p.y) * k} stroke={C.orange} strokeWidth={6} strokeDasharray="14 10" strokeDashoffset={-f * 2} />;
        })}
      </svg>
      {nodes.map((n, i) => (
        <div key={i} style={{ position: "absolute", left: n.x, top: n.y, width: 260, padding: "18px 0", textAlign: "center", borderRadius: 20, background: "#1c1a24", border: `3px solid ${C.orange}`, fontFamily: hand, fontSize: 36, color: C.text, opacity: interpolate(f, [i * 18, i * 18 + 8], [0, 1], clamp) }}>
          {n.t}
        </div>
      ))}
    </>
  );
};

const ClipStage: React.FC<{ name: string; frames: number; x?: number; size?: number; bg?: "dark" | "dawn"; children?: React.ReactNode }> = ({ name, frames, x = 960, size = 760, bg = "dark", children }) => {
  const inner = (
    <>
      {children}
      <Clip name={name} frames={frames} style={{ position: "absolute", left: x - size / 2, top: bg === "dawn" ? 1080 - 222 - size * 0.86 : 860 - size * 0.86, width: size, height: size }} />
    </>
  );
  if (bg === "dawn") return <Dawn>{inner}</Dawn>;
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Floor y={860} />
      <Glow x={x} y={560} r={420} color="rgba(255,138,61,.16)" />
      {inner}
      <Vignette />
    </AbsoluteFill>
  );
};

const MonsterPop: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inS = spring({ frame: f, fps, config: { damping: 12 } });
  const shrink = interpolate(f, [sec(1.5), sec(2.1)], [1, 0.22], { ...clamp, easing: ease });
  return (
    <>
      <div style={{ position: "absolute", left: 1350, top: 300, opacity: inS, scale: String(shrink), transformOrigin: "bottom center" }}>
        <Monster size={260} t={f} grin={0.6} />
      </div>
      <div style={{ position: "absolute", left: 1150, top: 180, width: 700, textAlign: "center", fontFamily: hand, fontSize: 54, color: C.red, opacity: interpolate(f, [6, 14, sec(1.4), sec(1.8)], [0, 1, 1, 0], clamp) }}>
        Nghỉ một hôm đi...
      </div>
    </>
  );
};

const Progress: React.FC = () => {
  const f = useCurrentFrame();
  const k = interpolate(f, [8, SHOT - 6], [0, 0.85], { ...clamp, easing: ease });
  return (
    <Card x={1180} y={250} w={620}>
      <div style={{ marginBottom: 18 }}>Dự án: Trợ lý bán hàng AI</div>
      <div style={{ height: 34, borderRadius: 17, background: "#2b2833", overflow: "hidden" }}>
        <div style={{ width: `${k * 100}%`, height: "100%", background: `linear-gradient(90deg, ${C.orange}, ${C.gold})` }} />
      </div>
      <div style={{ marginTop: 12, fontFamily: title, fontSize: 44, color: C.gold }}>{Math.round(k * 100)}%</div>
    </Card>
  );
};

export const Montage: React.FC = () => {
  const shots: [number, React.ReactNode][] = [
    [1, <Typing key="a"><CodeLines lines={["> Bài 1: Prompt là gì?", "> Viết prompt đầu tiên", "> ✓ Xong"]} /></Typing>],
    [3, <ClipStage key="b" name="jj" frames={78} bg="dawn" />],
    [9, (
      <ClipStage key="c" name="wave" frames={78} x={640}>
        <Card x={1000} y={300} w={760}>
          <span style={{ color: C.orange }}>Chatbot: </span>
          <Typewriter text="Xin chào! Mình là trợ lý AI đầu tiên của Sáng." />
        </Card>
      </ClipStage>
    )],
    [17, <ClipStage key="d" name="jesse" frames={78}><ToolOrbit /></ClipStage>],
    [28, <Typing key="e"><MonsterPop /></Typing>],
    [40, <Typing key="f" fast><Progress /></Typing>],
    [52, <ClipStage key="g" name="momask" frames={78} x={640}><Workflow /></ClipStage>],
    [66, <ClipStage key="h" name="victory" frames={60} x={620}><Stamp /><Confetti /></ClipStage>],
  ];
  return (
    <>
      {shots.map(([day, node], i) => (
        <Sequence key={i} from={i * SHOT} durationInFrames={SHOT}>
          <Punch>{node}</Punch>
          <DayCounter day={day} color={C.orange} />
        </Sequence>
      ))}
    </>
  );
};

// Mỗi cú cắt nhún nhẹ theo nhịp trống.
const Punch: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const f = useCurrentFrame();
  const s = interpolate(f, [0, 6], [1.06, 1], { ...clamp, easing: ease });
  const beat = 1 + 0.008 * Math.max(0, Math.cos(((f % 15) / 15) * Math.PI));
  return <AbsoluteFill style={{ scale: String(s * beat) }}>{children}</AbsoluteFill>;
};
