import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { MessageCircle, Upload, Send, User, Sparkles, Trash2, ArrowLeft, Info, Loader2 } from 'lucide-react';
import { EchoMessage, Persona } from '../types';
import { GoogleGenAI } from "@google/genai";
import { toast } from 'sonner';

interface EchoesProps {
  apiKey: string;
}

export function Echoes({ apiKey }: EchoesProps) {
  const [persona, setPersona] = useState<Persona | null>(null);
  const [messages, setMessages] = useState<EchoMessage[]>([]);
  const [input, setInput] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedPersona = localStorage.getItem('echo_persona');
    const savedMessages = localStorage.getItem('echo_messages');
    if (savedPersona) setPersona(JSON.parse(savedPersona));
    if (savedMessages) setMessages(JSON.parse(savedMessages));
  }, []);

  useEffect(() => {
    if (persona) localStorage.setItem('echo_persona', JSON.stringify(persona));
    if (messages.length > 0) localStorage.setItem('echo_messages', JSON.stringify(messages));
  }, [persona, messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages, isTyping]);

  const parseWhatsApp = (text: string) => {
    const lines = text.split('\n');
    const messagesByPerson: Record<string, string[]> = {};
    
    // Improved regex to be more flexible with date formats and separators
    // Matches: [26/03/26, 17:55:20] Name: Message OR 26/03/26, 17:55 - Name: Message
    const msgRegex = /(?:\[?(\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}),?\s(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[ap]m)?)\]?|(\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}),?\s(\d{1,2}:\d{2})\s-)\s([^:]+):\s(.*)/i;

    lines.forEach(line => {
      const match = line.match(msgRegex);
      if (match) {
        const name = (match[5] || "").trim();
        const content = (match[6] || "").trim();
        if (name && content) {
          if (!messagesByPerson[name]) messagesByPerson[name] = [];
          messagesByPerson[name].push(content);
        }
      }
    });

    // Find the "other" person (not the user, usually the one with more messages or the first one found that isn't 'Tu' or 'Me')
    const names = Object.keys(messagesByPerson);
    if (names.length < 1) return null;

    // For simplicity, let's ask the user or pick the one that isn't the most common "self" name
    const personaName = names.find(n => !['Tu', 'Me', 'You', 'Io'].includes(n)) || names[0];
    
    // Build a context string from the last 100 messages of that persona to capture style
    const styleContext = messagesByPerson[personaName].slice(-100).join('\n');

    return {
      name: personaName,
      context: styleContext,
      lastUpdated: Date.now()
    };
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const newPersona = parseWhatsApp(text);
        if (newPersona) {
          setPersona(newPersona);
          setMessages([{
            id: 'welcome',
            role: 'persona',
            content: `Ciao! Sono pronta a parlare con te come farebbe ${newPersona.name}. Di cosa vuoi parlare?`,
            timestamp: Date.now()
          }]);
          toast.success("Chat importata!", {
            description: `Profilo di ${newPersona.name} creato con successo.`
          });
        } else {
          toast.error("Errore di importazione", {
            description: "Non ho trovato messaggi validi nel file. Assicurati che sia un export di WhatsApp senza media."
          });
        }
      } catch (err) {
        console.error("Import error:", err);
        toast.error("Errore durante la lettura del file");
      } finally {
        setIsImporting(false);
      }
    };
    reader.onerror = () => {
      toast.error("Errore nel caricamento del file");
      setIsImporting(false);
    };
    reader.readAsText(file);
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !persona) return;

    // Use prop if provided, otherwise try global process.env
    let envKey = '';
    try {
      envKey = process.env.GEMINI_API_KEY || '';
    } catch (e) {
      // Silent fail for env access
    }
    
    const effectiveApiKey = apiKey || envKey;

    if (!effectiveApiKey) {
      toast.error("Configurazione mancante", {
        description: "L'API Key di Gemini non è stata trovata. Assicurati che sia configurata correttamente nell'ambiente."
      });
      return;
    }

    const generateId = () => {
      try {
        return crypto.randomUUID();
      } catch (e) {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
      }
    };

    const userMsg: EchoMessage = {
      id: generateId(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const toastId = toast.loading("L'eco sta scrivendo...");

    try {
      const ai = new GoogleGenAI({ apiKey: effectiveApiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            role: 'user',
            parts: [{
              text: `Sei un'intelligenza artificiale che deve imitare lo stile di scrittura di una persona chiamata ${persona.name}. 
              Ecco alcuni esempi dei suoi messaggi reali per capire il suo stile (emoji, lunghezza, tono, parole tipiche):
              ---
              ${persona.context}
              ---
              Regole:
              1. Rispondi in modo breve e naturale, come in una chat WhatsApp.
              2. Usa lo stesso tono (formale, informale, dolce, distaccato) degli esempi.
              3. Usa le emoji se la persona le usava.
              4. Non dire mai che sei un'IA. Sii ${persona.name}.
              
              Messaggio dell'utente: ${input}`
            }]
          }
        ],
        config: {
          temperature: 0.8,
          topP: 0.95,
        }
      });

      const personaMsg: EchoMessage = {
        id: generateId(),
        role: 'persona',
        content: response.text || "...",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, personaMsg]);
      toast.dismiss(toastId);
    } catch (error) {
      console.error("Gemini Error:", error);
      toast.error("Errore di comunicazione", {
        id: toastId,
        description: "Non è stato possibile ricevere una risposta dall'eco digitale. Riprova tra poco."
      });
    } finally {
      setIsTyping(false);
    }
  };

  const resetPersona = () => {
    if (window.confirm("Sei sicuro di voler eliminare questo profilo? Dovrai ricaricare la chat.")) {
      setPersona(null);
      setMessages([]);
      localStorage.removeItem('echo_persona');
      localStorage.removeItem('echo_messages');
    }
  };

  if (!persona) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
        <header className="space-y-2">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4">
            <Sparkles size={24} />
          </div>
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tight leading-tight">Echi del Cuore</h2>
          <p className="text-on-surface-variant text-base leading-relaxed">
            Crea un'eco digitale di una persona cara importando la vostra chat WhatsApp. Gemini imparerà il suo stile per permetterti di scambiare qualche parola.
          </p>
        </header>

        <section className="bg-surface-container-low border-2 border-dashed border-primary/20 rounded-3xl p-10 flex flex-col items-center text-center space-y-6">
          <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center text-primary">
            {isImporting ? <Loader2 className="animate-spin" size={40} /> : <Upload size={40} />}
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-on-surface">Importa Chat WhatsApp</h3>
            <p className="text-sm text-on-surface-variant max-w-xs mx-auto">
              Esporta la chat da WhatsApp come file .txt (senza media) e caricalo qui. I dati rimarranno privati sul tuo dispositivo.
            </p>
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="bg-primary text-white px-8 py-4 rounded-full font-bold shadow-lg active:scale-95 transition-all flex items-center gap-2"
          >
            Seleziona File .txt
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept=".txt" 
            className="hidden" 
          />
        </section>

        <section className="bg-primary/5 rounded-2xl p-6 flex items-start gap-4">
          <Info className="text-primary shrink-0" size={20} />
          <div className="space-y-1">
            <p className="text-xs font-bold text-primary uppercase tracking-widest">Come esportare?</p>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Apri WhatsApp &gt; Chat con la persona &gt; Impostazioni &gt; Altro &gt; Esporta chat &gt; Senza media. Salva il file .txt e caricalo qui.
            </p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] animate-in fade-in duration-500">
      <header className="flex items-center justify-between p-4 bg-surface-container-low rounded-2xl mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <User size={20} />
          </div>
          <div>
            <h3 className="font-bold text-on-surface leading-none">{persona.name}</h3>
            <span className="text-[10px] text-primary font-bold uppercase tracking-widest">Eco Digitale</span>
          </div>
        </div>
        <button 
          onClick={resetPersona}
          className="p-2 text-on-surface-variant hover:text-destructive transition-colors"
        >
          <Trash2 size={20} />
        </button>
      </header>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 pr-2 hide-scrollbar"
      >
        {messages.map((msg) => (
          <div 
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
              msg.role === 'user' 
                ? 'bg-primary text-white rounded-tr-none' 
                : 'bg-surface-container-highest text-on-surface rounded-tl-none'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-surface-container-highest p-4 rounded-2xl rounded-tl-none flex gap-1">
              <div className="w-1.5 h-1.5 bg-on-surface-variant/40 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-on-surface-variant/40 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-1.5 h-1.5 bg-on-surface-variant/40 rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <input 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Scrivi un messaggio..."
          className="flex-1 bg-surface-container-low border-none rounded-full px-6 py-4 text-on-surface focus:ring-2 focus:ring-primary/20 transition-all"
        />
        <button 
          onClick={handleSendMessage}
          disabled={!input.trim() || isTyping}
          className="w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all disabled:opacity-50"
        >
          <Send size={24} />
        </button>
      </div>
    </div>
  );
}
