export const DASHBOARD_ITEM_SEARCH_LIMIT = 12;

export type ItemSearchCandidate = {
  household_id: string;
  id: string;
  nazwa: string;
};

export type ItemSearchLocationPath = {
  kind: "complete" | "missing" | "partial";
  path: string | null;
};

export type DashboardItemSearchResult = {
  id: string;
  location: ItemSearchLocationPath;
  name: string;
};

export type DashboardItemSearchResponse =
  | { kind: "empty" }
  | { kind: "error" }
  | { kind: "success"; query: string; results: DashboardItemSearchResult[] };

export type DashboardItemSearchView =
  | "error"
  | "initial"
  | "loading"
  | "no-results"
  | "results";

const MAX_QUERY_LENGTH = 100;

export function normalizeItemSearchQuery(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, MAX_QUERY_LENGTH);
}

export function getItemNameSearchQuery(query: string) {
  return normalizeItemSearchQuery(query).replace(/[%_]/g, "").trim();
}

export function filterItemSearchCandidates(
  candidates: ItemSearchCandidate[],
  householdId: string,
  query: string,
) {
  const normalizedQuery = getItemNameSearchQuery(query).toLocaleLowerCase();

  if (!normalizedQuery) {
    return [];
  }

  return candidates.filter(
    (candidate) =>
      candidate.household_id === householdId &&
      candidate.nazwa.toLocaleLowerCase().includes(normalizedQuery),
  );
}

export function buildItemSearchLocationPath({
  positionName,
  roomName,
  storageName,
}: {
  positionName?: string | null;
  roomName?: string | null;
  storageName?: string | null;
}): ItemSearchLocationPath {
  const segments = [roomName, storageName, positionName].flatMap((name) => {
    const trimmedName = name?.trim();

    return trimmedName ? [trimmedName] : [];
  });

  if (!segments.length) {
    return { kind: "missing", path: null };
  }

  return {
    kind: segments.length === 3 ? "complete" : "partial",
    path: segments.join(" / "),
  };
}

export function resolveDashboardItemSearchView({
  isLoading,
  response,
}: {
  isLoading: boolean;
  response: DashboardItemSearchResponse | null;
}): DashboardItemSearchView {
  if (isLoading) {
    return "loading";
  }

  if (!response || response.kind === "empty") {
    return "initial";
  }

  if (response.kind === "error") {
    return "error";
  }

  return response.results.length ? "results" : "no-results";
}
