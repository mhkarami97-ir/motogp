import { PulseliveRepository } from '@/repository'
import { useSessionsStore } from '@/stores'
import type { Rider } from '@/types'

const repo = new PulseliveRepository()

let cachedMap: Map<number, Rider> | null = null
let cachedPromise: Promise<Map<number, Rider>> | null = null

/**
 * The MotoGP API only exposes a rider roster at SEASON level
 * (Broadcast API's /riders is current-season-only; historical seasons
 * come from /teams keyed by seasonYear). There is no per-event/session
 * roster endpoint, so this simply fetches the current season's riders
 * once and caches the result in-memory for the lifetime of the app.
 */
export async function getSeasonRiderMap(forceRefresh = false): Promise<Map<number, Rider>> {
  if (cachedMap && !forceRefresh) return cachedMap
  if (cachedPromise && !forceRefresh) return cachedPromise

  const sessionsStore = useSessionsStore()
  if (sessionsStore.events.length === 0) await sessionsStore.fetchCalendar()

  cachedPromise = (async () => {
    const seasonId = sessionsStore.currentSeasonId
    const riders = seasonId ? await repo.getRiders(seasonId) : []

    const map = new Map<number, Rider>()
    for (const rider of riders) {
      map.set(rider.rider_number, rider)
    }

    cachedMap = map
    return map
  })()

  return cachedPromise
}