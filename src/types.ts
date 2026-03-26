export type Mood = 'Difficile' | 'Arrabbiato' | 'Neutro' | 'Meglio' | 'Forte';

export interface DiaryEntry {
  id: string;
  date: string;
  time: string;
  mood: Mood;
  note: string;
  timestamp: number;
  uid: string;
}
