import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Delete, Mic, MicOff, RotateCcw, Volume2 } from 'lucide-react';
import { triggerHaptic, startVoiceRecognition, speak, playChime } from '../lib/voice';
import { useTranslation } from 'react-i18next';

/**
 * AmountKeypad: Large, tactile numeric keypad designed for rural users.
 * Supports quick chips (50, 100, 200, 500), speech recognition mic, and live currency words.
 */
export default function AmountKeypad({
  value = '',
  onChange,
  onConfirm,
  confirmLabel = 'पक्का करें (Confirm)',
  max = 100000
}) {
  const { t, i18n } = useTranslation();
  const [isListening, setIsListening] = useState(false);
  const [speechFeedback, setSpeechFeedback] = useState('');

  const numValue = parseInt(value, 10) || 0;

  const handleDigit = (digit) => {
    playChime('tap');
    triggerHaptic('tap');
    const nextStr = value === '0' ? String(digit) : `${value}${digit}`;
    if (parseInt(nextStr, 10) <= max) {
      onChange(nextStr);
    }
  };

  const handleBackspace = () => {
    playChime('tap');
    triggerHaptic('tap');
    onChange(value.slice(0, -1));
  };

  const handleClear = () => {
    playChime('tap');
    triggerHaptic('tap');
    onChange('');
    setSpeechFeedback('');
  };

  const handleQuickChip = (chipAmount) => {
    playChime('coin');
    triggerHaptic('tap');
    onChange(String(chipAmount));
    speak(`${chipAmount} रुपये`);
  };

  // Convert amount to simple words
  const getAmountInWords = (num) => {
    if (!num) return 'शून्य रुपये (Zero Rupees)';
    if (num === 50) return 'पचास रुपये (Fifty)';
    if (num === 100) return 'एक सौ रुपये (One Hundred)';
    if (num === 200) return 'दो सौ रुपये (Two Hundred)';
    if (num === 500) return 'पाँच सौ रुपये (Five Hundred)';
    if (num === 1000) return 'एक हज़ार रुपये (One Thousand)';
    if (num === 2000) return 'दो हज़ार रुपये (Two Thousand)';
    if (num === 5000) return 'पाँच हज़ार रुपये (Five Thousand)';
    return `${num} रुपये (${num} Rupees)`;
  };

  const handleSpeakCurrentAmount = () => {
    playChime('coin');
    triggerHaptic('tap');
    const msg = numValue > 0 ? `${numValue} रुपये` : 'शून्य रुपये';
    speak(msg);
  };

  const handleMicToggle = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    setIsListening(true);
    setSpeechFeedback('सुन रहे हैं... (Listening)');
    triggerHaptic('tap');

    startVoiceRecognition({
      lang: i18n.language === 'en' ? 'en-IN' : 'hi-IN',
      onResult: ({ transcript, amount }) => {
        setIsListening(false);
        if (amount) {
          onChange(String(amount));
          setSpeechFeedback(`पहचाना: ₹${amount}`);
          triggerHaptic('success');
          speak(`${amount} रुपये`);
        } else {
          setSpeechFeedback(`'${transcript}' नहीं समझा, बटन से दर्ज करें`);
          triggerHaptic('error');
        }
      },
      onError: (err) => {
        setIsListening(false);
        setSpeechFeedback('माइक शुरू नहीं हुआ, बटन का उपयोग करें');
      },
      onEnd: () => {
        setIsListening(false);
      }
    });
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'backspace'];

  return (
    <div className="w-full flex flex-col items-center">
      {/* Big Display Window */}
      <div className="w-full bg-white border-2 border-emerald-600/30 rounded-3xl p-4 shadow-sm mb-4 text-center">
        <div className="text-sm font-semibold text-slate-500 mb-1">
          दर्ज राशि (Entered Amount)
        </div>
        <div className="flex items-center justify-center gap-2 text-4xl sm:text-5xl font-black text-emerald-900 tracking-tight">
          <span className="text-3xl text-emerald-700 font-bold">₹</span>
          <span>{value || '0'}</span>
          <button
            type="button"
            onClick={handleSpeakCurrentAmount}
            className="p-2 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-all ml-1 shadow-2xs"
            title="राशि सुनें (Hear Amount)"
          >
            <Volume2 className="w-5 h-5 text-emerald-700" />
          </button>
        </div>
        <div className="text-sm font-bold text-emerald-800 mt-1 min-h-[22px]">
          {getAmountInWords(numValue)}
        </div>

        {speechFeedback && (
          <div className="text-xs font-semibold text-amber-700 bg-amber-50 rounded-lg py-1 px-2 mt-2">
            {speechFeedback}
          </div>
        )}
      </div>

      {/* Quick Cash Chips */}
      <div className="grid grid-cols-4 gap-2 w-full mb-4">
        {[50, 100, 200, 500].map((chip) => (
          <motion.button
            key={chip}
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={() => handleQuickChip(chip)}
            className={`min-h-[48px] rounded-xl font-extrabold text-lg flex items-center justify-center transition-all border ${
              numValue === chip
                ? 'bg-[#1B6B4A] text-white border-[#1B6B4A] shadow'
                : 'bg-white hover:bg-emerald-50 text-[#1B6B4A] border-emerald-200'
            }`}
          >
            +₹{chip}
          </motion.button>
        ))}
      </div>

      {/* Numeric Keypad Grid */}
      <div className="grid grid-cols-3 gap-3 w-full mb-4">
        {keys.map((k) => {
          if (k === 'clear') {
            return (
              <motion.button
                key="clear"
                type="button"
                whileTap={{ scale: 0.93 }}
                onClick={handleClear}
                className="min-h-[62px] rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-base flex flex-col items-center justify-center border border-slate-200 shadow-sm"
              >
                <RotateCcw className="w-5 h-5 mb-0.5" />
                <span>Clear</span>
              </motion.button>
            );
          }

          if (k === 'backspace') {
            return (
              <motion.button
                key="backspace"
                type="button"
                whileTap={{ scale: 0.93 }}
                onClick={handleBackspace}
                className="min-h-[62px] rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-base flex flex-col items-center justify-center border border-amber-200 shadow-sm"
              >
                <Delete className="w-6 h-6" />
                <span>हटाएं</span>
              </motion.button>
            );
          }

          return (
            <motion.button
              key={k}
              type="button"
              whileTap={{ scale: 0.92 }}
              onClick={() => handleDigit(k)}
              className="min-h-[64px] rounded-2xl bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 font-black text-2xl flex items-center justify-center border-2 border-slate-200 shadow-sm select-none touch-manipulation"
            >
              {k}
            </motion.button>
          );
        })}
      </div>

      {/* Voice Mic Button */}
      <div className="w-full flex gap-3">
        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={handleMicToggle}
          className={`min-h-[58px] px-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 border-2 transition-all ${
            isListening
              ? 'bg-red-500 text-white border-red-600 animate-pulse'
              : 'bg-white text-slate-700 border-slate-300 hover:border-[#1B6B4A]'
          }`}
        >
          {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6 text-[#1B6B4A]" />}
          <span className="hidden sm:inline">{isListening ? 'रुकें' : 'बोलकर बताएं'}</span>
        </motion.button>

        {onConfirm && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            disabled={numValue <= 0}
            onClick={() => {
              triggerHaptic('success');
              onConfirm(numValue);
            }}
            className="flex-1 min-h-[58px] rounded-2xl bg-[#1B6B4A] hover:bg-[#155339] text-[#FFF9F0] font-bold text-xl flex items-center justify-center gap-2 shadow-md border-b-4 border-[#124933] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{confirmLabel}</span>
          </motion.button>
        )}
      </div>
    </div>
  );
}

