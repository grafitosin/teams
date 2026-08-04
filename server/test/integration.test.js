/**
 * Integration test: spins up the real server (WebSocket + REST) and connects
 * two simulated participant clients over actual WebSocket connections, to
 * verify the full distributed-capture pipeline end-to-end - not just the
 * MergeEngine unit in isolation.
 */

const test = require('node:test');
const assert = require('node:assert');
const WebSocket = require('ws');

// Use a dedicated port so this doesn't collide with a dev server already running.
process.env.PORT = process.env.PORT || '4101';
process.env.STORAGE_DIR = require('path').join(__dirname, '.data-integration-test');

const { server } = require('../index');

function connectParticipant({ meetingId, participantId, speakerName }) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(
      `ws://localhost:${process.env.PORT}/sync?meetingId=${meetingId}&participantId=${participantId}&speakerName=${encodeURIComponent(speakerName)}`
    );
    const messages = [];
    ws.on('message', (raw) => messages.push(JSON.parse(raw)));
    ws.on('open', () => resolve({ ws, messages }));
    ws.on('error', reject);
  });
}

function waitFor(messages, predicate, timeoutMs = 3000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const interval = setInterval(() => {
      const found = messages.find(predicate);
      if (found) {
        clearInterval(interval);
        resolve(found);
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(interval);
        reject(new Error('Timed out waiting for expected message'));
      }
    }, 25);
  });
}

test('two participants streaming segments produce one merged, ordered transcript on both clients', async (t) => {
  const meetingId = 'integration-test-meeting-1';

  const alice = await connectParticipant({ meetingId, participantId: 'alice-1', speakerName: 'Alice' });
  const bob = await connectParticipant({ meetingId, participantId: 'bob-1', speakerName: 'Bob' });

  // Wait for both to receive their initial snapshot before sending segments.
  await waitFor(alice.messages, m => m.type === 'transcript:snapshot');
  await waitFor(bob.messages, m => m.type === 'transcript:snapshot');

  const now = Date.now();
  alice.ws.send(JSON.stringify({
    type: 'segment',
    segment: { id: 'a1', text: 'Let\'s review the roadmap', rawTimestamp: new Date(now).toISOString() }
  }));
  bob.ws.send(JSON.stringify({
    type: 'segment',
    segment: { id: 'b1', text: 'Sounds good, I agree', rawTimestamp: new Date(now + 500).toISOString() }
  }));

  const aliceUpdate = await waitFor(alice.messages, m => m.type === 'transcript:update' && m.transcript.length === 2);
  const bobUpdate = await waitFor(bob.messages, m => m.type === 'transcript:update' && m.transcript.length === 2);

  // Both participants' tabs should converge on the identical merged transcript.
  assert.deepStrictEqual(
    aliceUpdate.transcript.map(t => t.speaker),
    ['Alice', 'Bob']
  );
  assert.deepStrictEqual(
    bobUpdate.transcript.map(t => t.speaker),
    ['Alice', 'Bob']
  );
  assert.strictEqual(aliceUpdate.transcript[0].text, "Let's review the roadmap");
  assert.strictEqual(aliceUpdate.transcript[1].text, 'Sounds good, I agree');

  alice.ws.close();
  bob.ws.close();
});

test('a third participant joining late receives the full transcript already in progress', async () => {
  const meetingId = 'integration-test-meeting-1'; // same meeting as previous test - simulates late join

  const carol = await connectParticipant({ meetingId, participantId: 'carol-1', speakerName: 'Carol' });
  const snapshot = await waitFor(carol.messages, m => m.type === 'transcript:snapshot');

  assert.ok(snapshot.transcript.length >= 2, 'late joiner should see prior segments from Alice and Bob');
  carol.ws.close();
});

test.after(() => {
  server.close();
  const fs = require('fs');
  const dir = process.env.STORAGE_DIR;
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
});
