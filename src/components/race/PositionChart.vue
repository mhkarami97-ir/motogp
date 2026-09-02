<script setup lang="ts">
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import type { ApexOptions } from 'apexcharts'
import type { RaceResult } from '@/types'

const props = defineProps<{ results: RaceResult[] }>()

const series = computed(() => [
  {
    name: 'پوزیشن پایانی',
    data: [...props.results]
      .sort((a, b) => a.position - b.position)
      .map((r) => ({ x: r.rider.full_name, y: r.position })),
  },
])

const options = computed<ApexOptions>(() => ({
  chart: { type: 'bar', background: 'transparent', toolbar: { show: false } },
  plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
  xaxis: { title: { text: 'پوزیشن' }, reversed: true },
  yaxis: { labels: { style: { fontFamily: 'inherit' } } },
  tooltip: { theme: 'dark' },
  colors: ['#C90909'],
}))
</script>

<template>
  <section v-if="results.length > 0">
    <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
      <span class="w-1 h-5 rounded-full bg-MotoGP-red" />
      نمودار پوزیشن
    </h2>
    <div class="card p-4">
      <VueApexCharts type="bar" :options="options" :series="series" height="320" />
    </div>
  </section>
</template>