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
 * Print the Crew & Passenger List.
 * Injects a print overlay into the current page, calls window.print(),
 * then removes it. Works reliably on iOS Safari / PWA.
 */
export function printList(_boatName: string, crewRows: ListRow[], passengers: ListRow[]) {
  const MIN_ROWS = 10
  const passengerSlots = Math.max(passengers.length, MIN_ROWS)

  function rowHtml(r: ListRow): string {
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

  const crewHtml = crewRows.map(rowHtml).join('\n')
  const passHtml = Array.from({ length: passengerSlots }, (_, i) =>
    i < passengers.length ? rowHtml(passengers[i]) : emptyRow(i + 1)
  ).join('\n')

  // Remove previous overlay if any
  document.getElementById('plapp-print-overlay')?.remove()
  document.getElementById('plapp-print-style')?.remove()

  // Inject print-only CSS: hide everything except our overlay when printing
  const style = document.createElement('style')
  style.id = 'plapp-print-style'
  style.textContent = `
    @media print {
      body > *:not(#plapp-print-overlay) { display: none !important; }
      #plapp-print-overlay {
        display: block !important;
        position: static !important;
        background: white !important;
      }
      @page { size: landscape; margin: 8mm; }
    }
  `
  document.head.appendChild(style)

  // Create overlay div (hidden on screen, visible only in print)
  const overlay = document.createElement('div')
  overlay.id = 'plapp-print-overlay'
  overlay.style.cssText = 'display:none;'
  overlay.innerHTML = `
    <div style="font-family:Calibri,Arial,sans-serif;">
      <h1 style="font-family:Impact,'Arial Black',sans-serif;font-size:28pt;font-weight:normal;margin:0 0 4px 0;">
        CREW AND PASSENGER LIST
      </h1>
      <table style="border-collapse:collapse;width:100%;">
        <thead><tr>
          <th style="font-family:'Times New Roman',Times,serif;font-size:10pt;font-weight:normal;text-align:left;padding:3px 5px;"></th>
          <th style="font-family:'Times New Roman',Times,serif;font-size:10pt;font-weight:normal;text-align:left;padding:3px 5px;">Last Name</th>
          <th style="font-family:'Times New Roman',Times,serif;font-size:10pt;font-weight:normal;text-align:left;padding:3px 5px;">First Name</th>
          <th style="font-family:'Times New Roman',Times,serif;font-size:10pt;font-weight:normal;text-align:left;padding:3px 5px;">Date of birth</th>
          <th style="font-family:'Times New Roman',Times,serif;font-size:10pt;font-weight:normal;text-align:left;padding:3px 5px;">Place of birth</th>
          <th style="font-family:'Times New Roman',Times,serif;font-size:10pt;font-weight:normal;text-align:left;padding:3px 5px;">Nationality</th>
          <th style="font-family:'Times New Roman',Times,serif;font-size:10pt;font-weight:normal;text-align:left;padding:3px 5px;">Issue Date</th>
          <th style="font-family:'Times New Roman',Times,serif;font-size:10pt;font-weight:normal;text-align:left;padding:3px 5px;">Expiration Date</th>
          <th style="font-family:'Times New Roman',Times,serif;font-size:10pt;font-weight:normal;text-align:left;padding:3px 5px;">Pasp nr.</th>
          <th style="font-family:'Times New Roman',Times,serif;font-size:10pt;font-weight:normal;text-align:left;padding:3px 5px;">Rank</th>
          <th style="font-family:'Times New Roman',Times,serif;font-size:10pt;font-weight:normal;text-align:left;padding:3px 5px;">Remarks</th>
        </tr></thead>
        <tbody>
          ${crewHtml}
          ${passHtml}
        </tbody>
      </table>
      <div style="font-size:10pt;margin-top:6px;">
        <p>In adherence to article 15 (1) (a)(b)(c)(d) and article 15 (2) of the Toelatingsbesluit,</p>
        <p>The Captain or his/her Representative must present to the Immigration Officer all information pertaining to all persons onboard the vessel without delay.</p>
        <p>This also includes persons disembarking and or embarking the vessel.</p>
      </div>
    </div>
  `
  document.body.appendChild(overlay)

  // Apply inline border styles to all td (needed for print)
  overlay.querySelectorAll('td').forEach((td) => {
    td.setAttribute('style', 'font-size:10pt;padding:3px 5px;border:1px solid #000;')
  })
  // Thick outer borders
  const rows = overlay.querySelectorAll('tbody tr')
  rows.forEach((tr, ri) => {
    const cells = tr.querySelectorAll('td')
    cells.forEach((td, ci) => {
      const top = ri === 0 ? '2px solid #000' : '1px solid #000'
      const bottom = ri === rows.length - 1 ? '2px solid #000' : '1px solid #000'
      const left = ci === 0 ? '2px solid #000' : '1px solid #000'
      const right = ci === cells.length - 1 ? '2px solid #000' : '1px solid #000'
      td.setAttribute('style', `font-size:10pt;padding:3px 5px;border-top:${top};border-bottom:${bottom};border-left:${left};border-right:${right};`)
    })
  })

  // Print synchronously to preserve user-gesture chain (iOS Safari
  // blocks window.print() when called from setTimeout/rAF)
  window.print()

  // Clean up after print dialog closes
  setTimeout(() => {
    overlay.remove()
    style.remove()
  }, 500)
}
