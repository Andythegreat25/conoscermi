import { Home, Book, CheckCircle2, MessageCircle, LineChart } from 'lucide-react';

export type Tab = 'home' | 'diary' | 'checkin' | 'echoes' | 'journey';

interface BottomNavProps {
  currentTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function BottomNav({ currentTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'diary', icon: Book, label: 'Diario' },
    { id: 'checkin', icon: CheckCircle2, label: 'Check-in' },
    { id: 'echoes', icon: MessageCircle, label: 'Echi' },
    { id: 'journey', icon: LineChart, label: 'Percorso' },
  ] as const;

  return (
    <nav
      aria-label="Navigazione principale"
      className="fixed bottom-0 left-0 w-full z-50 flex justify-center pointer-events-none px-3"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
    >
      <div className="glass w-full max-w-[400px] rounded-full border border-white/50 dark:border-white/10 shadow-[0_12px_32px_rgba(40,30,25,0.14),inset_0_1px_0_rgba(255,255,255,0.7)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.12)] pointer-events-auto">
        <div className="flex items-stretch justify-between gap-1 p-1.5">
          {tabs.map(({ id, icon: Icon, label }) => {
            const isActive = currentTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onTabChange(id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex-1 min-w-[44px] min-h-[44px] flex flex-col items-center justify-center gap-0.5 rounded-full px-1 py-1.5 transition-[background-color,color,transform] duration-200 active:scale-95 ${
                  isActive
                    ? 'bg-primary/15 text-primary shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)]'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span
                  className={`whitespace-nowrap text-[10px] leading-none tracking-wide ${
                    isActive ? 'font-bold' : 'font-medium'
                  }`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
