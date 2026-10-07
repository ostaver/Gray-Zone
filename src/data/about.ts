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
    title: 'About the educational video game „Gray Zone“',
    paragraphs: [
      'The player takes on the role of a high school senior on the path to education, where he will continue his studies and higher education. He receives a wonderful opportunity for a scholarship to a great university abroad, but the time to apply for the scholarship is short. To succeed, the player must go through a series of series and situations that look at reality - preparing documents, administrative, interviews with institutions and test questions.',
      'At each step, the player is faced with a choice: to follow the honest path and put in the effort, or to choose which groups of positive practices at first glance seem like a solution. The decisions they make lead the player through a „gray zone“ - a space in which the border between ethically correct actions and illegal actions is unclear and difficult to demarcate.',
      'Each choice has consequences based on the story and the final outcome: obtaining the scholarship in an honest way, dismiss opportunity, or achieve success through a group of practices that leave behind negative integrity scars.',
      'The game offers multiple scenarios and endings that make it playful and interactive, and the response to critical thinking for young people about the importance of integrity, ethical choices and the consequences of corruption.',
    ],
    goalsTitle: 'The goals of the game that we strive to achieve are the following:',
    goals: [
      'Young people are faced with real corrupt situations. Of course, critical thinking, moral assessment and active reflection on the decisions made by each player. (In the process of playing, each player’s integrity, reputation, time and money are measured).',
      'Values such as integrity, honesty and resistance to corruption are promoted.',
      'A long-lasting resource which will be used in teaching and non-formal educational environments.',
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
    title: 'За едукативната електронска игра „Сива Зона“',
    paragraphs: [
      '„Сива Зона“ е интерактивна едукативна игра која ја носи приказната на средношколец во последната година од своето образование. Играчот се најдува пред важен животен избор — каде и како ќе го продолжи своето образование. По добивање можност за стипендија на престижен универзитет во странство, времето за апликација е кратко и патот исполнет со предизвици.',
      'Во играта, секој чекор носи избор: чесен пат, исполнет со труд и подготовка, или полесен пат преку коруптивни практики. Овие избори го водат играчот низ „сива зона“ — простор каде границите меѓу етичкото и нелегалното се заматени. Секоја одлука има последици — од успех без компромис до губење на можноста, или постигнување на целта со негативни последици по интегритетот. Играта нуди повеќе сценарија и завршетоци, поттикнувајќи критичко размислување и развој на вредности како интегритет, чесност и отпор кон корупција.',
    ],
    goalsTitle: 'Цели на „Сива Зона“:',
    goals: [
      'Приказ на реални коруптивни ситуации и предизвици.',
      'Поттикнување критичко размислување, морална проценка и рефлексија.',
      'Создавање долготраен едукативен ресурс за формално и неформално учење.',
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
