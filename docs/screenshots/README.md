# Screenshots

UI mockups rendered from the actual component styling (Fluent UI colors,
layout, and copy pulled directly from `LauraTranscribePanel.js` /
`ConsentBanner.js`), plus two screenshots populated with genuinely captured
output from the real running backend. None of these are from a live Teams
client — that requires an actual deployed instance sideloaded into a real
tenant (see `../../INSTALLATION.md`).

| File | Shows |
|---|---|
| `1-consent-prompt.png` | The consent gate shown before mic capture starts |
| `2-active-merged-transcript.png` | Live merged transcript with 3 participants, sync status, interim line |
| `3-generated-minutes.png` | Generated minutes view (LLM-path styling) |
| `4-calendar-event-dialog.png` | Action items tab + Outlook event creation dialog |
| `5-coverage-gap-notice.png` | Proposed (not yet implemented) attendance-report coverage warning |
| `real-1-transcript.png` | **Real output** — actual `MergeEngine` result from 3 live WebSocket clients sending real segments to the real server |
| `real-2-minutes-actions.png` | **Real output** — actual rule-based extractor result from `POST /api/meetings/:id/minutes` against that real transcript (no LLM key set) |
| `real-test-terminal.png` | **Real output** — actual `node --test` run, 11/11 passing |
