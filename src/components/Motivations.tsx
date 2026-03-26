import { Heart, Zap, Sparkles, Leaf, Sun, Pin } from 'lucide-react';

export function Motivations() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="mb-8">
        <h2 className="text-4xl font-extrabold tracking-tight text-primary mb-2">Motivazioni</h2>
        <p className="text-on-surface-variant font-medium leading-relaxed">
          Trova la tua forza interiore attraverso parole di saggezza e pace.
        </p>
      </section>

      <div className="flex gap-3 overflow-x-auto hide-scrollbar mb-8 -mx-6 px-6">
        <button className="bg-secondary-container text-on-secondary-container px-6 py-2.5 rounded-full font-semibold text-sm transition-colors duration-200 shrink-0">Tutte</button>
        <button className="bg-surface-container-high text-on-surface-variant px-6 py-2.5 rounded-full font-semibold text-sm hover:bg-surface-container-highest transition-colors duration-200 shrink-0">Forza</button>
        <button className="bg-surface-container-high text-on-surface-variant px-6 py-2.5 rounded-full font-semibold text-sm hover:bg-surface-container-highest transition-colors duration-200 shrink-0">Chiarezza</button>
        <button className="bg-surface-container-high text-on-surface-variant px-6 py-2.5 rounded-full font-semibold text-sm hover:bg-surface-container-highest transition-colors duration-200 shrink-0">Futuro</button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Large Card Feature */}
        <div className="relative group rounded-lg overflow-hidden h-[320px] bg-gradient-to-br from-primary to-primary-container p-8 flex flex-col justify-end shadow-[0_12px_32px_rgba(140,78,55,0.15)]">
          <div className="absolute top-6 right-6 z-20">
            <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-transform">
              <Heart size={20} className="fill-current" />
            </button>
          </div>
          <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
            <img 
              src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800" 
              alt="Background" 
              className="w-full h-full object-cover mix-blend-overlay"
            />
          </div>
          <h3 className="text-white text-3xl font-bold leading-tight relative z-10">Scegli te stessa oggi.</h3>
          <p className="text-white/80 text-sm mt-3 font-medium uppercase tracking-widest relative z-10">Pace interiore</p>
        </div>

        {/* Bento Mini Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface-container-low p-6 rounded-lg aspect-square flex flex-col justify-between transition-all hover:bg-surface-container-high">
            <div className="flex justify-between items-start">
              <Zap className="text-secondary" size={24} />
              <button className="text-outline hover:text-primary transition-colors">
                <Heart size={20} />
              </button>
            </div>
            <p className="text-primary font-bold text-lg leading-snug">Il silenzio è la tua forza.</p>
          </div>

          <div className="bg-secondary-container/30 p-6 rounded-lg aspect-square flex flex-col justify-between transition-all hover:bg-secondary-container/50">
            <div className="flex justify-between items-start">
              <Sparkles className="text-primary" size={24} />
              <button className="text-outline hover:text-primary transition-colors">
                <Heart size={20} />
              </button>
            </div>
            <p className="text-on-secondary-container font-bold text-lg leading-snug">Un passo alla volta.</p>
          </div>
        </div>

        {/* Wide Card */}
        <div className="bg-surface-container p-8 rounded-lg flex items-center gap-6 relative overflow-hidden transition-all hover:bg-surface-container-high">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Leaf className="text-primary" size={28} />
          </div>
          <div className="flex-1">
            <p className="text-primary font-bold text-xl leading-tight italic">"La tua rinascita è un atto di coraggio quotidiano."</p>
          </div>
          <button className="absolute top-4 right-4 text-outline-variant hover:text-primary">
            <Heart size={20} className="fill-current text-outline-variant" />
          </button>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface-container-highest/40 p-6 rounded-lg flex flex-col justify-between aspect-[3/4] relative group">
            <Sun className="text-on-surface-variant" size={24} />
            <p className="text-on-surface font-bold text-lg leading-snug">Domani è una tela bianca.</p>
            <button className="absolute bottom-6 right-6 text-outline transition-colors group-hover:text-primary">
              <Pin size={20} />
            </button>
          </div>
          
          <div className="bg-primary-container/20 p-6 rounded-lg flex flex-col justify-between aspect-[3/4] relative group">
            <Leaf className="text-primary" size={24} />
            <p className="text-primary font-bold text-lg leading-snug">Coltiva la pazienza.</p>
            <button className="absolute bottom-6 right-6 text-outline transition-colors group-hover:text-primary">
              <Heart size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
