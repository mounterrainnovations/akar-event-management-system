import { NextResponse } from "next/server";
import { getWorkById } from "@/lib/works/service";
import { getLogger } from "@/lib/logger";

const logger = getLogger("api-works-id");

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const params = await props.params;
    const work = await getWorkById(params.id);

    if (!work || !work.isPublished) {
      return NextResponse.json({ error: "Work not found" }, { status: 404 });
    }

    return NextResponse.json(work, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    logger.error("Failed to fetch work", { error });
    return NextResponse.json(
      { error: "Failed to fetch work" },
      { status: 500 },
    );
  }
}
