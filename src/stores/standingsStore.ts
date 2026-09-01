import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { PulseliveRepository } from '@/repository'
import { useSessionsStore } from './sessionsStore'
import type { RiderChampionshipEntry, TeamChampionshipEntry } from '@/types'

const repo = new PulseliveRepository()
const CURRENT_YEAR = new Date().getFullYear()

export const useStandingsStore = defineStore('standings', () => {
  const riderStandings = ref<RiderChampionshipEntry[]>([])
  const teamStandings = ref<TeamChampionshipEntry[]>([])
  const isLoadingRiders = ref(false)
  const isLoadingTeams = ref(false)
  const riderError = ref<string | null>(null)
  const teamError = ref<string | null>(null)

  const topFiveRiders = computed(() => riderStandings.value.slice(0, 5))
  const topFiveTeams = computed(() => teamStandings.value.slice(0, 5))

  async function fetchRiderStandings(): Promise<void> {
    isLoadingRiders.value = true
    riderError.value = null
    try {
      const sessionsStore = useSessionsStore()
      if (sessionsStore.events.length === 0) await sessionsStore.fetchCalendar()

      const raw = await repo.getRiderChampionship(CURRENT_YEAR)

      riderStandings.value = raw
        .map((entry) => ({
          position: entry.position_current,
          rider_number: entry.rider_number,
          broadcast_name: entry.rider?.nameAcronym ?? `#${entry.rider_number}`,
          full_name: entry.rider?.fullName ?? `#${entry.rider_number}`,
          name_acronym: entry.rider?.nameAcronym ?? '',
          team_name: entry.team?.name ?? '',
          team_colour: entry.team?.color ?? '666666',
          headshot_url: null,
          points: entry.points_current,
          wins: null,
        } satisfies RiderChampionshipEntry))
        .sort((a, b) => a.position - b.position)
    } catch {
      riderError.value = 'داده جدول راکبان در دسترس نیست'
    } finally {
      isLoadingRiders.value = false
    }
  }

  async function fetchTeamStandings(): Promise<void> {
    isLoadingTeams.value = true
    teamError.value = null
    try {
      const raw = await repo.getTeamChampionship(CURRENT_YEAR)

      teamStandings.value = raw
        .map((entry) => ({
          position: entry.position_current,
          team_name: entry.team_name,
          team_colour: entry.team_colour ?? '666666',
          points: entry.points_current,
          wins: null,
        } satisfies TeamChampionshipEntry))
        .sort((a, b) => a.position - b.position)
    } catch {
      teamError.value = 'داده جدول تیم‌ها در دسترس نیست'
    } finally {
      isLoadingTeams.value = false
    }
  }

  return {
    riderStandings,
    teamStandings,
    isLoadingRiders,
    isLoadingTeams,
    riderError,
    teamError,
    topFiveRiders,
    topFiveTeams,
    fetchRiderStandings,
    fetchTeamStandings,
  }
})
