<script setup lang="ts">
import { useRiderStandings } from '@/composables'
import DriverTable from '@/components/standings/DriverTable.vue'

const { standings, isLoading, error, retry } = useRiderStandings()
</script>

<template>
  <div>
    <h1 class="text-2xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-3">
      <span class="w-1.5 h-7 rounded-full bg-MotoGP-red" />
      جدول امتیازات راکبان
    </h1>
    <DriverTable :standings="standings" :is-loading="isLoading" :error="error" :on-retry="retry" />
  </div>
</template>
