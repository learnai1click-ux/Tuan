import { continueRender, delayRender, staticFile } from "remotion";
import faces from "./fonts.json";

// Font tải sẵn trong public/fonts (OFL): Chromium dựng hình không tin chứng chỉ proxy
// nên không lấy trực tiếp từ fonts.gstatic.com được.
const handle = delayRender("Nạp font cục bộ");
Promise.all(
  faces.map((f) => {
    const face = new FontFace(f.family, `url(${staticFile(`fonts/${f.file}`)}) format("woff2")`, {
      weight: f.weight,
      unicodeRange: f.unicodeRange,
    });
    document.fonts.add(face);
    return face.load();
  }),
).then(() => continueRender(handle));

export const hand = "'Patrick Hand', sans-serif";
export const title = "'Baloo 2', sans-serif";

export const C = {
  bg: "#0c0c11",
  bg2: "#15141c",
  floor: "#2a2833",
  line: "#605c6a",
  body: "#ECE6DA",
  ink: "#1b1b1f",
  text: "#F4F1EA",
  dim: "#8d8899",
  orange: "#FF8A3D",
  orangeDark: "#D66220",
  red: "#FF4D5E",
  purple: "#8B5CF6",
  blue: "#5EA8FF",
  green: "#4ADE80",
  gold: "#FFC857",
};

export const FPS = 30;
export const sec = (s: number) => Math.round(s * FPS);
