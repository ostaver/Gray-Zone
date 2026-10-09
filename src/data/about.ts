import type { Localized } from '../i18n/config';

/** A run of the manifesto statement; `tone` marks the words the design singles out. */
export interface ManifestoPart {
  text: string;
  /** `hollow`: outline display type, like the gray half of the hero title. `red`: integrity red. */
  tone?: 'hollow' | 'red';
}

export type StatId = 'integrity' | 'reputation' | 'time' | 'money';

export interface About {
  /** Big statement opening the section; words tear from gray to solid as it is read. */
  manifesto: ManifestoPart[];
  title: string;
  paragraphs: string[];
  goalsTitle: string;
  goals: string[];
  /** Heading of the scene where the game's four stats play out. */
  statsTitle: string;
  stats: Record<StatId, { label: string; caption: string }>;
  /** In-game day counter label ("Day 1"). */
  day: string;
}

/** Where the stats scene's clock starts: Day 1, 08:00, in minutes. */
export const clockStart = 8 * 60;

/** The in-game clock as the status bar shows it ("08:00"), from minutes since Day 1 began. */
export function gameClock(minutes: number): string {
  return `${String(Math.floor(minutes / 60) % 24).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

export const about: Localized<About> = {
  en: {
    manifesto: [
      { text: 'Corruption rarely looks like a crime. It looks like a favour, a shortcut, a small exception: the' },
      { text: 'gray zone', tone: 'hollow' },
      { text: 'between right and wrong. Here every choice leaves a mark, and only one path keeps your' },
      { text: 'integrity.', tone: 'red' },
    ],
    title: 'Your choices. Your integrity.',
    paragraphs: [
      'You play a high school senior applying for a scholarship abroad. The deadline is close: gather documents, deal with institutions, prepare for an English test, and make it through the interview.',
      'At every step, choose between doing the work honestly and taking a corrupt shortcut. Your decisions affect integrity, reputation, time, and money—and lead to different endings. Getting the scholarship is only part of the challenge. How you earn it matters.',
    ],
    goalsTitle: 'Made for young people and educators',
    goals: [
      'Recognise corruption in everyday situations, including favours and seemingly harmless shortcuts.',
      'Practise critical thinking, weigh consequences, and reflect on integrity and honesty.',
      'Use the game to start discussions in classrooms and non-formal learning settings.',
    ],
    statsTitle: 'What the game keeps track of',
    stats: {
      integrity: { label: 'Integrity', caption: 'Every shortcut chips a little off.' },
      reputation: { label: 'Reputation', caption: 'What people believe you did.' },
      time: { label: 'Time', caption: 'The clock never stops, not even in the menu.' },
      money: { label: 'Money', caption: 'Some doors open for a price.' },
    },
    day: 'Day',
  },
  mk: {
    manifesto: [
      { text: 'Корупцијата ретко изгледа како злосторство. Изгледа како услуга, кратенка, мал исклучок:' },
      { text: 'сивата зона', tone: 'hollow' },
      { text: 'меѓу правилното и погрешното. Тука секој избор остава трага, а само еден пат го чува твојот' },
      { text: 'интегритет.', tone: 'red' },
    ],
    title: 'Твои избори. Твој интегритет.',
    paragraphs: [
      'Играш како средношколец во последната година кој аплицира за стипендија во странство. Рокот е краток: собери документи, соработувај со институции, подготви се за тест по англиски и помини го интервјуто.',
      'На секој чекор избираш меѓу чесна работа и коруптивна кратенка. Твоите одлуки влијаат врз интегритетот, репутацијата, времето и парите — и водат до различни завршетоци. Добивањето стипендија е само дел од предизвикот. Важно е и како ќе ја заслужиш.',
    ],
    goalsTitle: 'За млади луѓе и едукатори',
    goals: [
      'Препознај корупција во секојдневни ситуации, вклучувајќи услуги и навидум безопасни кратенки.',
      'Вежбај критичко размислување, процени ги последиците и размисли за интегритетот и чесноста.',
      'Користи ја играта за дискусии во училница и во неформални средини за учење.',
    ],
    statsTitle: 'Што следи играта',
    stats: {
      integrity: { label: 'Интегритет', caption: 'Секоја кратенка откинува парче од него.' },
      reputation: { label: 'Репутација', caption: 'Што другите веруваат дека си направил.' },
      time: { label: 'Време', caption: 'Часовникот не застанува, ниту кога е отворено менито.' },
      money: { label: 'Пари', caption: 'Некои врати се отвораат за пари.' },
    },
    day: 'Ден',
  },
};
