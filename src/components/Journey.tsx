import { PenSquare, Heart, Flame, Leaf, Moon, User, Award, Star, Lock } from 'lucide-react';
import { DiaryEntry, Mood } from '../types';

interface JourneyProps {
  entries: DiaryEntry[];
}

export function Journey({ entries }: JourneyProps) {
  // Calculate total days since first entry
  const calculateTotalDays = () => {
    if (!entries || entries.length === 0) return 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // entries are sorted newest first, so the last element is the oldest
    const firstDate = new Date(entries[entries.length - 1].timestamp);
    firstDate.setHours(0, 0, 0, 0);
    
    const diffTime = today.getTime() - firstDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays + 1; // Day 1 is the first day
  };

  const totalDays = calculateTotalDays();

  const totalEntries = entries.length;

  // Calculate streak
  const calculateStreak = () => {
    if (!entries || entries.length === 0) return 0;
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let currentDate = new Date(today);
    let hasCheckedInToday = false;

    const todayStr = today.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
    if (entries.some(e => e.date === todayStr)) {
      hasCheckedInToday = true;
      streak = 1;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
      if (entries.some(e => e.date === yesterdayStr)) {
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        return 0;
      }
    }

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

  // Calculate "Sentita meglio" percentage
  const positiveMoods = entries.filter(e => e.mood === 'Meglio' || e.mood === 'Forte').length;
  const betterPercentage = totalEntries > 0 ? Math.round((positiveMoods / totalEntries) * 100) : 0;

  // Calculate trend data for the last 14 days
  const getTrendData = () => {
    const data = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const moodScores: Record<Mood, number> = {
      'Difficile': 20,
      'Arrabbiato': 40,
      'Neutro': 60,
      'Meglio': 80,
      'Forte': 100
    };

    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
      
      const dayEntries = entries.filter(e => e.date === dateStr);
      if (dayEntries.length > 0) {
        // Average score for the day
        const avgScore = dayEntries.reduce((acc, curr) => acc + moodScores[curr.mood], 0) / dayEntries.length;
        data.push({ score: avgScore, date: dateStr, isToday: i === 0 });
      } else {
        data.push({ score: 0, date: dateStr, isToday: i === 0 }); // No entry
      }
    }
    return data;
  };

  const trendData = getTrendData();

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
      <header className="space-y-1">
        <h2 className="text-3xl font-extrabold tracking-tight text-primary">Il Tuo Percorso</h2>
        <p className="text-on-surface-variant/70 font-medium">Ogni piccolo passo è una vittoria.</p>
      </header>

      {/* Hero Section: Days Counter */}
      <section className="relative overflow-hidden bg-surface-container-low p-8 rounded-lg flex flex-col items-center justify-center text-center">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-secondary/5 rounded-full blur-2xl"></div>
        
        <span className="text-8xl font-extrabold text-primary tracking-tighter leading-none mb-2">{totalDays}</span>
        <span className="text-sm font-bold text-on-surface-variant uppercase tracking-[0.2em]">Giorni di Rinascita</span>
        
        <div className="mt-6 flex items-center gap-2 px-4 py-2 bg-secondary-container text-on-secondary-container rounded-full text-xs font-bold uppercase tracking-wider">
          <Leaf size={14} className="fill-current" />
          {streak > 0 ? "Sei in un momento di crescita" : "Inizia il tuo percorso oggi"}
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 gap-4">
        <div className="bg-surface-container-highest/40 p-5 rounded-lg flex flex-col justify-between aspect-square">
          <PenSquare className="text-primary" size={28} />
          <div>
            <div className="text-2xl font-bold text-on-surface">{totalEntries}</div>
            <div className="text-xs text-on-surface-variant font-medium uppercase tracking-wider">Pensieri scritti</div>
          </div>
        </div>
        
        <div className="bg-secondary-container/30 p-5 rounded-lg flex flex-col justify-between aspect-square border border-secondary/10">
          <Flame className="text-secondary fill-current" size={28} />
          <div>
            <div className="text-2xl font-bold text-on-surface">{streak}</div>
            <div className="text-xs text-on-surface-variant font-medium uppercase tracking-wider">Giorni di fila</div>
          </div>
        </div>

        <div className="col-span-2 bg-surface-container p-6 rounded-lg flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-3xl font-bold text-secondary">{betterPercentage}%</div>
            <div className="text-xs text-on-surface-variant font-medium uppercase tracking-wider">Sentita meglio</div>
          </div>
          <div className="w-16 h-16 relative">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path className="text-secondary/10" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
              <path className="text-secondary transition-all duration-1000 ease-out" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${betterPercentage}, 100`} strokeWidth="3" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center">
              <Leaf className="text-secondary" size={18} />
            </span>
          </div>
        </div>
      </section>

      {/* Mood Trend Section */}
      <section className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-on-surface-variant px-1">Tendenza Umore (Ultimi 14 gg)</h3>
        <div className="bg-surface-container-low p-6 rounded-lg h-48 flex items-end justify-between gap-2">
          {trendData.map((item, i) => (
            <div 
              key={i} 
              title={item.date}
              className={`flex-1 rounded-t-full transition-all duration-1000 ${
                item.isToday ? 'bg-secondary border-t-4 border-secondary-container' : 
                item.score > 0 ? (item.score >= 80 ? 'bg-primary/40' : 'bg-secondary/40') : 'bg-surface-container-highest/20'
              }`}
              style={{ height: `${Math.max(item.score, 5)}%`, opacity: item.isToday ? 1 : (item.score > 0 ? (item.score / 100) * 0.8 + 0.2 : 0.3) }}
            ></div>
          ))}
        </div>
      </section>

      {/* Milestones Section */}
      <section className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-on-surface-variant px-1">Traguardi Raggiunti</h3>
        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2 -mx-6 px-6">
          
          <div className={`flex-shrink-0 w-32 ${streak >= 7 ? 'bg-surface-container-lowest border-secondary-container' : 'bg-surface-container-highest opacity-60 grayscale'} p-6 rounded-lg text-center flex flex-col items-center gap-3 shadow-sm border`}>
            <div className={`w-12 h-12 ${streak >= 7 ? 'bg-gradient-to-br from-secondary to-tertiary text-white' : 'bg-on-surface-variant/10 text-on-surface-variant'} rounded-full flex items-center justify-center`}>
              <Award className={streak >= 7 ? "fill-current" : ""} size={24} />
            </div>
            <span className="text-sm font-bold text-on-surface">7 Giorni</span>
          </div>

          <div className={`flex-shrink-0 w-32 ${streak >= 30 ? 'bg-gradient-to-br from-primary to-primary-container shadow-md scale-105 mx-1' : 'bg-surface-container-highest opacity-60 grayscale'} p-6 rounded-lg text-center flex flex-col items-center gap-3`}>
            <div className={`w-12 h-12 ${streak >= 30 ? 'bg-white/20 text-white backdrop-blur-md' : 'bg-on-surface-variant/10 text-on-surface-variant'} rounded-full flex items-center justify-center`}>
              <Star className={streak >= 30 ? "fill-current" : ""} size={24} />
            </div>
            <span className={`text-sm font-bold ${streak >= 30 ? 'text-white' : 'text-on-surface'} leading-tight`}>
              30 Giorni
              {streak < 30 && streak >= 7 && <><br/><span className="text-[10px] font-medium opacity-80">PROSSIMO</span></>}
            </span>
          </div>

          <div className={`flex-shrink-0 w-32 ${streak >= 90 ? 'bg-gradient-to-br from-secondary to-primary-container shadow-md scale-105 mx-1' : 'bg-surface-container-highest opacity-60 grayscale'} p-6 rounded-lg text-center flex flex-col items-center gap-3`}>
            <div className={`w-12 h-12 ${streak >= 90 ? 'bg-white/20 text-white backdrop-blur-md' : 'bg-on-surface-variant/10 text-on-surface-variant'} rounded-full flex items-center justify-center`}>
              <Lock size={24} />
            </div>
            <span className={`text-sm font-bold ${streak >= 90 ? 'text-white' : 'text-on-surface'} leading-tight`}>
              90 Giorni
              {streak < 90 && streak >= 30 && <><br/><span className="text-[10px] font-medium opacity-80">PROSSIMO</span></>}
            </span>
          </div>

        </div>
      </section>
    </div>
  );
}
