import React from "react";
import { AbsoluteFill, interpolate, Sequence, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import { C, FPS, sec } from "./theme";
import vo from "./voiceover.json";
import { Caption, Grain } from "./components/common";
import { SceneAlone, SceneExcuses, SceneNight, ScenePowerOff } from "./scenes/Intro";
import { Montage, SHOT } from "./scenes/Montage";
import { Climax, Finale } from "./scenes/Ending";

export const DURATION = sec(60);

// Cảnh trên timeline tổng (giây). Nhạc trong anim-tools/scripts/make_music.py dựng theo đúng các mốc này.
const SCENES: [number, number, React.FC][] = [
  [0, 8, SceneNight],
  [8, 16, SceneExcuses],
  [16, 22, SceneAlone],
  [22, 26, ScenePowerOff],
  [26, 46, Montage],
  [46, 52, Climax],
  [52, 60, Finale],
];

// Hiệu ứng âm thanh: [giây, file, âm lượng]
const cut = (t: number): [number, string, number][] => [[t, "whoosh", 0.5], [t + 0.05, "tick", 0.7]];
const SFX: [number, string, number][] = [
  [2.0, "notify", 0.5], [3.4, "notify", 0.45], [5.2, "notify", 0.4], [6.6, "notify", 0.35],
  [8.0, "whoosh_down", 0.45], [8.05, "tick", 0.7], [8.7, "pop_in", 0.4], [8.8, "whisper", 0.55],
  [10.6, "whoosh_down", 0.45], [10.65, "tick", 0.7], [11.0, "whisper", 0.6],
  [13.3, "whoosh_down", 0.45], [13.35, "tick", 0.7], [13.7, "whisper", 0.7], [14.6, "buzz", 0.5],
  [22.3, "buzz", 0.55], [23.3, "whoosh", 0.4], [24.5, "glitch", 0.9], [24.6, "power_off", 1.0], [24.68, "shrink", 0.6],
  ...[0, 1, 2, 3, 4, 5, 6, 7].flatMap((i) => cut(26 + i * 2.5)),
  [26.2, "typing", 0.5],
  [31.13, "pop_in", 0.5], [31.35, "typing", 0.25],
  [33.6, "powerup", 0.5],
  [36.0, "pop_in", 0.45], [36.15, "whisper", 0.5], [36.1, "typing", 0.4], [37.5, "shrink", 0.6],
  [38.5, "typing", 0.55], [39.9, "success", 0.3],
  [41.0, "pop", 0.5], [41.6, "pop", 0.5], [42.2, "pop", 0.5],
  [43.95, "punch", 0.9], [44.0, "success", 0.7], [43.9, "pop", 0.5],
  [46.0, "whoosh_down", 0.35], [47.75, "whisper", 0.7], [48.6, "whoosh", 0.7], [48.65, "land", 0.6], [51.0, "flash", 0.8],
  [56.1, "whoosh", 0.4], [56.2, "pop_in", 0.45],
];

const lines = vo as { id: string; at: number; text: string; file: string; duration: number }[];

// Giảm nhạc khi có lời dẫn.
const musicVolume = (f: number) => {
  const t = f / FPS;
  let duck = 0;
  for (const l of lines) {
    duck = Math.max(duck, interpolate(t, [l.at - 0.25, l.at, l.at + l.duration, l.at + l.duration + 0.4], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  }
  return 0.85 - 0.45 * duck;
};

export const Demo: React.FC = () => (
  <AbsoluteFill style={{ background: C.bg }}>
    {SCENES.map(([a, b, S]) => (
      <Sequence key={a} from={sec(a)} durationInFrames={sec(b - a)} name={S.displayName ?? S.name}>
        <S />
      </Sequence>
    ))}
    {lines.map((l) => (
      <Sequence key={l.id} from={sec(l.at)} durationInFrames={sec(l.duration + 1.2)} name={`VO ${l.id}`}>
        {l.id !== "v11" && <Caption text={l.text} duration={sec(l.duration)} size={l.id === "v10" ? 84 : 62} />}
        <Audio src={staticFile(`audio/vo/${l.file}`)} volume={1} />
      </Sequence>
    ))}
    <Audio src={staticFile("audio/music.wav")} volume={musicVolume} />
    {SFX.map(([t, name, v], i) => (
      <Sequence key={i} from={sec(t)} durationInFrames={sec(3)} name={`SFX ${name}`} layout="none">
        <Audio src={staticFile(`audio/sfx/${name}.wav`)} volume={v} />
      </Sequence>
    ))}
    <Grain />
  </AbsoluteFill>
);

export { SHOT };
