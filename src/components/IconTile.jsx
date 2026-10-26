import React from 'react';
import { motion } from 'framer-motion';
import { triggerHaptic } from '../lib/voice';

/**
 * IconTile: Visually rich 3D tactile tile with dual-tone gradients and smooth micro-interactions.
 */
export default function IconTile({
  title,
  subtitle,
  icon: Icon,
  badge,
  badgeColor = 'bg-[#1B6B4A]',
  color = 'forest', // 'forest' | 'turmeric' | 'money-in' | 'money-out' | 'blue'
  onClick,
  className = ''
}) {
  const getStyles = () => {
    switch (color) {
      case 'forest':
        return {
          cardBg: 'bg-gradient-to-br from-white via-emerald-50/40 to-emerald-100/30',
          border: 'border-emerald-600/25 hover:border-[#1B6B4A]',
          iconContainer: 'bg-[#1B6B4A] text-white shadow-md shadow-emerald-900/15',
          titleColor: 'text-[#0F4C35]',
          shadow: 'shadow-[0_8px_25px_-5px_rgba(27,107,74,0.12)]'
        };
      case 'turmeric':
        return {
          cardBg: 'bg-gradient-to-br from-white via-amber-50/50 to-orange-100/30',
          border: 'border-amber-500/30 hover:border-[#E8892B]',
          iconContainer: 'bg-gradient-to-br from-[#E8892B] to-[#d97706] text-white shadow-md shadow-amber-900/15',
          titleColor: 'text-[#92400e]',
          shadow: 'shadow-[0_8px_25px_-5px_rgba(232,137,43,0.15)]'
        };
      case 'money-out':
        return {
          cardBg: 'bg-gradient-to-br from-white via-rose-50/50 to-red-100/30',
          border: 'border-rose-400/30 hover:border-red-500',
          iconContainer: 'bg-gradient-to-br from-[#D94E34] to-[#b91c1c] text-white shadow-md shadow-red-900/15',
          titleColor: 'text-[#991b1b]',
          shadow: 'shadow-[0_8px_25px_-5px_rgba(217,78,52,0.12)]'
        };
      default:
        return {
          cardBg: 'bg-gradient-to-br from-white via-blue-50/50 to-indigo-100/30',
          border: 'border-blue-400/30 hover:border-blue-600',
          iconContainer: 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md shadow-blue-900/15',
          titleColor: 'text-blue-950',
          shadow: 'shadow-[0_8px_25px_-5px_rgba(37,99,235,0.12)]'
        };
    }
  };

  const scheme = getStyles();

  const handleClick = (e) => {
    triggerHaptic('tap');
    if (onClick) onClick(e);
  };

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.95 }}
      whileHover={{ y: -3 }}
      onClick={handleClick}
      className={`relative w-full p-5 rounded-3xl border-2 text-left transition-all ${scheme.cardBg} ${scheme.border} ${scheme.shadow} focus:outline-none focus:ring-4 focus:ring-[#E8892B]/40 select-none touch-manipulation min-h-[135px] flex flex-col justify-between overflow-hidden group ${className}`}
    >
      {/* Background ambient accent circle */}
      <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-full bg-white/40 pointer-events-none" />

      {/* Top row: Icon + optional badge */}
      <div className="flex items-center justify-between w-full mb-3 relative z-10">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${scheme.iconContainer}`}>
          {Icon && <Icon className="w-8 h-8 stroke-[2.3]" />}
        </div>

        {badge && (
          <span className={`text-[11px] font-black px-3 py-1 rounded-full text-white tracking-wide uppercase shadow-2xs ${badgeColor}`}>
            {badge}
          </span>
        )}
      </div>

      {/* Bottom text */}
      <div className="relative z-10">
        <h3 className={`font-black text-xl leading-tight mb-1 tracking-tight ${scheme.titleColor}`}>
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs sm:text-sm font-bold text-slate-600 line-clamp-1">
            {subtitle}
          </p>
        )}
      </div>
    </motion.button>
  );
}
