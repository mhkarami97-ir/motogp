import { httpClient } from "@/services/httpClient";
import { withCache, CACHE_TTL } from "@/services/cache";
import type { IMotoGPRepository } from "./IMotoGPRepository";
import type {
  Rider,
  Event,
  Meeting,
  RaceResult,
  StartingGridEntry,
  RiderChampionshipRaw,
  TeamChampionshipRaw,
} from "@/types";
import { resolveRiderPhotoUrl } from "@/data/riderPhotos";

/**
 * Base address confirmed by two independent community docs:
 * https://github.com/robschmitt/MotoGP-API
 * https://github.com/micheleberardi/racingmike_motogp_import
 *
 * IMPORTANT: this is a reverse-engineered, unofficial API (not published by
 * Dorna/MotoGP). It exposes two independent sub-systems with DIFFERENT
 * category UUIDs for the same "MotoGP" class:
 *  - Broadcast API  -> base path: /            (e.g. /riders, /events, /teams)
 *  - Results API    -> base path: /results     (e.g. /results/seasons, /results/standings)
 *
 * httpClient's baseURL MUST be: https://api.motogp.pulselive.com/motogp/v1
 */

interface CategoryRaw {
  id: string;
  name: string;
  legacy_id: number;
}

interface SeasonRaw {
  id: string;
  name: string | null;
  year: number;
  current: boolean;
}

interface SessionRaw {
  id: string;
  type: string; // e.g. 'RAC' for race, 'Q1'/'Q2' for qualifying — UNVERIFIED, confirm via DevTools
  date: string;
  category: CategoryRaw;
  status: string;
}

/** UNVERIFIED raw event shape — confirm exact field names via DevTools before relying on them in production. */
interface EventApiRaw {
  id: string;
  name?: string;
  sponsored_name?: string;
  short_name?: string;
  date_start?: string;
  date_end?: string;
  status?: string;
  circuit?: { name?: string; nation?: string };
  country?: { name?: string; iso?: string };
}

interface ClassificationResponse {
  classification: RaceResult[];
  file: string | null;
  xmlFile?: string | null;
}

interface StandingsResponse<T> {
  classification: T[];
  file: string | null;
  xmlFile?: string | null;
}

interface SeasonSummary {
  id: string;
  year: number;
  name: string;
}

function mapStatus(
  status: string | undefined,
  dateStart: string,
  dateEnd: string,
): Event["status"] {
  if (status === "CANCELLED") return "Cancelled";
  const now = Date.now();
  if (dateEnd && new Date(dateEnd).getTime() < now) return "Finished";
  if (dateStart && new Date(dateStart).getTime() > now) return "Upcoming";
  return "InProgress";
}

function mapEventRaw(raw: EventApiRaw): Event {
  const dateStart = raw.date_start ?? "";
  const dateEnd = raw.date_end ?? dateStart;

  return {
    id: raw.id,
    name: raw.sponsored_name ?? raw.name ?? raw.short_name ?? "",
    shortName: raw.short_name,
    dateStart,
    dateEnd,
    status: mapStatus(raw.status, dateStart, dateEnd),
    isCancelled: raw.status === "CANCELLED",
    circuit: raw.circuit
      ? { name: raw.circuit.name ?? "", nation: raw.circuit.nation }
      : undefined,
    country: raw.country
      ? { name: raw.country.name ?? "", iso: raw.country.iso ?? "" }
      : undefined,
  };
}

/**
 * Resolves and caches the two independent category UUID spaces
 * (Broadcast vs Results) so callers never have to think about them.
 */
class CategoryResolver {
  private readonly resultsCategoryCache = new Map<string, string>();
  private readonly broadcastCategoryCache = new Map<number, string>();

