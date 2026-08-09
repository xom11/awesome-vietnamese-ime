# awesome-vietnamese-ime — Kế hoạch triển khai

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dựng awesome list bộ gõ tiếng Việt với số liệu ★ / lần push cuối / giấy phép do GitHub Action tự cập nhật hàng tuần, kèm nhãn trạng thái còn-sống.

**Architecture:** `data/ime.json` là nguồn chân lý cho phần người viết; `scripts/lib.mjs` chứa toàn bộ logic thuần (validate, phân loại, sắp xếp, render) và được test không cần mạng; `scripts/build.mjs` chỉ làm I/O (đọc file, gọi GitHub API, ghi `README.md` + `data/.snapshot.json`).

**Tech Stack:** Node 22+ thuần, zero dependency (`fetch`, `node --test`, `JSON.parse` đều built-in). GitHub Actions.

Spec: `docs/superpowers/specs/2026-08-09-awesome-vietnamese-ime-design.md`

## Global Constraints

- Node ≥ 22 (máy đang có v26.7.0). **Zero dependency**: không `dependencies` trong `package.json`, không lockfile, không `npm ci` trong CI.
- `scripts/lib.mjs` **không được** `import 'node:fs'` và **không được** gọi `fetch`. Đây là điều kiện để test toàn bộ logic không chạm mạng.
- `README.md` và `data/.snapshot.json` là file **sinh ra** — không sửa tay, không viết nội dung trực tiếp vào chúng ở bất kỳ task nào ngoài Task 4/6.
- Cái gì GitHub API biết (★, `pushed_at`, giấy phép, ngôn ngữ, `archived`) thì **cấm khai** trong `data/ime.json`.
- Mốc nhãn trạng thái: **183 ngày** và **730 ngày** tròn (không dùng tháng lịch).
- Mọi văn bản hiển thị cho người đọc bằng **tiếng Việt**.
- Commit message tiếng Việt dạng `<phạm vi>: <nội dung>`. **KHÔNG** thêm `Co-Authored-By`.
- Giấy phép repo: CC0-1.0.
- Làm việc tại `/Users/lenamkhanh/Documents/dev/awesome-vietnamese-ime`, nhánh `main`.

## Cấu trúc file

| File | Trách nhiệm |
|------|-------------|
| `data/ime.json` | Nguồn chân lý: danh sách mục + `chon_nhanh`. Chỉ chứa thứ API không biết |
| `data/.snapshot.json` | Sinh ra. Ảnh chụp mọi thứ README phụ thuộc vào, dùng để quyết định có ghi lại README hay không |
| `scripts/lib.mjs` | Thuần. Validate, phân loại nhãn, chọn nhóm, sắp xếp, escape, render README, phân loại lỗi HTTP, ngưỡng lỗi |
| `scripts/lib.test.mjs` | `node --test`. Chỉ nhắm vào `lib.mjs` |
| `scripts/build.mjs` | I/O. Đọc data, gọi API + retry, so snapshot, ghi file, in cảnh báo |
| `.github/workflows/refresh.yml` | Cron thứ 2 + on-push + thủ công. Chạy test trước build |
| `README.md` | Sinh ra |
| `CONTRIBUTING.md` | Hướng dẫn: sửa data, đừng sửa README |
| `LICENSE` | CC0-1.0 |

---

### Task 1: Khung repo + validate dữ liệu

**Files:**
- Create: `.gitignore`, `LICENSE`, `scripts/lib.mjs`, `scripts/lib.test.mjs`

**Interfaces:**
- Consumes: không
- Produces: `NEN_TANG_HOP_LE: string[]`, `NHOM_HOP_LE: string[]`, `validateData(data): void` (ném `Error` khi sai, trả `undefined` khi đúng)

- [ ] **Step 1: Tạo `.gitignore`**

```
node_modules/
.DS_Store
```

Lưu ý: **không** thêm `.snapshot.json` hay `data/.*` — file đó phải được commit.

- [ ] **Step 2: Lấy toàn văn giấy phép CC0-1.0**

```bash
cd /Users/lenamkhanh/Documents/dev/awesome-vietnamese-ime
gh api /licenses/cc0-1.0 --jq .body > LICENSE
head -3 LICENSE
```

Kỳ vọng: dòng đầu là `Creative Commons Legal Code`.

- [ ] **Step 3: Viết test thất bại cho `validateData`**

Tạo `scripts/lib.test.mjs`:

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validateData } from './lib.mjs'

function muc(ghiDe = {}) {
  return {
    id: 'a', ten: 'A', repo: 'chu/kho',
    nen_tang: ['macos'], nhom: 'bo_go', ghi_chu: 'ghi chú',
    ...ghiDe,
  }
}

function data(ds = [muc(), muc({ id: 'b', ten: 'B' })]) {
  return {
    muc: ds,
    chon_nhanh: { macos: ['a', 'b'], windows: ['a', 'b'], linux: ['a', 'b'] },
  }
}

test('validateData: dữ liệu hợp lệ không ném lỗi', () => {
  assert.doesNotThrow(() => validateData(data()))
})

test('validateData: id trùng thì ném lỗi', () => {
  assert.throws(() => validateData(data([muc(), muc()])), /id trùng "a"/)
})

test('validateData: thiếu trường bắt buộc thì ném lỗi', () => {
  const m = muc(); delete m.ghi_chu
  assert.throws(() => validateData(data([m, muc({ id: 'b', ten: 'B' })])), /thiếu trường "ghi_chu"/)
})

test('validateData: nen_tang rỗng thì ném lỗi', () => {
  assert.throws(
    () => validateData(data([muc({ nen_tang: [] }), muc({ id: 'b', ten: 'B' })])),
    /nen_tang phải là mảng không rỗng/,
  )
})

test('validateData: nen_tang lạ thì ném lỗi', () => {
  assert.throws(
    () => validateData(data([muc({ nen_tang: ['bsd'] }), muc({ id: 'b', ten: 'B' })])),
    /nen_tang lạ "bsd"/,
  )
})

test('validateData: nhom lạ thì ném lỗi', () => {
  assert.throws(
    () => validateData(data([muc({ nhom: 'khac' }), muc({ id: 'b', ten: 'B' })])),
    /nhom lạ "khac"/,
  )
})

