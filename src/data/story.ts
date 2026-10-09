import type { Localized } from '../i18n/config';

/** One counter on the way to the scholarship: a form with an honest box and a shortcut box. */
export interface StoryStep {
  id: string;
  /** The form's name, set as its heading. */
  doc: Localized<string>;
  situation: Localized<string>;
  honest: Localized<string>;
  shortcut: Localized<string>;
}

export type Verdict = 'clean' | 'scarred' | 'lost';

export interface StoryCopy {
  title: string;
  /** How to play the pad of forms. */
  hint: string;
  honestMark: string;
  shortcutMark: string;
  decision: string;
  /** The signature line at the foot of each form. */
  sign: string;
  /** Labels the bar beside the queue of counters that runs down as the forms are scrolled. */
  deadline: string;
  verdicts: Record<Verdict, { stamp: string; text: string }>;
  teaser: string;
  cta: string;
}

export const steps: StoryStep[] = [
  {
    id: 'certificate',
    doc: { mk: 'Извод од матична книга', en: 'Birth certificate' },
    situation: {
      mk: 'Апликацијата бара извод. Редицата во општината е до врата, а рокот тече.',
      en: 'The application needs a birth certificate. The queue at the municipality runs out the door, and the deadline is running.',
    },
    honest: { mk: 'Чекам на ред.', en: 'Wait my turn.' },
    shortcut: { mk: 'Познаник ме „турка“ напред, за мала услуга.', en: 'A friend of a friend gets me to the front, for a small favour.' },
  },
  {
    id: 'secretary',
    doc: { mk: 'Потврда од секретаријат', en: 'Confirmation from the secretary' },
    situation: {
      mk: 'Секретарката треба да ти потпише потврда. Вели дека ќе биде готова „за некоја недела“.',
      en: 'The secretary has to sign your confirmation. She says it will be ready “in a week or so”.',
    },
    honest: { mk: 'Ги предавам документите и чекам.', en: 'Hand in the papers and wait.' },
    shortcut: { mk: 'Оставам „подарок“ на шалтерот.', en: 'Leave a “gift” at the counter.' },
  },
  {
    id: 'english',
    doc: { mk: 'Тест по англиски', en: 'English test' },
    situation: {
      mk: 'Ти треба сертификат по англиски. Некој нуди одговори од минатиот рок.',
      en: 'You need an English certificate. Someone is selling last session’s answers.',
    },
    honest: { mk: 'Учам секоја вечер.', en: 'Study every night.' },
    shortcut: { mk: 'Ги купувам одговорите.', en: 'Buy the answers.' },
  },
  {
    id: 'interview',
    doc: { mk: 'Интервју', en: 'The interview' },
    situation: {
      mk: 'На интервјуто те прашуваат за оценките. Една четворка би можела „да стане“ петка.',
      en: 'At the interview they ask about your grades. A B could “become” an A.',
    },
    honest: { mk: 'Кажувам како е.', en: 'Tell it like it is.' },
    shortcut: { mk: 'Ја „поправам“ оценката.', en: '“Fix” the grade.' },
  },
];

/** Shortcuts taken → ending, after the game's three outcomes. */
export function verdictFor(shortcuts: number): Verdict {
  if (shortcuts === 0) return 'clean';
  return shortcuts < 3 ? 'scarred' : 'lost';
}

export const story: Localized<StoryCopy> = {
  mk: {
    title: 'Четири шалтери. Еден рок.',
    hint: 'Штиклирај едно поле на секој формулар.',
    honestMark: 'чесно',
    shortcutMark: 'кратенка',
    sign: 'Потпис',
    deadline: 'Рок',
    decision: 'Одлука за стипендијата',
    verdicts: {
      clean: { stamp: 'Одобрено', text: 'Стипендијата е твоја, заработена чесно. Потрае подолго, но никој не може да ти ја земе.' },
      scarred: { stamp: 'Одобрено', text: 'Успеа. Но секоја кратенка остави трага, и ти знаеш каде.' },
      lost: { stamp: 'Одбиено', text: 'Кратенките се забележаа. Можноста е изгубена.' },
    },
    teaser: 'Во играта изборите се повеќе, а последиците траат подолго.',
    cta: 'Помини го целиот пат',
  },
  en: {
    title: 'Four counters. One deadline.',
    hint: 'Tick one box on each form.',
    honestMark: 'honest',
    shortcutMark: 'shortcut',
    sign: 'Signature',
    deadline: 'Deadline',
    decision: 'Scholarship decision',
    verdicts: {
      clean: { stamp: 'Approved', text: 'The scholarship is yours, earned honestly. It took longer, but no one can take it away.' },
      scarred: { stamp: 'Approved', text: 'You made it. But every shortcut left a mark, and you know where.' },
      lost: { stamp: 'Rejected', text: 'The shortcuts were noticed. The opportunity is gone.' },
    },
    teaser: 'In the game there are more choices, and the consequences last longer.',
    cta: 'Walk the whole path',
  },
};
