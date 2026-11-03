import React from "react";
import { AbsoluteFill, interpolate, Sequence, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import { C, FPS, sec } from "../theme";
import vo from "./voiceover.json";
import { Grain } from "../components/common";
import { Punchline } from "./fx";
import { SceneAlarm, SceneBottom, SceneDecision, SceneExcuses } from "./ScenesA";
import { Montage, SHOTS } from "./ScenesB";
import { Climax, Finale } from "./ScenesC";

export const DURATION_EN = sec(60);

// Mốc cảnh (giây); nhạc trong anim-tools/scripts/make_music_en.py dựng theo cùng các mốc này.
const SCENES: [number, number, React.FC][] = [
  [0, 7, SceneAlarm],
  [7, 15, SceneExcuses],
  [15, 22, SceneBottom],
  [22, 27, SceneDecision],
  [27, 47, Montage],
  [47, 53, Climax],
  [53, 60, Finale],
];

// Từ khoá tô màu và cỡ chữ riêng cho từng câu.
const STYLE: Record<string, { keys: string[]; size?: number; top?: number; hide?: boolean; hold?: number }> = {
  e01: { keys: ["promise"] }, e02: { keys: ["tomorrow"] }, e03: { keys: ["louder"] },
  e04: { keys: ["nothing"] }, e05: { keys: ["truth"] }, e06: { keys: ["motivation"] },
  e07: { keys: ["decisions"], size: 140, top: 300, hold: 6 }, e08: { keys: ["today"], size: 110, top: 120 },
  e09: { keys: ["up"], size: 150, top: 90 }, e10: { keys: ["easy"] }, e11: { keys: ["waiting"] },
  e12: { keys: ["rep", "page", "mile"], size: 96 }, e13: { keys: ["hurts", "going"] },
  e14: { keys: ["nobody's"] }, e15: { keys: ["going"], size: 120 }, e16: { keys: ["one", "day"], hold: 2 },
  e17: { keys: ["reach"], size: 110 }, e18: { keys: ["new", "day"] }, e19: { keys: [], hide: true },
};

type S = [number, string, number];
const steps = (a: number, b: number, every: number, vol = 0.35): S[] => {
  const out: S[] = [];
  for (let t = a, i = 0; t < b; t += every, i++) out.push([t, i % 2 ? "step2" : "step1", vol]);
  return out;
};
const cuts: S[] = SHOTS.flatMap(([from]) => [[27 + from / FPS, "swish", 0.45], [27 + from / FPS + 0.03, "tick", 0.6]] as S[]);

const SFX: S[] = [
  // báo thức
  [0.15, "alarm", 0.45], [1.33, "slam", 0.9], [4.0, "rustle", 0.6], [5.0, "swish", 0.4], [6.2, "pop", 0.6], [6.2, "whoosh", 0.4],
  // viện cớ
  ...[7.0, 8.6, 10.2, 11.8, 13.4].flatMap((t) => [[t, "whoosh_down", 0.4], [t + 0.03, "tick", 0.6]] as S[]),
  [7.27, "pop_in", 0.4], [7.33, "whisper", 0.5], [8.8, "pop_in", 0.4], [8.85, "whisper", 0.5], [10.33, "pop_in", 0.4], [10.4, "whisper", 0.5],
  ...steps(11.9, 13.3, 0.42, 0.25), [13.47, "growl", 0.55], [13.5, "whisper", 0.6],
  // quyết định
  [22.0, "alarm", 0.55], [23.0, "swish", 0.5], [23.2, "pop", 0.5], [24.0, "punch", 1.0], [24.02, "whoosh_down", 0.5], [24.2, "shatter", 0.5],
  // montage
  ...cuts,
  ...steps(27.0, 29.0, 0.28), [30.0, "typing", 0.5], [31.6, "punch2", 0.7], [33.0, "clang", 0.6], [33.7, "page", 0.8],
  ...steps(34.7, 36.2, 0.26), [36.2, "rain", 0.45], [38.0, "rain", 0.3], ...steps(36.2, 38.6, 0.28, 0.3), [37.2, "thunder", 0.6],
  [38.6, "growl", 0.6], [39.13, "punch", 1.0], [39.15, "whoosh_down", 0.5], [39.2, "shatter", 0.5],
  [40.0, "typing", 0.3], ...steps(42.0, 44.0, 0.24, 0.4),
  ...[44.0, 44.27, 44.53, 44.8, 45.07, 45.33].map((t) => [t, "swish", 0.35] as S), [45.5, "powerup", 0.6], [45.5, "flash", 0.5],
  // cao trào + kết
  [47.4, "growl", 0.7], ...steps(47.0, 50.2, 0.25, 0.35), [50.2, "whoosh", 0.7], [50.2, "punch2", 0.6], [52.0, "flash", 0.8], [52.0, "shatter", 0.7],
  [53.2, "powerup", 0.4], [57.0, "whoosh", 0.4], [57.05, "pop_in", 0.45],
];

const lines = vo as { id: string; at: number; text: string; file: string; duration: number }[];

const musicVolume = (f: number) => {
  const t = f / FPS;
  let duck = 0;
  for (const l of lines) duck = Math.max(duck, interpolate(t, [l.at - 0.2, l.at, l.at + l.duration, l.at + l.duration + 0.35], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  return 0.9 - 0.52 * duck;
};

export const Motivation: React.FC = () => (
  <AbsoluteFill style={{ background: C.bg }}>
    {SCENES.map(([a, b, Scene]) => (
      <Sequence key={a} from={sec(a)} durationInFrames={sec(b - a)} name={Scene.name}>
        <Scene />
      </Sequence>
    ))}
    {lines.map((l) => {
      const st = STYLE[l.id] ?? { keys: [] };
      return (
        <Sequence key={l.id} from={sec(l.at)} durationInFrames={sec(l.duration + 1.0)} name={`VO ${l.id}`}>
          {!st.hide && <Punchline text={l.text} duration={sec(l.duration)} keys={st.keys} size={st.size} top={st.top} hold={st.hold} />}
          <Audio src={staticFile(`en/audio/vo/${l.file}`)} volume={1} />
        </Sequence>
      );
    })}
    <Audio src={staticFile("en/audio/music.wav")} volume={musicVolume} />
    {SFX.map(([t, name, v], i) => (
      <Sequence key={i} from={Math.round(t * FPS)} durationInFrames={sec(3)} name={`SFX ${name}`} layout="none">
        <Audio src={staticFile(`en/audio/sfx/${name}.wav`)} volume={v} />
      </Sequence>
    ))}
    <Grain />
  </AbsoluteFill>
);
