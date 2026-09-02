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

interface RiderRef {
  full_name: string
  number: number
  country?: { iso: string; name: string }
}

interface TeamRef {
  name: string
  color?: string
}

interface ConstructorRef {
  name: string
}

/**
 * Confirmed shape of a single entry in the
 * /results/session/{id}/classification response.
 * Source: https://github.com/micheleberardi/racingmike_motogp_import
 */
export interface RaceResult {
  id?: string
  position: number
  status?: string
  rider: RiderRef
  team?: TeamRef
  constructor?: ConstructorRef
  best_lap?: { number: number; time: string }
  total_laps?: number
  top_speed?: number
  gap?: { first: string; prev: string }
}

/**
 * UNVERIFIED: no public sample of the
 * /results/event/{id}/category/{id}/grid response was found. Given the
 * rest of the Results API nests rider/team/constructor consistently, this
 * is the most likely shape — confirm against a real response before
 * relying on it in production.
 */
export interface StartingGridEntry {
  position: number
  rider: RiderRef
  team?: TeamRef
  time?: string
}