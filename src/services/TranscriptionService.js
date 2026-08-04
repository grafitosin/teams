/**
 * TranscriptionService
 * Handles real-time speech-to-text using browser's Web Speech API
 * No meeting recording is created - only live text transcription
 */

class TranscriptionService {
  constructor(meetingContext) {
    this.meetingContext = meetingContext;
    this.recognition = null;
    this.isListening = false;
    this.onTranscriptCallback = null;
    this.speakerName = 'Speaker';
    this.transcriptBuffer = [];
    this.bufferTimeout = null;

    if (meetingContext && meetingContext.user) {
      this.speakerName = meetingContext.user.userPrincipalName || 
                         meetingContext.user.displayName || 
                         'Speaker';
    }
  }

  async initialize() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      throw new Error('Web Speech API not supported in this browser. Please use Edge or Chrome.');
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;

    this.recognition.onstart = () => {
      console.log('Speech recognition started');
      this.isListening = true;
    };

    this.recognition.onend = () => {
      console.log('Speech recognition ended');
      this.isListening = false;
      if (this.onTranscriptCallback) {
        try {
          this.recognition.start();
        } catch (e) {
          console.log('Recognition already started or error:', e.message);
        }
      }
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') return;
      if (event.error === 'audio-capture') {
        console.error('No microphone found or microphone not allowed');
      }
      if (event.error === 'not-allowed') {
        console.error('Microphone permission denied');
      }
    };

    this.recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript.trim()) {
        const entry = {
          id: Date.now() + Math.random().toString(36).substr(2, 9),
          speaker: this.speakerName,
          text: finalTranscript.trim(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          rawTimestamp: new Date().toISOString(),
          isInterim: false
        };

        this.transcriptBuffer.push(entry);

        clearTimeout(this.bufferTimeout);
        this.bufferTimeout = setTimeout(() => {
          this.flushBuffer();
        }, 1500);

        if (this.transcriptBuffer.length >= 3) {
          this.flushBuffer();
        }
      }

      if (interimTranscript.trim() && this.onTranscriptCallback) {
        const interimEntry = {
          id: 'interim-' + Date.now(),
          speaker: this.speakerName,
          text: interimTranscript.trim(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          rawTimestamp: new Date().toISOString(),
          isInterim: true
        };
        this.onTranscriptCallback(interimEntry, true);
      }
    };
  }

  flushBuffer() {
    if (this.transcriptBuffer.length === 0) return;

    const combined = this.combineEntries(this.transcriptBuffer);

    combined.forEach(entry => {
      if (this.onTranscriptCallback) {
        this.onTranscriptCallback(entry, false);
      }
    });

    this.transcriptBuffer = [];
  }

  combineEntries(entries) {
    if (entries.length === 0) return [];

    const combined = [];
    let current = { ...entries[0] };

    for (let i = 1; i < entries.length; i++) {
      const entry = entries[i];
      const timeDiff = new Date(entry.rawTimestamp) - new Date(current.rawTimestamp);

      if (entry.speaker === current.speaker && timeDiff < 5000) {
        current.text += ' ' + entry.text;
        current.rawTimestamp = entry.rawTimestamp;
      } else {
        combined.push(current);
        current = { ...entry };
      }
    }
    combined.push(current);
    return combined;
  }

  async start(onTranscript) {
    if (!this.recognition) {
      await this.initialize();
    }

    this.onTranscriptCallback = onTranscript;

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      throw new Error('Microphone permission denied. Please allow microphone access.');
    }

    try {
      this.recognition.start();
    } catch (err) {
      if (err.message.includes('already started')) {
        console.log('Recognition already running');
      } else {
        throw err;
      }
    }
  }

  async stop() {
    this.onTranscriptCallback = null;
    clearTimeout(this.bufferTimeout);
    this.flushBuffer();

    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (err) {
        console.log('Error stopping recognition:', err.message);
      }
    }
    this.isListening = false;
  }

  static getSupportedLanguages() {
    return [
      { code: 'en-US', name: 'English (US)' },
      { code: 'en-GB', name: 'English (UK)' },
      { code: 'es-ES', name: 'Spanish' },
      { code: 'fr-FR', name: 'French' },
      { code: 'de-DE', name: 'German' },
      { code: 'it-IT', name: 'Italian' },
      { code: 'pt-BR', name: 'Portuguese (Brazil)' },
      { code: 'zh-CN', name: 'Chinese (Simplified)' },
      { code: 'ja-JP', name: 'Japanese' },
      { code: 'ko-KR', name: 'Korean' },
      { code: 'hi-IN', name: 'Hindi' },
      { code: 'ar-SA', name: 'Arabic' },
      { code: 'ru-RU', name: 'Russian' },
      { code: 'nl-NL', name: 'Dutch' },
      { code: 'pl-PL', name: 'Polish' }
    ];
  }

  setLanguage(langCode) {
    if (this.recognition) {
      this.recognition.lang = langCode;
    }
  }

  static isSupported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }
}

export default TranscriptionService;