test('validateData: repo null hợp lệ, repo sai định dạng thì ném lỗi', () => {
  assert.doesNotThrow(() => validateData(data([muc({ repo: null }), muc({ id: 'b', ten: 'B' })])))
  assert.throws(
    () => validateData(data([muc({ repo: 'khong-co-gach-cheo' }), muc({ id: 'b', ten: 'B' })])),
    /repo phải dạng "owner\/name"/,
  )
})

test('validateData: chon_nhanh trỏ id không tồn tại thì ném lỗi', () => {
  const d = data(); d.chon_nhanh.linux = ['a', 'khong-ton-tai']
  assert.throws(() => validateData(d), /chon_nhanh\.linux: id không tồn tại "khong-ton-tai"/)
})

test('validateData: chon_nhanh thiếu số lượng thì ném lỗi', () => {
  const d = data(); d.chon_nhanh.macos = ['a']
  assert.throws(() => validateData(d), /chon_nhanh\.macos: phải có 2–3 id/)
})

test('validateData: ghi_chu quá 90 ký tự thì ném lỗi', () => {
  assert.throws(
    () => validateData(data([muc({ ghi_chu: 'x'.repeat(91) }), muc({ id: 'b', ten: 'B' })])),
    /ghi_chu quá 90 ký tự/,
  )
})
```

- [ ] **Step 4: Chạy test, xác nhận nó trượt**

```bash
cd /Users/lenamkhanh/Documents/dev/awesome-vietnamese-ime && node --test scripts/
```

Kỳ vọng: trượt với `Cannot find module .../scripts/lib.mjs`.

- [ ] **Step 5: Viết `scripts/lib.mjs` đủ để test xanh**

```js
export const NEN_TANG_HOP_LE = ['macos', 'windows', 'linux']
export const NHOM_HOP_LE = ['bo_go', 'thu_vien']

export function validateData(data) {
  if (!data || typeof data !== 'object') throw new Error('ime.json phải là một object')
  if (!Array.isArray(data.muc)) throw new Error('ime.json thiếu mảng "muc"')
  if (!data.chon_nhanh || typeof data.chon_nhanh !== 'object')
    throw new Error('ime.json thiếu object "chon_nhanh"')

  const loi = []
  const ids = new Set()

  for (const [i, m] of data.muc.entries()) {
    const o = `muc[${i}]`
    for (const t of ['id', 'ten', 'nhom', 'ghi_chu']) {
      if (typeof m[t] !== 'string' || m[t] === '') loi.push(`${o}: thiếu trường "${t}"`)
    }
    if (!('repo' in m)) loi.push(`${o}: thiếu trường "repo" (dùng null nếu không có mã nguồn công khai)`)
    else if (m.repo !== null && !/^[^/\s]+\/[^/\s]+$/.test(String(m.repo)))
      loi.push(`${o}: repo phải dạng "owner/name", nhận "${m.repo}"`)

    if (!Array.isArray(m.nen_tang) || m.nen_tang.length === 0)
      loi.push(`${o}: nen_tang phải là mảng không rỗng`)
    else
      for (const nt of m.nen_tang)
        if (!NEN_TANG_HOP_LE.includes(nt)) loi.push(`${o}: nen_tang lạ "${nt}"`)

    if (typeof m.nhom === 'string' && m.nhom !== '' && !NHOM_HOP_LE.includes(m.nhom))
      loi.push(`${o}: nhom lạ "${m.nhom}"`)

    if (typeof m.ghi_chu === 'string' && m.ghi_chu.length > 90)
      loi.push(`${o}: ghi_chu quá 90 ký tự (${m.ghi_chu.length})`)

    if (ids.has(m.id)) loi.push(`${o}: id trùng "${m.id}"`)
    ids.add(m.id)
  }

  for (const os of NEN_TANG_HOP_LE) {
    const ds = data.chon_nhanh[os]
    if (!Array.isArray(ds) || ds.length < 2 || ds.length > 3) {
      loi.push(`chon_nhanh.${os}: phải có 2–3 id`)
      continue
    }
    for (const id of ds)
      if (!ids.has(id)) loi.push(`chon_nhanh.${os}: id không tồn tại "${id}"`)
  }

  if (loi.length) throw new Error('Dữ liệu sai:\n  ' + loi.join('\n  '))
}
```

- [ ] **Step 6: Chạy test, xác nhận xanh**

```bash
node --test scripts/
```

Kỳ vọng: `pass 10`, `fail 0`.

- [ ] **Step 7: Commit**

```bash
git add .gitignore LICENSE scripts/lib.mjs scripts/lib.test.mjs
git commit -m "khung: validate data/ime.json + giấy phép CC0"
```

---

### Task 2: Nhãn trạng thái

**Files:**
- Modify: `scripts/lib.mjs`
- Modify: `scripts/lib.test.mjs`

**Interfaces:**
- Consumes: không
- Produces: `phanLoaiTrangThai(muc, bayGio): { nhan: string, ten: string }` — `muc` cần các trường `repo`, `archived`, `pushed_at`, `loi_truy_cap`; `bayGio` là số mili-giây (Unix ms)

- [ ] **Step 1: Viết test thất bại**

Thêm vào cuối `scripts/lib.test.mjs`:

```js
import { phanLoaiTrangThai } from './lib.mjs'

const NGAY = 86_400_000
const BAY_GIO = Date.parse('2026-08-09T00:00:00Z')

function truoc(soNgay) {
  return new Date(BAY_GIO - soNgay * NGAY).toISOString()
}

function mucApi(ghiDe = {}) {
  return { repo: 'chu/kho', archived: false, pushed_at: truoc(0), loi_truy_cap: false, ...ghiDe }
}

test('phanLoaiTrangThai: mới push hôm nay là hoạt động', () => {
  assert.equal(phanLoaiTrangThai(mucApi(), BAY_GIO).nhan, '🟢')
})

test('phanLoaiTrangThai: biên 183 ngày vẫn hoạt động, 184 ngày là chậm', () => {
  assert.equal(phanLoaiTrangThai(mucApi({ pushed_at: truoc(183) }), BAY_GIO).nhan, '🟢')
  assert.equal(phanLoaiTrangThai(mucApi({ pushed_at: truoc(184) }), BAY_GIO).nhan, '🟡')
})

test('phanLoaiTrangThai: biên 730 ngày vẫn chậm, 731 ngày là ngưng', () => {
  assert.equal(phanLoaiTrangThai(mucApi({ pushed_at: truoc(730) }), BAY_GIO).nhan, '🟡')
  assert.equal(phanLoaiTrangThai(mucApi({ pushed_at: truoc(731) }), BAY_GIO).nhan, '🔴')
})

