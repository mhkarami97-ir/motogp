<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useConstructorStandings } from '@/composables'
import { useStandingsStore } from '@/stores'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'
import ErrorBoundary from '@/components/ui/ErrorBoundary.vue'
import DriverAvatar from '@/components/ui/DriverAvatar.vue'
import { RouterLink } from 'vue-router'

const route = useRoute()
const teamName = decodeURIComponent(route.params.name as string)

const { standings, isLoading, error, retry } = useConstructorStandings()

const standingsStore = useStandingsStore()
const { riderStandings } = storeToRefs(standingsStore)

const team = computed(
  () => standings.value.find((entry) => entry.team_name === teamName) ?? null,
)

const teamRiders = computed(() =>
  riderStandings.value
    .filter((rider) => rider.team_name === teamName)
    .sort((a, b) => a.position - b.position),
)

function riderPath(riderNumber: number): string {
  return `/drivers/${riderNumber}`
}
</script>

<template>
  <div class="space-y-6">
    <SkeletonLoader v-if="isLoading" :rows="5" height="h-16" />

    <ErrorBoundary
      v-else-if="error || !team"
      :message="error ?? 'تیم پیدا نشد'"
      :on-retry="retry"
    />

    <template v-else>
      <section
        class="stripe-top relative overflow-hidden rounded-2xl border border-f1-light-border dark:border-f1-border p-6 md:p-8"
        :style="{ background: `linear-gradient(135deg, #${team.team_colour}20, transparent 65%)` }"
      >
        <div
          class="absolute -top-16 -left-16 h-64 w-64 rounded-full blur-3xl opacity-20"
          :style="{ backgroundColor: `#${team.team_colour}` }"
        />
        <div class="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <div
            class="h-20 w-4 flex-shrink-0 rounded-full shadow-lg"
            :style="{ backgroundColor: `#${team.team_colour}`, boxShadow: `0 0 28px #${team.team_colour}80` }"
          />
          <div class="min-w-0">
            <p class="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-f1-red">سازنده موتوجی‌پی</p>
            <h1 class="truncate text-3xl font-black text-gray-900 dark:text-white md:text-4xl">{{ team.team_name }}</h1>
            <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">راکبان و آمار فصل جاری</p>
          </div>
        </div>
      </section>

      <div class="grid grid-cols-2 gap-4">
        <div class="card p-4 text-center">
          <p class="text-gray-400 dark:text-gray-500 text-xs mb-1">رتبه سازنده</p>
          <p class="text-gray-900 dark:text-white text-2xl font-bold tabular-nums">{{ team.position }}</p>
        </div>
        <div class="card p-4 text-center">
          <p class="text-gray-400 dark:text-gray-500 text-xs mb-1">امتیاز</p>
          <p class="text-gray-900 dark:text-white text-2xl font-bold tabular-nums">{{ team.points }}</p>
        </div>
      </div>

      <section v-if="teamRiders.length > 0">
        <h2 class="text-lg font-bold text-gray-900 dark:text-white mb-3">راکبان تیم</h2>
        <div class="space-y-2">
          <RouterLink
            v-for="rider in teamRiders"
            :key="rider.rider_number"
            :to="riderPath(rider.rider_number)"
            class="card-hover flex items-center gap-3 p-4"
          >
            <DriverAvatar :src="rider.headshot_url" :name="rider.full_name" :team-colour="rider.team_colour" size-class="w-10 h-10" text-class="text-sm" />
            <div class="flex-1 min-w-0">
              <p class="text-gray-900 dark:text-white font-semibold text-sm truncate">{{ rider.full_name }}</p>
              <p class="text-gray-400 dark:text-gray-500 text-xs">رتبه {{ rider.position }}</p>
            </div>
            <p class="text-gray-900 dark:text-white font-bold tabular-nums">{{ rider.points }}</p>
          </RouterLink>
        </div>
      </section>
    </template>
  </div>
</template>
