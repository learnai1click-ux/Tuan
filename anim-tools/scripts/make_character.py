"""Vẽ nhân vật "Sáng" (hạt đậu trắng, viền tối) cho AnimatedDrawings.

Xuất texture.png, mask.png, char_cfg.yaml cho từng biểu cảm:
    python make_character.py <thư_mục_ra>

Nhân vật đứng tư thế chữ A để AnimatedDrawings tách tay chân khỏi thân.
Toạ độ khung xương khớp với hình vẽ, nên không cần server nhận diện.
"""
import math
import sys
from pathlib import Path

import yaml
from PIL import Image, ImageDraw

W, H = 500, 720
SS = 4  # vẽ lớn gấp 4 rồi thu nhỏ để khử răng cưa

INK = (27, 27, 31, 255)
LINE = (96, 92, 106, 255)
BODY = (236, 230, 218, 255)
SCARF = (255, 138, 61, 255)
SCARF_DARK = (214, 98, 32, 255)
CHEEK = (240, 160, 150, 255)
OUTLINE = 5

J = {  # khớp xương, toạ độ ảnh (char's right = bên trái ảnh)
    "root": (250, 470), "hip": (250, 470), "torso": (250, 360), "neck": (250, 250),
    "right_shoulder": (203, 288), "right_elbow": (150, 372), "right_hand": (118, 452),
    "left_shoulder": (297, 288), "left_elbow": (350, 372), "left_hand": (382, 452),
    "right_hip": (216, 476), "right_knee": (206, 572), "right_foot": (196, 660),
    "left_hip": (284, 476), "left_knee": (294, 572), "left_foot": (304, 660),
}
PARENT = {
    "root": None, "hip": "root", "torso": "hip", "neck": "torso",
    "right_shoulder": "torso", "right_elbow": "right_shoulder", "right_hand": "right_elbow",
    "left_shoulder": "torso", "left_elbow": "left_shoulder", "left_hand": "left_elbow",
    "right_hip": "root", "right_knee": "right_hip", "right_foot": "right_knee",
    "left_hip": "root", "left_knee": "left_hip", "left_foot": "left_knee",
}
HEAD_C, HEAD_R = (250, 160), 96
LIMB = 42


def s(p):
    return (p[0] * SS, p[1] * SS)


def capsule(d, a, b, width, fill):
    d.line([s(a), s(b)], fill=fill, width=int(width * SS))
    r = width * SS / 2
    for p in (a, b):
        x, y = s(p)
        d.ellipse([x - r, y - r, x + r, y + r], fill=fill)


def limbs(d, grow, fill, names):
    for a, b in names:
        capsule(d, J[a], J[b], LIMB + grow * 2, fill)


LEGS = [("right_hip", "right_knee"), ("right_knee", "right_foot"),
        ("left_hip", "left_knee"), ("left_knee", "left_foot")]
ARMS = [("right_shoulder", "right_elbow"), ("right_elbow", "right_hand"),
        ("left_shoulder", "left_elbow"), ("left_elbow", "left_hand")]


def feet(d, grow, fill):
    for k, dx in [("right_foot", -10), ("left_foot", 10)]:
        x, y = J[k]
        d.ellipse([s((x - 30 + dx - grow, y - 18 - grow)), s((x + 30 + dx + grow, y + 20 + grow))], fill=fill)


def hands(d, grow, fill):
    for k in ("right_hand", "left_hand"):
        x, y = s(J[k]); rr = (25 + grow) * SS
        d.ellipse([x - rr, y - rr, x + rr, y + rr], fill=fill)


def torso(d, grow, fill):
    d.rounded_rectangle([s((178 - grow, 236 - grow)), s((322 + grow, 498 + grow))],
                        radius=(72 + grow) * SS, fill=fill)


def head(d, grow, fill):
    x, y = s(HEAD_C); r = (HEAD_R + grow) * SS
    d.ellipse([x - r, y - r, x + r, y + r], fill=fill)


