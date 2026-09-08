import ExcelJS from 'exceljs'
import type { ListRow } from '../db/dexie'
import { toExcelDate, caps } from './formatters'

/**
 * Генерация XLSX «Crew and Passenger List» строго по образцу
 * (файл Becquard Radosevich, лист A1:K37, сверено дампом openpyxl).
 *
 * Раскладка:
 *  - A1:J2 merged — заголовок Arial Black 26 bold, left / vertical center, row1 h=34
 *  - строка 3 — заголовки колонок (Arial 11)
 *  - данные с строки 4 (Arial 10): сначала экипаж (нумерация 1..N),
 *    затем пассажиры (нумерация заново с 1)
 *  - сразу после данных — 3 строки футера, каждая merged A:I (Arial 10)
 */

const SHEET_NAME = 'Crew and Passenger List'

const HEADERS = [
  '', 'Last Name', 'First Name', 'Date of birth', 'Place of birth',
  'Nationality', 'Issue date', 'Expiration date', 'Pasp nr.', 'Rank', 'Remarks'
]

// Ширины колонок A..K (символьные единицы Excel, как в образце).
const COL_WIDTHS = [4, 16, 22, 13, 20, 14, 13, 15, 14, 12, 22]

const FOOTER_LINES = [
  'In adherence to article 15 (1) (a)(b)(c)(d) and article 15 (2) of the Toelatingsbesluit,',
  'The Captain or his/her Representative must present to the Immigration Officer all information pertaining to all persons onboard the vessel without delay.',
  'This also includes persons disembarking and or embarking the vessel.'
]

const ARIAL = 'Arial'
const ARIAL_BLACK = 'Arial Black'

function writeDataRow(ws: ExcelJS.Worksheet, rowIdx: number, seq: number, r: ListRow) {
  const row = ws.getRow(rowIdx)
  row.getCell(1).value = seq
  row.getCell(1).alignment = { horizontal: 'left' }
  row.getCell(2).value = caps(r.lastName)
  row.getCell(3).value = caps(r.firstName)
  row.getCell(4).value = toExcelDate(r.dateOfBirth)
  row.getCell(4).numFmt = '@'
  row.getCell(5).value = caps(r.placeOfBirth)
  row.getCell(6).value = caps(r.nationality)
  row.getCell(7).value = toExcelDate(r.issueDate)
  row.getCell(7).numFmt = '@'
  row.getCell(8).value = toExcelDate(r.expirationDate)
  row.getCell(8).numFmt = '@'
  row.getCell(9).value = r.passportNumber
  row.getCell(10).value = r.rank
  row.getCell(11).value = r.remark
  for (let c = 1; c <= 11; c++) {
    row.getCell(c).font = { name: ARIAL, size: 10 }
  }
}

export async function buildPassengerListWorkbook(
  crewRows: ListRow[],
  passengers: ListRow[]
): Promise<Blob> {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet(SHEET_NAME)

  // Ширины колонок
  COL_WIDTHS.forEach((w, i) => {
    ws.getColumn(i + 1).width = w
  })

  // Заголовок A1:J2
  ws.mergeCells('A1:J2')
  const title = ws.getCell('A1')
  title.value = 'CREW AND PASSENGER LIST'
  title.font = { name: ARIAL_BLACK, size: 26, bold: true }
  title.alignment = { horizontal: 'left', vertical: 'middle' }
  ws.getRow(1).height = 34

  // Заголовки колонок (строка 3)
  const headerRow = ws.getRow(3)
  HEADERS.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1)
    cell.value = h
    cell.font = { name: ARIAL, size: 11 }
  })

  // Данные: экипаж (1..N), затем пассажиры (заново с 1)
  let rowIdx = 4
  crewRows.forEach((r, i) => writeDataRow(ws, rowIdx++, i + 1, r))
  passengers.forEach((r, i) => writeDataRow(ws, rowIdx++, i + 1, r))

  // Футер — сразу после данных, 3 строки, каждая merged A:I
  for (const line of FOOTER_LINES) {
    ws.mergeCells(`A${rowIdx}:I${rowIdx}`)
    const cell = ws.getCell(`A${rowIdx}`)
    cell.value = line
    cell.font = { name: ARIAL, size: 10 }
    cell.alignment = { horizontal: 'left' }
    rowIdx++
  }

  const buffer = await wb.xlsx.writeBuffer()
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
}
