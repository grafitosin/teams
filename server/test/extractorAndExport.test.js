const test = require('node:test');
const assert = require('node:assert');
const RuleBasedExtractor = require('../ruleBasedExtractor');
const { escapeHtml, exportToHTML } = require('../exportUtil');

test('extracts an action item with assignee and due date', () => {
  const extractor = new RuleBasedExtractor();
  const transcript = [
    { speaker: 'Alice', text: 'Bob will send the report by tomorrow.' }
  ];
  const items = extractor.extractActionItems(transcript);
  assert.ok(items.some(i => /send the report/i.test(i.task)));
});

test('detects a decision sentence', () => {
  const extractor = new RuleBasedExtractor();
  const transcript = [{ speaker: 'Alice', text: 'We decided to move the launch to next quarter.' }];
  const decisions = extractor.extractDecisions(transcript);
  assert.ok(decisions.length > 0);
});

test('escapeHtml neutralizes script tags', () => {
  const dangerous = '<script>alert(1)</script>';
  const escaped = escapeHtml(dangerous);
  assert.ok(!escaped.includes('<script>'));
  assert.ok(escaped.includes('&lt;script&gt;'));
});

test('exportToHTML escapes malicious transcript-derived content', () => {
  const minutes = {
    meetingTitle: '<img src=x onerror=alert(1)>',
    date: 'Monday, July 27, 2026',
    startTime: '10:00 AM',
    endTime: '10:30 AM',
    duration: '30m',
    attendees: ['Alice', '<b>Bob</b>'],
    summary: 'Discussed <script>evil()</script> roadmap.',
    keyPoints: [],
    decisions: []
  };
  const actionItems = [{ task: '"><script>evil()</script>', assignee: 'Alice', dueDate: 'Today', priority: 'High' }];

  const html = exportToHTML(minutes, actionItems);
  assert.ok(!html.includes('<script>evil()</script>'));
  assert.ok(!html.includes('<img src=x onerror=alert(1)>'));
});
