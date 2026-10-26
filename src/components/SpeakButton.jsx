import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { speak, stopSpeaking, triggerHaptic } from '../lib/voice';
import { useTranslation } from 'react-i18next';

export default function SpeakButton({ text, ariaLabel = 'Read screen aloud', className = '' }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const { i18n } = useTranslation();

  const handleToggle = () => {
    triggerHaptic('tap');
    if (isPlaying) {
      stopSpeaking();
      setIsPlaying(false);
      return;
    }

    if (!text) return;

    setIsPlaying(true);
    speak(text, {
      lang: i18n.language === 'en' ? 'en-IN' : 'hi-IN',
      onEnd: () => setIsPlaying(false)
    });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={`h-8 w-8 rounded-full flex items-center justify-center transition-all select-none ${
        isPlaying
          ? 'bg-[#E8892B] text-white shadow-md animate-pulse ring-2 ring-[#E8892B]/40'
          : 'bg-slate-100 hover:bg-slate-200 text-[#165A3E] border border-slate-200'
      } ${className}`}
    >
      {isPlaying ? (
        <VolumeX className="w-4 h-4 stroke-[2.2]" />
      ) : (
        <Volume2 className="w-4 h-4 stroke-[2.2]" />
      )}
    </button>
  );
}
