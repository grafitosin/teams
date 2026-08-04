/**
 * Server-side MinutesGenerator
 *
 * Upgrades the original client-side, regex/keyword-only extraction with an
 * LLM-based pass over the full merged, speaker-attributed transcript, while
 * keeping the rule-based extractor as an automatic fallback (no LLM_API_KEY
 * configured, network failure, or malformed model output).
 */

const RuleBasedExtractor = require('./ruleBasedExtractor');

const LLM_API_KEY = process.env.LLM_API_KEY;
const LLM_API_URL = process.env.LLM_API_URL || 'https://api.anthropic.com/v1/messages';
const LLM_MODEL = process.env.LLM_MODEL || 'claude-sonnet-4-6';

class MinutesGenerator {
  async generate(transcript, meetingContext) {
    const startTime = this._getStartTime(transcript);
    const endTime = new Date();
    const duration = this._duration(startTime, endTime);
    const attendees = this._attendees(transcript, meetingContext);

    let extracted;
    if (LLM_API_KEY && transcript.length > 0) {
      try {
        extracted = await this._extractWithLLM(transcript);
      } catch (err) {
        console.error('LLM extraction failed, falling back to rule-based extractor:', err.message);
        extracted = new RuleBasedExtractor().extract(transcript);
      }
    } else {
      extracted = new RuleBasedExtractor().extract(transcript);
    }

    const minutes = {
      meetingTitle: meetingContext?.meeting?.meetingTitle || meetingContext?.chat?.name || 'Laura Transcribe',
      date: startTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      startTime: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      endTime: endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      duration,
      attendees,
      summary: extracted.summary,
      keyPoints: extracted.keyPoints,
      decisions: extracted.decisions,
      transcriptCount: transcript.length,
      generatedBy: extracted.source // 'llm' | 'rule-based'
    };

    return { minutes, actionItems: extracted.actionItems };
  }

  async _extractWithLLM(transcript) {
    const transcriptText = transcript
      .map(t => `[${t.timestamp || ''}] ${t.speaker}: ${t.text}`)
      .join('\n');

    const prompt = `You are summarizing a business meeting transcript. Read the transcript below and return ONLY a JSON object (no markdown fences, no prose) with this exact shape:

{
  "summary": "2-4 sentence overview of what the meeting covered",
  "keyPoints": ["short discussion point", ...],
  "decisions": ["short decision made", ...],
  "actionItems": [{"task": "...", "assignee": "name or null", "dueDate": "e.g. 'Next Week' or null", "priority": "High|Medium|Normal|Low"}, ...]
}

Rules:
- Base everything strictly on the transcript content, do not invent facts.
- Keep each keyPoint and decision under 25 words.
- If there is not enough content for a field, return an empty array or a short honest summary noting that.

Transcript:
${transcriptText}`;

    const response = await fetch(LLM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': LLM_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const text = (data.content || []).map(c => c.text || '').join('\n').trim();
    const cleaned = text.replace(/^```json\s*|\s*```$/g, '');
    const parsed = JSON.parse(cleaned);

    return {
      summary: parsed.summary || 'No summary available.',
      keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
      decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [],
      actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems.map(a => ({
        task: a.task,
        assignee: a.assignee || null,
        dueDate: a.dueDate || null,
        priority: a.priority || 'Normal',
        source: 'llm'
      })) : [],
      source: 'llm'
    };
  }

  _getStartTime(transcript) {
    if (transcript.length > 0 && transcript[0].rawTimestamp) return new Date(transcript[0].rawTimestamp);
    return new Date();
  }

  _duration(start, end) {
    const diffMins = Math.floor((end - start) / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }

  _attendees(transcript, meetingContext) {
    const speakers = new Set(transcript.map(t => t.speaker).filter(Boolean));
    if (meetingContext?.user?.displayName) speakers.add(meetingContext.user.displayName);
    return Array.from(speakers).filter(s => s !== 'Unknown');
  }
}

module.exports = MinutesGenerator;
