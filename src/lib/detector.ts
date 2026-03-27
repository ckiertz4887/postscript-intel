/**
 * Tech Stack Detection Engine
 *
 * HOW THIS WORKS:
 * Every marketing tool (Klaviyo, Attentive, Privy, etc.) needs to load
 * JavaScript on a store's website to function. These scripts come from
 * specific CDN domains and create recognizable patterns in the HTML.
 *
 * We fetch the page HTML and search for these known "fingerprints."
 * It's the same thing BuiltWith or Wappalyzer do, just focused on
 * the signals Postscript's sales team cares about.
 */

import * as cheerio from "cheerio";
import { DetectedTool, ErrorCategory, StoreAnalysis } from "./types";

class FetchError extends Error {
  category: ErrorCategory;
  constructor(message: string, category: ErrorCategory) {
    super(message);
    this.category = category;
  }
}

// ── Detection Pattern Definitions ──────────────────────────────────
// Each pattern has: tool name, what to look for, and where to look.
// "evidence" gets filled in when we find a match, so the sales rep
// can see *why* we flagged something (builds trust in the data).

interface DetectionPattern {
  name: string;
  patterns: RegExp[];
  category: "email" | "sms" | "popup" | "platform";
}

const DETECTION_PATTERNS: DetectionPattern[] = [
  // ── E-commerce Platforms ───────────────────────────────────────
  {
    name: "Shopify",
    category: "platform",
    patterns: [
      /cdn\.shopify\.com/i,
      /Shopify\.theme/i,
      /myshopify\.com/i,
      /shopify-section/i,
      /\/\/cdn\.shopify/i,
    ],
  },
  {
    name: "BigCommerce",
    category: "platform",
    patterns: [
      /bigcommerce\.com/i,
      /stencil-utils/i,
      /BCData/i,
    ],
  },
  {
    name: "WooCommerce",
    category: "platform",
    patterns: [
      /woocommerce/i,
      /wc-blocks/i,
      /wp-content\/plugins\/woocommerce/i,
    ],
  },
  {
    name: "Magento",
    category: "platform",
    patterns: [
      /magento/i,
      /mage\/cookies/i,
      /Magento_PageBuilder/i,
    ],
  },
  {
    name: "Salesforce Commerce Cloud",
    category: "platform",
    patterns: [
      /demandware/i,
      /dwanalytics/i,
      /dw\/shop/i,
    ],
  },

  // ── Email Marketing Providers ──────────────────────────────────
  {
    name: "Klaviyo",
    category: "email",
    patterns: [
      /klaviyo\.com/i,
      /static\.klaviyo\.com/i,
      /klaviyo\.js/i,
      /_learnq/i,
      /klaviyo-form/i,
    ],
  },
  {
    name: "Mailchimp",
    category: "email",
    patterns: [
      /mailchimp\.com/i,
      /chimpstatic\.com/i,
      /mc\.js/i,
      /list-manage\.com/i,
    ],
  },
  {
    name: "Omnisend",
    category: "email",
    patterns: [
      /omnisrc\.com/i,
      /omnisend\.com/i,
    ],
  },
  {
    name: "Drip",
    category: "email",
    patterns: [
      /getdrip\.com/i,
      /dc\.js/i,
      /_dcq/i,
    ],
  },
  {
    name: "HubSpot",
    category: "email",
    patterns: [
      /hs-scripts\.com/i,
      /js\.hs-analytics\.net/i,
      /hubspot\.com/i,
      /hbspt\.forms/i,
    ],
  },
  {
    name: "Brevo (Sendinblue)",
    category: "email",
    patterns: [
      /sendinblue\.com/i,
      /brevo\.com/i,
      /sibautomation/i,
    ],
  },
  {
    name: "ActiveCampaign",
    category: "email",
    patterns: [
      /activecampaign\.com/i,
      /trackcmp\.net/i,
    ],
  },
  {
    name: "Iterable",
    category: "email",
    patterns: [
      /iterable\.com/i,
      /api\.iterable\.com/i,
    ],
  },

  // ── SMS Marketing Providers ────────────────────────────────────
  {
    name: "Postscript",
    category: "sms",
    patterns: [
      /postscript\.io/i,
      /sdk\.postscript/i,
      /postscript-sms/i,
    ],
  },
  {
    name: "Attentive",
    category: "sms",
    patterns: [
      /attentivemobile\.com/i,
      /attn\.tv/i,
      /attentive\.com/i,
    ],
  },
  {
    name: "Klaviyo SMS",
    category: "sms",
    patterns: [
      /klaviyo.*sms/i,
      /klaviyo-sms/i,
    ],
  },
  {
    name: "SMSBump (Yotpo)",
    category: "sms",
    patterns: [
      /smsbump\.com/i,
      /yotpo\.com.*sms/i,
    ],
  },
  {
    name: "Recart",
    category: "sms",
    patterns: [
      /recart\.com/i,
      /recart-sdk/i,
    ],
  },

  // ── Popup / Lead Capture Tools ─────────────────────────────────
  {
    name: "Privy",
    category: "popup",
    patterns: [
      /privy\.com/i,
      /widget\.privy\.com/i,
    ],
  },
  {
    name: "Justuno",
    category: "popup",
    patterns: [
      /justuno\.com/i,
      /juapp\.com/i,
    ],
  },
  {
    name: "OptinMonster",
    category: "popup",
    patterns: [
      /optinmonster/i,
      /optin-monster/i,
      /omapi/i,
    ],
  },
  {
    name: "Wheelio",
    category: "popup",
    patterns: [
      /wheelio/i,
      /wheelio-popup/i,
    ],
  },
  {
    name: "Amped",
    category: "popup",
    patterns: [
      /amped\.io/i,
    ],
  },
  {
    name: "Wisepops",
    category: "popup",
    patterns: [
      /wisepops\.com/i,
      /wisepops/i,
    ],
  },
  {
    name: "Poptin",
    category: "popup",
    patterns: [
      /poptin\.com/i,
    ],
  },
];

