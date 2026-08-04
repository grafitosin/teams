# Changelog: Original Package → Enhanced Distributed-Capture Bundle

## New backend (`server/` — did not exist in the original package)
- `mergeEngine.js` — combines per-participant segments into one ordered, speaker-attributed transcript, with clock-drift correction
- `index.js` — WebSocket sync hub + REST API (minutes generation, OBO token exchange, meeting CRUD)
- `storage.js` — encrypted-at-rest, per-meeting persistence (replaces client-only `localStorage`)
- `minutesGenerator.js` — LLM-based summarization, automatic fallback to rule-based extraction
- `ruleBasedExtractor.js` — the original regex/keyword logic, refactored out as the fallback path
- `exportUtil.js` — HTML export with proper escaping
- `oboTokenExchange.js` — real On-Behalf-Of Graph token exchange
- `Dockerfile` + root `docker-compose.yml` — deployment config
- `test/` — 11 unit + integration tests (merge ordering, extraction, XSS escaping, real WebSocket end-to-end)
- `.env.example` — server config template

## New frontend files
- `SyncService.js` — streams local segments to backend, receives merged transcript, auto-reconnects
- `ConsentBanner.js` + `.css` — explicit opt-in UI before mic capture starts

## Modified: `LauraTranscribePanel.js`
- Wired in `SyncService` + `ConsentBanner`; added consent/participants/sync-status state
- Fixed: interim (not-yet-finalized) speech recognition results were being permanently appended to the transcript — now only finalized segments persist, interim shown as a separate live line
- Fixed: a literal newline inside a string literal that would have broken the production build
- Mic button gated behind consent; `generateMinutes` calls the new backend endpoint with local fallback

## Modified: `OutlookCalendarService.js`
- Removed the MSAL popup fallback (referenced `@azure/msal-browser`, never a declared dependency — would have crashed)
- Replaced with a single Teams-SSO + backend-OBO flow
- Escaped all values interpolated into the calendar event HTML body

## Modified: `MinutesGenerator.js` (client-side)
- Added `escapeHtml`; `exportToHTML` no longer injects raw transcript text unescaped

## Modified: config/docs
- `.env.example` — added `REACT_APP_SYNC_ENDPOINT`, `REACT_APP_API_ENDPOINT`, `REACT_APP_TOKEN_EXCHANGE_ENDPOINT`
- `docs/DEPLOYMENT.md` — backend deployment section + production checklist
- `README.md` — "What's New" section

## New in this bundle (deployment/installation)
- `INSTALLATION.md` — end-to-end setup: AAD app, backend, frontend, manifest, sideloading, hosting comparison
- `DEPLOY_VERCEL.md` + `vercel.json` — frontend-on-Vercel deployment
- `.github/workflows/deploy-pages.yml` — frontend-on-GitHub-Pages deployment with SPA fallback and correct subpath handling
- `CHANGELOG.md` — this file

## Unchanged by design (see gap analysis)
- Audio capture remains opt-in — only participants with the tab open and mic granted are transcribed
- External/cross-tenant guests are not auto-reached by org install policy
- These are the accepted trade-offs of avoiding org-level meeting transcription and calling-bot/real-time-media infrastructure
