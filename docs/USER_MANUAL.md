# Laura Transcribe App - User Manual

## Table of Contents
1. [Getting Started](#getting-started)
2. [Installing the App](#installing-the-app)
3. [Using During a Meeting](#using-during-a-meeting)
4. [Understanding the Interface](#understanding-the-interface)
5. [Transcription Features](#transcription-features)
6. [Generating Minutes](#generating-minutes)
7. [Managing Action Items](#managing-action-items)
8. [Creating Outlook Calendar Events](#creating-outlook-calendar-events)
9. [Sharing Minutes](#sharing-minutes)
10. [Troubleshooting](#troubleshooting)
11. [FAQ](#faq)

---

## Getting Started

### What is Laura Transcribe?

Laura Transcribe is a Microsoft Teams meeting extension that helps you:
- **Transcribe meetings in real-time** without recording them
- **Automatically generate structured Minutes of Meeting (MoM)**
- **Extract action items** and create them as Outlook calendar events
- **Share minutes** directly in the meeting chat

### Key Benefits

| Benefit | Description |
|---------|-------------|
| **No Recording** | Audio is processed live and never stored |
| **Privacy First** | All data stays in your browser |
| **Time Saving** | Automatic MoM generation saves 15-20 minutes per meeting |
| **Action Tracking** | Never miss a follow-up task |
| **Calendar Integration** | One-click event creation in Outlook |

---

## Installing the App

### Method 1: Sideload in Teams (For Testing)

1. **Download the app package** (ZIP file containing manifest)
2. **Open Microsoft Teams** (Desktop or Web)
3. Click **Apps** in the left sidebar
4. Click **Manage your apps** at the bottom
5. Click **Upload an app** → **Upload custom app**
6. Select the ZIP file
7. The app will appear in your apps list

### Method 2: Add to a Specific Meeting

1. **Join or schedule a Teams meeting**
2. Click **Apps** (plus icon) in the meeting toolbar
3. Search for **"Laura Transcribe"**
4. Click **Add**
5. The app panel opens on the right side

### Method 3: Add to All Meetings (Admin)

> Requires Teams admin privileges

1. Go to **Teams Admin Center**
2. Navigate to **Teams apps** → **Setup policies**
3. Edit the policy or create a new one
4. Under **Installed apps**, click **Add apps**
5. Search for "Laura Transcribe"
6. Click **Add** → **Save**

---

## Using During a Meeting

### Step 1: Open the App

After adding the app to your meeting, you'll see the **Laura Transcribe** panel on the right side of your Teams window.

```
┌─────────────────────────────────────────────────────────────┐
│  Teams Meeting Window                                        │
│                                                              │
│  ┌──────────────────────────┐  ┌─────────────────────────┐  │
│  │                          │  │  Laura Transcribe        │  │
│  │  Meeting Participants    │  │  ─────────────────────  │  │
│  │                          │  │  [🎤] [📄] [💾] [📋]     │  │
│  │  [Video Feeds]           │  │                         │  │
│  │                          │  │  Transcript | Minutes   │  │
│  │                          │  │  | Actions              │  │
│  │                          │  │                         │  │
│  │                          │  │  [Transcript content    │  │
│  │                          │  │   appears here]        │  │
│  │                          │  │                         │  │
│  └──────────────────────────┘  └─────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Step 2: Start Transcription

1. Click the **microphone button** (🎤) at the top of the panel
2. **Allow microphone access** when your browser prompts you
3. The button turns red and shows "Recording"
4. As people speak, text appears in the **Transcript** tab

> **Important**: The app does NOT record the meeting. It only converts speech to text in real-time using your browser's built-in speech recognition.

### Step 3: Generate Minutes

1. After sufficient discussion, click the **document icon** (📄)
2. The app analyzes the transcript
3. Switch to the **Minutes** tab to view the generated MoM
4. Switch to the **Actions** tab to see extracted action items

### Step 4: Create Calendar Events

1. Go to the **Actions** tab
2. Click the **calendar icon** (📅) next to any action item
3. Set the date, time, and duration
4. Add attendee emails (optional)
5. Click **Create Event**
6. The event appears in your Outlook calendar

### Step 5: Share Minutes

1. Click the **save icon** (💾) to post minutes in the meeting chat
2. Or click the **copy icon** (📋) to copy to clipboard
3. Or click the **share icon** to display on the meeting stage

---

## Understanding the Interface

### Main Toolbar

| Icon | Name | Function |
|------|------|----------|
| 🎤 | **Microphone** | Start/stop real-time transcription |
| 📄 | **Document** | Generate Minutes of Meeting |
| 💾 | **Save** | Share minutes to meeting chat |
| 📋 | **Copy** | Copy minutes to clipboard |
| ➡️ | **Share** | Display minutes on meeting stage |

### Tab Navigation

| Tab | Content |
|-----|---------|
| **Transcript** | Live speech-to-text with speaker names and timestamps |
| **Minutes** | Structured MoM with summary, key points, and decisions |
| **Actions** | Extracted action items with assignees and due dates |

### Status Indicators

| Badge | Meaning |
|-------|---------|
| 🔴 **Recording** | Transcription is active |
| ⚪ **Ready** | App is ready to transcribe |
| 🟢 **Saved** | Minutes saved to chat |

---

## Transcription Features

### How It Works

```
Your Voice → Browser Microphone → Web Speech API → Live Text
     ↑                                                      ↓
     └────────────── No Recording Stored ───────────────────┘
```

1. You speak into your microphone
2. The browser's Web Speech API converts speech to text instantly
3. Text appears in the transcript panel
4. **No audio file is created or stored**

### Speaker Identification

The app attempts to identify speakers:
- Uses your Teams display name for your own speech
- Shows "Speaker" for others (depends on microphone source)
- Each entry shows the speaker name and timestamp

### Supported Languages

The app supports these languages for transcription:

| Language | Code |
|----------|------|
| English (US) | en-US |
| English (UK) | en-GB |
| Spanish | es-ES |
| French | fr-FR |
| German | de-DE |
| Italian | it-IT |
| Portuguese (Brazil) | pt-BR |
| Chinese (Simplified) | zh-CN |
| Japanese | ja-JP |
| Korean | ko-KR |
| Hindi | hi-IN |
| Arabic | ar-SA |
| Russian | ru-RU |
| Dutch | nl-NL |
| Polish | pl-PL |

> To change language: The app uses your browser's default language. For best results, speak clearly in the selected language.

### Transcript Format

Each transcript entry shows:

```
┌─────────────────────────────────────────┐
│ John Doe        10:30:45 AM            │
│                                         │
│ "Let's discuss the Q3 marketing budget. │
│  We need to allocate funds for the     │
│  upcoming campaign."                     │
└─────────────────────────────────────────┘
```

---

## Generating Minutes

### What Gets Generated

When you click the **Generate Minutes** button, the app creates:

#### 1. Meeting Metadata
- Meeting title
- Date and time
- Duration
- List of attendees

#### 2. Summary
- A concise paragraph summarizing the meeting
- Generated using extractive summarization

#### 3. Key Discussion Points
- Important topics discussed
- Automatically extracted from the transcript
- Up to 8 key points

#### 4. Decisions Made
- Agreements and conclusions reached
- Identified using decision keywords
- Up to 10 decisions

#### 5. Action Items
- Tasks assigned during the meeting
- Includes assignee and due date (if mentioned)
- Priority level (High/Medium/Low/Normal)

### Example Generated Minutes

```markdown
📋 Minutes of Meeting

Date: Monday, July 7, 2026
Time: 10:00 AM - 11:30 AM
Duration: 1h 30m
Attendees: John Doe, Jane Smith, Bob Johnson, Alice Williams

Summary:
The team discussed the Q3 marketing strategy, reviewed current campaign 
performance, and decided to increase the digital advertising budget by 25%.
Key decisions were made regarding the product launch timeline and resource 
allocation.

Key Discussion Points:
1. Q3 marketing budget review
2. Digital advertising performance metrics
3. Product launch timeline for August
4. Resource allocation across teams
5. Customer feedback analysis

Decisions Made:
1. Increase digital advertising budget by 25%
2. Move product launch to August 15
3. Hire two additional marketing specialists
4. Switch to the new CRM platform

Action Items:
1. Prepare Q3 budget proposal - John Doe (Due: This Week) [High]
2. Contact CRM vendor for demo - Jane Smith (Due: Tomorrow) [High]
3. Update launch timeline document - Bob Johnson (Due: Next Week) [Medium]
4. Schedule team training session - Alice Williams (Due: End of Month) [Normal]
```

---

## Managing Action Items

### Action Item Card

Each action item displays:

```
┌─────────────────────────────────────────────────────────────┐
│ Prepare Q3 budget proposal                                  │
│ 👤 John Smith          📅 This Week        [HIGH]          │
│                                                             │
│                                    [📅 Create Event]       │
└─────────────────────────────────────────────────────────────┘
```

### Priority Levels

| Badge | Meaning | When Used |
|-------|---------|-----------|
| 🔴 **High** | Urgent/Critical | Keywords: urgent, asap, immediately |
| 🟡 **Medium** | Important | Keywords: soon, next week, this week |
| 🟢 **Normal** | Standard | Default priority |
| 🔵 **Low** | When possible | Keywords: eventually, later, if time |

### Due Date Detection

The app automatically detects due dates from speech:

| Spoken Phrase | Detected Due Date |
|---------------|-------------------|
| "by tomorrow" | Tomorrow |
| "this week" | This Week |
| "next week" | Next Week |
| "end of month" | End of Month |
| "as soon as possible" | ASAP |
| "by Friday" | Friday |

---

## Creating Outlook Calendar Events

### Step-by-Step Process

1. **Navigate to Actions Tab**
   - Click the **Actions** tab in the Laura Transcribe panel
   - View all extracted action items

2. **Select Action Item**
   - Find the action item you want to schedule
   - Click the **calendar icon** (📅) on the right

3. **Configure Event Details**

   ```
   ┌─────────────────────────────────────────┐
   │ Create Outlook Calendar Event            │
   ├─────────────────────────────────────────┤
   │ Task: Prepare Q3 budget proposal         │
   │ Assignee: John Smith                     │
   ├─────────────────────────────────────────┤
   │ Date: [2026-07-10    📅]                │
   │ Time: [09:00         🕐]                │
   │ Duration: [30    ] minutes              │
   │ Attendees: [email1@company.com, ...]    │
   ├─────────────────────────────────────────┤
   │ [Cancel]              [Create Event]      │
   └─────────────────────────────────────────┘
   ```

4. **Set Date and Time**
   - Use the date picker to select the date
   - Use the time picker to set the start time
   - Adjust duration (default: 30 minutes)

5. **Add Attendees (Optional)**
   - Enter email addresses separated by commas
   - These people will receive calendar invitations

6. **Create Event**
   - Click **Create Event**
   - The event is created in your Outlook calendar
   - Attendees receive invitations

### Event Content

The created calendar event includes:

```
Subject: [Action] Prepare Q3 budget proposal

Body:
─────────────────────────────────────
Action Item from Meeting

Task: Prepare Q3 budget proposal
Assigned to: John Smith
Due Date: This Week
Priority: High

Source Meeting: Q3 Marketing Strategy
Generated by: Laura Transcribe App
─────────────────────────────────────

This event was automatically created from a meeting action item.
Please update the details as needed.
```

### Calendar Event Features

| Feature | Description |
|---------|-------------|
| **Reminder** | 15-minute reminder before event |
| **Categories** | Tagged as "Laura Transcribe Action" |
| **Importance** | Matches action item priority |
| **Attendees** | Auto-invited if emails provided |

---

## Sharing Minutes

### Share to Meeting Chat

1. Click the **Save** button (💾)
2. Minutes are posted as a formatted message in the meeting chat
3. All participants can view the minutes

**Example Chat Post:**
```
📋 Minutes of Meeting
Date: Monday, July 7, 2026
Duration: 1h 30m
Attendees: John Doe, Jane Smith, Bob Johnson, Alice Williams

Summary: The team discussed the Q3 marketing strategy...

Key Discussion Points:
1. Q3 marketing budget review
2. Digital advertising performance metrics
...

Action Items:
1. Prepare Q3 budget proposal - John Doe (This Week)
2. Contact CRM vendor - Jane Smith (Tomorrow)
...
```

### Copy to Clipboard

1. Click the **Copy** button (📋)
2. Minutes are copied as plain text
3. Paste anywhere (email, document, Slack, etc.)

### Share to Meeting Stage

1. Click the **Share** button (➡️)
2. Minutes are displayed on the meeting stage
3. All participants can see it full-screen

### Export Formats

The app supports exporting minutes in:

| Format | Use Case |
|--------|----------|
| **Plain Text** | Copy-paste to any application |
| **Markdown** | Documentation, GitHub, Notion |
| **HTML** | Email, web pages |
| **Adaptive Card** | Teams chat, rich formatting |

---

## Troubleshooting

### Common Issues and Solutions

#### Issue: Transcription Not Starting

**Symptoms:** Click microphone, nothing happens

**Solutions:**
1. Check browser microphone permissions:
   - Chrome: Click lock icon in address bar → Site settings → Microphone → Allow
   - Edge: Click lock icon → Permissions → Microphone → Allow
2. Ensure you're not muted in Teams
3. Try speaking louder or closer to microphone
4. Refresh the page and try again

#### Issue: Poor Transcription Accuracy

**Symptoms:** Text doesn't match what was said

**Solutions:**
1. Speak clearly and at moderate pace
2. Minimize background noise
3. Use a headset or external microphone
4. Check your internet connection (speech recognition may use cloud services)
5. Ensure correct language is selected

#### Issue: Minutes Not Generating

**Symptoms:** Click document icon, nothing happens

**Solutions:**
1. Ensure you have transcript content (at least a few sentences)
2. Wait a moment - processing may take 5-10 seconds
3. Check browser console for errors (F12 → Console)
4. Refresh the page and try again

#### Issue: Calendar Events Not Creating

**Symptoms:** Click calendar icon, error occurs

**Solutions:**
1. Ensure you're signed into Microsoft 365
2. Check that you have calendar permissions:
   - Go to Outlook Web → Calendar → Ensure you can create events
3. The app needs permission to access your calendar:
   - First time: Click "Allow" when prompted
   - If denied: Go to Azure AD → Enterprise applications → Laura Transcribe → Permissions → Grant consent
4. Try creating the event manually in Outlook to verify permissions

#### Issue: App Not Appearing in Teams

**Symptoms:** Can't find the app after installation

**Solutions:**
1. Check if sideloading is enabled:
   - Teams Admin Center → Teams apps → Setup policies → Allow sideloading
2. Try reinstalling the app
3. Clear Teams cache:
   - Windows: `%appdata%\Microsoft\Teams` → Delete `Cache` folder
   - Mac: `~/Library/Application Support/Microsoft/Teams` → Delete `Cache` folder
4. Sign out and back into Teams

#### Issue: Data Lost After Closing Teams

**Symptoms:** Previous meeting data not available

**Solutions:**
1. Data is stored in browser localStorage
2. Ensure you're using the same browser
3. Don't clear browser data
4. For important meetings, copy minutes before closing

### Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| "Microphone permission denied" | Browser blocked mic | Allow microphone in site settings |
| "Web Speech API not supported" | Browser incompatible | Use Chrome or Edge |
| "Graph API Error" | Calendar permission issue | Grant calendar permissions |
| "Unable to authenticate" | Sign-in required | Sign into Microsoft 365 |
| "No transcript available" | Empty transcript | Start transcription first |

---

## FAQ

### General Questions

**Q: Does this app record my meetings?**
A: **No.** The app uses your browser's Web Speech API to convert speech to text in real-time. No audio is ever recorded, stored, or transmitted.

**Q: Where is my data stored?**
A: All data (transcripts, minutes, action items) is stored locally in your browser's localStorage. Nothing is sent to external servers.

**Q: Can other meeting participants see my transcript?**
A: Only if you choose to share it. The transcript is private to you until you click "Save to Chat" or "Share to Stage."

**Q: Does this work with all Teams meeting types?**
A: Yes - scheduled meetings, instant meetings, channel meetings, and webinars.

### Transcription Questions

**Q: How accurate is the transcription?**
A: Accuracy depends on speech clarity, background noise, and accent. Typically 85-95% for clear speech in quiet environments.

**Q: Can I transcribe in multiple languages in one meeting?**
A: The app uses one language at a time (your browser's default). Switching languages mid-meeting is not supported.

**Q: Does it work with screen readers?**
A: Yes, the app is built with accessibility in mind and works with screen readers.

### Minutes Questions

**Q: Can I edit the generated minutes?**
A: Currently, minutes are auto-generated. You can copy them and edit in your preferred editor. Future versions may include in-app editing.

**Q: How are action items detected?**
A: The app looks for keywords like "action item," "todo," "follow up," "will," "should," and patterns like "[Name] will [do something]."

**Q: Can I add action items manually?**
A: Currently, action items are extracted automatically. Manual addition is planned for a future update.

### Calendar Questions

**Q: Do I need an Outlook license?**
A: Yes, you need a Microsoft 365 account with Outlook calendar access.

**Q: Can I create events for other people's calendars?**
A: You can invite others, but events are created in your calendar. Others must accept the invitation to add to their calendar.

**Q: What happens if I delete the calendar event?**
A: The action item remains in the app. You can recreate the event anytime.

### Technical Questions

**Q: What browsers are supported?**
A: Chrome and Edge have full support. Firefox and Safari have limited transcription support but full calendar support.

**Q: Does this work on mobile?**
A: The Teams mobile app doesn't support meeting extensions yet. Use desktop or web Teams.

**Q: Is an internet connection required?**
A: Yes, for both transcription (cloud speech recognition) and calendar integration (Microsoft Graph API).

**Q: Can I use this without Microsoft 365?**
A: You need a Microsoft 365 account for Teams and Outlook calendar integration. The transcription feature alone works with any Teams account.

### Privacy & Security

**Q: Who can access my meeting data?**
A: Only you. Data is stored locally in your browser and never sent to external servers.

**Q: Is this compliant with GDPR/SOC2?**
A: Since no data leaves your browser (except calendar events you explicitly create), compliance is simplified. Consult your legal team for specific requirements.

**Q: Can my IT admin see my transcripts?**
A: No. Transcripts are stored locally in your browser, not on company servers.

---

## Tips for Best Results

### Before the Meeting
1. Test the app in a practice meeting
2. Ensure your microphone works properly
3. Close unnecessary browser tabs for better performance

### During the Meeting
1. Speak clearly and at a moderate pace
2. Minimize background noise
3. Ask speakers to identify themselves for better attribution
4. Use action-oriented language: "John will prepare the report by Friday"

### After the Meeting
1. Review generated minutes for accuracy
2. Create calendar events for all action items
3. Share minutes in the meeting chat
4. Export and save important minutes externally

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + Shift + T` | Start/Stop transcription |
| `Ctrl + Shift + M` | Generate minutes |
| `Ctrl + Shift + S` | Save to chat |
| `Ctrl + Shift + C` | Copy to clipboard |
| `Tab` | Navigate between tabs |
| `Esc` | Close dialogs |

> Note: Shortcuts work when the Laura Transcribe panel is focused.

---

## Getting Help

### Support Channels

| Channel | When to Use |
|---------|-------------|
| **In-app Help** | Quick questions about features |
| **Documentation** | Detailed setup and usage guides |
| **GitHub Issues** | Bug reports and feature requests |
| **Teams Community** | General questions and discussions |

### Reporting Issues

When reporting an issue, please include:
1. Browser and version
2. Teams version (desktop/web)
3. Steps to reproduce
4. Error messages (screenshots)
5. Expected vs actual behavior

---

*Document Version: 1.0.0*
*Last Updated: July 2026*
