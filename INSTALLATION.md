# Installation & Configuration Guide

This covers everything needed to go from this source bundle to a working
deployment: Azure AD app registration, backend server, frontend tab, Teams
manifest, sideloading, and hosting options.

---

## 0. Prerequisites

- Node.js 18+ and npm
- A Microsoft 365 tenant where you have (or can get) permission to register
  an Azure AD app and upload custom Teams apps
- Docker (optional, only needed if deploying the backend via container)

---

## 1. Register the Azure AD App (one-time)

1. **Azure Portal → Azure Active Directory → App registrations → New registration**
2. Name it (e.g. "Laura Transcribe"). Choose single-tenant unless you need
   external guests to use it.
3. **Authentication** → Add platform → **Single-page application** → redirect
   URI = your deployed tab's HTTPS URL (add `http://localhost:3000` too for
   local dev via tunnel).
4. **Certificates & secrets** → New client secret → copy the value now (shown once).
5. **API permissions** → Add a permission → Microsoft Graph → Delegated:
   - `User.Read`
   - `Calendars.ReadWrite`
   - `OnlineMeetings.Read` *(only if building the attendance-report coverage feature)*
   - `OnlineMeetingArtifact.Read.All` *(same)*
   Then **Grant admin consent**.
6. **Expose an API** → set the Application ID URI, add your own client ID as
   an authorized client application (required for Teams SSO).
7. Record: **Application (client) ID**, **Directory (tenant) ID**, **client secret**.

---

## 2. Configure and run the backend (`server/`)

```bash
cd server
cp .env.example .env
```

Edit `.env`:
```
PORT=4000
AAD_APP_CLIENT_ID=<client ID from step 1>
AAD_APP_CLIENT_SECRET=<client secret from step 1>
AAD_APP_TENANT_ID=<tenant ID, or 'common' for multi-tenant>
ALLOWED_ORIGINS=https://your-frontend-domain.com
STORAGE_ENCRYPTION_KEY=<generate below>
LLM_API_KEY=                # optional; omit to use the rule-based fallback
```

Generate a storage key once and keep it safe (losing it makes stored data unreadable):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run it:
```bash
npm install
npm start                      # http://localhost:4000, ws path /sync, REST path /api
# or:
docker compose up --build      # from the project root
```

Verify:
```bash
curl http://localhost:4000/healthz     # -> {"ok":true}
npm test                                # from server/, runs the 11-test suite
```

---

## 3. Configure the frontend (project root)

```bash
cp .env.example .env
```

```
REACT_APP_CLIENT_ID=<same client ID as step 1>
REACT_APP_SYNC_ENDPOINT=wss://your-backend-domain.com/sync
REACT_APP_API_ENDPOINT=https://your-backend-domain.com/api
```

Leave `REACT_APP_SYNC_ENDPOINT` unset to run standalone (single participant,
no merge, no consent gate) with no backend at all.

```bash
npm install
npm start        # local dev on :3000
npm run build     # production build -> build/
```

---

## 4. Update the Teams manifest

Edit `manifest/manifest.json`:
- `validDomains`: add your frontend domain **and** your backend domain
- `webApplicationInfo.id`: the Application (client) ID from step 1
- `webApplicationInfo.resource`: the Application ID URI from step 1

Package `manifest/` (manifest.json + icons) as a zip.

---

## 5. Sideload and test in Teams

Teams admin center → **Teams apps → Manage your apps → Upload a custom app**,
or in the Teams client: **Apps → Manage your apps → Upload an app → Upload a
custom app**. Add it to a meeting and test.

---

## 6. Roll out automatically to all participants (optional)

Teams admin center → **Teams apps → Setup policies** (or the newer
app-centric management UI) → pin the app for the relevant user group. Once
pinned by policy, it also becomes visible to other meeting participants when
the organizer has it pinned — no per-user manual install needed inside the org.
This does not reach external/guest participants or force mic consent; see
`docs/GAP_ANALYSIS` for that trade-off.

---

## 7. Hosting options

### Frontend (static, any of these work)
| Host | Notes |
|---|---|
| **Azure Static Web Apps** | Recommended — same Azure tenant/subscription as your AAD app, generous free tier |
| **Vercel** | Easiest CI/CD from GitHub; see `DEPLOY_VERCEL.md` |
| **Netlify** | Equivalent to Vercel |
| **GitHub Pages** | Works; see `.github/workflows/deploy-pages.yml`. Needs `HashRouter`/subpath handling and a public repo on free plans |

### Backend (`server/` — needs an always-on host; cannot run on static/serverless-only platforms)
| Host | Notes |
|---|---|
| **Azure Container Apps** | Recommended if pairing with Azure Static Web Apps — native WebSocket support, deploys straight from the included `Dockerfile` |
| **Render** | Fastest to stand up; auto-detects the `Dockerfile`, gives a persistent disk and a `wss://` URL |
| **Railway** | Similar to Render |
| **Fly.io** | Good for multi-region placement close to meeting participants |

**Why not Vercel/GitHub Pages for the backend:** `server/index.js` is a
persistent, stateful WebSocket process holding meeting state and
connections in memory, with file-based storage requiring a real
filesystem. Vercel functions are stateless/short-lived with an ephemeral
filesystem; GitHub Pages serves static files only — neither can host this
component. See `DEPLOY_VERCEL.md` for the exact split.

---

## 8. Troubleshooting

See `TROUBLESHOOTING.md`. Common first checks:
- `curl https://your-backend-domain.com/healthz` returns `{"ok":true}`
- Browser console shows the WebSocket connecting to `wss://.../sync` (not `ws://` in production — mixed content is blocked)
- AAD app's redirect URI exactly matches the deployed frontend URL
- `ALLOWED_ORIGINS` on the backend includes the frontend's exact origin (scheme + host, no trailing slash)