// ── Fetch with error handling ──────────────────────────────────────

async function fetchHTML(url: string): Promise<string> {
  // We set a User-Agent header because some sites block requests
  // that look like bots (no User-Agent = obvious bot).
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: controller.signal,
      redirect: "follow",
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new FetchError(`HTTP 404: ${response.statusText}`, "not_found");
      }
      if (response.status === 403 || response.status === 429) {
        throw new FetchError(`HTTP ${response.status}: ${response.statusText}`, "blocked");
      }
      throw new FetchError(`HTTP ${response.status}: ${response.statusText}`, "unknown");
    }

    return await response.text();
  } catch (error) {
    if (error instanceof FetchError) throw error;
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new FetchError("Request timed out", "timeout");
      }
      if (/ENOTFOUND|ECONNREFUSED|fetch failed/i.test(error.message)) {
        throw new FetchError(error.message, "dns_failure");
      }
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

// ── Product Detection ──────────────────────────────────────────────

interface ProductInfo {
  products: string[];
  industry: string | null;
}

/**
 * Try to get products from Shopify's public /products.json endpoint.
 * Not all stores expose this — some lock it down — so we fall back
 * to scraping product names from the HTML if this fails.
 */
async function detectProducts(
  url: string,
  html: string,
  isShopify: boolean
): Promise<ProductInfo> {
  const products: string[] = [];

  // Attempt 1: Shopify's public products.json API
  if (isShopify) {
    try {
      const baseUrl = new URL(url).origin;
      const response = await fetch(`${baseUrl}/products.json?limit=6`, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        },
        signal: AbortSignal.timeout(10000),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.products && Array.isArray(data.products)) {
          for (const p of data.products.slice(0, 6)) {
            if (p.title) products.push(p.title);
          }
        }
      }
    } catch {
      // products.json not available — that's fine, we'll try HTML
    }
  }

  // Attempt 2: Scrape product info from HTML using common patterns
  if (products.length === 0) {
    const $ = cheerio.load(html);

    // Common product title selectors across ecommerce platforms
    const selectors = [
      'h2.product-title', 'h3.product-title',
      '.product-card__title', '.product-card h2', '.product-card h3',
      '.product-item__title', '.product-name',
      '[data-product-title]', '.grid-product__title',
      'h2.card__heading a', '.card__heading a',
      '.product-title a', '.product h2',
      '.product-grid-item__title',
    ];

    for (const selector of selectors) {
      $(selector).each((_, el) => {
        const text = $(el).text().trim();
        if (text && text.length < 200 && products.length < 6) {
          products.push(text);
        }
      });
      if (products.length >= 3) break;
    }
  }

  // Infer industry from products and page content
  const industry = inferIndustry(html, products);

  return { products, industry };
}

/**
 * Infer what vertical/industry a store is in based on keywords
 * found in their products and page content. This is heuristic-based —
 * not perfect, but useful for a sales rep's quick triage.
 */
