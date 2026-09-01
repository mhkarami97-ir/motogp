import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { PulseliveRepository } from '@/repository'
import { readCache, writeCache, CACHE_TTL } from '@/services/cache'
import type { Meeting, Event } from '@/types'

const repo = new PulseliveRepository()
const CURRENT_YEAR = new Date().getFullYear()
const REALTIME_DATA_ENABLED = false
const CALENDAR_CACHE_KEY = `calendar:${CURRENT_YEAR}`

interface CalendarCachePayload {
  meetings: Meeting[]
  events: Event[]
  currentSeasonId: string
}

export const useSessionsStore = defineStore('sessions', () => {
  const meetings = ref<Meeting[]>([])
  const events = ref<Event[]>([])
  const currentSeasonId = ref<string>('')
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const now = () => new Date()

  const raceEvents = computed(() =>
    events.value.filter((e) => !e.isCancelled && e.status !== 'Cancelled'),
  )

  const latestFinishedRaceEvent = computed<Event | null>(() => {
    const past = raceEvents.value
      .filter((e) => new Date(e.dateEnd) < now())
      .sort((a, b) => new Date(b.dateStart).getTime() - new Date(a.dateStart).getTime())
    return past[0] ?? null
  })

  const currentEvent = computed<Event | null>(() => {
    const t = now()
    return events.value.find((e) => new Date(e.dateStart) <= t && t <= new Date(e.dateEnd)) ?? null
  })

  const isLive = computed(() => REALTIME_DATA_ENABLED && currentEvent.value !== null)

  const nextMeeting = computed<Meeting | null>(() => {
    const t = now()
    const upcoming = meetings.value
      .filter((m) => new Date(m.date_start) > t)
      .sort((a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime())
    return upcoming[0] ?? null
  })

  const pastMeetings = computed(() => {
    const t = now()
    return meetings.value.filter((m) => new Date(m.date_start) <= t).slice().reverse()
  })

  async function fetchCalendar(): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      const cached = readCache<CalendarCachePayload>(CALENDAR_CACHE_KEY)
      if (cached) {
        meetings.value = cached.meetings
        events.value = cached.events
        currentSeasonId.value = cached.currentSeasonId
        return
      }

      const seasons = await repo.getSeasons(CACHE_TTL.LIVE)
      const season = seasons.find((s) => s.year === CURRENT_YEAR) ?? seasons[seasons.length - 1]
      if (!season) throw new Error('No season found')

      currentSeasonId.value = season.id

      const [fetchedEvents, fetchedMeetings] = await Promise.all([
        repo.getEvents(season.id, CACHE_TTL.LIVE),
        repo.getMeetings(CURRENT_YEAR, CACHE_TTL.LIVE),
      ])

      events.value = fetchedEvents
      meetings.value = fetchedMeetings

      const nowMs = Date.now()
      const upcoming = fetchedMeetings
        .filter((m) => new Date(m.date_start).getTime() > nowMs)
        .sort((a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime())[0]
      const ttl = upcoming
        ? Math.min(Math.max(new Date(upcoming.date_start).getTime() - nowMs, CACHE_TTL.CALENDAR_MIN), CACHE_TTL.CALENDAR_MAX)
        : CACHE_TTL.CALENDAR_MAX

      writeCache(CALENDAR_CACHE_KEY, { meetings: fetchedMeetings, events: fetchedEvents, currentSeasonId: season.id }, ttl)
    } catch {
      error.value = 'تقویم مسابقات در دسترس نیست'
    } finally {
      isLoading.value = false
    }
  }

  return {
    meetings,
    events,
    currentSeasonId,
    isLoading,
    error,
    raceEvents,
    latestFinishedRaceEvent,
    currentEvent,
    isLive,
    nextMeeting,
    pastMeetings,
    fetchCalendar,
  }
})
