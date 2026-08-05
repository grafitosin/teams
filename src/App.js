import React, { useEffect, useState } from 'react';
import * as microsoftTeams from '@microsoft/teams-js';
import { FluentProvider, teamsLightTheme, teamsDarkTheme } from '@fluentui/react-components';
import LauraTranscribePanel from './components/LauraTranscribePanel';
import TabConfig from './components/TabConfig';
import './App.css';

function App() {
  const [theme, setTheme] = useState(teamsLightTheme);
  const [frameContext, setFrameContext] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeTeams = async () => {
      try {
        await microsoftTeams.app.initialize();
        const context = await microsoftTeams.app.getContext();

        if (context.app.theme === 'dark') {
          setTheme(teamsDarkTheme);
        } else if (context.app.theme === 'contrast') {
          setTheme(teamsLightTheme);
        }

        setFrameContext(context.page.frameContext || '');
        setIsInitialized(true);

        microsoftTeams.app.registerOnThemeChangeHandler((newTheme) => {
          if (newTheme === 'dark') {
            setTheme(teamsDarkTheme);
          } else {
            setTheme(teamsLightTheme);
          }
        });
      } catch (error) {
        // Expected when this page isn't embedded inside a real Teams client
        // (e.g. testing standalone in a plain browser tab) - the panel
        // component has its own more complete standalone fallback with a
        // visible UI banner; this is just app-shell theming/frame context,
        // so a quiet log is enough here rather than an alarming error.
        console.info('Not running inside Teams - using default theme/frame context.');
        setIsInitialized(true);
      }
    };

    initializeTeams();
  }, []);

  const path = window.location.pathname;

  if (!isInitialized) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <FluentProvider theme={theme}>
      <div className="app-container">
        {path.includes('/config') ? (
          <TabConfig />
        ) : (
          <LauraTranscribePanel frameContext={frameContext} />
        )}
      </div>
    </FluentProvider>
  );
}

export default App;
