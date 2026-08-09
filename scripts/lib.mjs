export const NEN_TANG_HOP_LE = ['macos', 'windows', 'linux']
export const NHOM_HOP_LE = ['bo_go', 'thu_vien']

// Allowlist, không phải danh sách gợi ý: khoá nào không có ở đây là lỗi. Gõ
// "trangchu" thay "trang_chu" từng lọt qua cả hai cổng CI mà vẫn xanh, chỉ mất
// im lặng liên kết của một mục.
const KHOA_HOP_LE = new Set([
  'id', 'ten', 'repo', 'trang_chu', 'nen_tang', 'nhom', 'ghi_chu', 'giay_phep_ghi_tay',
])

function urlHopLe(s) {
  if (typeof s !== 'string' || s === '' || /\s/.test(s)) return false
  try {
    return ['http:', 'https:'].includes(new URL(s).protocol)
  } catch {
    return false
  }
}

export function validateData(data) {
  if (!data || typeof data !== 'object') throw new Error('ime.json phải là một object')
  if (!Array.isArray(data.muc)) throw new Error('ime.json thiếu mảng "muc"')
  if (!data.chon_nhanh || typeof data.chon_nhanh !== 'object')
    throw new Error('ime.json thiếu object "chon_nhanh"')

  const loi = []
  const theoId = new Map()

  for (const [i, m] of data.muc.entries()) {
    const o = `muc[${i}]`
    for (const t of Object.keys(m)) if (!KHOA_HOP_LE.has(t)) loi.push(`${o}: khoá lạ "${t}"`)

    for (const t of ['id', 'ten', 'nhom', 'ghi_chu']) {
      if (typeof m[t] !== 'string' || m[t].trim() === '') loi.push(`${o}: thiếu trường "${t}"`)
    }
    if (!('repo' in m))
      loi.push(`${o}: thiếu trường "repo" (dùng null nếu không có repo GitHub chính chủ chứa mã nguồn bộ gõ)`)
    else if (m.repo !== null && !/^[^/\s]+\/[^/\s]+$/.test(String(m.repo)))
      loi.push(`${o}: repo phải dạng "owner/name", nhận "${m.repo}"`)
    else if (m.repo === null && !('trang_chu' in m))
      // Không repo, không trang chủ thì lienKet() trả về tên trần: một dòng
      // trong bảng mà người đọc không đi đâu được từ đó.
      loi.push(`${o}: repo null thì bắt buộc có trang_chu, không thì mục này không có liên kết nào`)

    if ('trang_chu' in m && !urlHopLe(m.trang_chu))
      loi.push(`${o}: trang_chu phải là URL http(s) không khoảng trắng, nhận "${m.trang_chu}"`)

    if (!Array.isArray(m.nen_tang) || m.nen_tang.length === 0)
      loi.push(`${o}: nen_tang phải là mảng không rỗng`)
    else {
      const da = new Set()
      for (const nt of m.nen_tang) {
        if (!NEN_TANG_HOP_LE.includes(nt)) loi.push(`${o}: nen_tang lạ "${nt}"`)
        if (da.has(nt)) loi.push(`${o}: nen_tang trùng "${nt}"`)
        da.add(nt)
      }
    }

    if (typeof m.nhom === 'string' && m.nhom !== '' && !NHOM_HOP_LE.includes(m.nhom))
      loi.push(`${o}: nhom lạ "${m.nhom}"`)

    if (typeof m.ghi_chu === 'string' && m.ghi_chu.length > 90)
      loi.push(`${o}: ghi_chu quá 90 ký tự (${m.ghi_chu.length})`)

    // Ghi tay chỉ để lấp chỗ API mù. Mục không có repo thì không có API nào để
    // mù cả — giấy phép của nó thuộc về ghi_chu.
    if ('giay_phep_ghi_tay' in m) {
      if (typeof m.giay_phep_ghi_tay !== 'string' || m.giay_phep_ghi_tay.trim() === '')
        loi.push(`${o}: giay_phep_ghi_tay phải là chuỗi không rỗng`)
      else if (m.repo === null)
        loi.push(`${o}: giay_phep_ghi_tay chỉ dùng cho mục có repo`)
    }

    if (theoId.has(m.id)) loi.push(`${o}: id trùng "${m.id}"`)
    theoId.set(m.id, m)
  }

  for (const os of Object.keys(data.chon_nhanh))
    if (!NEN_TANG_HOP_LE.includes(os)) loi.push(`chon_nhanh: khoá lạ "${os}"`)

  for (const os of NEN_TANG_HOP_LE) {
    const ds = data.chon_nhanh[os]
    if (!Array.isArray(ds) || ds.length < 2 || ds.length > 3) {
      loi.push(`chon_nhanh.${os}: phải có 2–3 id`)
      continue
    }
    const da = new Set()
    for (const id of ds) {
      if (da.has(id)) loi.push(`chon_nhanh.${os}: id trùng "${id}"`)
      da.add(id)

      const m = theoId.get(id)
      if (!m) {
        loi.push(`chon_nhanh.${os}: id không tồn tại "${id}"`)
        continue
      }
      // Gõ nhầm một id chỉ-macOS vào cột Linux xuất bản một gợi ý sai kèm nhãn
      // 🟢. Mục đa nền tảng thì hợp lệ ở mọi OS nó khai — đừng cấm nhầm.
      if (Array.isArray(m.nen_tang) && !m.nen_tang.includes(os))
        loi.push(`chon_nhanh.${os}: "${id}" không chạy trên ${os}`)
      if (m.nhom === 'thu_vien')
        loi.push(`chon_nhanh.${os}: "${id}" là thư viện, không phải bộ gõ để dùng`)
    }
  }

  if (loi.length) throw new Error('Dữ liệu sai:\n  ' + loi.join('\n  '))
}