test('phanLoaiTrangThai: archived đè lên mọi mốc ngày', () => {
  assert.equal(phanLoaiTrangThai(mucApi({ archived: true, pushed_at: truoc(1) }), BAY_GIO).nhan, '📦')
})

test('phanLoaiTrangThai: không có repo là không rõ', () => {
  assert.equal(phanLoaiTrangThai(mucApi({ repo: null, pushed_at: null }), BAY_GIO).nhan, '⚫')
})

test('phanLoaiTrangThai: lỗi truy cập đè lên tất cả', () => {
  assert.equal(
    phanLoaiTrangThai(mucApi({ loi_truy_cap: true, archived: true, pushed_at: null }), BAY_GIO).nhan,
    '❓',
  )
})
```

- [ ] **Step 2: Chạy test, xác nhận trượt**

```bash
node --test scripts/
```

Kỳ vọng: trượt vì `phanLoaiTrangThai is not a function` (hoặc lỗi import).

- [ ] **Step 3: Cài đặt trong `scripts/lib.mjs`**

Thêm vào cuối file:

```js
const NGAY = 86_400_000
const NGUONG_HOAT_DONG = 183
const NGUONG_CHAM = 730

export function phanLoaiTrangThai(muc, bayGio) {
  if (muc.loi_truy_cap) return { nhan: '❓', ten: 'Lỗi truy cập' }
  if (!muc.repo) return { nhan: '⚫', ten: 'Không rõ' }
  if (muc.archived) return { nhan: '📦', ten: 'Lưu trữ' }

  const soNgay = Math.floor((bayGio - Date.parse(muc.pushed_at)) / NGAY)
  if (soNgay <= NGUONG_HOAT_DONG) return { nhan: '🟢', ten: 'Hoạt động' }
  if (soNgay <= NGUONG_CHAM) return { nhan: '🟡', ten: 'Chậm' }
  return { nhan: '🔴', ten: 'Ngưng' }
}
```

- [ ] **Step 4: Chạy test, xác nhận xanh**

```bash
node --test scripts/
```

Kỳ vọng: `pass 16`, `fail 0`.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib.mjs scripts/lib.test.mjs
git commit -m "lib: nhãn trạng thái theo mốc 183/730 ngày"
```

---

### Task 3: Phân nhóm và sắp xếp

**Files:**
- Modify: `scripts/lib.mjs`
- Modify: `scripts/lib.test.mjs`

**Interfaces:**
- Consumes: không
- Produces: `chonNhom(muc): 'macos'|'windows'|'linux'|'da_nen'|'thu_vien'`, `sapXep(ds): array` (trả mảng mới, không sửa mảng vào)

- [ ] **Step 1: Viết test thất bại**

Thêm vào cuối `scripts/lib.test.mjs`:

```js
import { chonNhom, sapXep } from './lib.mjs'

test('chonNhom: một nền tảng thì vào nhóm OS đó', () => {
  assert.equal(chonNhom(muc({ nen_tang: ['macos'] })), 'macos')
  assert.equal(chonNhom(muc({ nen_tang: ['windows'] })), 'windows')
  assert.equal(chonNhom(muc({ nen_tang: ['linux'] })), 'linux')
})

test('chonNhom: từ hai nền tảng trở lên thì vào đa nền tảng', () => {
  assert.equal(chonNhom(muc({ nen_tang: ['macos', 'windows'] })), 'da_nen')
  assert.equal(chonNhom(muc({ nen_tang: ['macos', 'windows', 'linux'] })), 'da_nen')
})

test('chonNhom: thư viện luôn vào nhóm thư viện dù đa nền tảng', () => {
  assert.equal(chonNhom(muc({ nhom: 'thu_vien', nen_tang: ['macos', 'linux'] })), 'thu_vien')
})

test('sapXep: sao giảm dần', () => {
  const ds = [
    { ten: 'A', sao: 10 }, { ten: 'B', sao: 300 }, { ten: 'C', sao: 50 },
  ]
  assert.deepEqual(sapXep(ds).map(m => m.ten), ['B', 'C', 'A'])
})

test('sapXep: bằng sao thì theo tên, đúng thứ tự tiếng Việt', () => {
  const ds = [{ ten: 'Ước', sao: 5 }, { ten: 'Ánh', sao: 5 }, { ten: 'Đông', sao: 5 }]
  assert.deepEqual(sapXep(ds).map(m => m.ten), ['Ánh', 'Đông', 'Ước'])
})

test('sapXep: mục không có sao xuống cuối', () => {
  const ds = [{ ten: 'A', sao: null }, { ten: 'B', sao: 0 }, { ten: 'C', sao: 7 }]
  assert.deepEqual(sapXep(ds).map(m => m.ten), ['C', 'B', 'A'])
})

test('sapXep: không sửa mảng đầu vào', () => {
  const ds = [{ ten: 'A', sao: 1 }, { ten: 'B', sao: 9 }]
  sapXep(ds)
  assert.deepEqual(ds.map(m => m.ten), ['A', 'B'])
})
```

Chú ý ca `sao: 0` phải đứng **trên** `sao: null` — đây là bẫy: kiểm tra bằng `if (!sao)` sẽ gộp `0` với `null` và làm sai thứ tự.

- [ ] **Step 2: Chạy test, xác nhận trượt**

```bash
node --test scripts/
```

- [ ] **Step 3: Cài đặt trong `scripts/lib.mjs`**

```js
export function chonNhom(muc) {
  if (muc.nhom === 'thu_vien') return 'thu_vien'
  if (muc.nen_tang.length >= 2) return 'da_nen'
  return muc.nen_tang[0]
}

export function sapXep(ds) {
  return [...ds].sort((a, b) => {
    const sa = a.sao ?? -1
    const sb = b.sao ?? -1
    if (sa !== sb) return sb - sa
    return a.ten.localeCompare(b.ten, 'vi')
  })
}
```

- [ ] **Step 4: Chạy test, xác nhận xanh**

```bash
node --test scripts/
```

