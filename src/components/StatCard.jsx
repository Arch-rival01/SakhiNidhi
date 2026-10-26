import React from 'react';
import { motion } from 'framer-motion';
import { Volume2, Sparkles, TrendingUp } from 'lucide-react';
import { speak, triggerHaptic } from '../lib/voice';

/**
 * StatCard: Visually stunning hero card with deep forest green gradient and gold accents.
 */
export default function StatCard({
  title,
  value,
  subvalue,
  icon: Icon,
  variant = 'forest', // 'forest' | 'turmeric' | 'money-out'
  speakText,
  onClick
}) {
  const handleSpeak = (e) => {
    e.stopPropagation();
    triggerHaptic('tap');
    if (speakText) {
      speak(speakText);
    }
  };

  return (
    <motion.div
      whileTap={onClick ? { scale: 0.985 } : {}}
      onClick={onClick}
      className="relative w-full rounded-3xl p-6 shadow-xl overflow-hidden cursor-pointer select-none transition-all border-2 border-emerald-600/30 bg-gradient-to-br from-[#0F4C35] via-[#1B6B4A] to-[#124933] text-white"
    >
      {/* Decorative ambient background blur lights */}
      <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-[#E8892B]/20 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-emerald-400/10 blur-xl pointer-events-none" />

      {/* Decorative Tribal Pattern Overlay */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-5 pointer-events-none">
        <svg viewBox="0 0 100 100" fill="currentColor">
          <circle cx="50" cy="50" r="40" stroke="white" strokeWidth="4" fill="none"/>
          <path d="M50 10 L50 90 M10 50 L90 50 M22 22 L78 78 M22 78 L78 22" stroke="white" strokeWidth="2"/>
        </svg>
      </div>

      {/* Card Header */}
      <div className="flex items-center justify-between w-full mb-3 relative z-10">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#E8892B] animate-pulse" />
          <span className="text-xs sm:text-sm font-extrabold tracking-wide uppercase text-emerald-200">
            {title}
          </span>
        </div>

        {speakText && (
          <button
            type="button"
            onClick={handleSpeak}
            className="min-h-[42px] px-3 rounded-full bg-white/15 hover:bg-white/25 active:bg-white/30 text-white font-bold text-xs flex items-center gap-1.5 backdrop-blur-md border border-white/20 transition-all shadow-sm"
            title="बोलकर सुनें"
          >
            <Volume2 className="w-4 h-4 text-amber-300" />
            <span className="hidden sm:inline">सुनें</span>
          </button>
        )}
      </div>

      {/* Large Value Display */}
      <div className="flex items-baseline gap-2 relative z-10 my-1">
        <div className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white drop-shadow-sm font-sans">
          {value}
        </div>
        {Icon && <Icon className="w-7 h-7 text-amber-300 opacity-90" />}
      </div>

      {/* Subvalue pill */}
      {subvalue && (
        <div className="relative z-10 mt-3 pt-3 border-t border-emerald-500/30 flex items-center justify-between text-xs sm:text-sm font-semibold text-emerald-100">
          <span className="truncate max-w-[85%]">{subvalue}</span>
          <span className="text-amber-300 text-xs font-black uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            Safe
          </span>
        </div>
      )}
    </motion.div>
  );
}
