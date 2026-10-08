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
  /** Prefixed to each caption for the screenshot's alt text. */
  shot: string;
  /** Accessible name of a frame's button, before its caption. */
  open: string;
  prev: string;
  next: string;
}

export const gallery: GalleryItem[] = [
  { id: 'main-menu', image: mainMenu, caption: { en: 'Main Menu', mk: 'Главно мени' } },
  { id: 'settings', image: settings, caption: { en: 'Settings', mk: 'Подесувања' } },
  { id: 'nickname', image: gameNickname, caption: { en: 'Nickname', mk: 'Прекар' } },
  { id: 'day-1-school', image: gameDay1, caption: { en: 'Day 1 — School', mk: 'Ден 1 — Училиште' } },
  { id: 'tasks', image: tasks, caption: { en: 'Tasks', mk: 'Задачи' } },
  { id: 'secretary', image: gameSecretary, caption: { en: 'Secretary', mk: 'Секретарка' } },
];

export const galleryCopy: Localized<GalleryCopy> = {
  mk: {
    title: 'Галерија',
    hint: 'Скролај или повлечи. Кликни на слика за да ја зголемиш.',
    shot: 'Слика од играта',
    open: 'Зголеми',
    prev: 'Претходна слика',
    next: 'Следна слика',
  },
  en: {
    title: 'Gallery',
    hint: 'Scroll or drag. Click a screen to see it full size.',
    shot: 'Screenshot from the game',
    open: 'Enlarge',
    prev: 'Previous screenshot',
    next: 'Next screenshot',
  },
};
