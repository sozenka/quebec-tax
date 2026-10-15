# quebec-tax

GST/QST sales tax and self-employed QPP/QPIP helpers for Québec, Canada. Zero dependencies, 2026 rates, TypeScript types included.

*Français plus bas.*

```bash
npm install quebec-tax
npx quebec-tax add 1700        # Subtotal $1,700.00 · GST $85.00 · QST $169.58 · Total $1,954.58
npx quebec-tax setaside 50000 --fr
```

```js
const qc = require('quebec-tax');

qc.addSalesTax(1700);          // { subtotal: 1700, gst: 85, qst: 169.58, total: 1954.58 }
qc.removeSalesTax(114.98);     // { subtotal: 100, gst: 5, qst: 9.98, total: 114.98 }
qc.netSalesTax({ gstCollected: 85, qstCollected: 169.58, gstPaid: 3.5, qstPaid: 6.98 });
qc.smallSupplierStatus([8000, 8000, 8000, 8000]).mustRegister; // true ($30,000 rule)
qc.qppSelfEmployed(51630);     // { base: 6064.38, second: 0, total: 6064.38 }
qc.qpipSelfEmployed(51630);    // 394.45
qc.setAside(51630);            // QPP + QPIP + 25% income-tax reserve, and "safe to spend"
qc.formatCAD(1954.58, 'fr');   // "1 954,58 $"
```

## What it covers

| Function | What it does |
|---|---|
| `addSalesTax` / `removeSalesTax` | GST 5% + QST 9.975%, each rounded to the cent like a Québec invoice |
| `netSalesTax` | GST/QST to remit after input tax credits (ITC) and refunds (ITR) |
| `smallSupplierStatus` | $30,000 small-supplier test (single quarter or 4 consecutive quarters) |
| `qppSelfEmployed` | QPP base + first additional (12.6%) and second additional (8%) for self-employed |
| `qpipSelfEmployed` | QPIP self-employed premium (0.764%, capped) |
| `setAside` | One call to estimate what a freelancer should keep aside |

Every rate lives in one `RATES` object and can be overridden: `qc.addSalesTax(100, { rates: { gst: 0.06 } })`.

**Not tax advice.** `setAside` uses a flat income-tax reserve you choose; it does not compute tax brackets. Confirm figures with Revenu Québec, Retraite Québec and the CRA.

## Français

Calculs TPS/TVQ, RRQ et RQAP pour travailleurs autonomes et développeurs au Québec. Aucune dépendance, taux 2026.

- `addSalesTax(montant)` : ajoute la TPS (5 %) et la TVQ (9,975 %)
- `removeSalesTax(total)` : décompose un total taxes incluses
- `smallSupplierStatus(trimestres)` : vérifie le seuil de 30 000 $ du petit fournisseur
- `qppSelfEmployed(revenuNet)` / `qpipSelfEmployed(revenuNet)` : cotisations RRQ et RQAP du travailleur autonome
- `setAside(revenuNet)` : montant à mettre de côté

Ceci n'est pas un avis fiscal.

## Sponsor

If this saves you time, consider [sponsoring the project](https://github.com/sponsors/YOUR_GITHUB_USERNAME). Sponsorship keeps the rates updated every January.

Need it in a spreadsheet instead? Bilingual Excel/Google Sheets templates built on the same math: *link coming soon*.

## License

MIT
