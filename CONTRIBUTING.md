# Đóng góp

## Thêm hoặc sửa một bộ gõ

Sửa `data/ime.json`. **Đừng sửa `README.md`** — file đó do `scripts/build.mjs`
sinh ra, mọi thay đổi tay sẽ bị ghi đè ở lần chạy tự động kế tiếp.

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
| `trang_chu` | không | vắng thì liên kết trỏ về repo |
| `nen_tang` | có | tập con của `["macos", "windows", "linux"]` |
| `nhom` | có | `"bo_go"` hoặc `"thu_vien"` |
| `ghi_chu` | có | một câu, tối đa 90 ký tự |

**Đừng khai ★, ngày cập nhật, giấy phép hay ngôn ngữ.** Máy tự lấy từ GitHub API
mỗi tuần. Khai tay là mở đường cho số liệu lệch — đúng thứ bệnh repo này sinh ra
để chữa.

Mục có `nen_tang` từ hai phần tử trở lên sẽ tự vào nhóm **Đa nền tảng**, không
cần khai thêm gì.

## Tiêu chí nhận

- Bộ gõ hoặc thư viện gõ tiếng Việt cho **máy tính bàn**. Bàn phím mobile,
  extension trình duyệt và plugin editor hiện ngoài phạm vi.
- Có mã nguồn công khai, hoặc là bản đóng nhưng đủ phổ biến để người đọc cần
  biết (Unikey, GoTiengViet).
- Fork không khác gì bản gốc thì không nhận.

Dự án đã ngưng phát triển **vẫn được nhận** nếu có ý nghĩa lịch sử — nhãn 🔴/📦
đã nói rõ tình trạng, xoá đi thì mất bản đồ.

## Chạy thử tại máy

```bash
node --test scripts/*.test.mjs                              # bắt buộc, phải xanh
GITHUB_TOKEN=$(gh auth token) node scripts/build.mjs
```

Không có token vẫn chạy được, nhưng hạn gọi API chỉ 60 lần/giờ nên dễ trượt.

Trong pull request, commit cả `README.md` và `data/.snapshot.json` đã sinh lại.
