import { ref, onMounted, onUnmounted } from 'vue'
import { PulseliveRepository } from '@/repository'
import { createPollingStrategy } from '@/services'
import { CACHE_TTL } from '@/services/cache'
import type { PollingStrategy } from '@/services'
import type { RaceResult, StartingGridEntry } from '@/types'
import type { Rider } from '@/types'

const repo = new PulseliveRepository()

async function safeFetch<T>(promise: Promise<T[]>): Promise<T[]> {
  try {
    return await promise
  } catch {
    return []
  }
}

export function useRaceDetail(seasonId: string, eventId: string, isLive = false) {
  const results = ref<RaceResult[]>([])
  const grid = ref<StartingGridEntry[]>([])
  const riders = ref<Rider[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  let strategy: PollingStrategy | null = null

  const staticTtl = isLive ? CACHE_TTL.LIVE : CACHE_TTL.HISTORICAL

  async function fetchStaticData(): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      const [r, g, rd] = await Promise.all([
        safeFetch(repo.getRaceResults(seasonId, eventId, staticTtl)),
        safeFetch(repo.getStartingGrid(seasonId, eventId, staticTtl)),
        repo.getRiders(seasonId, staticTtl),
      ])
      results.value = r
      grid.value = g
      riders.value = rd
    } catch {
      error.value = 'جزئیات مسابقه در دسترس نیست'
    } finally {
      isLoading.value = false
    }
  }

  async function refreshLiveSlice(): Promise<void> {
    try {
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

  return { results, grid, riders, isLoading, error }
}
