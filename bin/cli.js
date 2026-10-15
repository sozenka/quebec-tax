#!/usr/bin/env node
'use strict';
const t = require('../src/index.js');
const [cmd, ...args] = process.argv.slice(2);
const n = Number(args[0]);
const fr = args.includes('--fr');
const money = (x) => t.formatCAD(x, fr ? 'fr' : 'en');
const help = `quebec-tax: GST/QST and self-employed QPP/QPIP helpers (2026 rates)

  quebec-tax add <amount>        add GST + QST
  quebec-tax remove <total>      split a tax-included total
  quebec-tax setaside <profit>   QPP + QPIP + 25% income-tax reserve
  add --fr for French formatting`;
if (!cmd || Number.isNaN(n)) { console.log(help); process.exit(cmd ? 1 : 0); }
if (cmd === 'add' || cmd === 'remove') {
  const r = cmd === 'add' ? t.addSalesTax(n) : t.removeSalesTax(n);
  console.log(`${fr ? 'Sous-total' : 'Subtotal'}: ${money(r.subtotal)}\n${fr ? 'TPS' : 'GST'}: ${money(r.gst)}\n${fr ? 'TVQ' : 'QST'}: ${money(r.qst)}\nTotal: ${money(r.total)}`);
} else if (cmd === 'setaside') {
  const s = t.setAside(n);
  console.log(`${fr ? 'RRQ' : 'QPP'}: ${money(s.qpp)}\n${fr ? 'RQAP' : 'QPIP'}: ${money(s.qpip)}\n${fr ? "Réserve d'impôt (25 %)" : 'Income-tax reserve (25%)'}: ${money(s.incomeTax)}\n${fr ? 'Total à garder' : 'Total to set aside'}: ${money(s.total)}\n${fr ? 'Disponible' : 'Safe to spend'}: ${money(s.safeToSpend)}`);
} else { console.log(help); process.exit(1); }
