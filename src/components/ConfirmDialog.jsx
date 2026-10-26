import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, AlertTriangle, Volume2 } from 'lucide-react';
import { triggerHaptic, speak } from '../lib/voice';

/**
 * ConfirmDialog: Big YES / NO icon dialog for low-literacy users.
 */
export default function ConfirmDialog({
  isOpen,
  title,
  description,
  voicePrompt,
  confirmText = 'हाँ (Yes)',
  cancelText = 'नहीं (No)',
  onConfirm,
  onCancel,
  variant = 'warning'
}) {
  useEffect(() => {
    if (isOpen && voicePrompt) {
      speak(voicePrompt);
    }
  }, [isOpen, voicePrompt]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    triggerHaptic('success');
    onConfirm();
  };

  const handleCancel = () => {
    triggerHaptic('tap');
    onCancel();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border-2 border-slate-100 flex flex-col items-center text-center"
        >
          {/* Top Icon */}
          <div className="w-20 h-20 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
            <AlertTriangle className="w-10 h-10" />
          </div>

          <h3 className="font-black text-2xl text-slate-800 mb-2 leading-snug">
            {title}
          </h3>

          {description && (
            <p className="text-base text-slate-600 mb-6 font-medium">
              {description}
            </p>
          )}

          {voicePrompt && (
            <button
              type="button"
              onClick={() => speak(voicePrompt)}
              className="mb-6 flex items-center gap-2 text-sm font-bold text-[#1B6B4A] bg-[#1B6B4A]/10 px-3 py-1.5 rounded-full"
            >
              <Volume2 className="w-4 h-4" />
              <span>आवाज में सुनें</span>
            </button>
          )}

          {/* Big YES / NO Grid */}
          <div className="grid grid-cols-2 gap-4 w-full">
            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={handleCancel}
              className="min-h-[64px] rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-lg flex flex-col items-center justify-center gap-1 border-2 border-slate-200"
            >
              <X className="w-6 h-6 text-slate-500" strokeWidth={3} />
              <span>{cancelText}</span>
            </motion.button>

            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={handleConfirm}
              className="min-h-[64px] rounded-2xl bg-[#1B6B4A] hover:bg-[#155339] text-[#FFF9F0] font-bold text-lg flex flex-col items-center justify-center gap-1 border-b-4 border-[#124933] shadow-md"
            >
              <Check className="w-6 h-6" strokeWidth={3} />
              <span>{confirmText}</span>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