Kỳ vọng: `pass 23`, `fail 0`.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib.mjs scripts/lib.test.mjs
git commit -m "lib: phân nhóm theo nền tảng và sắp xếp theo sao"
```

---

### Task 4: Render README

**Files:**
- Modify: `scripts/lib.mjs`
- Modify: `scripts/lib.test.mjs`

**Interfaces:**
- Consumes: `phanLoaiTrangThai`, `chonNhom`, `sapXep` (Task 2, 3)
- Produces: `escapeBang(s): string`, `renderReadme({ muc, chon_nhanh, bayGio }): string`
  - `muc` là mảng đã trộn dữ liệu API, mỗi phần tử có: `id, ten, repo, trang_chu?, nen_tang, nhom, ghi_chu, sao, giay_phep, pushed_at, archived, loi_truy_cap`

- [ ] **Step 1: Viết test thất bại**

Thêm vào cuối `scripts/lib.test.mjs`:

```js
import { escapeBang, renderReadme } from './lib.mjs'

test('escapeBang: gạch đứng phải được thoát', () => {
  assert.equal(escapeBang('a | b'), 'a \\| b')
})

test('escapeBang: xuống dòng thành khoảng trắng', () => {
  assert.equal(escapeBang('a\nb\r\nc'), 'a b c')
})

function mucDay(ghiDe = {}) {
  return {
    id: 'a', ten: 'A', repo: 'chu/kho', nen_tang: ['macos'], nhom: 'bo_go',
    ghi_chu: 'ghi chú', sao: 10, giay_phep: 'MIT',
    pushed_at: truoc(1), archived: false, loi_truy_cap: false,
    ...ghiDe,
  }
}

function renderThu(ds) {
  return renderReadme({
    muc: ds,
    chon_nhanh: {
      macos: [ds[0].id, ds[1].id], windows: [ds[0].id, ds[1].id], linux: [ds[0].id, ds[1].id],
    },
    bayGio: BAY_GIO,
  })
}

test('renderReadme: mỗi mục chỉ nằm trong đúng một bảng', () => {
  const ds = [mucDay(), mucDay({ id: 'b', ten: 'BeeKey', nen_tang: ['macos', 'linux'] })]
  const phanBang = renderThu(ds).split('## Bộ gõ')[1]
  assert.equal(phanBang.split('BeeKey').length - 1, 1, 'không được lặp ở nhiều nhóm')
  assert.ok(
    phanBang.split('### Đa nền tảng')[1].includes('BeeKey'),
    'hai nền tảng thì phải nằm ở nhóm Đa nền tảng',
  )
})

test('renderReadme: giấy phép null và NOASSERTION đều thành gạch ngang', () => {
  const ds = [mucDay({ giay_phep: null }), mucDay({ id: 'b', ten: 'B', giay_phep: 'NOASSERTION' })]
  const out = renderThu(ds)
  assert.ok(!out.includes('null'), 'không được lọt chữ null')
  assert.ok(!out.includes('NOASSERTION'), 'không được lọt NOASSERTION')
})

test('renderReadme: sao bằng 0 hiện số 0, không phải gạch ngang', () => {
  const ds = [mucDay({ sao: 0 }), mucDay({ id: 'b', ten: 'B' })]
  assert.ok(renderThu(ds).includes('| 0 |'))
})

test('renderReadme: mục không có repo dùng trang_chu làm liên kết', () => {
  const ds = [
    mucDay({ repo: null, trang_chu: 'https://unikey.org', sao: null, giay_phep: null, pushed_at: null }),
    mucDay({ id: 'b', ten: 'B' }),
  ]
  assert.ok(renderThu(ds).includes('[A](https://unikey.org)'))
})

test('renderReadme: gạch đứng trong ghi chú không làm vỡ bảng', () => {
  const ds = [mucDay({ ghi_chu: 'Telex | VNI' }), mucDay({ id: 'b', ten: 'B' })]
  const dong = renderThu(ds).split('\n').find(d => d.includes('Telex'))
  assert.equal(dong.split('|').length - 1, 6, 'đúng 6 dấu | biên cột, không thêm cột lạ')
})

test('renderReadme: không lọt undefined hay NaN', () => {
  const out = renderThu([mucDay(), mucDay({ id: 'b', ten: 'B' })])
  assert.ok(!out.includes('undefined'))
  assert.ok(!out.includes('NaN'))
})

test('renderReadme: nhóm rỗng vẫn có tiêu đề và ghi chú trống', () => {
  const ds = [mucDay(), mucDay({ id: 'b', ten: 'B' })]
  const out = renderThu(ds)
  assert.ok(out.includes('### Windows'))
  assert.ok(out.includes('_Chưa có mục nào._'))
})

test('renderReadme: chân trang có ngày chốt', () => {
  const out = renderThu([mucDay(), mucDay({ id: 'b', ten: 'B' })])
  assert.ok(out.includes('Số liệu chốt ngày 2026-08-09'))
})
```

- [ ] **Step 2: Chạy test, xác nhận trượt**

```bash
node --test scripts/
```

- [ ] **Step 3: Cài đặt trong `scripts/lib.mjs`**

```js
const TEN_NHOM = {
  macos: 'macOS',
  windows: 'Windows',
  linux: 'Linux',
  da_nen: 'Đa nền tảng',
  thu_vien: 'Thư viện & engine',
}
const NHOM_BO_GO = ['macos', 'windows', 'linux', 'da_nen']

export function escapeBang(s) {
  return String(s).replace(/\r?\n/g, ' ').replace(/\|/g, '\\|').trim()
}

function o(v) {
  return v === null || v === undefined || v === 'NOASSERTION' ? '—' : String(v)
}

function lienKet(m) {
  const url = m.trang_chu || (m.repo ? `https://github.com/${m.repo}` : null)
  const ten = escapeBang(m.ten)
  return url ? `[${ten}](${url})` : ten
}

function dongBang(m, bayGio) {
  const tt = phanLoaiTrangThai(m, bayGio)
  const ngay = m.pushed_at && !m.loi_truy_cap ? m.pushed_at.slice(0, 7) : '—'
  return `| ${lienKet(m)} | ${o(m.sao)} | ${tt.nhan} ${ngay} | ${o(m.giay_phep)} | ${escapeBang(m.ghi_chu)} |`
}

function bang(ds, bayGio) {
  if (ds.length === 0) return ['_Chưa có mục nào._']
  return [
    '| Tên | ★ | Cập nhật | Giấy phép | Ghi chú |',
    '|---|---:|---|---|---|',
    ...sapXep(ds).map(m => dongBang(m, bayGio)),
  ]
}

