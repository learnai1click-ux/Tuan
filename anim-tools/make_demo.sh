#!/usr/bin/env bash
# Dựng lại video demo 60 giây từ đầu: nhân vật → clip chuyển động → nhạc, SFX, lời dẫn → render.
#
#   bash anim-tools/setup.sh animdraw   # một lần
#   bash anim-tools/make_demo.sh        # ra anim-tools/demo/out/demo.mp4
#
# Cần: Node 20+, ffmpeg, Chromium (mặc định dùng Chromium của Playwright tại /opt/pw-browsers).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENVS="$ROOT/envs"
DEMO="$ROOT/demo"
PUB="$DEMO/public"
VOICESTUDIO_DIR="${VOICESTUDIO_DIR:-$ROOT/repos/VoiceStudio}"
SOUNDCN_DIR="${SOUNDCN_DIR:-$ROOT/repos/soundcn}"
VOICE="vits-piper-vi_VN-vais1000-medium"
BROWSER="${BROWSER:-$(ls /opt/pw-browsers/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell 2>/dev/null | head -1)}"
export UV_LINK_MODE=hardlink

# ── 1. Môi trường giọng nói: sherpa-onnx (engine của VoiceStudio) ────────────
[ -d "$VOICESTUDIO_DIR/.git" ] || GIT_LFS_SKIP_SMUDGE=1 git clone -q --depth 1 https://github.com/debpalash/VoiceStudio "$VOICESTUDIO_DIR"
[ -d "$SOUNDCN_DIR/.git" ] || GIT_LFS_SKIP_SMUDGE=1 git clone -q --depth 1 https://github.com/kapishdima/soundcn "$SOUNDCN_DIR"
[ -x "$ENVS/voice/bin/python" ] || uv venv -q --python 3.10 "$ENVS/voice"
# sherpa-onnx 2.0 lỗi với giọng Piper ("no frontend available"), nên giữ 1.13.x
uv pip install -q --python "$ENVS/voice/bin/python" "sherpa-onnx==1.13.8" "sherpa-onnx-core==1.13.8" \
  soundfile numpy torch==2.7.1
mkdir -p "$ROOT/voices"
if [ ! -d "$ROOT/voices/$VOICE" ]; then
  curl -sSL "https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/$VOICE.tar.bz2" | tar xj -C "$ROOT/voices"
fi

# ── 2. Nhân vật + clip AnimatedDrawings (PNG nền trong suốt) ─────────────────
"$ENVS/animdraw/bin/python" "$ROOT/scripts/make_character.py" "$ROOT/characters"
cd "$ROOT/repos/AnimatedDrawings"
M=examples/config/motion RT=examples/config/retarget CH="$ROOT/characters"
clip() { # tên texture motion retarget bắt_đầu độ_dài [tuỳ chọn]
  PYOPENGL_PLATFORM=osmesa "$ENVS/animdraw/bin/python" "$ROOT/scripts/render_clip.py" \
    --char "$CH/$2/char_cfg.yaml" --motion "$3" --retarget "$4" --out "$PUB/clips/$1" \
    --start "$5" --seconds "$6" "${@:7}" >/dev/null 2>&1
  echo "clip $1: $(ls "$PUB/clips/$1" | grep -c png) khung"
}
clip jj         sang_focus $M/jumping_jacks.yaml $RT/cmu1_pfp.yaml   0   2.6
clip jesse      sang_focus $M/jesse_dance.yaml   $RT/mixamo_fff.yaml 1.0 2.6
clip wave       sang_focus $M/wave_hello.yaml    $RT/fair1_ppf.yaml  3.0 2.6
clip momask     sang_focus "$ROOT/configs/momask_motion_template.yaml" "$ROOT/configs/momask_retarget.yaml" 0 2.6
clip dab_dance  sang_focus $M/dab.yaml           $RT/fair1_ppf.yaml  1.9 2.6
clip victory    sang_happy $M/dab.yaml           $RT/fair1_ppf.yaml  9.2 2.0
clip jump       sang_focus $M/jumping.yaml       $RT/fair1_ppf.yaml  0.3 2.4 --size 1280 720 --camera 0.6 0.3 2.4
clip wave_happy sang_happy $M/wave_hello.yaml    $RT/fair1_ppf.yaml  2.4 4.2
cd "$ROOT"

# ── 3. Âm thanh ──────────────────────────────────────────────────────────────
mkdir -p "$PUB/audio/sfx"
"$ENVS/voice/bin/python" scripts/make_music.py "$PUB/audio/music.wav"
"$ENVS/voice/bin/python" scripts/make_sfx.py "$PUB/audio/sfx" >/dev/null
K="$SOUNDCN_DIR/assets"  # bộ Kenney, giấy phép CC0
while read -r src name; do
  ffmpeg -nostdin -loglevel error -y -i "$K/$src" -ar 44100 -ac 2 "$PUB/audio/sfx/$name.wav"
done <<'EOF'
kenney_interface-sounds/glass_002.ogg notify
kenney_interface-sounds/switch_003.ogg power_off
kenney_interface-sounds/tick_002.ogg tick
kenney_interface-sounds/confirmation_002.ogg success
kenney_digital-audio/powerUp7.ogg powerup
kenney_impact-sounds/impactPunch_heavy_002.ogg punch
kenney_interface-sounds/glitch_002.ogg glitch
kenney_interface-sounds/drop_003.ogg pop
kenney_interface-sounds/maximize_006.ogg pop_in
kenney_digital-audio/phaserDown2.ogg shrink
kenney_impact-sounds/impactSoft_heavy_001.ogg land
EOF
OMNIVOICE_SHERPA_MODEL="$ROOT/voices/$VOICE" VOICESTUDIO_DIR="$VOICESTUDIO_DIR" \
  "$ENVS/voice/bin/python" scripts/make_voiceover.py demo/script.json "$PUB/audio/vo" 2>&1 | grep -v "Skip unknown"
cp "$PUB/audio/vo/voiceover.json" "$DEMO/src/voiceover.json"

# ── 4. Render ────────────────────────────────────────────────────────────────
cd "$DEMO"
[ -d node_modules ] || npm ci
npx remotion render Demo out/demo.mp4 --browser-executable="$BROWSER" --concurrency=3 --crf=18
echo "Xong: $DEMO/out/demo.mp4"
