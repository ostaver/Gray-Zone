import type { Localized } from '../i18n/config';

export interface About {
  title: string;
  paragraphs: string[];
  goalsTitle: string;
  goals: string[];
}

export const about: Localized<About> = {
  en: {
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
  },
  mk: {
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
  },
};
