<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useStandingsStore } from '@/stores'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'
import ErrorBoundary from '@/components/ui/ErrorBoundary.vue'
import DriverAvatar from '@/components/ui/DriverAvatar.vue'

const route = useRoute()
const riderNumber = Number(route.params.number)

const standingsStore = useStandingsStore()
const { riderStandings, isLoadingRiders, riderError } = storeToRefs(standingsStore)

// از داده‌ی جدول امتیازات (که تأیید شده کار می‌کند) استفاده می‌کنیم،
// نه از یک Endpoint جداگانه‌ی تأییدنشده (/teams) که قبلاً کرش می‌داد.
const standing = computed(() => riderStandings.value.find((d) => d.rider_number === riderNumber) ?? null)

async function load(): Promise<void> {
  if (riderStandings.value.length === 0) {
    await standingsStore.fetchRiderStandings()
  }
}

onMounted(load)
</script>

<template>
  <div>
    <SkeletonLoader v-if="isLoadingRiders" :rows="6" height="h-16" />
    <ErrorBoundary v-else-if="riderError || !standing" :message="riderError ?? 'راکب پیدا نشد'" :on-retry="load" />
    <div v-else class="space-y-6">
      <div
        class="stripe-top relative overflow-hidden rounded-2xl border border-MotoGP-light-border dark:border-MotoGP-border p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start"
        :style="{ background: `linear-gradient(135deg, #${standing.team_colour}14, transparent)` }"
      >
        <div class="absolute top-0 left-0 w-56 h-56 rounded-full blur-3xl opacity-20" :style="{ backgroundColor: `#${standing.team_colour}` }" />
        <DriverAvatar
          :src="standing.headshot_url"
          :name="standing.full_name"
          :team-colour="standing.team_colour"
          size-class="relative w-32 h-32"
          round-class="rounded-2xl"
          text-class="text-4xl"
        />
        <div class="relative">
          <div class="flex items-center gap-3 mb-2">
            <h1 class="text-3xl font-black text-gray-900 dark:text-white">{{ standing.full_name }}</h1>
            <span class="text-5xl font-black tabular-nums text-gray-200 dark:text-gray-700">#{{ standing.rider_number }}</span>
          </div>
          <div
            class="inline-block px-3 py-1 rounded-full text-sm font-medium mb-2"
            :style="{ backgroundColor: `#${standing.team_colour}20`, color: `#${standing.team_colour}` }"
          >
            {{ standing.team_name }}
          </div>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-4">
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