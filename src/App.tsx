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
import { DiaryEntry } from './types';
import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, User } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, setDoc, doc, getDoc } from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  
  const [currentTab, setCurrentTab] = useState<Tab>('home');
  const [showSettings, setShowSettings] = useState(false);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [dismissedDate, setDismissedDate] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthReady || !user) return;

    const entriesRef = collection(db, `users/${user.uid}/entries`);
    const q = query(entriesRef, orderBy('timestamp', 'desc'));
    
    const unsubscribeEntries = onSnapshot(q, (snapshot) => {
      const loadedEntries: DiaryEntry[] = [];
      snapshot.forEach((doc) => {
        loadedEntries.push(doc.data() as DiaryEntry);
      });
      setEntries(loadedEntries);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/entries`);
    });

    const settingsRef = doc(db, `users/${user.uid}`);
    const unsubscribeSettings = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.remindersEnabled !== undefined) setRemindersEnabled(data.remindersEnabled);
        if (data.dismissedDate !== undefined) setDismissedDate(data.dismissedDate);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
    });

    return () => {
      unsubscribeEntries();
      unsubscribeSettings();
    };
  }, [user, isAuthReady]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const saveSettingsToFirestore = async (reminders: boolean, dismissed: string | null) => {
    if (!user) return;
    try {
      await setDoc(doc(db, `users/${user.uid}`), {
        remindersEnabled: reminders,
        dismissedDate: dismissed,
        uid: user.uid
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  const handleToggleReminders = (enabled: boolean) => {
    setRemindersEnabled(enabled);
    saveSettingsToFirestore(enabled, dismissedDate);
  };

  const handleDismissReminder = () => {
    const todayStr = new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
    setDismissedDate(todayStr);
    saveSettingsToFirestore(remindersEnabled, todayStr);
  };

  const todayStr = new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
  const hasCheckedInToday = entries.some(e => e.date === todayStr);

  useEffect(() => {
    if (remindersEnabled && !hasCheckedInToday && dismissedDate !== todayStr) {
      if ('Notification' in window && Notification.permission === 'granted') {
        const timer = setTimeout(() => {
          new Notification("Nuovo Inizio", {
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

  const handleSaveEntry = async (newEntryData: Omit<DiaryEntry, 'id' | 'timestamp' | 'date' | 'time' | 'uid'>) => {
    if (!user) return;
    
    const now = new Date();
    const dateOpts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    const timeOpts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
    
    const newEntry: DiaryEntry = {
      ...newEntryData,
      id: crypto.randomUUID(),
      timestamp: now.getTime(),
      date: now.toLocaleDateString('it-IT', dateOpts).toUpperCase(),
      time: now.toLocaleTimeString('en-US', timeOpts),
      uid: user.uid
    };

    try {
      await setDoc(doc(db, `users/${user.uid}/entries/${newEntry.id}`), newEntry);
      setCurrentTab('diary');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/entries/${newEntry.id}`);
    }
  };

  if (!isAuthReady) {
    return <div className="min-h-screen bg-surface flex items-center justify-center text-on-surface">Caricamento...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center text-on-surface p-6">
        <h1 className="text-4xl font-extrabold text-primary mb-2">Nuovo Inizio</h1>
        <p className="text-on-surface-variant mb-8 text-center">Accedi per salvare i tuoi progressi e il tuo diario in modo sicuro.</p>
        <button 
          onClick={handleLogin}
          className="bg-primary text-on-primary px-6 py-3 rounded-full font-bold shadow-sm active:scale-95 transition-transform"
        >
          Accedi con Google
        </button>
      </div>
    );
  }

  const renderContent = () => {
    if (showSettings) {
      return (
        <Settings 
          onBack={() => setShowSettings(false)} 
          remindersEnabled={remindersEnabled}
          onToggleReminders={handleToggleReminders}
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
        return <Journey />;
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
      <div className="w-full max-w-[430px] relative min-h-screen pb-28">
        {!showSettings && (
          <TopBar 
            title="Nuovo Inizio" 
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