export function renderReadme({ muc, chon_nhanh, bayGio }) {
  const theoNhom = new Map([...NHOM_BO_GO, 'thu_vien'].map(k => [k, []]))
  for (const m of muc) theoNhom.get(chonNhom(m)).push(m)
  const theoId = new Map(muc.map(m => [m.id, m]))

  const p = [
    '# Awesome Vietnamese IME',
    '',
    'Danh sách bộ gõ tiếng Việt cho máy tính bàn, kèm thư viện cho người muốn tự viết bộ gõ.',
    '',
    'Số liệu ★, lần push cuối và giấy phép do GitHub Action tự cập nhật hàng tuần — không ai phải sửa tay, nên không lỗi thời.',
    '',
    'Nhãn theo lần push gần nhất: 🟢 trong 6 tháng · 🟡 6–24 tháng · 🔴 quá 24 tháng · 📦 repo đã lưu trữ · ⚫ không có mã nguồn công khai · ❓ không truy cập được repo.',
    '',
    '## Chọn nhanh',
    '',
    'Không muốn đọc hết thì lấy một trong những cái này:',
    '',
    '| Hệ điều hành | Gợi ý |',
    '|---|---|',
  ]

  for (const os of NEN_TANG_HOP_LE) {
    const goiY = chon_nhanh[os].map(id => lienKet(theoId.get(id))).join(' · ')
    p.push(`| ${TEN_NHOM[os]} | ${goiY} |`)
  }

  p.push('', '## Bộ gõ')
  for (const k of NHOM_BO_GO) {
    p.push('', `### ${TEN_NHOM[k]}`, '', ...bang(theoNhom.get(k), bayGio))
  }

  p.push(
    '',
    `## ${TEN_NHOM.thu_vien}`,
    '',
    'Cho người muốn tự viết bộ gõ chứ không phải đi tìm bộ gõ để dùng.',
    '',
    ...bang(theoNhom.get('thu_vien'), bayGio),
    '',
    '---',
    '',
    `Số liệu chốt ngày ${new Date(bayGio).toISOString().slice(0, 10)}.`,
    '',
    'Thiếu bộ gõ nào thì sửa [`data/ime.json`](data/ime.json) — xem [CONTRIBUTING.md](CONTRIBUTING.md). **Đừng sửa README.md, file này do máy sinh ra.**',
    '',
    'Giấy phép: [CC0-1.0](LICENSE).',
    '',
  )

  return p.join('\n')
}
```

- [ ] **Step 4: Chạy test, xác nhận xanh**

```bash
node --test scripts/
```

Kỳ vọng: `pass 33`, `fail 0`.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib.mjs scripts/lib.test.mjs
git commit -m "lib: render README từ dữ liệu đã trộn số liệu API"
```

---

### Task 5: Phân loại lỗi HTTP và ngưỡng sự cố

**Files:**
- Modify: `scripts/lib.mjs`
- Modify: `scripts/lib.test.mjs`

**Interfaces:**
- Consumes: không
- Produces: `phanLoaiLoi({ status, headers }): 'muc'|'ha_tang'|'tam_thoi'`, `vuotNguong(soCoRepo, soLoi): boolean`
  - `headers` là đối tượng có phương thức `.get(ten)` (khớp `Headers` của `fetch`)
  - `'muc'` = hỏng một mục, build vẫn xanh · `'ha_tang'` = hỏng cả lần chạy, dừng ngay · `'tam_thoi'` = thử lại

- [ ] **Step 1: Viết test thất bại**

Thêm vào cuối `scripts/lib.test.mjs`:

```js
import { phanLoaiLoi, vuotNguong } from './lib.mjs'

function hdr(obj = {}) {
  return { get: k => obj[k] ?? null }
}

test('phanLoaiLoi: 404 là lỗi của riêng mục đó', () => {
  assert.equal(phanLoaiLoi({ status: 404, headers: hdr() }), 'muc')
})

test('phanLoaiLoi: 403 khi còn quota là repo riêng tư, lỗi của mục', () => {
  assert.equal(phanLoaiLoi({ status: 403, headers: hdr({ 'x-ratelimit-remaining': '4998' }) }), 'muc')
})

test('phanLoaiLoi: 403 khi hết quota là lỗi hạ tầng', () => {
  assert.equal(phanLoaiLoi({ status: 403, headers: hdr({ 'x-ratelimit-remaining': '0' }) }), 'ha_tang')
})

test('phanLoaiLoi: 429 hết quota là lỗi hạ tầng', () => {
  assert.equal(phanLoaiLoi({ status: 429, headers: hdr({ 'x-ratelimit-remaining': '0' }) }), 'ha_tang')
})

test('phanLoaiLoi: 401 token hỏng là lỗi hạ tầng', () => {
  assert.equal(phanLoaiLoi({ status: 401, headers: hdr() }), 'ha_tang')
})

test('phanLoaiLoi: 5xx là tạm thời, đáng thử lại', () => {
  assert.equal(phanLoaiLoi({ status: 502, headers: hdr() }), 'tam_thoi')
})

test('vuotNguong: dưới 30% thì không vượt', () => {
  assert.equal(vuotNguong(30, 9), false)
})

test('vuotNguong: đúng 30% thì chưa vượt', () => {
  assert.equal(vuotNguong(10, 3), false)
})

test('vuotNguong: trên 30% thì vượt', () => {
  assert.equal(vuotNguong(10, 4), true)
})

test('vuotNguong: không có repo nào thì không bao giờ vượt', () => {
  assert.equal(vuotNguong(0, 0), false)
})
```

- [ ] **Step 2: Chạy test, xác nhận trượt**

```bash
node --test scripts/
```

- [ ] **Step 3: Cài đặt trong `scripts/lib.mjs`**

```js
const TY_LE_LOI_TOI_DA = 0.3

export function phanLoaiLoi({ status, headers }) {
  const conLai = headers?.get?.('x-ratelimit-remaining')
  if ((status === 403 || status === 429) && conLai === '0') return 'ha_tang'
  if (status === 401) return 'ha_tang'
  if (status === 404 || status === 403) return 'muc'
  return 'tam_thoi'
}

export function vuotNguong(soCoRepo, soLoi) {
  if (soCoRepo === 0) return false
  return soLoi / soCoRepo > TY_LE_LOI_TOI_DA
}
```

- [ ] **Step 4: Chạy test, xác nhận xanh**

```bash
node --test scripts/
```

