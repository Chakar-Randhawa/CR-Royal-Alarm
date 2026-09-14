import { useState, useEffect, useCallback } from 'react';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { SplashScreen } from '@/components/SplashScreen';
import { Onboarding } from '@/components/onboarding/Onboarding';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { AlarmEditor } from '@/components/editor/AlarmEditor';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { AlarmTrigger } from '@/components/trigger/AlarmTrigger';
import { ToastContainer } from '@/components/ui/Toast';
import { createAlarmChannel, requestNotificationPermission } from '@/lib/notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import type { Alarm, ThemeId } from '@/types';

type AppPhase = 'splash' | 'onboarding' | 'dashboard';

function AppContent() {
  const { themeId, setTheme } = useTheme();
  const [phase, setPhase] = useState<AppPhase>('splash');
  const [editorOpen, setEditorOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editingAlarm, setEditingAlarm] = useState<Alarm | null>(null);
  const [triggeredAlarm, setTriggeredAlarm] = useState<Alarm | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    initApp();
  }, []);

  async function initApp() {
    try {
      await createAlarmChannel();
      await requestNotificationPermission();
    } catch (e) {
      console.log("Native notification channels not initialized in web/testing mode:", e);
    }

    // Listen for incoming alarm notifications safely
    try {
      LocalNotifications.addListener('notificationReceived', (notification) => {
        handleAlarmTrigger(notification.extra?.alarmId);
      });
    } catch (e) {
      console.log("Capacitor listeners inactive", e);
    }

    // LOAD SETTINGS 100% OFFLINE VIA LOCALSTORAGE
    const savedTheme = localStorage.getItem('alarmio_theme');
    const onboardingCompleted = localStorage.getItem('alarmio_onboarding_completed') === 'true';
    
    if (savedTheme) {
      setTheme(savedTheme as ThemeId);
    }
    
    if (onboardingCompleted) {
      setPhase('dashboard');
    }
  }

  function handleAlarmTrigger(alarmId?: string) {
    if (!alarmId) return;
    
    // Safely pull specific alarm payload from offline localStorage array
    try {
      const savedAlarms = JSON.parse(localStorage.getItem('alarms') || '[]');
      const match = savedAlarms.find((a: any) => a.id === alarmId);
      if (match) {
        setTriggeredAlarm(match as Alarm);
      }
    } catch (e) {
      console.error(e);
    }
  }

  function handleSplashComplete() {
    if (phase === 'splash') {
      checkOnboarding();
    }
  }

  function checkOnboarding() {
    const onboardingCompleted = localStorage.getItem('alarmio_onboarding_completed') === 'true';
    if (onboardingCompleted) {
      setPhase('dashboard');
    } else {
      setPhase('onboarding');
    }
  }

  function handleOnboardingComplete() {
    localStorage.setItem('alarmio_onboarding_completed', 'true');
    setPhase('dashboard');
  }

  function handleAddAlarm() {
    setEditingAlarm(null);
    setEditorOpen(true);
  }

  function handleEditAlarm(alarm: Alarm) {
    setEditingAlarm(alarm);
    setEditorOpen(true);
  }

  const handleEditorSaved = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <>
      {phase === 'splash' && <SplashScreen onComplete={handleSplashComplete} />}
      {phase === 'onboarding' && <Onboarding onComplete={handleOnboardingComplete} />}
      {phase === 'dashboard' && (
        <Dashboard
          key={refreshKey}
          onAddAlarm={handleAddAlarm}
          onEditAlarm={handleEditAlarm}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      )}
      <AlarmEditor
        open={editorOpen}
        alarm={editingAlarm}
        onClose={() => setEditorOpen(false)}
        onSaved={handleEditorSaved}
      />
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      {triggeredAlarm && (
        <AlarmTrigger
          alarm={triggeredAlarm}
          onDismiss={() => {
            setTriggeredAlarm(null);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
      <ToastContainer />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