  public async resolveForResultsApi(
    seasonUuid: string,
    categoryName: string = "MotoGP",
    ttlMs: number = CACHE_TTL.CALENDAR_MAX,
  ): Promise<string> {
    const cacheKey = `${seasonUuid}:${categoryName}`;
    const cached = this.resultsCategoryCache.get(cacheKey);
    if (cached) return cached;

    const categories = await withCache(
      `results-categories:${seasonUuid}`,
      async () => {
        const { data } = await httpClient.get<CategoryRaw[]>(
          "/results/categories",
          {
            params: { seasonUuid },
          },
        );
        return data;
      },
      ttlMs,
    );

    const match = categories.find(
      (c) => c.name.replace(/™/g, "") === categoryName,
    );
    if (!match)
      throw new Error(
        `Results API category "${categoryName}" not found for season ${seasonUuid}`,
      );

    this.resultsCategoryCache.set(cacheKey, match.id);
    return match.id;
  }

  public async resolveForBroadcastApi(
    seasonYear: number,
    categoryName: string = "MotoGP",
    ttlMs: number = CACHE_TTL.CALENDAR_MAX,
  ): Promise<string> {
    const cacheKey = seasonYear;
    const cached = this.broadcastCategoryCache.get(cacheKey);
    if (cached) return cached;

    const categories = await withCache(
      `broadcast-categories:${seasonYear}`,
      async () => {
        const { data } = await httpClient.get<CategoryRaw[]>("/categories", {
          params: { seasonYear },
        });
        return data;
      },
      ttlMs,
    );

    const match = categories.find((c) => c.name === categoryName);
    if (!match)
      throw new Error(
        `Broadcast API category "${categoryName}" not found for ${seasonYear}`,
      );

    this.broadcastCategoryCache.set(cacheKey, match.id);
    return match.id;
  }
}

export class PulseliveRepository implements IMotoGPRepository {
  private readonly categories = new CategoryResolver();

  public async getSeasons(
    ttlMs: number = CACHE_TTL.CALENDAR_MAX,
  ): Promise<SeasonSummary[]> {
    return withCache(
      "seasons",
      async () => {
        const { data } = await httpClient.get<SeasonRaw[]>("/results/seasons");
        return data.map((s) => ({
          id: s.id,
          year: s.year,
          name: s.name ?? `Season ${s.year}`,
        }));
      },
      ttlMs,
    );
  }

  private async getSeasonByYear(
    year: number,
    ttlMs: number,
  ): Promise<SeasonSummary | null> {
    const seasons = await this.getSeasons(ttlMs);
    return seasons.find((s) => s.year === year) ?? null;
  }

  public async getRiders(
    seasonId: string,
    ttlMs: number = CACHE_TTL.HISTORICAL,
  ): Promise<Rider[]> {
    return withCache(
      `riders:${seasonId}`,
      async () => {
        const seasons = await this.getSeasons(ttlMs);
        const season = seasons.find((s) => s.id === seasonId);
        if (!season) return [];

        const broadcastCategoryId =
          await this.categories.resolveForBroadcastApi(
            season.year,
            "MotoGP",
            ttlMs,
          );
        const { data: teams } = await httpClient.get<{ riders: Rider[] }[]>(
          "/teams",
          {
            params: {
              categoryUuid: broadcastCategoryId,
              seasonYear: season.year,
            },
          },
        );

        return teams
          .flatMap((team) => team.riders)
          .map((rider) => ({
            ...rider,
            headshot_url:
              rider.headshot_url ?? resolveRiderPhotoUrl(rider.full_name),
          }));
      },
      ttlMs,
    );
  }

  public async getEvents(
    seasonId: string,
    ttlMs: number = CACHE_TTL.CALENDAR_MAX,
  ): Promise<Event[]> {
    return withCache(
      `events:${seasonId}`,
      async () => {
        const { data } = await httpClient.get<EventApiRaw[]>(
          "/results/events",
          {
            params: { seasonUuid: seasonId },
          },
        );
        return data.map(mapEventRaw);
      },
      ttlMs,
    );
  }

