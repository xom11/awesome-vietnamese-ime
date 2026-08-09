# Đóng góp

Không rành Git? [Mở issue](../../issues/new/choose) kèm tên bộ gõ và liên kết là
đủ — phần còn lại để đó.

## Thêm hoặc sửa một bộ gõ

Sửa `data/ime.json`. **Đừng sửa `README.md`** — file đó do `scripts/build.mjs`
sinh ra, mọi thay đổi tay sẽ bị ghi đè ở lần chạy tự động kế tiếp (và CI sẽ bắt
được trước đó).

Một mục trông như sau:

```json
{
  "id": "vi-du",
  "ten": "Ví Dụ",
  "repo": "chu-repo/ten-repo",
  "trang_chu": "https://vidu.example",
  "nen_tang": ["macos", "windows"],
  "nhom": "bo_go",
  "ghi_chu": "Một câu nói rõ cái làm nó khác biệt"
}
```

| Trường | Bắt buộc | Ghi chú |
|--------|----------|---------|
| `id` | có | kebab-case, không trùng mục nào khác |
| `ten` | có | giữ nguyên cách viết của tác giả |
| `repo` | có | `"chu/repo"`, hoặc `null` nếu không có mã nguồn công khai |
| `trang_chu` | không | URL `http(s)`; vắng thì liên kết trỏ về repo |
| `nen_tang` | có | tập con của `["macos", "windows", "linux"]` |
| `nhom` | có | `"bo_go"` hoặc `"thu_vien"` |
| `ghi_chu` | có | một câu, tối đa 90 ký tự |
| `giay_phep_ghi_tay` | không | chỉ khi GitHub API đọc sai/không đọc được giấy phép — xem dưới |

Khoá nào không có trong bảng này là lỗi, không phải bị bỏ qua: gõ `trangchu`
thay `trang_chu` từng lọt qua cả hai cổng CI mà chỉ mất im lặng liên kết.

**Đừng khai ★, ngày cập nhật hay giấy phép.** Máy tự lấy từ GitHub API mỗi
tuần. Nói chung, cái gì API biết thì đừng khai tay — khai tay là mở đường cho
số liệu lệch.

Ngoại lệ duy nhất là `giay_phep_ghi_tay`, cho đúng hai ca API **không** biết:

- API trả `null` hoặc `NOASSERTION` vì repo dùng REUSE/SPDX header thay vì một
  file `LICENSE` chuẩn (ví dụ `fcitx5-unikey` thật ra là `GPL-2.0-or-later`);
- API chỉ trả về một id trong khi thượng nguồn là giấy phép kép (ví dụ
  `uvie-rs` là `MIT OR Apache-2.0`, API chỉ thấy `Apache-2.0`).

Kèm dẫn chứng trong PR (đường dẫn file `LICENSE`/`Cargo.toml` thượng nguồn). Nếu
sau này GitHub đọc được một giấy phép khác hẳn, build sẽ cảnh báo để bỏ trường
này đi chứ không im lặng in mãi giá trị cũ.

Mục có `nen_tang` từ hai phần tử trở lên sẽ tự vào nhóm **Đa nền tảng**, không
cần khai thêm gì.

## Bảng "Chọn nhanh"

`chon_nhanh` ở cuối `data/ime.json` là phần biên tập duy nhất của người bảo
trì — máy không suy ra được "nên dùng cái nào". Mỗi hệ điều hành 2–3 `id`, và
mục được gợi ý phải thật sự chạy trên hệ điều hành đó, phải là bộ gõ chứ không
phải thư viện. Cả ba luật đó do `validateData` gác.

Gợi ý là lời khuyên tải về dùng, nên nhãn 🟢 chưa đủ: nhãn đó chỉ nói repo còn
có người push, không nói bản phát hành còn mới. Cái nào bản tải về đã cũ thì nói
thẳng trong `ghi_chu`.

## Tiêu chí nhận

- Bộ gõ hoặc thư viện gõ tiếng Việt cho **máy tính bàn**. Bàn phím mobile,
  extension trình duyệt và plugin editor hiện ngoài phạm vi.
- Có mã nguồn công khai, hoặc là bản đóng nhưng đủ phổ biến để người đọc cần
  biết (Unikey, GoTiengViet).
- Fork không khác gì bản gốc thì không nhận. Fork có thay đổi thực chất thì
  nhận (`ibus-lotus` vá Wayland cho `ibus-bamboo`), và `ghi_chu` phải nói rõ
  nó fork từ đâu — GitHub API không phát hiện được quan hệ này khi người ta
  upload lại thay vì bấm nút Fork.

Dự án đã ngưng phát triển **vẫn được nhận** nếu có ý nghĩa lịch sử — nhãn 🔴/📦
đã nói rõ tình trạng, xoá đi thì mất bản đồ. Nhưng nhãn không nói được "tác giả
đã tuyên bố dừng" hay "cần Qt4 nên không cài được nữa" — những cái đó thuộc về
`ghi_chu`.

## Chạy thử tại máy

```bash
node --test                     # bắt buộc, phải xanh
node scripts/build.mjs --kiem   # validate dữ liệu + README có khớp số liệu đã chốt không
```

Hai lệnh trên không cần mạng, không cần token — đúng những gì CI chạy trên pull
request của bạn.

Muốn xem README sinh ra với số liệu mới nhất thì cần gọi API:

```bash
GITHUB_TOKEN=$(gh auth token) node scripts/build.mjs
```

Không có token vẫn chạy được, nhưng hạn gọi API chỉ 60 lần/giờ nên dễ trượt.

**Pull request chỉ cần chứa `data/ime.json`.** `README.md` và
`data/.snapshot.json` do máy sinh lại sau khi merge — bạn không phải chạy build
thật, và cũng không nên: số liệu ★ trôi từng giờ nên bản render của bạn sẽ khác
bản của người review mà chẳng nói lên điều gì.
