interface DefaultAvatarProps {
  className?: string;
}

/** Avatar predefinito vettoriale: nessuna richiesta di rete, funziona offline. */
export function DefaultAvatar({ className = 'w-full h-full' }: DefaultAvatarProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label="Profilo"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="100" height="100" fill="var(--color-primary-container)" />
      <circle cx="50" cy="38" r="17" fill="var(--color-on-primary-container)" opacity="0.9" />
      <path
        d="M16 100c0-19 15.5-32 34-32s34 13 34 32z"
        fill="var(--color-on-primary-container)"
        opacity="0.9"
      />
    </svg>
  );
}
