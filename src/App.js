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
        console.error('Teams initialization failed:', error);
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