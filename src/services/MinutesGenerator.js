/**
 * MinutesGenerator
 * Generates structured Minutes of Meeting from transcript data
 * Uses rule-based NLP - no external AI services required
 */

class MinutesGenerator {
  constructor() {
    this.actionKeywords = [
      'action item', 'action', 'todo', 'to do', 'task', 'follow up', 'follow-up',
      'responsible', 'owner', 'assign', 'deadline', 'due', 'by when', 'complete by',
      'finish by', 'deliver by', 'send by', 'prepare', 'review', 'update',
      'schedule', 'arrange', 'organize', 'contact', 'call', 'email', 'send',
      'create', 'develop', 'implement', 'deploy', 'test', 'verify', 'approve'
    ];

    this.decisionKeywords = [
      'decided', 'decision', 'agreed', 'agreement', 'concluded', 'conclusion',
      'resolved', 'resolution', 'approved', 'rejected', 'accepted',
      'we will', 'we shall', 'going to', 'plan to', 'intend to', 'committed to'
    ];

    this.priorityKeywords = {
      'high': ['urgent', 'asap', 'immediately', 'critical', 'priority', 'high priority', 'important'],
      'medium': ['soon', 'next week', 'this week', 'upcoming'],
      'low': ['when possible', 'if time', 'eventually', 'later', 'someday']
    };
  }

  async generate(transcript, meetingContext) {
    const startTime = this.getMeetingStartTime(transcript);
    const endTime = new Date();
    const duration = this.calculateDuration(startTime, endTime);

    const attendees = this.extractAttendees(transcript, meetingContext);
    const summary = this.generateSummary(transcript);
    const keyPoints = this.extractKeyPoints(transcript);
    const decisions = this.extractDecisions(transcript);
    const actionItems = this.extractActionItems(transcript);

    const minutes = {
      meetingTitle: meetingContext?.meeting?.meetingTitle || 
                   meetingContext?.chat?.name || 
                   'Laura Transcribe',
      date: startTime.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      startTime: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      endTime: endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      duration: duration,
      attendees: attendees,
      summary: summary,
      keyPoints: keyPoints,
      decisions: decisions,
      transcriptCount: transcript.length
    };

    return { minutes, actionItems };
  }

  getMeetingStartTime(transcript) {
    if (transcript.length > 0 && transcript[0].rawTimestamp) {
      return new Date(transcript[0].rawTimestamp);
    }
    return new Date();
  }

  calculateDuration(start, end) {
    const diffMs = end - start;
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }

  extractAttendees(transcript, meetingContext) {
    const speakers = new Set();

    transcript.forEach(entry => {
      if (entry.speaker) {
        speakers.add(entry.speaker);
      }
    });

    if (meetingContext?.user?.displayName) {
      speakers.add(meetingContext.user.displayName);
    }

    return Array.from(speakers).filter(s => s && s !== 'Unknown');
  }

  generateSummary(transcript) {
    if (transcript.length === 0) {
      return 'No transcript available for summary generation.';
    }

    const fullText = transcript.map(t => t.text).join(' ');
    const sentences = this.splitIntoSentences(fullText);

    if (sentences.length <= 3) {
      return fullText;
    }

    const scoredSentences = sentences.map((sentence, index) => {
      let score = 0;

      if (index < 3) score += 2;
      if (index < 5) score += 1;

      const lowerSentence = sentence.toLowerCase();
      if (lowerSentence.includes('discuss') || lowerSentence.includes('talk about')) score += 2;
      if (lowerSentence.includes('goal') || lowerSentence.includes('objective')) score += 2;
      if (lowerSentence.includes('plan') || lowerSentence.includes('strategy')) score += 1;
      if (sentence.length < 30) score -= 1;

      return { sentence, score, index };
    });

    scoredSentences.sort((a, b) => b.score - a.score);
    const topSentences = scoredSentences.slice(0, 3).sort((a, b) => a.index - b.index);

    return topSentences.map(s => s.sentence).join(' ');
  }

