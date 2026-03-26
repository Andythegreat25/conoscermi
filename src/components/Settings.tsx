import { Palette, Cloud, Database, Download, Trash2, Leaf, ArrowLeft, Bell, Smartphone, Lock, Key, RefreshCw, Camera, User, FileText } from 'lucide-react';
import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { DiaryEntry } from '../types';

interface SettingsProps {
  onBack: () => void;
  remindersEnabled: boolean;
  onToggleReminders: (enabled: boolean) => void;
  onLogout: () => void;
  onCheckUpdates: () => void;
  theme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
  avatarUrl: string | null;
  onAvatarChange: (url: string | null) => void;
}

export function Settings({ 
  onBack, 
  remindersEnabled, 
  onToggleReminders, 
  onLogout, 
  onCheckUpdates,
  theme,
  onThemeChange,
  avatarUrl,
  onAvatarChange
}: SettingsProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [storageSize, setStorageSize] = useState('0 KB');
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    
    // Calculate storage size
    const entries = localStorage.getItem('diary_entries') || '';
    const settings = localStorage.getItem('app_settings') || '';
    const size = (entries.length + settings.length) / 1024;
    setStorageSize(size > 1024 ? `${(size / 1024).toFixed(1)} MB` : `${size.toFixed(1)} KB`);

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
        onToggleReminders(true);
      }
    } else {
      onToggleReminders(!remindersEnabled);
    }
  };

  const handleExport = () => {
    const entries = localStorage.getItem('diary_entries');
    if (!entries) return;
    const blob = new Blob([entries], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conoscermi-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      const { jsPDF } = await import('jspdf');
      const entriesStr = localStorage.getItem('diary_entries');
      if (!entriesStr) return;
      
      const entries: DiaryEntry[] = JSON.parse(entriesStr);
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(22);
      doc.setTextColor(40, 40, 40);
      doc.text("Il Mio Diario - Conoscermi", 20, 20);
      
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(`Esportato il: ${new Date().toLocaleDateString('it-IT')}`, 20, 30);
      
      let y = 45;
      const margin = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const maxWidth = pageWidth - (margin * 2);

      // Sort entries by timestamp (newest first)
      const sortedEntries = [...entries].sort((a, b) => b.timestamp - a.timestamp);

      sortedEntries.forEach((entry) => {
        // Check if we need a new page (approximate height of an entry)
        const lines = doc.splitTextToSize(entry.note || "Nessuna nota.", maxWidth);
        const entryHeight = (lines.length * 7) + 25;

        if (y + entryHeight > 280) {
          doc.addPage();
          y = 20;
        }

        // Date and Mood
        doc.setFontSize(14);
        doc.setTextColor(40, 40, 40);
        doc.setFont("helvetica", "bold");
        doc.text(`${entry.date} - ${entry.mood}`, margin, y);
        y += 7;

        // Time
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.setFont("helvetica", "normal");
        doc.text(entry.time, margin, y);
        y += 7;

        // Note
        doc.setFontSize(12);
        doc.setTextColor(60, 60, 60);
        doc.text(lines, margin, y);
        
        y += (lines.length * 7) + 15; // Add spacing after entry
      });

      doc.save(`conoscermi-diario-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error("PDF Export failed:", error);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleClearAll = () => {
    if (confirm('Sei sicuro di voler cancellare tutti i dati? Questa azione è irreversibile.')) {
      localStorage.removeItem('diary_entries');
      localStorage.removeItem('app_settings');
      window.location.reload();
    }
  };

  const handleChangePin = () => {
    if (confirm('Vuoi cambiare il tuo PIN? Verrai disconnesso per impostarne uno nuovo.')) {
      localStorage.removeItem('user_pin');
      window.location.reload();
    }
  };

  const handleAvatarUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onAvatarChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerAvatarUpload = () => {
    fileInputRef.current?.click();
  };

  const defaultAvatar = "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150&h=150";

  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-300 space-y-10 pb-12">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 -ml-2 text-primary hover:bg-surface-container/50 transition-colors active:scale-95 duration-200 rounded-full"
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-2xl font-bold text-primary">Impostazioni</h2>
        </div>
        <button 
          onClick={onLogout}
          className="flex items-center gap-2 bg-surface-container-high text-on-surface px-4 py-2 rounded-full text-sm font-bold hover:bg-surface-container-highest transition-colors active:scale-95"
        >
          <Lock size={16} />
          Blocca
        </button>
      </div>

      <section className="space-y-2">
        <p className="text-primary font-bold tracking-widest uppercase text-xs">Il tuo spazio</p>
        <div className="flex items-center gap-6">
          <div className="relative group">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-primary/20 bg-surface-container-highest shrink-0">
              <img 
                src={avatarUrl || defaultAvatar} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
            <button 
              onClick={triggerAvatarUpload}
              className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"
            >
              <Camera size={16} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleAvatarUpload} 
              accept="image/*" 
              className="hidden" 
            />
          </div>
          <div className="space-y-1">
            <h2 className="text-3xl font-extrabold tracking-tight text-on-surface">Conoscermi</h2>
            <p className="text-on-surface-variant leading-relaxed">
              Personalizza il tuo percorso e gestisci i tuoi dati locali.
            </p>
          </div>
        </div>
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

        {/* Security */}
        <div className="bg-surface-container p-8 rounded-lg space-y-6">
          <div className="flex items-center gap-3 text-primary">
            <Key size={24} />
            <h3 className="font-bold text-lg">Sicurezza</h3>
          </div>
          <button 
            onClick={handleChangePin}
            className="w-full flex items-center justify-between p-4 rounded-xl bg-surface-container-lowest text-on-surface hover:bg-white transition-colors"
          >
            <span className="font-medium">Cambia PIN di accesso</span>
            <ArrowLeft size={20} className="rotate-180 text-outline-variant" />
          </button>
        </div>

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
            <button 
              onClick={() => onThemeChange('light')}
              className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${
                theme === 'light' 
                  ? 'bg-surface-container-lowest text-on-surface border-2 border-primary shadow-sm' 
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-highest/50'
              }`}
            >
              <span className="font-medium">Tema Chiaro</span>
              <div className={`w-5 h-5 rounded-full border-2 ${theme === 'light' ? 'border-primary bg-primary' : 'border-outline-variant'}`}>
                {theme === 'light' && <div className="w-full h-full flex items-center justify-center"><div className="w-1.5 h-1.5 bg-white rounded-full"></div></div>}
              </div>
            </button>
            <button 
              onClick={() => onThemeChange('dark')}
              className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${
                theme === 'dark' 
                  ? 'bg-surface-container-lowest text-on-surface border-2 border-primary shadow-sm' 
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-highest/50'
              }`}
            >
              <span className="font-medium">Tema Scuro</span>
              <div className={`w-5 h-5 rounded-full border-2 ${theme === 'dark' ? 'border-primary bg-primary' : 'border-outline-variant'}`}>
                {theme === 'dark' && <div className="w-full h-full flex items-center justify-center"><div className="w-1.5 h-1.5 bg-white rounded-full"></div></div>}
              </div>
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
            <button 
              onClick={onCheckUpdates}
              className="w-full flex items-center justify-center gap-2 bg-secondary text-on-secondary font-bold py-3 rounded-full hover:opacity-90 transition-opacity active:scale-95 text-sm"
            >
              <RefreshCw size={16} />
              Controlla aggiornamenti
            </button>
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
              <span className="text-2xl font-black text-primary">{storageSize}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <button 
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className="flex items-center justify-center gap-3 bg-primary text-white font-bold py-4 px-6 rounded-full hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
            >
              {isExportingPDF ? (
                <RefreshCw size={20} className="animate-spin" />
              ) : (
                <FileText size={20} />
              )}
              Esporta Diario (PDF)
            </button>
            <button 
              onClick={handleExport}
              className="flex items-center justify-center gap-3 bg-surface-container-highest text-primary font-bold py-4 px-6 rounded-full hover:bg-outline-variant/20 transition-all active:scale-95"
            >
              <Download size={20} />
              Esporta dati (JSON)
            </button>
            <button 
              onClick={handleClearAll}
              className="flex items-center justify-center gap-3 bg-error-container text-error font-bold py-4 px-6 rounded-full hover:bg-error/10 transition-all active:scale-95"
            >
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
            <p className="text-sm font-medium text-on-surface-variant">Versione 1.1.0 (Aura Calma)</p>
          </div>
          <div className="pt-4 space-y-2">
            <p className="text-primary italic font-medium">"Fatto con cura per il tuo percorso."</p>
          </div>
        </div>
      </div>
    </div>
  );
}

