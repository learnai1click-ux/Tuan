# Video demo "Một giờ mỗi ngày" (60 giây)

Dự án Remotion ghép video demo từ các clip AnimatedDrawings, lời dẫn VoiceStudio, nhạc và hiệu ứng
âm thanh. Bản đã render: `demo-60s.mp4`.

Dựng lại toàn bộ: `bash anim-tools/make_demo.sh` (xem `anim-tools/README.md`).

Chỉ sửa cảnh rồi render lại (khi `public/clips` và `public/audio` đã có):

```bash
npm ci
npx remotion studio                       # xem trước
npx remotion render Demo out/demo.mp4 \
  --browser-executable=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell
```

| Giây | Cảnh | File |
|---|---|---|
| 0-8 | Nửa đêm lướt điện thoại | `src/scenes/Intro.tsx` (`SceneNight`) |
| 8-16 | Ngày 2, 19, 47: quái vật "Lướt" thì thầm | `SceneExcuses` |
| 16-22 | Ngồi một mình dưới cột sáng | `SceneAlone` |
| 22-26 | Tắt điện thoại | `ScenePowerOff` |
| 26-46 | Montage 8 cảnh, từ Ngày 1 đến Ngày 66 | `src/scenes/Montage.tsx` |
| 46-51 | Leo cầu thang, bật nhảy xuyên qua quái vật | `src/scenes/Ending.tsx` (`Climax`) |
| 51-60 | Bình minh, thẻ kết "Ngay hôm nay." | `Finale` |

Lời dẫn nằm ở `script.json` (thời điểm + câu), hiệu ứng âm thanh ở mảng `SFX` trong `src/Demo.tsx`,
các mốc nhạc ở `anim-tools/scripts/make_music.py`.
