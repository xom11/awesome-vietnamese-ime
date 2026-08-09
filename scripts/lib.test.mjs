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
