import React, { useEffect } from 'react';
import * as microsoftTeams from '@microsoft/teams-js';
import './TabConfig.css';

const TabConfig = () => {
  useEffect(() => {
    microsoftTeams.app.initialize().then(() => {
      microsoftTeams.pages.config.registerOnSaveHandler((saveEvent) => {
        const baseUrl = window.location.origin;
        microsoftTeams.pages.config.setConfig({
          suggestedDisplayName: "Laura Transcribe",
          entityId: "lauraTranscribe",
          contentUrl: baseUrl + "/tab",
          websiteUrl: baseUrl + "/tab",
        });
        saveEvent.notifySuccess();
      });
      microsoftTeams.pages.config.setValidityState(true);
    });
  }, []);

  return (
    <div className="config-container">
      <h2>Laura Transcribe Configuration</h2>
      <p>
        This app will help you transcribe meetings, generate minutes of meeting (MoM),
        and create action items as Outlook calendar events.
      </p>
      <p className="config-note">
        Click Save to add this app to your meeting.
      </p>
    </div>
  );
};

export default TabConfig;