  extractKeyPoints(transcript) {
    const points = [];
    const fullText = transcript.map(t => t.text).join(' ');
    const sentences = this.splitIntoSentences(fullText);

    const topicPatterns = [
      /(?:discussed?|talked about|covered|went over|reviewed?)\s+(.+?)(?:\.|,|;|$)/i,
      /(?:topic|subject|matter|issue|item)\s+(?:is|was|of)\s+(.+?)(?:\.|,|;|$)/i,
      /(?:regarding|concerning|about|on)\s+(.+?)(?:\.|,|;|$)/i
    ];

    sentences.forEach(sentence => {
      topicPatterns.forEach(pattern => {
        const match = sentence.match(pattern);
        if (match && match[1]) {
          const point = match[1].trim();
          if (point.length > 10 && point.length < 200 && !points.includes(point)) {
            points.push(point);
          }
        }
      });
    });

    if (points.length === 0) {
      const importantSentences = sentences.filter(s => {
        const lower = s.toLowerCase();
        return lower.includes('important') || 
               lower.includes('key') || 
               lower.includes('main') ||
               lower.includes('focus') ||
               lower.includes('primary');
      });

      importantSentences.slice(0, 5).forEach(s => {
        if (!points.includes(s)) points.push(s);
      });
    }

    return points.slice(0, 8);
  }

  extractDecisions(transcript) {
    const decisions = [];
    const fullText = transcript.map(t => t.text).join(' ');
    const sentences = this.splitIntoSentences(fullText);

    sentences.forEach(sentence => {
      const lowerSentence = sentence.toLowerCase();

      const isDecision = this.decisionKeywords.some(keyword => 
        lowerSentence.includes(keyword.toLowerCase())
      );

      if (isDecision && sentence.length > 15) {
        let cleanDecision = sentence.trim();
        cleanDecision = cleanDecision.replace(/^[^:]+:\s*/, '');

        if (!decisions.includes(cleanDecision)) {
          decisions.push(cleanDecision);
        }
      }
    });

    return decisions.slice(0, 10);
  }

  extractActionItems(transcript) {
    const actionItems = [];

    transcript.forEach(entry => {
      const text = entry.text;
      const lowerText = text.toLowerCase();

      const hasActionKeyword = this.actionKeywords.some(keyword => 
        lowerText.includes(keyword.toLowerCase())
      );

      if (hasActionKeyword) {
        const actionItem = this.parseActionItem(text, entry.speaker);
        if (actionItem && actionItem.task.length > 5) {
          const isDuplicate = actionItems.some(existing => 
            existing.task.toLowerCase() === actionItem.task.toLowerCase()
          );

          if (!isDuplicate) {
            actionItems.push(actionItem);
          }
        }
      }
    });

    const fullText = transcript.map(t => t.text).join(' ');
    const willPattern = /(\w+(?:\s+\w+){0,2})\s+will\s+(.+?)(?:\.|by\s+|$)/gi;
    let match;

    while ((match = willPattern.exec(fullText)) !== null) {
      const assignee = match[1].trim();
      const task = match[2].trim();

      if (task.length > 5 && assignee.length > 1) {
        const isDuplicate = actionItems.some(existing => 
          existing.task.toLowerCase() === task.toLowerCase()
        );

        if (!isDuplicate) {
          actionItems.push({
            task: task,
            assignee: assignee,
            dueDate: this.extractDueDate(match[0]),
            priority: this.detectPriority(match[0]),
            source: 'pattern'
          });
        }
      }
    }

    return actionItems.slice(0, 15);
  }

  parseActionItem(text, defaultAssignee) {
    const lowerText = text.toLowerCase();

    let task = text;
    task = task.replace(/^[^:]+:\s*/, '');
    task = task.replace(/^(?:action item|action|todo|task)\s*[:-]?\s*/i, '');

    let assignee = defaultAssignee;

    const assigneePatterns = [
      /(\w+(?:\s+\w+){0,2})\s+(?:to|will|should|needs? to|has to)\s+(.+)/i,
      /(?:assign(?:ed)? to|for)\s+(\w+(?:\s+\w+){0,2})/i
    ];

    for (const pattern of assigneePatterns) {
      const match = text.match(pattern);
      if (match) {
        if (match[1] && match[2]) {
          assignee = match[1].trim();
          task = match[2].trim();
        } else if (match[1]) {
          assignee = match[1].trim();
        }
        break;
      }
    }

    const dueDate = this.extractDueDate(text);
    const priority = this.detectPriority(text);

    return {
      task: task,
      assignee: assignee,
      dueDate: dueDate,
      priority: priority,
      source: 'keyword'
    };
  }

