import { Home, Book, CheckCircle2, Sparkles, LineChart } from 'lucide-react';

export type Tab = 'home' | 'diary' | 'checkin' | 'motivations' | 'journey';

interface BottomNavProps {
  currentTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function BottomNav({ currentTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'diary', icon: Book, label: 'Diario' },
    { id: 'checkin', icon: CheckCircle2, label: 'Check-in' },
    { id: 'motivations', icon: Sparkles, label: 'Motivazioni' },
    { id: 'journey', icon: LineChart, label: 'Statistiche' },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 bg-surface/80 backdrop-blur-xl rounded-t-[32px] shadow-[0_-12px_32px_rgba(61,61,61,0.06)]">
      <div className="max-w-lg mx-auto flex justify-around items-center px-4 pb-6 pt-2 h-20">
        {tabs.map(({ id, icon: Icon, label }) => {
          const isActive = currentTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex flex-col items-center justify-center p-2 transition-all duration-300 active:scale-90 ${
                isActive 
                  ? 'bg-gradient-to-br from-primary to-primary-container text-white rounded-full p-3 mb-1 shadow-lg' 
                  : 'text-outline-variant hover:text-primary'
              }`}
            >
              <Icon size={isActive ? 24 : 24} strokeWidth={isActive ? 2.5 : 2} />
              {!isActive && (
                <span className="text-[10px] font-medium uppercase tracking-wider mt-1">
                  {label}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
