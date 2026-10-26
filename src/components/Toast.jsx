import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

let toastFn = null;

export function showToast(message, type = 'success') {
  if (toastFn) toastFn({ message, type, id: Date.now() });
}

export default function Toast() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    toastFn = (t) => {
      setToasts((prev) => [...prev, t]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== t.id));
      }, 3500);
    };
    return () => { toastFn = null; };
  }, []);

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className={`pointer-events-auto p-4 rounded-2xl shadow-xl flex items-center justify-between gap-3 text-white font-bold text-base ${
              t.type === 'error'
                ? 'bg-[#D94E34] border-2 border-red-700'
                : t.type === 'info'
                ? 'bg-blue-600 border-2 border-blue-700'
                : 'bg-[#1B6B4A] border-2 border-emerald-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {t.type === 'error' ? (
                <AlertCircle className="w-6 h-6 flex-shrink-0" />
              ) : t.type === 'info' ? (
                <Info className="w-6 h-6 flex-shrink-0" />
              ) : (
                <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
              )}
              <span>{t.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setToasts((prev) => prev.filter((i) => i.id !== t.id))}
              className="text-white/80 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

