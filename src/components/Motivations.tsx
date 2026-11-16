import { Heart, Zap, Sparkles, Leaf, Sun, Pin, Quote, Star, X } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';

interface QuoteData {
  id: string;
  text: string;
  category: string;
  icon: string;
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

const CATEGORY_ICONS: Record<string, string> = {
  'Pace interiore': 'leaf',
  'Forza': 'zap',
  'Pazienza': 'pin',
  'Coraggio': 'sparkles',
  'Consapevolezza': 'sun',
  'Speranza': 'sparkles',
  'Amore proprio': 'heart',
  'Crescita': 'leaf',
};

// Frasi scritte per l'app, senza dipendere dalla rete: funzionano anche offline.
// Il linguaggio è volutamente neutro, così vale per chiunque le legga.
const QUOTES_BY_CATEGORY: Record<string, string[]> = {
  'Pace interiore': [
    "Non devi risolvere tutto stasera. Respira e lascia che il resto aspetti domani.",
    "Il silenzio dopo una giornata piena fa bene, anche quando sembra di non fare niente.",
    "Quando la testa corre, rallenta il respiro. Il resto di solito lo segue.",
    "Un posto tranquillo dentro di te esiste già. Spesso bastano cinque minuti fermi per ritrovarlo.",
    "Spegni lo schermo, apri una finestra e resta un momento con quello che senti.",
  ],
  'Forza': [
    "Hai già superato giorni che sembravano troppo lunghi. Anche questo passerà.",
    "A volte la forza di oggi è alzarsi, lavarsi la faccia e provarci. Può bastare.",
    "Chiedere aiuto richiede più forza che stringere i denti da soli.",
    "Ogni volta che hai ricominciato, hai trovato più risorse di quante ne credevi.",
    "Fermarsi a riposare fa parte del cammino quanto camminare.",
  ],
  'Pazienza': [
    "Le cose che contano crescono piano. Una radice non si vede finché non regge un albero.",
    "Oggi basta un passo piccolo. Quelli grandi arrivano dopo, quando hai ripreso fiato.",
    "Una ferita ha bisogno dei suoi tempi, e i tuoi sono quelli giusti per te.",
    "Se oggi non è successo niente di visibile, qualcosa dentro è cambiato lo stesso.",
    "Aspettare con calma è una scelta, e spesso la più saggia.",
  ],
  'Coraggio': [
    "Il coraggio si presenta spesso come un piccolo sì detto con la voce che trema.",
    "Puoi avere paura e fare comunque la cosa giusta per te.",
    "Ogni volta che racconti come stai davvero, apri una porta che prima era chiusa.",
    "Provare e sbagliare insegna più che restare fermi a immaginare come andrà.",
    "Dire «ho bisogno di una pausa» è già un atto di coraggio.",
  ],
  'Consapevolezza': [
    "Prima di reagire, chiediti cosa stai sentendo. Dare un nome a un'emozione la rende più leggera.",
    "Guarda il cielo per un minuto intero. Il resto della lista può aspettare.",
    "I pensieri passano come nuvole. Puoi osservarli senza seguirli.",
    "Scrivere quello che provi mostra cose che nella testa restavano confuse.",
    "Senti i piedi a terra. È il modo più semplice per tornare qui.",
  ],
  'Speranza': [
    "Le giornate storte finiscono. Domani si riparte da un foglio pulito.",
    "Dopo la notte più lunga, il mattino arriva lo stesso.",
    "Quello che oggi pesa potresti ricordarlo, tra un anno, come il giorno in cui hai cambiato rotta.",
    "Qualche buona notizia è già in cammino, anche se ancora non la vedi.",
    "Un giorno ripenserai a questo periodo sapendo di aver tenuto duro.",
  ],
  'Amore proprio': [
    "Parlati come parleresti a un amico che sta passando per lo stesso momento.",
    "Meriti gentilezza anche nei giorni in cui non hai concluso niente.",
    "Prenderti cura di te è un compito vero, e puoi metterlo in agenda.",
    "Puoi volerti bene anche mentre stai ancora cambiando.",
    "Oggi hai fatto quello che potevi, e per oggi è abbastanza.",
  ],
  'Crescita': [
    "Ogni pagina che scrivi nel diario è un punto di partenza per capirti meglio.",
    "Crescere somiglia a salire una scala a chiocciola: ripassi dagli stessi punti, ma più in alto.",
    "Gli errori di oggi sono appunti per la versione di te che arriverà domani.",
    "Un giorno in più di costanza vale più di uno slancio grande che dura una settimana.",
    "Cambiare un'abitudine alla volta funziona meglio che cambiare tutto insieme.",
  ],
};

const QUOTES: QuoteData[] = Object.entries(QUOTES_BY_CATEGORY).flatMap(
  ([category, texts], categoryIndex) =>
    texts.map((text, i) => ({
      id: `q-${categoryIndex * 10 + i + 1}`,
      text,
      category,
      icon: CATEGORY_ICONS[category] ?? 'quote',
    }))
);

interface MotivationsProps {
  onClose?: () => void;
}

export function Motivations({ onClose }: MotivationsProps) {
  const [activeCategory, setActiveCategory] = useState<string>('Tutte');
  const [favorites, setFavorites] = useState<string[]>([]);
  const quotes = QUOTES;

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('favorite_quotes');
    if (savedFavorites) {
      try {
        const saved: string[] = JSON.parse(savedFavorites);
        // Tiene solo i preferiti che esistono ancora nell'archivio attuale
        const validIds = new Set(QUOTES.map(q => q.id));
        setFavorites(saved.filter(id => validIds.has(id)));
      } catch (e) {
        console.error("Failed to parse favorites", e);
      }
    }
    // Le frasi non arrivano più da un servizio esterno: elimina la vecchia cache
    localStorage.removeItem('cached_quotes');
    localStorage.removeItem('cached_quotes_date');
  }, []);

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem('favorite_quotes', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (id: string | number) => {
    setFavorites(prev =>
      prev.includes(id.toString())
        ? prev.filter(fid => fid !== id.toString())
        : [...prev, id.toString()]
    );
  };

  const dailyQuotes = useMemo(() => {
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();

    const random = (s: number) => {
      const x = Math.sin(s) * 10000;
      return x - Math.floor(x);
    };

    const numericId = (q: QuoteData) => Number(q.id.split('-')[1]);
    const shuffled = [...quotes].sort((a, b) => random(seed + numericId(a)) - random(seed + numericId(b)));

    return shuffled.slice(0, 6);
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

  const [heroQuote, bento1, bento2, wideQuote, bottom1, bottom2] = dailyQuotes;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <section className="mb-8 flex justify-between items-start">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-primary mb-2">Motivazioni</h2>
          <p className="text-on-surface-variant font-medium leading-relaxed">
            Poche parole per ritrovare calma e forza quando ne hai bisogno.
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Chiudi"
            className="w-11 h-11 flex items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest transition-colors"
          >
            <X size={24} />
          </button>
        )}
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
          <div className="relative group rounded-lg overflow-hidden min-h-[320px] bg-gradient-to-br from-primary to-primary-soft p-8 flex flex-col justify-end shadow-[0_12px_32px_rgba(140,78,55,0.15)]">
            <div className="absolute top-6 right-6 z-20">
              <button
                onClick={() => toggleFavorite(heroQuote.id)}
                aria-label="Aggiungi ai preferiti"
                className={`w-12 h-12 rounded-full backdrop-blur-md flex items-center justify-center active:scale-90 transition-all ${
                  favorites.includes(heroQuote.id.toString())
                    ? 'bg-on-primary text-primary'
                    : 'bg-on-primary/20 text-on-primary'
                }`}
              >
                <Heart size={24} fill={favorites.includes(heroQuote.id.toString()) ? 'currentColor' : 'none'} />
              </button>
            </div>
            <div className="relative z-10 space-y-4">
              <Quote size={40} className="text-on-primary/40" />
              <h3 className="text-on-primary text-3xl font-bold leading-tight">{heroQuote.text}</h3>
              <div className="pt-2">
                <p className="text-on-primary/80 text-sm font-medium uppercase tracking-widest">{heroQuote.category}</p>
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
                    aria-label="Aggiungi ai preferiti"
                    className={`transition-colors ${favorites.includes(q.id.toString()) ? 'text-primary' : 'text-outline group-hover:text-primary'}`}
                  >
                    <Heart size={20} fill={favorites.includes(q.id.toString()) ? 'currentColor' : 'none'} />
                  </button>
                </div>
                <p className={`${i === 0 ? 'text-primary' : 'text-on-secondary-container'} font-bold text-lg leading-snug line-clamp-5`}>{q.text}</p>
              </div>
            ))}
          </div>

          {/* Wide Card */}
          <div className="bg-surface-container p-8 rounded-lg flex items-center gap-6 relative overflow-hidden transition-all hover:bg-surface-container-high group">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              {renderIcon(wideQuote.icon, "text-primary", 28)}
            </div>
            <p className="flex-1 text-primary font-bold text-xl leading-tight italic">"{wideQuote.text}"</p>
            <button
              onClick={() => toggleFavorite(wideQuote.id)}
              aria-label="Aggiungi ai preferiti"
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
                <p className={`${i === 0 ? 'text-on-surface' : 'text-primary'} font-bold text-lg leading-snug line-clamp-6 pb-8`}>{q.text}</p>
                <button
                  onClick={() => toggleFavorite(q.id)}
                  aria-label="Aggiungi ai preferiti"
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
              <p className="text-on-surface-variant font-medium">
                {activeCategory === 'Preferiti'
                  ? 'Tocca il cuore su una frase per ritrovarla qui.'
                  : 'Nessuna frase in questa categoria.'}
              </p>
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
                    aria-label="Aggiungi ai preferiti"
                    className={`transition-colors ${favorites.includes(quote.id.toString()) ? 'text-primary' : 'text-outline group-hover:text-primary'}`}
                  >
                    <Heart size={20} fill={favorites.includes(quote.id.toString()) ? 'currentColor' : 'none'} />
                  </button>
                </div>
                <p className="text-on-surface font-bold text-xl leading-snug">"{quote.text}"</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
