import React from 'react';
import { motion } from 'framer-motion';
import BigButton from './BigButton';

/**
 * EmptyState: Friendly SVG empty illustration with single clear primary action.
 */
export default function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon: Icon
}) {
  return (
    <div className="w-full flex flex-col items-center justify-center p-8 text-center bg-white/70 rounded-3xl border-2 border-dashed border-slate-300 my-4">
      <div className="w-20 h-20 rounded-full bg-emerald-50 text-[#1B6B4A] flex items-center justify-center mb-4">
        {Icon ? <Icon className="w-10 h-10 stroke-[2]" /> : (
          <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
        )}
      </div>

      <h4 className="font-extrabold text-xl text-slate-800 mb-1">
        {title}
      </h4>

      {description && (
        <p className="text-sm font-medium text-slate-500 max-w-xs mb-6">
          {description}
        </p>
      )}

      {actionLabel && onAction && (
        <div className="w-full max-w-xs">
          <BigButton onClick={onAction}>
            {actionLabel}
          </BigButton>
        </div>
      )}
    </div>
  );
}