Kỳ vọng: `pass 43`, `fail 0`.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib.mjs scripts/lib.test.mjs
git commit -m "lib: phân biệt lỗi một mục với lỗi cả lần chạy"
```

---

### Task 6: `build.mjs` — I/O và snapshot

**Files:**
- Create: `scripts/build.mjs`
- Create: `data/ime.json` (bản tối thiểu 2 mục để chạy thử; dữ liệu thật ở Task 7)

**Interfaces:**
- Consumes: `validateData`, `renderReadme`, `phanLoaiLoi`, `vuotNguong` từ `./lib.mjs`
- Produces: file `README.md` và `data/.snapshot.json`; exit 0 khi thành công hoặc không có gì đổi, exit 1 khi lỗi hạ tầng

- [ ] **Step 1: Tạo `data/ime.json` tối thiểu để chạy thử**

```json
{
  "muc": [
    {
      "id": "gonhanh",
      "ten": "Gõ Nhanh",
      "repo": "khaphanspace/gonhanh.org",
      "trang_chu": "https://gonhanh.org",
      "nen_tang": ["macos"],
      "nhom": "bo_go",
      "ghi_chu": "Hiệu suất cao, viết native cho macOS"
    },
    {
      "id": "ibus-bamboo",
      "ten": "ibus-bamboo",
      "repo": "BambooEngine/ibus-bamboo",
      "nen_tang": ["linux"],
      "nhom": "bo_go",
      "ghi_chu": "Bộ gõ IBus được cập nhật đều, xử lý tốt lỗi gõ trong trình duyệt"
    }
  ],
  "chon_nhanh": {
    "macos": ["gonhanh", "ibus-bamboo"],
    "windows": ["gonhanh", "ibus-bamboo"],
    "linux": ["ibus-bamboo", "gonhanh"]
  }
}
```

`chon_nhanh` ở đây cố tình đặt bừa cho hợp lệ — Task 7 sẽ thay bằng gợi ý thật.

- [ ] **Step 2: Viết `scripts/build.mjs`**

```js
#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { phanLoaiLoi, renderReadme, validateData, vuotNguong } from './lib.mjs'

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..')
const TOKEN = process.env.GITHUB_TOKEN
const SO_LAN_THU = 3
const CHO_GIUA_HAI_LAN = 2000

const canhBao = []