const NGAY = 86_400_000
const NGUONG_HOAT_DONG = 183
const NGUONG_CHAM = 730

export function phanLoaiTrangThai(muc, bayGio) {
  if (muc.loi_truy_cap) return { nhan: '❓', ten: 'Lỗi truy cập' }
  if (!muc.repo) return { nhan: '⚫', ten: 'Không rõ' }
  if (muc.archived) return { nhan: '📦', ten: 'Lưu trữ' }

  // GitHub trả pushed_at: null cho repo chưa có commit nào. Không chặn thì
  // Date.parse ra NaN, mọi so sánh dưới thành false và mục rơi thẳng xuống 🔴
  // "quá 24 tháng" — một khẳng định mà dữ liệu không hề chứa.
  const moc = Date.parse(muc.pushed_at)
  if (!Number.isFinite(moc)) return { nhan: '⚪', ten: 'Chưa có commit' }

  const soNgay = Math.floor((bayGio - moc) / NGAY)
  if (soNgay <= NGUONG_HOAT_DONG) return { nhan: '🟢', ten: 'Hoạt động' }
  if (soNgay <= NGUONG_CHAM) return { nhan: '🟡', ten: 'Chậm' }
  return { nhan: '🔴', ten: 'Ngưng' }
}

// GitHub chỉ đọc được giấy phép khi repo có file LICENSE nó phân tích được, và
// kể cả khi đọc được thì nó cũng chỉ trả về MỘT id: repo dual-license
// `MIT OR Apache-2.0` chỉ hiện `Apache-2.0`, mất hẳn nhánh MIT — đúng cột quyết
// định của bảng Thư viện. Ghi tay được chấp nhận trong đúng hai ca đó:
//   - API không biết gì (`null`, hoặc `NOASSERTION` = có file nhưng lệch SPDX);
//   - API biết một phần, tức id nó trả về nằm trong biểu thức ghi tay.
// Ngoài hai ca đó, API thắng và lechGiayPhep() bật cờ.
function apiKhongBiet(giay_phep) {
  return giay_phep === null || giay_phep === undefined || giay_phep === 'NOASSERTION'
}

export function chonGiayPhep({ giay_phep, giay_phep_ghi_tay }) {
  if (!giay_phep_ghi_tay) return giay_phep ?? null
  if (apiKhongBiet(giay_phep)) return giay_phep_ghi_tay
  if (giay_phep_ghi_tay.includes(giay_phep)) return giay_phep_ghi_tay
  return giay_phep
}

// So theo TOKEN chứ không phải chuỗi con. `'LGPL-3.0-or-later'.includes('GPL-3.0')`
// là true, nên bản so chuỗi con sẽ im lặng đúng ca nguy hiểm nhất: API nói
// GPL-3.0 (giấy phép của 12/29 mục trong list) trong khi giá trị ghi tay là
// LGPL — hai giấy phép khác hẳn nhau về nghĩa vụ.
function tachToken(bieuThuc) {
  return bieuThuc
    .split(/[\s()]+/)
    .filter(t => t && !['OR', 'AND', 'WITH'].includes(t.toUpperCase()))
}

