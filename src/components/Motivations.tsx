import { Heart, Zap, Sparkles, Leaf, Sun, Pin, Quote, RefreshCw, Loader2, Star } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';

interface QuoteData {
  id: string | number;
  text: string;
  author: string;
  category: string;
  icon: string;
  image?: string;
}

const CATEGORIES = [
  'Tutte',
  'Preferiti',
  'Pace interiore',
  'Forza',
  'Pazienza',
  'Coraggio',
  'Consapevolezza',
  'Speranza',
  'Amore proprio',
  'Crescita'
];

const CATEGORY_MAP: Record<string, string> = {
  'peace': 'Pace interiore',
  'strength': 'Forza',
  'patience': 'Pazienza',
  'courage': 'Coraggio',
  'mindfulness': 'Consapevolezza',
  'hope': 'Speranza',
  'love': 'Amore proprio',
  'growth': 'Crescita'
};

const ICONS = ['heart', 'zap', 'sparkles', 'leaf', 'sun', 'pin'];

const FALLBACK_QUOTES: QuoteData[] = [
  {
    id: 'fb-1',
    text: "La pace viene da dentro. Non cercarla fuori.",
    author: "Buddha",
    category: "Pace interiore",
    icon: "leaf"
  },
  {
    id: 'fb-2',
    text: "Il successo non è definitivo, il fallimento non è fatale: è il coraggio di continuare che conta.",
    author: "Winston Churchill",
    category: "Coraggio",
    icon: "zap"
  },
  {
    id: 'fb-3',
    text: "La felicità non è qualcosa di pronto. Viene dalle tue azioni.",
    author: "Dalai Lama",
    category: "Amore proprio",
    icon: "heart"
  },
  {
    id: 'fb-4',
    text: "Sii il cambiamento che vuoi vedere nel mondo.",
    author: "Mahatma Gandhi",
    category: "Crescita",
    icon: "sparkles"
  },
  {
    id: 'fb-5',
    text: "Tutto ciò che abbiamo è il presente.",
    author: "Marco Aurelio",
    category: "Consapevolezza",
    icon: "sun"
  },
  {
    id: 'fb-6',
    text: "La pazienza è amara, ma il suo frutto è dolce.",
    author: "Jean-Jacques Rousseau",
    category: "Pazienza",
    icon: "pin"
  },
  {
    id: 'fb-7',
    text: "Non è mai troppo tardi per essere ciò che avresti potuto essere.",
    author: "George Eliot",
    category: "Speranza",
    icon: "sparkles"
  },
  {
    id: 'fb-8',
    text: "La forza non deriva dalla capacità fisica. Deriva da una volontà indomita.",
    author: "Mahatma Gandhi",
    category: "Forza",
    icon: "zap"
  }
];

