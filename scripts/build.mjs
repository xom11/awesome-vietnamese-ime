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
