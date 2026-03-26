import { Bell, X } from 'lucide-react';

interface ReminderBannerProps {
  onClose: () => void;
  onClick: () => void;
}

export function ReminderBanner({ onClose, onClick }: ReminderBannerProps) {
  return (
    <div className="absolute top-20 left-6 right-6 z-40 animate-in slide-in-from-top-4 fade-in duration-500">
      <div className="bg-surface-container-highest rounded-2xl p-4 shadow-[0_12px_32px_rgba(61,61,61,0.06)] flex items-start gap-4 border border-outline-variant/20">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
          <Bell className="text-primary" size={20} />
        </div>
        <div className="flex-1 cursor-pointer" onClick={onClick}>
          <h4 className="font-bold text-on-surface text-sm">Promemoria</h4>
          <p className="text-on-surface-variant text-xs mt-1 leading-relaxed">
            Non hai ancora fatto il check-in oggi. Prenditi un momento per te.
          </p>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="text-outline-variant hover:text-primary transition-colors p-1 -mr-2 -mt-2"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
