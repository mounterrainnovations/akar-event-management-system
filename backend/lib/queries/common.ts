export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 100;

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export function parsePositiveInteger(value: string | null, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error("Pagination values must be positive integers");
  }

  return parsed;
}

export function parsePaginationParams(searchParams: URLSearchParams) {
  const page = parsePositiveInteger(searchParams.get("page"), 1);
  const requestedLimit = parsePositiveInteger(
    searchParams.get("limit"),
    DEFAULT_PAGE_LIMIT,
  );

  return {
    page,
    limit: Math.min(requestedLimit, MAX_PAGE_LIMIT),
  };
}

export function rangeFromPagination(page: number, limit: number) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  return { from, to };
}
