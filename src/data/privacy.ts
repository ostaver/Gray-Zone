import type { Localized } from '../i18n/config';

export interface PrivacyCopy {
  title: string;
  intro: string;
  preferences: string;
  disclosure: string;
  analytics: string;
  storage: string;
  google: string;
  downloads: string;
  googlePolicy: string;
  githubPolicy: string;
  accept: string;
  decline: string;
  accepted: string;
  declined: string;
  unavailable: string;
  inactive: string;
  noScript: string;
}

export const privacyCopy: Localized<PrivacyCopy> = {
  en: {
    title: 'Your privacy',
    intro: 'Optional Google Analytics helps us understand how this site is used. It stays off unless you accept. You can decline and use the whole site, or change your choice at any time.',
    preferences: 'Privacy preferences',
    disclosure: 'How your data is used',
    analytics: 'If you accept, Google Analytics uses cookies and receives information about your browser, device and visits to this site. Declining or withdrawing consent stops analytics collection on this site and removes its accessible Google Analytics cookies. Data already sent to Google is not deleted by withdrawing consent.',
    storage: 'We store only your analytics choice in this browser’s local storage so we can remember it between visits. The site also uses session storage to remember the light/dark appearance and whether the introduction has already played. These essential preferences do not require analytics consent. If storage is unavailable, your analytics choice lasts only for this page.',
    google: 'Google processes analytics data under its own privacy terms. We do not enable Google advertising signals or advertising personalization.',
    downloads: 'Game downloads are hosted directly on GitHub. Following a download link contacts GitHub, which processes connection information under its own privacy terms, independently of your analytics choice.',
    googlePolicy: 'Google privacy policy',
    githubPolicy: 'GitHub privacy statement',
    accept: 'Accept analytics',
    decline: 'Decline analytics',
    accepted: 'Analytics enabled. You can withdraw consent here at any time.',
    declined: 'Analytics disabled.',
    unavailable: 'Your browser could not save this choice. It applies only to this page.',
    inactive: 'Analytics never runs on this page. Your choice applies to other pages of this site.',
    noScript: 'JavaScript is disabled: no analytics is loaded, and there is no analytics choice to save.',
  },
  mk: {
    title: 'Твојата приватност',
    intro: 'Изборната аналитика на Google ни помага да разбереме како се користи оваа страница. Таа е исклучена додека не ја прифатиш. Можеш да ја одбиеш и да ја користиш целата страница, или да го промениш изборот во секое време.',
    preferences: 'Поставки за приватност',
    disclosure: 'Како се користат твоите податоци',
    analytics: 'Ако прифатиш, Google Analytics користи колачиња и добива информации за твојот прелистувач, уред и посетите на оваа страница. Одбивањето или повлекувањето на согласноста го запира собирањето аналитички податоци на оваа страница и ги отстранува нејзините достапни колачиња од Google Analytics. Повлекувањето на согласноста не ги брише податоците што веќе се испратени до Google.',
    storage: 'Во локалното складиште на овој прелистувач го зачувуваме само твојот избор за аналитика, за да го запомниме меѓу посетите. Страницата користи и сесиско складиште за да ги запомни светлиот/темниот изглед и дали воведот веќе е прикажан. За овие неопходни поставки не е потребна согласност за аналитика. Ако складиштето не е достапно, изборот за аналитика важи само за оваа страница.',
    google: 'Google ги обработува аналитичките податоци според сопствените услови за приватност. Не ги овозможуваме рекламните сигнали на Google или персонализацијата на реклами.',
    downloads: 'Преземањата на играта се хостирани директно на GitHub. Следењето врска за преземање воспоставува контакт со GitHub, кој ги обработува информациите за врската според сопствените услови за приватност, независно од твојот избор за аналитика.',
    googlePolicy: 'Политика за приватност на Google',
    githubPolicy: 'Изјава за приватност на GitHub',
    accept: 'Прифати аналитика',
    decline: 'Одбиј аналитика',
    accepted: 'Аналитиката е овозможена. Тука можеш да ја повлечеш согласноста во секое време.',
    declined: 'Аналитиката е исклучена.',
    unavailable: 'Прелистувачот не можеше да го зачува изборот. Тој важи само за оваа страница.',
    inactive: 'На оваа страница никогаш не се активира аналитика. Твојот избор важи за другите страници на оваа веб-страница.',
    noScript: 'JavaScript е исклучен: не се вчитува аналитика и нема избор за аналитика што треба да се зачува.',
  },
};
