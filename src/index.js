'use strict';
/**
 * quebec-tax: sales tax and self-employed contribution helpers for Québec, Canada.
 * Rates are data, not code: pass your own `rates` object to override any value.
 * Not tax advice. Verify with Revenu Québec, Retraite Québec and the CRA.
 */

const RATES = Object.freeze({
  2026: Object.freeze({
    gst: 0.05,
    qst: 0.09975,
    smallSupplierThreshold: 30000,
    qpp: Object.freeze({
      basicExemption: 3500,
      maxPensionableEarnings: 74600, // MPE (YMPE)
      additionalMaxEarnings: 85000, // second ceiling (YAMPE)
      employeeRate: 0.063,
      selfEmployedRate: 0.126, // base 10.6% + first additional 2%
      secondAdditionalSelfEmployedRate: 0.08,
    }),
    qpip: Object.freeze({
      selfEmployedRate: 0.00764,
      maxInsurableEarnings: 103000,
    }),
  }),
});

const DEFAULT_YEAR = 2026;
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

function getRates(year = DEFAULT_YEAR, overrides) {
  const base = RATES[year];
  if (!base && !overrides) throw new RangeError(`No built-in rates for ${year}. Pass a rates object.`);
  return deepMerge(base || {}, overrides || {});
}

function deepMerge(a, b) {
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) {
    out[k] = v && typeof v === 'object' && !Array.isArray(v) ? deepMerge(a[k] || {}, v) : v;
  }
  return out;
}

function assertAmount(n, name = 'amount') {
  if (typeof n !== 'number' || !Number.isFinite(n)) throw new TypeError(`${name} must be a finite number`);
}

/** Add GST and QST to a pre-tax amount. Each tax is rounded to the cent separately, as on a Québec invoice. */
function addSalesTax(amount, { year, rates } = {}) {
  assertAmount(amount);
  const r = getRates(year, rates);
  const gst = round2(amount * r.gst);
  const qst = round2(amount * r.qst);
  return { subtotal: round2(amount), gst, qst, total: round2(amount + gst + qst) };
}

/** Split a tax-included total back into subtotal, GST and QST. */
function removeSalesTax(total, { year, rates } = {}) {
  assertAmount(total, 'total');
  const r = getRates(year, rates);
  const subtotal = round2(total / (1 + r.gst + r.qst));
  const gst = round2(subtotal * r.gst);
  const qst = round2(total - subtotal - gst);
  return { subtotal, gst, qst, total: round2(total) };
}

/** Net GST and QST owed for a period: collected minus input tax credits (ITC) / refunds (ITR). */
function netSalesTax({ gstCollected = 0, qstCollected = 0, gstPaid = 0, qstPaid = 0 }) {
  const gst = round2(gstCollected - gstPaid);
  const qst = round2(qstCollected - qstPaid);
  return { gst, qst, total: round2(gst + qst), refund: gst + qst < 0 };
}

/**
 * Small-supplier test. `quarters` is an array of taxable supplies per calendar quarter, oldest first.
 * Returns whether registration is required (any single quarter or any 4 consecutive quarters over the threshold).
 */
function smallSupplierStatus(quarters, { year, rates } = {}) {
  if (!Array.isArray(quarters)) throw new TypeError('quarters must be an array of numbers');
  quarters.forEach((q, i) => assertAmount(q, `quarters[${i}]`));
  const { smallSupplierThreshold: t } = getRates(year, rates);
  const singleQuarter = quarters.some((q) => q > t);
  let maxFour = 0;
  for (let i = 0; i < quarters.length; i++) {
    const sum = quarters.slice(Math.max(0, i - 3), i + 1).reduce((a, b) => a + b, 0);
    maxFour = Math.max(maxFour, sum);
  }
  return {
    threshold: t,
    highestFourQuarterTotal: round2(maxFour),
    percentOfThreshold: round2(maxFour / t),
    mustRegister: singleQuarter || maxFour > t,
  };
}

/** QPP contributions on net self-employment earnings (base + first and second additional). */
function qppSelfEmployed(netEarnings, { year, rates } = {}) {
  assertAmount(netEarnings, 'netEarnings');
  const { qpp } = getRates(year, rates);
  const e = Math.max(0, netEarnings);
  const tier1 = Math.max(0, Math.min(e, qpp.maxPensionableEarnings) - qpp.basicExemption) * qpp.selfEmployedRate;
  const tier2 = Math.max(0, Math.min(e, qpp.additionalMaxEarnings) - qpp.maxPensionableEarnings) * qpp.secondAdditionalSelfEmployedRate;
  return { base: round2(tier1), second: round2(tier2), total: round2(tier1 + tier2) };
}

/** QPIP premium on net self-employment earnings. */
function qpipSelfEmployed(netEarnings, { year, rates } = {}) {
  assertAmount(netEarnings, 'netEarnings');
  const { qpip } = getRates(year, rates);
  const insurable = Math.min(Math.max(0, netEarnings), qpip.maxInsurableEarnings);
  return round2(insurable * qpip.selfEmployedRate);
}

/**
 * Rough set-aside estimate for a self-employed person.
 * `incomeTaxRate` is a flat reserve you choose (default 25%); this library does NOT compute income tax brackets.
 */
function setAside(netEarnings, { year, rates, incomeTaxRate = 0.25, salesTaxOwed = 0 } = {}) {
  assertAmount(netEarnings, 'netEarnings');
  const qpp = qppSelfEmployed(netEarnings, { year, rates }).total;
  const qpip = qpipSelfEmployed(netEarnings, { year, rates });
  const incomeTax = round2(Math.max(0, netEarnings) * incomeTaxRate);
  const total = round2(qpp + qpip + incomeTax + Math.max(0, salesTaxOwed));
  return { qpp, qpip, incomeTax, salesTax: round2(Math.max(0, salesTaxOwed)), total, safeToSpend: round2(netEarnings - qpp - qpip - incomeTax) };
}

/** Format a number as Canadian dollars in English or French. */
function formatCAD(n, locale = 'en') {
  assertAmount(n);
  return new Intl.NumberFormat(locale === 'fr' ? 'fr-CA' : 'en-CA', { style: 'currency', currency: 'CAD' }).format(n);
}

module.exports = {
  RATES, getRates, addSalesTax, removeSalesTax, netSalesTax, smallSupplierStatus,
  qppSelfEmployed, qpipSelfEmployed, setAside, formatCAD,
};
