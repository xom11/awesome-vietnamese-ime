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
