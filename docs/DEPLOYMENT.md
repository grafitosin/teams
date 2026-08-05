# Deployment Guide

## Quick Start (5 minutes)

### Option 1: Using Teams Toolkit (Recommended)

1. Install [Teams Toolkit](https://marketplace.visualstudio.com/items?itemName=TeamsDevApp.ms-teams-vscode-extension) in VS Code
2. Open this project in VS Code
3. Press F5 to debug locally
4. Teams will open with your app sideloaded

### Option 2: Manual Setup

#### 1. Install Dependencies
```bash
npm install
```


#### 2. Set Environment Variables
```bash
cp .env.example .env
# Edit .env with your Azure AD app details
```

#### 3. Run Development Server
```bash
npm start
```

#### 4. Package the App
```bash
# Create app package
npm run build

# Zip the manifest folder
# Include: manifest.json, color.png, outline.png
```

#### 5. Upload to Teams
- Open Teams
- Go to Apps → Upload custom app
- Select the zip file

## Production Deployment

### Azure Static Web Apps (Free)

```bash
# Install CLI
npm install -g @azure/static-web-apps-cli

# Build
npm run build

# Deploy
swa deploy ./build --env production
```

### Update Manifest for Production

Edit `manifest/manifest.json`:
```json
{
  "contentUrl": "https://your-production-url.com/tab",
  "websiteUrl": "https://your-production-url.com/tab"
}
```

### Update Azure AD App

Add production redirect URIs:
- `https://your-production-url.com`
- `https://your-production-url.com/auth-end`

## Troubleshooting

### Common Issues

1. **"App not found"**
   - Check manifest.json is valid
   - Ensure app ID is a valid GUID

2. **"Cannot sideload app"**
   - Enable sideloading in Teams admin settings
   - Or use Teams Developer Portal

3. **"Graph API permission denied"**
   - Grant admin consent in Azure AD
   - Or user must consent on first use

4. **"Transcription not working"**
   - Use Chrome or Edge
   - Allow microphone access
   - Check browser console for errors

## Security Notes

- Never commit `.env` file
- Store client secrets in Azure Key Vault
- Use HTTPS in production
- Validate all tokens server-side if adding backend

## Deploying the Sync/Merge Backend (server/)

The distributed-capture architecture requires the `server/` component to be
running and reachable over WebSocket + HTTPS before setting
`REACT_APP_SYNC_ENDPOINT` / `REACT_APP_API_ENDPOINT` in the tab's `.env`.
Without it, the app falls back to the original standalone, single-participant
behavior automatically.

### Local / Docker

```bash
cd server
cp .env.example .env
# Fill in AAD_APP_CLIENT_ID / AAD_APP_CLIENT_SECRET / STORAGE_ENCRYPTION_KEY

# Option A: run directly
npm install
npm start          # listens on :4000 (WebSocket path: /sync, REST: /api)

# Option B: docker-compose (from project root)
docker compose up --build
```

### Production checklist

1. **TLS termination**: the WebSocket endpoint must be `wss://`, not `ws://`, when the Teams tab is served over HTTPS (required by Teams) — put the server behind a reverse proxy / App Service / Container Apps ingress that terminates TLS.
2. **`STORAGE_ENCRYPTION_KEY`**: generate one and set it — without it, a random key is generated per process restart and existing encrypted data becomes unreadable.
3. **Swap file-based storage**: `server/storage.js` is a reference implementation using local files; replace `_read`/`_write` with your real datastore (Cosmos DB, Postgres, Blob Storage) before production use, especially if running multiple server instances (file storage does not scale horizontally).
4. **AAD app permissions**: grant `Calendars.ReadWrite` and `User.Read` (delegated) and ensure the On-Behalf-Of flow is enabled for the app registration.
5. **CORS**: restrict `cors()` in `server/index.js` to your Teams tab's actual origin(s) instead of the permissive default before shipping.
6. **Retention policy**: decide how long transcripts are kept and wire a scheduled job to call `MeetingStorage.deleteMeeting()` accordingly — this is a compliance requirement flagged in the gap analysis, not yet automated.
