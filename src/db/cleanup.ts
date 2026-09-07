import { db } from './dexie'

export const SEVENTY_TWO_HOURS = 72 * 60 * 60 * 1000

/**
 * Удаляет сканы паспортов старше 72 часов (вместе с блобами).
 * passengerLists НЕ трогаются никогда — данные уже зафиксированы снимком.
 * Вызывается при старте и на visibilitychange (у iOS нет фоновых задач).
 */
export async function cleanupExpiredScans(now = Date.now()): Promise<number> {
  const expired = await db.passportScans.where('expiresAt').below(now).primaryKeys()
  if (expired.length) {
    await db.passportScans.bulkDelete(expired)
  }
  return expired.length
}

/** «Эффективный» фильтр: скан считается живым, только если не истёк. */
export function isScanLive(expiresAt: number, now = Date.now()): boolean {
  return expiresAt > now
}

export function installCleanupHooks(): void {
  void cleanupExpiredScans()
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void cleanupExpiredScans()
  })
}
