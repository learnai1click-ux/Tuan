# Bộ công cụ AI diễn hoạt nhân vật 2D

Bộ công cụ để làm video hoạt hình ngắn kiểu nhân vật tối giản: chuyển động lấy từ motion capture
hoặc AI, giọng đọc từ VoiceStudio, ghép cảnh bằng Remotion. Có kèm một video demo 60 giây.

## Cài đặt

```bash
bash anim-tools/setup.sh                 # cài tất cả (~15GB, phần lớn là torch)
bash anim-tools/setup.sh animdraw momask # chỉ cài một số công cụ
bash anim-tools/download_weights.sh momask toon   # tải trọng số mô hình
```

Mã nguồn được clone vào `anim-tools/repos/`, mỗi công cụ có một môi trường Python riêng trong
`anim-tools/envs/<tên>`. Hai thư mục này không được commit (xem `.gitignore`).

| Tên | Repo | Việc nó làm | Trạng thái trên máy không GPU |
|---|---|---|---|
| `animdraw` | [facebookresearch/AnimatedDrawings](https://github.com/facebookresearch/AnimatedDrawings) | Gắn chuyển động BVH vào một hình vẽ nhân vật | ✅ Chạy được, đã dùng cho video demo |
| `animdraw_pose` | (cùng repo, `torchserve/`) | Tự nhận diện nhân vật và 16 khớp xương từ ảnh | ✅ Chạy được (mô hình ~700MB tải từ GitHub) |
| `momask` | [EricGuo5513/momask-codes](https://github.com/EricGuo5513/momask-codes) | Câu mô tả → chuyển động 3D, xuất `.bvh` | ✅ Đã cài, ⏳ chờ trọng số (Google Drive) |
| `mdm` | [GuyTevet/motion-diffusion-model](https://github.com/GuyTevet/motion-diffusion-model) | Câu mô tả → chuyển động 3D | ✅ Đã cài, ⏳ chờ trọng số (Google Drive) |
| `toon` | [Doubiiu/ToonCrafter](https://github.com/Doubiiu/ToonCrafter) | Vẽ khung hình ở giữa 2 khung chính | ✅ Đã cài, ⏳ trọng số (Hugging Face), cần GPU ~24GB |
| `wan` | [Wan-Video/Wan2.2](https://github.com/Wan-Video/Wan2.2) | Tạo video từ chữ hoặc ảnh | ✅ Đã cài thư viện, ❌ mã nguồn bắt buộc GPU NVIDIA |
| `comfy` | [comfyanonymous/ComfyUI](https://github.com/comfyanonymous/ComfyUI) | Giao diện node chạy Wan, ToonCrafter, ... | ✅ Khởi động được với `--cpu`, ⏳ chờ trọng số (Hugging Face) |

`animdraw_pose` không nằm trong lệnh cài mặc định vì phải biên dịch lâu; cài riêng bằng
`bash anim-tools/setup.sh animdraw_pose`.

Tất cả dùng Python 3.10 và torch 2.7.1 (uv dùng hardlink nên torch chỉ chiếm chỗ một lần),
riêng `animdraw_pose` dùng Python 3.8, torch 2.0.0 và mmcv-full 1.7.0 biên dịch từ mã nguồn.
Đã bỏ `xformers` (ToonCrafter) và `flash_attn` (Wan2.2) vì hai gói này chỉ chạy với GPU NVIDIA.

Các lỗi đã gặp và cách xử lý trong `setup.sh`:
- `pkg_resources` không còn trong setuptools mới → AnimatedDrawings và ToonCrafter cài `setuptools<70`.
- `chumpy` và `CLIP` có setup.py cũ → cài với `--no-build-isolation`.
- `download.openmmlab.com` bị chặn → mmcv-full biên dịch từ mã nguồn (~20-40 phút trên CPU).
- ComfyUI trên máy không GPU: `triton` báo "0 active drivers" khi import → gỡ `triton`.

## Video demo 60 giây

```bash
bash anim-tools/setup.sh animdraw
bash anim-tools/make_demo.sh   # → anim-tools/demo/out/demo.mp4
```

| Thành phần | Công cụ | File |
|---|---|---|
| Nhân vật "Sáng" (3 biểu cảm) | Vẽ bằng code (PIL) | `scripts/make_character.py` |
| 8 clip chuyển động mocap | AnimatedDrawings, xuất PNG nền trong suốt | `scripts/render_clip.py` |
| Cảnh ngồi, gục, gõ phím | Con rối SVG cùng hình khối | `demo/src/components/Sang.tsx` |
| Lời dẫn tiếng Việt (12 câu) | VoiceStudio, engine sherpa-onnx, giọng Piper `vi_VN-vais1000-medium` | `scripts/make_voiceover.py`, `demo/script.json` |
| Nhạc nền 4 đoạn cảm xúc | Tổng hợp bằng numpy | `scripts/make_music.py` |
| Hiệu ứng âm thanh | Bộ Kenney (CC0, qua soundcn) + tự tổng hợp | `scripts/make_sfx.py` |
| Ghép cảnh, chữ, âm thanh | Remotion 4 | `demo/src/` |

Về giọng đọc: mọi engine khác của VoiceStudio đều tải mô hình từ Hugging Face. Engine sherpa-onnx
dùng mô hình Piper trên GitHub releases, có giọng tiếng Việt. `make_voiceover.py` gọi thẳng class
`SherpaOnnxBackend` của VoiceStudio, nên giọng giống hệt khi chọn engine đó trong ứng dụng.
sherpa-onnx 2.0 bị lỗi với giọng Piper ("no frontend available"), nên cố định ở bản 1.13.8.
Từng câu được kiểm tra bằng mô hình nhận dạng giọng nói tiếng Việt
(`sherpa-onnx-zipformer-vi-int8-2025-04-20`). Câu nào nghe sai thì viết lại cho đến khi nhận dạng
khớp từng chữ.

## Video tiếng Anh Mỹ "Motivation" (60 giây)

```bash
bash anim-tools/make_demo_en.sh   # → anim-tools/demo/out/motivation.mp4
```

So với bản tiếng Việt:

| | Bản tiếng Việt | Bản tiếng Anh |
|---|---|---|
| Giọng | Piper `vi_VN-vais1000-medium` qua VoiceStudio | Kokoro v1.0 `am_michael` (nam Mỹ), hạ tông 1 nửa cung, nén + EQ + vang ngắn kiểu lồng tiếng truyền động lực |
| Chuyển động | 6 BVH mẫu của AnimatedDrawings | + 8 chuyển động CMU: chạy, đứng dậy từ sàn, đi ủ rũ, nâng tạ, nhảy, siêu anh hùng, ăn mừng |
| Biểu cảm | 3 texture | 7 texture (thêm nghiến răng, hét, khóc, sốc) + con rối `Sam` có 11 tham số mặt nội suy theo keyframe |
| Nhịp | cắt 2,5 giây | cắt 1-2,4 giây, clip phát nhanh 1,2-2x, whip pan, vệt tốc độ, rung máy, chớp sáng |
| Nhạc | piano + trống | trailer: piano, dây, tim đập, braam, trống tom, hợp xướng |

- `configs/cmu_retarget.yaml`: retarget bộ xương CMU, chiếu tay chân theo PCA để thấy chân vung khi chạy.
- `scripts/prep_cmu.py`: chép BVH CMU, tuỳ chọn `:inplace` khoá dịch chuyển ngang để chạy tại chỗ.
- `scripts/make_voiceover_en.py`: lời dẫn Kokoro + chuỗi xử lý ffmpeg (`--voice am_onyx` cho giọng trầm hơn).
- `demo/src/en/`: `Sam.tsx` (con rối biểu cảm), `fx.tsx` (máy quay, vệt tốc độ, emote, whip, phụ đề bật chữ), `Scenes*.tsx`.

`render_clip.py` bỏ khung đầu tiên vì AnimatedDrawings chỉ áp tư thế sau lần tick đầu; trước đây mỗi clip
có một khung tư thế chữ A. Thêm `--speed` để phát chuyển động nhanh hơn.

## Dùng từng công cụ

### Render nhân vật với chuyển động (chạy được trên CPU)

```bash
cd anim-tools/repos/AnimatedDrawings
PYOPENGL_PLATFORM=osmesa ../../envs/animdraw/bin/python ../../scripts/render_clip.py \
  --char ../../characters/sang_focus/char_cfg.yaml \
  --motion examples/config/motion/jumping_jacks.yaml \
  --retarget examples/config/retarget/cmu1_pfp.yaml \
  --out ../../test-output/clip --seconds 3
```

`render_clip.py` khác bộ render gốc ở ba điểm: ghi PNG RGBA (giữ nền trong suốt), lấy mẫu lại
ở 30 fps, và cho chọn đoạn bắt đầu/độ dài. Máy không màn hình phải dùng `PYOPENGL_PLATFORM=osmesa`.

### Nối MoMask với AnimatedDrawings

MoMask xuất BVH theo tên khớp kiểu Mixamo (`Hips`, `LeftUpLeg`, `LeftArm`, ...), đơn vị mét,
trục Y hướng lên. Hai file trong `configs/` làm cầu nối:

- `configs/momask_retarget.yaml`: ánh xạ khớp MoMask sang khớp của nhân vật.
- `configs/momask_motion_template.yaml`: đổi `filepath` thành file `.bvh` do MoMask tạo.

Cầu nối đã được kiểm thử bằng `momask-codes/visualization/data/template.bvh`. Đây là clip `momask`
trong video demo (cảnh "NGÀY 52").

```bash
bash anim-tools/download_weights.sh momask   # cần mạng tới drive.google.com
cd anim-tools/repos/momask-codes
../../envs/momask/bin/python gen_t2m.py --gpu_id -1 --ext demo \
  --text_prompt "a person runs forward then punches"
# BVH nằm trong generation/demo/animations/
```

### Tự nhận diện khung xương từ ảnh nhân vật

```bash
cd anim-tools/repos/AnimatedDrawings/torchserve
../../../envs/torchserve/bin/torchserve --start --disable-token-auth \
  --ts-config config.local.properties --model-store model-store
cd ../examples && PYOPENGL_PLATFORM=osmesa ../../../envs/animdraw/bin/python \
  image_to_annotations.py my_character.png ../../../test-output/my_character
```

Ảnh phải có nền trắng. Đã thử với nhân vật Sáng: nhận đúng cả 16 khớp.

## Mạng bị chặn trong môi trường cloud này

`huggingface.co`, `drive.google.com`, `download.pytorch.org`, `dl.fbaipublicfiles.com`,
`download.openmmlab.com`, `openaipublic.azureedge.net` đều bị chặn, nên chưa tải được trọng số của
MoMask, MDM, ToonCrafter, Wan và ComfyUI. Muốn tải, thêm các domain này vào mục Network access của
môi trường (https://code.claude.com/docs/en/cloud-environments#network-access), hoặc chạy
`download_weights.sh` trên máy của bạn.
