import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, XCircle, Volume2 } from 'lucide-react';
import { speak, triggerHaptic, playChime } from '../lib/voice';

/**
 * TripleConfirmationModal:
 * 1. Animated green tick (or red cross)
 * 2. Instant Web Audio cash chime + Spoken read-back ("Sita Hansda, savings 100 rupees")
 * 3. Haptic vibration feedback
 */
export default function TripleConfirmationModal({
  isOpen,
  type = 'success', // 'success' | 'error'
  title = '',
  spokenMessage = '',
  details = '',
  amount = null,
  onClose,
  duration = 2600
}) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        if (onClose) onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  const isSuccess = type === 'success';

  const handleReplay = (e) => {
    e.stopPropagation();
    playChime(isSuccess ? 'cash' : 'error');
    triggerHaptic('tap');
    if (spokenMessage) {
      speak(spokenMessage);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center ${
            isSuccess ? 'bg-white border-4 border-emerald-500' : 'bg-white border-4 border-red-500'
          }`}
        >
          {/* Animated Circle Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 10, stiffness: 200 }}
            className={`w-24 h-24 rounded-full flex items-center justify-center mb-4 shadow-lg ${
              isSuccess ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {isSuccess ? (
              <Check className="w-14 h-14 stroke-[3.5]" />
            ) : (
              <XCircle className="w-14 h-14 stroke-[2.5]" />
            )}
          </motion.div>

          <h3 className={`font-black text-2xl mb-1 ${isSuccess ? 'text-emerald-900' : 'text-red-900'}`}>
            {title}
          </h3>

          {amount !== null && (
            <div className="text-3xl font-black text-slate-800 mb-2">
              ₹{amount}
            </div>
          )}

          {details && (
            <p className="text-base font-semibold text-slate-600 mb-4">
              {details}
            </p>
          )}

          <button
            type="button"
            onClick={handleReplay}
            className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100/90 hover:bg-emerald-200 px-3.5 py-1.5 rounded-full transition-all active:scale-95 shadow-2xs cursor-pointer"
          >
            <Volume2 className="w-4 h-4 text-emerald-700 animate-pulse" />
            <span>पुष्टि दोबारा सुनें (Tap to Replay Sound)</span>
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
