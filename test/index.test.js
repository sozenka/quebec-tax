'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const t = require('../src/index.js');

test('addSalesTax rounds each tax separately', () => {
  assert.deepEqual(t.addSalesTax(100), { subtotal: 100, gst: 5, qst: 9.98, total: 114.98 });
  assert.deepEqual(t.addSalesTax(1700), { subtotal: 1700, gst: 85, qst: 169.58, total: 1954.58 });
});
test('removeSalesTax reverses addSalesTax', () => {
  for (const amt of [1, 19.99, 100, 1234.56, 50000]) {
    const r = t.removeSalesTax(t.addSalesTax(amt).total);
    assert.ok(Math.abs(r.subtotal - amt) <= 0.01, `${amt} -> ${r.subtotal}`);
    assert.equal(Math.round((r.subtotal + r.gst + r.qst) * 100), Math.round(r.total * 100));
  }
});
test('netSalesTax', () => {
  assert.deepEqual(t.netSalesTax({ gstCollected: 85, qstCollected: 169.58, gstPaid: 3.5, qstPaid: 6.98 }), { gst: 81.5, qst: 162.6, total: 244.1, refund: false });
  assert.equal(t.netSalesTax({ gstPaid: 10 }).refund, true);
});
test('smallSupplierStatus', () => {
  assert.equal(t.smallSupplierStatus([5000, 6000, 7000, 8000]).mustRegister, false);
  assert.equal(t.smallSupplierStatus([8000, 8000, 8000, 8000]).mustRegister, true);
  assert.equal(t.smallSupplierStatus([31000]).mustRegister, true);
  assert.equal(t.smallSupplierStatus([9000, 9000, 9000, 1000, 1000]).highestFourQuarterTotal, 28000);
});
test('qppSelfEmployed', () => {
  assert.equal(t.qppSelfEmployed(3000).total, 0);
  assert.equal(t.qppSelfEmployed(51630).total, 6064.38);
  // maximum: (74600-3500)*0.126 + (85000-74600)*0.08 = 8958.60 + 832 = 9790.60
  assert.equal(t.qppSelfEmployed(200000).total, 9790.6);
});
test('qpipSelfEmployed', () => {
  assert.equal(t.qpipSelfEmployed(1630), 12.45);
  assert.equal(t.qpipSelfEmployed(500000), 786.92);
});
test('setAside', () => {
  const s = t.setAside(1630);
  assert.deepEqual([s.qpp, s.qpip, s.incomeTax], [0, 12.45, 407.5]);
  assert.equal(s.safeToSpend, 1210.05);
});
test('overrides and validation', () => {
  assert.equal(t.addSalesTax(100, { rates: { gst: 0.06 } }).gst, 6);
  assert.throws(() => t.addSalesTax('100'), TypeError);
  assert.throws(() => t.addSalesTax(100, { year: 1990 }), RangeError);
});
test('formatCAD', () => {
  assert.equal(t.formatCAD(1954.58), '$1,954.58');
  assert.match(t.formatCAD(1954.58, 'fr'), /1\s954,58\s\$/);
});
