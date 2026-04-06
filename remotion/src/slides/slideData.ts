import type { Overlay } from '../components/IPhoneMockup';

export type BackgroundVariant = 'warm' | 'sage' | 'terracotta' | 'night';
export type TextPosition = 'above' | 'below';

export interface SlideConfig {
  id: number;
  imageFile: string;
  headline: string;
  subheadline: string;
  backgroundVariant: BackgroundVariant;
  textPosition: TextPosition;
  overlays?: Overlay[];
}

// Shortcuts
const avatar = (x: number, y: number, size: number): Overlay => ({
  kind: 'avatar', x, y, size, shape: 'circle',
});
const avatarSquare = (x: number, y: number, size: number): Overlay => ({
  kind: 'avatar', x, y, size, shape: 'rounded-rect',
});

export const SLIDES: SlideConfig[] = [
  {
    id: 1,
    imageFile: '01-splash.jpeg',
    headline: 'Benvenuto nel tuo spazio',
    subheadline: 'Un rifugio digitale per conoscerti meglio ogni giorno',
    backgroundVariant: 'night',
    textPosition: 'below',
  },
  {
    id: 2,
    imageFile: '02-pin.jpeg',
    headline: 'I tuoi pensieri al sicuro',
    subheadline: 'Protezione PIN per mantenere la tua privacy',
    backgroundVariant: 'night',
    textPosition: 'below',
  },
  {
    id: 3,
    imageFile: '03-home.jpeg',
    headline: "La tua giornata,\na colpo d'occhio",
    subheadline: 'Streak, citazioni e accesso rapido a tutto ciò che ti serve',
    backgroundVariant: 'night',
    textPosition: 'below',
    overlays: [
      // Avatar in header top-right
      avatar(655, 84, 72),
      // Copre solo il testo della NOTA SERALE (posizione effettiva ~y=985)
      { kind: 'block', x: 0, y: 978, width: 762, height: 155, fill: '#1f1d19' },
      {
        kind: 'note',
        x: 56, y: 1010, width: 650, height: 110,
        text: '"Oggi ho riflettuto su cosa mi rende davvero felice..."',
      },
    ],
  },
  {
    id: 4,
    imageFile: '04-checkin.jpeg',
    headline: 'Il tuo diario personale',
    subheadline: 'Ogni voce racconta un pezzo del tuo percorso',
    backgroundVariant: 'terracotta',
    textPosition: 'above',
    overlays: [
      // Avatar in header
      avatar(655, 84, 72),
      // Full diary entry area — copre dalla data fino alla nav bar
      {
        kind: 'diary-card',
        x: 0, y: 390, width: 762, height: 1150,
      },
    ],
  },
  {
    id: 5,
    imageFile: '05-diary.jpeg',
    headline: 'Come ti senti oggi?',
    subheadline: 'Check-in emozionale quotidiano con riflessioni guidate',
    backgroundVariant: 'warm',
    textPosition: 'below',
    overlays: [avatar(655, 84, 72)],
  },
  {
    id: 6,
    imageFile: '06-journey.jpeg',
    headline: 'Misura la tua crescita',
    subheadline: '12 giorni di rinascita: ogni passo conta',
    backgroundVariant: 'sage',
    textPosition: 'above',
    overlays: [avatar(655, 84, 72)],
  },
  {
    id: 7,
    imageFile: '07-echoes.jpeg',
    headline: 'Tutto sotto controllo',
    subheadline: 'Notifiche, sicurezza e personalizzazione in un unico posto',
    backgroundVariant: 'terracotta',
    textPosition: 'below',
    overlays: [
      // Copre avatar foto + intestazione card con ampia margine di sicurezza
      { kind: 'block', x: 0, y: 140, width: 762, height: 380, fill: '#1e1c17' },
      avatarSquare(18, 150, 250),
    ],
  },
  {
    id: 8,
    imageFile: '08-motivations.jpeg',
    headline: 'Parole che ispirano',
    subheadline: 'Citazioni curate per accompagnarti nel cammino quotidiano',
    backgroundVariant: 'warm',
    textPosition: 'above',
  },
];
