<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useStandingsStore } from '@/stores'
import type { TeamChampionshipEntry } from '@/types'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'
import ErrorBoundary from '@/components/ui/ErrorBoundary.vue'
import DriverAvatar from '@/components/ui/DriverAvatar.vue'

const props = defineProps<{
  standings: TeamChampionshipEntry[]
  isLoading: boolean
  error: string | null
  limit?: number
  onRetry?: () => void
  showDrivers?: boolean
}>()

const standingsStore = useStandingsStore()
const { riderStandings } = storeToRefs(standingsStore)

onMounted(() => {
  if (props.showDrivers && riderStandings.value.length === 0) {
    void standingsStore.fetchRiderStandings()
  }
})

function ridersForTeam(teamName: string) {
  return riderStandings.value
    .filter((d) => d.team_name === teamName)
    .sort((a: { position: number }, b: { position: number }) => a.position - b.position)
}

function podiumRing(position: number): string {
  if (position === 1) return 'ring-2 ring-amber-400/50'
  if (position === 2) return 'ring-2 ring-gray-400/60'
  if (position === 3) return 'ring-2 ring-amber-700/40'
  return ''
}
</script>

<template>
  <div>
    <SkeletonLoader v-if="isLoading" :rows="limit ?? 10" />
    <ErrorBoundary v-else-if="error" :message="error" :on-retry="onRetry" />
    <div v-else class="space-y-2">
      <div
        v-for="entry in (props.limit ? props.standings.slice(0, props.limit) : props.standings)"
        :key="entry.team_name"
        :class="['card overflow-hidden transition-colors duration-300', podiumRing(entry.position)]"
      >
        <RouterLink
          :to="`/teams/${encodeURIComponent(entry.team_name)}`"
          class="flex items-center gap-4 p-4 hover:bg-MotoGP-light-surface-2 dark:hover:bg-MotoGP-surface-2 transition-colors"
        >
          <span class="text-xl font-bold tabular-nums text-gray-300 dark:text-gray-600 w-6 text-center">{{ entry.position }}</span>
          <div class="w-3 h-10 rounded-sm" :style="{ backgroundColor: `#${entry.team_colour}` }" />
          <div class="flex-1 min-w-0">
            <p class="text-gray-900 dark:text-white font-semibold text-sm truncate">{{ entry.team_name }}</p>
            <p class="text-gray-400 dark:text-gray-500 text-xs">{{ entry.wins ?? '-' }} برد</p>
          </div>
          <p class="text-gray-900 dark:text-white font-bold tabular-nums text-lg">{{ entry.points }}</p>
        </RouterLink>

        <div
          v-if="showDrivers && ridersForTeam(entry.team_name).length > 0"
          class="border-t border-MotoGP-light-border dark:border-MotoGP-border divide-y divide-MotoGP-light-border dark:divide-MotoGP-border"
        >
          <RouterLink
            v-for="rider in ridersForTeam(entry.team_name)"
            :key="rider.rider_number"
            :to="`/drivers/${rider.rider_number}`"
            class="flex items-center gap-3 px-4 py-2.5 hover:bg-MotoGP-light-surface-2 dark:hover:bg-MotoGP-surface-2 transition-colors"
          >
            <span class="w-6 flex-shrink-0" />
            <DriverAvatar :src="rider.headshot_url" :name="rider.full_name" :team-colour="rider.team_colour" size-class="w-7 h-7" text-class="text-[10px]" />
            <span class="text-gray-700 dark:text-gray-300 text-sm flex-1 min-w-0 truncate">{{ rider.full_name }}</span>
            <span class="text-gray-400 dark:text-gray-500 text-xs tabular-nums">{{ rider.points }} امتیاز</span>
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>
