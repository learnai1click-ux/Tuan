"""Chuẩn bị BVH CMU (repo una-dinosauria/cmu-mocap) cho AnimatedDrawings.

    python prep_cmu.py <thư_mục_cmu_data> <thư_mục_ra> 02_03:inplace 13_17 ...

Ghi <ra>/<id>.bvh (tuỳ chọn ":inplace" khoá dịch chuyển ngang X/Z của hông để chạy/đi tại chỗ)
và <ra>/<id>.yaml (cấu hình motion cho AnimatedDrawings). Retarget dùng configs/cmu_retarget.yaml.
"""
import sys
from pathlib import Path

import yaml

src, out = Path(sys.argv[1]), Path(sys.argv[2])
out.mkdir(parents=True, exist_ok=True)

for spec in sys.argv[3:]:
    mid, _, opt = spec.partition(":")
    subj = mid.split("_")[0].zfill(3)
    lines = (src / subj / f"{mid}.bvh").read_text().splitlines()
    m = next(i for i, l in enumerate(lines) if l.strip().startswith("Frame Time"))
    root_ch = next(l for l in lines if "CHANNELS" in l).split()[2:]
    xi, zi = root_ch.index("Xposition"), root_ch.index("Zposition")
    if opt == "inplace":
        first = lines[m + 1].split()
        x0, z0 = first[xi], first[zi]
        for i in range(m + 1, len(lines)):
            v = lines[i].split()
            if len(v) > zi:
                v[xi], v[zi] = x0, z0
                lines[i] = " ".join(v)
    (out / f"{mid}.bvh").write_text("\n".join(lines) + "\n")
    n = int(next(l for l in lines if l.startswith("Frames:")).split()[1])
    cfg = {"filepath": str((out / f"{mid}.bvh").resolve()), "start_frame_idx": 0, "end_frame_idx": n,
           "groundplane_joint": "LeftFoot",
           "forward_perp_joint_vectors": [["LeftShoulder", "RightShoulder"], ["LeftUpLeg", "RightUpLeg"]],
           "scale": 0.056, "up": "+y"}
    (out / f"{mid}.yaml").write_text(yaml.safe_dump(cfg, sort_keys=False))
    print(mid, opt or "-", n, "frames")
