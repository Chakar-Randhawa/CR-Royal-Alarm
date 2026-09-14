import { useState, useEffect, useCallback } from 'react';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { SplashScreen } from '@/components/SplashScreen';
import { Onboarding } from '@/components/onboarding/Onboarding';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { AlarmEditor } from '@/components/editor/AlarmEditor';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { AlarmTrigger } from '@/components/trigger/AlarmTrigger';
import { ToastContainer } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
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
    await createAlarmChannel();
    await requestNotificationPermission();

    // Listen for incoming alarm notifications
    LocalNotifications.addListener('notificationReceived', (notification) => {
      handleAlarmTrigger(notification.extra?.alarmId);
    });

    // Load settings
    const { data } = await supabase.from('app_settings').select('*').maybeSingle();
    if (data) {
      setTheme(data.theme as ThemeId);
      if (data.onboarding_completed) {
        setPhase('dashboard');
      }
    }
  }

  async function handleAlarmTrigger(alarmId?: string) {
    if (!alarmId) return;
    const { data } = await supabase.from('alarms').select('*').eq('id', alarmId).maybeSingle();
    if (data) {
      setTriggeredAlarm(data as Alarm);
    }
  }

  function handleSplashComplete() {
    if (phase === 'splash') {
      checkOnboarding();
    }
  }

  async function checkOnboarding() {
    const { data } = await supabase.from('app_settings').select('*').maybeSingle();
    if (data?.onboarding_completed) {
      setPhase('dashboard');
    } else {
      setPhase('onboarding');
    }
  }

  async function handleOnboardingComplete() {
    const { data } = await supabase.from('app_settings').select('*').maybeSingle();
    if (data) {
      await supabase
        .from('app_settings')
        .update({ onboarding_completed: true })
        .eq('id', data.id);
    } else {
      await supabase.from('app_settings').insert({ onboarding_completed: true });
    }
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
