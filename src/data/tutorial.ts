import type { ImageMetadata } from 'astro';
import type { Localized } from '../i18n/config';
import en1 from '../assets/tutorial/en/step-1.png';
import en2 from '../assets/tutorial/en/step-2.png';
import en3 from '../assets/tutorial/en/step-3.png';
import en4 from '../assets/tutorial/en/step-4.png';
import en5 from '../assets/tutorial/en/step-5.png';
import en6 from '../assets/tutorial/en/step-6.png';
import en7 from '../assets/tutorial/en/step-7.png';
import mk1 from '../assets/tutorial/mk/step-1.png';
import mk2 from '../assets/tutorial/mk/step-2.png';
import mk3 from '../assets/tutorial/mk/step-3.png';
import mk4 from '../assets/tutorial/mk/step-4.png';
import mk5 from '../assets/tutorial/mk/step-5.png';
import mk6 from '../assets/tutorial/mk/step-6.png';
import mk7 from '../assets/tutorial/mk/step-7.png';

export interface TutorialStep {
  id: string;
  image: Localized<ImageMetadata>;
  title: Localized<string>;
  /** Plain text; paragraphs are separated by a blank line (`\n\n`). */
  body: Localized<string>;
}

export const tutorialTitle: Localized<string> = {
  en: 'Game Tutorial',
  mk: 'Упатство за играње',
};

export const tutorial: TutorialStep[] = [
  {
    id: 'status-bar',
    image: { en: en1, mk: mk1 },
    title: { en: 'Status Bar', mk: 'Статусна Лента' },
    body: {
      en: 'Click a button to show detailed info',
      mk: 'Кликни на копчињата под лентата!',
    },
  },
  {
    id: 'task-overview',
    image: { en: en2, mk: mk2 },
    title: { en: 'Task Overview', mk: 'Преглед на Задачи' },
    body: {
      en: 'Your tasks are displayed on the board.\n\nEach card is a main objective you can work on.\n\nNew tasks appear here as the story progresses.\n\nThe board helps you track what’s important at a glance.\n\nClicking T opens and closes the Task Overview',
      mk: 'Задачите се прикажани на таблата.\n\nСите картички се главни задачи.\n\nНови задачи ќе се појавуваат во текот на приказната.\n\nТаблата е тука да ти покаже до каде си со напредок.\n\nТаблата се отвара со кликање на копчето Т.',
    },
  },
  {
    id: 'task-details',
    image: { en: en3, mk: mk3 },
    title: { en: 'Task Details', mk: 'Детални Задачи' },
    body: {
      en: 'Green text = task completed.\n\nRed text = task failed.\n\nClicking a task opens its detailed view, showing every step clearly.',
      mk: 'Зелено = Завршена Задача\n\nЦрвено = Неуспешна Задача\n\nСо кликање на задача се отвара детален преглед со сите потребни чекори!',
    },
  },
  {
    id: 'dialogues',
    image: { en: en4, mk: mk4 },
    title: { en: 'Dialogues', mk: 'Дијалог' },
    body: {
      en: 'Click a character to start a conversation.\n\nSome options are one-time — think before you commit.',
      mk: 'Кликни на карактерите за да почнеш разговор.\n\nНекои избори се еднократни – мисли пред да одбереш!',
    },
  },
  {
    id: 'activities',
    image: { en: en5, mk: mk5 },
    title: { en: 'Activities', mk: 'Активности' },
    body: {
      en: 'The Action button is your way of checking what’s available in each location.\n\nInstead of guessing, open it and you’ll always see what can be done here and now.\n\nIt also shows the travel options, letting you move between locations at the right times.',
      mk: 'Ова копче е твојот начин да провериш што е достапно во твојата околина.\n\nСо неговото отворање секогаш можеш да видиш достапни акции.\n\nИсто така преку него се патува од една до друга локација.',
    },
  },
  {
    id: 'settings',
    image: { en: en6, mk: mk6 },
    title: { en: 'Settings', mk: 'Подесувања' },
    body: {
      en: 'Open the Settings menu by pressing ESC.\n\nSettings let you adjust Sound (overall volume) and Music (game music volume).\n\nThe game does not pause when the menu is open — time and activities keep running in the background.',
      mk: 'Се отвара со кликање на ESC.\n\nОва мени ти дозволува промена на звукот и музиката во играта. Додека е вклучено прозорецот времето тече!',
    },
  },
  {
    id: 'gray-zone',
    image: { en: en7, mk: mk7 },
    title: { en: 'The Gray Zone', mk: 'Сивата Зона' },
    body: {
      en: 'The world reacts to your decisions, big and small.\n\nYou can take the honest route, exploit shortcuts, or stay in the gray zone.\n\nEvery action leaves a mark — some visible right away, others only later.',
      mk: 'Светот околу тебе реагира на твоите одлуки.\n\nМожеш да одбереш чесната страна, да користиш кратенки или да останеш во сивата зона.\n\nСекоја акција остава трага – некои се видливи одма, други дури кога веќе е предоцна.',
    },
  },
];
