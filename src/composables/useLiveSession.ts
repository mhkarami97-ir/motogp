import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSessionsStore } from '@/stores'

/**
 * Exposes whether an event is currently live.
 */
export function useLiveSession() {
  const store = useSessionsStore()
  const { isLive, currentEvent } = storeToRefs(store)

  return {
    isLive: computed(() => isLive.value),
    activeSession: computed(() => currentEvent.value),
  }
}
