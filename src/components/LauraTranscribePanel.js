import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as microsoftTeams from '@microsoft/teams-js';
import {
  Button,
  Card,
  CardHeader,
  Text,
  Title2,
  Title3,
  TabList,
  Tab,
  Badge,
  Divider,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Input,
  Spinner,
  Tooltip,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  Mic24Regular,
  MicOff24Regular,
  Save24Regular,
  CalendarAdd24Regular,
  Share24Regular,
  Copy24Regular,
  Checkmark24Regular,
  Dismiss24Regular,
  DocumentText24Regular,
  TaskListLtr24Regular,
} from '@fluentui/react-icons';
import TranscriptionService from '../services/TranscriptionService';
import MinutesGenerator from '../services/MinutesGenerator';
import OutlookCalendarService from '../services/OutlookCalendarService';
import SyncService from '../services/SyncService';
import ConsentBanner from './ConsentBanner';
import './LauraTranscribePanel.css';

const SYNC_ENDPOINT = process.env.REACT_APP_SYNC_ENDPOINT || null; // e.g. wss://your-app-domain.com/sync
const API_ENDPOINT = process.env.REACT_APP_API_ENDPOINT || null;   // e.g. https://your-app-domain.com/api

const useStyles = makeStyles({
  panel: {
    padding: '16px',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '8px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  transcriptArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: '8px',
    fontSize: '14px',
    lineHeight: '1.6',
  },
  transcriptEntry: {
    marginBottom: '8px',
    padding: '8px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: '6px',
    borderLeft: `3px solid ${tokens.colorBrandBackground}`,
  },
  speakerName: {
    fontWeight: '600',
    color: tokens.colorBrandForeground1,
    fontSize: '13px',
  },
  timestamp: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
    marginLeft: '8px',
  },
  controls: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    padding: '8px 0',
  },
  minutesCard: {
    marginTop: '8px',
    padding: '16px',
  },
  actionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px',
    marginBottom: '4px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: '6px',
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  tabContent: {
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
});

