import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useStandingsStore } from '@/stores'

export function useRiderStandings() {
  const store = useStandingsStore()
  const { riderStandings, isLoadingRiders, riderError, topFiveRiders } = storeToRefs(store)

  onMounted(async () => {
    if (riderStandings.value.length === 0) {
      await store.fetchRiderStandings()
    }
  })

  return {
    standings: riderStandings,
    isLoading: isLoadingRiders,
    error: riderError,
    topFive: topFiveRiders,
    retry: store.fetchRiderStandings,
  }
}

// backward-compat alias so existing imports of useDriverStandings still work
export { useRiderStandings as useDriverStandings }
