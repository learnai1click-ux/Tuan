"""Tạo lời dẫn bằng engine sherpa-onnx của VoiceStudio (debpalash/VoiceStudio).

    OMNIVOICE_SHERPA_MODEL=anim-tools/voices/vits-piper-vi_VN-vais1000-medium \
    VOICESTUDIO_DIR=/home/user/debpalash/voicestudio \
        envs/voice/bin/python scripts/make_voiceover.py script.json out_dir [speed]

Gọi thẳng class SherpaOnnxBackend trong backend/services/tts_backend.py của VoiceStudio,
nên giọng đọc giống hệt khi chọn engine "Sherpa-ONNX" trong ứng dụng. Mọi engine khác của
VoiceStudio tải mô hình từ Hugging Face; engine này dùng mô hình Piper trên GitHub releases.
Ghi ra mỗi câu một file WAV và voiceover.json (thời điểm + độ dài) cho Remotion.
"""
import json
import os
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

vs = Path(os.environ.get("VOICESTUDIO_DIR", "/home/user/debpalash/voicestudio"))
sys.path.insert(0, str(vs / "backend"))
from services.tts_backend import SherpaOnnxBackend  # noqa: E402

script = json.loads(Path(sys.argv[1]).read_text())
out = Path(sys.argv[2])
speed = float(sys.argv[3]) if len(sys.argv) > 3 else 0.78
out.mkdir(parents=True, exist_ok=True)

ok, msg = SherpaOnnxBackend.is_available()
if not ok:
    sys.exit(f"VoiceStudio sherpa-onnx chưa sẵn sàng: {msg}")
tts = SherpaOnnxBackend()
print("engine:", tts.display_name, "| model:", tts.model_identity())

meta = []
for line in script:
    wav = tts.generate(line["text"], speed=speed).squeeze(0).numpy().astype(np.float32)
    sr = tts.sample_rate
    # cắt khoảng lặng đầu/cuối rồi đệm 80 ms để câu bắt đầu đúng lúc
    idx = np.where(np.abs(wav) > 0.01)[0]
    if len(idx):
        wav = wav[max(0, idx[0] - int(0.08 * sr)): idx[-1] + int(0.08 * sr)]
    wav = wav / (np.max(np.abs(wav)) + 1e-9) * 0.89
    path = out / f"{line['id']}.wav"
    sf.write(path, wav, sr)
    meta.append({**line, "file": path.name, "duration": round(len(wav) / sr, 3)})
    print(f"{line['id']} @{line['at']:>5}s  {len(wav) / sr:4.2f}s  {line['text']}")

(out / "voiceover.json").write_text(json.dumps(meta, ensure_ascii=False, indent=1))