export function Motivations() {
  const [activeCategory, setActiveCategory] = useState<string>('Tutte');
  const [quotes, setQuotes] = useState<QuoteData[]>(FALLBACK_QUOTES);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('favorite_quotes');
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (e) {
        console.error("Failed to parse favorites", e);
      }
    }
  }, []);

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem('favorite_quotes', JSON.stringify(favorites));
  }, [favorites]);

  const fetchQuotes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('https://type.fit/api/quotes').catch(() => null);
      
      if (response && response.ok) {
        const data = await response.json();
        
        const transformed: QuoteData[] = data.slice(0, 100).map((q: any, index: number) => {
          const text = q.text;
          const author = q.author?.replace(', type.fit', '') || 'Anonimo';
          
          let category = 'Crescita';
          if (text.toLowerCase().includes('peace') || text.toLowerCase().includes('calm')) category = 'Pace interiore';
          else if (text.toLowerCase().includes('strength') || text.toLowerCase().includes('power')) category = 'Forza';
          else if (text.toLowerCase().includes('wait') || text.toLowerCase().includes('patience')) category = 'Pazienza';
          else if (text.toLowerCase().includes('fear') || text.toLowerCase().includes('courage')) category = 'Coraggio';
          else if (text.toLowerCase().includes('mind') || text.toLowerCase().includes('present')) category = 'Consapevolezza';
          else if (text.toLowerCase().includes('hope') || text.toLowerCase().includes('light')) category = 'Speranza';
          else if (text.toLowerCase().includes('love') || text.toLowerCase().includes('self')) category = 'Amore proprio';
          else {
            const randomCats = CATEGORIES.slice(2);
            category = randomCats[index % randomCats.length];
          }

          return {
            id: `api-${index}`,
            text,
            author,
            category,
            icon: ICONS[index % ICONS.length],
            image: index % 10 === 0 ? `https://picsum.photos/seed/quote-${index}/800/600` : undefined
          };
        });

        setQuotes(transformed);
      }
    } catch (err) {
      console.error("Failed to fetch quotes, using fallbacks", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, []);

  const toggleFavorite = (id: string | number) => {
    setFavorites(prev => 
      prev.includes(id.toString()) 
        ? prev.filter(fid => fid !== id.toString()) 
        : [...prev, id.toString()]
    );
  };

  const dailyQuotes = useMemo(() => {
    if (quotes.length === 0) return [];
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    
    const random = (s: number) => {
      const x = Math.sin(s) * 10000;
      return x - Math.floor(x);
    };

    const shuffled = [...quotes].sort((a, b) => random(seed + Number(a.id.toString().split('-')[1])) - random(seed + Number(b.id.toString().split('-')[1])));
    
    // Ensure hero has a nice image
    const heroQuote = { ...shuffled[0] };
    heroQuote.image = `https://images.unsplash.com/photo-1499209974431-9dac3adaf471?auto=format&fit=crop&q=80&w=800&seed=${seed}`;
    
    return [heroQuote, ...shuffled.slice(1, 6)];
  }, [quotes]);

  const filteredQuotes = useMemo(() => {
    if (activeCategory === 'Tutte') return null;
    if (activeCategory === 'Preferiti') {
      return quotes.filter(q => favorites.includes(q.id.toString()));
    }
    return quotes.filter(q => q.category === activeCategory);
  }, [activeCategory, quotes, favorites]);

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

  if (isLoading && quotes.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="text-primary animate-spin" size={40} />
        <p className="text-on-surface-variant font-medium">Caricamento saggezza...</p>
      </div>
    );
  }

  const [heroQuote, bento1, bento2, wideQuote, bottom1, bottom2] = dailyQuotes;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <section className="mb-8">
        <h2 className="text-4xl font-extrabold tracking-tight text-primary mb-2">Motivazioni</h2>
        <p className="text-on-surface-variant font-medium leading-relaxed">
          Trova la tua forza interiore attraverso parole di saggezza e pace.
        </p>
      </section>

      <div className="flex gap-3 overflow-x-auto hide-scrollbar mb-8 -mx-6 px-6">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-colors duration-200 shrink-0 flex items-center gap-2 ${
              activeCategory === cat
                ? 'bg-secondary-container text-on-secondary-container'
                : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
            }`}
          >
            {cat === 'Preferiti' && <Star size={14} fill={activeCategory === 'Preferiti' ? 'currentColor' : 'none'} />}
            {cat}
          </button>
        ))}
      </div>

      {activeCategory === 'Tutte' ? (
        <div className="grid grid-cols-1 gap-6">
          {/* Large Card Feature */}
          <div className="relative group rounded-lg overflow-hidden h-[360px] bg-gradient-to-br from-primary to-primary-container p-8 flex flex-col justify-end shadow-[0_12px_32px_rgba(140,78,55,0.15)]">
            <div className="absolute top-6 right-6 z-20">
              <button 
                onClick={() => toggleFavorite(heroQuote.id)}
                className={`w-12 h-12 rounded-full backdrop-blur-md flex items-center justify-center active:scale-90 transition-all ${
                  favorites.includes(heroQuote.id.toString()) 
                    ? 'bg-primary text-white' 
                    : 'bg-white/20 text-white'
                }`}
              >
                <Heart size={24} fill={favorites.includes(heroQuote.id.toString()) ? 'currentColor' : 'none'} />
              </button>
            </div>
            <div className="absolute top-0 left-0 w-full h-full opacity-40 pointer-events-none">
              <img 
                src={heroQuote.image} 
                alt="Background" 
                className="w-full h-full object-cover mix-blend-overlay"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="relative z-10 space-y-4">
              <Quote size={40} className="text-white/40" />
              <h3 className="text-white text-3xl font-bold leading-tight">{heroQuote.text}</h3>
              <div className="flex items-center justify-between pt-2">
                <p className="text-white/80 text-sm font-medium uppercase tracking-widest">{heroQuote.category}</p>
                <p className="text-white/60 text-xs italic">— {heroQuote.author}</p>
              </div>
            </div>
          </div>

          {/* Bento Mini Grid */}
          <div className="grid grid-cols-2 gap-4">
            {[bento1, bento2].map((q, i) => (
              <div key={q.id} className={`${i === 0 ? 'bg-surface-container-low' : 'bg-secondary-container/30'} p-6 rounded-lg aspect-square flex flex-col justify-between transition-all hover:bg-opacity-80 group`}>
                <div className="flex justify-between items-start">
                  {renderIcon(q.icon, i === 0 ? "text-secondary" : "text-primary")}
                  <button 
                    onClick={() => toggleFavorite(q.id)}
                    className={`transition-colors ${favorites.includes(q.id.toString()) ? 'text-primary' : 'text-outline group-hover:text-primary'}`}
                  >
                    <Heart size={20} fill={favorites.includes(q.id.toString()) ? 'currentColor' : 'none'} />
                  </button>
                </div>
                <div className="space-y-2">
                  <p className={`${i === 0 ? 'text-primary' : 'text-on-secondary-container'} font-bold text-lg leading-snug line-clamp-4`}>{q.text}</p>
                  <p className="text-[10px] text-on-surface-variant/60 italic">— {q.author}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Wide Card */}
          <div className="bg-surface-container p-8 rounded-lg flex items-center gap-6 relative overflow-hidden transition-all hover:bg-surface-container-high group">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              {renderIcon(wideQuote.icon, "text-primary", 28)}
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-primary font-bold text-xl leading-tight italic">"{wideQuote.text}"</p>
              <p className="text-xs text-on-surface-variant/60">— {wideQuote.author}</p>
            </div>
            <button 
              onClick={() => toggleFavorite(wideQuote.id)}
              className={`absolute top-4 right-4 transition-colors ${favorites.includes(wideQuote.id.toString()) ? 'text-primary' : 'text-outline-variant group-hover:text-primary'}`}
            >
              <Heart size={20} fill={favorites.includes(wideQuote.id.toString()) ? 'currentColor' : 'none'} />
            </button>
          </div>

          {/* Bottom Grid */}
          <div className="grid grid-cols-2 gap-4">
            {[bottom1, bottom2].map((q, i) => (
              <div key={q.id} className={`${i === 0 ? 'bg-surface-container-highest/40' : 'bg-primary-container/20'} p-6 rounded-lg flex flex-col justify-between aspect-[3/4] relative group`}>
                {renderIcon(q.icon, i === 0 ? "text-on-surface-variant" : "text-primary")}
                <div className="space-y-2">
                  <p className={`${i === 0 ? 'text-on-surface' : 'text-primary'} font-bold text-lg leading-snug line-clamp-5`}>{q.text}</p>
                  <p className="text-[10px] text-on-surface-variant/60 italic">— {q.author}</p>
                </div>
                <button 
                  onClick={() => toggleFavorite(q.id)}
                  className={`absolute bottom-6 right-6 transition-colors ${favorites.includes(q.id.toString()) ? 'text-primary' : 'text-outline group-hover:text-primary'}`}
                >
                  <Heart size={20} fill={favorites.includes(q.id.toString()) ? 'currentColor' : 'none'} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 animate-in fade-in duration-300">
          {filteredQuotes?.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mx-auto text-outline-variant">
                <Star size={32} />
              </div>
              <p className="text-on-surface-variant font-medium">Nessuna citazione trovata in questa categoria.</p>
            </div>
          ) : (
            filteredQuotes?.map(quote => (
              <div key={quote.id} className="bg-surface-container-low p-6 rounded-lg flex flex-col justify-between transition-all hover:bg-surface-container-high group relative">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    {renderIcon(quote.icon, "text-primary")}
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60">{quote.category}</span>
                  </div>
                  <button 
                    onClick={() => toggleFavorite(quote.id)}
                    className={`transition-colors ${favorites.includes(quote.id.toString()) ? 'text-primary' : 'text-outline group-hover:text-primary'}`}
                  >
                    <Heart size={20} fill={favorites.includes(quote.id.toString()) ? 'currentColor' : 'none'} />
                  </button>
                </div>
                <div className="space-y-3">
                  <p className="text-on-surface font-bold text-xl leading-snug">"{quote.text}"</p>
                  <p className="text-sm text-on-surface-variant italic">— {quote.author}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

