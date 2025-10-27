// File: src/app/api/stream/route.ts

import { env } from "@/env";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const query = searchParams.get("q");
  const id = searchParams.get("id");

  if (!query && !id) {
    return NextResponse.json(
      { error: "Missing query or id parameter" },
      { status: 400 },
    );
  }

  try {
    // Build the upstream API URL with the secure key
    const apiUrl = env.NEXT_PUBLIC_API_URL as string | undefined;
    if (!apiUrl) {
      return NextResponse.json(
        { error: "API URL not configured" },
        { status: 500 },
      );
    }
    const url = new URL("music/stream", apiUrl);
    url.searchParams.set("key", env.STREAMING_KEY);

    if (query) {
      url.searchParams.set("q", query);
    }
    if (id) {
      url.searchParams.set("id", id);
    }

    // Fetch from the upstream API
    const response = await fetch(url.toString());

    if (!response.ok) {
      return NextResponse.json(
        { error: `Stream failed: ${response.statusText}` },
        { status: response.status },
      );
    }

    // Get the content type from upstream
    const contentType = response.headers.get("content-type") ?? "audio/mpeg";

    // Stream the audio data through
    const audioData = await response.arrayBuffer();

    return new NextResponse(audioData, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Streaming error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stream" },
      { status: 500 },
    );
  }
}
