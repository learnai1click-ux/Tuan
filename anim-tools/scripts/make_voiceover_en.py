"""Lời dẫn tiếng Anh Mỹ giọng truyền động lực: Kokoro v1.0 qua sherpa-onnx + xử lý kiểu lồng tiếng.

    envs/voice/bin/python scripts/make_voiceover_en.py demo/script_en.json out_dir \
        [--voice am_michael] [--speed 0.9] [--pitch -1.0]

Kokoro là một engine có trong VoiceStudio; ở đây dùng bản Kokoro của sherpa-onnx (tải từ GitHub
releases) vì bản VoiceStudio tải mô hình từ Hugging Face. Mỗi câu đi qua chuỗi xử lý ffmpeg:
hạ tông nhẹ (rubberband, giữ tốc độ), cắt rung thấp, tăng độ ấm và độ rõ, nén, khử xì, vang ngắn.
"""
import argparse
import json
import subprocess
from pathlib import Path

import numpy as np
import sherpa_onnx
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
ap = argparse.ArgumentParser()
ap.add_argument("script")
ap.add_argument("out")
ap.add_argument("--voice", default="am_michael")
ap.add_argument("--speed", type=float, default=0.9)
ap.add_argument("--pitch", type=float, default=-1.0, help="nửa cung")
ap.add_argument("--model", default=str(ROOT / "voices/kokoro-multi-lang-v1_0"))
a = ap.parse_args()

d = a.model
tts = sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(
    kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(
        model=f"{d}/model.onnx", voices=f"{d}/voices.bin", tokens=f"{d}/tokens.txt",
        data_dir=f"{d}/espeak-ng-data", dict_dir=f"{d}/dict", lexicon=f"{d}/lexicon-us-en.txt"),
    num_threads=4)))
names = ["af_alloy", "af_aoede", "af_bella", "af_heart", "af_jessica", "af_kore", "af_nicole", "af_nova",
         "af_river", "af_sarah", "af_sky", "am_adam", "am_echo", "am_eric", "am_fenrir", "am_liam",
         "am_michael", "am_onyx", "am_puck", "am_santa"]
sid = names.index(a.voice)

ratio = 2 ** (a.pitch / 12)
CHAIN = ",".join([
    f"rubberband=pitch={ratio:.5f}:formant=preserved",
    "highpass=f=70",
    "equalizer=f=130:t=q:w=1.0:g=3",      # ấm
    "equalizer=f=3200:t=q:w=1.2:g=2.5",   # rõ chữ
    "deesser=i=0.4",
    "acompressor=threshold=-20dB:ratio=4:attack=5:release=120:makeup=4",
    "aecho=0.85:0.5:45|90:0.18|0.10",     # vang phòng ngắn
])

out = Path(a.out)
out.mkdir(parents=True, exist_ok=True)
meta = []
for line in json.loads(Path(a.script).read_text()):
    g = tts.generate(line["text"], sid=sid, speed=a.speed)
    wav, sr = np.array(g.samples, np.float32), g.sample_rate
    idx = np.where(np.abs(wav) > 0.01)[0]
    if len(idx):
        wav = wav[max(0, idx[0] - int(0.08 * sr)): idx[-1] + int(0.12 * sr)]
    raw = out / f"{line['id']}.raw.wav"
    sf.write(raw, wav, sr)
    path = out / f"{line['id']}.wav"
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(raw), "-af", CHAIN,
                    "-ar", "48000", str(path)], check=True)
    raw.unlink()
    y, ysr = sf.read(path, dtype="float32")
    y = y / (np.max(np.abs(y)) + 1e-9) * 0.89
    sf.write(path, y, ysr)
    meta.append({**line, "file": path.name, "duration": round(len(y) / ysr, 3)})
    print(f"{line['id']} @{line['at']:>5}s  {len(y) / ysr:4.2f}s  → {line['at'] + len(y) / ysr:5.2f}  {line['text']}")

(out / "voiceover.json").write_text(json.dumps(meta, ensure_ascii=False, indent=1))
