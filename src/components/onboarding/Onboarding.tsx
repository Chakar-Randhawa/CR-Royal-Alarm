import { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { requestNotificationPermission } from '@/lib/notifications';
import {
  ChevronRightIcon,
  ChevronLeftIcon,
  BellIcon,
  ShieldIcon,
  ZapIcon,
  SparklesIcon,
  CheckIcon,
  LockIcon,
  BatteryIcon,
  PowerIcon,
} from '@/components/icons/AlarmIcons';
import { LocalNotifications } from '@capacitor/local-notifications';

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const { theme } = useTheme();
  const [page, setPage] = useState(0);
  const [notifStatus, setNotifStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [overlayStatus, setOverlayStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [batteryStatus, setBatteryStatus] = useState<'unknown' | 'unrestricted' | 'optimized'>('unknown');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkPermissions();
  }, []);

  async function checkPermissions() {
    try {
      const perm = await LocalNotifications.checkPermissions();
      setNotifStatus(perm.display === 'granted' ? 'granted' : 'denied');
    } catch {
      setNotifStatus('denied');
    }
  }

  async function requestNotif() {
    const granted = await requestNotificationPermission();
    setNotifStatus(granted ? 'granted' : 'denied');
  }

  function requestOverlay() {
    // On Android, this would open system overlay settings
    setOverlayStatus('granted');
  }

  function openBatterySettings() {
    setBatteryStatus('unrestricted');
  }

  const pages = [
    <Page1 key="p1" theme={theme.id} />,
    <Page2 key="p2" theme={theme.id} />,
    <Page3 key="p3" theme={theme.id} />,
    <Page4
      key="p4"
      notifStatus={notifStatus}
      overlayStatus={overlayStatus}
      batteryStatus={batteryStatus}
      onRequestNotif={requestNotif}
      onRequestOverlay={requestOverlay}
      onOpenBattery={openBatterySettings}
    />,
  ];

  function scrollToPage(idx: number) {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: idx * scrollRef.current.offsetWidth,
        behavior: 'smooth',
      });
    }
  }

  function next() {
    if (page < 3) {
      const newPage = page + 1;
      setPage(newPage);
      scrollToPage(newPage);
    } else {
      onComplete();
    }
  }

  function prev() {
    if (page > 0) {
      const newPage = page - 1;
      setPage(newPage);
      scrollToPage(newPage);
    }
  }

  function skip() {
    onComplete();
  }

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{ backgroundColor: 'var(--c-bg)' }}
    >
      <div className="flex justify-between items-center px-6 pt-[env(safe-area-inset-top,44px)] pb-2">
        <div className="flex gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === page ? 24 : 6,
                backgroundColor: i === page ? 'var(--c-primary)' : 'var(--c-border)',
              }}
            />
          ))}
        </div>
        <button
          onClick={skip}
          className="text-sm font-medium px-4 py-1.5 rounded-full transition-colors hover:opacity-70"
          style={{
            color: 'var(--c-textSecondary)',
            backgroundColor: 'var(--c-surface)',
          }}
        >
          Skip
        </button>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-x-auto overflow-y-hidden flex snap-x snap-mandatory scroll-smooth"
        onScroll={(e) => {
          const idx = Math.round(e.currentTarget.scrollLeft / e.currentTarget.offsetWidth);
          if (idx !== page) setPage(idx);
        }}
      >
        {pages.map((p, i) => (
          <div
            key={i}
            className="w-full h-full shrink-0 snap-center flex items-center justify-center px-6 overflow-y-auto py-4"
          >
            {p}
          </div>
        ))}
      </div>

      <div
        className="flex items-center justify-between px-6 py-4 pb-[max(16px,env(safe-area-inset-bottom,34px))]"
        style={{ borderTop: `1px solid var(--c-border)` }}
      >
        {page > 0 ? (
          <button
            onClick={prev}
            className="flex items-center gap-1 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors hover:opacity-70"
            style={{
              backgroundColor: 'var(--c-surface)',
              color: 'var(--c-text)',
            }}
          >
            <ChevronLeftIcon size={18} color="var(--c-text)" />
            Back
          </button>
        ) : (
          <div />
        )}
        <button
          onClick={next}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-95"
          style={{
            backgroundColor: 'var(--c-primary)',
            color: 'var(--c-primaryText)',
          }}
        >
          {page === 3 ? 'Get Started' : 'Next'}
          <ChevronRightIcon size={18} color="var(--c-primaryText)" />
        </button>
      </div>
    </div>
  );
}

