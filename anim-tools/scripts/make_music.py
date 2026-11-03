"""Nhạc nền 60 giây cho video demo, tổng hợp hoàn toàn bằng numpy (không dùng mẫu có bản quyền).

    python make_music.py out.wav

Cấu trúc (120 BPM, 1 ô nhịp = 2 giây), khớp với timeline trong demo/src/timeline.ts:
   0-22s  piano La thứ thưa, buồn (Am F C G)
  22-26s  âm thanh dâng lên, rồi im lặng trước khoảnh khắc "tắt"
  26-46s  trống + bass + arpeggio (montage tập luyện)
  46-51s  dồn trống, dâng mạnh
  51s     tiếng nổ lớn (chớp trắng)
  51-60s  Đô trưởng sáng, kết thúc nhẹ
"""
import sys

import numpy as np
import soundfile as sf

SR = 44100
DUR = 60.0
BPM = 120
BEAT = 60 / BPM
N = int(SR * DUR)
rng = np.random.default_rng(7)

L = np.zeros(N)
R = np.zeros(N)


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def add(sig, t0, pan=0.0, gain=1.0):
    i = int(t0 * SR)
    if i >= N:
        return
    sig = sig[: N - i] * gain
    L[i:i + len(sig)] += sig * np.sqrt(0.5 * (1 - pan))
    R[i:i + len(sig)] += sig * np.sqrt(0.5 * (1 + pan))


def env_adsr(n, a=0.005, d=0.1, s=0.7, r=0.2, hold=None):
    t = np.arange(n) / SR
    hold = hold if hold is not None else n / SR - r
    e = np.where(t < a, t / a, np.where(t < a + d, 1 - (1 - s) * (t - a) / d, s))
    rel = np.clip((t - hold) / r, 0, 1)
    return e * (1 - rel)


def lowpass(x, cutoff):
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):  # một cực, đủ nhanh cho mẫu ngắn
        acc = (1 - a) * x[i] + a * acc
        y[i] = acc
    return y


def piano(note, dur, vel=0.5):
    n = int(SR * (dur + 1.5))
    t = np.arange(n) / SR
    f = midi(note)
    s = np.zeros(n)
    for k in range(1, 9):
        detune = 1 + 0.0008 * k * k
        s += (1 / k ** 1.6) * np.sin(2 * np.pi * f * k * detune * t) * np.exp(-t * (1.2 + 0.9 * k))
    s *= np.minimum(1, t / 0.004)
    s *= np.where(t > dur, np.exp(-(t - dur) * 6), 1)
    return s * vel


def pad(notes, dur, vel=0.18):
    n = int(SR * (dur + 1.0))
    t = np.arange(n) / SR
    s = np.zeros(n)
    for note in notes:
        for det in (-0.12, 0.0, 0.11):
            f = midi(note) * 2 ** (det / 12)
            ph = 2 * np.pi * f * t + rng.uniform(0, 6.28)
            s += np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.15 * np.sin(3 * ph)
    s /= len(notes) * 3
    e = env_adsr(n, a=0.6, d=0.3, s=0.9, r=0.9, hold=dur)
    return s * e * vel


def bass(note, dur, vel=0.35):
    n = int(SR * (dur + 0.05))
    t = np.arange(n) / SR
    f = midi(note)
    s = np.tanh(2.2 * (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)))
    return s * env_adsr(n, a=0.003, d=0.08, s=0.6, r=0.05) * vel


def kick(vel=0.9):
    n = int(SR * 0.45)
    t = np.arange(n) / SR
    f = 45 + 110 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    click = rng.normal(0, 1, n) * np.exp(-t * 400) * 0.3
    return (np.sin(ph) * np.exp(-t * 7) + click) * vel


def snare(vel=0.45):
    n = int(SR * 0.3)
    t = np.arange(n) / SR
    noise = rng.normal(0, 1, n)
    noise = noise - lowpass(noise, 1800)
    tone = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30)
    return (noise * np.exp(-t * 16) * 0.8 + tone * 0.6) * vel


def hat(vel=0.12, open_=False):
    n = int(SR * (0.25 if open_ else 0.06))
    t = np.arange(n) / SR
    noise = rng.normal(0, 1, n)
    noise = noise - lowpass(noise, 7000)
    return noise * np.exp(-t * (14 if open_ else 70)) * vel


def riser(dur, vel=0.35):
    n = int(SR * dur)
    t = np.arange(n) / SR
    x = t / dur
    noise = rng.normal(0, 1, n)
    hp = noise - lowpass(noise, 300 + 6000 * x[-1])
    sweep = np.sin(2 * np.pi * np.cumsum(200 + 1400 * x ** 2) / SR)
    return (hp * 0.5 + sweep * 0.25) * x ** 2 * vel


def impact(vel=1.0):
    n = int(SR * 4.0)
    t = np.arange(n) / SR
    f = 32 + 90 * np.exp(-t * 6)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.1)
    noise = rng.normal(0, 1, n)
    crash = (noise - lowpass(noise, 2500)) * np.exp(-t * 2.2) * 0.35
    return np.tanh(1.5 * (boom + crash)) * vel


AM, F, C, G = [57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]
PROG = [AM, F, C, G]

