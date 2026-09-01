import { PulseliveRepository } from '@/repository'
import { useSessionsStore } from '@/stores'
import type { Rider } from '@/types'

const repo = new PulseliveRepository()
const MAX_RACES_FOR_RIDER_LOOKUP = 5

let cachedMap: Map<number, Rider> | null = null
let cachedPromise: Promise<Map<number, Rider>> | null = null

/**
 * Some riders (reserve/substitute appearances, single-race absences)
 * don't show up in the very latest race's /riders roster even though they
 * still have a standings entry. Merging rider info across the last few
 * finished races (most recent appearance wins on conflict) makes
 * headshots/names/profile lookups resolve correctly for those riders
 * instead of showing blank fields or "rider not found".
 */
export async function getSeasonRiderMap(forceRefresh = false): Promise<Map<number, Rider>> {
  if (cachedMap && !forceRefresh) return cachedMap
  if (cachedPromise && !forceRefresh) return cachedPromise

  const sessionsStore = useSessionsStore()
  if (sessionsStore.events.length === 0) await sessionsStore.fetchCalendar()

  const finishedRaces = sessionsStore.raceEvents
    .filter((e) => new Date(e.dateEnd) < new Date())
    .sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime())
    .slice(-MAX_RACES_FOR_RIDER_LOOKUP)

  cachedPromise = (async () => {
    const map = new Map<number, Rider>()
    for (const event of finishedRaces) {
      const eventRiders = await repo.getRiders(event.id)
      for (const rider of eventRiders) {
        map.set(rider.rider_number, rider)
      }
    }
    cachedMap = map
    return map
  })()

  return cachedPromise
}
