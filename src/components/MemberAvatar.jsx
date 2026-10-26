import React from 'react';
import { motion } from 'framer-motion';
import { Check, X, ShieldAlert } from 'lucide-react';
import { triggerHaptic } from '../lib/voice';

/**
 * MemberAvatar: Clean, tactile circular avatar card with status badges.
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

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.94 }}
      onClick={handleClick}
      className={`relative flex flex-col items-center justify-center p-3 rounded-2xl transition-all select-none touch-manipulation focus:outline-none min-h-[96px] ${
        selected
          ? 'bg-emerald-50 ring-2 ring-[#165A3E] shadow-sm border border-[#165A3E]'
          : isPresent
          ? 'bg-white hover:bg-emerald-50/40 border-2 border-emerald-500 shadow-2xs'
          : isAbsent
          ? 'bg-rose-50/40 hover:bg-rose-50/70 border border-rose-300 opacity-60'
          : 'bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs'
      }`}
    >
      {/* Status Badges */}
      {isPresent && (
        <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
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

      {/* Main Circular Portrait Bubble */}
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center font-black text-white text-base shadow-xs mb-1.5 border border-white"
        style={{ backgroundColor: avatarColor }}
      >
        {getInitials(name)}
      </div>

      {/* Name and Details */}
      <span className="font-extrabold text-slate-800 text-xs sm:text-sm leading-tight text-center max-w-[95px] truncate">
        {name}
      </span>

      {role === 'leader' && (
        <span className="text-[9px] font-bold text-[#165A3E] bg-[#165A3E]/10 px-1.5 py-0.2 rounded mt-0.5 uppercase">
          Leader
        </span>
      )}
      {role === 'treasurer' && (
        <span className="text-[9px] font-bold text-[#E8892B] bg-[#E8892B]/10 px-1.5 py-0.2 rounded mt-0.5 uppercase">
          Sakhi
        </span>
      )}

      {amountDisplay !== null && (
        <span className="font-black text-emerald-800 text-xs mt-1 bg-emerald-50 px-2 py-0.5 rounded shadow-2xs">
          ₹{amountDisplay}
        </span>
      )}
    </motion.button>
  );
}