# ── 0-22s: piano thưa, buồn ──────────────────────────────────────────────
for bar in range(11):
    t0 = bar * 2.0
    ch = PROG[bar % 4]
    add(pad([n - 12 for n in ch], 2.0, vel=0.10), t0)
    for i, n in enumerate([ch[0], ch[2], ch[1] + 12, ch[2]]):
        add(piano(n, 0.45, vel=0.32 if i == 0 else 0.22), t0 + i * 0.5, pan=(-0.3 + 0.2 * i))
    if bar % 2 == 1:  # giai điệu nhỏ
        mel = {1: 72, 3: 71, 5: 69, 7: 67, 9: 69}.get(bar, 69)
        add(piano(mel, 0.9, vel=0.20), t0 + 1.0, pan=0.25)
    add(piano(ch[0] - 24, 1.8, vel=0.25), t0)

# ── 22-26s: dâng lên rồi lặng ───────────────────────────────────────────
add(riser(2.8, vel=0.4), 22.0)
add(pad([57, 64, 69], 2.6, vel=0.16), 22.0)
add(piano(45, 3.0, vel=0.35), 22.0)

# ── 26-46s: montage có trống ────────────────────────────────────────────
add(impact(0.9), 26.0)
for bar in range(10):
    t0 = 26.0 + bar * 2.0
    ch = PROG[bar % 4]
    add(pad(ch, 2.0, vel=0.12), t0)
    for b in range(4):
        tb = t0 + b * BEAT
        add(kick(0.85), tb)
        if b in (1, 3):
            add(snare(0.42), tb, pan=0.05)
        for h in range(2):
            add(hat(0.11 if h == 0 else 0.07), tb + h * BEAT / 2, pan=0.35)
        for e in range(2):
            add(bass(ch[0] - 24, BEAT / 2 - 0.02, vel=0.30), tb + e * BEAT / 2)
    arp = [ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[1] + 24]
    for s16 in range(16):
        add(piano(arp[s16 % 4], 0.12, vel=0.12), t0 + s16 * BEAT / 4, pan=-0.4 + 0.8 * (s16 % 2))
    if bar >= 6:
        add(hat(0.08, open_=True), t0 + 1.75, pan=-0.3)

# ── 46-51s: dồn trống ───────────────────────────────────────────────────
add(riser(5.0, vel=0.45), 46.0)
for bar in range(2):
    t0 = 46.0 + bar * 2.0
    add(pad(AM if bar == 0 else G, 2.0, vel=0.14), t0)
    for b in range(4):
        add(kick(0.9), t0 + b * BEAT)
step = 0.25
t = 50.0
while t < 51.0 - 1e-6:  # cuộn trống nhanh dần
    add(snare(0.25 + 0.3 * (t - 50.0)), t)
    step = max(0.0625, step * 0.8)
    t += step
for n in (48, 52, 55):
    add(piano(n, 0.9, vel=0.18), 50.0)

# ── 51-60s: Đô trưởng sáng ──────────────────────────────────────────────
add(impact(1.0), 51.0)
FIN = [[48, 52, 55, 60], [53, 57, 60, 65], [55, 59, 62, 67], [48, 52, 55, 64]]
for i, ch in enumerate(FIN):
    t0 = 51.0 + i * 2.25
    add(pad(ch, 2.25 if i < 3 else 4.0, vel=0.16), t0)
    add(piano(ch[0] - 12, 2.0, vel=0.28), t0)
    for j, n in enumerate([ch[1] + 12, ch[2] + 12, ch[3] + 12]):
        add(piano(n, 0.6, vel=0.18), t0 + 0.25 + j * 0.5, pan=-0.2 + 0.2 * j)
for tt, n in [(52.0, 76), (53.0, 79), (54.25, 77), (55.5, 76), (56.5, 74), (57.75, 72)]:
    add(piano(n, 1.0, vel=0.24), tt, pan=0.2)

# ── reverb đơn giản (đáp ứng xung giảm dần) và master ───────────────────
ir_n = int(SR * 2.2)
ir_t = np.arange(ir_n) / SR
irL = rng.normal(0, 1, ir_n) * np.exp(-ir_t * 3.0)
irR = rng.normal(0, 1, ir_n) * np.exp(-ir_t * 3.0)
irL[0] = irR[0] = 0


def conv(x, ir):
    m = len(x) + len(ir)
    nfft = 1 << (m - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, nfft) * np.fft.rfft(ir, nfft), nfft)[: len(x)]


wetL, wetR = conv(L, irL), conv(R, irR)
wet_scale = np.max(np.abs(L)) / (np.max(np.abs(wetL)) + 1e-9)
L2 = L + 0.22 * wetL * wet_scale
R2 = R + 0.22 * wetR * wet_scale
mix = np.stack([L2, R2], axis=1)
t = np.arange(N) / SR
mix *= np.clip((DUR - t) / 2.5, 0, 1)[:, None]  # tắt dần cuối bài
mix = np.tanh(mix / (np.max(np.abs(mix)) + 1e-9) * 1.3) * 0.89
sf.write(sys.argv[1] if len(sys.argv) > 1 else "music.wav", mix.astype(np.float32), SR)
print("ok")
