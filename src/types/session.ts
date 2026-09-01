export type SessionType = 'Race' | 'Qualifying' | 'Sprint' | 'Practice' | 'WarmUp'

export interface Event {
  id: string
  name: string
  shortName?: string
  dateStart: string
  dateEnd: string
  status: 'Finished' | 'Upcoming' | 'InProgress' | 'Cancelled'
  isCancelled?: boolean
  circuit?: { name: string; nation?: string }
  country?: { name: string; iso: string }
  sessions?: EventSession[]
}

export interface EventSession {
  id: string
  type: SessionType
  dateStart: string
  dateEnd: string
  status: 'Finished' | 'Upcoming' | 'InProgress'
}

export interface Meeting {
  meeting_key: string
  meeting_name: string
  meeting_official_name: string
  location: string
  country_name: string
  country_code: string
  circuit_short_name: string
  date_start: string
  gmt_offset: string
  year: number
}

export interface RaceResult {
  position: number
  rider_number: number
  full_name?: string
  team_name?: string
  points?: number
  time?: string
  gap?: string
  status?: string
}

export interface StartingGridEntry {
  position: number
  rider_number: number
  full_name?: string
  team_name?: string
  time?: string
}
