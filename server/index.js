/**
 * Laura Transcribe - Sync/Merge Server
 *
 * Implements the "distributed local capture" architecture:
 *  - Each participant's tab keeps transcribing only their OWN microphone
 *    (unchanged from the original client-side TranscriptionService).
 *  - Each tab streams its finalized segments here over WebSocket.
 *  - MergeEngine combines all participants' segments into one ordered,
 *    speaker-attributed transcript.
 *  - The merged transcript is broadcast back to every connected tab in that
 *    meeting in real time, and persisted server-side (encrypted).
 *
 * This intentionally does NOT require org-level meeting transcription or a
 * calling bot with real-time media access.
 */

const express = require('express');
const cors = require('cors');
const http = require('http');
const { WebSocketServer } = require('ws');
const { v4: uuidv4 } = require('uuid');

const MergeEngine = require('./mergeEngine');
const MeetingStorage = require('./storage');
const MinutesGenerator = require('./minutesGenerator');
const { exchangeSsoTokenForGraphToken } = require('./oboTokenExchange');

const PORT = process.env.PORT || 4000;

const app = express();
// Restrict to your Teams tab's deployed origin(s) in production via ALLOWED_ORIGINS
// (comma-separated). Defaults to permissive for local development only.
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : true;
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// meetingId -> { engine: MergeEngine, sockets: Set<ws>, participants: Map<participantId, {name, socket}> }
const meetings = new Map();

function getOrCreateMeeting(meetingId) {
  if (!meetings.has(meetingId)) {
    const engine = new MergeEngine(meetingId);
    const record = { engine, sockets: new Set(), participants: new Map() };

    // Hydrate from persisted storage if this meeting was already in progress
    const persisted = MeetingStorage.load(meetingId);
    if (persisted.transcript && persisted.transcript.length) {
      persisted.transcript.forEach(seg => engine.addSegment(seg));
    }

    engine.onUpdate((merged) => {
      MeetingStorage.saveTranscript(meetingId, merged);
      broadcast(meetingId, { type: 'transcript:update', transcript: merged });
    });

    meetings.set(meetingId, record);
  }
  return meetings.get(meetingId);
}

function broadcast(meetingId, message, exceptSocket = null) {
  const record = meetings.get(meetingId);
  if (!record) return;
  const payload = JSON.stringify(message);
  for (const ws of record.sockets) {
    if (ws !== exceptSocket && ws.readyState === ws.OPEN) ws.send(payload);
  }
}

// ---- REST: generate minutes + fetch persisted state ----

app.get('/api/meetings/:meetingId', (req, res) => {
  const data = MeetingStorage.load(req.params.meetingId);
  res.json(data);
});

app.post('/api/meetings/:meetingId/minutes', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const meetingContext = req.body?.meetingContext || {};
    const data = MeetingStorage.load(meetingId);

    const generator = new MinutesGenerator();
    const { minutes, actionItems } = await generator.generate(data.transcript || [], meetingContext);

    MeetingStorage.saveMinutes(meetingId, minutes, actionItems);
    broadcast(meetingId, { type: 'minutes:ready', minutes, actionItems });

    res.json({ minutes, actionItems });
  } catch (err) {
    console.error('Minutes generation failed:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/meetings/:meetingId', (req, res) => {
  MeetingStorage.deleteMeeting(req.params.meetingId);
  meetings.delete(req.params.meetingId);
  res.json({ deleted: true });
});

// ---- REST: On-Behalf-Of token exchange for Outlook Calendar integration ----

app.post('/api/auth/graph-token', async (req, res) => {
  try {
    const { ssoToken } = req.body || {};
    if (!ssoToken) return res.status(400).json({ error: 'ssoToken is required' });

    const graphAccessToken = await exchangeSsoTokenForGraphToken(ssoToken);
    res.json({ graphAccessToken });
  } catch (err) {
    console.error('OBO token exchange failed:', err.aadError || err.message);
    res.status(401).json({ error: err.message, aadError: err.aadError });
  }
});

app.get('/healthz', (req, res) => res.json({ ok: true }));

// ---- WebSocket: real-time segment ingest + broadcast ----

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/sync' });

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const meetingId = url.searchParams.get('meetingId');
  const participantId = url.searchParams.get('participantId') || uuidv4();
  const speakerName = url.searchParams.get('speakerName') || 'Participant';

  if (!meetingId) {
    ws.close(1008, 'meetingId is required');
    return;
  }

  const record = getOrCreateMeeting(meetingId);
  record.sockets.add(ws);
  record.participants.set(participantId, { name: speakerName, joinedAt: new Date().toISOString() });

  // Send current merged state to the newly joined tab immediately
  ws.send(JSON.stringify({
    type: 'transcript:snapshot',
    transcript: record.engine.getMergedTranscript(),
    participants: Array.from(record.participants.entries()).map(([id, p]) => ({ id, ...p }))
  }));

  broadcast(meetingId, {
    type: 'participant:joined',
    participantId,
    speakerName,
    participants: Array.from(record.participants.entries()).map(([id, p]) => ({ id, ...p }))
  });

  ws.on('message', (raw) => {
    let message;
    try { message = JSON.parse(raw); } catch { return; }

    if (message.type === 'clock:sync') {
      record.engine.recordClockOffset(participantId, message.clientTime);
      return;
    }

    if (message.type === 'segment') {
      record.engine.addSegment({
        ...message.segment,
        participantId,
        speakerName: message.segment.speakerName || speakerName
      });
      return;
    }

    if (message.type === 'consent:granted') {
      broadcast(meetingId, { type: 'consent:update', participantId, speakerName, granted: true });
    }
  });

  ws.on('close', () => {
    record.sockets.delete(ws);
    record.participants.delete(participantId);
    broadcast(meetingId, {
      type: 'participant:left',
      participantId,
      participants: Array.from(record.participants.entries()).map(([id, p]) => ({ id, ...p }))
    });
  });
});

server.listen(PORT, () => {
  console.log(`Laura Transcribe sync server listening on :${PORT}`);
});

module.exports = { app, server };
