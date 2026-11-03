"""Hiệu ứng âm thanh tự tổng hợp: whoosh, rung điện thoại, thì thầm, chớp sáng, gõ phím.

    python make_sfx.py <thư_mục_ra>
"""
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

SR = 44100
rng = np.random.default_rng(3)
out = Path(sys.argv[1] if len(sys.argv) > 1 else "sfx")
out.mkdir(parents=True, exist_ok=True)


def lp(x, fc):
    """Lọc thông thấp một cực; fc có thể là mảng (quét tần số)."""
    fc = np.broadcast_to(fc, x.shape)
    a = np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc = (1 - a[i]) * x[i] + a[i] * acc
        y[i] = acc
    return y


def write(name, x, stereo_pan=None):
    x = x / (np.max(np.abs(x)) + 1e-9) * 0.9
    if stereo_pan is None:
        st = np.stack([x, x], 1)
    else:  # pan quét từ trái sang phải
        p = np.linspace(-1, 1, len(x)) * stereo_pan
        st = np.stack([x * np.sqrt(0.5 * (1 - p)), x * np.sqrt(0.5 * (1 + p))], 1)
    sf.write(out / f"{name}.wav", st.astype(np.float32), SR)


def whoosh(dur=0.55, up=True):
    n = int(SR * dur)
    t = np.linspace(0, 1, n)
    shape = np.sin(np.pi * t) ** 2
    fc = (400 + 3600 * (t if up else 1 - t)) * (0.4 + shape)
    noise = rng.normal(0, 1, n)
    band = lp(noise, fc) - lp(noise, fc * 0.25)
    return band * shape


def buzz(dur=0.9):
    n = int(SR * dur)
    t = np.arange(n) / SR
    gate = ((t % 0.3) < 0.2).astype(float)
    tone = np.sign(np.sin(2 * np.pi * 150 * t)) * 0.4 + np.sin(2 * np.pi * 300 * t)
    return lp(tone * gate, 900) * np.exp(-t * 0.8)


def whisper(dur=1.6):
    """Tiếng 'xì xào' không thành chữ cho quái vật điện thoại."""
    n = int(SR * dur)
    t = np.arange(n) / SR
    noise = rng.normal(0, 1, n)
    syll = (np.sin(2 * np.pi * 5.5 * t + 1.5 * np.sin(2 * np.pi * 0.7 * t)) > 0.2).astype(float)
    syll = lp(syll, 30)
    formant = lp(noise, 3000) - lp(noise, 1200)
    low = np.sin(2 * np.pi * (70 + 8 * np.sin(2 * np.pi * 3 * t)) * t) * 0.25
    return (formant * syll + low * syll) * np.minimum(1, t / 0.1) * np.minimum(1, (dur - t) / 0.3)


def flash(dur=2.5):
    n = int(SR * dur)
    t = np.arange(n) / SR
    noise = rng.normal(0, 1, n)
    shimmer = (noise - lp(noise, 5000)) * np.exp(-t * 2.5)
    bell = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * (1.5 + k)) / (k + 1)
               for k, f in enumerate([880, 1320, 1760, 2640]))
    return shimmer * 0.6 + bell * 0.5


def typing(dur=2.4, rate=9.0):
    n = int(SR * dur)
    x = np.zeros(n)
    tt = 0.0
    while tt < dur - 0.05:
        i = int(tt * SR)
        m = int(SR * 0.03)
        k = np.arange(m) / SR
        click = rng.normal(0, 1, m) * np.exp(-k * 260) + np.sin(2 * np.pi * rng.uniform(1800, 2600) * k) * np.exp(-k * 400) * 0.5
        x[i:i + m] += click[: n - i] * rng.uniform(0.5, 1.0)
        tt += rng.exponential(1 / rate) + 0.04
    return x - lp(x, 600)


write("whoosh", whoosh(0.55), stereo_pan=0.8)
write("whoosh_down", whoosh(0.7, up=False), stereo_pan=-0.8)
write("buzz", buzz())
write("whisper", whisper())
write("flash", flash())
write("typing", typing())


def alarm(dur=1.6):
    n = int(SR * dur)
    t = np.arange(n) / SR
    gate = ((t % 0.25) < 0.16).astype(float)
    tone = np.sign(np.sin(2 * np.pi * 2100 * t)) * 0.5 + np.sin(2 * np.pi * 4200 * t) * 0.3
    return lp(tone * gate, 6000) * 0.8


def rustle(dur=0.9):
    n = int(SR * dur)
    t = np.linspace(0, 1, n)
    nz = rng.normal(0, 1, n)
    am = lp(np.abs(rng.normal(0, 1, n)), 12) * 4
    return (lp(nz, 3000) - lp(nz, 500)) * am * np.sin(np.pi * t)


def page(dur=0.35):
    n = int(SR * dur)
    t = np.linspace(0, 1, n)
    nz = rng.normal(0, 1, n)
    return (nz - lp(nz, 1500 + 3000 * t)) * np.sin(np.pi * t) ** 0.6 * np.exp(-t * 2)


def rain(dur=3.0):
    n = int(SR * dur)
    nz = rng.normal(0, 1, n)
    drops = (rng.uniform(0, 1, n) > 0.9993) * rng.uniform(0.5, 1, n)
    d = np.convolve(drops, np.exp(-np.arange(200) / 30), "same")
    return (lp(nz, 5000) - lp(nz, 800)) * 0.35 + (d - lp(d, 2000)) * 2


def thunder(dur=3.0):
    n = int(SR * dur)
    t = np.arange(n) / SR
    nz = rng.normal(0, 1, n)
    crack = (nz - lp(nz, 3000)) * np.exp(-t * 18)
    rumble = lp(nz, 120) * 8 * np.exp(-t * 1.2) * (1 + 0.5 * np.sin(2 * np.pi * 3 * t))
    return crack * 0.6 + rumble


def growl(dur=1.4):
    n = int(SR * dur)
    t = np.arange(n) / SR
    f = 55 + 12 * np.sin(2 * np.pi * 6 * t)
    buzz = np.tanh(3 * np.sin(2 * np.pi * np.cumsum(f) / SR)) * (1 + 0.5 * rng.normal(0, 1, n))
    return lp(buzz, 900) * np.minimum(1, t / 0.1) * np.minimum(1, (dur - t) / 0.4)


def swish(dur=0.25):
    return whoosh(dur)


write("alarm", alarm())
write("rustle", rustle())
write("page", page())
write("rain", rain())
write("thunder", thunder())
write("growl", growl())
write("swish", swish(), stereo_pan=0.9)

print("ok", sorted(p.name for p in out.glob("*.wav")))
