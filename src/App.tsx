import { useState, useEffect } from 'react';
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
import { DiaryEntry } from './types';
import { Toaster, toast } from 'sonner';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw } from 'lucide-react';

export default function App() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        setInterval(() => {
          r.update();
        }, 15 * 60 * 1000);
      }
    },
  });

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

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [hasPin, setHasPin] = useState<boolean | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  
  const navigate = useNavigate();
  const location = useLocation();
  const currentTab = (location.pathname === '/' ? 'home' : location.pathname.substring(1)) as Tab;

  const [showSettings, setShowSettings] = useState(false);
  const [showMotivations, setShowMotivations] = useState(false);
  const [showQuickJournal, setShowQuickJournal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [dismissedDate, setDismissedDate] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

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
        if (settings.dismissedDate !== undefined) setDismissedDate(settings.dismissedDate);
        if (settings.theme) setTheme(settings.theme);
        if (settings.avatarUrl) setAvatarUrl(settings.avatarUrl);
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }

    // Artificial delay for splash screen
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

  const saveSettingsLocally = (reminders: boolean, dismissed: string | null, currentTheme: 'light' | 'dark', currentAvatar: string | null) => {
    const settings = { 
      remindersEnabled: reminders, 
      dismissedDate: dismissed,
      theme: currentTheme,
      avatarUrl: currentAvatar
    };
    localStorage.setItem('app_settings', JSON.stringify(settings));
  };

  const handleToggleReminders = (enabled: boolean) => {
    setRemindersEnabled(enabled);
    saveSettingsLocally(enabled, dismissedDate, theme, avatarUrl);
  };

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    saveSettingsLocally(remindersEnabled, dismissedDate, newTheme, avatarUrl);
  };

  const handleAvatarChange = (newAvatar: string | null) => {
    setAvatarUrl(newAvatar);
    saveSettingsLocally(remindersEnabled, dismissedDate, theme, newAvatar);
  };

  const handleDismissReminder = () => {
    const todayStr = new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
    setDismissedDate(todayStr);
    saveSettingsLocally(remindersEnabled, todayStr, theme, avatarUrl);
  };

  const todayStr = new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
  const hasCheckedInToday = entries.some(e => e.date === todayStr);

  useEffect(() => {
    if (remindersEnabled && !hasCheckedInToday && dismissedDate !== todayStr) {
      if ('Notification' in window && Notification.permission === 'granted') {
        const timer = setTimeout(() => {
          new Notification("Conoscermi", {
            body: "Non hai ancora fatto il check-in oggi. Prenditi un momento per te.",
            icon: "/favicon.ico"
          });
          handleDismissReminder();
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [remindersEnabled, hasCheckedInToday, dismissedDate, todayStr]);

  const shouldShowBanner = remindersEnabled && !hasCheckedInToday && dismissedDate !== todayStr && currentTab !== 'checkin' && !showSettings;

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
        uid: 'local-user'
      };

      const updatedEntries = [newEntry, ...entries];
      setEntries(updatedEntries);
      localStorage.setItem('diary_entries', JSON.stringify(updatedEntries));
    }
    setShowQuickJournal(false);
    navigate('/diary');
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
          onLogout={handleLogout}
          onCheckUpdates={() => updateServiceWorker(true)}
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
        <Route path="/echoes" element={<Echoes apiKey={process.env.GEMINI_API_KEY || ''} />} />
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