function inferIndustry(html: string, products: string[]): string | null {
  const text = (html + " " + products.join(" ")).toLowerCase();

  const industryKeywords: Record<string, string[]> = {
    "Fashion & Apparel": ["dress", "shirt", "pants", "jeans", "jacket", "clothing", "apparel", "wear", "fashion", "hoodie", "shorts", "legging", "skirt", "blouse", "sweater", "activewear", "athleisure"],
    "Beauty & Cosmetics": ["makeup", "cosmetic", "lipstick", "foundation", "skincare", "serum", "moisturizer", "beauty", "mascara", "blush", "concealer", "primer"],
    "Skincare": ["cleanser", "toner", "retinol", "spf", "sunscreen", "moisturizer", "skincare", "face wash", "exfoliant"],
    "Health & Wellness": ["supplement", "vitamin", "protein", "health", "wellness", "probiotic", "collagen", "adaptogen", "mushroom"],
    "Food & Beverage": ["coffee", "tea", "snack", "food", "drink", "beverage", "olive oil", "sauce", "spice", "chocolate", "bone broth", "soda", "seltzer", "prebiotic"],
    "Home & Living": ["bedding", "sheet", "pillow", "towel", "rug", "blanket", "mattress", "home", "furniture", "candle", "decor"],
    "Jewelry & Accessories": ["bracelet", "necklace", "ring", "earring", "jewelry", "accessori", "watch", "piercing", "stud"],
    "Footwear": ["shoe", "sneaker", "boot", "sandal", "footwear", "slipper", "runner"],
    "Outdoor & Sports": ["outdoor", "hiking", "camping", "ski", "snowboard", "surf", "climbing", "adventure", "gear"],
    "Grooming": ["beard", "shave", "razor", "grooming", "hair care", "pomade", "barber"],
    "Electronics & Audio": ["headphone", "speaker", "earbud", "audio", "wireless", "bluetooth", "sound"],
    "Pet": ["dog", "cat", "pet", "treats", "kibble", "leash", "collar"],
    "Cookware & Kitchen": ["cookware", "pan", "pot", "kitchen", "knife", "skillet", "nonstick", "hex"],
    "Eyewear": ["sunglasses", "glasses", "eyewear", "lens", "frames", "polarized"],
    "Underwear & Basics": ["underwear", "socks", "bra", "boxers", "basics", "undershirt"],
  };

  // Score each industry by counting keyword matches
  let bestIndustry: string | null = null;
  let bestScore = 0;

  for (const [industry, keywords] of Object.entries(industryKeywords)) {
    const score = keywords.filter((kw) => text.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestIndustry = industry;
    }
  }

  return bestScore >= 1 ? bestIndustry : "General E-commerce";
}

// ── Core Detection Logic ───────────────────────────────────────────

function analyzeHTML(html: string): {
  platform: DetectedTool | null;
  emailMarketing: DetectedTool[];
  smsMarketing: DetectedTool[];
  popupTools: DetectedTool[];
} {
  let platform: DetectedTool | null = null;
  const emailMarketing: DetectedTool[] = [];
  const smsMarketing: DetectedTool[] = [];
  const popupTools: DetectedTool[] = [];

  for (const pattern of DETECTION_PATTERNS) {
    const matchedPatterns = pattern.patterns.filter((p) => p.test(html));
    if (matchedPatterns.length === 0) continue;

    const confidence: "high" | "medium" | "low" =
      matchedPatterns.length >= 3
        ? "high"
        : matchedPatterns.length >= 2
          ? "medium"
          : "low";

    const tool: DetectedTool = {
      name: pattern.name,
      confidence,
      evidence: `Matched: ${matchedPatterns.map((p) => p.source).join(", ")}`,
    };

    switch (pattern.category) {
      case "platform":
        // Keep the platform with the most evidence
        if (!platform || matchedPatterns.length > (platform.evidence.split(",").length)) {
          platform = tool;
        }
        break;
      case "email":
        emailMarketing.push(tool);
        break;
      case "sms":
        smsMarketing.push(tool);
        break;
      case "popup":
        popupTools.push(tool);
        break;
    }
  }

  return { platform, emailMarketing, smsMarketing, popupTools };
}

// ── Extract store name from HTML ───────────────────────────────────

function extractStoreName(html: string, url: string): string | null {
  const $ = cheerio.load(html);

  // Try og:site_name first (most reliable)
  const ogSiteName = $('meta[property="og:site_name"]').attr("content");
  if (ogSiteName && ogSiteName.trim().length < 80) return ogSiteName.trim();

  // Try the <title> tag, cleaned up
  const title = $("title").text().trim();
  if (title) {
    // Often formatted as "Store Name – Some tagline" or "Store Name | Products"
    const cleaned = title.split(/[|\-–—]/)[0].trim();
    if (cleaned) return cleaned;
  }

  // Fall back to domain name
  try {
    const hostname = new URL(url).hostname.replace("www.", "");
    return hostname.split(".")[0];
  } catch {
    return null;
  }
}

