import { onCleanup } from './lifecycle';

const GA_ID = 'G-ZQ981XQYYV';
const STORAGE_KEY = 'sz-analytics-consent';
type Consent = 'accepted' | 'declined' | null;

type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  'ga-disable-G-ZQ981XQYYV'?: boolean;
};

const analytics = window as AnalyticsWindow;
let scriptRequested = false;
let analyticsActive = false;

function readConsent(): Consent {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'accepted' || value === 'declined' ? value : null;
  } catch {
    return null;
  }
}

function removeAnalyticsCookies(): void {
  try {
    const names = document.cookie.split(';').map((cookie) => cookie.trim().split('=')[0]);
    const hostParts = location.hostname.split('.');
    const domains = [''];
    for (let i = 0; i < hostParts.length; i++) {
      const domain = hostParts.slice(i).join('.');
      domains.push(`; Domain=${domain}`, `; Domain=.${domain}`);
    }
    const paths = new Set(['/']);
    const parts = location.pathname.split('/').filter(Boolean);
    for (let i = 1; i <= parts.length; i++) {
      const path = `/${parts.slice(0, i).join('/')}`;
      paths.add(path);
      paths.add(`${path}/`);
    }
    for (const name of names) {
      if (!/^(_ga(?:_|$)|_gid$|_gat(?:_|$))/.test(name)) continue;
      for (const path of paths) {
        for (const domain of domains) {
          document.cookie = `${name}=; Max-Age=0; Path=${path}${domain}; SameSite=Lax`;
        }
      }
    }
  } catch {
    // Cookie access may be blocked. The disable flag still stops this property's collection.
  }
}

function disableAnalytics(removeCookies = true): void {
  analytics['ga-disable-G-ZQ981XQYYV'] = true;
  analyticsActive = false;
  // Do not send a consent-mode update: denied updates can themselves produce Google pings.
  // Clear commands waiting for an accepted-but-still-loading script before it can run them.
  if (analytics.dataLayer) analytics.dataLayer.length = 0;
  if (removeCookies) removeAnalyticsCookies();
}

function enableAnalytics(): void {
  if (analyticsActive) return;
  analyticsActive = true;
  analytics['ga-disable-G-ZQ981XQYYV'] = false;
  analytics.dataLayer ??= [];
  analytics.gtag ??= function (..._args: unknown[]) {
    analytics.dataLayer!.push(arguments);
  };
  analytics.gtag('consent', 'default', {
    analytics_storage: 'granted',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
  analytics.gtag('js', new Date());
  analytics.gtag('config', GA_ID, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    cookie_domain: 'none',
    cookie_path: '/',
  });
  if (scriptRequested) return;
  scriptRequested = true;
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.append(script);
}

/** Non-modal, in-flow preferences: no focus trap, scroll lock or automatic focus on arrival. */
export function initPrivacyConsent(root: HTMLElement): () => void {
  const details = root.querySelector<HTMLDetailsElement>('[data-privacy-panel]')!;
  const summary = root.querySelector<HTMLElement>('[data-privacy-summary]')!;
  const opener = root.querySelector<HTMLAnchorElement>('[data-privacy-open]')!;
  const actions = root.querySelector<HTMLElement>('[data-privacy-actions]')!;
  const status = root.querySelector<HTMLElement>('[data-privacy-status]')!;
  const enabled = root.dataset.analyticsEnabled === 'true';
  const controller = new AbortController();
  const options = { signal: controller.signal };
  let consent = readConsent();
  let saved = true;

  const render = () => {
    if (enabled && consent === 'accepted') enableAnalytics();
    else disableAnalytics();
    const messages = [];
    if (!enabled) messages.push(root.dataset.inactive);
    if (enabled && consent === 'accepted') messages.push(root.dataset.accepted);
    else if (consent === 'declined') messages.push(root.dataset.declined);
    if (!saved) messages.push(root.dataset.unavailable);
    status.textContent = messages.filter(Boolean).join(' ');
    opener.setAttribute('aria-expanded', String(details.open));
  };

  const choose = (choice: Exclude<Consent, null>) => {
    consent = choice;
    try {
      localStorage.setItem(STORAGE_KEY, choice);
      saved = true;
    } catch {
      saved = false;
      // A full store may reject writes but still allow deletion of a previous grant.
      if (choice === 'declined') {
        try { localStorage.removeItem(STORAGE_KEY); } catch {}
      }
    }
    // Move focus out of the disclosure before hiding its focused button.
    opener.focus({ preventScroll: true });
    details.open = false;
    render();
  };

  opener.addEventListener('click', (event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    details.open = true;
    render();
    summary.focus({ preventScroll: true });
    details.scrollIntoView({ block: 'start', behavior: 'instant' });
  }, options);
  details.addEventListener('toggle', () => {
    opener.setAttribute('aria-expanded', String(details.open));
  }, options);
  root.querySelector('[data-privacy-accept]')!.addEventListener('click', () => choose('accepted'), options);
  root.querySelector('[data-privacy-decline]')!.addEventListener('click', () => choose('declined'), options);
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    consent = event.newValue === 'accepted' || event.newValue === 'declined' ? event.newValue : null;
    saved = true;
    render();
  }, options);
  window.addEventListener('pageshow', (event) => {
    if (!event.persisted) return;
    if (saved) consent = readConsent();
    render();
  }, options);

  const cleanup = () => {
    controller.abort();
    disableAnalytics(false);
    unregister();
  };
  const unregister = onCleanup(cleanup);

  root.dataset.enhanced = '';
  details.open = consent === null;
  actions.hidden = false;
  opener.hidden = false;
  render();
  return cleanup;
}