// Thượng nguồn đổi giấy phép là giá trị ghi tay hoá đồ giả im lặng. Cờ này để
// build.mjs kêu lên thay vì in mãi giá trị cũ.
export function lechGiayPhep({ giay_phep, giay_phep_ghi_tay }) {
  if (!giay_phep_ghi_tay || apiKhongBiet(giay_phep)) return false
  return !tachToken(giay_phep_ghi_tay).some(
    t => t === giay_phep || t.replace(/-(only|or-later)$/, '') === giay_phep,
  )
}

// Nhãn 🟢/🟡/🔴 tính theo số ngày, nên mốc render phải là nửa đêm UTC chứ không
// phải "lúc chạy". Hai đường render (build.mjs sinh README, --kiem dựng lại để
// so) chạy ở hai thời điểm khác nhau trong ngày: một repo vượt mốc 183 ngày
// giữa hai lần đó sẽ làm --kiem từ chối chính README mà build vừa sinh, kèm
// thông điệp buộc tội "ai đó sửa README bằng tay".
export function mocRender(bayGio) {
  return Date.parse(new Date(bayGio).toISOString().slice(0, 10) + 'T00:00:00Z')
}

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

const TEN_NHOM = {
  macos: 'macOS',
  windows: 'Windows',
  linux: 'Linux',
  da_nen: 'Đa nền tảng',
  thu_vien: 'Thư viện & engine',
}
const TEN_NEN_TANG_NGAN = { macos: 'mac', windows: 'win', linux: 'linux' }
const NHOM_BO_GO = ['macos', 'windows', 'linux', 'da_nen']

export function escapeBang(s) {
  return String(s).replace(/\r?\n/g, ' ').replace(/\|/g, '\\|').trim()
}

// Ngoặc vuông chưa thoát trong link text cắt liên kết làm đôi.
function escapeTen(s) {
  return escapeBang(s).replace(/([[\]])/g, '\\$1')
}

function o(v) {
  if (v === null || v === undefined) return '—'
  if (v === 'NOASSERTION') return 'khác'
  return String(v)
}

function lienKet(m) {
  const url = m.trang_chu || (m.repo ? `https://github.com/${m.repo}` : null)
  const ten = escapeTen(m.ten)
  // Không dùng encodeURI: nó mã hoá hai lần một URL vốn đã percent-encode.
  // Chỉ `|` mới phá bảng markdown, và nó không hợp lệ trong URL thô.
  return url ? `[${ten}](${url.replace(/\|/g, '%7C')})` : ten
}

function dongBang(m, bayGio, cotNenTang) {
  const tt = phanLoaiTrangThai(m, bayGio)
  const ngay = tt.nhan === '⚫' || tt.nhan === '❓' || tt.nhan === '⚪' ? '—' : m.pushed_at.slice(0, 7)
  const nt = cotNenTang
    ? ` ${NEN_TANG_HOP_LE.filter(k => m.nen_tang.includes(k)).map(k => TEN_NEN_TANG_NGAN[k]).join(' · ')} |`
    : ''
  return `| ${lienKet(m)} |${nt} ${o(m.sao)} | ${tt.nhan} ${ngay} | ${o(m.giay_phep)} | ${escapeBang(m.ghi_chu)} |`
}

function bang(ds, bayGio, cotNenTang = false) {
  if (ds.length === 0) return ['_Chưa có mục nào._']
  return [
    cotNenTang
      ? '| Tên | Nền tảng | ★ | Cập nhật | Giấy phép | Ghi chú |'
      : '| Tên | ★ | Cập nhật | Giấy phép | Ghi chú |',
    cotNenTang ? '|---|---|---:|---|---|---|' : '|---|---:|---|---|---|',
    ...sapXep(ds).map(m => dongBang(m, bayGio, cotNenTang)),
  ]
}

