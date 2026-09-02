<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterLink } from 'vue-router'
import { useSessionsStore } from '@/stores'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'
import ErrorBoundary from '@/components/ui/ErrorBoundary.vue'

const store = useSessionsStore()
const { meetings, isLoading, error } = storeToRefs(store)

onMounted(() => void store.fetchCalendar())

function isCompleted(dateStr: string): boolean {
  return new Date(dateStr) < new Date()
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(dateStr))
}

function findEvent(meetingKey: string) {
  return store.events.find((e) => e.id === meetingKey || e.shortName === meetingKey) ?? null
}

function meetingEventId(meetingKey: string): string | null {
  return findEvent(meetingKey)?.id ?? null
}

// تست‌های فصل (مثل SEPANG TEST) هیچ سشن مسابقه‌ی رسمی (RAC) ندارند،
// پس لینک به صفحه‌ی جزئیات مسابقه برایشان همیشه خالی می‌ماند — به‌جای
// آن، همین‌جا با یک برچسب مجزا نشانشان می‌دهیم و لینک نمی‌کنیم.
function isTestMeeting(meetingKey: string): boolean {
  return findEvent(meetingKey)?.isTest === true
}

function statusLabel(meetingKey: string, dateStr: string): string {
  if (isTestMeeting(meetingKey)) return 'تست فصل'
  return isCompleted(dateStr) ? 'برگزار شده' : 'پیش رو'
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-3">
      <span class="w-1.5 h-7 rounded-full bg-MotoGP-red" />
      تقویم مسابقات {{ new Date().getFullYear() }}
    </h1>
    <SkeletonLoader v-if="isLoading" :rows="10" height="h-20" />
    <ErrorBoundary v-else-if="error" :message="error" :on-retry="store.fetchCalendar" />
    <div v-else class="space-y-3">
      <component
        v-for="(meeting, index) in meetings"
        :key="meeting.meeting_key"
        :is="meetingEventId(meeting.meeting_key) && !isTestMeeting(meeting.meeting_key) ? RouterLink : 'div'"
        :to="meetingEventId(meeting.meeting_key) && !isTestMeeting(meeting.meeting_key) ? `/race/${meetingEventId(meeting.meeting_key)}` : undefined"
        :class="[
          'flex items-center gap-4 p-5 rounded-2xl border transition-all duration-300',
          isTestMeeting(meeting.meeting_key)
            ? 'bg-MotoGP-light-surface dark:bg-MotoGP-dark border-MotoGP-light-border dark:border-MotoGP-border opacity-50 cursor-default'
            : isCompleted(meeting.date_start)
              ? 'bg-MotoGP-light-surface dark:bg-MotoGP-dark border-MotoGP-light-border dark:border-MotoGP-border opacity-60'
              : 'card-hover border-MotoGP-light-border dark:border-MotoGP-border',
        ]"
      >
        <span class="text-3xl font-black tabular-nums text-gray-300 dark:text-gray-700 w-8 text-center">{{ index + 1 }}</span>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <h3 class="text-gray-900 dark:text-white font-semibold truncate">{{ meeting.meeting_official_name }}</h3>
            <span
              :class="[
                'text-xs px-2 py-0.5 rounded-full font-medium',
                isTestMeeting(meeting.meeting_key)
                  ? 'bg-MotoGP-gold/15 text-MotoGP-gold'
                  : isCompleted(meeting.date_start)
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    : 'bg-MotoGP-red/15 text-MotoGP-red',
              ]"
            >
              {{ statusLabel(meeting.meeting_key, meeting.date_start) }}
            </span>
          </div>
          <p class="text-gray-500 dark:text-gray-400 text-sm">{{ meeting.circuit_short_name }} — {{ meeting.country_name }}</p>
        </div>
        <p class="text-gray-500 dark:text-gray-400 text-sm tabular-nums text-left flex-shrink-0">{{ formatDate(meeting.date_start) }}</p>
      </component>
    </div>
  </div>
</template>