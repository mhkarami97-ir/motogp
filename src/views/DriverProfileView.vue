<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useStandingsStore, useSessionsStore } from '@/stores'
import { getSeasonRiderMap } from '@/composables/useDriverLookup'
import type { Rider } from '@/types'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'
import ErrorBoundary from '@/components/ui/ErrorBoundary.vue'
import DriverAvatar from '@/components/ui/DriverAvatar.vue'

const route = useRoute()
const riderNumber = Number(route.params.number)

const rider = ref<Rider | null>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)

const sessionsStore = useSessionsStore()
const standingsStore = useStandingsStore()
const { riderStandings } = storeToRefs(standingsStore)

const standing = computed(() => riderStandings.value.find((d) => d.rider_number === riderNumber) ?? null)

async function load(): Promise<void> {
  isLoading.value = true
  error.value = null
  try {
    if (sessionsStore.events.length === 0) await sessionsStore.fetchCalendar()
    const riderMap = await getSeasonRiderMap()
    rider.value = riderMap.get(riderNumber) ?? null
    if (riderStandings.value.length === 0) await standingsStore.fetchRiderStandings()
  } catch {
    error.value = 'اطلاعات راکب در دسترس نیست'
  } finally {
    isLoading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div>
    <SkeletonLoader v-if="isLoading" :rows="6" height="h-16" />
    <ErrorBoundary v-else-if="error || !rider" :message="error ?? 'راکب پیدا نشد'" :on-retry="load" />
    <div v-else class="space-y-6">
      <div
        class="stripe-top relative overflow-hidden rounded-2xl border border-f1-light-border dark:border-f1-border p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start"
        :style="{ background: `linear-gradient(135deg, #${rider.team_colour}14, transparent)` }"
      >
        <div class="absolute top-0 left-0 w-56 h-56 rounded-full blur-3xl opacity-20" :style="{ backgroundColor: `#${rider.team_colour}` }" />
        <DriverAvatar :src="rider.headshot_url" :name="rider.full_name" :team-colour="rider.team_colour" size-class="relative w-32 h-32" round-class="rounded-2xl" text-class="text-4xl" />
        <div class="relative">
          <div class="flex items-center gap-3 mb-2">
            <h1 class="text-3xl font-black text-gray-900 dark:text-white">{{ rider.full_name }}</h1>
            <span class="text-5xl font-black tabular-nums text-gray-200 dark:text-gray-700">#{{ rider.rider_number }}</span>
          </div>
          <div class="inline-block px-3 py-1 rounded-full text-sm font-medium mb-2" :style="{ backgroundColor: `#${rider.team_colour}20`, color: `#${rider.team_colour}` }">
            {{ rider.team_name }}
          </div>
        </div>
      </div>

      <div v-if="standing" class="grid grid-cols-3 gap-4">
        <div class="card p-4 text-center">
          <p class="text-gray-400 dark:text-gray-500 text-xs mb-1">رتبه فصل</p>
          <p class="text-gray-900 dark:text-white text-2xl font-bold tabular-nums">{{ standing.position }}</p>
        </div>
        <div class="card p-4 text-center">
          <p class="text-gray-400 dark:text-gray-500 text-xs mb-1">امتیاز</p>
          <p class="text-gray-900 dark:text-white text-2xl font-bold tabular-nums">{{ standing.points }}</p>
        </div>
        <div class="card p-4 text-center">
          <p class="text-gray-400 dark:text-gray-500 text-xs mb-1">برد</p>
          <p class="text-gray-900 dark:text-white text-2xl font-bold tabular-nums">{{ standing.wins ?? '-' }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
