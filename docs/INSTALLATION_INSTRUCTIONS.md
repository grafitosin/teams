# Laura Transcribe App - Installation Instructions

> ⚠️ **OUTDATED — kept for historical reference only.** This document
> describes the original single-tab architecture (no backend server, no
> consent flow, references an Azure Speech key not used anywhere in this
> codebase). Follow **`../SYSTEM_REQUIREMENTS_AND_INSTALLATION.md`** and
> **`../INSTALLATION.md`** instead.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Method 1: Quick Install (Teams Toolkit)](#method-1-quick-install-teams-toolkit)
3. [Method 2: Manual Installation](#method-2-manual-installation)
4. [Method 3: Organization-Wide Deployment](#method-3-organization-wide-deployment)
5. [Post-Installation Configuration](#post-installation-configuration)
6. [Verification](#verification)
7. [Updating the App](#updating-the-app)
8. [Uninstallation](#uninstallation)
9. [Troubleshooting Installation](#troubleshooting-installation)

---

## Prerequisites

### Required Accounts & Access

| Requirement | Details |
|-------------|---------|
| **Microsoft 365 Account** | With Teams license (Business Basic or higher) |
| **Azure AD Access** | To register the application |
| **Teams Admin Rights** | For organization-wide deployment |
| **Node.js** | Version 16.x or higher (for building from source) |
| **npm** | Version 8.x or higher |

### System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **OS** | Windows 10 / macOS 10.15 / Linux | Windows 11 / macOS 13 |
| **Browser** | Chrome 90+, Edge 90+ | Chrome 120+, Edge 120+ |
| **RAM** | 4 GB | 8 GB |
| **Internet** | 5 Mbps | 10+ Mbps |
| **Microphone** | Built-in | External/Headset |

### Required Permissions

| Permission | Purpose | Who Needs It |
|------------|---------|--------------|
| Azure AD App Registration | Create app identity | Admin or Developer |
| Teams App Upload | Sideload custom apps | Teams Admin or User |
| Calendar.ReadWrite | Create Outlook events | End User |
| User.Read | Get user profile | End User |

---

## Method 1: Quick Install (Teams Toolkit)

> **Best for:** Developers and power users who want to test quickly
> **Time Required:** ~10 minutes
> **Difficulty:** Easy

### Step 1: Install Prerequisites

#### Install Node.js

**Windows:**
```powershell
# Download from https://nodejs.org
# Run the installer and follow prompts
# Verify installation:
node --version  # Should show v16.x.x or higher
npm --version   # Should show 8.x.x or higher
```

**macOS:**
```bash
# Using Homebrew:
brew install node@18

# Or download from https://nodejs.org

# Verify:
node --version
npm --version
```

**Linux (Ubuntu/Debian):**
```bash
# Using apt:
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify:
node --version
npm --version
```

#### Install VS Code + Teams Toolkit

1. **Download VS Code:** https://code.visualstudio.com/
2. **Install Teams Toolkit Extension:**
   - Open VS Code
   - Click Extensions (Ctrl+Shift+X)
   - Search "Teams Toolkit"
   - Click Install

### Step 2: Open Project

1. **Extract the ZIP file** to a folder
2. **Open VS Code**
3. **File → Open Folder** → Select the extracted folder
4. VS Code will detect the Teams project automatically

### Step 3: Configure Environment

1. **Create `.env` file:**
   ```bash
   # Copy the example file
   cp .env.example .env
   ```

2. **Edit `.env` with your values:**
   ```
   REACT_APP_CLIENT_ID=your-azure-ad-client-id
   REACT_APP_TENANT_ID=common
   REACT_APP_TAB_ENDPOINT=https://localhost:3000
   ```

   > **Note:** We'll get the CLIENT_ID in Step 4

### Step 4: Register Azure AD App (Automated)

Teams Toolkit can do this automatically:

1. **Press F5** in VS Code
2. Teams Toolkit will prompt you to sign in to Microsoft 365
3. Follow the prompts to:
   - Sign in with your Microsoft 365 account
   - Allow Teams Toolkit to create the Azure AD app
   - Grant necessary permissions

**What Teams Toolkit does automatically:**
- ✅ Creates Azure AD app registration
- ✅ Configures API permissions
- ✅ Sets up authentication
- ✅ Updates manifest with correct IDs
- ✅ Starts local development server
- ✅ Opens Teams with app sideloaded

### Step 5: Test the App

After pressing F5:
1. **Teams opens in browser**
2. **App is automatically sideloaded**
3. **Start a test meeting**
4. **Add the Laura Transcribe app**
5. **Test transcription and minutes generation**

---

## Method 2: Manual Installation

> **Best for:** Production deployment and custom configurations
> **Time Required:** ~30 minutes
> **Difficulty:** Intermediate

### Phase 1: Register Azure AD Application

#### Step 1.1: Access Azure Portal

1. Go to https://portal.azure.com
2. Sign in with your Microsoft 365 admin account
3. Navigate to **Azure Active Directory** (or **Microsoft Entra ID**)

#### Step 1.2: Create App Registration

```
Azure Active Directory → App registrations → New registration
```

**Fill in the form:**

| Field | Value |
|-------|-------|
| **Name** | `Teams Laura Transcribe` |
| **Supported account types** | Accounts in any organizational directory (Multitenant) and personal Microsoft accounts |
| **Redirect URI** | Single-page application (SPA) |
| **Redirect URI value** | `https://localhost:3000` |

**Click Register**

#### Step 1.3: Note Down Important IDs

After registration, you'll see the **Overview** page. Note down:

```
Application (client) ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Directory (tenant) ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Object ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**Save these somewhere safe - you'll need the Client ID**

#### Step 1.4: Configure Authentication

1. Click **Authentication** in the left menu
2. Under **Platform configurations**, click **Add a platform**
3. Select **Single-page application**
4. Add these redirect URIs:
   ```
   https://localhost:3000
   https://localhost:3000/auth-end
   https://localhost:3000/tab
   https://localhost:3000/config
   ```
5. Under **Implicit grant and hybrid flows**, check:
   - ✅ Access tokens
   - ✅ ID tokens
6. Click **Save**

#### Step 1.5: Configure API Permissions

1. Click **API permissions** in the left menu
2. Click **Add a permission**
3. Select **Microsoft Graph**
4. Select **Delegated permissions**
5. Add these permissions one by one:

| Permission | Purpose |
|------------|---------|
| `Calendars.ReadWrite` | Create calendar events |
| `Calendars.ReadWrite.Shared` | Access shared calendars |
| `User.Read` | Read user profile |
| `OnlineMeetings.Read` | Read meeting context |

6. Click **Add permissions** after each
7. Click **Grant admin consent for [Your Organization]**
   - This step requires admin privileges
   - If you don't have admin rights, users will be prompted to consent on first use

#### Step 1.6: Configure Exposed API (Optional)

If you want to use Teams SSO:

1. Click **Expose an API** in the left menu
2. Click **Add** next to **Application ID URI**
3. Use the default format: `api://{client-id}`
4. Click **Save**

### Phase 2: Prepare the Application

#### Step 2.1: Install Dependencies

Open terminal in the project folder:

```bash
# Navigate to project folder
cd teams-laura-transcribe-extension

# Install dependencies
npm install
```

**Expected output:**
```
added 1500 packages in 45s

> teams-laura-transcribe@1.0.0 postinstall
> echo "Installation complete!"
```

#### Step 2.2: Configure Environment Variables

```bash
# Copy example file
cp .env.example .env
```

**Edit `.env` file:**

```env
# Required - From Azure AD App Registration
REACT_APP_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Required - Your tenant ID or 'common' for multitenant
REACT_APP_TENANT_ID=common

# Required - Your app URL (local or production)
REACT_APP_TAB_ENDPOINT=https://localhost:3000

# Optional - For enhanced transcription (Azure Speech Services)
# REACT_APP_SPEECH_KEY=your-azure-speech-key
# REACT_APP_SPEECH_REGION=westus
```

#### Step 2.3: Update Manifest

Edit `manifest/manifest.json`:

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/teams/v1.17/MicrosoftTeams.schema.json",
  "manifestVersion": "1.17",
  "version": "1.0.0",
  "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "developer": {
    "name": "Your Organization",
    "websiteUrl": "https://www.yourcompany.com",
    "privacyUrl": "https://www.yourcompany.com/privacy",
    "termsOfUseUrl": "https://www.yourcompany.com/terms"
  },
  "icons": {
    "color": "color.png",
    "outline": "outline.png"
  },
  "name": {
    "short": "Laura Transcribe",
    "full": "Laura Transcribe & Action Items"
  },
  "description": {
    "short": "Transcribe meetings and generate minutes",
    "full": "Real-time meeting transcription, automatic minutes generation, and Outlook calendar action items."
  },
  "configurableTabs": [
    {
      "configurationUrl": "https://localhost:3000/config",
      "canUpdateConfiguration": true,
      "scopes": ["team", "groupchat"],
      "context": [
        "meetingChatTab",
        "meetingDetailsTab",
        "meetingSidePanel",
        "meetingStage"
      ]
    }
  ],
  "staticTabs": [
    {
      "entityId": "lauraTranscribe",
      "name": "Minutes",
      "contentUrl": "https://localhost:3000/tab",
      "websiteUrl": "https://localhost:3000/tab",
      "scopes": ["personal"]
    }
  ],
  "validDomains": [
    "localhost:3000",
    "login.microsoftonline.com",
    "graph.microsoft.com"
  ],
  "webApplicationInfo": {
    "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "resource": "api://localhost:3000/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  }
}
```

**Replace all `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` with your actual Client ID**

#### Step 2.4: Add App Icons

Replace placeholder icon files:

```
public/
├── color.png    (192x192 pixels, full color)
└── outline.png  (32x32 pixels, monochrome/outline)
```

**Icon Requirements:**
- `color.png`: 192x192px, PNG format, full color
- `outline.png`: 32x32px, PNG format, white outline on transparent background

### Phase 3: Build and Run

#### Step 3.1: Start Development Server

```bash
npm start
```

**Expected output:**
```
Compiled successfully!

You can now view teams-laura-transcribe in the browser.

  Local:            https://localhost:3000
  On Your Network:  https://192.168.x.x:3000

Note that the development build is not optimized.
To create a production build, use npm run build.
```

#### Step 3.2: Trust Local SSL Certificate

Your browser will show a security warning. To fix:

**Chrome/Edge:**
1. Open `https://localhost:3000`
2. Click **Advanced** → **Proceed to localhost (unsafe)**
3. The certificate is now trusted for this session

**Or generate a trusted certificate:**
```bash
# Install mkcert
npm install -g mkcert

# Create local CA
mkcert -install

# Create certificate
mkcert localhost
```

### Phase 4: Sideload in Teams

#### Step 4.1: Enable Sideloading

**Option A: Teams Admin Center (Admin)**
```
Teams Admin Center → Teams apps → Setup policies
→ Select policy → Turn ON "Upload custom apps"
→ Save
```

**Option B: Teams Client (User)**
```
Teams → Settings → Privacy
→ Turn ON "Allow sideloading of apps"
```

> **Note:** Option B may be disabled by your organization

#### Step 4.2: Create App Package

```bash
# Create manifest ZIP
cd manifest
zip -r ../laura-transcribe-app.zip .
cd ..
```

**Or manually:**
1. Select all files in the `manifest/` folder
2. Right-click → Send to → Compressed folder
3. Name it `laura-transcribe-app.zip`

#### Step 4.3: Upload to Teams

**Method A: Upload in Meeting**
```
1. Join or start a Teams meeting
2. Click Apps (plus icon) in meeting toolbar
3. Click "Upload custom app"
4. Select laura-transcribe-app.zip
5. Click "Add"
```

**Method B: Upload in Apps Section**
```
1. In Teams, click Apps in left sidebar
2. Click "Manage your apps" at bottom
3. Click "Upload an app"
4. Select "Upload custom app"
5. Select laura-transcribe-app.zip
6. Click "Add"
```

**Method C: Teams Developer Portal**
```
1. Go to https://dev.teams.microsoft.com/
2. Sign in with Microsoft 365 account
3. Click "Apps" → "Import app"
4. Upload laura-transcribe-app.zip
5. Click "Preview in Teams"
```

#### Step 4.4: Verify Installation

After uploading:
1. The app appears in your apps list
2. Open a meeting
3. Click Apps → Laura Transcribe
4. The panel opens on the right
5. Test transcription by clicking the microphone button

---

## Method 3: Organization-Wide Deployment

> **Best for:** IT administrators deploying to entire organization
> **Time Required:** ~15 minutes (after app is built)
> **Difficulty:** Intermediate

### Step 1: Build for Production

```bash
# Create optimized production build
npm run build
```

**Output:**
```
Creating an optimized production build...
Compiled successfully.

File sizes after gzip:
  245.67 KB  build/static/js/main.js
  45.23 KB   build/static/css/main.css
  12.34 KB   build/index.html

The build folder is ready to be deployed.
```

### Step 2: Deploy to Hosting

#### Option A: Azure Static Web Apps (Recommended)

```bash
# Install Azure Static Web Apps CLI
npm install -g @azure/static-web-apps-cli

# Login to Azure
az login

# Deploy
swa deploy ./build --env production
```

**Or use Azure Portal:**
```
1. Go to https://portal.azure.com
2. Create "Static Web App" resource
3. Connect to your GitHub repo or upload build folder
4. Deploy
```

#### Option B: GitHub Pages

```bash
# Install gh-pages
npm install -g gh-pages

# Update package.json homepage
# "homepage": "https://yourusername.github.io/teams-laura-transcribe"

# Deploy
gh-pages -d build
```

#### Option C: Any Web Server

Upload the `build/` folder contents to any web server:
- IIS
- Apache
- Nginx
- AWS S3
- Netlify
- Vercel

### Step 3: Update Manifest for Production

Edit `manifest/manifest.json`:

```json
{
  "contentUrl": "https://your-production-url.com/tab",
  "websiteUrl": "https://your-production-url.com/tab",
  "validDomains": [
    "your-production-url.com",
    "login.microsoftonline.com",
    "graph.microsoft.com"
  ],
  "webApplicationInfo": {
    "id": "your-client-id",
    "resource": "api://your-production-url.com/your-client-id"
  }
}
```

### Step 4: Update Azure AD App

1. Go to Azure Portal → Azure AD → App registrations
2. Select your app
3. Go to **Authentication**
4. Add production redirect URI:
   ```
   https://your-production-url.com
   https://your-production-url.com/auth-end
   ```
5. Go to **Branding**
6. Update:
   - Home page URL: `https://your-production-url.com`
   - Terms of service URL
   - Privacy statement URL

### Step 5: Publish to Teams Store

**Option A: Teams Admin Center**
```
1. Go to Teams Admin Center
2. Teams apps → Manage apps
3. Click "Upload"
4. Select the updated manifest ZIP
5. The app becomes available to all users
```

**Option B: Teams App Setup Policy**
```
1. Teams Admin Center → Teams apps → Setup policies
2. Edit "Global" policy or create new
3. Under "Installed apps", click "Add apps"
4. Search for "Laura Transcribe"
5. Click "Add" → "Save"
6. The app is automatically installed for all users
```

**Option C: Teams App Permission Policy**
```
1. Teams Admin Center → Teams apps → Permission policies
2. Create or edit policy
3. Under "Microsoft apps", allow "Laura Transcribe"
4. Assign policy to users
```

---

## Post-Installation Configuration

### User Consent Configuration

**If admin consent is not granted:**

Users will see this prompt on first use:
```
┌─────────────────────────────────────────┐
│ Laura Transcribe needs permission to:    │
│                                         │
│ ✅ Read your calendar                   │
│ ✅ Create calendar events               │
│ ✅ Read your basic profile              │
│                                         │
│ [Cancel]              [Accept]          │
└─────────────────────────────────────────┘
```

**To pre-approve for all users (Admin):**
```
Azure AD → Enterprise applications → Laura Transcribe
→ Permissions → Grant admin consent
```

### Teams Meeting Settings

**Enable app in meetings:**
```
Teams Admin Center → Meetings → Meeting policies
→ Select policy → Turn ON "Allow meeting apps"
```

### Browser Configuration

**For best transcription results:**

| Browser | Settings |
|---------|----------|
| **Chrome** | Settings → Privacy → Microphone → Allow for Teams |
| **Edge** | Settings → Cookies → Microphone → Allow for Teams |
| **Firefox** | Permissions → Microphone → Allow for Teams |

---

## Verification

### Test Checklist

After installation, verify these features:

#### Basic Functionality
- [ ] App appears in Teams apps list
- [ ] App opens in meeting side panel
- [ ] App opens in meeting stage
- [ ] App configuration page loads

#### Transcription
- [ ] Microphone button starts transcription
- [ ] Text appears as you speak
- [ ] Speaker names are shown
- [ ] Timestamps are accurate
- [ ] Stop button ends transcription

#### Minutes Generation
- [ ] Generate button creates minutes
- [ ] Summary is coherent
- [ ] Key points are relevant
- [ ] Decisions are accurate
- [ ] Action items are extracted

#### Calendar Integration
- [ ] Calendar icon opens event dialog
- [ ] Date picker works
- [ ] Event is created in Outlook
- [ ] Event has correct details
- [ ] Attendees receive invitations

#### Sharing
- [ ] Save to chat posts formatted minutes
- [ ] Copy to clipboard works
- [ ] Share to stage displays minutes

### Troubleshooting Verification Issues

| Issue | Solution |
|-------|----------|
| App doesn't appear | Check sideloading is enabled, re-upload manifest |
| Blank panel | Check browser console for errors, verify URLs in manifest |
| Transcription fails | Allow microphone, use Chrome/Edge, check internet |
| Minutes empty | Ensure sufficient transcript content (5+ sentences) |
| Calendar error | Verify Graph permissions, check user consent |

---

## Updating the App

### Minor Updates (Same Version)

1. Make code changes
2. Rebuild: `npm run build`
3. Redeploy to hosting
4. No manifest changes needed

### Major Updates (New Version)

1. Update version in `manifest.json`:
   ```json
   "version": "1.1.0"
   ```
2. Update version in `package.json`
3. Make code changes
4. Rebuild: `npm run build`
5. Redeploy to hosting
6. Create new manifest ZIP
7. Upload to Teams Admin Center or sideload again

### Update Notification

Users will see:
```
┌─────────────────────────────────────────┐
│ Update Available                         │
│                                         │
│ Laura Transcribe has been updated to      │
│ version 1.1.0                           │
│                                         │
│ [Update Now]        [Later]             │
└─────────────────────────────────────────┘
```

---

## Uninstallation

### Remove from Personal Apps

```
Teams → Apps → Laura Transcribe
→ Right-click → Uninstall
```

### Remove from Meeting

```
In meeting → Apps → Laura Transcribe
→ Right-click → Remove
```

### Remove from Organization (Admin)

```
Teams Admin Center → Teams apps → Manage apps
→ Search "Laura Transcribe" → Select
→ Click "Remove"
```

### Remove Azure AD Registration

```
Azure Portal → Azure AD → App registrations
→ Search "Teams Laura Transcribe" → Select
→ Click "Delete"
```

### Clean Up Local Data

```javascript
// In browser console (F12):
// Remove all meeting data
Object.keys(localStorage)
  .filter(k => k.startsWith('teams-laura-transcribe-'))
  .forEach(k => localStorage.removeItem(k));
```

---

## Troubleshooting Installation

### Common Errors

#### Error: "App package format is invalid"

**Cause:** Manifest JSON is malformed or missing required fields

**Solution:**
```bash
# Validate JSON
cat manifest/manifest.json | python -m json.tool

# Check required fields:
# - $schema
# - manifestVersion
# - version
# - id
# - developer
# - name
# - description
# - icons
# - validDomains
```

#### Error: "You don't have permission to upload apps"

**Cause:** Sideloading is disabled

**Solution:**
```
Teams Admin Center → Teams apps → Setup policies
→ Select user's policy → Turn ON "Upload custom apps"
→ Or ask admin to upload the app
```

#### Error: "Failed to get access token"

**Cause:** Azure AD app not configured correctly

**Solution:**
1. Verify Client ID in `.env` matches Azure AD
2. Check redirect URIs include your app URL
3. Ensure API permissions are granted
4. Try re-authenticating: Sign out and back in

#### Error: "Graph API permission denied"

**Cause:** User hasn't consented to calendar permissions

**Solution:**
```
Azure AD → Enterprise applications → Laura Transcribe
→ Permissions → Grant admin consent for [org]
```

Or tell users to:
```
First time using app → Click "Allow" when prompted
→ Sign in with Microsoft 365 → Accept permissions
```

#### Error: "Web Speech API not supported"

**Cause:** Browser doesn't support speech recognition

**Solution:**
- Use Chrome 90+ or Edge 90+
- Enable experimental features in Firefox
- Safari support is limited

#### Error: "Microphone not found"

**Cause:** No microphone detected or permission denied

**Solution:**
```
1. Check microphone is connected
2. Windows: Settings → Privacy → Microphone → Allow apps
3. macOS: System Preferences → Security → Microphone → Allow Teams
4. Browser: Click lock icon → Site settings → Microphone → Allow
```

#### Error: "CORS policy blocked request"

**Cause:** Domain not in validDomains list

**Solution:**
```json
// Add your domain to manifest.json
"validDomains": [
  "localhost:3000",
  "your-production-url.com",
  "login.microsoftonline.com",
  "graph.microsoft.com"
]
```

---

## Quick Reference Card

### Installation Commands

```bash
# Install dependencies
npm install

# Start development
npm start

# Build for production
npm run build

# Create app package
cd manifest && zip -r ../app.zip . && cd ..
```

### Key URLs

| Purpose | URL |
|---------|-----|
| Azure Portal | https://portal.azure.com |
| Teams Admin Center | https://admin.teams.microsoft.com |
| Teams Developer Portal | https://dev.teams.microsoft.com |
| Graph Explorer | https://developer.microsoft.com/graph/graph-explorer |

### File Locations

| File | Path |
|------|------|
| Manifest | `manifest/manifest.json` |
| Environment | `.env` |
| Main App | `src/App.js` |
| Transcription | `src/services/TranscriptionService.js` |
| Minutes | `src/services/MinutesGenerator.js` |
| Calendar | `src/services/OutlookCalendarService.js` |

### Support Contacts

| Issue | Contact |
|-------|---------|
| Installation problems | Your IT Admin |
| App functionality | GitHub Issues |
| Azure AD issues | Microsoft Support |
| Teams policies | Teams Admin Center |

---

*Document Version: 1.0.0*
*Last Updated: July 2026*
