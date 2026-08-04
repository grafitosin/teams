/**
 * OutlookCalendarService
 * Creates calendar events in user's Outlook using Microsoft Graph API
 * Requires user authentication via Teams SSO
 * NO separate Azure account needed - uses user's Microsoft 365 account
 */

class OutlookCalendarService {
  constructor({ tokenExchangeEndpoint } = {}) {
    this.graphEndpoint = 'https://graph.microsoft.com/v1.0';
    this.accessToken = null;
    // Your backend route implementing the On-Behalf-Of exchange, e.g.
    // `${API_ENDPOINT}/auth/graph-token`. See initialize() below for why.
    this.tokenExchangeEndpoint = tokenExchangeEndpoint || process.env.REACT_APP_TOKEN_EXCHANGE_ENDPOINT || null;
  }

  /**
   * Single supported auth path: Teams SSO.
   *
   * `microsoftTeams.authentication.getAuthToken` returns a short-lived Teams
   * SSO token scoped to YOUR app's Azure AD app registration - it is NOT a
   * Graph token by itself. To actually call Graph you must exchange it on
   * your backend using the On-Behalf-Of (OBO) flow:
   *
   *   1. Client calls getAuthToken() -> gets the Teams SSO token below.
   *   2. Client sends that token to your backend (e.g. POST /api/graph-token).
   *   3. Backend calls Azure AD token endpoint with grant_type=
   *      urn:ietf:params:oauth:grant-type:jwt-bearer (OBO), using your app's
   *      client secret/certificate, to mint a real Graph access token.
   *   4. Backend returns the Graph token to the client (or better: backend
   *      calls Graph directly on the client's behalf and never returns the
   *      token at all).
   *
   * The previous implementation's MSAL popup fallback is removed: it
   * required @azure/msal-browser, which was never listed as a project
   * dependency, so that path would throw at runtime. Teams SSO + backend OBO
   * is also the pattern Microsoft recommends for Teams tabs - it avoids a
   * second, redundant sign-in popup inside the Teams client.
   */
  async initialize() {
    const microsoftTeams = await import('@microsoft/teams-js');

    const ssoToken = await microsoftTeams.authentication.getAuthToken({
      resources: [process.env.REACT_APP_CLIENT_ID],
      silent: false
    });

    if (!this.tokenExchangeEndpoint) {
      throw new Error(
        'OutlookCalendarService requires a backend token-exchange endpoint. ' +
        'Set tokenExchangeEndpoint to your server route that performs the OBO exchange.'
      );
    }

    const response = await fetch(this.tokenExchangeEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ssoToken })
    });

    if (!response.ok) {
      throw new Error('Backend token exchange failed. Check server logs / AAD app configuration.');
    }

    const { graphAccessToken } = await response.json();
    this.accessToken = graphAccessToken;
    return true;
  }

  async createEvent(eventData) {
    if (!this.accessToken) {
      await this.initialize();
    }

    const eventPayload = {
      subject: eventData.subject,
      body: eventData.body || {
        contentType: 'text',
        content: ''
      },
      start: eventData.start,
      end: eventData.end,
      location: eventData.location || null,
      attendees: eventData.attendees || [],
      isOnlineMeeting: eventData.isOnlineMeeting || false,
      onlineMeetingProvider: eventData.isOnlineMeeting ? 'teamsForBusiness' : null,
      isReminderOn: eventData.isReminderOn !== false,
      reminderMinutesBeforeStart: eventData.reminderMinutesBeforeStart || 15,
      categories: eventData.categories || ['Laura Transcribe Action'],
      importance: this.mapPriorityToImportance(eventData.priority)
    };

    Object.keys(eventPayload).forEach(key => {
      if (eventPayload[key] === null || eventPayload[key] === undefined) {
        delete eventPayload[key];
      }
    });

    try {
      const response = await fetch(`${this.graphEndpoint}/me/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventPayload)
      });

      if (!response.ok) {
        const errorData = await response.json();

        if (response.status === 401) {
          await this.initialize();
          return this.createEvent(eventData);
        }

        throw new Error(`Graph API Error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        eventId: data.id,
        webLink: data.webLink,
        onlineMeetingUrl: data.onlineMeeting?.joinUrl || null
      };
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw error;
    }
  }

  async createEventsForActionItems(actionItems, meetingContext) {
    const results = [];

    for (const item of actionItems) {
      try {
        const startDateTime = this.parseDueDate(item.dueDate);
        const endDateTime = new Date(startDateTime.getTime() + 30 * 60000);

        const result = await this.createEvent({
          subject: `[Action] ${item.task}`,
          body: {
            contentType: 'HTML',
            content: this.generateActionItemBody(item, meetingContext)
          },
          start: {
            dateTime: startDateTime.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          end: {
            dateTime: endDateTime.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          attendees: item.assigneeEmail ? [{
            emailAddress: { address: item.assigneeEmail },
            type: 'required'
          }] : [],
          isReminderOn: true,
          reminderMinutesBeforeStart: 15,
          priority: item.priority
        });

        results.push({
          actionItem: item,
          success: true,
          eventId: result.eventId,
          link: result.webLink
        });
      } catch (error) {
        results.push({
          actionItem: item,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  generateActionItemBody(actionItem, meetingContext) {
    const esc = this.escapeHtml;
    return `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px;">
        <h2 style="color: #6264A7;">Action Item from Meeting</h2>

        <div style="background: #f3f2f1; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Task:</strong> ${esc(actionItem.task)}</p>
          <p><strong>Assigned to:</strong> ${esc(actionItem.assignee || 'TBD')}</p>
          <p><strong>Due Date:</strong> ${esc(actionItem.dueDate || 'TBD')}</p>
          <p><strong>Priority:</strong> ${esc(actionItem.priority || 'Normal')}</p>
        </div>

        ${meetingContext ? `
        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e1e1e1;">
          <p style="color: #616161; font-size: 12px;">
            <strong>Source Meeting:</strong> ${esc(meetingContext.meeting?.meetingTitle || 'Meeting')}<br/>
            <strong>Generated by:</strong> Laura Transcribe App
          </p>
        </div>
        ` : ''}

        <div style="margin-top: 24px; padding: 12px; background: #f0f0f0; border-left: 4px solid #6264A7;">
          <p style="margin: 0; font-size: 13px; color: #333;">
            This event was automatically created from a meeting action item. 
            Please update the details as needed.
          </p>
        </div>
      </div>
    `;
  }

  parseDueDate(dueDateStr) {
    const now = new Date();

    if (!dueDateStr) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      return tomorrow;
    }

    const lowerStr = dueDateStr.toLowerCase();

    if (lowerStr.includes('today')) {
      now.setHours(17, 0, 0, 0);
      return now;
    }

    if (lowerStr.includes('tomorrow')) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      return tomorrow;
    }

    if (lowerStr.includes('next week')) {
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7);
      nextWeek.setHours(9, 0, 0, 0);
      return nextWeek;
    }

    if (lowerStr.includes('this week')) {
      const thisWeek = new Date(now);
      thisWeek.setDate(thisWeek.getDate() + 2);
      thisWeek.setHours(9, 0, 0, 0);
      return thisWeek;
    }

    if (lowerStr.includes('asap')) {
      now.setHours(now.getHours() + 2);
      return now;
    }

    const parsed = new Date(dueDateStr);
    if (!isNaN(parsed.getTime())) {
      parsed.setHours(9, 0, 0, 0);
      return parsed;
    }

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    return tomorrow;
  }

  mapPriorityToImportance(priority) {
    const map = {
      'High': 'high',
      'Medium': 'normal',
      'Normal': 'normal',
      'Low': 'low'
    };
    return map[priority] || 'normal';
  }

  async getCalendars() {
    if (!this.accessToken) {
      await this.initialize();
    }

    const response = await fetch(`${this.graphEndpoint}/me/calendars`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch calendars');
    }

    const data = await response.json();
    return data.value;
  }

  async checkPermissions() {
    try {
      await this.initialize();
      const response = await fetch(`${this.graphEndpoint}/me/calendar`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export default OutlookCalendarService;