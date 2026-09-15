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
  // Build table data — only real rows, no empty padding
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

  // Passenger rows (only real data)
  for (let i = 0; i < passengers.length; i++) {
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
  }

  // Create landscape A4 PDF
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  // Title
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  const pdfTitle = boatName
    ? `CREW AND PASSENGER LIST — ${boatName.toUpperCase()}`
    : 'CREW AND PASSENGER LIST'
  doc.text(pdfTitle, 10, 12)

  // Table — compact sizing to fit up to 32 data rows on one page
  autoTable(doc, {
    startY: 16,
    head: headers,
    body: body,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 6,
      cellPadding: 1,
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
      textColor: [0, 0, 0],
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'normal',
      fontSize: 6,
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { cellWidth: 7 },   // #
      1: { cellWidth: 27 },  // Last Name
      2: { cellWidth: 24 },  // First Name
      3: { cellWidth: 21 },  // DOB
      4: { cellWidth: 28 },  // Place of birth
      5: { cellWidth: 24 },  // Nationality
      6: { cellWidth: 21 },  // Issue Date
      7: { cellWidth: 21 },  // Expiration Date
      8: { cellWidth: 24 },  // Passport nr
      9: { cellWidth: 24 },  // Rank
      10: { cellWidth: 24 }, // Remarks
    },
    margin: { left: 10, right: 10 },
  })

  // Footer text
  const finalY = (doc as any).lastAutoTable?.finalY ?? 180
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6)
  const footerLines = [
    'In adherence to article 15 (1) (a)(b)(c)(d) and article 15 (2) of the Toelatingsbesluit,',
    'The Captain or his/her Representative must present to the Immigration Officer all information',
    'pertaining to all persons onboard the vessel without delay.',
    'This also includes persons disembarking and or embarking the vessel.',
  ]
  footerLines.forEach((line, i) => {
    doc.text(line, 10, finalY + 4 + i * 3)
  })

  // Save — triggers download on mobile Safari
  const fileName = `Crew and Passenger List${boatName ? ' - ' + boatName : ''}.pdf`
  doc.save(fileName)
}
