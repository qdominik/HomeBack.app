import { normalizeTemplateValue } from "../templates/normalize-template-value";

export const HOME_SEARCH_SCOPES = [
  "all",
  "rooms",
  "storage",
  "positions",
] as const;

export type HomeSearchScope = (typeof HOME_SEARCH_SCOPES)[number];

export type HomeSearchParams = {
  q?: string | string[];
  scope?: string | string[];
};

export type HomeSearch = {
  query: string;
  scope: HomeSearchScope;
};

export type SearchablePosition = {
  id: string;
  kod_lokalizacji: string;
  nazwa: string;
};

export type SearchableStorage = {
  id: string;
  nazwa: string;
  positions: SearchablePosition[];
  typ: string;
};

export type SearchableRoom = {
  id: string;
  locations: SearchableStorage[];
  nazwa: string;
  typ: string;
};

function singleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseScope(value: string | string[] | undefined): HomeSearchScope {
  const scope = singleValue(value)?.trim();

  return HOME_SEARCH_SCOPES.includes(scope as HomeSearchScope)
    ? (scope as HomeSearchScope)
    : "all";
}

export function parseHomeSearchParams(params: HomeSearchParams): HomeSearch {
  return {
    query: (singleValue(params.q) ?? "").trim().slice(0, 100),
    scope: parseScope(params.scope),
  };
}

function matchesSearch(query: string, ...values: string[]) {
  return values.some((value) => normalizeTemplateValue(value).includes(query));
}

export function filterHomeStructure(
  rooms: SearchableRoom[],
  search: HomeSearch,
): SearchableRoom[] {
  const normalizedQuery = normalizeTemplateValue(search.query);

  if (!normalizedQuery) {
    return rooms;
  }

  return rooms.reduce<SearchableRoom[]>((results, room) => {
    const roomMatches =
      (search.scope === "all" || search.scope === "rooms") &&
      matchesSearch(normalizedQuery, room.nazwa, room.typ);

    if (roomMatches) {
      results.push(
        search.scope === "rooms" ? { ...room, locations: [] } : room,
      );
      return results;
    }

    if (search.scope === "rooms") {
      return results;
    }

    const locations = room.locations.reduce<SearchableStorage[]>(
      (locationResults, location) => {
        const locationMatches =
          (search.scope === "all" || search.scope === "storage") &&
          matchesSearch(normalizedQuery, location.nazwa, location.typ);

        if (locationMatches) {
          locationResults.push(location);
          return locationResults;
        }

        if (search.scope === "storage") {
          return locationResults;
        }

        const positions = location.positions.filter((position) =>
          matchesSearch(
            normalizedQuery,
            position.nazwa,
            position.kod_lokalizacji,
          ),
        );

        if (positions.length) {
          locationResults.push({ ...location, positions });
        }

        return locationResults;
      },
      [],
    );

    if (locations.length) {
      results.push({ ...room, locations });
    }

    return results;
  }, []);
}
