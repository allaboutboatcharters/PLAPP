import ExcelJS from 'exceljs'
import type { ListRow } from '../db/dexie'
import { parseInternalDate, caps } from './formatters'

/**
 * Генерация XLSX «Crew and Passenger List» строго по образцу
 * (файл Crew_and_Passenger_List_Rumbelly_2.xlsx, сверено дампом openpyxl).
 *
 * Раскладка:
 *  - B1 — заголовок Impact 36, row height 45
 *  - строка 2 — заголовки колонок (Times New Roman 10), row height 19.5
 *  - данные со строки 3 (Calibri 11): экипаж (1..N), пассажиры (1..M)
 *  - количество строк пассажиров = max(фактическое, 10)
 *  - границы: medium по внешнему контуру, thin внутри (только data rows)
 *  - футер — 3 строки после данных, без границ
 */

const SHEET_NAME = 'Crew and Passenger List'
const TITLE = '                                 CREW AND PASSENGER LIST'

const HEADERS = [
  '', 'Last Name', ' First Name', 'Date of birth', 'Place of birth',
  'Nationality', 'Issue Date', 'Expiration Date', 'Pasp nr.', 'Rank  ', 'Remarks'
]

const COL_WIDTHS = [2.96, 16.81, 30.0, 17.62, 20.71, 13.0, 13.03, 14.93, 16.68, 17.08, 17.22]

const MIN_PASSENGER_ROWS = 10
const DATA_START_ROW = 3
const CREW_COUNT = 2

const FOOTER_LINES = [
  'In adherence to article 15 (1) (a)(b)(c)(d) and article 15 (2) of the Toelatingsbesluit,',
  'The Captain or his/her Representative must present to the Immigration Officer all information pertaining to all persons onboard the vessel without delay.',
  'This also includes persons disembarking and or embarking the vessel.  '
]

const TIMES = 'Times New Roman'
const CALIBRI = 'Calibri'
const IMPACT = 'Impact'
const DATE_FMT = 'm/d/yyyy'

// Border styles
const THIN: Partial<ExcelJS.Border> = { style: 'thin' }
const MEDIUM: Partial<ExcelJS.Border> = { style: 'medium' }

function toJsDate(s: string): Date | null {
  const p = parseInternalDate(s)
  if (!p) return null
  return new Date(p.y, p.m - 1, p.d)
}

function writeDateCell(cell: ExcelJS.Cell, dateStr: string) {
  const d = toJsDate(dateStr)
  if (d) {
    cell.value = d
    cell.numFmt = DATE_FMT
  } else {
    cell.value = dateStr
  }
}

/**
 * Returns border for a cell given its position in the data grid.
 * colIdx: 1-based column (1=A, 11=K)
 * isFirstRow / isLastRow: whether this is the top/bottom row of the data block
 */
function cellBorder(colIdx: number, isFirstRow: boolean, isLastRow: boolean): Partial<ExcelJS.Borders> {
  return {
    left: colIdx === 1 ? MEDIUM : THIN,
    right: colIdx === 11 ? MEDIUM : THIN,
    top: isFirstRow ? MEDIUM : THIN,
    bottom: isLastRow ? MEDIUM : THIN
  }
}

function writeDataRow(
  ws: ExcelJS.Worksheet, rowIdx: number, seq: number,
  r: ListRow | null, isFirstRow: boolean, isLastRow: boolean
) {
  const row = ws.getRow(rowIdx)
  row.height = 19.5
  const font: Partial<ExcelJS.Font> = { name: CALIBRI, size: 11 }

  row.getCell(1).value = seq
  row.getCell(1).alignment = { horizontal: 'left' }

  if (r) {
    row.getCell(2).value = caps(r.lastName)
    row.getCell(3).value = caps(r.firstName)
    writeDateCell(row.getCell(4), r.dateOfBirth)
    row.getCell(5).value = caps(r.placeOfBirth)
    row.getCell(6).value = caps(r.nationality)
    writeDateCell(row.getCell(7), r.issueDate)
    writeDateCell(row.getCell(8), r.expirationDate)
    row.getCell(9).value = r.passportNumber
    row.getCell(10).value = r.rank
    row.getCell(11).value = r.remark
  } else {
    row.getCell(10).value = 'Passenger'
  }

  for (let c = 1; c <= 11; c++) {
    const cell = row.getCell(c)
    cell.font = font
    cell.border = cellBorder(c, isFirstRow, isLastRow)
  }
}

export async function buildPassengerListWorkbook(
  crewRows: ListRow[],
  passengers: ListRow[]
): Promise<Blob> {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet(SHEET_NAME)

  COL_WIDTHS.forEach((w, i) => {
    ws.getColumn(i + 1).width = w
  })

  // Row 1: Title in B1 (Impact 36)
  const titleRow = ws.getRow(1)
  titleRow.height = 45
  const titleCell = titleRow.getCell(2)
  titleCell.value = TITLE
  titleCell.font = { name: IMPACT, size: 36 }

  // Row 2: Headers (Times New Roman 10)
  const headerRow = ws.getRow(2)
  headerRow.height = 19.5
  HEADERS.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1)
    cell.value = h || null
    cell.font = { name: TIMES, size: 10 }
  })

  // Calculate passenger slot count: at least MIN_PASSENGER_ROWS
  const passengerSlots = Math.max(passengers.length, MIN_PASSENGER_ROWS)
  const totalDataRows = CREW_COUNT + passengerSlots

  // Data rows starting at row 3
  let rowIdx = DATA_START_ROW

  // Crew
  crewRows.forEach((r, i) => {
    const isFirst = i === 0
    const isLast = false // crew is never the last row (passengers follow)
    writeDataRow(ws, rowIdx++, i + 1, r, isFirst, isLast)
  })

  // Passengers
  for (let i = 0; i < passengerSlots; i++) {
    const p = i < passengers.length ? passengers[i] : null
    const isFirst = false // crew rows come before
    const isLast = i === passengerSlots - 1
    writeDataRow(ws, rowIdx++, i + 1, p, isFirst, isLast)
  }

  // Footer
  const footerStart = DATA_START_ROW + totalDataRows
  for (let i = 0; i < FOOTER_LINES.length; i++) {
    const cell = ws.getCell(`A${footerStart + i}`)
    cell.value = FOOTER_LINES[i]
    cell.font = { name: CALIBRI, size: 11 }
  }

  const buffer = await wb.xlsx.writeBuffer()
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
}
