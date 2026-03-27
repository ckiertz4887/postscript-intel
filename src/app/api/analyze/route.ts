/**
 * API Route: POST /api/analyze
 *
 * This is a Next.js "Route Handler." When our frontend sends a POST
 * request to /api/analyze, this function runs on the server (not in
 * the user's browser). That's important because:
 *
 * 1. Browsers can't fetch other websites directly (CORS blocks it)
 * 2. We don't want to expose our scraping logic to the client
 * 3. Server-side fetching is faster and more reliable
 */

import { NextRequest, NextResponse } from "next/server";
import { analyzeStore } from "@/lib/detector";
import { AnalyzeResponse } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { urls } = body;

    // Validate input
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: "Please provide an array of URLs to analyze" },
        { status: 400 }
      );
    }

    if (urls.length > 25) {
      return NextResponse.json(
        { error: "Maximum 25 URLs per request" },
        { status: 400 }
      );
    }

    // Analyze all URLs concurrently (but with a concurrency limit
    // to avoid overwhelming the server or getting rate-limited)
    const BATCH_SIZE = 5;
    const results = [];

    for (let i = 0; i < urls.length; i += BATCH_SIZE) {
      const batch = urls.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map((url: string) => analyzeStore(url.trim()))
      );
      results.push(...batchResults);
    }

    // Build summary stats
    const successful = results.filter((r) => r.status === "success").length;
    const shopifyCount = results.filter(
      (r) => r.platform?.name === "Shopify"
    ).length;
    const hasPostscript = results.filter((r) =>
      r.smsMarketing.some((t) => t.name === "Postscript")
    ).length;
    const hotLeads = results.filter(
      (r) => r.postscriptFit.score === "hot"
    ).length;

    const response: AnalyzeResponse = {
      results,
      summary: {
        total: results.length,
        successful,
        shopifyCount,
        hasPostscript,
        hotLeads,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "Internal server error during analysis" },
      { status: 500 }
    );
  }
}