const LauraTranscribePanel = ({ frameContext }) => {
  const styles = useStyles();
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [minutes, setMinutes] = useState(null);
  const [actionItems, setActionItems] = useState([]);
  const [selectedTab, setSelectedTab] = useState('transcript');
  const [meetingContext, setMeetingContext] = useState(null);
  const [isGeneratingMinutes, setIsGeneratingMinutes] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [currentActionItem, setCurrentActionItem] = useState(null);
  const [copied, setCopied] = useState(false);
  const [consentStatus, setConsentStatus] = useState('unset'); // 'unset' | 'granted' | 'declined'
  const [participants, setParticipants] = useState([]);
  const [isSynced, setIsSynced] = useState(false);
  const [isStandaloneMode, setIsStandaloneMode] = useState(false);
  const transcriptEndRef = useRef(null);
  const transcriptionServiceRef = useRef(null);
  const syncServiceRef = useRef(null);
  const meetingIdRef = useRef('default');

  /**
   * microsoftTeams.app.initialize() only resolves when this page is actually
   * embedded inside a real Teams client (it performs a postMessage handshake
   * with the parent Teams frame). Opened directly in a plain browser tab -
   * e.g. to verify a fresh deployment before sideloading into Teams - that
   * handshake never completes.
   *
   * getTeamsOrMockContext races the real handshake against a short timeout
   * and falls back to a mock context so the rest of the app (sync, consent,
   * transcription, minutes) can still be exercised and verified standalone.
   * This is dev/verification tooling only - it is clearly flagged in the UI
   * (see the standalone-mode banner below) and should not be mistaken for a
   * real multi-participant meeting.
   */
  const getTeamsOrMockContext = async () => {
    const TEAMS_HANDSHAKE_TIMEOUT_MS = 2500;

    try {
      await Promise.race([
        microsoftTeams.app.initialize(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Teams handshake timed out')), TEAMS_HANDSHAKE_TIMEOUT_MS))
      ]);
      const context = await microsoftTeams.app.getContext();
      return { context, isStandalone: false };
    } catch (error) {
      console.warn('Not running inside a Teams client - falling back to standalone dev mode:', error.message);

      // Stable per-tab dev identity, so refreshing the same tab keeps the
      // same participant identity, while a different tab/browser gets a
      // different one - useful for manually testing the merge across
      // "participants" without a real meeting.
      let devName = sessionStorage.getItem('laura-dev-speaker-name');
      if (!devName) {
        devName = `Dev User ${Math.floor(Math.random() * 9000 + 1000)}`;
        sessionStorage.setItem('laura-dev-speaker-name', devName);
      }

      const mockContext = {
        user: { id: devName, displayName: devName, userPrincipalName: `${devName}@standalone.local` },
        meeting: { id: 'standalone-dev-meeting' },
        chat: null,
        page: { subPageId: null }
      };
      return { context: mockContext, isStandalone: true };
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const { context, isStandalone } = await getTeamsOrMockContext();
        setMeetingContext(context);
        setIsStandaloneMode(isStandalone);
        transcriptionServiceRef.current = new TranscriptionService(context);

        const meetingId = context.meeting?.id || context.chat?.id || context.page?.subPageId || 'default';
        meetingIdRef.current = meetingId;

        // Distributed-capture sync: connects this tab to the merge backend so
        // everyone's independently-transcribed segments combine into one
        // shared transcript. Falls back to local-only mode if unconfigured.
        if (SYNC_ENDPOINT) {
          const speakerName = context.user?.displayName || context.user?.userPrincipalName || 'Participant';
          const participantId = context.user?.id || `${speakerName}-${Date.now()}`;

          syncServiceRef.current = new SyncService({
            syncEndpoint: SYNC_ENDPOINT,
            meetingId,
            participantId,
            speakerName
          });
          syncServiceRef.current.onTranscriptUpdate = (merged) => setTranscript(merged);
          syncServiceRef.current.onParticipantsUpdate = (list) => setParticipants(list);
          syncServiceRef.current.onMinutesReady = (m, items) => { setMinutes(m); setActionItems(items); };
          syncServiceRef.current.onConnectionChange = (connected) => setIsSynced(connected);
          syncServiceRef.current.connect();
        }
      } catch (error) {
        console.error('Initialization error:', error);
      }
    };
    init();

    return () => {
      syncServiceRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcript]);

  const [interimEntry, setInterimEntry] = useState(null);

  const startCapture = useCallback(async () => {
    if (transcriptionServiceRef.current) {
      await transcriptionServiceRef.current.start((entry, isInterim) => {
        if (isInterim) {
          setInterimEntry(entry);
          return;
        }
        setInterimEntry(null);

        // Stream this participant's finalized segment to the merge backend.
        // If no backend is configured, fall back to appending locally so the
        // panel still works standalone (single-participant / demo mode).
        if (syncServiceRef.current) {
          syncServiceRef.current.sendSegment(entry);
        } else {
          setTranscript((prev) => [...prev, entry]);
        }
      });
    }
    setIsTranscribing(true);
  }, []);

  const toggleTranscription = useCallback(async () => {
    if (isTranscribing) {
      if (transcriptionServiceRef.current) {
        await transcriptionServiceRef.current.stop();
      }
      setInterimEntry(null);
      setIsTranscribing(false);
      return;
    }

    // Consent gate: don't start capturing this participant's mic until they
    // have explicitly agreed, and don't re-prompt once already granted.
    if (consentStatus !== 'granted') {
      return; // ConsentBanner is shown in the UI; onAccept below starts capture
    }

    await startCapture();
  }, [isTranscribing, consentStatus, startCapture]);

  const handleConsentAccept = useCallback(async () => {
    setConsentStatus('granted');
    syncServiceRef.current?.sendConsentGranted();
    await startCapture();
  }, [startCapture]);

  const handleConsentDecline = useCallback(() => {
    setConsentStatus('declined');
  }, []);

  const generateMinutes = useCallback(async () => {
    if (transcript.length === 0) {
      alert('Please start transcription first to generate minutes.');
      return;
    }

    setIsGeneratingMinutes(true);
    try {
      let result;
      if (API_ENDPOINT) {
        const response = await fetch(`${API_ENDPOINT}/meetings/${encodeURIComponent(meetingIdRef.current)}/minutes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ meetingContext })
        });
        if (!response.ok) throw new Error(`Minutes endpoint returned ${response.status}`);
        result = await response.json();
      } else {
        // Standalone fallback (no backend configured): local rule-based generation only.
        const generator = new MinutesGenerator();
        result = await generator.generate(transcript, meetingContext);
      }
      setMinutes(result.minutes);
      setActionItems(result.actionItems);
      setSelectedTab('minutes');
    } catch (error) {
      console.error('Error generating minutes:', error);
      alert('Could not generate minutes right now. Please try again.');
    } finally {
      setIsGeneratingMinutes(false);
    }
  }, [transcript, meetingContext]);

  const saveToChat = useCallback(async () => {
    if (!minutes) return;

    setIsSaving(true);
    try {
      const content = formatMinutesForChat(minutes, actionItems);
      await navigator.clipboard.writeText(content);
      alert('Minutes copied to clipboard! Paste into the meeting chat to share with all participants.');
    } catch (error) {
      console.error('Error saving to chat:', error);
      copyToClipboard();
    } finally {
      setIsSaving(false);
    }
  }, [minutes, actionItems]);

  const createCalendarEvent = useCallback(async (actionItem) => {
    setCurrentActionItem(actionItem);
    setShowActionDialog(true);
  }, []);

  const confirmCreateEvent = useCallback(async (eventDetails) => {
    try {
      const calendarService = new OutlookCalendarService({
        tokenExchangeEndpoint: API_ENDPOINT ? `${API_ENDPOINT}/auth/graph-token` : undefined
      });
      await calendarService.createEvent({
        subject: `[Action] ${currentActionItem.task}`,
        body: {
          contentType: 'HTML',
          content: `
            <h3>Action Item from Meeting</h3>
            <p><strong>Task:</strong> ${currentActionItem.task}</p>
            <p><strong>Assigned to:</strong> ${currentActionItem.assignee || 'TBD'}</p>
            <p><strong>Due Date:</strong> ${currentActionItem.dueDate || 'TBD'}</p>
            <p><strong>Priority:</strong> ${currentActionItem.priority || 'Normal'}</p>
            <hr/>
            <p><em>Generated by Laura Transcribe App</em></p>
          `
        },
        start: {
          dateTime: eventDetails.startDateTime,
          timeZone: 'UTC'
        },
        end: {
          dateTime: eventDetails.endDateTime,
          timeZone: 'UTC'
        },
        attendees: eventDetails.attendees || [],
        isReminderOn: true,
        reminderMinutesBeforeStart: 15
      });

      setShowActionDialog(false);
      alert('Calendar event created successfully!');
    } catch (error) {
      console.error('Error creating calendar event:', error);
      alert('Failed to create calendar event. Please try again.');
    }
  }, [currentActionItem]);

  const copyToClipboard = useCallback(() => {
    if (!minutes) return;
    const text = formatMinutesForClipboard(minutes, actionItems);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [minutes, actionItems]);

  const shareToStage = useCallback(async () => {
    try {
      const context = await microsoftTeams.app.getContext();

      if (context.page.frameContext === 'meetingSidePanel') {
        await microsoftTeams.meeting.shareAppContentToStage((err, result) => {
          if (err) {
            console.error('Error sharing to stage:', err);
            alert('Could not share to stage. Make sure you have permission.');
          } else {
            console.log('Shared to stage:', result);
          }
        }, window.location.origin + '/tab?stage=true');
      } else {
        alert('Share to stage is only available from the meeting side panel.');
      }
    } catch (error) {
      console.error('Share to stage failed:', error);
      alert('Share to stage is not available in this context.');
    }
  }, []);

  const formatMinutesForChat = (minutes, actionItems) => {
    let text = `Minutes of Meeting\n`;
    text += `Date: ${minutes.date}\n`;
    text += `Meeting: ${minutes.meetingTitle}\n`;
    text += `Duration: ${minutes.duration}\n\n`;
    text += `Attendees: ${minutes.attendees.join(', ')}\n\n`;
    text += `Summary:\n${minutes.summary}\n\n`;
    text += `Key Discussion Points:\n`;
    minutes.keyPoints.forEach((point, i) => {
      text += `${i + 1}. ${point}\n`;
    });
    text += `\nDecisions Made:\n`;
    minutes.decisions.forEach((decision, i) => {
      text += `${i + 1}. ${decision}\n`;
    });
    if (actionItems.length > 0) {
      text += `\nAction Items:\n`;
      actionItems.forEach((item, i) => {
        text += `${i + 1}. ${item.task} - ${item.assignee || 'Unassigned'} (${item.dueDate || 'No due date'})\n`;
      });
    }
    return text;
  };

  const formatMinutesForClipboard = (minutes, actionItems) => {
    return formatMinutesForChat(minutes, actionItems);
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div>
          <Title2>Laura Transcribe</Title2>
          <Text size={200}>
            {isTranscribing ? (
              <span className={styles.statusBadge}>
                <Badge color="danger" appearance="filled">Recording</Badge>
                <span>Transcribing...</span>
              </span>
            ) : (
              <Badge color="neutral" appearance="outline">Ready</Badge>
            )}
          </Text>
        </div>
        <div className={styles.controls}>
          <Tooltip content={isTranscribing ? "Stop Transcription" : "Start Transcription"} relationship="label">
            <Button
              icon={isTranscribing ? <MicOff24Regular /> : <Mic24Regular />}
              appearance={isTranscribing ? "primary" : "outline"}
              onClick={toggleTranscription}
              disabled={Boolean(SYNC_ENDPOINT) && consentStatus !== 'granted' && !isTranscribing}
              shape="circular"
            />
          </Tooltip>
          <Tooltip content="Generate Minutes" relationship="label">
            <Button
              icon={<DocumentText24Regular />}
              appearance="outline"
              onClick={generateMinutes}
              disabled={transcript.length === 0 || isGeneratingMinutes}
              shape="circular"
            />
          </Tooltip>
          <Tooltip content="Save to Chat" relationship="label">
            <Button
              icon={<Save24Regular />}
              appearance="outline"
              onClick={saveToChat}
              disabled={!minutes || isSaving}
              shape="circular"
            />
          </Tooltip>
          <Tooltip content="Copy to Clipboard" relationship="label">
            <Button
              icon={copied ? <Checkmark24Regular /> : <Copy24Regular />}
              appearance="outline"
              onClick={copyToClipboard}
              disabled={!minutes}
              shape="circular"
            />
          </Tooltip>
          {frameContext === 'meetingSidePanel' && (
            <Tooltip content="Share to Stage" relationship="label">
              <Button
                icon={<Share24Regular />}
                appearance="outline"
                onClick={shareToStage}
                shape="circular"
              />
            </Tooltip>
          )}
        </div>
      </div>

      {isStandaloneMode && (
        <div style={{
          background: '#FFF4CE', border: '1px solid #FFD335', color: '#433519',
          borderRadius: '8px', padding: '8px 12px', fontSize: '12px', marginTop: '-4px'
        }}>
          <strong>Standalone dev mode</strong> — not running inside a real Teams client, so this is a mock
          identity ({meetingContext?.user?.displayName}) for verifying deployment only. Open two browser tabs to
          test the merge across two "participants." This is not a real meeting.
        </div>
      )}

      {SYNC_ENDPOINT && (
        <ConsentBanner
          status={consentStatus === 'granted' ? 'granted' : 'prompt'}
          onAccept={handleConsentAccept}
          onDecline={handleConsentDecline}
          activeParticipants={participants.map(p => p.name)}
        />
      )}

      {SYNC_ENDPOINT && consentStatus === 'granted' && (
        <div style={{ fontSize: '12px', color: tokens.colorNeutralForeground3, marginTop: '-4px' }}>
          {isSynced ? `Synced \u2014 ${participants.length} participant(s) transcribing` : 'Reconnecting to sync server\u2026'}
        </div>
      )}

      <TabList
        selectedValue={selectedTab}
        onTabSelect={(e, data) => setSelectedTab(data.value)}
      >
        <Tab value="transcript" icon={<Mic24Regular />}>
          Transcript ({transcript.length})
        </Tab>
        <Tab value="minutes" icon={<DocumentText24Regular />}>
          Minutes
        </Tab>
        <Tab value="actions" icon={<TaskListLtr24Regular />}>
          Action Items ({actionItems.length})
        </Tab>
      </TabList>

      <div className={styles.tabContent}>
        {selectedTab === 'transcript' && (
          <div className={styles.transcriptArea}>
            {transcript.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: tokens.colorNeutralForeground3 }}>
                <Text>Click the microphone button to start real-time transcription</Text>
                <br />
                <Text size={200}>No meeting recording is created - only live text transcription</Text>
              </div>
            ) : (
              transcript.map((entry, index) => (
                <div key={entry.id || index} className={styles.transcriptEntry}>
                  <div>
                    <span className={styles.speakerName}>{entry.speaker}</span>
                    <span className={styles.timestamp}>{entry.timestamp}</span>
                  </div>
                  <Text>{entry.text}</Text>
                </div>
              ))
            )}
            {interimEntry && (
              <div className={styles.transcriptEntry} style={{ opacity: 0.55, fontStyle: 'italic' }}>
                <div>
                  <span className={styles.speakerName}>{interimEntry.speaker}</span>
                  <span className={styles.timestamp}>{interimEntry.timestamp}</span>
                </div>
                <Text>{interimEntry.text}</Text>
              </div>
            )}
            <div ref={transcriptEndRef} />
          </div>
        )}

        {selectedTab === 'minutes' && (
          <div style={{ overflowY: 'auto', padding: '8px' }}>
            {isGeneratingMinutes ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Spinner size="huge" />
                <Text>Generating minutes...</Text>
              </div>
            ) : minutes ? (
              <Card className={styles.minutesCard}>
                <CardHeader
                  header={<Title3>Minutes of Meeting</Title3>}
                  description={`${minutes.date} | ${minutes.duration}`}
                />
                <Divider />
                <div style={{ marginTop: '16px' }}>
                  <Text weight="semibold">Attendees:</Text>
                  <Text>{minutes.attendees.join(', ')}</Text>
                </div>
                <div style={{ marginTop: '16px' }}>
                  <Text weight="semibold">Summary:</Text>
                  <Text>{minutes.summary}</Text>
                </div>
                <div style={{ marginTop: '16px' }}>
                  <Text weight="semibold">Key Discussion Points:</Text>
                  {minutes.keyPoints.map((point, i) => (
                    <div key={i} style={{ marginLeft: '16px', marginTop: '4px' }}>
                      <Text>• {point}</Text>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '16px' }}>
                  <Text weight="semibold">Decisions Made:</Text>
                  {minutes.decisions.map((decision, i) => (
                    <div key={i} style={{ marginLeft: '16px', marginTop: '4px' }}>
                      <Text>• {decision}</Text>
                    </div>
                  ))}
                </div>
              </Card>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: tokens.colorNeutralForeground3 }}>
                <Text>Generate minutes to see them here</Text>
              </div>
            )}
          </div>
        )}

        {selectedTab === 'actions' && (
          <div style={{ overflowY: 'auto', padding: '8px' }}>
            {actionItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: tokens.colorNeutralForeground3 }}>
                <Text>No action items yet. Generate minutes to extract action items.</Text>
              </div>
            ) : (
              actionItems.map((item, index) => (
                <Card key={index} style={{ marginBottom: '8px' }}>
                  <div className={styles.actionItem}>
                    <div style={{ flex: 1 }}>
                      <Text weight="semibold">{item.task}</Text>
                      <div>
                        <Text size={200}>Assignee: {item.assignee || 'Unassigned'}</Text>
                        <Text size={200} style={{ marginLeft: '16px' }}>
                          Due: {item.dueDate || 'No due date'}
                        </Text>
                        {item.priority && (
                          <Badge
                            color={item.priority === 'High' ? 'danger' : item.priority === 'Medium' ? 'warning' : 'success'}
                            appearance="filled"
                            style={{ marginLeft: '8px' }}
                          >
                            {item.priority}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Tooltip content="Create Outlook Event" relationship="label">
                      <Button
                        icon={<CalendarAdd24Regular />}
                        appearance="outline"
                        onClick={() => createCalendarEvent(item)}
                        shape="circular"
                      />
                    </Tooltip>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      {showActionDialog && currentActionItem && (
        <ActionItemDialog
          actionItem={currentActionItem}
          onConfirm={confirmCreateEvent}
          onCancel={() => setShowActionDialog(false)}
        />
      )}
    </div>
  );
};

const ActionItemDialog = ({ actionItem, onConfirm, onCancel }) => {
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState(30);
  const [attendees, setAttendees] = useState('');

  const handleConfirm = () => {
    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

    onConfirm({
      startDateTime: startDateTime.toISOString(),
      endDateTime: endDateTime.toISOString(),
      attendees: attendees.split(',').map(e => e.trim()).filter(e => e).map(email => ({
        emailAddress: { address: email },
        type: 'required'
      }))
    });
  };

  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setStartDate(tomorrow.toISOString().split('T')[0]);
    setStartTime('09:00');
  }, []);

  return (
    <Dialog open={true}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Create Outlook Calendar Event</DialogTitle>
          <DialogContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <Text weight="semibold">Task:</Text>
                <Text>{actionItem.task}</Text>
              </div>
              <div>
                <Text weight="semibold">Assignee:</Text>
                <Text>{actionItem.assignee || 'Unassigned'}</Text>
              </div>
              <Divider />
              <div>
                <Text weight="semibold">Date:</Text>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <Text weight="semibold">Time:</Text>
                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
              <div>
                <Text weight="semibold">Duration (minutes):</Text>
                <Input type="number" value={duration} onChange={(e) => setDuration(parseInt(e.target.value))} min={15} step={15} />
              </div>
              <div>
                <Text weight="semibold">Attendees (comma-separated emails):</Text>
                <Input placeholder="email1@example.com, email2@example.com" value={attendees} onChange={(e) => setAttendees(e.target.value)} />
              </div>
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={onCancel} icon={<Dismiss24Regular />}>
              Cancel
            </Button>
            <Button appearance="primary" onClick={handleConfirm} icon={<CalendarAdd24Regular />}>
              Create Event
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

export default LauraTranscribePanel;
