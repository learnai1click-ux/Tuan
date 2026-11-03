"""Nhạc nền kiểu trailer truyền động lực (60 giây, 120 BPM), tổng hợp bằng numpy.

    python make_music_en.py out.wav

Mốc khớp với demo/src/en/timeline.ts:
   0-15s  piano Rê thứ + tiếng tích tắc đồng hồ (lặp lại, trì trệ)
  15-22s  dây (strings) buồn, tiếng tim đập 19-21s
  22-27s  dâng lên: trống tom, dây leo cao, lặng 26.6-27s
  27s     DROP: braam + trống lớn
  27-44s  trống trailer, bass, arpeggio, nhấn ở mỗi cú cắt
  44-47s  cuộn trống, dâng mạnh
  47-52s  cao trào: tom dồn, hợp xướng tổng hợp
  52s     tiếng nổ lớn (chớp trắng)
  52-60s  Rê trưởng / Fa trưởng sáng, kết nhẹ
"""
import sys

import numpy as np
import soundfile as sf

SR = 44100
DUR = 60.0
BEAT = 0.5
N = int(SR * DUR)
rng = np.random.default_rng(11)
L = np.zeros(N)
R = np.zeros(N)


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def add(sig, t0, pan=0.0, gain=1.0):
    i = int(t0 * SR)
    if i >= N or i < 0:
        return
    sig = sig[: N - i] * gain
    L[i:i + len(sig)] += sig * np.sqrt(0.5 * (1 - pan))
    R[i:i + len(sig)] += sig * np.sqrt(0.5 * (1 + pan))


def lp(x, fc):
    fc = np.broadcast_to(np.asarray(fc, float), x.shape)
    a = np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc = (1 - a[i]) * x[i] + a[i] * acc
        y[i] = acc
    return y


def env(n, a, r, hold):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.clip(1 - (t - hold) / r, 0, 1)


def piano(note, dur, vel=0.5):
    n = int(SR * (dur + 1.6))
    t = np.arange(n) / SR
    f = midi(note)
    s = sum((1 / k ** 1.6) * np.sin(2 * np.pi * f * k * (1 + 0.0008 * k * k) * t) * np.exp(-t * (1.0 + 0.9 * k)) for k in range(1, 9))
    s *= np.minimum(1, t / 0.004) * np.where(t > dur, np.exp(-(t - dur) * 5), 1)
    return s * vel


def saw(f, t, det=0.0):
    ph = (f * 2 ** (det / 12) * t + rng.uniform()) % 1.0
    return 2 * ph - 1


def strings(notes, dur, vel=0.2, bright=2500, a=0.8):
    n = int(SR * (dur + 1.2))
    t = np.arange(n) / SR
    s = np.zeros(n)
    for nt in notes:
        for det in (-0.09, 0.0, 0.08):
            s += saw(midi(nt), t, det) * (1 + 0.004 * np.sin(2 * np.pi * 5.2 * t))
    s = lp(s / (len(notes) * 3), bright)
    return s * env(n, a, 1.0, dur) * vel


def braam(note, dur=3.0, vel=0.6):
    n = int(SR * dur)
    t = np.arange(n) / SR
    s = sum(saw(midi(note + o), t, d) for o in (0, 12, 19) for d in (-0.15, 0.0, 0.14))
    s = lp(s / 9, 200 + 1800 * np.exp(-t * 1.2))
    return np.tanh(2.5 * s) * env(n, 0.02, dur * 0.9, 0.05) * vel


def kick(vel=0.9):
    n = int(SR * 0.5)
    t = np.arange(n) / SR
    ph = 2 * np.pi * np.cumsum(42 + 120 * np.exp(-t * 26)) / SR
    return (np.sin(ph) * np.exp(-t * 6) + rng.normal(0, 1, n) * np.exp(-t * 400) * 0.3) * vel


def snare(vel=0.45):
    n = int(SR * 0.35)
    t = np.arange(n) / SR
    nz = rng.normal(0, 1, n)
    nz = nz - lp(nz, 1500)
    return (nz * np.exp(-t * 14) * 0.9 + np.sin(2 * np.pi * 180 * t) * np.exp(-t * 28) * 0.6) * vel


def tom(note=45, vel=0.6):
    n = int(SR * 0.9)
    t = np.arange(n) / SR
    f0 = midi(note)
    ph = 2 * np.pi * np.cumsum(f0 * (1 + 0.6 * np.exp(-t * 18))) / SR
    body = np.sin(ph) * np.exp(-t * 4.5)
    skin = lp(rng.normal(0, 1, n), 1200) * np.exp(-t * 30) * 0.8
    return np.tanh(1.8 * (body + skin)) * vel


