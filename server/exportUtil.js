/**
 * exportUtil
 * Fixes the XSS gap identified in the original MinutesGenerator.exportToHTML,
 * which interpolated raw transcript-derived text directly into HTML with no
 * escaping. All user/meeting-derived strings now pass through escapeHtml().
 */

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function exportToMarkdown(minutes, actionItems) {
  let md = `# ${minutes.meetingTitle}\n\n`;
  md += `**Date:** ${minutes.date}\n`;
  md += `**Time:** ${minutes.startTime} - ${minutes.endTime}\n`;
  md += `**Duration:** ${minutes.duration}\n`;
  md += `**Attendees:** ${minutes.attendees.join(', ')}\n\n`;
  md += `## Summary\n\n${minutes.summary}\n\n`;
  md += `## Key Discussion Points\n\n`;
  minutes.keyPoints.forEach((point, i) => { md += `${i + 1}. ${point}\n`; });
  md += `\n## Decisions Made\n\n`;
  minutes.decisions.forEach((decision, i) => { md += `${i + 1}. ${decision}\n`; });
  if (actionItems.length > 0) {
    md += `\n## Action Items\n\n| # | Task | Assignee | Due Date | Priority |\n|---|------|----------|----------|----------|\n`;
    actionItems.forEach((item, i) => {
      md += `| ${i + 1} | ${item.task} | ${item.assignee || 'TBD'} | ${item.dueDate || 'TBD'} | ${item.priority} |\n`;
    });
  }
  return md;
}

function exportToHTML(minutes, actionItems) {
  const esc = escapeHtml;
  return `<!DOCTYPE html>
<html>
<head>
  <title>${esc(minutes.meetingTitle)}</title>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #6264A7; }
    h2 { color: #333; border-bottom: 2px solid #6264A7; padding-bottom: 8px; }
    .meta { background: #f3f2f1; padding: 16px; border-radius: 8px; margin-bottom: 20px; }
    .meta p { margin: 4px 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #6264A7; color: white; }
    tr:hover { background-color: #f5f5f5; }
    .priority-high { color: #d13438; font-weight: bold; }
    .priority-medium { color: #ffc107; font-weight: bold; }
    .priority-low { color: #107c10; }
  </style>
</head>
<body>
  <h1>${esc(minutes.meetingTitle)}</h1>
  <div class="meta">
    <p><strong>Date:</strong> ${esc(minutes.date)}</p>
    <p><strong>Time:</strong> ${esc(minutes.startTime)} - ${esc(minutes.endTime)}</p>
    <p><strong>Duration:</strong> ${esc(minutes.duration)}</p>
    <p><strong>Attendees:</strong> ${esc(minutes.attendees.join(', '))}</p>
  </div>
  <h2>Summary</h2>
  <p>${esc(minutes.summary)}</p>
  <h2>Key Discussion Points</h2>
  <ol>${minutes.keyPoints.map(p => `<li>${esc(p)}</li>`).join('')}</ol>
  <h2>Decisions Made</h2>
  <ol>${minutes.decisions.map(d => `<li>${esc(d)}</li>`).join('')}</ol>
  <h2>Action Items</h2>
  <table>
    <tr><th>#</th><th>Task</th><th>Assignee</th><th>Due Date</th><th>Priority</th></tr>
    ${actionItems.map((item, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${esc(item.task)}</td>
      <td>${esc(item.assignee || 'TBD')}</td>
      <td>${esc(item.dueDate || 'TBD')}</td>
      <td class="priority-${esc((item.priority || 'normal').toLowerCase())}">${esc(item.priority)}</td>
    </tr>`).join('')}
  </table>
</body>
</html>`;
}

module.exports = { escapeHtml, exportToMarkdown, exportToHTML };
