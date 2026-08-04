/**
 * Storage Utility
 * Handles persistent storage of meeting data using localStorage
 * Data is scoped per meeting to avoid conflicts
 */

const STORAGE_PREFIX = 'teams-laura-transcribe-';

export const StorageUtil = {
  getMeetingKey(meetingId) {
    return `${STORAGE_PREFIX}${meetingId || 'default'}`;
  },

  saveTranscript(meetingId, transcript) {
    try {
      const key = this.getMeetingKey(meetingId);
      const data = {
        transcript,
        lastUpdated: new Date().toISOString(),
        version: '1.0'
      };
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error saving transcript:', error);
      return false;
    }
  },

  loadTranscript(meetingId) {
    try {
      const key = this.getMeetingKey(meetingId);
      const data = JSON.parse(localStorage.getItem(key));
      return data?.transcript || [];
    } catch (error) {
      console.error('Error loading transcript:', error);
      return [];
    }
  },

  saveMinutes(meetingId, minutes, actionItems) {
    try {
      const key = `${this.getMeetingKey(meetingId)}-minutes`;
      const data = {
        minutes,
        actionItems,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error saving minutes:', error);
      return false;
    }
  },

  loadMinutes(meetingId) {
    try {
      const key = `${this.getMeetingKey(meetingId)}-minutes`;
      const data = JSON.parse(localStorage.getItem(key));
      return {
        minutes: data?.minutes || null,
        actionItems: data?.actionItems || []
      };
    } catch (error) {
      console.error('Error loading minutes:', error);
      return { minutes: null, actionItems: [] };
    }
  },

  clearMeetingData(meetingId) {
    try {
      const key = this.getMeetingKey(meetingId);
      localStorage.removeItem(key);
      localStorage.removeItem(`${key}-minutes`);
      return true;
    } catch (error) {
      console.error('Error clearing meeting data:', error);
      return false;
    }
  },

  exportAllData() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        try {
          data[key] = JSON.parse(localStorage.getItem(key));
        } catch (e) {
          data[key] = localStorage.getItem(key);
        }
      }
    }
    return data;
  },

  getStoredMeetings() {
    const meetings = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX) && !key.endsWith('-minutes')) {
        const meetingId = key.replace(STORAGE_PREFIX, '');
        if (meetingId !== 'default') {
          meetings.push(meetingId);
        }
      }
    }
    return meetings;
  }
};

export default StorageUtil;