// ── Postscript Fit Scoring ─────────────────────────────────────────
// This is the "beyond the brief" extra that shows product thinking.
// A Postscript sales rep wants to know: should I reach out to this store?

function calculatePostscriptFit(analysis: {
  platform: DetectedTool | null;
  smsMarketing: DetectedTool[];
  emailMarketing: DetectedTool[];
}): { score: "hot" | "warm" | "cold"; reasons: string[] } {
  const reasons: string[] = [];
  let points = 0;

  // Shopify is Postscript's primary platform
  const isShopify = analysis.platform?.name === "Shopify";
  if (isShopify) {
    points += 3;
    reasons.push("Runs on Shopify (Postscript's core platform)");
  } else if (analysis.platform) {
    points += 0;
    reasons.push(`Runs on ${analysis.platform.name} (not Shopify — limited integration)`);
  }

  // Check if they already have SMS marketing
  const hasPostscript = analysis.smsMarketing.some(
    (t) => t.name === "Postscript"
  );
  const hasCompetitor = analysis.smsMarketing.some(
    (t) => t.name !== "Postscript"
  );

  if (hasPostscript) {
    points -= 5; // Already a customer
    reasons.push("Already using Postscript");
  } else if (hasCompetitor) {
    points += 2;
    const competitors = analysis.smsMarketing.map((t) => t.name).join(", ");
    reasons.push(`Using competitor SMS: ${competitors} — displacement opportunity`);
  } else if (isShopify) {
    points += 4;
    reasons.push("No SMS provider detected — greenfield opportunity");
  }

  // Having email marketing suggests marketing maturity
  if (analysis.emailMarketing.length > 0) {
    points += 1;
    reasons.push(
      `Active email marketing (${analysis.emailMarketing.map((t) => t.name).join(", ")}) — likely ready for SMS`
    );
  }

  const score: "hot" | "warm" | "cold" =
    points >= 5 ? "hot" : points >= 2 ? "warm" : "cold";

  return { score, reasons };
}

// ── Error Suggestion Builder ──────────────────────────────────────

function buildSuggestion(category: ErrorCategory, url: string): string {
  let domain: string;
  try {
    domain = new URL(url).hostname.replace("www.", "");
  } catch {
    domain = url;
  }

  switch (category) {
    case "not_found":
    case "dns_failure":
      return `Try searching for "${domain}" — some brands use prefixes like "drink" or "eat" (e.g., drink${domain}).`;
    case "blocked":
      return `This site blocks automated requests. Puppeteer-based scraping is on the roadmap as a workaround.`;
    case "timeout":
      return `The request timed out. Try again — the site may have been temporarily slow.`;
    default:
      return `An unexpected error occurred. Try again or verify the URL is correct.`;
  }
}

// ── Main Analysis Function ─────────────────────────────────────────

export async function analyzeStore(url: string): Promise<StoreAnalysis> {
  try {
    // Normalize URL
    if (!url.startsWith("http")) {
      url = `https://${url}`;
    }

    // Step 1: Fetch the HTML
    const html = await fetchHTML(url);

    // Step 2: Detect tools from HTML patterns
    const { platform, emailMarketing, smsMarketing, popupTools } =
      analyzeHTML(html);

    // Step 3: Get product info
    const isShopify = platform?.name === "Shopify";
    const { products, industry } = await detectProducts(url, html, isShopify);

    // Step 4: Extract store name
    const storeName = extractStoreName(html, url);

    // Step 5: Calculate Postscript fit
    const postscriptFit = calculatePostscriptFit({
      platform,
      smsMarketing,
      emailMarketing,
    });

    return {
      url,
      status: "success",
      platform,
      emailMarketing,
      smsMarketing,
      popupTools,
      industry,
      sampleProducts: products,
      postscriptFit,
      storeName,
      scrapedAt: new Date().toISOString(),
    };
  } catch (error) {
    const category: ErrorCategory =
      error instanceof FetchError ? error.category : "unknown";
    const suggestion = buildSuggestion(category, url);

    return {
      url,
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
      errorCategory: category,
      errorSuggestion: suggestion,
      platform: null,
      emailMarketing: [],
      smsMarketing: [],
      popupTools: [],
      industry: null,
      sampleProducts: [],
      postscriptFit: { score: "cold", reasons: ["Analysis failed"] },
      storeName: null,
      scrapedAt: new Date().toISOString(),
    };
  }
}
