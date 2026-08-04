# Deploying the Frontend to Vercel

The React Teams tab deploys cleanly to Vercel. The `server/` backend cannot
run on Vercel (stateful WebSocket process + filesystem storage) — deploy it
separately (Render, Railway, Fly.io, or Azure Container Apps using the
included `Dockerfile`), then point this frontend at it.

## Steps

1. **Vercel project settings**
   - Framework preset: Create React App
   - Build command: `npm run build` (default)
   - Output directory: `build`
   - Root directory: repo root

2. **Environment variables** (Vercel dashboard → Project → Settings → Environment Variables)
   ```
   REACT_APP_CLIENT_ID=<Azure AD Application (client) ID>
   REACT_APP_SYNC_ENDPOINT=wss://your-backend-host.com/sync
   REACT_APP_API_ENDPOINT=https://your-backend-host.com/api
   ```
   These are baked in at build time — changing them requires a redeploy.

3. **`vercel.json`** is already included at the project root for SPA routing.

4. **Update the Teams manifest and Azure AD app** to point at the Vercel URL:
   - `manifest/manifest.json` → add your Vercel domain to `validDomains`
   - Azure AD app registration → add the Vercel URL as a redirect URI

5. **Deploy**
   ```bash
   npm i -g vercel
   vercel --prod
   ```
   or connect the GitHub repo in the Vercel dashboard for auto-deploy on push.
