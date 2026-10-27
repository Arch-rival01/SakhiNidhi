import React from 'react';
import { motion } from 'framer-motion';
import { Check, X, ShieldAlert } from 'lucide-react';
import { triggerHaptic } from '../lib/voice';

/**
 * MemberAvatar: Fully responsive, tactile card with adaptive media queries and status badges.
 */
export default function MemberAvatar({
  name = '',
  phone = '',
  role = 'member',
  avatarColor = '#165A3E',
  selected = false,
  status = null, // 'present' | 'absent' | 'overdue' | null
  savingsDone = false,
  amountDisplay = null,
  onClick
}) {
  const getInitials = (n) => {
    if (!n) return '?';
    const parts = n.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return n.substring(0, 2).toUpperCase();
  };

  const handleClick = () => {
    triggerHaptic('tap');
    if (onClick) onClick();
  };

  const isPresent = status === 'present';
  const isAbsent = status === 'absent';
  const isOverdue = status === 'overdue';
  const hasAmount = amountDisplay !== null && Number(amountDisplay) > 0;

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      className={`relative w-full flex flex-col items-center justify-between p-2 sm:p-3 rounded-2xl transition-all select-none touch-manipulation focus:outline-none min-h-[110px] sm:min-h-[120px] ${
        selected
          ? 'bg-emerald-50 ring-2 ring-[#165A3E] shadow-sm border border-[#165A3E]'
          : hasAmount
          ? 'bg-emerald-50/70 border-2 border-emerald-500 shadow-2xs hover:bg-emerald-50'
          : isPresent
          ? 'bg-white hover:bg-emerald-50/40 border-2 border-emerald-400 shadow-2xs'
          : isAbsent
          ? 'bg-rose-50/40 hover:bg-rose-50/70 border border-rose-300 opacity-60'
          : 'bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs'
      }`}
    >
      {/* Top Status Corner Badges */}
      {isPresent && !hasAmount && (
        <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
          <Check className="w-3.5 h-3.5 stroke-[3]" />
        </span>
      )}
      {hasAmount && (
        <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center shadow-xs" title="Savings Recorded">
          <Check className="w-3.5 h-3.5 stroke-[3]" />
        </span>
      )}
      {isAbsent && (
        <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-xs">
          <X className="w-3.5 h-3.5 stroke-[3]" />
        </span>
      )}
      {isOverdue && (
        <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs">
          <ShieldAlert className="w-3 h-3" />
        </span>
      )}

      {/* Main Avatar Bubble */}
      <div className="flex flex-col items-center w-full">
        <div
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-black text-white text-sm sm:text-base shadow-xs mb-1 border-2 border-white flex-shrink-0"
          style={{ backgroundColor: avatarColor }}
        >
          {getInitials(name)}
        </div>

        {/* Member Name */}
        <span className="font-extrabold text-slate-800 text-[12px] sm:text-sm leading-tight text-center w-full px-0.5 truncate">
          {name}
        </span>

        {/* Role Pill */}
        {role === 'leader' && (
          <span className="text-[9px] font-black text-[#165A3E] bg-emerald-100/90 border border-emerald-200 px-1.5 py-0.2 rounded-md mt-0.5 uppercase tracking-wide">
            Leader
          </span>
        )}
        {role === 'treasurer' && (
          <span className="text-[9px] font-black text-[#E8892B] bg-amber-100/90 border border-amber-200 px-1.5 py-0.2 rounded-md mt-0.5 uppercase tracking-wide">
            Sakhi
          </span>
        )}
      </div>

      {/* Amount Pill */}
      {amountDisplay !== null && (
        <div className="w-full mt-1.5 flex items-center justify-center">
          <span className="font-black text-xs sm:text-sm text-emerald-900 bg-emerald-100/90 border border-emerald-300/80 px-2 py-0.5 rounded-full shadow-2xs truncate max-w-full">
            ₹{amountDisplay}
          </span>
        </div>
      )}
    </motion.button>
  );
}
