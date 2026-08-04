# Quick Reference

## Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm start` | Start development server |
| `npm run build` | Build for production |
| `npm test` | Run tests |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `REACT_APP_CLIENT_ID` | Yes | Azure AD app client ID |
| `REACT_APP_TENANT_ID` | Yes | Azure AD tenant ID |
| `REACT_APP_TAB_ENDPOINT` | Yes | App URL |
| `REACT_APP_SPEECH_KEY` | No | Azure Speech key (optional) |

## File Locations

| File | Purpose |
|------|---------|
| `src/App.js` | Main app entry |
| `src/components/LauraTranscribePanel.js` | Main UI |
| `src/services/TranscriptionService.js` | Speech-to-text |
| `src/services/MinutesGenerator.js` | MoM generation |
| `src/services/OutlookCalendarService.js` | Calendar events |
| `manifest/manifest.json` | Teams app config |

## API Permissions Needed

| Permission | Purpose |
|------------|---------|
| `Calendars.ReadWrite` | Create calendar events |
| `User.Read` | Get user info |
| `OnlineMeetings.Read` | Meeting context |

## Browser Support

| Feature | Chrome | Edge | Firefox | Safari |
|---------|--------|------|---------|--------|
| Transcription | ✅ | ✅ | ⚠️ | ⚠️ |
| Calendar | ✅ | ✅ | ✅ | ✅ |
