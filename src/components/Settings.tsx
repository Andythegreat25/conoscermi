import { Palette, Cloud, Database, Download, Upload, Trash2, Leaf, ArrowLeft, Bell, Smartphone, Lock, Key, RefreshCw, Camera, FileText, Moon } from 'lucide-react';
import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { toast } from 'sonner';
import { DiaryEntry } from '../types';

interface StorageBreakdown {
  total: string;
  diary: string;
  avatar: string;
  settings: string;
  entryCount: number;
}

interface SettingsProps {
  onBack: () => void;
  remindersEnabled: boolean;
  onToggleReminders: (enabled: boolean) => void;
  reminderHour: number;
  onReminderHourChange: (hour: number) => void;
  eveningReminderEnabled: boolean;
  onToggleEveningReminder: (enabled: boolean) => void;
  eveningReminderHour: number;
  onEveningReminderHourChange: (hour: number) => void;
  onLogout: () => void;
  onCheckUpdates: () => void;
  isCheckingUpdates?: boolean;
  theme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
  avatarUrl: string | null;
  onAvatarChange: (url: string | null) => void;
}

export function Settings({
  onBack,
  remindersEnabled,
  onToggleReminders,
  reminderHour,
  onReminderHourChange,
  eveningReminderEnabled,
  onToggleEveningReminder,
  eveningReminderHour,
  onEveningReminderHourChange,
  onLogout,
  onCheckUpdates,
  isCheckingUpdates = false,
  theme,
  onThemeChange,
  avatarUrl,
  onAvatarChange
}: SettingsProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [storageBreakdown, setStorageBreakdown] = useState<StorageBreakdown | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // ── #10 Storage breakdown dettagliato ────────────────────────────────────
    const entriesStr = localStorage.getItem('diary_entries') || '';
    const fullSettingsStr = localStorage.getItem('app_settings') || '';

    let avatarKB = 0;
    let settingsKB = 0;
    try {
      const parsed = JSON.parse(fullSettingsStr);
      const avatarStr: string = parsed.avatarUrl || '';
      // base64 → bytes approssimativo: (length * 3) / 4
      avatarKB = (avatarStr.length * 3) / 4 / 1024;
      const withoutAvatar = JSON.stringify({ ...parsed, avatarUrl: null });
      settingsKB = withoutAvatar.length / 1024;
    } catch {
      settingsKB = fullSettingsStr.length / 1024;
    }

    const entriesKB = entriesStr.length / 1024;
    const totalKB = (entriesStr.length + fullSettingsStr.length) / 1024;

    const fmt = (kb: number) =>
      kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.max(kb, 0).toFixed(1)} KB`;

    let entryCount = 0;
    try { entryCount = JSON.parse(entriesStr).length; } catch { /* noop */ }

    setStorageBreakdown({
      total: fmt(totalKB),
      diary: fmt(entriesKB),
      avatar: fmt(avatarKB),
      settings: fmt(settingsKB),
      entryCount,
    });

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

  // ── #3 Notification permission gestita correttamente ─────────────────────
  const handleToggle = async () => {
    if (!remindersEnabled && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        onToggleReminders(true);
      } else {
        toast.error('Abilita le notifiche nelle impostazioni del browser per usare i promemoria');
        // Non attiviamo i reminder se i permessi sono stati negati
      }
    } else {
      onToggleReminders(!remindersEnabled);
    }
  };

  const handleToggleEvening = async () => {
    if (!eveningReminderEnabled && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        onToggleEveningReminder(true);
      } else {
        toast.error('Abilita le notifiche nelle impostazioni del browser per usare i promemoria');
      }
    } else {
      onToggleEveningReminder(!eveningReminderEnabled);
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

      const sortedEntries = [...entries].sort((a, b) => b.timestamp - a.timestamp);

      sortedEntries.forEach((entry) => {
        const lines = doc.splitTextToSize(entry.note || "Nessuna nota.", maxWidth);
        const eveningLines = entry.eveningNote ? doc.splitTextToSize(`🌙 Sera: ${entry.eveningNote}`, maxWidth) : [];
        const entryHeight = (lines.length * 7) + (eveningLines.length * 7) + 25;

        if (y + entryHeight > 280) {
          doc.addPage();
          y = 20;
        }

        doc.setFontSize(14);
        doc.setTextColor(40, 40, 40);
        doc.setFont("helvetica", "bold");
        doc.text(`${entry.date} - ${entry.mood}`, margin, y);
        y += 7;

        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.setFont("helvetica", "normal");
        doc.text(entry.time, margin, y);
        y += 7;

        doc.setFontSize(12);
        doc.setTextColor(60, 60, 60);
        doc.text(lines, margin, y);
        y += lines.length * 7;

        if (eveningLines.length > 0) {
          doc.setFontSize(11);
          doc.setTextColor(80, 80, 120);
          doc.text(eveningLines, margin, y);
          y += eveningLines.length * 7;
        }

        y += 15;
      });

      doc.save(`conoscermi-diario-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error("PDF Export failed:", error);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleImport = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      try {
        const imported: DiaryEntry[] = JSON.parse(reader.result as string);
        if (!Array.isArray(imported)) throw new Error('Formato non valido');
        // Merge: keep existing entries, add only those not already present (by id)
        const existing: DiaryEntry[] = JSON.parse(localStorage.getItem('diary_entries') || '[]');
        const existingIds = new Set(existing.map(e => e.id));
        const newEntries = imported.filter(e => !existingIds.has(e.id));
        const merged = [...existing, ...newEntries].sort((a, b) => b.timestamp - a.timestamp);
        localStorage.setItem('diary_entries', JSON.stringify(merged));
        toast.success(`Importate ${newEntries.length} nuove voci ✓`, {
          description: newEntries.length === 0 ? 'Tutte le voci erano già presenti.' : undefined,
        });
        // Reset the input so the same file can be selected again
        e.target.value = '';
        setTimeout(() => window.location.reload(), 1200);
      } catch {
        toast.error('File non valido. Assicurati di usare un backup esportato da Conoscermi.');
        e.target.value = '';
      }
    };
    reader.readAsText(file);
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

  const hourOptions = Array.from({ length: 17 }, (_, i) => i + 7);

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

          {/* Morning reminder */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="pr-4">
                <p className="font-medium text-on-surface">Promemoria Mattutino</p>
                <p className="text-sm text-on-surface-variant">Check-in giornaliero</p>
              </div>
              <button
                onClick={handleToggle}
                className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${remindersEnabled ? 'bg-primary' : 'bg-outline-variant'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${remindersEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>
            {remindersEnabled && (
              <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20">
                <p className="text-sm text-on-surface-variant">Orario</p>
                <select
                  value={reminderHour}
                  onChange={e => onReminderHourChange(Number(e.target.value))}
                  className="bg-surface-container-highest text-on-surface font-bold text-sm px-3 py-2 rounded-xl border-0 focus:ring-2 focus:ring-primary outline-none"
                >
                  {hourOptions.map(h => (
                    <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="border-t border-outline-variant/20 pt-4 space-y-3">
            {/* Evening reminder */}
            <div className="flex items-center justify-between">
              <div className="pr-4 flex items-center gap-2">
                <Moon size={16} className="text-tertiary shrink-0" />
                <div>
                  <p className="font-medium text-on-surface">Nota Serale</p>
                  <p className="text-sm text-on-surface-variant">Riflessione di fine giornata</p>
                </div>
              </div>
              <button
                onClick={handleToggleEvening}
                className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${eveningReminderEnabled ? 'bg-tertiary' : 'bg-outline-variant'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${eveningReminderEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>
            {eveningReminderEnabled && (
              <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20">
                <p className="text-sm text-on-surface-variant">Orario</p>
                <select
                  value={eveningReminderHour}
                  onChange={e => onEveningReminderHourChange(Number(e.target.value))}
                  className="bg-surface-container-highest text-on-surface font-bold text-sm px-3 py-2 rounded-xl border-0 focus:ring-2 focus:ring-tertiary outline-none"
                >
                  {Array.from({ length: 7 }, (_, i) => i + 18).map(h => (
                    <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
                  ))}
                </select>
              </div>
            )}
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
              disabled={isCheckingUpdates}
              className="w-full flex items-center justify-center gap-2 bg-secondary text-on-secondary font-bold py-3 rounded-full hover:opacity-90 transition-opacity active:scale-95 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <RefreshCw size={16} className={isCheckingUpdates ? 'animate-spin' : ''} />
              {isCheckingUpdates ? 'Controllo in corso…' : 'Controlla aggiornamenti'}
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

            {/* ── #10 Storage breakdown ─────────────────────────────────── */}
            <div className="bg-surface-container-highest px-6 py-4 rounded-2xl">
              <div className="flex flex-col items-end mb-3">
                <span className="text-xs uppercase font-bold tracking-tighter text-on-surface-variant">Utilizzo totale</span>
                <span className="text-2xl font-black text-primary">{storageBreakdown?.total ?? '...'}</span>
              </div>
              {storageBreakdown && (
                <div className="space-y-2 border-t border-outline-variant/20 pt-3">
                  <div className="flex justify-between text-xs text-on-surface-variant">
                    <span>📓 Diario ({storageBreakdown.entryCount} voci)</span>
                    <span className="font-bold">{storageBreakdown.diary}</span>
                  </div>
                  {parseFloat(storageBreakdown.avatar) > 0.1 && (
                    <div className="flex justify-between text-xs text-on-surface-variant">
                      <span>🖼️ Foto profilo</span>
                      <span className="font-bold">{storageBreakdown.avatar}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-on-surface-variant">
                    <span>⚙️ Impostazioni</span>
                    <span className="font-bold">{storageBreakdown.settings}</span>
                  </div>
                </div>
              )}
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
              onClick={() => importInputRef.current?.click()}
              className="flex items-center justify-center gap-3 bg-surface-container-highest text-primary font-bold py-4 px-6 rounded-full hover:bg-outline-variant/20 transition-all active:scale-95"
            >
              <Upload size={20} />
              Importa backup (JSON)
            </button>
            <input
              type="file"
              ref={importInputRef}
              onChange={handleImport}
              accept="application/json,.json"
              className="hidden"
            />
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
            <p className="text-sm font-medium text-on-surface-variant">Versione 1.2.0 (Aura Calma)</p>
          </div>
          <div className="pt-4 space-y-2">
            <p className="text-primary italic font-medium">"Fatto con cura per il tuo percorso."</p>
          </div>
        </div>
      </div>
    </div>
  );
}
