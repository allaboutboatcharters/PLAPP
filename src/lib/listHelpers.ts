import type { Crew, ListRow, PassportScan } from '../db/dexie'

/** Convert a Crew record to a ListRow for the passenger list. */
export function crewToRow(c: Crew, rank: string): ListRow {
  return {
    seq: 0, rank, remark: c.remark || 'SXM',
    lastName: c.lastName, firstName: c.firstName, dateOfBirth: c.dateOfBirth,
    placeOfBirth: c.placeOfBirth, nationality: c.nationality,
    issueDate: c.issueDate, expirationDate: c.expirationDate, passportNumber: c.passportNumber
  }
}

/** Convert a PassportScan to a ListRow for the passenger list. */
export function scanToRow(s: PassportScan): ListRow {
  const e = s.extracted
  return {
    seq: 0, rank: 'Passenger', remark: s.remark,
    lastName: e.lastName, firstName: e.firstName, dateOfBirth: e.dateOfBirth,
    placeOfBirth: e.placeOfBirth, nationality: e.nationality,
    issueDate: e.issueDate, expirationDate: e.expirationDate, passportNumber: e.passportNumber
  }
}

/** Deep-clone a ListRow array stripping Vue reactivity. */
export function cloneRows(rows: ListRow[]): ListRow[] {
  return rows.map(r => ({
    seq: r.seq, rank: r.rank, remark: r.remark,
    lastName: r.lastName, firstName: r.firstName, dateOfBirth: r.dateOfBirth,
    placeOfBirth: r.placeOfBirth, nationality: r.nationality,
    issueDate: r.issueDate, expirationDate: r.expirationDate, passportNumber: r.passportNumber
  }))
}