function nghi(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function layRepo(repo) {
  const headers = {
    accept: 'application/vnd.github+json',
    'user-agent': 'awesome-vietnamese-ime',
  }
  if (TOKEN) headers.authorization = `Bearer ${TOKEN}`

  for (let lan = 1; lan <= SO_LAN_THU; lan++) {
    let res
    try {
      res = await fetch(`https://api.github.com/repos/${repo}`, { headers })
    } catch (e) {
      if (lan === SO_LAN_THU) throw new Error(`mạng hỏng khi gọi ${repo}: ${e.message}`)
      await nghi(CHO_GIUA_HAI_LAN)
      continue
    }

    if (res.ok) return await res.json()

    const loai = phanLoaiLoi(res)
    if (loai === 'muc') return null
    if (loai === 'ha_tang')
      throw new Error(`GitHub API trả ${res.status} khi gọi ${repo} — dừng, giữ nguyên README cũ`)
    if (lan === SO_LAN_THU)
      throw new Error(`GitHub API lỗi ${res.status} khi gọi ${repo} sau ${SO_LAN_THU} lần thử`)
    await nghi(CHO_GIUA_HAI_LAN)
  }
}

function mucTrong(m, loiTruyCap) {
  return {
    ...m,
    sao: null, giay_phep: null, pushed_at: null,
    archived: false, loi_truy_cap: loiTruyCap,
  }
}

async function inCanhBao() {
  if (canhBao.length === 0) return
  const noiDung = '### Cảnh báo dữ liệu\n\n' + canhBao.map(c => `- ${c}`).join('\n') + '\n'
  if (process.env.GITHUB_STEP_SUMMARY)
    await writeFile(process.env.GITHUB_STEP_SUMMARY, noiDung, { flag: 'a' })
  console.warn(noiDung)
}

async function main() {
  const data = JSON.parse(await readFile(join(GOC, 'data/ime.json'), 'utf8'))
  validateData(data)

  const muc = []
  let soCoRepo = 0
  let soLoi = 0

  for (const m of data.muc) {
    if (!m.repo) {
      muc.push(mucTrong(m, false))
      continue
    }
    soCoRepo++
    const r = await layRepo(m.repo)
    if (!r) {
      soLoi++
      canhBao.push(`\`${m.repo}\` không truy cập được (404 hoặc đã thành riêng tư) — sửa \`data/ime.json\``)
      muc.push(mucTrong(m, true))
      continue
    }
    if (r.full_name.toLowerCase() !== m.repo.toLowerCase())
      canhBao.push(`\`${m.repo}\` đã đổi thành \`${r.full_name}\` — cập nhật \`data/ime.json\``)
    muc.push({
      ...m,
      sao: r.stargazers_count,
      giay_phep: r.license?.spdx_id ?? null,
      pushed_at: r.pushed_at,
      archived: r.archived,
      loi_truy_cap: false,
    })
  }

  if (vuotNguong(soCoRepo, soLoi))
    throw new Error(`${soLoi}/${soCoRepo} repo lỗi truy cập, quá 30% — nghi sự cố hệ thống, dừng`)

  const snapshot = JSON.stringify({ muc, chon_nhanh: data.chon_nhanh }, null, 2) + '\n'
  const duongDanSnapshot = join(GOC, 'data/.snapshot.json')
  const cu = await readFile(duongDanSnapshot, 'utf8').catch(() => null)

  if (cu === snapshot) {
    console.log('Số liệu không đổi — không ghi file nào.')
    await inCanhBao()
    return
  }

  await writeFile(
    join(GOC, 'README.md'),
    renderReadme({ muc, chon_nhanh: data.chon_nhanh, bayGio: Date.now() }),
  )
  await writeFile(duongDanSnapshot, snapshot)
  console.log(`Đã ghi README.md — ${muc.length} mục, ${soLoi} lỗi truy cập.`)
  await inCanhBao()
}

main().catch(e => {
  console.error('LỖI:', e.message)
  process.exit(1)
})
```

**Bẫy đã xử lý, đừng "tối ưu" mất:** snapshot chứa **cả** `muc` (gồm phần biên tập như `ghi_chu`) lẫn `chon_nhanh`, không chỉ số liệu API. Nếu chỉ chụp số liệu API thì sửa `ghi_chu` trong `ime.json` sẽ không làm README sinh lại — người đóng góp sửa xong thấy README không đổi và tưởng hỏng.

- [ ] **Step 3: Chạy thật, xác nhận sinh được README**

```bash
cd /Users/lenamkhanh/Documents/dev/awesome-vietnamese-ime
GITHUB_TOKEN=$(gh auth token) node scripts/build.mjs
```

Kỳ vọng: in `Đã ghi README.md — 2 mục, 0 lỗi truy cập.`

- [ ] **Step 4: Chạy lại, xác nhận không ghi gì (kiểm chứng snapshot)**

```bash
GITHUB_TOKEN=$(gh auth token) node scripts/build.mjs && git status --porcelain
```

Kỳ vọng: in `Số liệu không đổi — không ghi file nào.` và `git status --porcelain` chỉ liệt kê file chưa track, không có `M README.md`.

- [ ] **Step 5: Kiểm chứng ngưỡng 30% chặn được sự cố hàng loạt**

Với đúng 2 mục, một repo hỏng là 50% — phải vượt ngưỡng và dừng:

```bash
cp data/ime.json /tmp/ime-goc.json
node -e '
const fs = require("fs");
const d = JSON.parse(fs.readFileSync("data/ime.json", "utf8"));
d.muc[0].repo = "khong-ton-tai-dau-ca/repo-nay-khong-co";
fs.writeFileSync("data/ime.json", JSON.stringify(d, null, 2));
'
GITHUB_TOKEN=$(gh auth token) node scripts/build.mjs; echo "exit=$?"
cp /tmp/ime-goc.json data/ime.json && rm /tmp/ime-goc.json
```

Kỳ vọng: `exit=1` kèm `LỖI: 1/2 repo lỗi truy cập, quá 30%`. Quan trọng hơn: `README.md` và `data/.snapshot.json` **không đổi** — kiểm bằng `git status --porcelain` nếu đã track, hoặc so ngày sửa file.

Nhánh còn lại — một repo hỏng mà build vẫn xanh — chỉ kiểm được khi đã đủ mục, nên nằm ở Task 7 Step 6.

- [ ] **Step 6: Xác nhận `data/ime.json` đã về nguyên trạng rồi commit**

```bash
node -e 'JSON.parse(require("fs").readFileSync("data/ime.json","utf8")).muc.forEach(m=>console.log(m.repo))'
git status --short
git add scripts/build.mjs data/ime.json data/.snapshot.json README.md
git commit -m "build: gọi GitHub API, so snapshot và sinh README"
```

Kỳ vọng ở lệnh đầu: in ra `khaphanspace/gonhanh.org` và `BambooEngine/ibus-bamboo`, không còn `khong-ton-tai-dau-ca`.

---

### Task 7: Dữ liệu thật

**Files:**
- Modify: `data/ime.json`

**Interfaces:**
- Consumes: `validateData` (Task 1) để kiểm dữ liệu
- Produces: `data/ime.json` khoảng 28 mục thật

- [ ] **Step 1: Kiểm từng ứng viên qua API trước khi điền**

Chạy để lấy sự thật, **không** chép số liệu từ kết quả search:

```bash
cd /Users/lenamkhanh/Documents/dev/awesome-vietnamese-ime
for r in \
  tuyenvm/OpenKey marixdev/vnkey Funput/Funput \
  khaphanspace/gonhanh.org xmannv/xkey PhamHungTien/PHTV huytd/goxkey khanhicetea/Caffee \
  phatMT97/VKey dinhngtu/VietType lamquangminh/EVKey donamvn/viet-ime \
  BambooEngine/ibus-bamboo LotusInputMethod/fcitx5-lotus vndangkhoa/vietc lamdao/xvnkb \
  ZeroX-DG/vi-rs thuupx/uvie-rs cmpitg/bogoengine BoGoEngine/bogo-python \
  ; do
  gh api "repos/$r" --jq '[.full_name, (.stargazers_count|tostring), (.language // "—"), (.license.spdx_id // "—"), (.archived|tostring), .pushed_at[0:10]] | join("  ")' 2>&1 | sed "s|^|$r → |"
done
```

Ghi lại: repo nào 404, repo nào `full_name` khác tên gọi (đã đổi tên), repo nào `language` là `—`.

- [ ] **Step 2: Phân định mục nào là `repo: null`**

Với mọi repo có `language: —` ở Step 1 (nghi chỉ để phát hành bản build, không chứa mã nguồn), kiểm cây thư mục:

```bash
gh api repos/lamquangminh/EVKey/contents --jq '.[].name' 2>&1 | head -20
```

Quy tắc phân định: không có thư mục/file mã nguồn nào → đặt `repo: null`, `trang_chu` trỏ về trang tải chính thức. **Sự tồn tại của repo GitHub không phải bằng chứng mã nguồn mở.**

- [ ] **Step 3: Điền `data/ime.json`**

Giữ đúng schema Task 1. Nhóm dự kiến (điều chỉnh theo kết quả Step 1–2):

- `nhom: "bo_go"`, macOS: Gõ Nhanh, xkey, PHTV, goxkey, Caffee
- `nhom: "bo_go"`, Windows: VKey, VietType, EVKey, VietIME
- `nhom: "bo_go"`, Linux: ibus-bamboo, fcitx5-lotus, vietc, xvnkb
- `nhom: "bo_go"`, đa nền tảng: OpenKey, vnkey, Funput, Unikey, GoTiengViet
- `nhom: "thu_vien"`: vi-rs, uvie-rs, bogoengine, bogo-python

Mục không có mã nguồn công khai (`repo: null`): Unikey (`https://www.unikey.org`), GoTiengViet (`https://www.trankynam.com/gotv`), và bất kỳ mục nào Step 2 kết luận là repo phát hành.

Loại bỏ: repo dưới 2 ★ **đồng thời** không có README thực chất; fork không khác gì bản gốc. Repo đã chết nhưng có ý nghĩa lịch sử (bogoengine, xvnkb) thì **giữ** — nhãn 🔴/📦 đã nói đủ.

`ghi_chu` mỗi mục: một câu ≤ 90 ký tự, nói cái làm nó khác biệt, không phải lời khen chung chung. "Fork Unikey, thêm bộ gõ tắt" tốt hơn "bộ gõ tốt cho Windows".

`chon_nhanh`: mỗi OS 2–3 `id`, chọn theo tiêu chí còn được bảo trì và phổ biến — thay bảng đặt bừa ở Task 6.

- [ ] **Step 4: Chạy build và soi README bằng mắt**

```bash
GITHUB_TOKEN=$(gh auth token) node scripts/build.mjs
grep -nE 'undefined|NaN|NOASSERTION|\| null \|' README.md; echo "còn lại: $?"
```

Kỳ vọng: `grep` không khớp gì (in `còn lại: 1`). Mở `README.md` đọc lại toàn bộ: bảng có thẳng hàng không, nhãn có hợp lý không, tên có viết đúng không.

- [ ] **Step 5: Kiểm mọi liên kết trả 200**

```bash
grep -oE 'https?://[^)]+' README.md | sort -u | while read -r u; do
  code=$(curl -s -o /dev/null -w '%{http_code}' -L --max-time 15 "$u")
  [ "$code" = "200" ] || echo "$code  $u"
done
```

Kỳ vọng: không in dòng nào. Link nào hỏng thì sửa `trang_chu` trong `data/ime.json` rồi chạy lại Step 4.

- [ ] **Step 6: Kiểm chứng một repo hỏng không làm đỏ build**

Giờ đã có ~28 mục, 1 repo hỏng chỉ chiếm ~4% — dưới ngưỡng 30%, nên build phải vẫn xanh (nhánh còn lại của Task 6 Step 5):

```bash
cp data/ime.json /tmp/ime-goc.json
node -e '
const fs=require("fs"); const d=JSON.parse(fs.readFileSync("data/ime.json","utf8"));
const i=d.muc.findIndex(m=>m.repo); d.muc[i].repo="khong-ton-tai-dau-ca/repo-nay-khong-co";
fs.writeFileSync("data/ime.json", JSON.stringify(d,null,2));
'
GITHUB_TOKEN=$(gh auth token) node scripts/build.mjs; echo "exit=$?"
cp /tmp/ime-goc.json data/ime.json && rm /tmp/ime-goc.json
GITHUB_TOKEN=$(gh auth token) node scripts/build.mjs
```

Kỳ vọng: `exit=0`, có cảnh báo, README vẫn sinh; sau khi khôi phục thì README trở lại đúng.

- [ ] **Step 7: Commit**

```bash
git add data/ime.json data/.snapshot.json README.md
git commit -m "dữ liệu: 28 bộ gõ và thư viện, đã xác minh qua API"
```

---

### Task 8: GitHub Action và hướng dẫn đóng góp

**Files:**
- Create: `.github/workflows/refresh.yml`, `CONTRIBUTING.md`

**Interfaces:**
- Consumes: `scripts/build.mjs`, `scripts/lib.test.mjs` (Task 1–7)
- Produces: không (mắt xích cuối)

- [ ] **Step 1: Viết `.github/workflows/refresh.yml`**

```yaml
name: refresh

on:
  schedule:
    - cron: '0 3 * * 1'   # 03:00 UTC thứ 2 = 10:00 giờ Việt Nam
  push:
    paths:
      - 'data/ime.json'
      - 'scripts/**'
      - '.github/workflows/refresh.yml'
  workflow_dispatch:

permissions:
  contents: write

jobs:
  refresh:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Chạy test trước khi cho phép ghi đè README
        run: node --test scripts/

      - name: Sinh README
        run: node scripts/build.mjs
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Commit nếu có thay đổi
        run: |
          if [ -z "$(git status --porcelain)" ]; then
            echo "Số liệu không đổi, không commit."
            exit 0
          fi
          git config user.name  'github-actions[bot]'
          git config user.email 'github-actions[bot]@users.noreply.github.com'
          git add README.md data/.snapshot.json
          git commit -m "chore: cập nhật số liệu $(date -u +%Y-%m-%d)"
          git push
```

Thứ tự bước là chốt an toàn: test chạy **trước** build, nên script hỏng thì không có cơ hội ghi đè README.

- [ ] **Step 2: Viết `CONTRIBUTING.md`**

```markdown
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
node --test scripts/                              # bắt buộc, phải xanh
GITHUB_TOKEN=$(gh auth token) node scripts/build.mjs
```

Không có token vẫn chạy được, nhưng hạn gọi API chỉ 60 lần/giờ nên dễ trượt.

Trong pull request, commit cả `README.md` và `data/.snapshot.json` đã sinh lại.
```

- [ ] **Step 3: Chạy lại toàn bộ cổng kiểm tra**

```bash
cd /Users/lenamkhanh/Documents/dev/awesome-vietnamese-ime
node --test scripts/
GITHUB_TOKEN=$(gh auth token) node scripts/build.mjs
git status --porcelain
```

Kỳ vọng: test xanh; build in `Số liệu không đổi — không ghi file nào.`; `git status --porcelain` chỉ có hai file mới của task này.

- [ ] **Step 4: Kiểm cú pháp YAML của workflow**

```bash
node -e '
const s = require("fs").readFileSync(".github/workflows/refresh.yml","utf8");
if (s.includes("\t")) throw new Error("YAML không được có ký tự tab");
for (const k of ["schedule","workflow_dispatch","contents: write","node --test scripts/","node scripts/build.mjs"])
  if (!s.includes(k)) throw new Error("thiếu: " + k);
console.log("workflow ổn");
'
```

Kỳ vọng: in `workflow ổn`.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/refresh.yml CONTRIBUTING.md
git commit -m "ci: action cập nhật số liệu hàng tuần + hướng dẫn đóng góp"
```

- [ ] **Step 6: Báo cáo trạng thái bàn giao**

In ra để chủ repo tự đẩy:

```bash
git log --oneline
echo '--- còn lại phải làm bằng tay ---'
echo '1. gh repo create l3n4k4/awesome-vietnamese-ime --public --source=. --push'
echo '2. Bật quyền ghi cho Action: Settings → Actions → General → Workflow permissions → Read and write'
echo '3. Chạy thử workflow: gh workflow run refresh'
echo '4. Cân nhắc xoá docs/superpowers/ nếu muốn repo public gọn'
```

Bước 2 là bắt buộc: `permissions: contents: write` trong workflow chỉ có tác dụng khi cài đặt repo cho phép — mặc định của nhiều tài khoản là read-only, và Action sẽ đỏ ở bước push mà không nói rõ lý do.

---

## Kiểm chứng cuối cùng

Toàn bộ phải xanh trước khi coi là xong:

```bash
cd /Users/lenamkhanh/Documents/dev/awesome-vietnamese-ime
node --test scripts/                                   # mọi test pass
GITHUB_TOKEN=$(gh auth token) node scripts/build.mjs   # "Số liệu không đổi"
git status --porcelain                                 # rỗng
grep -cE 'undefined|NaN|NOASSERTION' README.md         # 0
```