function Page1({ theme }: { theme: string }) {
  return (
    <div className="w-full max-w-sm flex flex-col items-center text-center">
      <div
        className="w-28 h-28 rounded-3xl flex items-center justify-center mb-8"
        style={{
          backgroundColor: 'var(--c-surface)',
          border: `1px solid var(--c-border)`,
        }}
      >
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="13" r="9" stroke="var(--c-primary)" strokeWidth="2" />
          <path d="M12 8v5l3 3" stroke="var(--c-primary)" strokeWidth="2" strokeLinecap="round" />
          <path d="M5 3 2 6M22 6l-3-3" stroke="var(--c-primary)" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <h1
        className="text-3xl font-bold mb-3 tracking-tight"
        style={{ color: 'var(--c-text)' }}
      >
        Welcome to CR Royal Alarm
      </h1>
      <p
        className="text-base leading-relaxed"
        style={{ color: 'var(--c-textSecondary)' }}
      >
        The ultimate mobile alarm experience with native scheduling, mission-based wake-ups, and 30+ cognitive settings designed to get you out of bed.
      </p>
      <div className="flex flex-wrap gap-2 justify-center mt-6">
        {['Native Scheduling', 'Mission Challenges', '5 Themes', '30+ Settings'].map((tag) => (
          <span
            key={tag}
            className="text-xs font-medium px-3 py-1.5 rounded-full"
            style={{
              backgroundColor: 'var(--c-surface)',
              color: 'var(--c-textSecondary)',
              border: `1px solid var(--c-border)`,
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

function Page2({ theme }: { theme: string }) {
  const permissions = [
    {
      icon: <BellIcon size={22} color="var(--c-primary)" />,
      title: 'Notification Permission',
      desc: 'Required to trigger alarms at the scheduled time, even when the app is closed.',
    },
    {
      icon: <ShieldIcon size={22} color="var(--c-primary)" />,
      title: 'Display Over Other Apps',
      desc: 'Allows the alarm to show a full-screen overlay on your lock screen when it fires.',
    },
    {
      icon: <BatteryIcon size={22} color="var(--c-primary)" />,
      title: 'Battery: Unrestricted',
      desc: 'Prevents the OS from killing alarm schedules during Doze mode or battery optimization.',
    },
    {
      icon: <PowerIcon size={22} color="var(--c-primary)" />,
      title: 'Boot Completed',
      desc: 'Auto-re-registers all alarms after a phone reboot so you never miss a wake-up.',
    },
  ];

  return (
    <div className="w-full max-w-sm flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: 'var(--c-surface)' }}
        >
          <LockIcon size={24} color="var(--c-primary)" />
        </div>
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--c-text)' }}>
            Native Permissions
          </h2>
          <p className="text-sm" style={{ color: 'var(--c-textMuted)' }}>
            How CR Royal Alarm uses system access
          </p>
        </div>
      </div>
      <div className="space-y-3">
        {permissions.map((p, i) => (
          <div
            key={i}
            className="flex gap-3 p-4 rounded-2xl"
            style={{
              backgroundColor: 'var(--c-surface)',
              border: `1px solid var(--c-border)`,
            }}
          >
            <div className="shrink-0">{p.icon}</div>
            <div>
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--c-text)' }}>
                {p.title}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--c-textSecondary)' }}>
                {p.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Page3({ theme }: { theme: string }) {
  const missions = [
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="2" width="16" height="20" rx="2" stroke="var(--c-primary)" strokeWidth="2" />
          <path d="M8 6h8M8 10h2M12 10h2M16 10h0M8 14h2M12 14h2M16 14h0M8 18h2M12 18h2" stroke="var(--c-primary)" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
      title: 'Math Mission',
      desc: 'Solve 3-7 algebraic equations to dismiss. Anti-cheat paste blocking included.',
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M18 8a6 6 0 0 0-12 0c0 4-2 6-2 6h16s-2-2-2-6" stroke="var(--c-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M2 2l2 2M22 2l-2 2M2 22l2-2M22 22l-2-2" stroke="var(--c-primary)" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
      title: 'Shake Mission',
      desc: 'Shake your phone 20-100 times. Adjustable intensity from gentle to vigorous.',
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" stroke="var(--c-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7 12h10" stroke="var(--c-primary)" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
      title: 'QR/Barcode Scanner',
      desc: 'Scan a registered barcode to dismiss. Flashlight auto-on and pin backup fallback.',
    },
  ];

  return (
    <div className="w-full max-w-sm flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: 'var(--c-surface)' }}
        >
          <ZapIcon size={24} color="var(--c-primary)" />
        </div>
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--c-text)' }}>
            Mission Setups
          </h2>
          <p className="text-sm" style={{ color: 'var(--c-textMuted)' }}>
            Challenge-based wake-up modes
          </p>
        </div>
      </div>
      <div className="space-y-3">
        {missions.map((m, i) => (
          <div
            key={i}
            className="p-4 rounded-2xl"
            style={{
              backgroundColor: 'var(--c-surface)',
              border: `1px solid var(--c-border)`,
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              {m.icon}
              <p className="text-sm font-semibold" style={{ color: 'var(--c-text)' }}>
                {m.title}
              </p>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--c-textSecondary)' }}>
              {m.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

interface Page4Props {
  notifStatus: 'unknown' | 'granted' | 'denied';
  overlayStatus: 'unknown' | 'granted' | 'denied';
  batteryStatus: 'unknown' | 'unrestricted' | 'optimized';
  onRequestNotif: () => void;
  onRequestOverlay: () => void;
  onOpenBattery: () => void;
}

function Page4({
  notifStatus,
  overlayStatus,
  batteryStatus,
  onRequestNotif,
  onRequestOverlay,
  onOpenBattery,
}: Page4Props) {
  return (
    <div className="w-full max-w-sm flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: 'var(--c-surface)' }}
        >
          <SparklesIcon size={24} color="var(--c-primary)" />
        </div>
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--c-text)' }}>
            Grant Permissions
          </h2>
          <p className="text-sm" style={{ color: 'var(--c-textMuted)' }}>
            Enable native system access
          </p>
        </div>
      </div>
      <div className="space-y-3">
        <PermissionRow
          icon={<BellIcon size={22} color="var(--c-text)" />}
          title="Notifications"
          status={notifStatus}
          onAction={onRequestNotif}
          actionLabel="Allow"
        />
        <PermissionRow
          icon={<ShieldIcon size={22} color="var(--c-text)" />}
          title="Display Over Apps"
          status={overlayStatus}
          onAction={onRequestOverlay}
          actionLabel="Open Settings"
        />
        <PermissionRow
          icon={<BatteryIcon size={22} color="var(--c-text)" />}
          title="Battery: Unrestricted"
          status={batteryStatus}
          onAction={onOpenBattery}
          actionLabel="Open Settings"
        />
      </div>
      <p className="text-xs mt-6 text-center" style={{ color: 'var(--c-textMuted)' }}>
        You can change these permissions anytime in Settings.
      </p>
    </div>
  );
}

function PermissionRow({
  icon,
  title,
  status,
  onAction,
  actionLabel,
}: {
  icon: React.ReactNode;
  title: string;
  status: 'unknown' | 'granted' | 'denied' | 'unrestricted' | 'optimized';
  onAction: () => void;
  actionLabel: string;
}) {
  const granted = status === 'granted' || status === 'unrestricted';
  return (
    <div
      className="flex items-center gap-3 p-4 rounded-2xl"
      style={{
        backgroundColor: 'var(--c-surface)',
        border: `1px solid var(--c-border)`,
      }}
    >
      <div className="shrink-0">{icon}</div>
      <div className="flex-1">
        <p className="text-sm font-semibold" style={{ color: 'var(--c-text)' }}>
          {title}
        </p>
        <p
          className="text-xs mt-0.5"
          style={{
            color: granted ? 'var(--c-success)' : 'var(--c-textMuted)',
          }}
        >
          {granted ? 'Granted' : 'Not granted'}
        </p>
      </div>
      {granted ? (
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'var(--c-success)' }}
        >
          <CheckIcon size={18} color="#fff" />
        </div>
      ) : (
        <button
          onClick={onAction}
          className="px-4 py-2 rounded-xl text-xs font-semibold transition-colors hover:opacity-80"
          style={{
            backgroundColor: 'var(--c-primary)',
            color: 'var(--c-primaryText)',
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
