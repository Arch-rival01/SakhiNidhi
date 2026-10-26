import React from 'react';
import { motion } from 'framer-motion';
import { triggerHaptic } from '../lib/voice';

/**
 * BigButton: 50-56px tap target, accessible, tactile feedback, low-literacy friendly.
 */
export default function BigButton({
  children,
  onClick,
  icon: Icon,
  variant = 'primary', // 'primary' | 'secondary' | 'turmeric' | 'danger' | 'ghost'
  disabled = false,
  fullWidth = true,
  className = '',
  type = 'button'
}) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-[#165A3E] hover:bg-[#124933] active:bg-[#0c3324] text-white shadow-sm';
      case 'turmeric':
        return 'bg-[#E8892B] hover:bg-[#d97706] active:bg-[#b45309] text-white shadow-sm';
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-sm';
      case 'secondary':
        return 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 active:bg-slate-100 shadow-2xs';
      case 'ghost':
        return 'bg-transparent text-[#165A3E] hover:bg-[#165A3E]/10 active:bg-[#165A3E]/20';
      default:
        return 'bg-[#165A3E] text-white';
    }
  };

  const handleClick = (e) => {
    if (disabled) return;
    triggerHaptic('tap');
    if (onClick) onClick(e);
  };

  return (
    <motion.button
      type={type}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      onClick={handleClick}
      disabled={disabled}
      className={`min-h-[52px] px-5 py-3 rounded-2xl font-black text-base flex items-center justify-center gap-2.5 transition-all select-none touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed ${fullWidth ? 'w-full' : ''} ${getVariantStyles()} ${className}`}
    >
      {Icon && <Icon className="w-5 h-5 flex-shrink-0" strokeWidth={2.3} />}
      <span className="truncate">{children}</span>
    </motion.button>
  );
}
