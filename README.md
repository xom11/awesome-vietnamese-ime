# Awesome Vietnamese IME

Danh sách bộ gõ tiếng Việt cho máy tính bàn, kèm thư viện cho người muốn tự viết bộ gõ.

Số liệu ★, lần push cuối và giấy phép do GitHub Action sinh lại hàng tuần từ [`data/ime.json`](data/ime.json). Vài giấy phép GitHub đọc không ra thì khai tay, có ghi rõ trong [CONTRIBUTING.md](CONTRIBUTING.md) (chốt lần cuối: 2026-08-17).

Nhãn theo lần push gần nhất: 🟢 trong 6 tháng · 🟡 6–24 tháng · 🔴 quá 24 tháng · 📦 repo đã lưu trữ · ⚪ repo chưa có commit · ⚫ không có repo GitHub chứa mã nguồn bộ gõ · ❓ không truy cập được repo.

Lần push cuối trả lời "còn ai đụng vào không", **không** phải "bản tải về còn mới không" — repo có commit mà bản phát hành cũ mèm thì cột Ghi chú nói.

## Chọn nhanh

Không muốn đọc hết thì lấy một trong những cái này:

| Hệ điều hành | Gợi ý |
|---|---|
| macOS | 🟢 [Gõ Nhanh](https://gonhanh.org) 751★ · 🟢 [XKey](https://github.com/xmannv/xkey) 489★ |
| Windows | 🟢 [VKey](https://github.com/phatMT97/VKey) 173★ · 🟢 [VietType](https://github.com/dinhngtu/VietType) 53★ · ⚫ [UniKey](https://www.unikey.org) |
| Linux | 🟢 [Fcitx5 Lotus](https://lotusinputmethod.github.io/) 459★ · 🟢 [IBus Bamboo](https://github.com/BambooEngine/ibus-bamboo) 1492★ · 🟢 [VnKey](https://vnkey.app) 101★ |

## Bộ gõ

### macOS

Ngoài ra còn 6 bộ gõ đa nền tảng cũng chạy trên macOS — xem [Đa nền tảng](#đa-nền-tảng).

| Tên | ★ | Cập nhật | Giấy phép | Ghi chú |
|---|---:|---|---|---|
| [Gõ Nhanh](https://gonhanh.org) | 751 | 🟢 2026-08 | BSD-3-Clause | Bộ gõ macOS viết Rust, tối ưu <10ms độ trễ, tự nhớ chế độ gõ theo từng app. |
| [XKey](https://github.com/xmannv/xkey) | 489 | 🟢 2026-07 | MIT | Bộ gõ macOS viết Swift, nhiều tính năng: macro, từ điển, dịch nhanh 30+ ngôn ngữ. |
| [Gõkey](https://github.com/huytd/goxkey) | 280 | 🟢 2026-08 | BSD-3-Clause | Bộ gõ macOS viết Rust, tối giản, không có tính năng nào ngoài gõ tiếng Việt. |
| [PHTV](https://phamhungtien.com/PHTV/) | 164 | 🟢 2026-08 | AGPL-3.0 | Bộ gõ macOS chú trọng riêng tư, xử lý cục bộ, đang mở rộng sang Windows/Linux. |
| [v7](https://github.com/ducngg/v7) | 101 | 🟡 2025-05 | Apache-2.0 | Kiểu gõ dự đoán từ phụ âm đầu và dấu (bài IJCAI 2025); app PyQt5, đóng gói macOS. |
| [NAKL](https://github.com/huyphan/NAKL) | 85 | 🔴 2021-07 | GPL-3.0 | Bộ gõ macOS cũ, dùng lại thuật toán và bảng phím của xvnkb; ngừng từ 2021. |
| [VietTelex](https://viettelex.com) | 48 | 🟢 2026-08 | MIT | Input method IMKit thật của macOS, không gạch chân, gõ được cả trong Terminal. |
| [UVieKey](https://github.com/thuupx/UVieKey) | 21 | 🟢 2026-07 | — | App macOS chính chủ của engine uvie-rs: nhấn Fn đổi Anh/Việt, có macro gõ tắt. |
| [Caffee](https://caffee.khanhicetea.com/) | 17 | 🟢 2026-07 | GPL-3.0 | Bộ gõ macOS tối giản nhất, chỉ chạy được từ macOS 14 Sonoma trở lên. |
| [OreoKey](https://oreokey.vercel.app) | 6 | 🟢 2026-07 | MIT | Lõi Rust, giao diện Swift; chống dính/nháy chữ bằng Accessibility API theo từng app. |

### Windows

Ngoài ra còn 6 bộ gõ đa nền tảng cũng chạy trên Windows — xem [Đa nền tảng](#đa-nền-tảng).

| Tên | ★ | Cập nhật | Giấy phép | Ghi chú |
|---|---:|---|---|---|
| [VKey](https://github.com/phatMT97/VKey) | 173 | 🟢 2026-08 | GPL-3.0 | Bộ gõ Windows nguồn mở, build có ký số qua SignPath, cập nhật rất đều. |
| [VietType](https://github.com/dinhngtu/VietType) | 53 | 🟢 2026-07 | GPL-3.0 | Bộ gõ Windows nguồn mở, minh bạch, không quảng cáo, có xác thực nguồn gốc build. |
| [UniKey](https://www.unikey.org) | — | ⚫ — | — | Engine lõi nguồn mở GPL tải ở unikey.org/source.html, không có repo GitHub. |

### Linux

Ngoài ra còn 4 bộ gõ đa nền tảng cũng chạy trên Linux — xem [Đa nền tảng](#đa-nền-tảng).

| Tên | ★ | Cập nhật | Giấy phép | Ghi chú |
|---|---:|---|---|---|
| [IBus Bamboo](https://github.com/BambooEngine/ibus-bamboo) | 1492 | 🟢 2026-07 | GPL-3.0 | Bộ gõ IBus nhiều sao nhất Linux, nhưng tác giả tự nhận dự án đã đình trệ. |
| [Fcitx5 Lotus](https://lotusinputmethod.github.io/) | 459 | 🟢 2026-08 | GPL-3.0 | Fork từ VMK, gõ không để lại gạch chân preedit, hiện là bản Fcitx5 sống nhất. |
| [IBus Unikey](https://github.com/vn-input/ibus-unikey) | 146 | 🟡 2025-07 | GPL-3.0 | Nhân Unikey chạy trên IBus, có trước fcitx5-unikey; README báo đã ngừng hỗ trợ. |
| [Fcitx5 Unikey](https://github.com/fcitx/fcitx5-unikey) | 127 | 🟢 2026-08 | GPL-2.0-or-later | Nhân Unikey cho Fcitx5; README ibus-bamboo khuyên chuyển sang nếu chạy Wayland. |
| [IBus Lotus](https://github.com/LotusInputEngine/ibus-lotus) | 119 | 📦 2026-01 | GPL-3.0 | Fork tách rời ibus-bamboo để vá lỗi Wayland GNOME/KDE, nay đã ngừng. |
| [VMK](https://github.com/thanhpy2009/VMK) | 98 | 🟡 2026-02 | GPL-3.0 | Dựng trên fcitx5-bamboo, thêm cơ chế không gạch chân kiểu UniKey; alpha, đã dừng. |
| [IBus BoGo](https://github.com/BoGoEngine/ibus-bogo) | 93 | 📦 2017-10 | GPL-3.0 | Bộ gõ IBus của engine BoGo, ngưng 2017; cần Qt4 nên không cài được nữa. |
| [Viet+](https://github.com/vndangkhoa/vietc) | 62 | 🟢 2026-07 | MIT | Gõ Linux qua uinput trực tiếp, không qua khung IBus/Fcitx, còn thử nghiệm. |
| [Fcitx BoGo](https://github.com/BoGoEngine/fcitx-bogo) | 12 | 🔴 2017-12 | GPL-3.0-or-later | Cầu nối engine BoGo sang Fcitx, viết Python 2; ngừng phát triển từ 2017. |
| [IBus Teni](https://github.com/teni-ime/ibus-teni) | 10 | 📦 2020-04 | GPL-3.0 | Kiểu gõ Teni gộp Telex và VNI làm một, chỉ bảng mã Unicode, lưu trữ từ 2020. |
| [CodeKey](https://github.com/toilaai2212hp22-lgtm/codekeyvn) | 7 | 🟢 2026-07 | MIT | Viết Rust, chạy cả IBus lẫn Fcitx5, kèm CLI chuyển chữ dùng thẳng trong terminal. |
| [PinaKey](https://trananhtung.github.io/pinakey-web/) | 6 | 🟢 2026-07 | — | Lõi Rust thuần + addon C++ cho Fcitx5, gõ không gạch chân; repo chưa có giấy phép. |
| [VI-IME](https://github.com/nhanth87/vi-ime) | 6 | 🟢 2026-07 | GPL-3.0-only | AppImage cho Wayland niri/Hyprland/Sway, dùng thuật toán NFD/C thay bảng tra vowel. |
| [xvnkb](https://github.com/lamdao/xvnkb) | 5 | 🔴 2015-09 | khác | Bộ gõ X-Window cũ, ngừng phát triển từ 2015, giữ lại vì giá trị lịch sử. |

### Đa nền tảng

| Tên | Nền tảng | ★ | Cập nhật | Giấy phép | Ghi chú |
|---|---|---:|---|---|---|
| [OpenKey](https://open-key.org) | mac · win | 945 | 🟢 2026-06 | GPL-3.0 | Phổ biến nhất trên macOS, dùng kỹ thuật Backspace; bản cuối 2.0.5 từ 2022. |
| [VnKey](https://vnkey.app) | mac · win · linux | 101 | 🟢 2026-04 | GPL-3.0 | Viết Rust, đóng gói sẵn cho cả Fcitx5, IBus, deb/rpm/nixos. |
| [Funput](https://funput.app) | mac · win · linux | 17 | 🟢 2026-08 | MIT | Dùng chung một lõi cho mọi nền tảng, có cả bàn phím iOS/Android riêng. |
| [VietIME](https://github.com/donamvn/viet-ime) | mac · win · linux | 9 | 🟢 2026-02 | — | Portable, không cần cài; bản mac/Linux có từ v1.0.8 nhưng còn thử nghiệm. |
| [EVKey](https://evkeyvn.com) | mac · win | — | ⚫ — | — | Không có mã nguồn công khai — repo chính chủ chỉ chứa trang web và updater. |
| [GoTiengViet](https://www.trankynam.com/gotv) | mac · win · linux | — | ⚫ — | — | Có kiểm tra chính tả và gợi ý từ ghép; không có mã nguồn công khai. |

## Thư viện & engine

Cho người muốn tự viết bộ gõ chứ không phải đi tìm bộ gõ để dùng.

| Tên | Nền tảng | ★ | Cập nhật | Giấy phép | Ghi chú |
|---|---|---:|---|---|---|
| [vi-rs](https://github.com/ZeroX-DG/vi-rs) | mac · win · linux | 158 | 🟢 2026-06 | MIT | Thư viện Rust thuần xử lý dấu, không giao diện, để nhúng vào bộ gõ tự viết. |
| [bogoengine](https://github.com/cmpitg/bogoengine) | linux | 26 | 🔴 2013-11 | GPL-3.0 | Thư viện C++ gốc cho bộ gõ Linux, ngừng phát triển từ 2013, có giá trị lịch sử. |
| [uvie-rs](https://github.com/thuupx/uvie-rs) | mac · win · linux | 22 | 🟢 2026-07 | MIT OR Apache-2.0 | Thư viện Rust no_std/no-alloc, tối ưu độ trễ dưới micro-giây mỗi phím gõ. |
| [BoGo](https://github.com/BoGoEngine/bogo-python) | linux | 15 | 🔴 2014-08 | GPL-3.0 | Thư viện Python lập trình hàm để viết bộ gõ, ngừng phát triển từ 2014. |
| [libunikey](https://github.com/vn-input/libunikey) | mac · win · linux | 4 | 🔴 2023-06 | LGPL-2.0-only | Thư viện C++ xử lý văn bản tiếng Việt, dựng trên ukengine của UniKey. |

---

Số liệu chốt ngày 2026-08-17.

Thiếu bộ gõ nào thì sửa [`data/ime.json`](data/ime.json) — xem [CONTRIBUTING.md](CONTRIBUTING.md). **Đừng sửa README.md, file này do máy sinh ra.**

Không rành Git thì [mở issue](../../issues/new/choose) kèm tên bộ gõ và liên kết là đủ.

Giấy phép: [CC0-1.0](LICENSE).
