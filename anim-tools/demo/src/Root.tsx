import { Composition } from "remotion";
import { Demo, DURATION } from "./Demo";
import { FPS } from "./theme";

export const RemotionRoot: React.FC = () => (
  <Composition id="Demo" component={Demo} durationInFrames={DURATION} fps={FPS} width={1920} height={1080} />
);
