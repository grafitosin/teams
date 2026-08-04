/**
 * RuleBasedExtractor
 * The original keyword/regex extraction logic (previously the only option,
 * in the client-side MinutesGenerator.js), kept as the automatic fallback
 * when no LLM_API_KEY is configured or the LLM call fails.
 */

class RuleBasedExtractor {
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
      high: ['urgent', 'asap', 'immediately', 'critical', 'priority', 'high priority', 'important'],
      medium: ['soon', 'next week', 'this week', 'upcoming'],
      low: ['when possible', 'if time', 'eventually', 'later', 'someday']
    };
  }

  extract(transcript) {
    return {
      summary: this.generateSummary(transcript),
      keyPoints: this.extractKeyPoints(transcript),
      decisions: this.extractDecisions(transcript),
      actionItems: this.extractActionItems(transcript),
      source: 'rule-based'
    };
  }

  generateSummary(transcript) {
    if (transcript.length === 0) return 'No transcript available for summary generation.';
    const fullText = transcript.map(t => t.text).join(' ');
    const sentences = this.splitIntoSentences(fullText);
    if (sentences.length <= 3) return fullText;

    const scored = sentences.map((sentence, index) => {
      let score = 0;
      if (index < 3) score += 2;
      if (index < 5) score += 1;
      const lower = sentence.toLowerCase();
      if (lower.includes('discuss') || lower.includes('talk about')) score += 2;
      if (lower.includes('goal') || lower.includes('objective')) score += 2;
      if (lower.includes('plan') || lower.includes('strategy')) score += 1;
      if (sentence.length < 30) score -= 1;
      return { sentence, score, index };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 3).sort((a, b) => a.index - b.index).map(s => s.sentence).join(' ');
  }

  extractKeyPoints(transcript) {
    const points = [];
    const fullText = transcript.map(t => t.text).join(' ');
    const sentences = this.splitIntoSentences(fullText);
    const patterns = [
      /(?:discussed?|talked about|covered|went over|reviewed?)\s+(.+?)(?:\.|,|;|$)/i,
      /(?:topic|subject|matter|issue|item)\s+(?:is|was|of)\s+(.+?)(?:\.|,|;|$)/i,
      /(?:regarding|concerning|about|on)\s+(.+?)(?:\.|,|;|$)/i
    ];

    sentences.forEach(sentence => {
      patterns.forEach(pattern => {
        const match = sentence.match(pattern);
        if (match && match[1]) {
          const point = match[1].trim();
          if (point.length > 10 && point.length < 200 && !points.includes(point)) points.push(point);
        }
      });
    });

    if (points.length === 0) {
      sentences.filter(s => /important|key|main|focus|primary/i.test(s)).slice(0, 5).forEach(s => {
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
      const lower = sentence.toLowerCase();
      const isDecision = this.decisionKeywords.some(k => lower.includes(k));
      if (isDecision && sentence.length > 15) {
        const clean = sentence.trim().replace(/^[^:]+:\s*/, '');
        if (!decisions.includes(clean)) decisions.push(clean);
      }
    });

    return decisions.slice(0, 10);
  }

  extractActionItems(transcript) {
    const actionItems = [];

    transcript.forEach(entry => {
      const lower = entry.text.toLowerCase();
      if (this.actionKeywords.some(k => lower.includes(k))) {
        const item = this.parseActionItem(entry.text, entry.speaker);
        if (item && item.task.length > 5 && !actionItems.some(a => a.task.toLowerCase() === item.task.toLowerCase())) {
          actionItems.push(item);
        }
      }
    });

    const fullText = transcript.map(t => t.text).join(' ');
    const willPattern = /(\w+(?:\s+\w+){0,2})\s+will\s+(.+?)(?:\.|by\s+|$)/gi;
    let match;
    while ((match = willPattern.exec(fullText)) !== null) {
      const assignee = match[1].trim();
      const task = match[2].trim();
      if (task.length > 5 && assignee.length > 1 && !actionItems.some(a => a.task.toLowerCase() === task.toLowerCase())) {
        actionItems.push({ task, assignee, dueDate: this.extractDueDate(match[0]), priority: this.detectPriority(match[0]), source: 'pattern' });
      }
    }

    return actionItems.slice(0, 15);
  }

  parseActionItem(text, defaultAssignee) {
    let task = text.replace(/^[^:]+:\s*/, '').replace(/^(?:action item|action|todo|task)\s*[:-]?\s*/i, '');
    let assignee = defaultAssignee;

    const patterns = [
      /(\w+(?:\s+\w+){0,2})\s+(?:to|will|should|needs? to|has to)\s+(.+)/i,
      /(?:assign(?:ed)? to|for)\s+(\w+(?:\s+\w+){0,2})/i
    ];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        if (match[1] && match[2]) { assignee = match[1].trim(); task = match[2].trim(); }
        else if (match[1]) { assignee = match[1].trim(); }
        break;
      }
    }

    return { task, assignee, dueDate: this.extractDueDate(text), priority: this.detectPriority(text), source: 'keyword' };
  }

  extractDueDate(text) {
    const lower = text.toLowerCase();
    if (lower.includes('today')) return 'Today';
    if (lower.includes('tomorrow')) return 'Tomorrow';
    if (lower.includes('next week')) return 'Next Week';
    if (lower.includes('this week')) return 'This Week';
    if (lower.includes('end of week')) return 'End of Week';
    if (lower.includes('end of month')) return 'End of Month';
    if (lower.includes('asap') || lower.includes('as soon as possible')) return 'ASAP';

    const patterns = [
      /by\s+(\w+day)/i,
      /by\s+(\d{1,2}(?:st|nd|rd|th)?\s+(?:of\s+)?\w+)/i,
      /by\s+(\w+\s+\d{1,2}(?:st|nd|rd|th)?)/i,
      /due\s+(?:on|by)?\s*(\w+(?:day|\s+\d{1,2}))/i
    ];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) return match[1].trim();
    }
    return null;
  }

  detectPriority(text) {
    const lower = text.toLowerCase();
    for (const [level, keywords] of Object.entries(this.priorityKeywords)) {
      if (keywords.some(k => lower.includes(k))) return level.charAt(0).toUpperCase() + level.slice(1);
    }
    return 'Normal';
  }

  splitIntoSentences(text) {
    return text.replace(/([.!?])\s+/g, '$1|').split('|').map(s => s.trim()).filter(s => s.length > 10);
  }
}

module.exports = RuleBasedExtractor;
