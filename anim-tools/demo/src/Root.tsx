import { Composition } from "remotion";
import { Demo, DURATION } from "./Demo";
import { Motivation, DURATION_EN } from "./en/Motivation";
import { FPS } from "./theme";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Demo" component={Demo} durationInFrames={DURATION} fps={FPS} width={1920} height={1080} />
    <Composition id="Motivation" component={Motivation} durationInFrames={DURATION_EN} fps={FPS} width={1920} height={1080} />
  </>
);
