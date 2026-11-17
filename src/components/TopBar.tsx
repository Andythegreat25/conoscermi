import { Settings, Flower2 } from 'lucide-react';
import { DefaultAvatar } from './DefaultAvatar';

interface TopBarProps {
  title: string;
  onSettingsClick: () => void;
  onMotivationsClick: () => void;
  avatarUrl: string | null;
}

export function TopBar({ title, onSettingsClick, onMotivationsClick, avatarUrl }: TopBarProps) {
  return (
    <header className="fixed top-0 w-full z-50 flex justify-center pointer-events-none">
      <div
        className="glass w-full max-w-[430px] pointer-events-auto border-b border-white/40 dark:border-white/10 shadow-[inset_0_-1px_0_rgba(0,0,0,0.04)]"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex justify-between items-center px-4 h-16 w-full">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onSettingsClick}
              aria-label="Impostazioni"
              className="w-11 h-11 flex items-center justify-center rounded-full text-primary hover:bg-primary/10 transition-[background-color,transform] duration-200 active:scale-95 shrink-0"
            >
              <Settings size={24} />
            </button>
            <button
              type="button"
              onClick={onMotivationsClick}
              aria-label="Motivazioni"
              className="w-11 h-11 flex items-center justify-center rounded-full text-primary hover:bg-primary/10 transition-[background-color,transform] duration-200 active:scale-95 shrink-0"
            >
              <Flower2 size={24} />
            </button>
          </div>
          <h1 className="font-bold tracking-tight text-lg text-primary truncate px-2">{title}</h1>
          <div className="w-9 h-9 rounded-full overflow-hidden border border-outline-variant/40 bg-surface-container-highest shrink-0 mr-1">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profilo" className="w-full h-full object-cover" />
            ) : (
              <DefaultAvatar />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
