import { httpClient } from '@/services/httpClient'
import { withCache, CACHE_TTL } from '@/services/cache'
import type { IMotoGPRepository } from './IMotoGPRepository'
import type {
  Rider,
  Event,
  Meeting,
  RaceResult,
  StartingGridEntry,
  RiderChampionshipRaw,
  TeamChampionshipRaw,
} from '@/types'

export class PulseliveRepository implements IMotoGPRepository {
  async getRiders(seasonId: string, ttlMs: number = CACHE_TTL.HISTORICAL): Promise<Rider[]> {
    return withCache(`riders:${seasonId}`, async () => {
      const { data } = await httpClient.get<Rider[]>('/riders', { params: { season: seasonId } })
      return data
    }, ttlMs)
  }

  async getSeasons(ttlMs: number = CACHE_TTL.CALENDAR_MAX): Promise<{ id: string; year: number; name: string }[]> {
    return withCache('seasons', async () => {
      const { data } = await httpClient.get<{ id: string; year: number; name: string }[]>('/seasons')
      return data
    }, ttlMs)
  }

  async getEvents(seasonId: string, ttlMs: number = CACHE_TTL.CALENDAR_MAX): Promise<Event[]> {
    return withCache(`events:${seasonId}`, async () => {
      const { data } = await httpClient.get<Event[]>('/events', { params: { season: seasonId } })
      return data
    }, ttlMs)
  }

  async getMeetings(year: number, ttlMs: number = CACHE_TTL.CALENDAR_MAX): Promise<Meeting[]> {
    return withCache(`meetings:${year}`, async () => {
      const seasons = await this.getSeasons(ttlMs)
      const season = seasons.find((s) => s.year === year)
      if (!season) return []
      const events = await this.getEvents(season.id, ttlMs)
      return events.map((e) => ({
        meeting_key: e.id,
        meeting_name: e.name,
        meeting_official_name: e.name,
        location: e.circuit?.name ?? '',
        country_name: e.country?.name ?? '',
        country_code: e.country?.iso ?? '',
        circuit_short_name: e.circuit?.name ?? '',
        date_start: e.dateStart,
        gmt_offset: '+00:00',
        year,
      } satisfies Meeting))
    }, ttlMs)
  }

  async getEventById(eventId: string, ttlMs: number = CACHE_TTL.CALENDAR_MAX): Promise<Event | null> {
    return withCache(`event:${eventId}`, async () => {
      const { data } = await httpClient.get<Event>(`/events/${eventId}`)
      return data
    }, ttlMs)
  }

  async getRaceResults(seasonId: string, eventId: string, ttlMs: number = CACHE_TTL.HISTORICAL): Promise<RaceResult[]> {
    return withCache(`results:${seasonId}:${eventId}`, async () => {
      const { data } = await httpClient.get<RaceResult[]>('/results', {
        params: { season: seasonId, event: eventId, category: 'MotoGP' },
      })
      return data
    }, ttlMs)
  }

  async getStartingGrid(seasonId: string, eventId: string, ttlMs: number = CACHE_TTL.HISTORICAL): Promise<StartingGridEntry[]> {
    return withCache(`grid:${seasonId}:${eventId}`, async () => {
      const { data } = await httpClient.get<StartingGridEntry[]>('/grid', {
        params: { season: seasonId, event: eventId, category: 'MotoGP' },
      })
      return data
    }, ttlMs)
  }

  async getRiderChampionship(year: number): Promise<RiderChampionshipRaw[]> {
    return withCache(`standing:rider:${year}`, async () => {
      const { data } = await httpClient.get<RiderChampionshipRaw[]>(`/standing/seasonYear/${year}`, {
        params: { category: 'MotoGP' },
      })
      return data
    }, CACHE_TTL.HISTORICAL)
  }

  async getTeamChampionship(year: number): Promise<TeamChampionshipRaw[]> {
    return withCache(`standing:team:${year}`, async () => {
      const { data } = await httpClient.get<TeamChampionshipRaw[]>(`/standing/seasonYear/${year}`, {
        params: { category: 'MotoGP', standing: 'team' },
      })
      return data
    }, CACHE_TTL.HISTORICAL)
  }
}
