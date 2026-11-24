<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useSessionsStore, useReminderStore } from '@/stores'

const store = useSessionsStore()
const reminderStore = useReminderStore()
const { nextMeeting } = storeToRefs(store)

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(dateStr))
}
</script>

<template>
  <div v-if="nextMeeting" class="card relative overflow-hidden p-6">
    <div class="checkered-corner absolute top-3 left-3 w-8 h-8 rounded opacity-40" />
    <div class="flex items-start justify-between gap-4 mb-4">
      <h3 class="text-gray-400 dark:text-gray-500 text-xs font-semibold uppercase tracking-widest">
        مسابقه بعدی
      </h3>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-xl border border-MotoGP-light-border bg-MotoGP-light-surface-2 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:border-MotoGP-red hover:text-MotoGP-red dark:border-MotoGP-border dark:bg-MotoGP-surface dark:text-gray-200 dark:hover:text-MotoGP-red"
        @click="reminderStore.openModal"
      >
        <span>🔔</span>
        <span>{{ reminderStore.linked ? 'یادآور فعال است' : 'یادآوری در تلگرام' }}</span>
        <span v-if="reminderStore.linked" class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
      </button>
    </div>
    <h2 class="text-gray-900 dark:text-white text-xl font-bold mb-1">{{ nextMeeting.meeting_official_name }}</h2>
    <p class="text-gray-500 dark:text-gray-400 text-sm mb-1">{{ nextMeeting.circuit_short_name }}</p>
    <p class="text-gray-400 dark:text-gray-500 text-xs mb-4">{{ nextMeeting.country_name }}</p>
    <p class="text-MotoGP-red text-sm font-semibold tabular-nums">{{ formatDate(nextMeeting.date_start) }}</p>
  </div>
</template>