export interface RiderChampionshipRaw {
  position_current: number
  rider_number: number
  points_current: number
  rider?: { fullName: string; nameAcronym: string; country?: { iso: string } }
  team?: { name: string; color?: string }
}

export interface TeamChampionshipRaw {
  position_current: number
  team_name: string
  points_current: number
  team_colour?: string
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
