const test = require('node:test');
const assert = require('node:assert');
const MergeEngine = require('../mergeEngine');

test('merges same-speaker segments within combine window', () => {
  const engine = new MergeEngine('m1');
  engine.addSegment({ participantId: 'p1', speakerName: 'Alice', text: 'Hello team', rawTimestamp: '2026-07-27T10:00:00.000Z' });
  engine.addSegment({ participantId: 'p1', speakerName: 'Alice', text: 'lets get started', rawTimestamp: '2026-07-27T10:00:01.500Z' });

  const merged = engine.getMergedTranscript();
  assert.strictEqual(merged.length, 1);
  assert.strictEqual(merged[0].text, 'Hello team lets get started');
});

test('keeps interleaved different-speaker segments separate', () => {
  const engine = new MergeEngine('m2');
  engine.addSegment({ participantId: 'p1', speakerName: 'Alice', text: 'What do you think?', rawTimestamp: '2026-07-27T10:00:00.000Z' });
  engine.addSegment({ participantId: 'p2', speakerName: 'Bob', text: 'Sounds good to me', rawTimestamp: '2026-07-27T10:00:01.000Z' });

  const merged = engine.getMergedTranscript();
  assert.strictEqual(merged.length, 2);
  assert.strictEqual(merged[0].speaker, 'Alice');
  assert.strictEqual(merged[1].speaker, 'Bob');
});

test('orders segments by timestamp regardless of arrival order', () => {
  const engine = new MergeEngine('m3');
  engine.addSegment({ participantId: 'p2', speakerName: 'Bob', text: 'Second thing said', rawTimestamp: '2026-07-27T10:00:05.000Z' });
  engine.addSegment({ participantId: 'p1', speakerName: 'Alice', text: 'First thing said', rawTimestamp: '2026-07-27T10:00:00.000Z' });

  const merged = engine.getMergedTranscript();
  assert.strictEqual(merged[0].text, 'First thing said');
  assert.strictEqual(merged[1].text, 'Second thing said');
});

test('clock offset correction realigns a drifted participant timestamp', () => {
  const engine = new MergeEngine('m4');
  // participant's clock is 10s ahead of server
  engine.recordClockOffset('p1', new Date(Date.now() + 10000).toISOString(), Date.now());
  const seg = engine.addSegment({ participantId: 'p1', speakerName: 'Alice', text: 'hi', rawTimestamp: new Date(Date.now() + 10000).toISOString() });
  const skewMs = Math.abs(new Date(seg.rawTimestamp).getTime() - Date.now());
  assert.ok(skewMs < 1000, `expected corrected timestamp near now, skew was ${skewMs}ms`);
});

test('ignores empty/whitespace-only segments', () => {
  const engine = new MergeEngine('m5');
  const result = engine.addSegment({ participantId: 'p1', speakerName: 'Alice', text: '   ', rawTimestamp: new Date().toISOString() });
  assert.strictEqual(result, null);
  assert.strictEqual(engine.getMergedTranscript().length, 0);
});