  public async getMeetings(
    year: number,
    ttlMs: number = CACHE_TTL.CALENDAR_MAX,
  ): Promise<Meeting[]> {
    return withCache(
      `meetings:${year}`,
      async () => {
        const season = await this.getSeasonByYear(year, ttlMs);
        if (!season) return [];

        const events = await this.getEvents(season.id, ttlMs);
        return events.map(
          (e) =>
            ({
              meeting_key: e.id,
              meeting_name: e.name,
              meeting_official_name: e.name,
              location: e.circuit?.name ?? "",
              country_name: e.country?.name ?? "",
              country_code: e.country?.iso ?? "",
              circuit_short_name: e.circuit?.name ?? "",
              date_start: e.dateStart,
              gmt_offset: "+00:00",
              year,
            }) satisfies Meeting,
        );
      },
      ttlMs,
    );
  }

  public async getEventById(
    eventId: string,
    ttlMs: number = CACHE_TTL.CALENDAR_MAX,
  ): Promise<Event | null> {
    return withCache(
      `event:${eventId}`,
      async () => {
        // Single-event lookup only exists on the Broadcast API, not Results API.
        const { data } = await httpClient.get<EventApiRaw>(
          `/events/${eventId}`,
        );
        return data ? mapEventRaw(data) : null;
      },
      ttlMs,
    );
  }

  public async getRaceResults(
    seasonId: string,
    eventId: string,
    ttlMs: number = CACHE_TTL.HISTORICAL,
  ): Promise<RaceResult[]> {
    return withCache(
      `results:${seasonId}:${eventId}`,
      async () => {
        const categoryId = await this.categories.resolveForResultsApi(
          seasonId,
          "MotoGP",
          ttlMs,
        );

        const { data: sessions } = await httpClient.get<SessionRaw[]>(
          "/results/sessions",
          {
            params: { eventUuid: eventId, categoryUuid: categoryId },
          },
        );
        const raceSession = sessions.find((s) => s.type === "RAC");
        if (!raceSession) return [];

        const { data } = await httpClient.get<ClassificationResponse>(
          `/results/session/${raceSession.id}/classification`,
        );
        return data.classification;
      },
      ttlMs,
    );
  }

  public async getStartingGrid(
    seasonId: string,
    eventId: string,
    ttlMs: number = CACHE_TTL.HISTORICAL,
  ): Promise<StartingGridEntry[]> {
    return withCache(
      `grid:${seasonId}:${eventId}`,
      async () => {
        const categoryId = await this.categories.resolveForResultsApi(
          seasonId,
          "MotoGP",
          ttlMs,
        );
        const { data } = await httpClient.get<StartingGridEntry[]>(
          `/results/event/${eventId}/category/${categoryId}/grid`,
        );
        return data;
      },
      ttlMs,
    );
  }

  public async getRiderChampionship(
    year: number,
  ): Promise<RiderChampionshipRaw[]> {
    return withCache(
      `standing:rider:${year}`,
      async () => {
        const season = await this.getSeasonByYear(year, CACHE_TTL.CALENDAR_MAX);
        if (!season) return [];

        const categoryId = await this.categories.resolveForResultsApi(
          season.id,
          "MotoGP",
          CACHE_TTL.CALENDAR_MAX,
        );
        const { data } = await httpClient.get<
          StandingsResponse<RiderChampionshipRaw>
        >("/results/standings", {
          params: { seasonUuid: season.id, categoryUuid: categoryId },
        });
        return data.classification;
      },
      CACHE_TTL.HISTORICAL,
    );
  }

  public async getTeamChampionship(
    year: number,
  ): Promise<TeamChampionshipRaw[]> {
    // NOTE: no public docs confirm a dedicated team-standings endpoint/shape.
    // VERIFY this against the actual network calls made by
    // motogp.com/en/gp-results-archive before relying on it in production.
    return withCache(
      `standing:team:${year}`,
      async () => {
        const season = await this.getSeasonByYear(year, CACHE_TTL.CALENDAR_MAX);
        if (!season) return [];

        const categoryId = await this.categories.resolveForResultsApi(
          season.id,
          "MotoGP",
          CACHE_TTL.CALENDAR_MAX,
        );
        const { data } = await httpClient.get<
          StandingsResponse<TeamChampionshipRaw>
        >("/results/standings", {
          params: {
            seasonUuid: season.id,
            categoryUuid: categoryId,
            standing: "team",
          },
        });
        return data.classification;
      },
      CACHE_TTL.HISTORICAL,
    );
  }
}
