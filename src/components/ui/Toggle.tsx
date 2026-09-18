interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, description, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className="flex items-center justify-between w-full gap-3 group"
    >
      {(label || description) && (
        <div className="flex-1 text-left">
          {label && (
            <p className="text-sm font-medium" style={{ color: 'var(--c-text)' }}>
              {label}
            </p>
          )}
          {description && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--c-textMuted)' }}>
              {description}
            </p>
          )}
        </div>
      )}
      <span
        className="relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200"
        style={{
          backgroundColor: checked ? 'var(--c-primary)' : 'var(--c-border)',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <span
          className="inline-block h-5 w-5 transform rounded-full transition-transform duration-200"
          style={{
            backgroundColor: checked ? 'var(--c-primaryText)' : '#fff',
            transform: checked ? 'translateX(24px)' : 'translateX(4px)',
          }}
        />
      </span>
    </button>
  );
}
