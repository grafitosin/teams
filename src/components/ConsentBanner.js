import React from 'react';
import { Button, Text } from '@fluentui/react-components';
import { MicSettings24Regular, Warning24Filled } from '@fluentui/react-icons';
import './ConsentBanner.css';

/**
 * ConsentBanner
 * Addresses the "Consent & compliance notice" gap (High severity in the gap
 * analysis): the original UI had no in-meeting indicator that transcription
 * was active and no explicit per-participant opt-in.
 *
 * Shown before this participant's own mic capture starts, and as a persistent
 * banner while capture is live so everyone in the panel can see who has
 * (and hasn't) consented.
 */
function ConsentBanner({ status, onAccept, onDecline, activeParticipants = [] }) {
  if (status === 'granted') {
    return (
      <div className="consent-banner consent-banner--active" role="status">
        <MicSettings24Regular />
        <Text size={200}>
          Transcription is active. Your speech is being converted to text and shared with meeting participants using this app.
          {activeParticipants.length > 0 && ` Currently transcribing: ${activeParticipants.join(', ')}.`}
        </Text>
      </div>
    );
  }

  return (
    <div className="consent-banner consent-banner--prompt" role="alertdialog" aria-label="Transcription consent">
      <Warning24Filled />
      <div className="consent-banner__text">
        <Text weight="semibold" block>Enable transcription for your microphone?</Text>
        <Text size={200} block>
          If you agree, your speech in this meeting will be converted to text locally in your browser and shared
          with other participants using Laura Transcribe to build a combined meeting transcript. Only your own
          microphone audio is used — it is never recorded or sent anywhere as audio.
        </Text>
      </div>
      <div className="consent-banner__actions">
        <Button appearance="primary" onClick={onAccept}>Allow &amp; start</Button>
        <Button appearance="secondary" onClick={onDecline}>Not now</Button>
      </div>
    </div>
  );
}

export default ConsentBanner;
