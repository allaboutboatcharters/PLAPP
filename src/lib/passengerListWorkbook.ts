import ExcelJS from 'exceljs'
import type { ListRow } from '../db/dexie'
import { parseInternalDate, caps } from './formatters'

/**
 * Генерация XLSX «Crew and Passenger List» строго по образцу
 * (файл Crew_and_Passenger_List_Rumbelly_2.xlsx, сверено дампом openpyxl).
 *
 * Раскладка:
 *  - B1 — заголовок Impact 36 (с ведущими пробелами), row height 45
 *  - строка 2 — заголовки колонок (Times New Roman 10), row height 19.5
 *  - данные с строки 3 (Calibri 11): сначала экипаж (нумерация 1..N),
 *    затем пассажиры (нумерация 1..28, пустые строки заполняются seq + "Passenger")
 *  - всего 30 строк данных (2 crew + 28 passengers)
 *  - футер после строки 32 — 3 строки в колонке A (Calibri 11)
 *  - нет merged cells
 */

const SHEET_NAME = 'Crew and Passenger List'

const TITLE = '                                 CREW AND PASSENGER LIST'

const HEADERS = [
  // A2 has a tab-padded spacer string in the original; we use empty string
  '', 'Last Name', ' First Name', 'Date of birth', 'Place of birth',
  'Nationality', 'Issue Date', 'Expiration Date', 'Pasp nr.', 'Rank  ', 'Remarks'
]

// Column widths from the example (A..K)
const COL_WIDTHS = [2.96, 16.81, 30.0, 17.62, 20.71, 13.0, 13.03, 14.93, 16.68, 17.08, 17.22]

const MAX_PASSENGERS = 28
const DATA_START_ROW = 3
const CREW_COUNT = 2
const TOTAL_DATA_ROWS = CREW_COUNT + MAX_PASSENGERS // 30

const FOOTER_LINES = [
  'In adherence to article 15 (1) (a)(b)(c)(d) and article 15 (2) of the Toelatingsbesluit,',
  'The Captain or his/her Representative must present to the Immigration Officer all information pertaining to all persons onboard the vessel without delay.',
  'This also includes persons disembarking and or embarking the vessel.  '
]

const TIMES = 'Times New Roman'
const CALIBRI = 'Calibri'
const IMPACT = 'Impact'
const DATE_FMT = 'm/d/yyyy'

/**
 * DD.MM.YYYY → JS Date for ExcelJS (returns null if unparseable).
 */
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

function writeDataRow(ws: ExcelJS.Worksheet, rowIdx: number, seq: number, r: ListRow | null) {
  const row = ws.getRow(rowIdx)
  row.height = 19.5
  const font = { name: CALIBRI, size: 11 }

  row.getCell(1).value = seq
  row.getCell(1).font = font

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
    // Empty passenger slot
    row.getCell(10).value = 'Passenger'
  }

  for (let c = 1; c <= 11; c++) {
    row.getCell(c).font = font
  }
}

export async function buildPassengerListWorkbook(
  crewRows: ListRow[],
  passengers: ListRow[]
): Promise<Blob> {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet(SHEET_NAME)

  // Column widths
  COL_WIDTHS.forEach((w, i) => {
    ws.getColumn(i + 1).width = w
  })

  // Row 1: Title in B1 (Impact 36)
  const titleRow = ws.getRow(1)
  titleRow.height = 45
  const titleCell = titleRow.getCell(2) // B1
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

  // Data rows starting at row 3
  let rowIdx = DATA_START_ROW

  // Crew (1..N)
  crewRows.forEach((r, i) => writeDataRow(ws, rowIdx++, i + 1, r))

  // Passengers (1..28, fill empty slots)
  for (let i = 0; i < MAX_PASSENGERS; i++) {
    const p = i < passengers.length ? passengers[i] : null
    writeDataRow(ws, rowIdx++, i + 1, p)
  }

  // Footer — 3 rows after all 30 data rows
  const footerStart = DATA_START_ROW + TOTAL_DATA_ROWS // row 33
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
