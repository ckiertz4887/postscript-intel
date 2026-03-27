# Postscript Intel — Build Brief

## What I Built

A web app that takes a list of e-commerce store URLs and produces an enriched intelligence report for each one. The tool detects the store's platform, email/SMS marketing providers, popup tools, products, and industry — then scores each store's fit as a Postscript prospect.

## Approach

I framed the tool around how a Postscript sales rep would actually use it. Rather than just showing raw detection data, the app answers the question: **"Should I reach out to this store, and what should I say?"**

Every store gets a **Postscript Fit Score** (Hot / Warm / Cold) with reasoning. A Shopify store with no SMS provider is a hot greenfield lead. A store already using Attentive is a warm displacement opportunity. A non-Shopify store with no marketing tools is cold. This turns a data dump into an actionable prospecting list.

## Key Technical Decisions

**Single-repo Next.js app** — All frontend and backend code lives together. API routes handle server-side scraping (necessary because browsers can't fetch cross-origin HTML). This keeps deployment simple: one service on Railway, one repo on GitHub.

**Pattern-based detection over API calls** — Every marketing tool loads identifiable JavaScript on the page. Klaviyo uses `static.klaviyo.com` and the `_learnq` global. Attentive loads from `attn.tv`. We search page HTML for these fingerprints. This is the same approach tools like BuiltWith and Wappalyzer use, scoped to the signals Postscript cares about.

**Confidence scoring** — Not all detections are equal. Matching 3+ patterns for a tool = high confidence. One pattern = low. This is surfaced to users so they can trust the data appropriately.

**Batch concurrency with limits** — We analyze 5 URLs concurrently per batch instead of all at once. This prevents overwhelming target servers or hitting rate limits, while still being fast enough for 20+ URLs.

**Graceful error handling** — The assignment specifically calls out that "a URL that fails silently is worse than one that fails loudly." Every URL gets a clear success/partial/error status. Failed URLs show the specific error. The app continues processing the rest of the list.

## What It Can't Do Yet (Roadmap)

1. **JavaScript-rendered content** — Some stores load marketing tools dynamically via JavaScript that doesn't appear in the initial HTML. A headless browser (Puppeteer/Playwright) would catch these, at the cost of speed and infrastructure complexity.

2. **Historical tracking** — Currently a point-in-time snapshot. Adding a database would let reps see when a store adds/removes tools (e.g., "Dropped Attentive last month" = perfect timing for outreach).

3. **CRM integration** — Auto-push results to HubSpot/Salesforce as enriched contact records, saving the manual CSV export step.

4. **Deeper product intelligence** — Scraping full product catalogs to estimate store size, price points, and catalog breadth. This would improve fit scoring.

5. **Bulk list upload** — Accept CSV files of URLs from a lead list, not just text input.

## Tools & Process

I built this using Claude as a development partner — writing code collaboratively, explaining decisions, and iterating on the architecture. This reflects how I work: I bring the product thinking and GTM context, and use AI tooling to move fast on implementation. For a GTM Automation Engineer role, I think the ability to rapidly prototype and ship functional tools is more relevant than any specific framework expertise.
