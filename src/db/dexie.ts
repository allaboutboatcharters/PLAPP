import Dexie, { type Table } from 'dexie'

export type CrewRole = 'captain' | 'assistant'
export type ScanStatus = 'pending' | 'ready' | 'error'

/** Восемь полей, извлекаемых из паспорта Claude vision. */
export interface ExtractedPassport {
  lastName: string
  firstName: string
  dateOfBirth: string // DD.MM.YYYY (внутреннее хранение)
  placeOfBirth: string
  nationality: string
  issueDate: string // DD.MM.YYYY
  expirationDate: string // DD.MM.YYYY
  passportNumber: string
}

export interface Settings {
  id: number // singleton = 1
  apiKey: string
  model: string
  crewRemarkDefault: string // 'SXM'
  filenamePrefix: string // 'Crew and Passenger List'
  storagePersisted: boolean
}

export interface Boat {
  id?: number
  name: string
  sortOrder: number
  active: boolean
}

export interface Crew extends ExtractedPassport {
  id?: number
  role: CrewRole
  remark: string // 'SXM'
  active: boolean
  sortOrder: number
}

export interface PassportScan {
  id?: number
  boatId: number
  capturedAt: number // epoch ms
  expiresAt: number // capturedAt + 72h
  imageBlob: Blob
  status: ScanStatus
  errorMsg?: string
  extracted: ExtractedPassport
  remark: string // жильё пассажира, правится
  usedInListId: number | null
}

/** Снимок строки для сохранённого списка (чтобы список был неизменяем). */
export interface ListRow extends ExtractedPassport {
  seq: number
  rank: string // CAPTAIN | CREW | Passenger
  remark: string
}

export interface PassengerList {
  id?: number
  boatId: number
  boatName: string
  date: string // YYYY-MM-DD
  createdAt: number
  captainId: number | null
  assistantId: number | null
  crewRows: ListRow[]
  passengers: ListRow[]
  crewCount: number
  passengerCount: number
  fileName: string
  xlsxBlob: Blob
}

export class PlappDB extends Dexie {
  settings!: Table<Settings, number>
  boats!: Table<Boat, number>
  crew!: Table<Crew, number>
  passportScans!: Table<PassportScan, number>
  passengerLists!: Table<PassengerList, number>

  constructor() {
    super('plapp')
    this.version(1).stores({
      settings: 'id',
      boats: '++id, sortOrder, active',
      crew: '++id, role, active, sortOrder',
      passportScans: '++id, boatId, status, expiresAt, usedInListId',
      passengerLists: '++id, boatId, date, createdAt'
    })
  }
}

export const db = new PlappDB()

export const SETTINGS_ID = 1

export async function getSettings(): Promise<Settings> {
  let s = await db.settings.get(SETTINGS_ID)
  if (!s) {
    s = {
      id: SETTINGS_ID,
      apiKey: '',
      model: 'claude-sonnet-5',
      crewRemarkDefault: 'SXM',
      filenamePrefix: 'Crew and Passenger List',
      storagePersisted: false
    }
    await db.settings.put(s)
  }
  return s
}
