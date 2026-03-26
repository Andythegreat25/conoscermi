import { useState, useEffect } from 'react';
import { TopBar } from './components/TopBar';
import { BottomNav, Tab } from './components/BottomNav';
import { Home } from './components/Home';
import { CheckIn } from './components/CheckIn';
import { Diary } from './components/Diary';
import { Journey } from './components/Journey';
import { Motivations } from './components/Motivations';
import { Settings } from './components/Settings';
import { ReminderBanner } from './components/ReminderBanner';
import { PinLock } from './components/PinLock';
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
  
  const [currentTab, setCurrentTab] = useState<Tab>('home');
  const [showSettings, setShowSettings] = useState(false);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [dismissedDate, setDismissedDate] = useState<string | null>(null);

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
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
  }, []);

  // Save entries to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('diary_entries', JSON.stringify(entries));
  }, [entries]);

  const saveSettingsLocally = (reminders: boolean, dismissed: string | null) => {
    const settings = { remindersEnabled: reminders, dismissedDate: dismissed };
    localStorage.setItem('app_settings', JSON.stringify(settings));
  };

  const handleToggleReminders = (enabled: boolean) => {
    setRemindersEnabled(enabled);
    saveSettingsLocally(enabled, dismissedDate);
  };

  const handleDismissReminder = () => {
    const todayStr = new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
    setDismissedDate(todayStr);
    saveSettingsLocally(remindersEnabled, todayStr);
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
    const now = new Date();
    const dateOpts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    const timeOpts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
    
    const newEntry: DiaryEntry = {
      ...newEntryData,
      id: crypto.randomUUID(),
      timestamp: now.getTime(),
      date: now.toLocaleDateString('it-IT', dateOpts).toUpperCase(),
      time: now.toLocaleTimeString('en-US', timeOpts),
      uid: 'local-user'
    };

    const updatedEntries = [newEntry, ...entries];
    setEntries(updatedEntries);
    localStorage.setItem('diary_entries', JSON.stringify(updatedEntries));
    setCurrentTab('diary');
  };

  const handleLogout = () => {
    setIsUnlocked(false);
  };

  if (hasPin === null) {
    return <div className="min-h-screen bg-surface flex items-center justify-center text-on-surface">Caricamento...</div>;
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
        />
      );
    }

    switch (currentTab) {
      case 'home':
        return (
          <Home 
            onNavigateToDiary={() => setCurrentTab('diary')}
            onNavigateToCheckIn={() => setCurrentTab('checkin')}
            lastMood={entries[0]?.mood}
            entries={entries}
          />
        );
      case 'checkin':
        return <CheckIn onSave={handleSaveEntry} />;
      case 'diary':
        return <Diary entries={entries} onAddEntry={() => setCurrentTab('checkin')} />;
      case 'journey':
        return <Journey entries={entries} />;
      case 'motivations':
        return <Motivations />;
      default:
        return <Home 
          onNavigateToDiary={() => setCurrentTab('diary')}
          onNavigateToCheckIn={() => setCurrentTab('checkin')}
          lastMood={entries[0]?.mood}
          entries={entries}
        />;
    }
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface font-sans selection:bg-primary-container selection:text-on-primary-container flex justify-center">
      <Toaster position="top-center" richColors />
      <div className="w-full max-w-[430px] relative min-h-screen pb-28">
        {!showSettings && (
          <TopBar 
            title="Conoscermi" 
            onSettingsClick={() => setShowSettings(true)} 
          />
        )}
        
        {shouldShowBanner && (
          <ReminderBanner 
            onClose={handleDismissReminder} 
            onClick={() => {
              setCurrentTab('checkin');
              handleDismissReminder();
            }} 
          />
        )}

        <main className={`px-6 ${showSettings ? 'pt-12' : 'pt-24'}`}>
          {renderContent()}
        </main>

        {!showSettings && (
          <BottomNav 
            currentTab={currentTab} 
            onTabChange={setCurrentTab} 
          />
        )}
      </div>
    </div>
  );
}