def body_shapes(d):
    """Vẽ từng lớp (viền rồi màu) từ sau ra trước: chân, thân, tay, đầu."""
    for layer in (lambda g, f: (limbs(d, g, f, LEGS), feet(d, g, f)),
                  lambda g, f: torso(d, g, f),
                  lambda g, f: (limbs(d, g, f, ARMS), hands(d, g, f)),
                  lambda g, f: head(d, g, f)):
        layer(OUTLINE, LINE)
        layer(0, BODY)


def face(d, mood):
    cx, cy = HEAD_C
    ey = cy + 4
    if mood == "tired":
        for ex in (cx - 32, cx + 32):  # mắt khép hờ
            d.chord([s((ex - 15, ey - 12)), s((ex + 15, ey + 12))], 0, 180, fill=INK)
            d.line([s((ex - 17, ey)), s((ex + 17, ey))], fill=INK, width=5 * SS)
        d.line([s((cx - 14, cy + 44)), s((cx + 14, cy + 44))], fill=INK, width=5 * SS)
        for ex in (cx - 26, cx + 38):  # quầng thâm
            d.arc([s((ex - 16, ey + 10)), s((ex + 8, ey + 24))], 20, 160, fill=(150, 140, 160, 255), width=3 * SS)
    elif mood == "focus":
        for ex, sgn in ((cx - 32, 1), (cx + 32, -1)):
            d.ellipse([s((ex - 11, ey - 12)), s((ex + 11, ey + 12))], fill=INK)
            d.ellipse([s((ex - 3 + 3, ey - 8)), s((ex + 3 + 3, ey - 2))], fill=(255, 255, 255, 255))
            d.line([s((ex - 18, ey - 30 - 6 * sgn)), s((ex + 18, ey - 30 + 6 * sgn))], fill=INK, width=6 * SS)
        d.arc([s((cx - 18, cy + 30)), s((cx + 18, cy + 52))], 15, 165, fill=INK, width=5 * SS)
    else:  # happy
        for ex in (cx - 32, cx + 32):
            d.arc([s((ex - 15, ey - 12)), s((ex + 15, ey + 10))], 200, 340, fill=INK, width=6 * SS)
        d.chord([s((cx - 24, cy + 26)), s((cx + 24, cy + 62))], 0, 180, fill=INK)
        for ex in (cx - 58, cx + 58):
            d.ellipse([s((ex - 13, cy + 26)), s((ex + 13, cy + 40))], fill=CHEEK)


def scarf(d):
    d.rounded_rectangle([s((186, 234)), s((314, 270))], radius=18 * SS, fill=SCARF_DARK)
    d.rounded_rectangle([s((190, 230)), s((310, 262))], radius=16 * SS, fill=SCARF)
    d.polygon([s((278, 252)), s((306, 252)), s((318, 330)), s((292, 336))], fill=SCARF)
    d.line([s((300, 300)), s((312, 300))], fill=SCARF_DARK, width=4 * SS)


def draw(mood, with_scarf):
    img = Image.new("RGBA", (W * SS, H * SS), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    body_shapes(d)
    face(d, mood)
    if with_scarf:
        scarf(d)
    img = img.resize((W, H), Image.LANCZOS)
    mask = img.split()[3].point(lambda a: 255 if a > 8 else 0)
    return img, mask


def main(out):
    out = Path(out)
    skeleton = [{"loc": list(J[k]), "name": k, "parent": PARENT[k]} for k in J]
    for name, mood, sc in [("sang_tired", "tired", False), ("sang_focus", "focus", True),
                           ("sang_happy", "happy", True)]:
        d = out / name
        d.mkdir(parents=True, exist_ok=True)
        img, mask = draw(mood, sc)
        img.save(d / "texture.png")
        mask.save(d / "mask.png")
        with open(d / "char_cfg.yaml", "w") as f:
            yaml.safe_dump({"height": H, "width": W, "skeleton": skeleton}, f, sort_keys=False)
        print("wrote", d)


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "characters")
