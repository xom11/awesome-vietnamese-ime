# awesome-vietnamese-ime — thiết kế

Ngày: 2026-08-09

## Vấn đề

Hệ sinh thái bộ gõ tiếng Việt có hơn hai chục dự án đang sống, nhưng không có
nơi nào tổng hợp. Hai awesome list chung có nhắc tới bộ gõ, cả hai đều bỏ hoang:

| Repo | ★ | Mục bộ gõ |
|------|---|-----------|
| `virusvn/awesome-vietnamese` | 199 | 6 mục: ibus-bamboo, OpenKey, NAKL, EVKey, GoTiengViet, Unikey |
| `virusvn/awesome-vietnamese-language` | 9 | Unikey (link Google Code đã chết) + BoGoEngine |

Cả hai thiếu toàn bộ lứa mới: GoNhanh, goxkey, fcitx5-lotus, VietType, xkey,
PHTV, vnkey, vietc, Caffee, Funput, vi-rs.

Tìm `awesome vietnamese keyboard`, `vietnamese typing list`, `awesome input
method editor` trên GitHub đều trả rỗng — chưa có repo chuyên biệt nào.

Nhưng danh sách lỗi thời không phải bệnh chính. Bệnh chính là **người đọc không
biết mục nào đã ngưng phát triển**. Một list tĩnh sẽ mắc lại đúng bệnh đó sau
sáu tháng. Thiết kế này lấy việc trả lời "cái này còn sống không" làm trung tâm.

## Mục tiêu

1. Người vào tìm một bộ gõ cho OS của mình rời trang với một cái tên, trong
   vòng 30 giây.
2. Số liệu (★, lần push cuối, giấy phép) **không bao giờ lỗi thời** — máy cập
   nhật, không phụ thuộc người bảo trì còn hứng thú.
3. Trạng thái còn-sống hiện ngay trên bảng, không bắt người đọc mở từng repo.

## Phi mục tiêu

Đã chốt, không làm trong phạm vi này:

- Bàn phím mobile (iOS/Android), extension trình duyệt, plugin editor.
- Công cụ ngoại vi quanh bộ gõ — nên `tongue` **không** xuất hiện trong list.
- Dạy Telex/VNI/VIQR, so sánh kiểu gõ.
- Đánh giá chất lượng, xếp hạng chủ quan, benchmark tốc độ gõ.

## Kiến trúc

`data/ime.json` là nguồn chân lý duy nhất cho phần người viết. `README.md` là
sản phẩm sinh ra, không sửa tay.

```
data/ime.json ──┐
                ├──> scripts/build.mjs ──> README.md
GitHub API  ────┘         │                data/.snapshot.json
                          └── scripts/lib.mjs (thuần)
```

```
awesome-vietnamese-ime/
├── README.md                      # SINH RA — không sửa tay
├── data/ime.json                  # nguồn chân lý
├── data/.snapshot.json            # số liệu API lần chạy trước
├── scripts/lib.mjs                # thuần: validate, phân loại, sắp xếp, render
├── scripts/lib.test.mjs           # node --test
├── scripts/build.mjs              # I/O: fs + fetch, gọi lib
├── .github/workflows/refresh.yml
├── CONTRIBUTING.md
└── LICENSE                        # CC0-1.0
```

Ranh giới `lib.mjs` / `build.mjs` không phải cho gọn mắt: nó là điều kiện để
test được toàn bộ logic mà không chạm mạng. `lib.mjs` không import `fs` và
không gọi `fetch`; nó nhận dữ liệu vào, trả chuỗi ra. `build.mjs` không chứa
quyết định nào — chỉ đọc, gọi, ghi.

Node 22+ (máy đang có v26.7.0). Zero dependency: `fetch`, `node --test`,
`JSON.parse` đều là built-in. Không có `package.json` dependencies, không có
lockfile, không có `npm ci` trong CI.

## Schema `data/ime.json`

File là một object hai khoá:

```json
{
  "muc": [ /* mảng các mục, schema dưới */ ],
  "chon_nhanh": {
    "macos":   ["gonhanh", "xkey"],
    "windows": ["vkey", "viettype"],
    "linux":   ["ibus-bamboo", "fcitx5-lotus"]
  }
}
```

`chon_nhanh` là phần biên tập duy nhất của người bảo trì — máy không suy ra
được "nên dùng cái nào". Giá trị là `id` của mục, validate phải tồn tại trong
`muc`, mỗi OS 2–3 id. Bảng Chọn nhanh render từ đây.

Một mục:

```json
{
  "id": "gonhanh",
  "ten": "Gõ Nhanh",
  "repo": "khaphanspace/gonhanh.org",
  "trang_chu": "https://gonhanh.org",
  "nen_tang": ["macos"],
  "nhom": "bo_go",
  "ghi_chu": "Hiệu suất cao, native Swift"
}
```

| Trường | Bắt buộc | Ghi chú |
|--------|----------|---------|
| `id` | có | kebab-case, duy nhất toàn file |
| `ten` | có | tên hiển thị, giữ nguyên cách viết của tác giả |
| `repo` | có | `"owner/name"`, hoặc `null` nếu không có mã nguồn công khai |
| `trang_chu` | không | URL; nếu vắng và có `repo` thì link về repo |
| `nen_tang` | có | tập con của `["macos", "windows", "linux"]`, không rỗng |
| `nhom` | có | `"bo_go"` hoặc `"thu_vien"` |
| `ghi_chu` | có | một câu, ≤ 90 ký tự, mô tả cái làm nó khác biệt |

**Nguyên tắc bất di dịch: cái gì GitHub API biết thì cấm khai trong `ime.json`.**
★, ngày push cuối, giấy phép, ngôn ngữ, cờ archived đều lấy từ API. Khai tay là
mở đường cho lệch số liệu — đúng thứ bệnh mà repo này sinh ra để chữa.

Mục closed-source (`repo: null`) không gọi API: ★ và ngày hiện `—`, nhãn ⚫.

## Nhãn trạng thái

Tính từ `pushed_at` của repo so với thời điểm chạy:

| Nhãn | Điều kiện |
|------|-----------|
| 📦 Lưu trữ | `archived === true` — đè mọi điều kiện dưới |
| 🟢 Hoạt động | push cuối ≤ 183 ngày |
| 🟡 Chậm | > 183 ngày và ≤ 730 ngày |
| 🔴 Ngưng | > 730 ngày |
| ⚫ Không rõ | `repo === null` |
| ❓ Lỗi truy cập | repo trả 404, hoặc bị đặt riêng tư |

Mốc tính bằng **ngày tròn**, không phải tháng lịch: 183 và 730. "6 tháng" và
"2 năm" chỉ là cách gọi. Tháng lịch sẽ làm nhãn phụ thuộc vào việc chạy rơi vào
tháng nào — không test được cho ra hồn.

`pushed_at` đổi khi push lên **bất kỳ nhánh nào**, kể cả tag — đây là chủ ý.
Câu hỏi cần trả lời là "dự án còn ai đụng vào không", không phải "nhánh mặc
định có commit mới không". Đổi lại chỉ tốn một request mỗi repo thay vì hai.

Mốc thời gian lấy từ lúc script chạy, không hardcode.

## Bố cục README

1. **Mở đầu, 3 câu** — list này là gì, số liệu tự cập nhật hàng tuần, nhãn
   trạng thái nghĩa là gì.
2. **Chọn nhanh** — mỗi OS một dòng, 2–3 gợi ý. Phục vụ người vào chỉ để lấy
   một cái tên rồi đi.
3. **Bộ gõ** — tách theo `## macOS`, `## Windows`, `## Linux`,
   `## Đa nền tảng`.
4. **Thư viện & engine** — cho người tự viết bộ gõ.
5. **Chân trang** — "Số liệu chốt ngày …", link CONTRIBUTING, giấy phép.

