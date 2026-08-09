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
