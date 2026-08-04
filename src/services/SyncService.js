/**
 * SyncService
 * Connects this participant's tab to the sync/merge backend over WebSocket.
 * Sends locally-transcribed segments (from TranscriptionService, which still
 * only ever hears this participant's own microphone) and receives back the
 * merged, all-participant transcript maintained by the server's MergeEngine.
 *
 * This is the piece that turns N independent local transcriptions into one
 * shared meeting transcript, without requiring org-level meeting
 * transcription or a calling bot.
 */

class SyncService {
  constructor({ syncEndpoint, meetingId, participantId, speakerName }) {
    this.syncEndpoint = syncEndpoint; // e.g. wss://your-app-domain.com/sync
    this.meetingId = meetingId;
    this.participantId = participantId;
    this.speakerName = speakerName;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectDelayMs = 15000;
    this.onTranscriptUpdate = null;
    this.onParticipantsUpdate = null;
    this.onMinutesReady = null;
    this.onConnectionChange = null;
    this._manuallyClosed = false;
    this._clockSyncInterval = null;
  }

  connect() {
    this._manuallyClosed = false;
    const url = `${this.syncEndpoint}?meetingId=${encodeURIComponent(this.meetingId)}` +
      `&participantId=${encodeURIComponent(this.participantId)}` +
      `&speakerName=${encodeURIComponent(this.speakerName)}`;

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this._notifyConnection(true);
      this._syncClock();
      this._clockSyncInterval = setInterval(() => this._syncClock(), 60000);
    };

    this.ws.onmessage = (event) => {
      let message;
      try { message = JSON.parse(event.data); } catch { return; }

      switch (message.type) {
        case 'transcript:snapshot':
        case 'transcript:update':
          this.onTranscriptUpdate?.(message.transcript);
          if (message.participants) this.onParticipantsUpdate?.(message.participants);
          break;
        case 'participant:joined':
        case 'participant:left':
          this.onParticipantsUpdate?.(message.participants);
          break;
        case 'minutes:ready':
          this.onMinutesReady?.(message.minutes, message.actionItems);
          break;
        default:
          break;
      }
    };

    this.ws.onclose = () => {
      clearInterval(this._clockSyncInterval);
      this._notifyConnection(false);
      if (!this._manuallyClosed) this._scheduleReconnect();
    };

    this.ws.onerror = (err) => {
      console.error('SyncService WebSocket error:', err);
    };
  }

  _scheduleReconnect() {
    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, this.maxReconnectDelayMs);
    this.reconnectAttempts += 1;
    setTimeout(() => {
      if (!this._manuallyClosed) this.connect();
    }, delay);
  }

  _syncClock() {
    this._send({ type: 'clock:sync', clientTime: new Date().toISOString() });
  }

  _notifyConnection(connected) {
    this.onConnectionChange?.(connected);
  }

  /** Called by TranscriptionService's onTranscript callback for each finalized (non-interim) segment. */
  sendSegment(entry) {
    this._send({
      type: 'segment',
      segment: {
        id: entry.id,
        text: entry.text,
        rawTimestamp: entry.rawTimestamp,
        speakerName: this.speakerName
      }
    });
  }

  sendConsentGranted() {
    this._send({ type: 'consent:granted' });
  }

  _send(payload) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  disconnect() {
    this._manuallyClosed = true;
    clearInterval(this._clockSyncInterval);
    if (this.ws) this.ws.close();
  }
}

export default SyncService;
