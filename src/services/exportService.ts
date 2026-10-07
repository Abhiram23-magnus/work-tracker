import type { Worker } from '../types/worker'
import type { WorkRecord } from '../types/work'
import type { Transaction } from '../types/transaction'
import { MONEY_HEADERS, WORK_HEADERS, WORKER_HEADERS, buildExportTables, buildStatement, fileSlug } from '../domain/exportData'
import { formatPaise } from '../utils/currency'
import { formatDisplayDate, todayISO } from '../utils/dates'
import { ACCOUNT_STATUS_LABELS } from '../domain/accountStatus'

export interface ExportInput {
  workers: Worker[]
  work: WorkRecord[]
  transactions: Transaction[]
}

function download(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

// The writers are loaded only when used so the app opens fast and the main bundle stays small.

/** Excel workbook with Workers, Work and Money sheets. */
export async function exportExcel(data: ExportInput, range: { from?: string; to?: string } = {}) {
  const { default: writeExcelFile } = await import('write-excel-file/universal')
  const tables = buildExportTables(data.workers, data.work, data.transactions, range)
  const header = (labels: string[]) => labels.map((value) => ({ value, fontWeight: 'bold' as const }))
  const body = (rows: (string | number)[][]) =>
    rows.map((row) =>
      row.map((value) =>
        typeof value === 'number' ? { value, type: Number, format: '#,##0.00' } : { value, type: String },
      ),
    )
  const blob = await writeExcelFile([
    { sheet: 'Workers', data: [header(WORKER_HEADERS), ...body(tables.workers)], columns: WORKER_HEADERS.map((_, i) => ({ width: i === 0 ? 22 : 15 })) },
    { sheet: 'Work', data: [header(WORK_HEADERS), ...body(tables.work)], columns: WORK_HEADERS.map((_, i) => ({ width: i === 5 ? 30 : 15 })) },
    { sheet: 'Money', data: [header(MONEY_HEADERS), ...body(tables.money)], columns: MONEY_HEADERS.map((_, i) => ({ width: i === 4 ? 30 : 15 })) },
  ] as never).toBlob()
  download(blob, `worker-tracker-${todayISO()}.xlsx`)
}

// jsPDF's built-in fonts have no ₹ glyph, so PDFs write amounts as "Rs 1,200".
const pdfMoney = (paise: number) => formatPaise(paise).replace('₹', 'Rs ').replace('Rs -', '-Rs ')

async function newPdf(title: string, subtitle: string) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
  const doc = new jsPDF()
  doc.setFontSize(16)
  doc.text(title, 14, 18)
  doc.setFontSize(10)
  doc.text(subtitle, 14, 25)
  return { doc, autoTable }
}

/** One-page-per-need summary of every worker's account. */
export async function exportSummaryPdf(data: ExportInput) {
  const { doc, autoTable } = await newPdf('Worker Tracker – Summary', `As on ${formatDisplayDate(todayISO())}`)
  const tables = buildExportTables(data.workers, data.work, data.transactions)
  const rupees = (v: string | number) => pdfMoney(Math.round(Number(v) * 100))
  autoTable(doc, {
    startY: 30,
    head: [['Worker', 'Days', 'Earned', 'Advances', 'Paid', 'Balance', 'Account']],
    body: tables.workers.map((r) => [r[0], r[4], rupees(r[5]), rupees(r[6]), rupees(r[7]), rupees(r[8]), r[9]] as string[]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [46, 107, 52] },
  })
  doc.save(`worker-summary-${todayISO()}.pdf`)
}

/** Statement for one worker: every day worked and payment with a running balance. */
export async function exportWorkerPdf(worker: Worker, data: ExportInput) {
  const { rows, summary } = buildStatement(worker, data.work, data.transactions)
  const { doc, autoTable } = await newPdf(`${worker.name} – Statement`, `${worker.workType} · As on ${formatDisplayDate(todayISO())}`)
  autoTable(doc, {
    startY: 30,
    head: [['Date', 'Details', 'Earned', 'Paid out', 'Balance']],
    body: rows.map((r) => [formatDisplayDate(r.date), r.text, r.earned ? pdfMoney(r.earned) : '', r.paid ? pdfMoney(r.paid) : '', pdfMoney(r.balance)]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [46, 107, 52] },
    foot: [[ '', `Total (${summary.daysWorked} days)`, pdfMoney(summary.totalEarnings), pdfMoney(summary.totalReceived), pdfMoney(summary.balance) ]],
    footStyles: { fillColor: [239, 234, 219], textColor: 20 },
  })
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY
  doc.setFontSize(11)
  doc.text(`${ACCOUNT_STATUS_LABELS[summary.status]}: ${pdfMoney(Math.abs(summary.balance))}`, 14, finalY + 10)
  doc.save(`${fileSlug(worker.name)}-statement-${todayISO()}.pdf`)
}
