import { NextResponse } from "next/server";
import { runGenerationPipeline } from "@/lib/pipeline";
import type { GenerateRequest } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<GenerateRequest>;
    if (!body || typeof body.topic !== "string") {
      return NextResponse.json(
        { error: "Invalid request. Provide a topic string." },
        { status: 400 },
      );
    }

    const result = await runGenerationPipeline({
      topic: body.topic,
      tone: body.tone,
      audience: body.audience,
      callToAction: body.callToAction,
      durationPreference: body.durationPreference,
      platforms: body.platforms,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error occurred";
    console.error("Generation error", error);
    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 },
    );
  }
}
