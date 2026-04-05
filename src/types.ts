export type Mood = 'Difficile' | 'Arrabbiato' | 'Neutro' | 'Meglio' | 'Forte';

export interface DiaryEntry {
  id: string;
  date: string;
  time: string;
  mood: Mood;
  note: string;
  timestamp: number;
  uid: string;
  eveningNote?: string;    // nota di riflessione serale opzionale
  eveningNoteOnly?: boolean; // true = creata solo per la nota serale, NON conta per lo streak
}

export interface EchoMessage {
  id: string;
  role: 'user' | 'persona';
  content: string;
  timestamp: number;
}

export interface Persona {
  name: string;
  context: string; // The processed chat history/style
  lastUpdated: number;
}
