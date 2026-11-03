#!/usr/bin/env bash
# Cài đặt bộ công cụ AI diễn hoạt nhân vật 2D (mục 1).
#
#   bash anim-tools/setup.sh            # cài tất cả
#   bash anim-tools/setup.sh animdraw   # chỉ cài một công cụ
#
# Công cụ: animdraw | momask | mdm | toon | wan | comfy
#
# Mỗi công cụ có một venv riêng trong anim-tools/envs/<tên>. Tất cả dùng chung
# Python 3.10 và torch 2.7.1, nên uv dùng hardlink từ cache thay vì tải lại torch.
# Script chỉ cài mã nguồn và thư viện. Trọng số mô hình tải riêng bằng
# download_weights.sh (cần mạng tới huggingface.co, drive.google.com, ...).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPOS="$ROOT/repos"
ENVS="$ROOT/envs"
PY=3.10
TORCH=(torch==2.7.1 torchvision==0.22.1 torchaudio==2.7.1)
export UV_LINK_MODE=hardlink

mkdir -p "$REPOS" "$ENVS"

clone() { # clone <owner/repo>
  local name="${1#*/}"
  if [ ! -d "$REPOS/$name/.git" ]; then
    git clone -q --depth 1 "https://github.com/$1.git" "$REPOS/$name"
  fi
}

mkenv() { # mkenv <tên>  -> tạo venv và in đường dẫn python
  [ -x "$ENVS/$1/bin/python" ] || uv venv -q --python "$PY" "$ENVS/$1"
}

pipi() { # pipi <tên> <gói...>
  local env="$1"; shift
  uv pip install -q --python "$ENVS/$env/bin/python" "$@"
}

# CLIP và chumpy có setup.py cũ (import pkg_resources / pip), nên cài không cách ly build.
legacy_deps() {
  pipi "$1" "setuptools<70" wheel pip
  pipi "$1" --no-build-isolation chumpy==0.70 "clip @ git+https://github.com/openai/CLIP.git"
}

install_animdraw() {
  echo ">> AnimatedDrawings"
  if command -v apt-get >/dev/null && [ ! -e /usr/lib/x86_64-linux-gnu/libOSMesa.so ]; then
    apt-get install -y -qq libosmesa6 libosmesa6-dev libgl1 libglu1-mesa
  fi
  clone facebookresearch/AnimatedDrawings
  mkenv animdraw
  # config.py import pkg_resources, đã bị bỏ khỏi setuptools bản mới.
  pipi animdraw -e "$REPOS/AnimatedDrawings" "setuptools<70"
}

# Server TorchServe để AnimatedDrawings tự nhận diện nhân vật và khung xương từ ảnh.
# Thay cho Dockerfile gốc. Biên dịch mmcv-full từ mã nguồn (~20-40 phút trên CPU)
# vì không tải được bản dựng sẵn. Cần Java (default-jre).
install_animdraw_pose() {
  echo ">> AnimatedDrawings pose server (TorchServe + mmdet + mmpose)"
  clone facebookresearch/AnimatedDrawings
  [ -x "$ENVS/torchserve/bin/python" ] || uv venv -q --python 3.8 "$ENVS/torchserve"
  pipi torchserve torch==2.0.0 torchvision==0.15.1 numpy==1.24.4 "setuptools<70" wheel pip \
    ninja psutil packaging addict yapf==0.40.1 opencv-python==4.8.1.78 pyyaml
  MMCV_WITH_OPS=1 MAX_JOBS="$(nproc)" pipi torchserve --no-build-isolation mmcv-full==1.7.0
  pipi torchserve --no-build-isolation chumpy==0.70
  pipi torchserve mmdet==2.27.0 mmpose==0.29.0 xtcocotools torchserve==0.12.0 \
    torch==2.0.0 torchvision==0.15.1 numpy==1.24.4
}

install_momask() {
  echo ">> MoMask"
  clone EricGuo5513/momask-codes
  mkenv momask
  pipi momask "${TORCH[@]}" numpy==1.23.5 "matplotlib<3.6" scipy scikit-learn \
    einops ftfy gdown smplx==0.1.28 trimesh tqdm pyyaml regex \
    vector-quantize-pytorch==1.6.30 tensorboard
  legacy_deps momask
}

install_mdm() {
  echo ">> Motion Diffusion Model"
  clone GuyTevet/motion-diffusion-model
  mkenv mdm
  pipi mdm "${TORCH[@]}" numpy==1.23.5 "matplotlib<3.6" scipy scikit-learn \
    einops ftfy gdown smplx==0.1.28 trimesh tqdm pyyaml regex h5py pandas \
    "spacy>=3.3,<3.8" moviepy==1.0.3 tensorboard wandb blobfile
  legacy_deps mdm
}

install_toon() {
  echo ">> ToonCrafter"
  clone Doubiiu/ToonCrafter
  mkenv toon
  # Bỏ xformers: chỉ dùng được với GPU NVIDIA và phải khớp phiên bản torch.
  pipi toon "${TORCH[@]}" decord==0.6.0 einops==0.3.0 imageio==2.9.0 numpy==1.24.4 \
    omegaconf==2.1.1 opencv-python pandas Pillow==9.5.0 pytorch_lightning==1.9.3 \
    PyYAML==6.0.1 tqdm transformers==4.25.1 moviepy av gradio timm scikit-learn \
    open_clip_torch==2.22.0 kornia "setuptools<70"  # lightning_fabric cần pkg_resources
}

install_wan() {
  echo ">> Wan2.2"
  clone Wan-Video/Wan2.2
  mkenv wan
  # Bỏ flash_attn: cần GPU NVIDIA và CUDA toolkit để biên dịch.
  pipi wan "${TORCH[@]}" "opencv-python>=4.9.0.80" "diffusers>=0.31.0" \
    "transformers>=4.49.0,<=4.51.3" "tokenizers>=0.20.3" "accelerate>=1.1.1" tqdm \
    "imageio[ffmpeg]" easydict ftfy dashscope imageio-ffmpeg "numpy>=1.23.5,<2" \
    huggingface_hub
}

install_comfy() {
  echo ">> ComfyUI"
  clone comfyanonymous/ComfyUI
  mkenv comfy
  pipi comfy "${TORCH[@]}"
  pipi comfy -r "$REPOS/ComfyUI/requirements.txt" "${TORCH[@]}"
  # Không có GPU: comfy_kitchen import triton, triton báo "0 active drivers" và ComfyUI dừng.
  if ! command -v nvidia-smi >/dev/null; then
    uv pip uninstall -q --python "$ENVS/comfy/bin/python" triton || true
  fi
}

ALL=(animdraw momask mdm toon wan comfy)
for t in "${@:-${ALL[@]}}"; do
  "install_$t"
done
echo "Xong: ${*:-${ALL[*]}}"
