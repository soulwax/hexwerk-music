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
    const apiUrl = env.NEXT_PUBLIC_API_URL as string | undefined;
    if (!apiUrl) {
      console.error("NEXT_PUBLIC_API_URL not configured");
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

    console.log("Fetching stream from:", url.toString().replace(env.STREAMING_KEY, '***'));

    const response = await fetch(url.toString(), {
      headers: {
        'Range': req.headers.get('Range') || '',
      },
    });

    if (!response.ok) {
      console.error(`Stream failed: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error("Error details:", errorText);
      return NextResponse.json(
        { error: `Stream failed: ${response.statusText}`, details: errorText },
        { status: response.status },
      );
    }

    const contentType = response.headers.get("content-type") ?? "audio/mpeg";
    const contentLength = response.headers.get("content-length");
    const acceptRanges = response.headers.get("accept-ranges");
    const contentRange = response.headers.get("content-range");

    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600",
    };

    if (contentLength) headers["Content-Length"] = contentLength;
    if (acceptRanges) headers["Accept-Ranges"] = acceptRanges;
    if (contentRange) headers["Content-Range"] = contentRange;

    // Stream directly instead of buffering
    return new NextResponse(response.body, {
      status: response.status,
      headers,
    });
  } catch (error) {
    console.error("Streaming error:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch stream",
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 },
    );
  }
}