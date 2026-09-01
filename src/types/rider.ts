export interface Rider {
  rider_number: number
  bike_number?: number
  broadcast_name: string
  full_name: string
  name_acronym: string
  team_name: string
  team_colour: string
  headshot_url: string | null
  country_code: string
  country_name?: string
}
