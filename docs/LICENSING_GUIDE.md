# Licensing Guide - Laura Transcribe App for Corporate Use

## Short Answer

**YES, you can use this solution in the corporate sector with standard Microsoft 365 licenses.**

**NO additional paid licenses are required** for the core functionality (transcription, minutes generation, action items, calendar events).

---

## What You Need (Minimum Requirements)

| Requirement | License Needed | Cost | Notes |
|-------------|---------------|------|-------|
| **Microsoft Teams** | Microsoft 365 Business Basic (or higher) | Included in M365 | Minimum plan with Teams access |
| **Outlook Calendar** | Microsoft 365 Business Basic (or higher) | Included in M365 | For creating calendar events |
| **Azure AD App Registration** | Free tier | **$0** | Register app at portal.azure.com |
| **Microsoft Graph API** | Standard M365 | Included in M365 | `Calendars.ReadWrite` is free with M365 |
| **Web Speech API** | Browser-native | **$0** | Chrome/Edge built-in, no license needed |
| **App Hosting** | Your server / localhost | Variable | Can host on free tiers (Azure Static Web Apps, GitHub Pages) |

---

## What You Do NOT Need to Pay For

| Feature | Why It's Free |
|---------|--------------|
| **Real-time transcription** | Uses browser's Web Speech API (built into Chrome/Edge) |
| **Minutes generation** | Rule-based NLP runs entirely in the browser |
| **Action item extraction** | Local processing, no external AI service |
| **Calendar event creation** | Microsoft Graph API `Calendars.ReadWrite` is included with M365 |
| **Data storage** | Browser localStorage (no cloud database needed) |
| **Teams app sideloading** | Free for organization apps |
| **Azure AD authentication** | Free tier supports unlimited app registrations |

---

## Microsoft 365 License Comparison

| Plan | Teams | Outlook Calendar | Graph API | Cost (approx) | Works? |
|------|-------|------------------|-----------|---------------|--------|
| **Microsoft 365 Business Basic** | ✅ | ✅ | ✅ | $6/user/month | ✅ Yes |
| **Microsoft 365 Business Standard** | ✅ | ✅ | ✅ | $12.50/user/month | ✅ Yes |
| **Microsoft 365 Business Premium** | ✅ | ✅ | ✅ | $22/user/month | ✅ Yes |
| **Microsoft 365 E3** | ✅ | ✅ | ✅ | $36/user/month | ✅ Yes |
| **Microsoft 365 E5** | ✅ | ✅ | ✅ | $57/user/month | ✅ Yes |

> **All Microsoft 365 plans include the necessary permissions.** No Teams Premium or E5 required.

---

## Teams Premium - Is It Needed?

**NO.** Teams Premium is NOT required for this app.

Teams Premium ($7/user/month add-on) is only needed for:
- Advanced meeting protection (watermarks, encryption)
- Custom meeting branding/themes
- AI-generated meeting recaps (Microsoft's feature, not this app)
- Priority account chat controls
- Advanced webinar features

Your app provides **independent transcription and minutes generation** that works with any Teams license.

---

## Azure Costs

| Azure Service | Needed? | Cost |
|--------------|---------|------|
| **Azure AD App Registration** | Yes | **$0** (Free tier) |
| **Azure Static Web Apps** | Optional hosting | **$0** (Free tier: 100 GB bandwidth/month) |
| **Azure Speech Services** | No | $0 (App uses browser Web Speech API instead) |
| **Azure Bot Service** | No | $0 (App doesn't use a bot) |
| **Azure OpenAI** | No | $0 (App uses rule-based NLP, not LLM API) |

---

## Admin Consent Requirements

| Permission | Admin Consent Required? | Notes |
|------------|------------------------|-------|
| `Calendars.ReadWrite` (Delegated) | **No** | User consents on first use |
| `User.Read` (Delegated) | **No** | Basic profile, auto-consented |
| `OnlineMeetings.Read` (Delegated) | **No** | Meeting context info |
| `MeetingStage.Write.Chat` (RSC) | **Yes** | Teams admin must approve in Admin Center |

**For corporate deployment:**
- IT admin needs to approve the app in Teams Admin Center
- IT admin needs to grant RSC permissions (one-time)
- Individual users do NOT need admin approval to use the app

---

## Corporate Deployment Checklist (No Extra Licensing)

```
□ Microsoft 365 licenses for all users (Business Basic or higher)
□ Azure AD app registration (Free - register at portal.azure.com)
□ Teams Admin approval for the app (Free - approve in Teams Admin Center)
□ App hosting (Free options: Azure Static Web Apps, GitHub Pages, or internal server)
□ Valid SSL certificate for HTTPS (Free: Let's Encrypt)
```

**Total additional cost: $0**

---

## What If I Don't Have Microsoft 365?

| Alternative | Limitations |
|-------------|-------------|
| **Microsoft Teams (free)** | No Outlook calendar integration, limited app support |
| **Google Workspace** | Would require rebuilding for Google Meet (different API) |
| **Zoom** | Would require Zoom SDK integration (different architecture) |

**The app is specifically built for Microsoft Teams + Microsoft 365.**

---

## Security & Compliance (Corporate Concerns)

| Concern | How This App Addresses It |
|---------|--------------------------|
| **Data residency** | All data stays in user's browser (localStorage) |
| **No audio recording** | Web Speech API processes audio in real-time, never stores it |
| **No external servers** | No backend server processes meeting data |
| **GDPR/SOC2** | Simplified compliance since no data leaves the browser |
| **Audit trail** | Calendar events created via Microsoft Graph are logged in Exchange Online |

---

## Summary

| Question | Answer |
|----------|--------|
| Can we use this without buying new licenses? | **Yes** - Works with existing M365 licenses |
| Do we need Teams Premium? | **No** - Not required |
| Do we need Azure subscription? | **No** - App registration is free |
| Do we need to pay for transcription? | **No** - Browser Web Speech API is free |
| Do we need to pay for calendar integration? | **No** - Graph API included with M365 |
| Is there any per-user cost for this app? | **No** - Once deployed, unlimited users at $0 |

---

## Official Microsoft References

- Microsoft Graph permissions: `Calendars.ReadWrite` delegated permission requires no admin consent for user-level calendar access
- Teams app deployment: Organization apps can be deployed at no additional cost beyond M365 licensing
- Azure AD: Free tier supports unlimited app registrations and basic authentication

---

*Last Updated: July 2026*
*Disclaimer: Licensing terms are subject to change by Microsoft. Verify current terms at microsoft.com/licensing.*
