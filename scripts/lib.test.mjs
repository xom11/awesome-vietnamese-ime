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
