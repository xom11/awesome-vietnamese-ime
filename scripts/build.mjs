#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  boQuaNgayChot,
  chonGiayPhep,
  lechGiayPhep,
  phanLoaiLoi,
  renderReadme,
  validateData,
  vuotNguong,
} from './lib.mjs'

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
    if (r.pushed_at == null)
      canhBao.push(`\`${m.repo}\` không có \`pushed_at\` — repo chưa có commit nào, mục hiện nhãn ⚪`)

    const tuApi = r.license?.spdx_id ?? null
    if (lechGiayPhep({ giay_phep: tuApi, giay_phep_ghi_tay: m.giay_phep_ghi_tay }))
      canhBao.push(
        `\`${m.repo}\`: GitHub nay đọc được giấy phép \`${tuApi}\`, không khớp ` +
          `\`giay_phep_ghi_tay\` = \`${m.giay_phep_ghi_tay}\` — bỏ trường ghi tay đi, API biết rồi`,
      )

    muc.push({
      ...m,
      sao: r.stargazers_count,
      giay_phep: chonGiayPhep({ giay_phep: tuApi, giay_phep_ghi_tay: m.giay_phep_ghi_tay }),
      pushed_at: r.pushed_at,
      archived: r.archived,
      loi_truy_cap: false,
    })
  }

  if (vuotNguong(soCoRepo, soLoi))
    throw new Error(`${soLoi}/${soCoRepo} repo lỗi truy cập, quá 30% — nghi sự cố hệ thống, dừng`)

  const readmeMoi = renderReadme({ muc, chon_nhanh: data.chon_nhanh, bayGio: Date.now() })
  const duongDanReadme = join(GOC, 'README.md')
  const readmeCu = await readFile(duongDanReadme, 'utf8').catch(() => null)

  // Quyết định ghi dựa trên README đã render, không phải snapshot dữ liệu —
  // nếu chỉ so snapshot, một sửa đổi renderReadme (sửa lỗi escape, viết lại
  // phần mở đầu...) mà không đổi dữ liệu sẽ không bao giờ được ghi ra file.
  // boQuaNgayChot (lib.mjs) bỏ đúng hai câu đổi theo thời điểm chạy. Chuẩn hoá
  // CRLF vì trên checkout Windows git trả file về dạng CRLF, còn renderReadme
  // luôn sinh LF — không chuẩn hoá thì nhánh "không đổi" không bao giờ chạy.
  const chuanHoa = s => boQuaNgayChot(s.replace(/\r\n/g, '\n'))

  if (readmeCu !== null && chuanHoa(readmeCu) === chuanHoa(readmeMoi)) {
    console.log('Số liệu không đổi — không ghi file nào.')
    await inCanhBao()
    return
  }

  const snapshot = JSON.stringify({ muc, chon_nhanh: data.chon_nhanh }, null, 2) + '\n'
  await writeFile(duongDanReadme, readmeMoi)
  await writeFile(join(GOC, 'data/.snapshot.json'), snapshot)
  console.log(`Đã ghi README.md — ${muc.length} mục, ${soLoi} lỗi truy cập.`)
  await inCanhBao()
}

main().catch(async e => {
  try {
    await inCanhBao()
  } catch (e2) {
    console.error('LỖI khi ghi cảnh báo:', e2.message)
  }
  console.error('LỖI:', e.message)
  process.exit(1)
})
