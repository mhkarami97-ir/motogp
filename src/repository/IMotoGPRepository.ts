import type {
  Rider,
  Event,
  Meeting,
  RaceResult,
  StartingGridEntry,
  RiderChampionshipRaw,
  TeamChampionshipRaw,
} from '@/types'

export interface IMotoGPRepository {
  getRiders(seasonId: string, ttlMs?: number): Promise<Rider[]>
  getSeasons(ttlMs?: number): Promise<{ id: string; year: number; name: string }[]>
  getEvents(seasonId: string, ttlMs?: number): Promise<Event[]>
  getMeetings(year: number, ttlMs?: number): Promise<Meeting[]>
  getEventById(eventId: string, ttlMs?: number): Promise<Event | null>
  getRaceResults(seasonId: string, eventId: string, ttlMs?: number): Promise<RaceResult[]>
  getStartingGrid(seasonId: string, eventId: string, ttlMs?: number): Promise<StartingGridEntry[]>
  getRiderChampionship(year: number): Promise<RiderChampionshipRaw[]>
  getTeamChampionship(year: number): Promise<TeamChampionshipRaw[]>
}
