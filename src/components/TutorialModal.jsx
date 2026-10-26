import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Volume2, ShieldCheck, Landmark, ChevronRight, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { speak, stopSpeaking, triggerHaptic } from '../lib/voice';
import BigButton from './BigButton';

/**
 * TutorialModal: 4 swipeable/clickable cards with icons and voice narration, skippable, shown once.
 */
export default function TutorialModal({ isOpen, onClose }) {
  const { t, i18n } = useTranslation();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 0,
      titleKey: 'tutorial.card1_title',
      descKey: 'tutorial.card1_desc',
      icon: Users,
      color: 'bg-emerald-600',
      spoken: 'सखीनिधि में आपका स्वागत है। यह महिला स्वयं सहायता समूह का डिजिटल खाता है, जो बिना इंटरनेट के भी सुरक्षित चलता है।'
    },
    {
      id: 1,
      titleKey: 'tutorial.card2_title',
      descKey: 'tutorial.card2_desc',
      icon: Volume2,
      color: 'bg-[#E8892B]',
      spoken: 'बोलकर चलाएं। स्पीकर दबाकर हर हिसाब सुनें। आप बोलकर भी बचत और ऋण की राशि दर्ज कर सकती हैं।'
    },
    {
      id: 2,
      titleKey: 'tutorial.card3_title',
      descKey: 'tutorial.card3_desc',
      icon: ShieldCheck,
      color: 'bg-teal-700',
      spoken: 'पारदर्शी साप्ताहिक बैठक। उपस्थिति, बचत और ऋण की तिहरी पुष्टि होगी - हरा टिक, आवाज और कंपन के साथ।'
    },
    {
      id: 3,
      titleKey: 'tutorial.card4_title',
      descKey: 'tutorial.card4_desc',
      icon: Landmark,
      color: 'bg-blue-600',
      spoken: 'बैंक लोन में आसानी। समूह का मजबूत क्रेडिट स्कोर बनेगा, जिससे बैंक से आसानी से बड़ा लोन मिल सकेगा।'
    }
  ];

  useEffect(() => {
    if (isOpen) {
      speak(slides[currentSlide].spoken, {
        lang: i18n.language === 'en' ? 'en-IN' : 'hi-IN'
      });
    }
    return () => stopSpeaking();
  }, [isOpen, currentSlide]);

  if (!isOpen) return null;

  const current = slides[currentSlide];
  const Icon = current.icon;

  const handleNext = () => {
    triggerHaptic('tap');
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    stopSpeaking();
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('sakhinidhi_tutorial_seen', 'true');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center overflow-hidden">
        {/* Skip button top right */}
        <button
          type="button"
          onClick={handleComplete}
          className="absolute top-4 right-4 text-sm font-bold text-slate-400 hover:text-slate-700 p-2 flex items-center gap-1 rounded-full"
        >
          <span>{t('tutorial.skip')}</span>
          <X className="w-4 h-4" />
        </button>

        {/* Big Icon Circle */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            className={`w-28 h-28 rounded-full ${current.color} text-white flex items-center justify-center shadow-lg my-6`}
          >
            <Icon className="w-14 h-14 stroke-[2.3]" />
          </motion.div>
        </AnimatePresence>

        {/* Text Content */}
        <h3 className="font-black text-2xl text-slate-800 mb-2 leading-tight">
          {t(current.titleKey)}
        </h3>
        <p className="text-base font-semibold text-slate-600 mb-6 max-w-xs">
          {t(current.descKey)}
        </p>

        {/* Voice replay button */}
        <button
          type="button"
          onClick={() => speak(current.spoken)}
          className="flex items-center gap-2 text-xs font-bold text-[#1B6B4A] bg-[#1B6B4A]/10 px-3 py-1.5 rounded-full mb-6"
        >
          <Volume2 className="w-4 h-4" />
          <span>दोबारा सुनें (Listen again)</span>
        </button>

        {/* Progress Dots */}
        <div className="flex gap-2 mb-6">
          {slides.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setCurrentSlide(idx)}
              className={`h-2.5 rounded-full transition-all ${
                currentSlide === idx ? 'w-8 bg-[#1B6B4A]' : 'w-2.5 bg-slate-200'
              }`}
            />
          ))}
        </div>

        {/* Primary Action Button */}
        <BigButton onClick={handleNext} icon={ChevronRight}>
          {currentSlide === slides.length - 1 ? t('tutorial.get_started') : t('common.next')}
        </BigButton>
      </div>
    </div>
  );
}

