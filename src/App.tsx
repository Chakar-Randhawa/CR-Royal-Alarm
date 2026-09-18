import { useState, useEffect, useCallback } from 'react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { SplashScreen } from '@/components/SplashScreen';
import { PremiumSplash } from '@/components/PremiumSplash';
import { GuidedTour } from '@/components/GuidedTour';
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
  const [isFirstLaunch] = useState(() => localStorage.getItem(STORAGE_KEYS.FIRST_LAUNCH_DONE) !== 'true');
  const [phase, setPhase] = useState<AppPhase>('splash');
  const [showTour, setShowTour] = useState(false);
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
    localStorage.setItem(STORAGE_KEYS.FIRST_LAUNCH_DONE, 'true');
    const onboardingCompleted = localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED) === 'true';
    if (onboardingCompleted) {
      setPhase('dashboard');
    } else {
      setPhase('onboarding');
    }
  }

  function handleOnboardingComplete() {
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
    setPhase('dashboard');
    if (localStorage.getItem(STORAGE_KEYS.TOUR_COMPLETED) !== 'true') {
      setShowTour(true);
    }
  }

  function handleTourFinish() {
    localStorage.setItem(STORAGE_KEYS.TOUR_COMPLETED, 'true');
    setShowTour(false);
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
      {phase === 'splash' &&
        (isFirstLaunch ? (
          <PremiumSplash onComplete={handleSplashComplete} />
        ) : (
          <SplashScreen onComplete={handleSplashComplete} />
        ))}
      {phase === 'onboarding' && <Onboarding onComplete={handleOnboardingComplete} />}
      {phase === 'dashboard' && (
        <Dashboard
          key={refreshKey}
          onAddAlarm={handleAddAlarm}
          onEditAlarm={handleEditAlarm}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      )}
      {phase === 'dashboard' && showTour && <GuidedTour onFinish={handleTourFinish} />}
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
