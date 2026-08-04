/**
 * MergeEngine
 * Combines transcript segments arriving independently from each participant's
 * tab (each running local Web Speech capture of only their own mic) into a
 * single, ordered, speaker-attributed meeting timeline.
 *
 * Design notes:
 * - Segments are ordered by rawTimestamp (ISO string, client-clock based).
 *   Clients periodically sync their clock offset against the server so
 *   ordering stays stable even if a laptop's clock drifts (see
 *   `recordClockOffset` / `adjustTimestamp`).
 * - Adjacent-in-time segments from the SAME participant are combined,
 *   mirroring the client-side buffering already used by TranscriptionService.
 * - Overlapping speech from DIFFERENT participants is preserved as separate,
 *   interleaved entries rather than merged into one line, so a reader can see
 *   that people were talking over each other.
 */

class MergeEngine {
  constructor(meetingId) {
    this.meetingId = meetingId;
    this.segments = [];          // all raw segments received so far
    this.clockOffsets = new Map(); // participantId -> ms offset (client - server)
    this.listeners = new Set();  // callbacks notified on every merge update
  }

  /** Called when a participant tab reports its perceived server time, to correct clock drift. */
  recordClockOffset(participantId, clientTimeIso, serverReceivedAt = Date.now()) {
    const clientTime = new Date(clientTimeIso).getTime();
    this.clockOffsets.set(participantId, clientTime - serverReceivedAt);
  }

  adjustTimestamp(participantId, rawTimestampIso) {
    const offset = this.clockOffsets.get(participantId) || 0;
    const t = new Date(rawTimestampIso).getTime() - offset;
    return new Date(t).toISOString();
  }

  /**
   * Ingest one finalized transcript segment from a participant's tab.
   * segment: { id, participantId, speakerName, text, rawTimestamp, isInterim }
   */
  addSegment(segment) {
    if (!segment || !segment.text || !segment.text.trim()) return null;

    const adjustedTimestamp = this.adjustTimestamp(segment.participantId, segment.rawTimestamp);

    const normalized = {
      id: segment.id || `${segment.participantId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      participantId: segment.participantId,
      speaker: segment.speakerName || 'Unknown',
      text: segment.text.trim(),
      rawTimestamp: adjustedTimestamp,
      receivedAt: new Date().toISOString()
    };

    this.segments.push(normalized);
    this.segments.sort((a, b) => new Date(a.rawTimestamp) - new Date(b.rawTimestamp));

    const merged = this.getMergedTranscript();
    this._notify(merged);
    return normalized;
  }

  /** Combine adjacent same-speaker segments (mirrors client-side buffering, applied globally). */
  getMergedTranscript({ combineWindowMs = 4000 } = {}) {
    if (this.segments.length === 0) return [];

    const combined = [];
    let current = { ...this.segments[0] };

    for (let i = 1; i < this.segments.length; i++) {
      const seg = this.segments[i];
      const gap = new Date(seg.rawTimestamp) - new Date(current.rawTimestamp);

      if (seg.participantId === current.participantId && gap >= 0 && gap < combineWindowMs) {
        current.text += ' ' + seg.text;
        current.rawTimestamp = seg.rawTimestamp;
      } else {
        combined.push(current);
        current = { ...seg };
      }
    }
    combined.push(current);
    return combined;
  }

  onUpdate(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  _notify(merged) {
    for (const cb of this.listeners) {
      try { cb(merged); } catch (e) { console.error('MergeEngine listener error:', e); }
    }
  }

  getParticipants() {
    return Array.from(new Set(this.segments.map(s => s.speaker)));
  }

  reset() {
    this.segments = [];
  }
}

module.exports = MergeEngine;
