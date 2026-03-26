import { PenSquare, Heart, Flame, Leaf, Moon, User, Award, Star, Lock } from 'lucide-react';

export function Journey() {
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
        
        <span className="text-8xl font-extrabold text-primary tracking-tighter leading-none mb-2">14</span>
        <span className="text-sm font-bold text-on-surface-variant uppercase tracking-[0.2em]">Giorni di Rinascita</span>
        
        <div className="mt-6 flex items-center gap-2 px-4 py-2 bg-secondary-container text-on-secondary-container rounded-full text-xs font-bold uppercase tracking-wider">
          <Leaf size={14} className="fill-current" />
          Sei in un momento di crescita
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 gap-4">
        <div className="bg-surface-container-highest/40 p-5 rounded-lg flex flex-col justify-between aspect-square">
          <PenSquare className="text-primary" size={28} />
          <div>
            <div className="text-2xl font-bold text-on-surface">12</div>
            <div className="text-xs text-on-surface-variant font-medium uppercase tracking-wider">Pensieri scritti</div>
          </div>
        </div>
        
        <div className="bg-secondary-container/30 p-5 rounded-lg flex flex-col justify-between aspect-square border border-secondary/10">
          <Flame className="text-secondary fill-current" size={28} />
          <div>
            <div className="text-2xl font-bold text-on-surface">14</div>
            <div className="text-xs text-on-surface-variant font-medium uppercase tracking-wider">Giorni di fila</div>
          </div>
        </div>

        <div className="col-span-2 bg-surface-container p-6 rounded-lg flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-3xl font-bold text-secondary">92%</div>
            <div className="text-xs text-on-surface-variant font-medium uppercase tracking-wider">Sentita meglio</div>
          </div>
          <div className="w-16 h-16 relative">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path className="text-secondary/10" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
              <path className="text-secondary" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="92, 100" strokeWidth="3" />
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
          {/* Mock Chart Bars */}
          {[40, 55, 45, 60, 30, 50, 75, 85, 65, 90, 80, 95, 85, 100].map((height, i) => (
            <div 
              key={i} 
              className={`flex-1 rounded-t-full transition-all duration-1000 ${
                i === 13 ? 'bg-secondary border-t-4 border-secondary-container' : 
                i === 4 ? 'bg-primary/20' : 'bg-secondary/40'
              }`}
              style={{ height: `${height}%`, opacity: i === 13 ? 1 : (height / 100) * 0.8 + 0.2 }}
            ></div>
          ))}
        </div>
      </section>

      {/* Milestones Section */}
      <section className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-on-surface-variant px-1">Traguardi Raggiunti</h3>
        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2 -mx-6 px-6">
          
          <div className="flex-shrink-0 w-32 bg-surface-container-lowest p-6 rounded-lg text-center flex flex-col items-center gap-3 shadow-sm border border-secondary-container">
            <div className="w-12 h-12 bg-gradient-to-br from-secondary to-tertiary text-white rounded-full flex items-center justify-center">
              <Award className="fill-current" size={24} />
            </div>
            <span className="text-sm font-bold text-on-surface">7 Giorni</span>
          </div>

          <div className="flex-shrink-0 w-32 bg-gradient-to-br from-primary to-primary-container p-6 rounded-lg text-center flex flex-col items-center gap-3 shadow-md scale-105 mx-1">
            <div className="w-12 h-12 bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-md">
              <Star className="fill-current" size={24} />
            </div>
            <span className="text-sm font-bold text-white leading-tight">30 Giorni<br/><span className="text-[10px] font-medium opacity-80">PROSSIMO</span></span>
          </div>

          <div className="flex-shrink-0 w-32 bg-surface-container-highest p-6 rounded-lg text-center flex flex-col items-center gap-3 grayscale opacity-60">
            <div className="w-12 h-12 bg-on-surface-variant/10 text-on-surface-variant rounded-full flex items-center justify-center">
              <Lock size={24} />
            </div>
            <span className="text-sm font-bold text-on-surface">90 Giorni</span>
          </div>

        </div>
      </section>
    </div>
  );
}
