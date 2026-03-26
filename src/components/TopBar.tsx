import { Settings } from 'lucide-react';

interface TopBarProps {
  title: string;
  onSettingsClick: () => void;
}

export function TopBar({ title, onSettingsClick }: TopBarProps) {
  return (
    <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl">
      <div className="flex justify-between items-center px-6 h-16 w-full max-w-lg mx-auto">
        <button 
          onClick={onSettingsClick}
          className="text-primary hover:opacity-80 transition-opacity active:scale-95 duration-200"
        >
          <Settings size={24} />
        </button>
        <h1 className="font-bold tracking-tight text-lg text-primary">{title}</h1>
        <div className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant/30 bg-surface-container-highest">
          <img 
            src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150&h=150" 
            alt="Profile" 
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </header>
  );
}
