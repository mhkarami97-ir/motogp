import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { PulseliveRepository } from '@/repository'
import { useSessionsStore } from './sessionsStore'
import { mapRiderChampionshipRaw, mapTeamChampionshipRaw } from '@/types/standings'
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
        .map(mapRiderChampionshipRaw)
        .sort((a, b) => a.position - b.position)
    } catch {
      riderError.value = 'جدول امتیازات راکبان در دسترس نیست'
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
        .map(mapTeamChampionshipRaw)
        .sort((a, b) => a.position - b.position)
    } catch {
      teamError.value = 'جدول امتیازات تیم‌ها در دسترس نیست'
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