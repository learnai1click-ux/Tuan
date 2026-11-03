#!/usr/bin/env bash
# Dựng lại video tiếng Anh Mỹ "Motivation" (60 giây) từ đầu.
#
#   bash anim-tools/setup.sh animdraw   # một lần
#   bash anim-tools/make_demo_en.sh     # ra anim-tools/demo/out/motivation.mp4
#
# Nguồn chuyển động: CMU Graphics Lab Motion Capture Database (repo una-dinosauria/cmu-mocap,
# dùng tự do) + các BVH mẫu của AnimatedDrawings. Giọng: Kokoro v1.0 (am_michael) qua sherpa-onnx.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENVS="$ROOT/envs"
DEMO="$ROOT/demo"
PUB="$DEMO/public/en"
CMU_DIR="${CMU_DIR:-$ROOT/repos/cmu-mocap}"
SOUNDCN_DIR="${SOUNDCN_DIR:-$ROOT/repos/soundcn}"
BROWSER="${BROWSER:-$(ls /opt/pw-browsers/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell 2>/dev/null | head -1)}"
MOTIONS=(02_03:inplace 91_14:inplace 111_06 13_29 79_93 79_69 54_16 13_39)

# ── 1. Dữ liệu: CMU (chỉ tải đúng file cần), Kokoro, bộ âm thanh Kenney ──────
if [ ! -d "$CMU_DIR/.git" ]; then
  git clone -q --depth 1 --filter=blob:none --no-checkout https://github.com/una-dinosauria/cmu-mocap "$CMU_DIR"
fi
paths=()
for m in "${MOTIONS[@]}"; do id="${m%%:*}"; paths+=("data/$(printf %03d "$((10#${id%%_*}))")/$id.bvh"); done
git -C "$CMU_DIR" checkout -q HEAD -- "${paths[@]}"
[ -d "$SOUNDCN_DIR/.git" ] || GIT_LFS_SKIP_SMUDGE=1 git clone -q --depth 1 https://github.com/kapishdima/soundcn "$SOUNDCN_DIR"
[ -x "$ENVS/voice/bin/python" ] || uv venv -q --python 3.10 "$ENVS/voice"
uv pip install -q --python "$ENVS/voice/bin/python" "sherpa-onnx==1.13.8" "sherpa-onnx-core==1.13.8" soundfile numpy scipy
mkdir -p "$ROOT/voices"
[ -d "$ROOT/voices/kokoro-multi-lang-v1_0" ] || curl -sSL https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/kokoro-multi-lang-v1_0.tar.bz2 | tar xj -C "$ROOT/voices"

# ── 2. Nhân vật (7 biểu cảm) + clip chuyển động ──────────────────────────────
"$ENVS/animdraw/bin/python" "$ROOT/scripts/make_character.py" "$ROOT/characters"
"$ENVS/animdraw/bin/python" "$ROOT/scripts/prep_cmu.py" "$CMU_DIR/data" "$ROOT/mocap/cmu" "${MOTIONS[@]}"
cd "$ROOT/repos/AnimatedDrawings"
CM="$ROOT/mocap/cmu" RT="$ROOT/configs/cmu_retarget.yaml" CH="$ROOT/characters"
clip() { # tên texture motion retarget bắt_đầu độ_dài tốc_độ
  PYOPENGL_PLATFORM=osmesa "$ENVS/animdraw/bin/python" "$ROOT/scripts/render_clip.py" \
    --char "$CH/$2/char_cfg.yaml" --motion "$3" --retarget "$4" --out "$PUB/clips/$1" \
    --start "$5" --seconds "$6" --speed "$7" >/dev/null 2>&1
  echo "clip $1: $(ls "$PUB/clips/$1" | grep -c png) khung"
}
clip getup_grit sang_grit  "$CM/111_06.yaml" "$RT" 1.5 10.2 2.0
clip run        sang_grit  "$CM/02_03.yaml"  "$RT" 0   1.44 1.2
clip sadwalk    sang_tired "$CM/91_14.yaml"  "$RT" 2   6    1.2
clip jj         sang_focus "$CM/13_29.yaml"  "$RT" 0   3    1.4
clip lift       sang_grit  "$CM/79_93.yaml"  "$RT" 2.5 6    2.0
clip celebrate  sang_happy "$CM/79_69.yaml"  "$RT" 0.8 3.4  1.3
clip hero       sang_focus "$CM/54_16.yaml"  "$RT" 20  5    1.5
clip jump       sang_shout "$CM/13_39.yaml"  "$RT" 0.9 1.5  1.0
clip kick       sang_shout examples/config/motion/jesse_dance.yaml examples/config/retarget/mixamo_fff.yaml 1.0 2.6 1.5
cd "$ROOT"

# ── 3. Âm thanh ──────────────────────────────────────────────────────────────
mkdir -p "$PUB/audio/sfx"
"$ENVS/voice/bin/python" scripts/make_music_en.py "$PUB/audio/music.wav"
"$ENVS/voice/bin/python" scripts/make_sfx.py "$PUB/audio/sfx" >/dev/null
K="$SOUNDCN_DIR/assets"  # Kenney, CC0
while read -r src name; do
  ffmpeg -nostdin -loglevel error -y -i "$K/$src" -ar 44100 -ac 2 "$PUB/audio/sfx/$name.wav"
done <<'EOF'
kenney_interface-sounds/tick_002.ogg tick
kenney_digital-audio/powerUp7.ogg powerup
kenney_impact-sounds/impactPunch_heavy_002.ogg punch
kenney_impact-sounds/impactPunch_heavy_004.ogg punch2
kenney_impact-sounds/impactWood_heavy_002.ogg slam
kenney_impact-sounds/impactMetal_heavy_001.ogg clang
kenney_impact-sounds/footstep_concrete_000.ogg step1
kenney_impact-sounds/footstep_concrete_002.ogg step2
kenney_interface-sounds/drop_003.ogg pop
kenney_interface-sounds/maximize_006.ogg pop_in
kenney_impact-sounds/impactGlass_heavy_001.ogg shatter
EOF
"$ENVS/voice/bin/python" scripts/make_voiceover_en.py demo/script_en.json "$PUB/audio/vo" --voice am_michael
cp "$PUB/audio/vo/voiceover.json" "$DEMO/src/en/voiceover.json"

# ── 4. Render + chuẩn hoá âm lượng (-14 LUFS) ────────────────────────────────
cd "$DEMO"
[ -d node_modules ] || npm ci
npx remotion render Motivation out/motivation_raw.mp4 --browser-executable="$BROWSER" --concurrency=3 --crf=18
ffmpeg -nostdin -loglevel error -y -i out/motivation_raw.mp4 -c:v copy \
  -af "loudnorm=I=-14:TP=-1.5:LRA=11" -c:a aac -b:a 192k -ar 48000 out/motivation.mp4
echo "Xong: $DEMO/out/motivation.mp4"
