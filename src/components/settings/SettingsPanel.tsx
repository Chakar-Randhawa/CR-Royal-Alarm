import { useState, useEffect } from 'react';
import type { ThemeId, VibrationPattern, VolumeCrescendo, FadeOut } from '@/types';
import { themeList } from '@/lib/themes';
import { useTheme } from '@/contexts/ThemeContext';
import { getSettings, saveSettings } from '@/lib/storage';
import { requestNotificationPermission } from '@/lib/notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Modal } from '@/components/ui/Modal';
import { Dropdown } from '@/components/ui/Dropdown';
import { Toggle } from '@/components/ui/Toggle';
import { Slider } from '@/components/ui/Slider';
import { showToast } from '@/components/ui/Toast';
import { PaletteIcon, BellIcon, ShieldIcon, PowerIcon, RefreshIcon } from '@/components/icons/AlarmIcons';

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const { themeId, setTheme } = useTheme();
  const [defaultSnooze, setDefaultSnooze] = useState(10);
  const [defaultVibration, setDefaultVibration] = useState<VibrationPattern>('continuous');
  const [defaultCrescendo, setDefaultCrescendo] = useState<VolumeCrescendo>('off');
  const [defaultFadeOut, setDefaultFadeOut] = useState<FadeOut>('never');
  const [notifGranted, setNotifGranted] = useState(false);

  useEffect(() => {
    if (open) {
      loadSettings();
      checkNotifPermission();
    }
  }, [open]);

  function loadSettings() {
    const settings = getSettings();
    setDefaultSnooze(settings.default_snooze_duration);
    setDefaultVibration(settings.default_vibration_pattern);
    setDefaultCrescendo(settings.default_volume_crescendo);
    setDefaultFadeOut(settings.default_fade_out);
  }

  async function checkNotifPermission() {
    try {
      const perm = await LocalNotifications.checkPermissions();
      setNotifGranted(perm.display === 'granted');
    } catch {
      setNotifGranted(false);
    }
  }

  async function handleEnableNotifications() {
    const granted = await requestNotificationPermission();
    setNotifGranted(granted);
    if (granted) showToast('Notifications enabled', 'success');
  }

  function handleThemeChange(id: ThemeId) {
    setTheme(id);
  }

  return (
    <Modal open={open} onClose={onClose} title="Settings" fullScreen>
      <div className="space-y-6">
        {/* Theme Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <PaletteIcon size={20} color="var(--c-primary)" />
            <h3 className="text-sm font-bold uppercase tracking-wide" style={{ color: 'var(--c-text)' }}>
              Theme
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {themeList.map((t) => (
              <button
                key={t.id}
                onClick={() => handleThemeChange(t.id)}
                className="flex items-center justify-between p-4 rounded-2xl transition-all"
                style={{
                  backgroundColor: themeId === t.id ? 'var(--c-surface)' : 'var(--c-bgTertiary)',
                  border: `2px solid ${themeId === t.id ? 'var(--c-primary)' : 'var(--c-border)'}`,
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl"
                    style={{ backgroundColor: t.colors.bg, border: `2px solid ${t.colors.primary}` }}
                  >
                    <div className="w-full h-full rounded-lg flex items-center justify-center" style={{ backgroundColor: t.colors.surface }}>
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.colors.primary }} />
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold" style={{ color: 'var(--c-text)' }}>
                      {t.name}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--c-textMuted)' }}>
                      {t.description}
                    </p>
                  </div>
                </div>
                {themeId === t.id && (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--c-primary)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M20 6 9 17l-5-5" stroke="var(--c-primaryText)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Default Alarm Settings */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <RefreshIcon size={20} color="var(--c-primary)" />
            <h3 className="text-sm font-bold uppercase tracking-wide" style={{ color: 'var(--c-text)' }}>
              Default Alarm Settings
            </h3>
          </div>
          <div className="space-y-4 p-4 rounded-2xl" style={{ backgroundColor: 'var(--c-bgTertiary)', border: `1px solid var(--c-border)` }}>
            <Slider
              label="Default Snooze Duration"
              value={defaultSnooze}
              min={1}
              max={30}
              onChange={(v) => {
                setDefaultSnooze(v);
                saveSettings({ default_snooze_duration: v });
              }}
              formatValue={(v) => `${v} min`}
            />
            <Dropdown
              label="Default Vibration Pattern"
              value={defaultVibration}
              options={[
                { value: 'continuous', label: 'Continuous' },
                { value: 'heartbeat', label: 'Heartbeat' },
                { value: 'rapid', label: 'Rapid Pulse' },
                { value: 'sos', label: 'S.O.S Morse' },
                { value: 'none', label: 'None' },
              ]}
              onChange={(v) => {
                setDefaultVibration(v as VibrationPattern);
                saveSettings({ default_vibration_pattern: v as VibrationPattern });
              }}
            />
            <Dropdown
              label="Default Volume Crescendo"
              value={defaultCrescendo}
              options={[
                { value: 'off', label: 'Off' },
                { value: '15s', label: '15 seconds' },
                { value: '30s', label: '30 seconds' },
                { value: '60s', label: '60 seconds' },
                { value: '120s', label: '120 seconds' },
              ]}
              onChange={(v) => {
                setDefaultCrescendo(v as VolumeCrescendo);
                saveSettings({ default_volume_crescendo: v as VolumeCrescendo });
              }}
            />
            <Dropdown
              label="Default Fade-out"
              value={defaultFadeOut}
              options={[
                { value: 'never', label: 'Never' },
                { value: '5min', label: '5 minutes' },
                { value: '10min', label: '10 minutes' },
                { value: '15min', label: '15 minutes' },
              ]}
              onChange={(v) => {
                setDefaultFadeOut(v as FadeOut);
                saveSettings({ default_fade_out: v as FadeOut });
              }}
            />
          </div>
        </div>

        {/* System Status */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ShieldIcon size={20} color="var(--c-primary)" />
            <h3 className="text-sm font-bold uppercase tracking-wide" style={{ color: 'var(--c-text)' }}>
              System Status
            </h3>
          </div>
          <div className="space-y-2 p-4 rounded-2xl" style={{ backgroundColor: 'var(--c-bgTertiary)', border: `1px solid var(--c-border)` }}>
            <StatusRow
              icon={<BellIcon size={18} color="var(--c-text)" />}
              label="Notifications"
              granted={notifGranted}
              onAction={!notifGranted ? handleEnableNotifications : undefined}
            />
            <StatusRow icon={<ShieldIcon size={18} color="var(--c-text)" />} label="Display Over Apps" granted={true} />
            <StatusRow icon={<PowerIcon size={18} color="var(--c-text)" />} label="Boot Completed" granted={true} />
            <StatusRow icon={<RefreshIcon size={18} color="var(--c-text)" />} label="Reboot Protection" granted={true} />
          </div>
        </div>

        {/* About */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <PowerIcon size={20} color="var(--c-primary)" />
            <h3 className="text-sm font-bold uppercase tracking-wide" style={{ color: 'var(--c-text)' }}>
              About
            </h3>
          </div>
          <div className="p-4 rounded-2xl text-center" style={{ backgroundColor: 'var(--c-bgTertiary)', border: `1px solid var(--c-border)` }}>
            <p className="text-sm font-bold mb-1" style={{ color: 'var(--c-text)' }}>
              CR Royal Alarm
            </p>
            <p className="text-xs" style={{ color: 'var(--c-textMuted)' }}>
              Version 1.0.0
            </p>
            <p className="text-xs mt-2" style={{ color: 'var(--c-textMuted)' }}>
              100% offline alarm clock — all data stays on this device.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function StatusRow({
  icon,
  label,
  granted,
  onAction,
}: {
  icon: React.ReactNode;
  label: string;
  granted: boolean;
  onAction?: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm" style={{ color: 'var(--c-text)' }}>
          {label}
        </span>
      </div>
      {onAction ? (
        <button
          onClick={onAction}
          className="text-xs font-medium px-2.5 py-1 rounded-full transition-opacity hover:opacity-80"
          style={{ backgroundColor: 'var(--c-primary)', color: 'var(--c-primaryText)' }}
        >
          Enable
        </button>
      ) : (
        <span
          className="text-xs font-medium px-2.5 py-1 rounded-full"
          style={{ backgroundColor: granted ? 'var(--c-success)' : 'var(--c-error)', color: '#fff' }}
        >
          {granted ? 'Active' : 'Disabled'}
        </span>
      )}
    </div>
  );
}
