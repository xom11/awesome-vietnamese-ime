# Awesome Vietnamese IME

Danh sách bộ gõ tiếng Việt cho máy tính bàn, kèm thư viện cho người muốn tự viết bộ gõ.

Số liệu ★, lần push cuối và giấy phép do GitHub Action tự cập nhật hàng tuần — không ai phải sửa tay, nên không lỗi thời (chốt lần cuối: 2026-08-09).

Nhãn theo lần push gần nhất: 🟢 trong 6 tháng · 🟡 6–24 tháng · 🔴 quá 24 tháng · 📦 repo đã lưu trữ · ⚫ không có mã nguồn công khai · ❓ không truy cập được repo.

## Chọn nhanh

Không muốn đọc hết thì lấy một trong những cái này:

| Hệ điều hành | Gợi ý |
|---|---|
| macOS | 🟢 [OpenKey](https://open-key.org) · 🟢 [Gõ Nhanh](https://gonhanh.org) · 🟢 [XKey](https://github.com/xmannv/xkey) |
| Windows | 🟢 [OpenKey](https://open-key.org) · 🟢 [VKey](https://github.com/phatMT97/VKey) · 🟢 [VietType](https://github.com/dinhngtu/VietType) |
| Linux | 🟢 [IBus Bamboo](https://github.com/BambooEngine/ibus-bamboo) · 🟢 [Fcitx5 Lotus](https://lotusinputmethod.github.io/) · 🟢 [VnKey](https://vnkey.app) |

## Bộ gõ

### macOS

| Tên | ★ | Cập nhật | Giấy phép | Ghi chú |
|---|---:|---|---|---|
| [Gõ Nhanh](https://gonhanh.org) | 749 | 🟢 2026-08 | BSD-3-Clause | Bộ gõ macOS viết Rust, tối ưu <10ms độ trễ, tự nhớ chế độ gõ theo từng app. |
| [XKey](https://github.com/xmannv/xkey) | 485 | 🟢 2026-07 | MIT | Bộ gõ macOS viết Swift, có bản Homebrew Cask, gọn nhẹ tập trung một việc. |
| [Gõkey](https://github.com/huytd/goxkey) | 280 | 🟢 2026-06 | BSD-3-Clause | Bộ gõ macOS viết Rust, tối giản, không có tính năng nào ngoài gõ tiếng Việt. |
| [PHTV](https://phamhungtien.com/PHTV/) | 164 | 🟢 2026-08 | AGPL-3.0 | Bộ gõ macOS chú trọng riêng tư, xử lý cục bộ, đang mở rộng sang Windows/Linux. |
| [Caffee](https://caffee.khanhicetea.com/) | 17 | 🟢 2026-07 | GPL-3.0 | Bộ gõ macOS tối giản nhất, chỉ chạy được từ macOS 14 Sonoma trở lên. |

### Windows

| Tên | ★ | Cập nhật | Giấy phép | Ghi chú |
|---|---:|---|---|---|
| [VKey](https://github.com/phatMT97/VKey) | 173 | 🟢 2026-08 | GPL-3.0 | Bộ gõ Windows nguồn mở, build có ký số qua SignPath, cập nhật rất đều. |
| [VietType](https://github.com/dinhngtu/VietType) | 53 | 🟢 2026-07 | GPL-3.0 | Bộ gõ Windows nguồn mở, minh bạch, không quảng cáo, có xác thực nguồn gốc build. |
| [VietIME](https://github.com/donamvn/viet-ime) | 9 | 🟢 2026-02 | — | Bộ gõ Windows portable, không cần cài đặt, hướng người dùng thay Unikey. |
| [UniKey](https://www.unikey.org) | — | ⚫ — | — | Engine lõi mã nguồn mở GPL (x-unikey, 2001), không có repo GitHub chính chủ. |

### Linux

| Tên | ★ | Cập nhật | Giấy phép | Ghi chú |
|---|---:|---|---|---|
| [IBus Bamboo](https://github.com/BambooEngine/ibus-bamboo) | 1491 | 🟢 2026-07 | GPL-3.0 | Bộ gõ IBus nhiều sao nhất Linux, nhưng tác giả tự nhận dự án đã đình trệ. |
| [Fcitx5 Lotus](https://lotusinputmethod.github.io/) | 445 | 🟢 2026-08 | GPL-3.0 | Bộ gõ Fcitx5 cho Linux, không để lại gạch chân preedit khi gõ. |
| [Viet+](https://github.com/vndangkhoa/vietc) | 62 | 🟢 2026-07 | MIT | Gõ Linux qua uinput trực tiếp, không qua khung IBus/Fcitx, còn thử nghiệm. |
| [xvnkb](https://github.com/lamdao/xvnkb) | 5 | 🔴 2015-09 | — | Bộ gõ X-Window cũ, ngừng phát triển từ 2015, giữ lại vì giá trị lịch sử. |

### Đa nền tảng

| Tên | ★ | Cập nhật | Giấy phép | Ghi chú |
|---|---:|---|---|---|
| [OpenKey](https://open-key.org) | 943 | 🟢 2026-06 | GPL-3.0 | Bộ gõ macOS + Windows phổ biến nhất, dùng kỹ thuật Backspace tránh gạch chân. |
| [VnKey](https://vnkey.app) | 101 | 🟢 2026-04 | GPL-3.0 | Đa nền tảng viết Rust, đóng gói sẵn cho cả Fcitx5, IBus, deb/rpm/nixos. |
| [Funput](https://funput.app) | 14 | 🟢 2026-08 | MIT | Đa nền tảng dùng chung một lõi, có cả bàn phím iOS/Android riêng. |
| [EVKey](https://evkeyvn.com) | — | ⚫ — | — | Windows & macOS, không có mã nguồn công khai — repo chỉ chứa web và updater. |
| [GoTiengViet](https://www.trankynam.com/gotv) | — | ⚫ — | — | Đa nền tảng có kiểm tra chính tả và gợi ý từ ghép, bản trả phí không có mã nguồn. |

## Thư viện & engine

Cho người muốn tự viết bộ gõ chứ không phải đi tìm bộ gõ để dùng.

| Tên | ★ | Cập nhật | Giấy phép | Ghi chú |
|---|---:|---|---|---|
| [vi-rs](https://github.com/ZeroX-DG/vi-rs) | 160 | 🟢 2026-06 | MIT | Thư viện Rust thuần xử lý dấu, không giao diện, để nhúng vào bộ gõ tự viết. |
| [bogoengine](https://github.com/cmpitg/bogoengine) | 26 | 🔴 2013-11 | GPL-3.0 | Thư viện C++ gốc cho bộ gõ Linux, ngừng phát triển từ 2013, có giá trị lịch sử. |
| [uvie-rs](https://github.com/thuupx/uvie-rs) | 22 | 🟢 2026-07 | Apache-2.0 | Thư viện Rust no_std/no-alloc, tối ưu độ trễ dưới micro-giây mỗi phím gõ. |
| [BoGo](https://github.com/BoGoEngine/bogo-python) | 15 | 🔴 2014-08 | GPL-3.0 | Thư viện Python lập trình hàm để viết bộ gõ, ngừng phát triển từ 2014. |

---

Số liệu chốt ngày 2026-08-09.

Thiếu bộ gõ nào thì sửa [`data/ime.json`](data/ime.json) — xem [CONTRIBUTING.md](CONTRIBUTING.md). **Đừng sửa README.md, file này do máy sinh ra.**

Giấy phép: [CC0-1.0](LICENSE).
