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

export const galleryTitle: Localized<string> = {
  en: 'Gallery',
  mk: 'Галерија',
};

export const gallery: GalleryItem[] = [
  { id: 'main-menu', image: mainMenu, caption: { en: 'Main Menu', mk: 'Главно мени' } },
  { id: 'settings', image: settings, caption: { en: 'Settings', mk: 'Подесувања' } },
  { id: 'nickname', image: gameNickname, caption: { en: 'Nickname', mk: 'Прекар' } },
  { id: 'day-1-school', image: gameDay1, caption: { en: 'Day 1 — School', mk: 'Ден 1 — Училиште' } },
  { id: 'tasks', image: tasks, caption: { en: 'Tasks', mk: 'Задачи' } },
  { id: 'secretary', image: gameSecretary, caption: { en: 'Secretary', mk: 'Секретарка' } },
];
