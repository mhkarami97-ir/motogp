import { ref, onMounted, onUnmounted } from 'vue'
import { PulseliveRepository } from '@/repository'
import { createPollingStrategy } from '@/services'
import { CACHE_TTL } from '@/services/cache'
import { useSessionsStore } from '@/stores'
import type { PollingStrategy } from '@/services'
import type { RaceResult, StartingGridEntry } from '@/types'

const repo = new PulseliveRepository()

async function safeFetch<T>(promise: Promise<T[]>): Promise<T[]> {
  try {
    return await promise
  } catch {
    return []
  }
}

export function useRaceDetail(eventId: string, isLive = false) {
  const results = ref<RaceResult[]>([])
  const grid = ref<StartingGridEntry[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  let strategy: PollingStrategy | null = null

  const staticTtl = isLive ? CACHE_TTL.LIVE : CACHE_TTL.HISTORICAL

  async function resolveSeasonId(): Promise<string | null> {
    const sessionsStore = useSessionsStore()
    if (!sessionsStore.currentSeasonId) {
      await sessionsStore.fetchCalendar()
    }
    return sessionsStore.currentSeasonId || null
  }

  async function fetchStaticData(): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      const seasonId = await resolveSeasonId()
      if (!seasonId) throw new Error('season not resolved')

      const [r, g] = await Promise.all([
        safeFetch(repo.getRaceResults(seasonId, eventId, staticTtl)),
        safeFetch(repo.getStartingGrid(seasonId, eventId, staticTtl)),
      ])
      results.value = r
      grid.value = g
    } catch {
      error.value = 'جزئیات مسابقه در دسترس نیست'
    } finally {
      isLoading.value = false
    }
  }

  async function refreshLiveSlice(): Promise<void> {
    try {
      const seasonId = await resolveSeasonId()
      if (!seasonId) return
      const r = await safeFetch(repo.getRaceResults(seasonId, eventId, CACHE_TTL.LIVE))
      results.value = r
    } catch {
      // silent
    }
  }

  onMounted(async () => {
    await fetchStaticData()
    strategy = createPollingStrategy(isLive)
    if (isLive) strategy.start(refreshLiveSlice)
  })

  onUnmounted(() => strategy?.stop())

  return { results, grid, isLoading, error }
}