Cột mỗi bảng: `Tên | ★ | Cập nhật | Giấy phép | Ghi chú`.

Mục có `nen_tang` từ 2 phần tử trở lên vào thẳng nhóm **Đa nền tảng**, không
lặp lại ở từng OS. Mỗi mục xuất hiện đúng một lần trong toàn README.

Sắp xếp trong mỗi nhóm: ★ giảm dần; bằng ★ thì theo `ten` A–Z bằng
`localeCompare('vi')`; mục không có ★ (`repo: null`) xuống cuối nhóm.

## `scripts/build.mjs`

1. Đọc và validate `data/ime.json`. Sai schema → in lỗi, exit 1, không ghi gì.
2. Với mỗi mục có `repo`: `GET https://api.github.com/repos/{repo}`, lấy
   `stargazers_count`, `license.spdx_id`, `language`, `archived`, `pushed_at`,
   `full_name`. Header `Authorization: Bearer $GITHUB_TOKEN` khi biến tồn tại.
3. So `full_name` trả về với `repo` khai báo — khác nhau nghĩa là repo đã đổi
   tên/chủ. Vẫn dùng số liệu, nhưng đẩy cảnh báo để lần sau sửa `ime.json`.
4. Dựng snapshot số liệu, so với `data/.snapshot.json`. **Giống hệt → thoát 0,
   không ghi file nào.**
5. Khác → render README, ghi `README.md` và `data/.snapshot.json`.
6. In cảnh báo (nếu có) ra `$GITHUB_STEP_SUMMARY` khi biến tồn tại, ngoài ra
   ra stderr.

Snapshot tồn tại để giải một mâu thuẫn thật: README có dòng ngày, nên so sánh
file luôn thấy khác, nên cron sẽ đẻ 52 commit rác mỗi năm. So snapshot là so
**số liệu**, không so văn bản. Ngày trong README vì thế chỉ đổi khi có số liệu
đổi — và như vậy nó mang đúng nghĩa "số liệu này chốt lúc nào". Bonus:
`git log data/.snapshot.json` thành lịch sử ★ theo thời gian.

### Xử lý lỗi

Cron chạy lúc không ai ngồi canh, nên mỗi loại lỗi phải có hành vi định trước:

| Tình huống | Hành vi |
|------------|---------|
| Repo 404 / bị đặt riêng tư | Mục đó nhãn ❓, ★ `—`. **Build vẫn xanh.** Ghi cảnh báo vào job summary |
| Lỗi mạng, 5xx | Thử lại 2 lần, cách 2s. Vẫn hỏng → exit 1 |
| Hết rate limit (403/429 kèm `x-ratelimit-remaining: 0`) | exit 1 ngay, không thử lại |
| Quá 30% số mục có repo bị lỗi truy cập | exit 1 — coi là sự cố hệ thống |
| Bất kỳ exit ≠ 0 nào | Không ghi README, không ghi snapshot. Bản cũ giữ nguyên |

Hai nhánh 403 phải phân biệt: "repo này riêng tư" là tin tức về **một mục**, còn
"hết quota" là tin tức về **cả lần chạy**. Gộp chung thì hoặc là một repo hỏng
làm đỏ CI vô cớ, hoặc là hết quota âm thầm biến cả list thành ❓ rồi commit đè.

Ngưỡng 30% chặn đúng ca thứ hai: nếu quá nhiều mục cùng hỏng một lúc, thủ phạm
gần như chắc chắn là phía ta chứ không phải hàng chục tác giả cùng xoá repo.

Rate limit thực tế: ~30 request mỗi tuần, hạn `GITHUB_TOKEN` là 5000/giờ.

## `.github/workflows/refresh.yml`

```yaml
on:
  schedule:
    - cron: '0 3 * * 1'        # 03:00 UTC thứ 2 = 10:00 giờ VN
  push:
    paths: ['data/ime.json', 'scripts/**']
  workflow_dispatch:
permissions:
  contents: write
```

