import { Palette, Cloud, Database, Download, Trash2, Leaf, ArrowLeft, Bell, Smartphone } from 'lucide-react';
import { useState, useEffect } from 'react';

interface SettingsProps {
  onBack: () => void;
  remindersEnabled: boolean;
  onToggleReminders: (enabled: boolean) => void;
}

export function Settings({ onBack, remindersEnabled, onToggleReminders }: SettingsProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleToggle = async () => {
    if (!remindersEnabled && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        onToggleReminders(true);
      } else {
        // Fallback to in-app only if permission denied, but we still enable the in-app banner
        onToggleReminders(true);
      }
    } else {
      onToggleReminders(!remindersEnabled);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-300 space-y-10">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={onBack}
          className="p-2 -ml-2 text-primary hover:bg-surface-container/50 transition-colors active:scale-95 duration-200 rounded-full"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold text-primary">Impostazioni</h2>
      </div>

      <section className="space-y-2">
        <p className="text-primary font-bold tracking-widest uppercase text-xs">Il tuo spazio</p>
        <h2 className="text-3xl font-extrabold tracking-tight text-on-surface">Conoscermi</h2>
        <p className="text-on-surface-variant leading-relaxed">
          Personalizza il tuo percorso e gestisci i tuoi dati locali.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-6">
        {/* App Install */}
        {deferredPrompt && (
          <div className="bg-primary-container p-8 rounded-lg space-y-4">
            <div className="flex items-center gap-3 text-on-primary-container">
              <Smartphone size={24} />
              <h3 className="font-bold text-lg">Installa App</h3>
            </div>
            <p className="text-sm text-on-primary-container/80 leading-relaxed">
              Installa Conoscermi sul tuo dispositivo per un accesso più rapido e un'esperienza migliore.
            </p>
            <button 
              onClick={handleInstallClick}
              className="w-full bg-primary text-on-primary font-bold py-3 rounded-full hover:opacity-90 transition-opacity active:scale-95"
            >
              Installa Ora
            </button>
          </div>
        )}

        {/* Notifications */}
        <div className="bg-surface-container p-8 rounded-lg space-y-6">
          <div className="flex items-center gap-3 text-primary">
            <Bell size={24} />
            <h3 className="font-bold text-lg">Notifiche</h3>
          </div>
          <div className="flex items-center justify-between">
            <div className="pr-4">
              <p className="font-medium text-on-surface">Promemoria Giornaliero</p>
              <p className="text-sm text-on-surface-variant">Ricevi un promemoria per il tuo check-in</p>
            </div>
            <button 
              onClick={handleToggle}
              className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${remindersEnabled ? 'bg-primary' : 'bg-outline-variant'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${remindersEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-surface-container p-8 rounded-lg space-y-6">
          <div className="flex items-center gap-3 text-primary">
            <Palette size={24} />
            <h3 className="font-bold text-lg">Aspetto</h3>
          </div>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-4 rounded-xl bg-surface-container-lowest text-on-surface hover:bg-white transition-colors">
              <span className="font-medium">Tema Chiaro</span>
              <div className="w-5 h-5 rounded-full border-4 border-primary bg-white"></div>
            </button>
            <button className="w-full flex items-center justify-between p-4 rounded-xl bg-surface-container-low text-on-surface-variant hover:bg-white transition-colors opacity-80">
              <span className="font-medium">Tema Scuro</span>
              <div className="w-5 h-5 rounded-full border-2 border-outline-variant"></div>
            </button>
          </div>
        </div>

        {/* Connectivity */}
        <div className="bg-secondary-container p-8 rounded-lg flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-secondary">
              <Cloud size={24} />
              <h3 className="font-bold text-lg">Connettività</h3>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-on-secondary/30 rounded-full w-fit">
              <div className="w-2 h-2 rounded-full bg-secondary animate-pulse"></div>
              <span className="text-xs font-bold text-on-secondary-container uppercase tracking-wider">Pronto Offline</span>
            </div>
            <p className="text-sm text-on-secondary-container leading-relaxed">
              I tuoi dati restano con te anche quando il mondo svanisce.
            </p>
          </div>
        </div>

        {/* Privacy & Storage */}
        <div className="bg-surface-container-low p-8 rounded-lg space-y-8">
          <div className="flex flex-col justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3 text-primary">
                <Database size={24} />
                <h3 className="font-bold text-xl">Privacy & Dati Locali</h3>
              </div>
              <p className="text-on-surface-variant text-sm">
                Non usiamo cloud. Tutto è salvato qui sul tuo dispositivo.
              </p>
            </div>
            <div className="bg-surface-container-highest px-6 py-4 rounded-2xl flex flex-col items-end">
              <span className="text-xs uppercase font-bold tracking-tighter text-on-surface-variant">Utilizzo</span>
              <span className="text-2xl font-black text-primary">1.2 MB</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <button className="flex items-center justify-center gap-3 bg-surface-container-highest text-primary font-bold py-4 px-6 rounded-full hover:bg-outline-variant/20 transition-all active:scale-95">
              <Download size={20} />
              Esporta dati (JSON)
            </button>
            <button className="flex items-center justify-center gap-3 bg-error-container text-error font-bold py-4 px-6 rounded-full hover:bg-error/10 transition-all active:scale-95">
              <Trash2 size={20} />
              Cancella tutto
            </button>
          </div>
          <p className="text-center text-xs text-on-surface-variant/60 font-medium">
            La cancellazione dei dati è permanente e non può essere annullata.
          </p>
        </div>

        {/* About */}
        <div className="py-12 px-8 flex flex-col items-center text-center space-y-4">
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-container rounded-3xl rotate-12 flex items-center justify-center shadow-lg">
            <Leaf className="text-white" size={36} />
          </div>
          <div className="space-y-1">
            <h4 className="font-black text-xl tracking-tight">Conoscermi</h4>
            <p className="text-sm font-medium text-on-surface-variant">Versione 1.0.0 (Aura Calma)</p>
          </div>
          <div className="pt-4 space-y-2">
            <p className="text-primary italic font-medium">"Fatto con cura per il tuo percorso."</p>
          </div>
        </div>
      </div>
    </div>
  );
}
