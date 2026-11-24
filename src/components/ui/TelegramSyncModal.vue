<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useReminderStore, useSessionsStore } from '@/stores'
import type { MotoGPRaceSyncPayload } from '@/stores/reminderStore'

const reminderStore = useReminderStore()
const sessionsStore = useSessionsStore()

let pollTimer: ReturnType<typeof setInterval> | null = null
const copied = ref(false)

const formattedNextRace = computed(() => {
  const meeting = sessionsStore.nextMeeting
  if (!meeting) return null
  return {
    name: meeting.meeting_name,
    circuit: meeting.circuit_short_name,
    country: meeting.country_name,
    date: meeting.date_start,
  }
})

function formatDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function getRacesPayload(): MotoGPRaceSyncPayload[] {
  return sessionsStore.meetings.map((m) => {
    return {
      eventId: m.meeting_key,
      eventName: m.meeting_name,
      circuitName: m.circuit_short_name,
      countryName: m.country_name,
      raceStart: m.date_start,
      year: m.year,
    }
  })
}

function startPolling(): void {
  stopPolling()
  pollTimer = setInterval(async () => {
    if (reminderStore.modalOpen && !reminderStore.linked) {
      await reminderStore.checkStatus()
    }
  }, 2500)
}

function stopPolling(): void {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

async function handleSyncRaces(): Promise<void> {
  const payload = getRacesPayload()
  if (payload.length > 0) {
    await reminderStore.syncRaces(payload)
  }
}

watch(
  () => reminderStore.modalOpen,
  (open) => {
    if (open) {
      void reminderStore.checkStatus()
      startPolling()
      const payload = getRacesPayload()
      if (payload.length > 0) {
        void reminderStore.syncRaces(payload)
      }
    } else {
      stopPolling()
    }
  },
)

watch(
  () => reminderStore.linked,
  (linked) => {
    if (linked) {
      stopPolling()
      void handleSyncRaces()
    }
  },
)

onMounted(() => {
  void reminderStore.init()
  if (reminderStore.modalOpen) startPolling()
})

onBeforeUnmount(() => {
  stopPolling()
})

async function copyLinkCode(): Promise<void> {
  try {
    await navigator.clipboard.writeText(reminderStore.linkCode)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    // clipboard not accessible
  }
}
</script>

<template>
  <teleport to="body">
    <transition name="modal-fade">
      <div
        v-if="reminderStore.modalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        @click.self="reminderStore.closeModal"
      >
        <div
          class="relative w-full max-w-lg rounded-2xl border border-MotoGP-light-border bg-MotoGP-light-surface p-6 shadow-2xl transition-all dark:border-MotoGP-border dark:bg-MotoGP-dark text-gray-900 dark:text-gray-100"
          role="dialog"
          aria-modal="true"
        >
          <!-- Header -->
          <div class="flex items-center justify-between border-b border-MotoGP-light-border pb-4 dark:border-MotoGP-border">
            <div class="flex items-center gap-2">
              <span class="text-2xl" aria-hidden="true">🏍️</span>
              <h3 class="text-lg font-bold">یادآور مسابقات موتو جی‌پی در تلگرام</h3>
            </div>
            <button
              type="button"
              class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-MotoGP-surface dark:hover:text-white"
              aria-label="بستن"
              @click="reminderStore.closeModal"
            >
              ✕
            </button>
          </div>

          <!-- Body -->
          <div class="mt-5 space-y-4 text-sm leading-relaxed">
            <template v-if="reminderStore.linked">
              <div class="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-700 dark:text-emerald-400">
                <div class="flex items-center gap-2 font-bold">
                  <span>✅</span>
                  <span>اتصال با موفقیت برقرار است</span>
                </div>
                <p v-if="reminderStore.username" class="mt-1 text-xs">
                  شناسه تلگرام: <b class="font-mono" dir="ltr">@{{ reminderStore.username }}</b>
                </p>
              </div>

              <div class="rounded-xl border border-MotoGP-light-border bg-MotoGP-light-surface-2 p-4 dark:border-MotoGP-border dark:bg-MotoGP-surface">
                <p class="font-medium text-gray-800 dark:text-gray-200">
                  🔔 <b>وضعیت یادآوری فصل:</b>
                </p>
                <p class="mt-1 text-xs text-gray-600 dark:text-gray-400">
                  تمامی مسابقات فصل ذخیره شده‌اند و ۲۴ ساعت و ۱ ساعت پیش از شروع هر گرندپری، پیام یادآوری دریافت خواهید کرد.
                </p>
                <div v-if="formattedNextRace" class="mt-3 border-t border-MotoGP-light-border pt-2 dark:border-MotoGP-border text-xs">
                  <span class="text-gray-500 dark:text-gray-400">مسابقه پیش‌رو:</span>
                  <div class="font-bold text-MotoGP-red mt-0.5">
                    {{ formattedNextRace.name }} - {{ formattedNextRace.circuit }}
                  </div>
                  <div class="text-gray-500 dark:text-gray-400 mt-0.5">
                    {{ formatDateTime(formattedNextRace.date) }}
                  </div>
                </div>
              </div>

              <div class="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  class="rounded-xl border border-MotoGP-light-border px-4 py-2 text-xs font-medium text-gray-600 hover:border-MotoGP-red hover:text-MotoGP-red dark:border-MotoGP-border dark:text-gray-400 dark:hover:text-MotoGP-red"
                  :disabled="reminderStore.loading"
                  @click="handleSyncRaces"
                >
                  🔄 به‌روزرسانی لیست مسابقات
                </button>
                <button
                  type="button"
                  class="rounded-xl bg-red-600/10 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-600/20 dark:text-red-400"
                  :disabled="reminderStore.loading"
                  @click="reminderStore.unlink"
                >
                  قطع اتصال بات
                </button>
              </div>
            </template>

            <template v-else>
              <p class="text-gray-600 dark:text-gray-300">
                با اتصال بات تلگرام، برای <b>تمامی مسابقات گرندپری موتو جی‌پی فصل</b> به‌صورت خودکار یادآور دریافت کنید:
              </p>

              <ul class="space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
                <li class="flex items-center gap-2">
                  <span class="text-MotoGP-red">•</span>
                  <span><b>۱ روز قبل از مسابقه</b> (برای اطلاع از زمان‌بندی روز بعد)</span>
                </li>
                <li class="flex items-center gap-2">
                  <span class="text-MotoGP-red">•</span>
                  <span><b>۱ ساعت قبل از شروع</b> (برای آماده‌شدن و تماشای مسابقه)</span>
                </li>
                <li class="flex items-center gap-2">
                  <span class="text-MotoGP-red">•</span>
                  <span>دستور <code class="rounded bg-gray-100 px-1 py-0.5 dark:bg-MotoGP-surface font-mono">/motogp</code> در بات برای مشاهده تقویم و زمان مسابقه بعدی</span>
                </li>
              </ul>

              <div class="mt-4 flex flex-col items-center gap-3 rounded-xl border border-MotoGP-light-border bg-MotoGP-light-surface-2 p-4 text-center dark:border-MotoGP-border dark:bg-MotoGP-surface">
                <a
                  v-if="reminderStore.telegramBotUrl"
                  :href="reminderStore.telegramBotUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-MotoGP-red px-6 py-3 font-bold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-95"
                >
                  <svg class="h-5 w-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                  </svg>
                  اتصال به بات تلگرام
                </a>

                <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span class="inline-block h-2 w-2 animate-ping rounded-full bg-emerald-500"></span>
                  <span>در انتظار اتصال در بات تلگرام...</span>
                </div>

                <div class="text-[11px] text-gray-400">
                  یا کد اتصال <code class="font-mono text-gray-700 dark:text-gray-300">{{ reminderStore.linkCode }}</code> را پس از دستور <code class="font-mono">/start</code> بفرستید:
                  <button
                    type="button"
                    class="mr-1 text-MotoGP-red underline hover:opacity-80"
                    @click="copyLinkCode"
                  >
                    {{ copied ? 'کپی شد!' : 'کپی کد' }}
                  </button>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
