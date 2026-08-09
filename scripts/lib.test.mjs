import { test } from 'node:test'
import assert from 'node:assert/strict'
import { NEN_TANG_HOP_LE, validateData } from './lib.mjs'

function muc(ghiDe = {}) {
  // Mặc định đủ ba nền tảng vì helper data() dưới đây đưa mục này vào
  // chon_nhanh của cả ba OS, mà validateData bắt gợi ý phải chạy được trên OS
  // tương ứng. Test nào cần một nền tảng thì tự khai đè.
  return {
    id: 'a', ten: 'A', repo: 'chu/kho',
    nen_tang: [...NEN_TANG_HOP_LE], nhom: 'bo_go', ghi_chu: 'ghi chú',
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
  assert.ok(dong.includes('Telex \\| VNI'), 'dấu | trong ghi chú phải được thoát')
  assert.equal(
    dong.split(/(?<!\\)\|/).length - 1, 6,
    'chỉ 6 dấu | chưa thoát = 6 biên cột, dấu đã thoát không sinh cột lạ',
  )
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

test('renderReadme: đoạn mở đầu cũng có ngày chốt, không chỉ chân trang', () => {
  const out = renderThu([mucDay(), mucDay({ id: 'b', ten: 'B' })])
  assert.ok(
    out.includes('(chốt lần cuối: 2026-08-09)'),
    'câu tuyên bố "tự cập nhật hàng tuần" phải kèm bằng chứng ngay tại chỗ',
  )
})

test('renderReadme: Chọn nhanh hiện nhãn trạng thái, không chỉ tên trần', () => {
  const ds = [
    mucDay({ pushed_at: truoc(1000) }), // quá 730 ngày -> Ngưng
    mucDay({ id: 'b', ten: 'B' }),
  ]
  const out = renderReadme({
    muc: ds,
    chon_nhanh: { macos: ['a', 'b'], windows: ['a', 'b'], linux: ['a', 'b'] },
    bayGio: BAY_GIO,
  })
  const dongChonNhanh = out.split('\n').find(d => d.startsWith('| macOS |'))
  assert.ok(
    dongChonNhanh.includes('🔴'),
    'mục Chọn nhanh đã ngưng hoạt động phải hiện nhãn 🔴, không được im lặng gợi ý',
  )
})

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

// ---------------------------------------------------------------------------
// Nhãn cho repo chưa có commit nào
// ---------------------------------------------------------------------------

test('phanLoaiTrangThai: pushed_at null mà repo vẫn sống thì là ⚪, KHÔNG phải 🔴', () => {
  // GitHub trả pushed_at: null cho repo tạo xong chưa push gì. Date.parse(null)
  // ra NaN, mọi so sánh <= thành false, và nếu không chặn thì rơi thẳng xuống
  // nhánh cuối 🔴 "quá 24 tháng" — README khẳng định một điều nó không hề biết.
  assert.equal(phanLoaiTrangThai(mucApi({ pushed_at: null }), BAY_GIO).nhan, '⚪')
  assert.equal(phanLoaiTrangThai(mucApi({ pushed_at: 'khong-phai-ngay' }), BAY_GIO).nhan, '⚪')
})

test('phanLoaiTrangThai: archived vẫn thắng cả khi pushed_at hỏng', () => {
  assert.equal(phanLoaiTrangThai(mucApi({ archived: true, pushed_at: null }), BAY_GIO).nhan, '📦')
})

// ---------------------------------------------------------------------------
// Giấy phép: NOASSERTION, và trường ghi tay cho ca API không biết
// ---------------------------------------------------------------------------

import { chonGiayPhep, lechGiayPhep } from './lib.mjs'

test('renderReadme: NOASSERTION hiện "khác", null vẫn hiện gạch ngang', () => {
  const ds = [mucDay({ giay_phep: 'NOASSERTION' }), mucDay({ id: 'b', ten: 'B', giay_phep: null })]
  const out = renderThu(ds)
  assert.ok(!out.includes('NOASSERTION'), 'không được để lọt chuỗi thô')
  assert.ok(out.includes('| khác |'), 'NOASSERTION = có giấy phép nhưng không chuẩn SPDX')
  assert.ok(out.includes('| — |'), 'null = GitHub không nhận ra giấy phép nào')
})

test('chonGiayPhep: chỉ ghi tay khi API không biết', () => {
  assert.equal(chonGiayPhep({ giay_phep: null, giay_phep_ghi_tay: 'GPL-2.0-or-later' }), 'GPL-2.0-or-later')
  assert.equal(chonGiayPhep({ giay_phep: 'NOASSERTION', giay_phep_ghi_tay: 'BSD-3-Clause' }), 'BSD-3-Clause')
  assert.equal(chonGiayPhep({ giay_phep: null, giay_phep_ghi_tay: undefined }), null)
})

test('chonGiayPhep: API biết một nửa thì ghi tay bù nốt nửa kia', () => {
  // GitHub chỉ trả về một SPDX id, nên repo `MIT OR Apache-2.0` hiện thành
  // `Apache-2.0` — người viết bộ gõ GPLv2 sẽ loại nhầm thư viện đó.
  assert.equal(
    chonGiayPhep({ giay_phep: 'Apache-2.0', giay_phep_ghi_tay: 'MIT OR Apache-2.0' }),
    'MIT OR Apache-2.0',
  )
  assert.equal(lechGiayPhep({ giay_phep: 'Apache-2.0', giay_phep_ghi_tay: 'MIT OR Apache-2.0' }), false)
})

test('chonGiayPhep: API biết thì API thắng — ghi tay không được đè', () => {
  // Chốt chống lệch: thượng nguồn thêm file LICENSE là giá trị ghi tay thành đồ
  // giả. API thắng, và lechGiayPhep() bật cờ để build.mjs kêu lên.
  assert.equal(chonGiayPhep({ giay_phep: 'MIT', giay_phep_ghi_tay: 'GPL-3.0' }), 'MIT')
  assert.equal(lechGiayPhep({ giay_phep: 'MIT', giay_phep_ghi_tay: 'GPL-3.0' }), true)
  assert.equal(lechGiayPhep({ giay_phep: 'MIT', giay_phep_ghi_tay: 'MIT OR Apache-2.0' }), false)
  assert.equal(lechGiayPhep({ giay_phep: null, giay_phep_ghi_tay: 'GPL-2.0-or-later' }), false)
  assert.equal(lechGiayPhep({ giay_phep: 'MIT' }), false)
})

// ---------------------------------------------------------------------------
// Thoát ký tự: ngoặc vuông trong tên, gạch đứng trong URL
// ---------------------------------------------------------------------------

test('renderReadme: ngoặc vuông trong tên không giết liên kết', () => {
  const ds = [mucDay({ ten: 'Bộ [gõ] X' }), mucDay({ id: 'b', ten: 'B' })]
  assert.ok(renderThu(ds).includes('[Bộ \\[gõ\\] X](https://github.com/chu/kho)'))
})

test('renderReadme: gạch đứng trong URL không đẩy lệch cột', () => {
  const ds = [
    mucDay({ trang_chu: 'https://vi.du/a|b' }),
    mucDay({ id: 'b', ten: 'B' }),
  ]
  // Chọn nhanh cũng chứa liên kết này; lấy đúng dòng của bảng bộ gõ.
  const dong = renderThu(ds).split('\n').find(d => d.startsWith('| [A]') && d.includes('vi.du'))
  assert.ok(dong.includes('%7C'), 'phải percent-encode, không được để | thô trong URL')
  assert.equal(dong.split(/(?<!\\)\|/).length - 1, 6, 'vẫn đúng 6 biên cột')
})

// ---------------------------------------------------------------------------
// validateData: những đường im lặng làm hỏng dữ liệu
// ---------------------------------------------------------------------------

test('validateData: khoá lạ bị chặn, không im lặng bỏ qua', () => {
  // Gõ "trangchu" thay "trang_chu" cho một mục repo:null là mất sạch liên kết
  // mà cả hai cổng CI vẫn xanh.
  assert.throws(
    () => validateData(data([muc({ trangchu: 'https://vi.du' }), muc({ id: 'b', ten: 'B' })])),
    /khoá lạ "trangchu"/,
  )
})

test('validateData: trang_chu phải là URL http(s)', () => {
  assert.doesNotThrow(() =>
    validateData(data([muc({ trang_chu: 'https://vi.du/x' }), muc({ id: 'b', ten: 'B' })])))
  for (const xau of ['vi.du', 'javascript:alert(1)', 'https://vi.du/a b', '']) {
    assert.throws(
      () => validateData(data([muc({ trang_chu: xau }), muc({ id: 'b', ten: 'B' })])),
      /trang_chu/,
      `phải chặn "${xau}"`,
    )
  }
})

test('validateData: trường bắt buộc toàn khoảng trắng cũng là thiếu', () => {
  assert.throws(
    () => validateData(data([muc({ ghi_chu: '   ' }), muc({ id: 'b', ten: 'B' })])),
    /thiếu trường "ghi_chu"/,
  )
})

test('validateData: nen_tang trùng lặp thì ném lỗi', () => {
  assert.throws(
    () => validateData(data([muc({ nen_tang: ['macos', 'macos'] }), muc({ id: 'b', ten: 'B' })])),
    /nen_tang trùng "macos"/,
  )
})

test('validateData: giay_phep_ghi_tay chỉ dùng được cho mục có repo', () => {
  assert.doesNotThrow(() =>
    validateData(data([muc({ giay_phep_ghi_tay: 'MIT OR Apache-2.0' }), muc({ id: 'b', ten: 'B' })])))
  assert.throws(
    () => validateData(data([muc({ repo: null, giay_phep_ghi_tay: 'GPL-3.0' }), muc({ id: 'b', ten: 'B' })])),
    /giay_phep_ghi_tay/,
  )
})

test('validateData: chon_nhanh không được trỏ mục không chạy trên OS đó', () => {
  // Gõ nhầm một id chỉ-macOS vào cột Linux sẽ xuất bản một gợi ý sai kèm nhãn 🟢.
  const d = data([muc({ nen_tang: ['macos'] }), muc({ id: 'b', ten: 'B', nen_tang: ['macos'] })])
  assert.throws(() => validateData(d), /chon_nhanh\.linux: "a" không chạy trên linux/)
})

test('validateData: chon_nhanh nhận mục đa nền tảng cho từng OS nó hỗ trợ', () => {
  // VnKey (mac+win+linux) làm gợi ý Linux là hợp lệ — đừng cấm nhầm.
  const d = data([
    muc({ nen_tang: ['macos', 'windows', 'linux'] }),
    muc({ id: 'b', ten: 'B', nen_tang: ['macos', 'windows', 'linux'] }),
  ])
  assert.doesNotThrow(() => validateData(d))
})

test('validateData: chon_nhanh không được trỏ vào thư viện', () => {
  const d = data([muc({ nhom: 'thu_vien', nen_tang: NEN_TANG_HOP_LE }), muc({ id: 'b', ten: 'B', nen_tang: NEN_TANG_HOP_LE })])
  assert.throws(() => validateData(d), /chon_nhanh\.macos: "a" là thư viện/)
})

test('validateData: chon_nhanh trùng id trong cùng một OS thì ném lỗi', () => {
  const d = data(); d.chon_nhanh.macos = ['a', 'a']
  assert.throws(() => validateData(d), /chon_nhanh\.macos: id trùng "a"/)
})

test('validateData: khoá lạ trong chon_nhanh bị chặn', () => {
  const d = data(); d.chon_nhanh.bsd = ['a', 'b']
  assert.throws(() => validateData(d), /chon_nhanh: khoá lạ "bsd"/)
})

// ---------------------------------------------------------------------------
// README: cột nền tảng, dòng dẫn sang bảng đa nền tảng, ★ trong Chọn nhanh
// ---------------------------------------------------------------------------

test('renderReadme: bảng đa nền tảng và thư viện có cột Nền tảng, bảng theo OS thì không', () => {
  const ds = [
    mucDay({ id: 'da', ten: 'Da', nen_tang: ['macos', 'windows'] }),
    mucDay({ id: 'tv', ten: 'Tv', nhom: 'thu_vien', nen_tang: ['linux'] }),
    mucDay({ id: 'm', ten: 'M', nen_tang: ['macos'] }),
  ]
  const out = renderReadme({
    muc: ds,
    chon_nhanh: { macos: ['da', 'm'], windows: ['da', 'm'], linux: ['da', 'tv'] },
    bayGio: BAY_GIO,
  })
  const bangMac = out.split('### macOS')[1].split('###')[0]
  const bangDa = out.split('### Đa nền tảng')[1].split('\n## ')[0]
  assert.ok(!bangMac.includes('Nền tảng'), 'bảng một OS thì cột nền tảng chỉ toàn giá trị giống nhau')
  assert.ok(bangDa.includes('| Tên | Nền tảng |'), 'bảng đa nền tảng phải nói rõ chạy ở đâu')
  assert.ok(bangDa.includes('mac · win'))
  assert.ok(out.split('## Thư viện & engine')[1].includes('| Tên | Nền tảng |'))
})

test('renderReadme: mỗi bảng OS dẫn sang những mục đa nền tảng cũng chạy trên OS đó', () => {
  const ds = [
    mucDay({ id: 'da', ten: 'Da', nen_tang: ['macos', 'windows'] }),
    mucDay({ id: 'm', ten: 'M', nen_tang: ['macos'] }),
  ]
  const out = renderReadme({
    muc: ds,
    chon_nhanh: { macos: ['da', 'm'], windows: ['da', 'm'], linux: ['da', 'm'] },
    bayGio: BAY_GIO,
  })
  const bangMac = out.split('### macOS')[1].split('### ')[0]
  assert.ok(
    /1 bộ gõ đa nền tảng/.test(bangMac),
    'bảng macOS hiện chỉ 1/2 mục chạy macOS — phải nói ra chỗ còn lại',
  )
  assert.ok(bangMac.includes('#đa-nền-tảng'), 'phải neo được sang bảng kia')
  const bangLinux = out.split('### Linux')[1].split('### ')[0]
  assert.ok(!/bộ gõ đa nền tảng/.test(bangLinux), 'không có mục nào thì đừng in dòng thừa')
})

test('renderReadme: Chọn nhanh hiện ★ để so được, không chỉ nhãn màu', () => {
  const ds = [mucDay({ sao: 943 }), mucDay({ id: 'b', ten: 'B', sao: null, repo: null, pushed_at: null })]
  const dong = renderThu(ds).split('\n').find(d => d.startsWith('| macOS |'))
  assert.ok(dong.includes('943★'), 'ba gợi ý cùng nhãn 🟢 thì ★ là thứ duy nhất so được')
  assert.ok(!dong.includes('null'), 'mục không có ★ thì bỏ hẳn, không in null★')
})

test('renderReadme: không còn hứa "không lỗi thời"', () => {
  // renderReadme là hàm thuần, không có cách nào biết Action còn sống hay PAT
  // đã hết hạn — nên nó không được phép hứa thay.
  const out = renderThu([mucDay(), mucDay({ id: 'b', ten: 'B' })])
  assert.ok(!out.includes('không lỗi thời'))
  assert.ok(out.includes('(chốt lần cuối: 2026-08-09)'), 'vẫn phải có bằng chứng ngày ngay tại chỗ')
})

test('renderReadme: có lối đóng góp cho người không dùng Git', () => {
  const out = renderThu([mucDay(), mucDay({ id: 'b', ten: 'B' })])
  assert.ok(/issues\/new/.test(out), 'phải mời mở issue')
  assert.ok(!/github\.com\/[a-z0-9-]+\/awesome/i.test(out), 'lib.mjs là file thuần, đừng hardcode URL repo')
})

// ---------------------------------------------------------------------------
// So sánh README cũ/mới: chỉ bỏ qua đúng hai câu ngày chốt
// ---------------------------------------------------------------------------

import { boQuaNgayChot } from './lib.mjs'

test('boQuaNgayChot: hai câu ngày chốt bị bỏ qua', () => {
  const a = 'x (chốt lần cuối: 2026-08-09) y\nSố liệu chốt ngày 2026-08-09.\n'
  const b = 'x (chốt lần cuối: 2026-09-01) y\nSố liệu chốt ngày 2026-09-01.\n'
  assert.equal(boQuaNgayChot(a), boQuaNgayChot(b))
})

test('boQuaNgayChot: ngày nằm trong ghi chú KHÔNG được nuốt', () => {
  // Regex quét cả file sẽ nuốt luôn đính chính kiểu "ngừng từ 2013-11-05" →
  // build in "Số liệu không đổi", không ghi file, không cảnh báo, CI xanh.
  const a = '| X | 1 | 🔴 2013-11 | MIT | Ngừng từ 2013-11-05. |'
  const b = '| X | 1 | 🔴 2013-11 | MIT | Ngừng từ 2014-08-20. |'
  assert.notEqual(boQuaNgayChot(a), boQuaNgayChot(b))
})