Các bước: checkout → setup-node 22 → `node --test scripts/` →
`node scripts/build.mjs` → nếu `git status --porcelain` rỗng thì dừng, ngược
lại commit `chore: cập nhật số liệu <ngày>` và push.

Test chạy **trước** build. Script hỏng thì không có cơ hội ghi đè README.

## Kiểm thử

`node --test scripts/`, chỉ nhắm vào `lib.mjs` — thuần, không mạng:

1. **`phanLoaiTrangThai`** — 0 ngày → 🟢; 183 ngày → 🟢; 184 ngày → 🟡; 730
   ngày → 🟡; 731 ngày → 🔴; `archived: true` dù push hôm qua → 📦;
   `repo: null` → ⚫; lỗi truy cập → ❓.
2. **`sapXep`** — ★ giảm dần; bằng ★ xếp theo tên có dấu đúng thứ tự tiếng
   Việt; mục không ★ xuống cuối.
3. **`escapeBang`** — `ghi_chu` chứa `|` phải thành `\|`; chứa xuống dòng phải
   thành khoảng trắng. Một dấu `|` lọt qua là vỡ bảng markdown.
4. **`chonNhom`** — một nền tảng → nhóm OS đó; từ hai trở lên → Đa nền tảng.
5. **`validateData`** — `id` trùng ném lỗi; thiếu trường bắt buộc ném lỗi;
   `nen_tang` rỗng ném lỗi; `nhom` lạ ném lỗi.

Kiểm chứng thật, không thay bằng test: chạy `node scripts/build.mjs` tại máy
với token thật, đọc README sinh ra.

## Dữ liệu ban đầu

Khoảng 28 mục, mỗi mục **phải gọi API xác nhận repo còn tồn tại trước khi đưa
vào** — không chép thẳng kết quả `gh search`. Ứng viên đã khảo sát:

- **Đa nền tảng:** OpenKey, vnkey (marixdev), Funput, Unikey, GoTiengViet
- **macOS:** GoNhanh, xkey, PHTV, goxkey, Caffee
- **Windows:** VKey, VietType, EVKey, VietIME
- **Linux:** ibus-bamboo, fcitx5-lotus, vietc, ibus-teni, xvnkb
- **Thư viện/engine (`nhom: "thu_vien"`):** vi-rs, uvie-rs, BoGoEngine,
  bogo-python

Repo lưu trữ hoặc đã chết vẫn được đưa vào nếu có ý nghĩa lịch sử (BoGoEngine,
xvnkb) — nhãn 🔴/📦 đã nói đủ, xoá đi thì mất bản đồ. Loại bỏ: repo dưới 2 ★
đồng thời không có README thực chất, và fork không thay đổi gì so với gốc.

**Phải kiểm trước khi điền, không được đoán:** một số mục có repo GitHub nhưng
repo đó chỉ để phát hành bản build chứ không chứa mã nguồn (nghi vấn:
`lamquangminh/EVKey`, các gói Unikey). Cách phân định lúc dựng dữ liệu: nếu API
trả `language: null` và cây thư mục không có mã nguồn, đặt `repo: null` và trỏ
`trang_chu` về trang tải chính thức. Không lấy sự tồn tại của repo làm bằng
chứng mã nguồn mở.

`license.spdx_id` có thể là `null` (repo không khai giấy phép) hoặc
`"NOASSERTION"` — cả hai render thành `—`, không được để lọt chữ `null` vào
bảng.

## Tiêu chí thành công

1. `node --test scripts/` xanh.
2. `node scripts/build.mjs` sinh README đủ số mục, không có chuỗi `undefined`,
   `NaN`, hay `null` nào lọt vào văn bản.
3. Chạy lần thứ hai ngay sau đó: thoát 0, **không** sửa file nào (snapshot khớp).
4. Mọi liên kết trong README trả HTTP 200 — kiểm một lần bằng script tạm, không
   đưa vào CI.
5. Bảng markdown render đúng trên GitHub, kể cả mục có `|` trong ghi chú.
