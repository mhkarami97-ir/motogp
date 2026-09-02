<script setup lang="ts">
// PitStop data is not available in the MotoGP Pulselive API — component kept as placeholder
interface PitStopEntry { rider_number: number; lap_number: number; stop_duration: number | null }
interface RiderEntry { rider_number: number; full_name: string }

const props = defineProps<{ pitStops: PitStopEntry[]; riders: RiderEntry[] }>()

function riderName(num: number): string {
  return props.riders.find((d) => d.rider_number === num)?.full_name ?? String(num)
}

function formatDuration(dur: number | null): string {
  return dur === null ? '—' : `${dur.toFixed(2)}s`
}
</script>

<template>
  <div v-if="pitStops.length > 0" class="card overflow-hidden">
    <table class="w-full">
      <thead class="bg-MotoGP-light-surface-2 dark:bg-MotoGP-surface-2">
        <tr>
          <th class="px-4 py-3 text-right text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">راکب</th>
          <th class="px-4 py-3 text-right text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">دور</th>
          <th class="px-4 py-3 text-right text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">مدت توقف</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-MotoGP-light-border dark:divide-MotoGP-border">
        <tr
          v-for="pit in pitStops"
          :key="`${pit.rider_number}-${pit.lap_number}`"
          class="bg-MotoGP-light-surface dark:bg-MotoGP-surface hover:bg-MotoGP-light-surface-2 dark:hover:bg-MotoGP-surface-2 transition-colors"
        >
          <td class="px-4 py-3 text-gray-700 dark:text-gray-300 text-sm font-medium">{{ riderName(pit.rider_number) }}</td>
          <td class="px-4 py-3 text-gray-700 dark:text-gray-300 tabular-nums">{{ pit.lap_number }}</td>
          <td class="px-4 py-3 text-MotoGP-red font-semibold tabular-nums">{{ formatDuration(pit.stop_duration) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