export function renderReadme({ muc, chon_nhanh, bayGio }) {
  const theoNhom = new Map([...NHOM_BO_GO, 'thu_vien'].map(k => [k, []]))
  for (const m of muc) theoNhom.get(chonNhom(m)).push(m)
  const theoId = new Map(muc.map(m => [m.id, m]))
  const ngayChot = new Date(bayGio).toISOString().slice(0, 10)

  const p = [
    '# Awesome Vietnamese IME',
    '',
    'Danh sách bộ gõ tiếng Việt cho máy tính bàn, kèm thư viện cho người muốn tự viết bộ gõ.',
    '',
    `Số liệu ★, lần push cuối và giấy phép do GitHub Action sinh lại hàng tuần từ [\`data/ime.json\`](data/ime.json). Vài giấy phép GitHub đọc không ra thì khai tay, có ghi rõ trong [CONTRIBUTING.md](CONTRIBUTING.md) (chốt lần cuối: ${ngayChot}).`,
    '',
    'Nhãn theo lần push gần nhất: 🟢 trong 6 tháng · 🟡 6–24 tháng · 🔴 quá 24 tháng · 📦 repo đã lưu trữ · ⚪ repo chưa có commit · ⚫ không có repo GitHub chứa mã nguồn bộ gõ · ❓ không truy cập được repo.',
    '',
    'Lần push cuối trả lời "còn ai đụng vào không", **không** phải "bản tải về còn mới không" — repo có commit mà bản phát hành cũ mèm thì cột Ghi chú nói.',
    '',
    '## Chọn nhanh',
    '',
    'Không muốn đọc hết thì lấy một trong những cái này:',
    '',
    '| Hệ điều hành | Gợi ý |',
    '|---|---|',
  ]

  for (const os of NEN_TANG_HOP_LE) {
    const goiY = chon_nhanh[os]
      .map(id => {
        const m = theoId.get(id)
        const sao = m.sao === null || m.sao === undefined ? '' : ` ${m.sao}★`
        return `${phanLoaiTrangThai(m, bayGio).nhan} ${lienKet(m)}${sao}`
      })
      .join(' · ')
    p.push(`| ${TEN_NHOM[os]} | ${goiY} |`)
  }

  p.push('', '## Bộ gõ')
  for (const k of NHOM_BO_GO) {
    p.push('', `### ${TEN_NHOM[k]}`, '')
    // Bảng theo OS chỉ chứa mục độc quyền OS đó, nên nó giấu mất phân nửa số bộ
    // gõ chạy được trên OS đó — bảng Windows đỉnh 173★ trong khi OpenKey 943★
    // cũng chạy Windows. Dòng này đứng TRƯỚC bảng: đọc xong bảng rồi mới biết
    // mình vừa đọc một danh sách bị cắt thì đã muộn.
    const them = k === 'da_nen' ? 0 : theoNhom.get('da_nen').filter(m => m.nen_tang.includes(k)).length
    if (them > 0)
      p.push(`Ngoài ra còn ${them} bộ gõ đa nền tảng cũng chạy trên ${TEN_NHOM[k]} — xem [Đa nền tảng](#đa-nền-tảng).`, '')
    p.push(...bang(theoNhom.get(k), bayGio, k === 'da_nen'))
  }

  p.push(
    '',
    `## ${TEN_NHOM.thu_vien}`,
    '',
    'Cho người muốn tự viết bộ gõ chứ không phải đi tìm bộ gõ để dùng.',
    '',
    ...bang(theoNhom.get('thu_vien'), bayGio, true),
    '',
    '---',
    '',
    `Số liệu chốt ngày ${ngayChot}.`,
    '',
    'Thiếu bộ gõ nào thì sửa [`data/ime.json`](data/ime.json) — xem [CONTRIBUTING.md](CONTRIBUTING.md). **Đừng sửa README.md, file này do máy sinh ra.**',
    '',
    'Không rành Git thì [mở issue](../../issues/new/choose) kèm tên bộ gõ và liên kết là đủ.',
    '',
    'Giấy phép: [CC0-1.0](LICENSE).',
    '',
  )

  return p.join('\n')
}

// MỘT hằng cho cả ba nơi dùng tới câu ngày chốt: renderReadme sinh ra nó,
// boQuaNgayChot trung hoà nó, build.mjs --kiem đọc ngược ngày từ nó. Ba bản
// regex chép tay ở ba chỗ là ba cơ hội để chúng trôi khỏi nhau trong im lặng.
export const RE_NGAY_CHOT = /^Số liệu chốt ngày (\d{4}-\d{2}-\d{2})\.$/m

// Hai câu ngày chốt đổi theo thời điểm chạy chứ không theo dữ liệu, nên phải bỏ
// qua khi so README cũ với mới. Neo vào đúng hai câu đó — regex quét cả file sẽ
// nuốt luôn ngày nằm trong ghi_chu của một mục, và một đính chính như vậy sẽ
// không bao giờ được ghi ra file: build in "Số liệu không đổi", CI xanh.
export function boQuaNgayChot(s) {
  return s
    .replace(/\(chốt lần cuối: \d{4}-\d{2}-\d{2}\)/g, '(chốt lần cuối: …)')
    .replace(new RegExp(RE_NGAY_CHOT.source, 'gm'), 'Số liệu chốt ngày ….')
}

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