  extractDueDate(text) {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('today')) return 'Today';
    if (lowerText.includes('tomorrow')) return 'Tomorrow';
    if (lowerText.includes('next week')) return 'Next Week';
    if (lowerText.includes('this week')) return 'This Week';
    if (lowerText.includes('end of week')) return 'End of Week';
    if (lowerText.includes('end of month')) return 'End of Month';
    if (lowerText.includes('asap') || lowerText.includes('as soon as possible')) return 'ASAP';

    const datePatterns = [
      /by\s+(\w+day)/i,
      /by\s+(\d{1,2}(?:st|nd|rd|th)?\s+(?:of\s+)?\w+)/i,
      /by\s+(\w+\s+\d{1,2}(?:st|nd|rd|th)?)/i,
      /due\s+(?:on|by)?\s*(\w+(?:day|\s+\d{1,2}))/i
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  }

  detectPriority(text) {
    const lowerText = text.toLowerCase();

    for (const [level, keywords] of Object.entries(this.priorityKeywords)) {
      if (keywords.some(kw => lowerText.includes(kw))) {
        return level.charAt(0).toUpperCase() + level.slice(1);
      }
    }

    return 'Normal';
  }

  splitIntoSentences(text) {
    return text
      .replace(/([.!?])\s+/g, "$1|")
      .split("|")
      .map(s => s.trim())
      .filter(s => s.length > 10);
  }

  exportToMarkdown(minutes, actionItems) {
    let md = `# ${minutes.meetingTitle}\n\n`;
    md += `**Date:** ${minutes.date}\n`;
    md += `**Time:** ${minutes.startTime} - ${minutes.endTime}\n`;
    md += `**Duration:** ${minutes.duration}\n`;
    md += `**Attendees:** ${minutes.attendees.join(', ')}\n\n`;

    md += `## Summary\n\n${minutes.summary}\n\n`;

    md += `## Key Discussion Points\n\n`;
    minutes.keyPoints.forEach((point, i) => {
      md += `${i + 1}. ${point}\n`;
    });
    md += `\n`;

    md += `## Decisions Made\n\n`;
    minutes.decisions.forEach((decision, i) => {
      md += `${i + 1}. ${decision}\n`;
    });
    md += `\n`;

    if (actionItems.length > 0) {
      md += `## Action Items\n\n`;
      md += `| # | Task | Assignee | Due Date | Priority |\n`;
      md += `|---|------|----------|----------|----------|\n`;
      actionItems.forEach((item, i) => {
        md += `| ${i + 1} | ${item.task} | ${item.assignee || 'TBD'} | ${item.dueDate || 'TBD'} | ${item.priority} |\n`;
      });
    }

    return md;
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

  exportToHTML(minutes, actionItems) {
    const esc = this.escapeHtml;
    let html = `<!DOCTYPE html>
<html>
<head>
  <title>${esc(minutes.meetingTitle)}</title>
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
  <ol>
    ${minutes.keyPoints.map(p => `<li>${esc(p)}</li>`).join('')}
  </ol>

  <h2>Decisions Made</h2>
  <ol>
    ${minutes.decisions.map(d => `<li>${esc(d)}</li>`).join('')}
  </ol>

  <h2>Action Items</h2>
  <table>
    <tr>
      <th>#</th>
      <th>Task</th>
      <th>Assignee</th>
      <th>Due Date</th>
      <th>Priority</th>
    </tr>
    ${actionItems.map((item, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${esc(item.task)}</td>
      <td>${esc(item.assignee || 'TBD')}</td>
      <td>${esc(item.dueDate || 'TBD')}</td>
      <td class="priority-${esc((item.priority || 'normal').toLowerCase())}">${esc(item.priority)}</td>
    </tr>
    `).join('')}
  </table>
</body>
</html>`;

    return html;
  }
}

export default MinutesGenerator;