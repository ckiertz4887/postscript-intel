// This file defines the "shape" of data flowing through our app.
// TypeScript types don't exist at runtime — they're guardrails that
// help us catch mistakes while writing code.

/** A single detected technology (e.g., "Klaviyo" for email marketing) */
export interface DetectedTool {
  name: string;
  confidence: "high" | "medium" | "low";
  evidence: string; // What we found that told us this tool is present
}

export type ErrorCategory = "not_found" | "blocked" | "timeout" | "dns_failure" | "unknown";

/** The full analysis result for one e-commerce store */
export interface StoreAnalysis {
  url: string;
  status: "success" | "partial" | "error";
  error?: string;
  errorCategory?: ErrorCategory;
  errorSuggestion?: string;

  // Core detections
  platform: DetectedTool | null;
  emailMarketing: DetectedTool[];
  smsMarketing: DetectedTool[];
  popupTools: DetectedTool[];

  // Product intelligence
  industry: string | null;
  sampleProducts: string[];

  // Sales intelligence (the "beyond the brief" extras)
  postscriptFit: {
    score: "hot" | "warm" | "cold";
    reasons: string[];
  };

  // Metadata
  storeName: string | null;
  scrapedAt: string;
}

/** What we send to the API */
export interface AnalyzeRequest {
  urls: string[];
}

/** What the API returns */
export interface AnalyzeResponse {
  results: StoreAnalysis[];
  summary: {
    total: number;
    successful: number;
    shopifyCount: number;
    hasPostscript: number;
    hotLeads: number;
  };
}
