// Consentement à la mesure d'audience (Google Analytics 4).
// Rien n'est chargé ni envoyé à Google avant un « Accepter ». Le choix est conservé 6 mois dans localStorage.
// Le lien « Gérer les cookies » (tout élément portant data-consent-open) rouvre le bandeau.
(() => {
  const GA_ID = 'G-BT1XNR3K5F';
  const KEY = 'consent';
  const MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000;
  const COOKIE_LIFETIME_S = 395 * 24 * 60 * 60; // 13 mois, durée maximale recommandée par la CNIL

  const en = document.documentElement.lang === 'en';
  const base = document.documentElement.dataset.base ?? ''; // « /preprod » en préproduction
  const text = en
    ? {
        label: 'Cookie settings',
        body: 'This site uses Google Analytics to measure its audience. Analytics cookies are only set with your consent.',
        more: 'More about cookies',
        legal: `${base}/en/privacy/#cookies`,
        accept: 'Accept',
        refuse: 'Refuse',
      }
    : {
        label: 'Gestion des cookies',
        body: "Ce site utilise Google Analytics pour mesurer son audience. Les cookies de mesure ne sont déposés qu'avec votre accord.",
        more: 'En savoir plus sur les cookies',
        legal: `${base}/confidentialite/#cookies`,
        accept: 'Accepter',
        refuse: 'Refuser',
      };

  const read = () => {
    try {
      const v = JSON.parse(localStorage.getItem(KEY));
      if (v && typeof v.analytics === 'boolean' && Date.now() - v.ts < MAX_AGE_MS) return v;
    } catch {
      // stockage indisponible ou valeur corrompue : on redemande
    }
    return null;
  };

  const write = (analytics) => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ analytics, ts: Date.now() }));
    } catch {
      // non bloquant : le bandeau réapparaîtra à la prochaine visite
    }
  };

  let loaded = false;
  const loadAnalytics = () => {
    window[`ga-disable-${GA_ID}`] = false;
    if (loaded) return;
    loaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
    // Consent Mode v2 : mesure d'audience acceptée, aucun usage publicitaire
    window.gtag('consent', 'default', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
    window.gtag('js', new Date());
    window.gtag('config', GA_ID, { cookie_expires: COOKIE_LIFETIME_S });
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(s);
  };

  const stopAnalytics = () => {
    window[`ga-disable-${GA_ID}`] = true;
    const hosts = [
      undefined,
      location.hostname,
      `.${location.hostname}`,
      `.${location.hostname.replace(/^www\./, '')}`,
    ];
    document.cookie.split(';').forEach((c) => {
      const name = c.split('=')[0].trim();
      if (name !== '_ga' && !name.startsWith('_ga_')) return;
      hosts.forEach((domain) => {
        document.cookie = `${name}=; Max-Age=0; path=/${domain ? `; domain=${domain}` : ''}`;
      });
    });
  };

  let banner;
  const close = () => {
    banner?.remove();
    banner = undefined;
  };

  const choose = (analytics) => {
    write(analytics);
    if (analytics) loadAnalytics();
    else stopAnalytics();
    close();
  };

  const open = (focus) => {
    if (banner) return;
    banner = document.createElement('div');
    banner.className = 'consent';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', text.label);
    // Construit avec l'API DOM (textContent) plutôt qu'avec innerHTML : aucun point d'injection HTML dans le site
    const more = Object.assign(document.createElement('a'), {
      href: text.legal,
      textContent: text.more,
    });
    const message = document.createElement('p');
    message.append(`${text.body} `, more);
    const actions = document.createElement('div');
    actions.className = 'consent-actions';
    for (const [choice, label] of [
      ['refuse', text.refuse],
      ['accept', text.accept],
    ]) {
      const button = Object.assign(document.createElement('button'), {
        type: 'button',
        textContent: label,
      });
      button.dataset.choice = choice;
      actions.append(button);
    }
    banner.append(message, actions);
    banner.addEventListener('click', (e) => {
      const choice = e.target.closest('button')?.dataset.choice;
      if (choice) choose(choice === 'accept');
    });
    document.body.prepend(banner); // en tête de page : atteint dès le premier Tab, sans parcourir toute la page
    if (focus) banner.querySelector('button').focus();
  };

  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-consent-open]')) open(true);
  });

  const saved = read();
  if (saved?.analytics) loadAnalytics();
  else if (!saved) open(false);
})();
