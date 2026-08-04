/**
 * MeetingStorage
 * Server-side, encrypted-at-rest persistence for merged transcripts and
 * generated minutes, replacing the original client-only localStorage
 * approach (StorageUtil.js), which never left the device and could not be
 * shared across participants.
 *
 * Swap `_writeFile`/`_readFile` for your real datastore (Cosmos DB, Postgres,
 * Blob Storage, etc.) in production - this file-based implementation exists
 * to keep the reference architecture runnable without extra infra.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = process.env.STORAGE_DIR || path.join(__dirname, '.data');
const ALGORITHM = 'aes-256-gcm';

// In production, load this from a secrets manager / Key Vault - never hardcode.
const ENCRYPTION_KEY = process.env.STORAGE_ENCRYPTION_KEY
  ? Buffer.from(process.env.STORAGE_ENCRYPTION_KEY, 'hex')
  : crypto.randomBytes(32); // ephemeral dev-only key; set STORAGE_ENCRYPTION_KEY in real deployments

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function encrypt(plainObj) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  const json = JSON.stringify(plainObj);
  const encrypted = Buffer.concat([cipher.update(json, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return { iv: iv.toString('hex'), authTag: authTag.toString('hex'), data: encrypted.toString('hex') };
}

function decrypt(payload) {
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, Buffer.from(payload.iv, 'hex'));
  decipher.setAuthTag(Buffer.from(payload.authTag, 'hex'));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(payload.data, 'hex')), decipher.final()]);
  return JSON.parse(decrypted.toString('utf8'));
}

function filePathFor(meetingId) {
  const safe = String(meetingId).replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(DATA_DIR, `${safe}.json`);
}

const MeetingStorage = {
  saveTranscript(meetingId, transcript) {
    const existing = this._read(meetingId) || {};
    existing.transcript = transcript;
    existing.lastUpdated = new Date().toISOString();
    this._write(meetingId, existing);
  },

  saveMinutes(meetingId, minutes, actionItems) {
    const existing = this._read(meetingId) || {};
    existing.minutes = minutes;
    existing.actionItems = actionItems;
    existing.lastUpdated = new Date().toISOString();
    this._write(meetingId, existing);
  },

  load(meetingId) {
    return this._read(meetingId) || { transcript: [], minutes: null, actionItems: [] };
  },

  /** Retention: delete a meeting's data on request (e.g. participant-initiated deletion, or a scheduled job). */
  deleteMeeting(meetingId) {
    const p = filePathFor(meetingId);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  },

  _read(meetingId) {
    const p = filePathFor(meetingId);
    if (!fs.existsSync(p)) return null;
    try {
      const payload = JSON.parse(fs.readFileSync(p, 'utf8'));
      return decrypt(payload);
    } catch (e) {
      console.error('Storage read/decrypt error:', e);
      return null;
    }
  },

  _write(meetingId, obj) {
    const p = filePathFor(meetingId);
    fs.writeFileSync(p, JSON.stringify(encrypt(obj)));
  }
};

module.exports = MeetingStorage;
