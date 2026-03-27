# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 2026-03-26

### Added
- Initial release of Postscript Intel
- Tech stack detection engine with pattern matching for 20+ tools
- Platform detection: Shopify, BigCommerce, WooCommerce, Magento, Salesforce Commerce Cloud
- Email marketing detection: Klaviyo, Mailchimp, Omnisend, HubSpot, Drip, Brevo, ActiveCampaign, Iterable
- SMS marketing detection: Postscript, Attentive, Klaviyo SMS, SMSBump/Yotpo, Recart
- Popup/lead capture detection: Privy, Justuno, OptinMonster, Wheelio, Wisepops, Amped, Poptin
- Product scraping via Shopify /products.json endpoint with HTML fallback
- Industry/vertical inference from product and page content
- Postscript Fit Score (hot/warm/cold) with reasoning
- Summary dashboard with key metrics
- Filter by fit score and sort controls
- CSV export for CRM/spreadsheet workflows
- Responsive UI built with Tailwind CSS
- Confidence indicators for each detection
- Expandable detail cards with evidence and fit analysis
- Concurrent batch processing (5 URLs at a time)
- Graceful error handling with clear status per URL
