import { Flame, PenSquare, Heart, Quote, Activity, BookHeart, Clock, History, Sparkles } from 'lucide-react';
import { Mood, DiaryEntry } from '../types';
import { useMemo } from 'react';

interface HomeProps {
  onNavigateToDiary: () => void;
  onNavigateToCheckIn: () => void;
  onMotivationsClick: () => void;
  lastMood?: Mood;
  entries: DiaryEntry[];
}

export function Home({ onNavigateToDiary, onNavigateToCheckIn, onMotivationsClick, lastMood, entries }: HomeProps) {
  const quotes = [
    "Ogni giorno è un piccolo passo verso una nuova te.",
    "La tua crescita è un viaggio, non una destinazione.",
    "Sii gentile con te stessa oggi.",
    "Piccoli progressi ogni giorno portano a grandi risultati.",
    "Il tuo benessere è una priorità, non un lusso.",
    "Ascolta il tuo cuore, ha sempre qualcosa da dirti.",
    "Oggi è un'opportunità per ricominciare con amore.",
    "La forza non viene da ciò che puoi fare, ma dal superare ciò che pensavi di non poter fare.",
    "Respira. Sei esattamente dove devi essere.",
    "Coltiva la gratitudine e vedrai fiorire la tua anima."
  ];

  const getDailyQuote = () => {
    const today = new Date();
    // Use the day of the year or just the date to pick a quote
    const index = (today.getFullYear() + today.getMonth() + today.getDate()) % quotes.length;
    return quotes[index];
  };

  const dailyQuote = getDailyQuote();

  // Time Capsule Logic
  const timeCapsuleEntry = useMemo(() => {
    if (!entries || entries.length === 0) return null;
    
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    // Check for 1 month ago (approx 30 days) or 1 year ago (365 days)
    const checkIntervals = [30, 365];
    
    for (const days of checkIntervals) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() - days);
      const targetDateStr = targetDate.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
      
      const entry = entries.find(e => e.date === targetDateStr);
      if (entry) return { entry, daysAgo: days };
    }
    
    return null;
  }, [entries]);

  // Calculate streak (consecutive days)
  const calculateStreak = () => {
    if (!entries || entries.length === 0) return 0;
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let currentDate = new Date(today);
    let hasCheckedInToday = false;

    // Check if there's an entry for today
    const todayStr = today.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
    if (entries.some(e => e.date === todayStr)) {
      hasCheckedInToday = true;
      streak = 1;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      // If no entry today, check if there was one yesterday to continue the streak
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
      if (entries.some(e => e.date === yesterdayStr)) {
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        return 0; // No entry today or yesterday, streak is 0
      }
    }

    // Count backwards
    while (true) {
      const dateStr = currentDate.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
      if (entries.some(e => e.date === dateStr)) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  };

  const streak = calculateStreak();
  const totalEntries = entries.length;
  const lastEntryTime = entries[0]?.time || '--:--';

  // Calculate progress circle dashoffset (max 690)
  // Let's make the circle complete at 30 days
  const progressPercentage = Math.min(streak / 30, 1);
  const strokeDashoffset = 690 - (690 * progressPercentage);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-10">
      {/* Hero Progress Section */}
      <section className="flex flex-col items-center">
        <div className="relative w-64 h-64 flex items-center justify-center">
          {/* Progress Circle SVG */}
          <svg className="w-full h-full transform -rotate-90">
            <circle className="text-surface-container" cx="128" cy="128" fill="transparent" r="110" stroke="currentColor" strokeWidth="8"></circle>
            <circle className="text-primary transition-all duration-1000 ease-out" cx="128" cy="128" fill="transparent" r="110" stroke="currentColor" strokeDasharray="690" strokeDashoffset={strokeDashoffset} strokeLinecap="round" strokeWidth="12"></circle>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-1">
            <div className="flex items-center gap-1.5 bg-primary-container/10 px-3 py-1 rounded-full">
              <Flame className="text-primary" size={16} fill="currentColor" />
              <span className="text-primary font-bold text-sm tracking-wide">{streak}</span>
            </div>
            <h2 className="text-primary font-extrabold text-5xl tracking-tighter">Giorno {streak}</h2>
            <p className="text-on-surface-variant font-medium text-sm">
              {streak === 0 ? "Inizia oggi!" : "ce la stai facendo"}
            </p>
          </div>
        </div>
      </section>

      {/* Quick Action Buttons */}
      <section className="flex gap-4">
        <button 
          onClick={onNavigateToDiary}
          className="flex-1 bg-gradient-to-br from-primary to-primary-container text-white h-14 rounded-full font-semibold text-sm shadow-sm active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          <PenSquare size={20} />
          Scrivi nel diario
        </button>
        <button 
          onClick={onNavigateToCheckIn}
          className="flex-1 bg-surface-container-highest text-primary h-14 rounded-full font-semibold text-sm active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          <Heart size={20} fill="currentColor" />
          Come mi sento?
        </button>
      </section>

      {/* Time Capsule Section */}
      {timeCapsuleEntry && (
        <section className="animate-in zoom-in-95 duration-700">
          <div className="bg-gradient-to-br from-secondary-container/40 to-surface-container-high rounded-2xl p-6 border border-secondary/10 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <History size={120} />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                <History size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">Capsula del Tempo</h3>
                <p className="text-[10px] text-on-surface-variant font-medium uppercase tracking-widest">
                  {timeCapsuleEntry.daysAgo === 30 ? "Un mese fa" : "Un anno fa"} • {timeCapsuleEntry.entry.date}
                </p>
              </div>
            </div>
            <div className="bg-white/40 dark:bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <p className="text-on-surface font-medium italic leading-relaxed line-clamp-3">
                "{timeCapsuleEntry.entry.note || "Nessuna nota scritta quel giorno."}"
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 bg-secondary/20 text-secondary rounded-full uppercase">
                  {timeCapsuleEntry.entry.mood}
                </span>
              </div>
            </div>
            <button 
              onClick={onNavigateToDiary}
              className="mt-4 w-full py-2 text-xs font-bold text-secondary uppercase tracking-widest hover:underline underline-offset-4"
            >
              Vedi nel diario →
            </button>
          </div>
        </section>
      )}

      {/* Daily Quote Card */}
      <section 
        onClick={onMotivationsClick}
        className="bg-surface-container-low rounded-lg p-8 relative overflow-hidden cursor-pointer active:scale-[0.98] transition-all hover:bg-surface-container-high group"
      >
        <div className="absolute -top-4 -left-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Quote size={80} className="text-on-surface-variant fill-current" />
        </div>
        <div className="relative z-10">
          <p className="text-on-surface-variant font-body text-xl leading-relaxed italic text-center">
            "{dailyQuote}"
          </p>
          <div className="w-12 h-1 bg-primary-container/40 mx-auto mt-6 rounded-full group-hover:w-20 transition-all"></div>
        </div>
      </section>

      {/* Mood Summary & Status Grid */}
      <section className="grid grid-cols-2 gap-4">
        <div className="col-span-2 bg-surface-container rounded-lg p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-surface-container-lowest flex items-center justify-center">
              <Activity className="text-secondary" size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Ultimo umore</p>
              <p className="text-on-surface font-semibold">{lastMood || 'Nessuno'}</p>
            </div>
          </div>
          <div className={`w-3 h-3 rounded-full ${lastMood ? 'bg-secondary shadow-[0_0_12px_rgba(86,99,66,0.4)]' : 'bg-surface-container-highest'}`}></div>
        </div>

        {/* Secondary Info Cards */}
        <div className="bg-surface-container-low rounded-lg p-4 space-y-2">
          <BookHeart className="text-primary-container" size={24} />
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Pensieri</p>
          <p className="text-lg font-bold text-on-surface">{totalEntries}</p>
        </div>
        
        <div className="bg-surface-container-low rounded-lg p-4 space-y-2">
          <Clock className="text-tertiary-container" size={24} />
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Ultimo</p>
          <p className="text-lg font-bold text-on-surface">{lastEntryTime}</p>
        </div>
      </section>
    </div>
  );
}
