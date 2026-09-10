import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { ListRow } from '../db/dexie'
import { parseInternalDate } from './formatters'

function fmtDate(s: string): string {
  const p = parseInternalDate(s)
  if (!p) return s
  return `${String(p.d).padStart(2, '0')}/${String(p.m).padStart(2, '0')}/${p.y}`
}

/**
 * Generate and save/share a landscape PDF of the Crew & Passenger List.
 * Uses jsPDF + autotable — no browser print dialog, works on iOS Safari.
 */
export function savePdf(boatName: string, crewRows: ListRow[], passengers: ListRow[]) {
  const MIN_ROWS = 10
  const passengerSlots = Math.max(passengers.length, MIN_ROWS)

  // Build table data
  const headers = [
    ['', 'Last Name', 'First Name', 'Date of birth', 'Place of birth',
     'Nationality', 'Issue Date', 'Expiration Date', 'Pasp nr.', 'Rank', 'Remarks']
  ]

  const body: string[][] = []

  // Crew rows
  for (const r of crewRows) {
    body.push([
      String(r.seq),
      r.lastName.toUpperCase(),
      r.firstName.toUpperCase(),
      fmtDate(r.dateOfBirth),
      r.placeOfBirth.toUpperCase(),
      r.nationality.toUpperCase(),
      fmtDate(r.issueDate),
      fmtDate(r.expirationDate),
      r.passportNumber,
      r.rank,
      r.remark,
    ])
  }

  // Passenger rows (fill empty to MIN_ROWS)
  for (let i = 0; i < passengerSlots; i++) {
    if (i < passengers.length) {
      const r = passengers[i]
      body.push([
        String(r.seq),
        r.lastName.toUpperCase(),
        r.firstName.toUpperCase(),
        fmtDate(r.dateOfBirth),
        r.placeOfBirth.toUpperCase(),
        r.nationality.toUpperCase(),
        fmtDate(r.issueDate),
        fmtDate(r.expirationDate),
        r.passportNumber,
        r.rank,
        r.remark,
      ])
    } else {
      body.push([String(i + 1), '', '', '', '', '', '', '', '', 'Passenger', ''])
    }
  }

  // Create landscape A4 PDF
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  // Title
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text('CREW AND PASSENGER LIST', 14, 15)

  // Table
  autoTable(doc, {
    startY: 20,
    head: headers,
    body: body,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 7,
      cellPadding: 1.5,
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
      textColor: [0, 0, 0],
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'normal',
      fontSize: 7,
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { cellWidth: 8 },   // #
      1: { cellWidth: 28 },  // Last Name
      2: { cellWidth: 25 },  // First Name
      3: { cellWidth: 22 },  // DOB
      4: { cellWidth: 30 },  // Place of birth
      5: { cellWidth: 25 },  // Nationality
      6: { cellWidth: 22 },  // Issue Date
      7: { cellWidth: 22 },  // Expiration Date
      8: { cellWidth: 25 },  // Passport nr
      9: { cellWidth: 25 },  // Rank
      10: { cellWidth: 25 }, // Remarks
    },
    margin: { left: 14, right: 14 },
  })

  // Footer text
  const finalY = (doc as any).lastAutoTable?.finalY ?? 180
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  const footerLines = [
    'In adherence to article 15 (1) (a)(b)(c)(d) and article 15 (2) of the Toelatingsbesluit,',
    'The Captain or his/her Representative must present to the Immigration Officer all information',
    'pertaining to all persons onboard the vessel without delay.',
    'This also includes persons disembarking and or embarking the vessel.',
  ]
  footerLines.forEach((line, i) => {
    doc.text(line, 14, finalY + 5 + i * 4)
  })

  // Save — triggers download on mobile Safari
  const fileName = `Crew and Passenger List${boatName ? ' - ' + boatName : ''}.pdf`
  doc.save(fileName)
}
