import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './en.json';
import hi from './hi.json';
import sat from './sat.json';
import ho from './ho.json';
import mun from './mun.json';

const savedLang = typeof localStorage !== 'undefined' ? localStorage.getItem('sakhinidhi_lang') : null;

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      sat: { translation: sat },
      ho: { translation: ho },
      mun: { translation: mun }
    },
    lng: savedLang || 'hi',
    fallbackLng: ['hi', 'en'],
    interpolation: {
      escapeValue: false
    }
  });

export function changeAppLanguage(lang) {
  i18n.changeLanguage(lang);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('sakhinidhi_lang', lang);
  }
  // Apply font class to body
  if (typeof document !== 'undefined') {
    document.body.classList.remove('lang-sat', 'lang-hi', 'lang-ho', 'lang-mun', 'lang-en');
    document.body.classList.add(`lang-${lang}`);
  }
}

// Initial setup of body font class
if (typeof document !== 'undefined') {
  document.body.classList.add(`lang-${savedLang || 'hi'}`);
}

export default i18n;

