import { resolveRiderPhotoUrl } from '@/data/riderPhotos'
import { resolveTeamColor } from '@/data/teamColors'

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

function normalizeColor(rawColor: string | undefined, teamName: string): string {
  const cleaned = rawColor?.replace(/^#/, '').trim()
  const isValidHex = cleaned && /^[0-9a-fA-F]{6}$/.test(cleaned)
  return isValidHex ? cleaned : resolveTeamColor(teamName)
}

export function mapRiderChampionshipRaw(raw: RiderChampionshipRaw): RiderChampionshipEntry {
  const teamName = raw.team?.name ?? ''
  return {
    position: raw.position,
    rider_number: raw.rider.number,
    broadcast_name: raw.rider.full_name,
    full_name: raw.rider.full_name,
    name_acronym: buildAcronym(raw.rider.full_name),
    team_name: teamName,
    team_colour: normalizeColor(raw.team?.color, teamName),
    headshot_url: resolveRiderPhotoUrl(raw.rider.full_name),
    points: raw.points,
    wins: null,
  }
}

export function mapTeamChampionshipRaw(raw: TeamChampionshipRaw): TeamChampionshipEntry {
  return {
    position: raw.position,
    team_name: raw.team.name,
    team_colour: normalizeColor(raw.team.color, raw.team.name),
    points: raw.points,
    wins: null,
  }
}