def hat(vel=0.1):
    n = int(SR * 0.05)
    nz = rng.normal(0, 1, n)
    return (nz - lp(nz, 7500)) * np.exp(-np.arange(n) / SR * 80) * vel


def tick(vel=0.12):
    n = int(SR * 0.03)
    t = np.arange(n) / SR
    return np.sin(2 * np.pi * 3200 * t) * np.exp(-t * 300) * vel


def heartbeat(vel=0.7):
    n = int(SR * 0.7)
    t = np.arange(n) / SR
    thump = lambda d: np.sin(2 * np.pi * 52 * (t - d)) * np.exp(-np.clip(t - d, 0, None) * 18) * (t >= d)
    return (thump(0) + 0.7 * thump(0.22)) * vel


def riser(dur, vel=0.4):
    n = int(SR * dur)
    x = np.arange(n) / n
    nz = rng.normal(0, 1, n)
    return ((nz - lp(nz, 300 + 5000 * x)) * 0.5 + np.sin(2 * np.pi * np.cumsum(150 + 1500 * x ** 2) / SR) * 0.3) * x ** 2 * vel


def impact(vel=1.0, dur=4.0):
    n = int(SR * dur)
    t = np.arange(n) / SR
    boom = np.sin(2 * np.pi * np.cumsum(30 + 100 * np.exp(-t * 6)) / SR) * np.exp(-t * 1.0)
    nz = rng.normal(0, 1, n)
    crash = (nz - lp(nz, 2500)) * np.exp(-t * 2.0) * 0.4
    return np.tanh(1.6 * (boom + crash)) * vel


def choir(notes, dur, vel=0.15):
    n = int(SR * (dur + 1.0))
    t = np.arange(n) / SR
    s = np.zeros(n)
    for nt in notes:
        for det in (-0.12, 0.0, 0.1):
            ph = 2 * np.pi * midi(nt) * 2 ** (det / 12) * t
            s += np.sin(ph) + 0.5 * np.sin(2 * ph) + 0.3 * np.sin(3 * ph) + 0.2 * np.sin(5 * ph)
    s = (lp(s, 2200) - lp(s, 400)) / (len(notes) * 3)
    return s * env(n, 0.7, 1.0, dur) * vel


DM, BB, F, C = [62, 65, 69], [58, 62, 65], [53, 57, 60], [60, 64, 67]
PROG = [DM, BB, F, C]

# ── 0-15s: piano lặp + tích tắc ──────────────────────────────────────────
for bar in range(8):
    t0 = bar * 2.0
    ch = PROG[bar % 4]
    for i, nt in enumerate([ch[0], ch[1], ch[2], ch[1]] * 2):
        add(piano(nt, 0.22, vel=0.2 if i % 4 == 0 else 0.13), t0 + i * 0.25, pan=-0.2 + 0.1 * (i % 4))
    add(piano(ch[0] - 24, 1.9, vel=0.22), t0)
    for b in range(4):
        add(tick(0.10 if b % 2 == 0 else 0.06), t0 + b * BEAT, pan=0.4)
add(strings([50, 57], 15.0, vel=0.06, bright=700, a=4.0), 0.0)

# ── 15-22s: dây buồn, tim đập ────────────────────────────────────────────
for i, ch in enumerate([DM, BB, F, [57, 61, 64]]):
    add(strings([n - 12 for n in ch] + [ch[2]], 1.75, vel=0.16, bright=1800, a=0.6), 15.0 + i * 1.75)
for tt, n in [(15.5, 74), (17.0, 72), (18.5, 69), (20.0, 70)]:
    add(piano(n, 1.2, vel=0.18), tt, pan=0.25)
for tt in (19.0, 19.8, 20.6, 21.4):
    add(heartbeat(0.55), tt)

# ── 22-27s: dâng lên ─────────────────────────────────────────────────────
add(riser(4.5, vel=0.42), 22.0)
add(strings([50, 57, 62, 69], 4.4, vel=0.2, bright=3000, a=2.5), 22.0)
for k, tt in enumerate(np.arange(22.0, 26.5, 0.5)):
    add(tom(40 + (k % 3) * 3, vel=0.25 + 0.06 * k), tt, pan=-0.3 + 0.2 * (k % 4))
for tt in np.arange(25.5, 26.5, 0.125):
    add(snare(0.18 + 0.2 * (tt - 25.5)), tt)

