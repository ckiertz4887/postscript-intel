"use client";

/**
 * Main page component.
 *
 * "use client" at the top tells Next.js this component runs in the
 * browser (not just on the server). We need this because we're using
 * React hooks (useState) for interactive state management.
 */

import { useState } from "react";
import { AnalyzeResponse, StoreAnalysis } from "@/lib/types";

// ── CSV Export Helper ─────────────────────────────────────────────
// Sales reps live in spreadsheets. This lets them export results
// to CSV for their CRM or to share with the team.
function exportToCSV(results: StoreAnalysis[]) {
  const headers = [
    "Store Name", "URL", "Status", "Platform", "Email Marketing",
    "SMS Marketing", "Popup Tools", "Industry", "Sample Products",
    "Postscript Fit", "Fit Reasons"
  ];

  const rows = results.map((r) => [
    r.storeName || "",
    r.url,
    r.status,
    r.platform?.name || "Unknown",
    r.emailMarketing.map((t) => t.name).join("; ") || "None",
    r.smsMarketing.map((t) => t.name).join("; ") || "None",
    r.popupTools.map((t) => t.name).join("; ") || "None",
    r.industry || "Unknown",
    r.sampleProducts.join("; "),
    r.postscriptFit.score.toUpperCase(),
    r.postscriptFit.reasons.join("; "),
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `postscript-intel-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Default URLs from the assignment ──────────────────────────────
const DEFAULT_URLS = `https://www.allbirds.com
https://www.gymshark.com
https://www.brooklinen.com
https://www.beardbrand.com
https://www.puravidabracelets.com
https://www.chubbiesshorts.com
https://www.shinesty.com
https://www.kettleandfire.com
https://www.mudwtr.com
https://www.graza.co
https://www.olipop.com
https://www.jonesroadbeauty.com
https://www.halfdays.com
https://www.goodr.com
https://www.bombas.com
https://www.ruggable.com
https://www.studs.com
https://www.fishwifetinnedfishco.com
https://www.hexclad.com
https://www.skullcandy.com
https://www.lululemon.com
https://www.patagonia.com`;

// ── Fit Score Badge Component ─────────────────────────────────────
function FitBadge({ score }: { score: "hot" | "warm" | "cold" }) {
  const styles = {
    hot: "bg-red-100 text-red-800 border-red-200",
    warm: "bg-amber-100 text-amber-800 border-amber-200",
    cold: "bg-blue-100 text-blue-800 border-blue-200",
  };
  const labels = {
    hot: "Hot Lead",
    warm: "Warm",
    cold: "Cold",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[score]}`}
    >
      {score === "hot" && "🔥 "}
      {labels[score]}
    </span>
  );
}

// ── Confidence Indicator ──────────────────────────────────────────
function ConfidenceDot({
  confidence,
}: {
  confidence: "high" | "medium" | "low";
}) {
  const colors = {
    high: "bg-green-400",
    medium: "bg-yellow-400",
    low: "bg-gray-400",
  };
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${colors[confidence]} mr-1.5`}
      title={`${confidence} confidence`}
    />
  );
}

// ── Tool Tag Component ────────────────────────────────────────────
function ToolTag({
  name,
  confidence,
}: {
  name: string;
  confidence: "high" | "medium" | "low";
}) {
  return (
    <span className="inline-flex items-center bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-sm mr-1.5 mb-1">
      <ConfidenceDot confidence={confidence} />
      {name}
    </span>
  );
}

// ── Store Card Component ──────────────────────────────────────────
function StoreCard({ store }: { store: StoreAnalysis }) {
  const [expanded, setExpanded] = useState(false);

  if (store.status === "error") {
    const errorLabels: Record<string, string> = {
      not_found: "404 Not Found",
      blocked: "Access Blocked",
      timeout: "Timed Out",
      dns_failure: "Domain Not Found",
      unknown: "Error",
    };
    const badgeLabel = errorLabels[store.errorCategory || "unknown"] || "Error";

    return (
      <div className="bg-white rounded-lg border border-red-200 p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">{store.url}</h3>
            <p className="text-red-600 text-sm mt-1">
              ⚠ Analysis failed: {store.error}
            </p>
            {store.errorSuggestion && (
              <div className="mt-2 bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm text-gray-600">
                💡 {store.errorSuggestion}
              </div>
            )}
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
            {badgeLabel}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      {/* Header Row */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">
            {store.storeName || store.url}
          </h3>
          <a
            href={store.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            {store.url} ↗
          </a>
        </div>
        <FitBadge score={store.postscriptFit.score} />
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
            Platform
          </p>
          <p className="text-sm font-medium text-gray-900">
            {store.platform ? (
              <ToolTag
                name={store.platform.name}
                confidence={store.platform.confidence}
              />
            ) : (
              <span className="text-gray-400">Unknown</span>
            )}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
            Industry
          </p>
          <p className="text-sm text-gray-900">
            {store.industry || "Unknown"}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
            SMS Provider
          </p>
          <p className="text-sm text-gray-900">
            {store.smsMarketing.length > 0 ? (
              store.smsMarketing.map((t) => (
                <ToolTag
                  key={t.name}
                  name={t.name}
                  confidence={t.confidence}
                />
              ))
            ) : (
              <span className="text-green-600 font-medium">
                None detected ✓
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Email & Popup Row */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
            Email Marketing
          </p>
          <p className="text-sm text-gray-900">
            {store.emailMarketing.length > 0
              ? store.emailMarketing.map((t) => (
                  <ToolTag
                    key={t.name}
                    name={t.name}
                    confidence={t.confidence}
                  />
                ))
              : "None detected"}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
            Popup / Lead Capture
          </p>
          <p className="text-sm text-gray-900">
            {store.popupTools.length > 0
              ? store.popupTools.map((t) => (
                  <ToolTag
                    key={t.name}
                    name={t.name}
                    confidence={t.confidence}
                  />
                ))
              : "None detected"}
          </p>
        </div>
      </div>

      {/* Expandable Details */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-sm text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
      >
        {expanded ? "Hide details ▲" : "Show details ▼"}
      </button>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          {/* Sample Products */}
          {store.sampleProducts.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
                Sample Products
              </p>
              <div className="flex flex-wrap gap-1.5">
                {store.sampleProducts.map((p, i) => (
                  <span
                    key={i}
                    className="bg-gray-50 text-gray-700 px-2 py-0.5 rounded text-sm border border-gray-200"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Fit Score Reasoning */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
              Postscript Fit Analysis
            </p>
            <ul className="space-y-1">
              {store.postscriptFit.reasons.map((reason, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-start">
                  <span className="text-gray-400 mr-2">•</span>
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Summary Dashboard ─────────────────────────────────────────────
function SummaryDashboard({ data }: { data: AnalyzeResponse }) {
  const { summary } = data;
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
      {[
        { label: "Total Analyzed", value: summary.total, color: "text-gray-900" },
        { label: "Successful", value: summary.successful, color: "text-green-600" },
        { label: "On Shopify", value: summary.shopifyCount, color: "text-purple-600" },
        { label: "Using Postscript", value: summary.hasPostscript, color: "text-blue-600" },
        { label: "Hot Leads", value: summary.hotLeads, color: "text-red-600" },
      ].map((stat) => (
        <div
          key={stat.label}
          className="bg-white rounded-lg border border-gray-200 p-4 text-center shadow-sm"
        >
          <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}

// ── Main Page Component ───────────────────────────────────────────
export default function Home() {
  const [urls, setUrls] = useState(DEFAULT_URLS);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [data, setData] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "hot" | "warm" | "cold">("all");
  const [sortBy, setSortBy] = useState<"default" | "fit">("default");

  async function handleAnalyze() {
    setLoading(true);
    setError(null);
    setData(null);
    setProgress("Starting analysis...");

    const urlList = urls
      .split("\n")
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    if (urlList.length === 0) {
      setError("Please enter at least one URL");
      setLoading(false);
      return;
    }

    setProgress(`Analyzing ${urlList.length} stores... This may take a minute.`);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: urlList }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Analysis failed");
      }

      const result: AnalyzeResponse = await response.json();
      setData(result);
      setProgress("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
      setProgress("");
    } finally {
      setLoading(false);
    }
  }

  // Filter and sort results
  const filteredResults = data
    ? data.results
        .filter((r) => filter === "all" || r.postscriptFit.score === filter)
        .sort((a, b) => {
          if (sortBy === "fit") {
            const order = { hot: 0, warm: 1, cold: 2 };
            return order[a.postscriptFit.score] - order[b.postscriptFit.score];
          }
          return 0;
        })
    : [];

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">P</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Postscript Intel
            </h1>
          </div>
          <p className="text-gray-500 ml-11">
            E-commerce tech stack analyzer for sales intelligence
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* URL Input Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter store URLs (one per line)
          </label>
          <textarea
            value={urls}
            onChange={(e) => setUrls(e.target.value)}
            rows={6}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm font-mono text-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y"
            placeholder="https://www.example-store.com"
            disabled={loading}
          />
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-500">
              {urls.split("\n").filter((u) => u.trim()).length} URLs ready to
              analyze
            </p>
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="bg-purple-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {loading ? "Analyzing..." : "Analyze Stores"}
            </button>
          </div>

          {/* Progress indicator */}
          {progress && (
            <div className="mt-4 flex items-center gap-2 text-sm text-purple-600">
              <svg
                className="animate-spin h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              {progress}
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Results Section */}
        {data && (
          <>
            <SummaryDashboard data={data} />

            {/* Filter and Sort Controls */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className="text-sm text-gray-500 font-medium">Filter:</span>
              {(["all", "hot", "warm", "cold"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                    filter === f
                      ? "bg-purple-600 text-white"
                      : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {f === "all" ? "All" : f === "hot" ? "🔥 Hot" : f === "warm" ? "Warm" : "Cold"}
                </button>
              ))}

              <span className="text-gray-300 mx-1">|</span>

              <span className="text-sm text-gray-500 font-medium">Sort:</span>
              <button
                onClick={() =>
                  setSortBy(sortBy === "default" ? "fit" : "default")
                }
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                  sortBy === "fit"
                    ? "bg-purple-600 text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                By Fit Score
              </button>

              <div className="ml-auto">
                <button
                  onClick={() => exportToCSV(data.results)}
                  className="px-4 py-1.5 rounded-lg text-sm font-medium bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Export CSV ↓
                </button>
              </div>
            </div>

            {/* Store Cards */}
            <div className="space-y-4">
              {filteredResults.map((store) => (
                <StoreCard key={store.url} store={store} />
              ))}
            </div>

            {filteredResults.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No stores match the current filter.
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
