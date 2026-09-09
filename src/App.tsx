import { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { TopBar } from './components/TopBar';
import { BottomNav, Tab } from './components/BottomNav';
import { Home } from './components/Home';
import { CheckIn } from './components/CheckIn';
import { Diary } from './components/Diary';
import { Journey } from './components/Journey';
import { Echoes } from './components/Echoes';
import { Motivations } from './components/Motivations';
import { Settings } from './components/Settings';
import { ReminderBanner } from './components/ReminderBanner';
import { PinLock } from './components/PinLock';
import { SplashScreen } from './components/SplashScreen';
import { QuickJournal } from './components/QuickJournal';
import { EveningNote } from './components/EveningNote';
import { DiaryEntry } from './types';
import { Toaster, toast } from 'sonner';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw } from 'lucide-react';
import { saveReminderSettings, saveEveningReminderSettings } from './utils/db';
import { hasCheckedInToday } from './utils/streak';
import { localDateKey, recordReminderActivity, syncPushPreferences } from './utils/push';

export default function App() {
  const swRegistrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const needRefreshRef = useRef(false);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        swRegistrationRef.current = r;
        setInterval(() => {
          r.update();
        }, 15 * 60 * 1000);
      }
    },
  });

  // Keep ref in sync so handleCheckUpdates can read the latest value
  useEffect(() => {
    needRefreshRef.current = needRefresh;
  }, [needRefresh]);

  useEffect(() => {
    if (offlineReady) {
      toast.success('App pronta per l\'uso offline', {
        description: 'L\'app è stata salvata sul tuo dispositivo.',
        duration: 5000,
      });
      setOfflineReady(false);
    }
  }, [offlineReady, setOfflineReady]);

  useEffect(() => {
    if (needRefresh) {
      toast('Aggiornamento disponibile', {
        description: 'È disponibile una nuova versione dell\'app. Ricarica per aggiornare.',
        icon: <RefreshCw className="animate-spin text-primary" size={20} />,
        duration: Infinity,
        action: {
          label: 'Ricarica ora',
          onClick: () => updateServiceWorker(true),
        },
        cancel: {
          label: 'Più tardi',
          onClick: () => setNeedRefresh(false),
        },
      });
    }
  }, [needRefresh, setNeedRefresh, updateServiceWorker]);

  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);

  const handleCheckUpdates = async () => {
    setIsCheckingUpdates(true);
    const toastId = toast.loading('Ricerca aggiornamenti in corso…');
    try {
      if (swRegistrationRef.current) {
        await swRegistrationRef.current.update();
      }
      // Wait up to 2 s for the SW update event to fire and set needRefresh
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.dismiss(toastId);
      if (needRefreshRef.current) {
        // Nuovo SW trovato → attivalo subito e ricarica
        toast.loading('Aggiornamento in corso…');
        try {
          await updateServiceWorker(false); // invia SKIP_WAITING senza fare il reload
        } finally {
          window.location.reload(); // garantiamo sempre il reload
        }
      } else {
        toast.success('App già aggiornata ✓');
      }
    } catch {
      toast.dismiss(toastId);
      toast.error('Impossibile verificare gli aggiornamenti');
    } finally {
      setIsCheckingUpdates(false);
    }
  };

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [hasPin, setHasPin] = useState<boolean | null>(null);
  const [showSplash, setShowSplash] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();
  const currentTab = (location.pathname === '/' ? 'home' : location.pathname.substring(1)) as Tab;

  const [showSettings, setShowSettings] = useState(false);
  const [showMotivations, setShowMotivations] = useState(false);
  const [showQuickJournal, setShowQuickJournal] = useState(false);
  const [showEveningNote, setShowEveningNote] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [reminderHour, setReminderHour] = useState(9);
  const [eveningReminderEnabled, setEveningReminderEnabled] = useState(false);
  const [eveningReminderHour, setEveningReminderHour] = useState(21);
  const [dismissedDate, setDismissedDate] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Check for existing PIN and load initial data
  useEffect(() => {
    const savedPin = localStorage.getItem('user_pin');
    setHasPin(!!savedPin);

    const savedEntries = localStorage.getItem('diary_entries');
    if (savedEntries) {
      try {
        setEntries(JSON.parse(savedEntries));
      } catch (e) {
        console.error("Failed to parse entries", e);
      }
    }

    const savedSettings = localStorage.getItem('app_settings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        if (settings.remindersEnabled !== undefined) setRemindersEnabled(settings.remindersEnabled);
        if (settings.reminderHour !== undefined) setReminderHour(settings.reminderHour);
        if (settings.eveningReminderEnabled !== undefined) setEveningReminderEnabled(settings.eveningReminderEnabled);
        if (settings.eveningReminderHour !== undefined) setEveningReminderHour(settings.eveningReminderHour);
        if (settings.dismissedDate !== undefined) setDismissedDate(settings.dismissedDate);
        if (settings.theme) setTheme(settings.theme);
        if (settings.avatarUrl) setAvatarUrl(settings.avatarUrl);
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }

    setSettingsLoaded(true);

    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // Apply theme to document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Save entries to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('diary_entries', JSON.stringify(entries));
  }, [entries]);

  const saveSettingsLocally = (
    reminders: boolean,
    hour: number,
    dismissed: string | null,
    currentTheme: 'light' | 'dark',
    currentAvatar: string | null,
    eveningReminders: boolean,
    eveningHour: number,
  ) => {
    const settings = {
      remindersEnabled: reminders,
      reminderHour: hour,
      eveningReminderEnabled: eveningReminders,
      eveningReminderHour: eveningHour,
      dismissedDate: dismissed,
      theme: currentTheme,
      avatarUrl: currentAvatar,
    };
    localStorage.setItem('app_settings', JSON.stringify(settings));
  };

  const handleToggleReminders = async (enabled: boolean) => {
    try {
      await syncPushPreferences({
        morningEnabled: enabled,
        morningHour: reminderHour,
        eveningEnabled: eveningReminderEnabled,
        eveningHour: eveningReminderHour,
      });
      setRemindersEnabled(enabled);
      saveSettingsLocally(enabled, reminderHour, dismissedDate, theme, avatarUrl, eveningReminderEnabled, eveningReminderHour);
      await saveReminderSettings({ enabled, hour: reminderHour });
      toast.success(enabled ? 'Promemoria mattutino attivato' : 'Promemoria mattutino disattivato');
    } catch (error) {
      console.error('Unable to update morning push reminder', error);
      toast.error(error instanceof Error ? error.message : 'Impossibile configurare le notifiche push');
    }
  };

  const handleReminderHourChange = (hour: number) => {
    setReminderHour(hour);
    saveSettingsLocally(remindersEnabled, hour, dismissedDate, theme, avatarUrl, eveningReminderEnabled, eveningReminderHour);
    saveReminderSettings({ enabled: remindersEnabled, hour });
    syncPushPreferences({
      morningEnabled: remindersEnabled,
      morningHour: hour,
      eveningEnabled: eveningReminderEnabled,
      eveningHour: eveningReminderHour,
    }).catch(error => {
      console.error('Unable to update morning reminder hour', error);
      toast.error('Orario salvato sul dispositivo, ma non ancora sincronizzato');
    });
  };

  const handleToggleEveningReminder = async (enabled: boolean) => {
    try {
      await syncPushPreferences({
        morningEnabled: remindersEnabled,
        morningHour: reminderHour,
        eveningEnabled: enabled,
        eveningHour: eveningReminderHour,
      });
      setEveningReminderEnabled(enabled);
      saveSettingsLocally(remindersEnabled, reminderHour, dismissedDate, theme, avatarUrl, enabled, eveningReminderHour);
      await saveEveningReminderSettings({ enabled, hour: eveningReminderHour });
      toast.success(enabled ? 'Promemoria serale attivato' : 'Promemoria serale disattivato');
    } catch (error) {
      console.error('Unable to update evening push reminder', error);
      toast.error(error instanceof Error ? error.message : 'Impossibile configurare le notifiche push');
    }
  };

  const handleEveningReminderHourChange = (hour: number) => {
    setEveningReminderHour(hour);
    saveSettingsLocally(remindersEnabled, reminderHour, dismissedDate, theme, avatarUrl, eveningReminderEnabled, hour);
    saveEveningReminderSettings({ enabled: eveningReminderEnabled, hour });
    syncPushPreferences({
      morningEnabled: remindersEnabled,
      morningHour: reminderHour,
      eveningEnabled: eveningReminderEnabled,
      eveningHour: hour,
    }).catch(error => {
      console.error('Unable to update evening reminder hour', error);
      toast.error('Orario salvato sul dispositivo, ma non ancora sincronizzato');
    });
  };

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    saveSettingsLocally(remindersEnabled, reminderHour, dismissedDate, newTheme, avatarUrl, eveningReminderEnabled, eveningReminderHour);
  };

  const handleAvatarChange = (newAvatar: string | null) => {
    setAvatarUrl(newAvatar);
    saveSettingsLocally(remindersEnabled, reminderHour, dismissedDate, theme, newAvatar, eveningReminderEnabled, eveningReminderHour);
  };

  const handleDismissReminder = () => {
    const todayStr = new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
    setDismissedDate(todayStr);
    saveSettingsLocally(remindersEnabled, reminderHour, todayStr, theme, avatarUrl, eveningReminderEnabled, eveningReminderHour);
  };

  const todayStr = new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
  const checkedInToday = hasCheckedInToday(entries);

  // Today's evening note (from the most recent entry of today)
  const todayEveningNote = entries.find(e => e.date === todayStr)?.eveningNote;

  // Migrate devices that already had reminders enabled before Web Push was added.
  useEffect(() => {
    if (!settingsLoaded || (!remindersEnabled && !eveningReminderEnabled)) return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    syncPushPreferences({
      morningEnabled: remindersEnabled,
      morningHour: reminderHour,
      eveningEnabled: eveningReminderEnabled,
      eveningHour: eveningReminderHour,
    }).catch(error => console.warn('Push reminder migration pending', error));
  }, [settingsLoaded]);

  const shouldShowBanner = remindersEnabled && !checkedInToday && dismissedDate !== todayStr && currentTab !== 'checkin' && !showSettings;

  const handleSaveEntry = (newEntryData: Omit<DiaryEntry, 'id' | 'timestamp' | 'date' | 'time' | 'uid'>) => {
    if (editingEntry) {
      const updatedEntries = entries.map(e =>
        e.id === editingEntry.id
          ? { ...e, mood: newEntryData.mood, note: newEntryData.note }
          : e
      );
      setEntries(updatedEntries);
      localStorage.setItem('diary_entries', JSON.stringify(updatedEntries));
      setEditingEntry(null);
    } else {
      const now = new Date();
      const dateOpts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
      const timeOpts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: false };

      const newEntry: DiaryEntry = {
        ...newEntryData,
        id: crypto.randomUUID(),
        timestamp: now.getTime(),
        date: now.toLocaleDateString('it-IT', dateOpts).toUpperCase(),
        time: now.toLocaleTimeString('it-IT', timeOpts),
        uid: 'local-user',
      };

      const updatedEntries = [newEntry, ...entries];
      setEntries(updatedEntries);
      localStorage.setItem('diary_entries', JSON.stringify(updatedEntries));

      // Prevent the server from sending today's morning reminder.
      recordReminderActivity('checkin', localDateKey(now)).catch(error =>
        console.warn('Unable to sync check-in date for push reminders', error)
      );
    }
    setShowQuickJournal(false);
    navigate('/diary');
  };

  /** Save/update the evening note for today. */
  const handleSaveEveningNote = (note: string) => {
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const todayEnd   = new Date(now); todayEnd.setHours(23, 59, 59, 999);

    const todayEntryIndex = entries.findIndex(
      e => e.timestamp >= todayStart.getTime() && e.timestamp <= todayEnd.getTime()
    );

    let updatedEntries: DiaryEntry[];

    if (todayEntryIndex >= 0) {
      // Aggiorna l'entry di oggi
      updatedEntries = entries.map((e, i) =>
        i === todayEntryIndex ? { ...e, eveningNote: note } : e
      );
    } else {
      // Crea un'entry leggera (solo nota serale, mood neutro)
      const dateOpts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
      const timeOpts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: false };
      const newEntry: DiaryEntry = {
        id: crypto.randomUUID(),
        timestamp: now.getTime(),
        date: now.toLocaleDateString('it-IT', dateOpts).toUpperCase(),
        time: now.toLocaleTimeString('it-IT', timeOpts),
        mood: 'Neutro',
        note: '',
        uid: 'local-user',
        eveningNote: note,
        eveningNoteOnly: true, // non conta per lo streak
      };
      updatedEntries = [newEntry, ...entries];
    }

    setEntries(updatedEntries);
    localStorage.setItem('diary_entries', JSON.stringify(updatedEntries));
    recordReminderActivity('evening-note', localDateKey(now)).catch(error =>
      console.warn('Unable to sync evening-note date for push reminders', error)
    );
    setShowEveningNote(false);
    toast.success('Nota serale salvata 🌙');
  };

  const handleLogout = () => {
    setIsUnlocked(false);
  };

  if (showSplash || hasPin === null) {
    return <SplashScreen />;
  }

  if (!isUnlocked) {
    return (
      <PinLock
        isSetup={!hasPin}
        onUnlock={() => {
          setIsUnlocked(true);
          setHasPin(true);
        }}
      />
    );
  }

  const renderContent = () => {
    if (showSettings) {
      return (
        <Settings
          onBack={() => setShowSettings(false)}
          remindersEnabled={remindersEnabled}
          onToggleReminders={handleToggleReminders}
          reminderHour={reminderHour}
          onReminderHourChange={handleReminderHourChange}
          eveningReminderEnabled={eveningReminderEnabled}
          onToggleEveningReminder={handleToggleEveningReminder}
          eveningReminderHour={eveningReminderHour}
          onEveningReminderHourChange={handleEveningReminderHourChange}
          onLogout={handleLogout}
          onCheckUpdates={handleCheckUpdates}
          isCheckingUpdates={isCheckingUpdates}
          theme={theme}
          onThemeChange={handleThemeChange}
          avatarUrl={avatarUrl}
          onAvatarChange={handleAvatarChange}
        />
      );
    }

    if (showQuickJournal) {
      return (
        <QuickJournal
          onBack={() => {
            setShowQuickJournal(false);
            setEditingEntry(null);
          }}
          onSave={handleSaveEntry}
          initialEntry={editingEntry}
        />
      );
    }

    if (showMotivations) {
      return (
        <Motivations
          onClose={() => setShowMotivations(false)}
        />
      );
    }

    return (
      <Routes>
        <Route path="/" element={
          <Home
            onNavigateToDiary={() => navigate('/diary')}
            onNavigateToCheckIn={() => navigate('/checkin')}
            onMotivationsClick={() => setShowMotivations(true)}
            lastMood={entries[0]?.mood}
            entries={entries}
            eveningReminderEnabled={eveningReminderEnabled}
            onOpenEveningNote={() => setShowEveningNote(true)}
            todayEveningNote={todayEveningNote}
          />
        } />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="/checkin" element={<CheckIn onSave={handleSaveEntry} />} />
        <Route path="/diary" element={
          <Diary
            entries={entries}
            onAddEntry={() => {
              setEditingEntry(null);
              setShowQuickJournal(true);
            }}
            onEditEntry={(entry) => {
              setEditingEntry(entry);
              setShowQuickJournal(true);
            }}
          />
        } />
        <Route path="/journey" element={<Journey entries={entries} />} />
        <Route path="/echoes" element={<Echoes apiKey={import.meta.env.VITE_GEMINI_API_KEY || ''} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface font-sans selection:bg-primary-container selection:text-on-primary-container flex justify-center">
      <Toaster position="top-center" richColors />
      <div className="w-full max-w-[430px] relative min-h-screen pb-28">
        {!showSettings && !showQuickJournal && !showMotivations && (
          <TopBar
            title="Conoscermi"
            onSettingsClick={() => setShowSettings(true)}
            onMotivationsClick={() => setShowMotivations(true)}
            avatarUrl={avatarUrl}
          />
        )}

        {shouldShowBanner && !showQuickJournal && (
          <ReminderBanner
            onClose={handleDismissReminder}
            onClick={() => {
              navigate('/checkin');
              handleDismissReminder();
            }}
          />
        )}

        <main className={`px-6 ${showSettings || showQuickJournal || showMotivations ? 'pt-12' : 'pt-24'}`}>
          {renderContent()}
        </main>

        {/* Evening Note Modal */}
        {showEveningNote && (
          <EveningNote
            existingNote={todayEveningNote}
            onSave={handleSaveEveningNote}
            onClose={() => setShowEveningNote(false)}
          />
        )}

        {!showSettings && !showQuickJournal && !showMotivations && (
          <BottomNav
            currentTab={currentTab}
            onTabChange={(tab) => navigate(tab === 'home' ? '/' : `/${tab}`)}
          />
        )}
      </div>
    </div>
  );
}