# ── 27-44s: drop + trống trailer ─────────────────────────────────────────
add(braam(38, 3.5, 0.65), 27.0)
add(impact(0.9), 27.0)
for bar in range(8):  # 27..43
    t0 = 27.0 + bar * 2.0
    ch = PROG[bar % 4]
    add(strings(ch + [ch[0] + 12], 2.0, vel=0.12, bright=3500, a=0.15), t0)
    for b in range(4):
        tb = t0 + b * BEAT
        add(kick(0.85 if b in (0, 2) else 0.5), tb)
        if b in (1, 3):
            add(snare(0.45), tb, pan=0.05)
        add(hat(0.09), tb + 0.25, pan=0.4)
        for e in range(4):
            add(strings([ch[0] - 24], 0.11, vel=0.10, bright=600, a=0.005), tb + e * 0.125)
    for s16 in range(16):
        arp = [ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[1] + 24]
        add(piano(arp[s16 % 4], 0.1, vel=0.09), t0 + s16 * 0.125, pan=-0.45 + 0.9 * (s16 % 2))
    if bar % 2 == 1:
        add(tom(38, 0.5), t0 + 1.5)
        add(tom(41, 0.45), t0 + 1.75)
add(braam(41, 3.0, 0.5), 35.0)
# nhấn ở các cú cắt montage
for tt in (29.0, 30.0, 31.4, 32.4, 33.6, 34.7, 36.2, 38.6, 40.0, 42.0):
    add(tom(36, 0.4), tt)

# ── 44-47s: cuộn trống, dâng mạnh ────────────────────────────────────────
add(riser(3.0, vel=0.5), 44.0)
add(strings([62, 69, 74], 3.0, vel=0.18, bright=4000, a=1.5), 44.0)
t, step = 44.0, 0.25
while t < 46.9:
    add(snare(0.2 + 0.12 * (t - 44.0)), t)
    step = max(0.0625, step * 0.93)
    t += step

# ── 47-52s: cao trào ─────────────────────────────────────────────────────
add(braam(38, 3.0, 0.6), 47.0)
add(choir([62, 65, 69, 74], 5.0, vel=0.2), 47.0)
for k, tt in enumerate(np.arange(47.0, 51.9, 0.25)):
    add(tom(36 + (k % 4) * 2, vel=0.35 + 0.02 * k), tt, pan=-0.4 + 0.27 * (k % 4))
    if k % 2 == 0:
        add(kick(0.8), tt)

# ── 52-60s: kết sáng ─────────────────────────────────────────────────────
add(impact(1.0, 5.0), 52.0)
FIN = [[62, 66, 69, 74], [58, 62, 65, 70], [65, 69, 72, 77], [62, 66, 69, 74]]
for i, ch in enumerate(FIN):
    t0 = 52.0 + i * 2.0
    add(strings(ch, 2.0 if i < 3 else 3.5, vel=0.15, bright=3500, a=0.4), t0)
    add(choir(ch[:3], 2.0 if i < 3 else 3.5, vel=0.08), t0)
    add(piano(ch[0] - 12, 1.8, vel=0.25), t0)
for tt, n in [(52.5, 78), (53.5, 81), (54.5, 79), (55.5, 77), (56.5, 78), (57.5, 74)]:
    add(piano(n, 0.9, vel=0.22), tt, pan=0.2)
add(tom(38, 0.5), 57.0)
add(impact(0.5, 3.0), 57.3)

# ── reverb + master ──────────────────────────────────────────────────────
ir_n = int(SR * 2.6)
ir_t = np.arange(ir_n) / SR
irL = rng.normal(0, 1, ir_n) * np.exp(-ir_t * 2.6)
irR = rng.normal(0, 1, ir_n) * np.exp(-ir_t * 2.6)
irL[0] = irR[0] = 0


def conv(x, ir):
    m = len(x) + len(ir)
    nfft = 1 << (m - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, nfft) * np.fft.rfft(ir, nfft), nfft)[: len(x)]


wl, wr = conv(L, irL), conv(R, irR)
k = np.max(np.abs(L)) / (np.max(np.abs(wl)) + 1e-9)
mix = np.stack([L + 0.25 * wl * k, R + 0.25 * wr * k], 1)
t = np.arange(N) / SR
mix *= np.clip((DUR - t) / 2.0, 0, 1)[:, None]
mix = np.tanh(mix / (np.max(np.abs(mix)) + 1e-9) * 1.4) * 0.89
sf.write(sys.argv[1] if len(sys.argv) > 1 else "music_en.wav", mix.astype(np.float32), SR)
print("ok")
