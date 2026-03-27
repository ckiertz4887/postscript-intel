# Postscript Intel

E-commerce tech stack analyzer for sales intelligence. Paste a list of store URLs and get an enriched report showing each store's platform, marketing tools, products, and Postscript fit score.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## What It Detects

| Signal | Examples |
|--------|----------|
| Platform | Shopify, BigCommerce, WooCommerce, Magento, SFCC |
| Email Marketing | Klaviyo, Mailchimp, Omnisend, HubSpot, Drip, Brevo |
| SMS Marketing | Postscript, Attentive, Klaviyo SMS, SMSBump, Recart |
| Popup / Lead Capture | Privy, Justuno, OptinMonster, Wheelio, Wisepops |
| Industry | Inferred from products and page content |
| Products | Via Shopify /products.json or HTML scraping |

## Architecture

- **Next.js** with App Router and TypeScript
- **API Route** (`/api/analyze`) handles server-side scraping
- **Cheerio** for HTML parsing
- **Tailwind CSS** for styling

See [DECISIONS.md](./DECISIONS.md) for the full build brief.

## Deployment

Deployed on Railway. To deploy your own:

1. Fork this repo
2. Connect to Railway
3. Deploy (auto-detected as Next.js)
