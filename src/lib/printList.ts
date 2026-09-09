import type { ListRow } from '../db/dexie'
import { parseInternalDate } from './formatters'

function fmtDate(s: string): string {
  const p = parseInternalDate(s)
  if (!p) return s
  return `${String(p.d).padStart(2, '0')}/${String(p.m).padStart(2, '0')}/${p.y}`
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * Print the Crew & Passenger List via a hidden iframe.
 * Works on iOS Safari without losing the current page.
 */
export function printList(_boatName: string, crewRows: ListRow[], passengers: ListRow[]) {
  const MIN_ROWS = 10
  const passengerSlots = Math.max(passengers.length, MIN_ROWS)

  function row(r: ListRow): string {
    return `<tr>
      <td>${r.seq}</td>
      <td>${esc(r.lastName.toUpperCase())}</td>
      <td>${esc(r.firstName.toUpperCase())}</td>
      <td>${fmtDate(r.dateOfBirth)}</td>
      <td>${esc(r.placeOfBirth.toUpperCase())}</td>
      <td>${esc(r.nationality.toUpperCase())}</td>
      <td>${fmtDate(r.issueDate)}</td>
      <td>${fmtDate(r.expirationDate)}</td>
      <td>${esc(r.passportNumber)}</td>
      <td>${esc(r.rank)}</td>
      <td>${esc(r.remark)}</td>
    </tr>`
  }

  function emptyRow(seq: number): string {
    return `<tr>
      <td>${seq}</td>
      <td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>
      <td>Passenger</td><td></td>
    </tr>`
  }

  const crewHtml = crewRows.map(row).join('\n')
  const passHtml = Array.from({ length: passengerSlots }, (_, i) =>
    i < passengers.length ? row(passengers[i]) : emptyRow(i + 1)
  ).join('\n')

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Crew and Passenger List</title>
<style>
  @page { size: landscape; margin: 10mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; }
  h1 { font-family: Impact, Arial Black, sans-serif; font-size: 28pt; font-weight: normal;
       margin: 0 0 4px 0; }
  table { border-collapse: collapse; width: 100%; }
  th { font-family: 'Times New Roman', Times, serif; font-size: 10pt; font-weight: normal;
       text-align: left; padding: 3px 5px; }
  td { font-size: 10pt; padding: 3px 5px; border: 1px solid #000; }
  tr:first-child td { border-top: 2px solid #000; }
  tr:last-child td { border-bottom: 2px solid #000; }
  td:first-child { border-left: 2px solid #000; }
  td:last-child { border-right: 2px solid #000; }
  .footer { font-size: 10pt; margin-top: 6px; }
</style></head><body>
<h1>CREW AND PASSENGER LIST</h1>
<table>
  <thead><tr>
    <th></th><th>Last Name</th><th>First Name</th><th>Date of birth</th>
    <th>Place of birth</th><th>Nationality</th><th>Issue Date</th>
    <th>Expiration Date</th><th>Pasp nr.</th><th>Rank</th><th>Remarks</th>
  </tr></thead>
  <tbody>
    ${crewHtml}
    ${passHtml}
  </tbody>
</table>
<div class="footer">
  <p>In adherence to article 15 (1) (a)(b)(c)(d) and article 15 (2) of the Toelatingsbesluit,</p>
  <p>The Captain or his/her Representative must present to the Immigration Officer all information pertaining to all persons onboard the vessel without delay.</p>
  <p>This also includes persons disembarking and or embarking the vessel.</p>
</div>
</body></html>`

  // Remove any previous print iframe
  const old = document.getElementById('plapp-print-frame')
  if (old) old.remove()

  const iframe = document.createElement('iframe')
  iframe.id = 'plapp-print-frame'
  iframe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;border:none;visibility:hidden;'
  document.body.appendChild(iframe)

  const doc = iframe.contentDocument || iframe.contentWindow?.document
  if (!doc) { alert('Cannot open print view'); return }

  doc.open()
  doc.write(html)
  doc.close()

  // Wait for content to render, then print
  setTimeout(() => {
    iframe.contentWindow?.print()
    // Clean up after print dialog closes
    setTimeout(() => iframe.remove(), 1000)
  }, 300)
}
