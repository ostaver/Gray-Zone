import type { ImageMetadata } from 'astro';
import type { Localized } from '../i18n/config';
import mainMenu from '../assets/gallery/MainMenu.png';
import settings from '../assets/gallery/Settings.png';
import gameNickname from '../assets/gallery/GameNickname.png';
import gameDay1 from '../assets/gallery/GameDay1.png';
import tasks from '../assets/gallery/Tasks.png';
import gameSecretary from '../assets/gallery/GameSecretary.png';

export interface GalleryItem {
  id: string;
  image: ImageMetadata;
  caption: Localized<string>;
}

export interface GalleryCopy {
  title: string;
  /** How to work the arc. */
  hint: string;
  staticHint: string;
  /** Prefixed to each caption for the screenshot's alt text. */
  shot: string;
  /** Accessible name of a frame's button, before its caption. */
  open: string;
  prev: string;
  next: string;
}

export const gallery: GalleryItem[] = [
  { id: 'day-1-school', image: gameDay1, caption: { en: 'Day 1: find the secretary’s office', mk: 'Ден 1: најди ја канцеларијата на секретарката' } },
  { id: 'secretary', image: gameSecretary, caption: { en: 'Meet the secretary and receive a form', mk: 'Запознај ја секретарката и добиј формулар' } },
  { id: 'tasks', image: tasks, caption: { en: 'Track your documents and study tasks', mk: 'Следи ги документите и задачите за учење' } },
  { id: 'main-menu', image: mainMenu, caption: { en: 'Start your journey from the main menu', mk: 'Започни го патувањето од главното мени' } },
  { id: 'settings', image: settings, caption: { en: 'Adjust sound and music', mk: 'Прилагоди ги звукот и музиката' } },
  { id: 'nickname', image: gameNickname, caption: { en: 'Choose your name before you begin', mk: 'Избери име пред да започнеш' } },
];

export const galleryCopy: Localized<GalleryCopy> = {
  mk: {
    title: 'Галерија',
    hint: 'Скролај или повлечи. Кликни на слика за да ја зголемиш.',
    staticHint: 'Избери слика за да ја зголемиш. Прелистај ги сите шест слики.',
    shot: 'Слика од играта',
    open: 'Зголеми',
    prev: 'Претходна слика',
    next: 'Следна слика',
  },
  en: {
    title: 'Gallery',
    hint: 'Scroll or drag. Click a screen to see it full size.',
    staticHint: 'Select a screenshot to enlarge it. Browse all six screens.',
    shot: 'Screenshot from the game',
    open: 'Enlarge',
    prev: 'Previous screenshot',
    next: 'Next screenshot',
  },
};
