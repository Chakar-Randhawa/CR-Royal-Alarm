import { useState, useEffect, useCallback } from 'react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { SplashScreen } from '@/components/SplashScreen';
import { Onboarding } from '@/components/onboarding/Onboarding';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { AlarmEditor } from '@/components/editor/AlarmEditor';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { AlarmTrigger } from '@/components/trigger/AlarmTrigger';
import { ToastContainer } from '@/components/ui/Toast';
import { createAlarmChannel, requestNotificationPermission } from '@/lib/notifications';
import { STORAGE_KEYS, getAlarmById } from '@/lib/storage';
import { LocalNotifications } from '@capacitor/local-notifications';
import type { Alarm } from '@/types';

type AppPhase = 'splash' | 'onboarding' | 'dashboard';

function AppContent() {
  const [phase, setPhase] = useState<AppPhase>('splash');
  const [editorOpen, setEditorOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editingAlarm, setEditingAlarm] = useState<Alarm | null>(null);
  const [triggeredAlarm, setTriggeredAlarm] = useState<Alarm | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    initApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function initApp() {
    try {
      await createAlarmChannel();
      await requestNotificationPermission();
    } catch (e) {
      console.log('Native notification channels not initialized in web/testing mode:', e);
    }

    // Listen for incoming alarm notifications so tapping / receiving one
    // opens the full-screen AlarmTrigger UI.
    try {
      LocalNotifications.addListener('localNotificationReceived', (notification) => {
        handleAlarmTrigger(notification.extra?.alarmId);
      });
      LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
        handleAlarmTrigger(action.notification.extra?.alarmId);
      });
    } catch (e) {
      console.log('Capacitor listeners inactive', e);
    }
  }

  function handleAlarmTrigger(alarmId?: string) {
    if (!alarmId) return;
    const match = getAlarmById(alarmId);
    if (match) {
      setTriggeredAlarm(match);
    }
  }

  function handleSplashComplete() {
    if (phase === 'splash') {
      checkOnboarding();
    }
  }

  function checkOnboarding() {
    const onboardingCompleted = localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED) === 'true';
    setPhase(onboardingCompleted ? 'dashboard' : 'onboarding');
  }

  function handleOnboardingComplete() {
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
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
