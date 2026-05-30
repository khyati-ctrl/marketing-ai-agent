# Lead Tracking & Attribution

The system operates without native social media APIs. Attribution is handled via two distinct entry paths.

## 1. Tracking Links (Automated)
When the Content Agent generates a post, it creates a unique URL slug (e.g., `/t/promo-xyz`). When a user clicks this link:
* The HTTP request hits the backend router.
* The Attribution Agent intercepts the slug, queries the `Content` table, and increments the raw click counter.
* The agent logs the interaction in the `Lead` table with a timestamp.
* The user is instantly redirected to the final destination URL.

## 2. Manual Entry (Fallback)
If a lead originates outside the digital funnel (e.g., a phone call), the internal team can manually enter the lead via the UI. The team selects the source post, and the Attribution Agent updates the funnel counters identically to an automated click.