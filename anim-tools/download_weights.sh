#!/usr/bin/env bash
# Tải trọng số mô hình cho các công cụ đã cài bằng setup.sh.
#
#   bash anim-tools/download_weights.sh momask toon
#
# Cần mạng tới: drive.google.com, drive.usercontent.google.com, huggingface.co,
# cdn-lfs.huggingface.co, openaipublic.azureedge.net (CLIP).
# AnimatedDrawings không cần tải gì nếu bạn tự khai báo khung xương nhân vật
# (char_cfg.yaml); chỉ bước tự nhận diện khung xương mới cần mô hình TorchServe.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPOS="$ROOT/repos"
ENVS="$ROOT/envs"

hf() { # hf <repo> <thư mục> [file...]  (dùng huggingface_hub trong venv wan)
  local repo="$1" dir="$2"; shift 2
  "$ENVS/wan/bin/hf" download "$repo" "$@" --local-dir "$dir"
}

dl_animdraw() {
  # Các mô hình nhận diện khung xương (~1,3GB) để tự động hóa bước gắn xương.
  cd "$REPOS/AnimatedDrawings/torchserve"
  mkdir -p model-store
  curl -L -o model-store/drawn_humanoid_detector.mar https://github.com/facebookresearch/AnimatedDrawings/releases/download/v0.0.1/drawn_humanoid_detector.mar
  curl -L -o model-store/drawn_humanoid_pose_estimator.mar https://github.com/facebookresearch/AnimatedDrawings/releases/download/v0.0.1/drawn_humanoid_pose_estimator.mar
}

dl_momask() { # ~1GB, chuyển động từ câu mô tả, xuất BVH
  cd "$REPOS/momask-codes"
  PATH="$ENVS/momask/bin:$PATH" bash prepare/download_models.sh
}

dl_mdm() { # ~1GB, mô hình 50 bước (nhanh hơn 20 lần) + SMPL
  cd "$REPOS/motion-diffusion-model"
  export PATH="$ENVS/mdm/bin:$PATH"
  bash prepare/download_smpl_files.sh
  mkdir -p save && cd save
  gdown --fuzzy "https://drive.google.com/file/d/1cfadR1eZ116TIdXK7qDX1RugAerEiJXr/view?usp=sharing"
  unzip -o ./*.zip && rm -f ./*.zip
}

dl_toon() { # ~10GB (+ ~4GB OpenCLIP ViT-H tải tự động khi chạy lần đầu)
  hf Doubiiu/ToonCrafter "$REPOS/ToonCrafter/checkpoints/tooncrafter_512_interp_v1" model.ckpt
}

dl_wan() { # ~32GB, bản nhỏ nhất TI2V-5B (cần GPU khoảng 24GB VRAM)
  hf Wan-AI/Wan2.2-TI2V-5B "$REPOS/Wan2.2/Wan2.2-TI2V-5B"
}

dl_comfy() { # ~17GB, Wan2.2 5B đóng gói cho ComfyUI
  local M="$REPOS/ComfyUI/models" R=Comfy-Org/Wan_2.2_ComfyUI_Repackaged T
  T="$(mktemp -d)"
  hf "$R" "$T" split_files/diffusion_models/wan2.2_ti2v_5B_fp16.safetensors \
    split_files/vae/wan2.2_vae.safetensors
  hf Comfy-Org/Wan_2.1_ComfyUI_repackaged "$T" \
    split_files/text_encoders/umt5_xxl_fp8_e4m3fn_scaled.safetensors
  mv "$T"/split_files/diffusion_models/* "$M/diffusion_models/"
  mv "$T"/split_files/vae/* "$M/vae/"
  mv "$T"/split_files/text_encoders/* "$M/text_encoders/"
  rm -rf "$T"
}

[ $# -gt 0 ] || { echo "Dùng: $0 animdraw|momask|mdm|toon|wan|comfy ..."; exit 1; }
for t in "$@"; do ( "dl_$t" ); done
