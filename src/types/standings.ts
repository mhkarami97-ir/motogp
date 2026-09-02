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

export interface RiderChampionshipRaw {
  position: number
  points: number
  session?: string
  rider: RiderRef
  team?: TeamRef
  constructor?: ConstructorRef
}

/**
 * UNVERIFIED: no public sample of a dedicated team/constructor standings
 * payload was found in any source checked. Confirm this shape against the
 * real network response (motogp.com/en/gp-results-archive -> constructor
 * standings) before trusting it.
 */
export interface TeamChampionshipRaw {
  position: number
  points: number
  team: TeamRef
}

export interface RiderChampionshipEntry {
  position: number
  rider_number: number
  broadcast_name: string
  full_name: string
  name_acronym: string
  team_name: string
  team_colour: string
  headshot_url: string | null
  points: number
  wins: number | null
}

export interface TeamChampionshipEntry {
  position: number
  team_name: string
  team_colour: string
  points: number
  wins: number | null
}

function buildAcronym(fullName: string): string {
  return fullName
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 3)
}

/**
 * Raw -> UI entry mapper for rider standings. Centralized here so
 * standingsStore.ts never has to know about the API's nested shape.
 */
export function mapRiderChampionshipRaw(raw: RiderChampionshipRaw): RiderChampionshipEntry {
  return {
    position: raw.position,
    rider_number: raw.rider.number,
    broadcast_name: raw.rider.full_name,
    full_name: raw.rider.full_name,
    name_acronym: buildAcronym(raw.rider.full_name),
    team_name: raw.team?.name ?? '',
    // team_colour is NOT provided by this endpoint — falls back to a
    // neutral grey until a static team-color lookup table is added.
    team_colour: '666666',
    headshot_url: null,
    points: raw.points,
    wins: null,
  }
}

export function mapTeamChampionshipRaw(raw: TeamChampionshipRaw): TeamChampionshipEntry {
  return {
    position: raw.position,
    team_name: raw.team.name,
    team_colour: '666666',
    points: raw.points,
    wins: null,
  }
}