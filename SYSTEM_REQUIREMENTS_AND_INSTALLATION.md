# System Requirements & Installation Instructions

**Supersedes** `docs/INSTALLATION_INSTRUCTIONS.md`, which describes the
original single-tab architecture (no backend, no consent flow, references an
Azure Speech key not used anywhere in this codebase) and is now out of date.
That file is kept for historical reference only — follow this one.

---

## 1. System Requirements

### To run/develop locally
| Component | Minimum | Notes |
|---|---|---|
| Node.js | 18.x | 20.x recommended; required for both `server/` and the React app |
| npm | 9.x+ | ships with Node 18+ |
| OS | Windows 10, macOS 12, or Linux | no OS-specific code paths |
| Docker | Optional | only needed if running `server/` via `docker-compose.yml` |

### To use the app (end users, in a real meeting)
| Component | Minimum | Notes |
|---|---|---|
| Browser | Chrome 90+ or Edge 90+ | **required** — Web Speech API (the transcription engine) has no meaningful support in Firefox or Safari |
| Microphone | Any, built-in or external | each participant's own mic — this app never accesses anyone else's audio |
| Internet | Stable broadband | Web Speech API sends audio to the browser vendor's cloud recognition service; WebSocket sync adds a small continuous connection to the backend |
| Microsoft 365 | Teams license, Business Basic or higher | needed to run the tab inside a real meeting |

### To deploy (admin/operator)
| Component | Requirement |
|---|---|
| Azure AD / Entra ID access | To register the app and grant Graph permissions |
| Teams admin rights | To sideload org-wide or configure setup policies (see §6) |
| Frontend hosting | Any static host with HTTPS — see `INSTALLATION.md` §7 for the comparison (Azure Static Web Apps, Vercel, Netlify, GitHub Pages) |
| Backend hosting | An **always-on** host that supports long-running Node processes and WebSockets — Azure Container Apps, Render, Railway, or Fly.io. **Cannot** be Vercel or GitHub Pages (see below) |
| LLM API key | Optional — omit to use the built-in rule-based extractor instead |

**Why the backend needs a specific kind of host:** `server/index.js` holds
live WebSocket connections and in-memory meeting state in one continuously
running process, and its reference storage layer writes to a real
filesystem. Serverless/static platforms (Vercel functions, GitHub Pages)
are stateless, short-lived, and/or have no persistent filesystem, so this
component cannot run there — only the frontend can.

---

## 2. Installation — Quick Path (local development)

```bash
# 1. Extract the bundle and install both halves
cd teams-meeting-minutes-extension
npm install
cd server && npm install && cd ..

# 2. Configure environment
cp .env.example .env                  # frontend
cp server/.env.example server/.env    # backend
# edit both files — see INSTALLATION.md §1-3 for what each value means
# and how to get it from Azure AD

# 3. Run both
cd server && npm start &              # backend on :4000
cd .. && npm start                    # frontend on :3000
```

Verify the backend is healthy before testing the tab:
```bash
curl http://localhost:4000/healthz     # expect {"ok":true}
```

For local Teams testing, the frontend must be reachable over HTTPS by the
Teams client — Teams Toolkit's dev tunnel (built into this project's
`teamsapp.yml`) handles that automatically when you run `F5` in VS Code with
the Teams Toolkit extension installed.

---

## 3. Installation — Full Setup (production)

This is the complete path: Azure AD app registration → backend deployment →
frontend deployment → Teams manifest → sideloading → org rollout. It's
detailed step-by-step in **`INSTALLATION.md`** (§1 through §6) — that
document is the authoritative full walkthrough and is not duplicated here to
avoid the two files drifting out of sync again.

Summary of the sequence:
1. Register an Azure AD app (client ID, tenant ID, client secret, Graph permissions, admin consent)
2. Deploy `server/` to an always-on host, configure its `.env`
3. Deploy the frontend to a static host, configure its `.env` with the backend's URL
4. Update `manifest/manifest.json` with your real domains and AAD app ID
5. Sideload the manifest zip into Teams and test in a real meeting
6. Optionally pin the app via a Teams admin setup policy for org-wide auto-install

---

## 4. Post-Install Verification Checklist

- [ ] `curl https://your-backend-domain.com/healthz` → `{"ok":true}`
- [ ] App appears in Teams apps list and opens in the meeting side panel
- [ ] Consent banner appears before the mic button becomes active
- [ ] Accepting consent starts transcription; text appears as you speak
- [ ] With a second participant/tab open, both see the same merged transcript in real time
- [ ] "Generate Minutes" produces a summary, key points, decisions, and action items
- [ ] Calendar icon on an action item successfully creates a real Outlook event
- [ ] `node --test test/*.test.js` in `server/` passes (11/11)

---

## 5. Uninstallation

- **Personal apps**: Teams → Apps → Laura Transcribe → right-click → Uninstall
- **From a meeting**: In-meeting → Apps → Laura Transcribe → right-click → Remove
- **Org-wide**: Teams Admin Center → Teams apps → Manage apps → Laura Transcribe → Remove
- **Azure AD app**: Azure Portal → App registrations → Laura Transcribe → Delete
- **Server-side data**: call `DELETE /api/meetings/:meetingId` per meeting, or drop the storage volume/database entirely if decommissioning

---

## 6. Troubleshooting

See `TROUBLESHOOTING.md` for the full list. Fastest first checks:
- **Blank panel** → browser console errors; confirm `validDomains` in the manifest includes both frontend and backend domains
- **"Failed to get access token"** → AAD redirect URI doesn't match the deployed frontend URL exactly, or admin consent wasn't granted
- **Transcription never starts** → wrong browser (needs Chrome/Edge), or mic permission denied at the OS level
- **Transcript not shared with others** → `REACT_APP_SYNC_ENDPOINT` unset (falls back to standalone mode by design) or the backend isn't reachable — check for a `wss://` connection in the browser Network tab
- **Minutes are low quality** → no `LLM_API_KEY` set on the backend, so the rule-based fallback is running; this is expected without a key configured
