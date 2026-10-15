export interface Rates {
  gst: number; qst: number; smallSupplierThreshold: number;
  qpp: { basicExemption: number; maxPensionableEarnings: number; additionalMaxEarnings: number; employeeRate: number; selfEmployedRate: number; secondAdditionalSelfEmployedRate: number };
  qpip: { selfEmployedRate: number; maxInsurableEarnings: number };
}
type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };
export interface Options { year?: number; rates?: DeepPartial<Rates> }
export interface SalesTax { subtotal: number; gst: number; qst: number; total: number }
export const RATES: Readonly<Record<number, Rates>>;
export function getRates(year?: number, overrides?: DeepPartial<Rates>): Rates;
export function addSalesTax(amount: number, opts?: Options): SalesTax;
export function removeSalesTax(total: number, opts?: Options): SalesTax;
export function netSalesTax(p: { gstCollected?: number; qstCollected?: number; gstPaid?: number; qstPaid?: number }): { gst: number; qst: number; total: number; refund: boolean };
export function smallSupplierStatus(quarters: number[], opts?: Options): { threshold: number; highestFourQuarterTotal: number; percentOfThreshold: number; mustRegister: boolean };
export function qppSelfEmployed(netEarnings: number, opts?: Options): { base: number; second: number; total: number };
export function qpipSelfEmployed(netEarnings: number, opts?: Options): number;
export function setAside(netEarnings: number, opts?: Options & { incomeTaxRate?: number; salesTaxOwed?: number }): { qpp: number; qpip: number; incomeTax: number; salesTax: number; total: number; safeToSpend: number };
export function formatCAD(n: number, locale?: 'en' | 'fr'): string;
