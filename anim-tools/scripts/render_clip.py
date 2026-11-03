"""Render một nhân vật AnimatedDrawings thành chuỗi PNG nền trong suốt ở 30 fps.

Chạy từ repos/AnimatedDrawings (đường dẫn trong config tính từ đó):
    PYOPENGL_PLATFORM=osmesa ../../envs/animdraw/bin/python ../../scripts/render_clip.py \
        --char ../../characters/sang_focus/char_cfg.yaml \
        --motion examples/config/motion/jumping_jacks.yaml \
        --retarget examples/config/retarget/cmu1_pfp.yaml \
        --out ../../test-output/clip --seconds 3

Khác với bộ render gốc: ghi PNG RGBA (giữ nền trong suốt để ghép vào Remotion),
lấy mẫu lại theo fps cố định thay vì theo frame time của BVH, và cho chọn
đoạn bắt đầu/độ dài.
"""
import argparse
import json
import math
import os
import tempfile
from pathlib import Path

import yaml

ap = argparse.ArgumentParser()
ap.add_argument("--char", required=True)
ap.add_argument("--motion", required=True)
ap.add_argument("--retarget", required=True)
ap.add_argument("--out", required=True)
ap.add_argument("--fps", type=float, default=30)
ap.add_argument("--start", type=float, default=0.0, help="giây bắt đầu trong BVH")
ap.add_argument("--seconds", type=float, default=None, help="độ dài clip (mặc định: hết BVH)")
ap.add_argument("--size", type=int, nargs=2, default=[720, 720])
ap.add_argument("--camera", type=float, nargs=3, default=[0.0, 0.3, 1.8])
ap.add_argument("--camera-fwd", type=float, nargs=3, default=[0.0, 0.0, 1.0])
args = ap.parse_args()

os.environ.setdefault("PYOPENGL_PLATFORM", "osmesa")

from PIL import Image  # noqa: E402
from animated_drawings.config import Config  # noqa: E402
from animated_drawings.view.view import View  # noqa: E402
from animated_drawings.model.scene import Scene  # noqa: E402
from animated_drawings.controller import video_render_controller as vrc  # noqa: E402

out = Path(args.out)
out.mkdir(parents=True, exist_ok=True)
for old in out.glob("*.png"):
    old.unlink()


class PNGWriter(vrc.VideoWriter):
    def __init__(self, controller):
        self.n = 0

    def process_frame(self, frame):  # BGRA, đã lật đúng chiều
        rgba = frame[:, :, [2, 1, 0, 3]]
        Image.fromarray(rgba, "RGBA").save(out / f"{self.n:04d}.png", optimize=False)
        self.n += 1

    def cleanup(self):
        pass


vrc.VideoWriter.create_video_writer = staticmethod(lambda c: PNGWriter(c))

mvc = {
    "scene": {"ANIMATED_CHARACTERS": [{
        "character_cfg": args.char, "motion_cfg": args.motion, "retarget_cfg": args.retarget}]},
    "view": {"USE_MESA": True, "CLEAR_COLOR": [0.0, 0.0, 0.0, 0.0],
             "WINDOW_DIMENSIONS": list(args.size), "CAMERA_POS": args.camera,
             "CAMERA_FWD": args.camera_fwd, "DRAW_FLOOR": False, "DRAW_AD_RIG": False},
    "controller": {"MODE": "video_render", "OUTPUT_VIDEO_PATH": str(out / "x.mp4")},
}
with tempfile.NamedTemporaryFile("w", suffix=".yaml", delete=False, dir=".") as f:
    yaml.safe_dump(mvc, f)
    cfg_path = f.name
try:
    cfg = Config(cfg_path)
finally:
    os.unlink(cfg_path)

view = View.create_view(cfg.view)
scene = Scene(cfg.scene)
ctrl = vrc.VideoRenderController(cfg.controller, scene, view)
bvh = [c for c in scene.get_children() if hasattr(c, "retargeter")][0].retargeter.bvh
total = bvh.frame_max_num * bvh.frame_time
if args.start:
    scene.progress_time(args.start)
dur = args.seconds if args.seconds else total - args.start
ctrl.delta_t = 1.0 / args.fps
ctrl.frames_left_to_render = int(math.floor(dur * args.fps))
ctrl.progress_bar.total = ctrl.frames_left_to_render
ctrl.run()
meta = {"fps": args.fps, "frames": ctrl.frames_rendered, "size": args.size,
        "motion": args.motion, "bvh_seconds": total}
(out / "meta.json").write_text(json.dumps(meta, indent=1))
print(json.dumps(meta))
