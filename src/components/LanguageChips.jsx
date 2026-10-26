import React from 'react';
import { useTranslation } from 'react-i18next';
import { changeAppLanguage } from '../i18n/i18n';
import { triggerHaptic } from '../lib/voice';

const LANGUAGES = [
  { code: 'hi', label: 'हिन्दी', fontClass: 'lang-hi' },
  { code: 'sat', label: 'ᱥᱟᱱᱛᱟᱲᱤ', fontClass: 'lang-sat' },
  { code: 'ho', label: 'ᱦᱳ (Ho)', fontClass: 'lang-ho' },
  { code: 'mun', label: 'ᱢᱩᱱᱰᱟᱨᱤ', fontClass: 'lang-mun' },
  { code: 'en', label: 'EN', fontClass: 'lang-en' }
];

/**
 * LanguageChips: Persistent language selector in header chips. Instant switch without reload.
 */
export default function LanguageChips() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'hi';

  const handleSelect = (code) => {
    triggerHaptic('tap');
    changeAppLanguage(code);
  };

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
      {LANGUAGES.map((lang) => {
        const isActive = currentLang === lang.code;
        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => handleSelect(lang.code)}
            className={`min-h-[36px] px-2.5 py-1 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap select-none touch-manipulation ${lang.fontClass} ${
              isActive
                ? 'bg-[#E8892B] text-white shadow-sm ring-2 ring-white/40'
                : 'bg-white/20 text-[#FFF9F0] hover:bg-white/30'
            }`}
          >
            {lang.label}
          </button>
        );
      })}
    </div>
  );
}

