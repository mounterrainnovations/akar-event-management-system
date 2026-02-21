import { NextResponse } from "next/server";
import { listWorks } from "@/lib/works/service";
import { getLogger } from "@/lib/logger";

const logger = getLogger("api-works");

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryQuery = searchParams.get("category");

    // Validate category or pass undefined
    const category =
      categoryQuery === "upcoming" ||
      categoryQuery === "past" ||
      categoryQuery === "article"
        ? categoryQuery
        : undefined;

    // By default, public API should only fetch published works (no drafts)
    const works = await listWorks({ category, includeDrafts: false });

    return NextResponse.json(works, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    logger.error("Failed to fetch works", { error });
    return NextResponse.json(
      { error: "Failed to fetch works" },
      { status: 500 },
    );
  }
}
