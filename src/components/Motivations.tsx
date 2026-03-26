import { Heart, Zap, Sparkles, Leaf, Sun, Pin, Quote } from 'lucide-react';
import { useMemo } from 'react';

const ALL_QUOTES = [
  { id: 1, text: "Scegli te stessa oggi.", category: "Pace interiore", icon: "heart", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800" },
  { id: 2, text: "Il silenzio è la tua forza.", category: "Forza", icon: "zap" },
  { id: 3, text: "Un passo alla volta.", category: "Pazienza", icon: "sparkles" },
  { id: 4, text: "La tua rinascita è un atto di coraggio quotidiano.", category: "Coraggio", icon: "leaf" },
  { id: 5, text: "Domani è una tela bianca.", category: "Futuro", icon: "sun" },
  { id: 6, text: "Coltiva la pazienza.", category: "Pazienza", icon: "leaf" },
  { id: 7, text: "Non sei in ritardo, sei esattamente dove devi essere.", category: "Consapevolezza", icon: "pin", image: "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&q=80&w=800" },
  { id: 8, text: "Ogni tempesta ha una fine.", category: "Speranza", icon: "sun" },
  { id: 9, text: "La vulnerabilità è la tua più grande forza.", category: "Coraggio", icon: "zap" },
  { id: 10, text: "Respira. Sei viva.", category: "Presenza", icon: "leaf" },
  { id: 11, text: "Lascia andare ciò che non puoi controllare.", category: "Pace interiore", icon: "sparkles" },
  { id: 12, text: "Il tuo valore non dipende dalla tua produttività.", category: "Accettazione", icon: "heart" },
  { id: 13, text: "Fai spazio per le cose belle.", category: "Positività", icon: "sun", image: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&q=80&w=800" },
  { id: 14, text: "Sei abbastanza, così come sei.", category: "Amore proprio", icon: "heart" },
  { id: 15, text: "Le piccole vittorie contano.", category: "Progresso", icon: "pin" },
  { id: 16, text: "Abbraccia l'incertezza.", category: "Crescita", icon: "zap" },
  { id: 17, text: "Il sole sorgerà ancora.", category: "Speranza", icon: "sun" },
  { id: 18, text: "Ascolta il tuo corpo.", category: "Cura di sé", icon: "leaf" },
  { id: 19, text: "Oggi è un buon giorno per ricominciare.", category: "Nuovo inizio", icon: "sparkles", image: "https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&q=80&w=800" },
  { id: 20, text: "Non devi avere tutto sotto controllo.", category: "Pace interiore", icon: "pin" }
];

export function Motivations() {
  // Select 6 quotes based on the current date so they change daily
  const dailyQuotes = useMemo(() => {
    const today = new Date();
    // Create a seed based on the current day (YYYYMMDD)
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    
    // Simple seeded random function
    const random = (s: number) => {
      const x = Math.sin(s) * 10000;
      return x - Math.floor(x);
    };

    // Shuffle the quotes using the seed
    const shuffled = [...ALL_QUOTES].sort((a, b) => random(seed + a.id) - random(seed + b.id));
    
    // Ensure the first quote has an image for the hero section
    const heroIndex = shuffled.findIndex(q => q.image);
    if (heroIndex > 0) {
      const heroQuote = shuffled.splice(heroIndex, 1)[0];
      shuffled.unshift(heroQuote);
    }

    return shuffled.slice(0, 6);
  }, []);

  const [heroQuote, bento1, bento2, wideQuote, bottom1, bottom2] = dailyQuotes;

  const renderIcon = (iconName: string, className: string, size: number = 24) => {
    switch (iconName) {
      case 'heart': return <Heart size={size} className={className} />;
      case 'zap': return <Zap size={size} className={className} />;
      case 'sparkles': return <Sparkles size={size} className={className} />;
      case 'leaf': return <Leaf size={size} className={className} />;
      case 'sun': return <Sun size={size} className={className} />;
      case 'pin': return <Pin size={size} className={className} />;
      default: return <Quote size={size} className={className} />;
    }
  };

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
              src={heroQuote.image || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800"} 
              alt="Background" 
              className="w-full h-full object-cover mix-blend-overlay"
            />
          </div>
          <h3 className="text-white text-3xl font-bold leading-tight relative z-10">{heroQuote.text}</h3>
          <p className="text-white/80 text-sm mt-3 font-medium uppercase tracking-widest relative z-10">{heroQuote.category}</p>
        </div>

        {/* Bento Mini Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface-container-low p-6 rounded-lg aspect-square flex flex-col justify-between transition-all hover:bg-surface-container-high">
            <div className="flex justify-between items-start">
              {renderIcon(bento1.icon, "text-secondary")}
              <button className="text-outline hover:text-primary transition-colors">
                <Heart size={20} />
              </button>
            </div>
            <p className="text-primary font-bold text-lg leading-snug">{bento1.text}</p>
          </div>

          <div className="bg-secondary-container/30 p-6 rounded-lg aspect-square flex flex-col justify-between transition-all hover:bg-secondary-container/50">
            <div className="flex justify-between items-start">
              {renderIcon(bento2.icon, "text-primary")}
              <button className="text-outline hover:text-primary transition-colors">
                <Heart size={20} />
              </button>
            </div>
            <p className="text-on-secondary-container font-bold text-lg leading-snug">{bento2.text}</p>
          </div>
        </div>

        {/* Wide Card */}
        <div className="bg-surface-container p-8 rounded-lg flex items-center gap-6 relative overflow-hidden transition-all hover:bg-surface-container-high">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            {renderIcon(wideQuote.icon, "text-primary", 28)}
          </div>
          <div className="flex-1">
            <p className="text-primary font-bold text-xl leading-tight italic">"{wideQuote.text}"</p>
          </div>
          <button className="absolute top-4 right-4 text-outline-variant hover:text-primary">
            <Heart size={20} className="fill-current text-outline-variant" />
          </button>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface-container-highest/40 p-6 rounded-lg flex flex-col justify-between aspect-[3/4] relative group">
            {renderIcon(bottom1.icon, "text-on-surface-variant")}
            <p className="text-on-surface font-bold text-lg leading-snug">{bottom1.text}</p>
            <button className="absolute bottom-6 right-6 text-outline transition-colors group-hover:text-primary">
              <Pin size={20} />
            </button>
          </div>
          
          <div className="bg-primary-container/20 p-6 rounded-lg flex flex-col justify-between aspect-[3/4] relative group">
            {renderIcon(bottom2.icon, "text-primary")}
            <p className="text-primary font-bold text-lg leading-snug">{bottom2.text}</p>
            <button className="absolute bottom-6 right-6 text-outline transition-colors group-hover:text-primary">
              <Heart size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
