import React from 'react';
import { motion } from 'framer-motion';
import { Award } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * CreditGauge: Clean, high-contrast 0-100 visual score gauge with transparent breakdown.
 */
export default function CreditGauge({ scoreData }) {
  const { t } = useTranslation();

  const totalScore = scoreData?.totalScore || 78;
  const band = scoreData?.band || 'Good';
  const bandColor = scoreData?.bandColor || '#165A3E';
  const breakdown = scoreData?.breakdown || {};

  const getBandText = () => {
    switch (band) {
      case 'Excellent': return t('score.band_excellent');
      case 'Good': return t('score.band_good');
      case 'Fair': return t('score.band_fair');
      case 'Weak': return t('score.band_weak');
      default: return band;
    }
  };

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (totalScore / 100) * circumference;

  return (
    <div className="w-full bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col items-center">
      <div className="flex items-center gap-1.5 mb-2">
        <Award className="w-5 h-5 text-[#E8892B]" />
        <h3 className="font-extrabold text-lg text-slate-800">
          {t('score.title')}
        </h3>
      </div>

      {/* Circular Animated SVG Gauge */}
      <div className="relative w-36 h-36 flex items-center justify-center my-1">
        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 140 140">
          <circle
            cx="70"
            cy="70"
            r={radius}
            stroke="#E2E8F0"
            strokeWidth="11"
            fill="transparent"
          />
          <motion.circle
            cx="70"
            cy="70"
            r={radius}
            stroke={bandColor}
            strokeWidth="11"
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.0, ease: 'easeOut' }}
            strokeLinecap="round"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span
            className="text-3xl sm:text-4xl font-black tracking-tight"
            style={{ color: bandColor }}
          >
            {totalScore}
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            / 100
          </span>
        </div>
      </div>

      {/* Band Badge */}
      <div
        className="px-3 py-1 rounded-full text-white font-extrabold text-xs shadow-2xs mt-1 mb-4"
        style={{ backgroundColor: bandColor }}
      >
        {getBandText()}
      </div>

      {/* 6 Transparent Criteria Breakdown */}
      <div className="w-full space-y-2 pt-3 border-t border-slate-100">
        {Object.entries(breakdown).map(([key, item]) => {
          const ratio = item.score / item.max;
          return (
            <div key={key} className="w-full">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-1">
                <span>{t(item.labelKey)}</span>
                <span className="font-extrabold text-slate-900">{item.score} / {item.max}</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${ratio * 100}%`,
                    backgroundColor: ratio >= 0.8 ? '#165A3E' : ratio >= 0.5 ? '#E8892B' : '#EF4444'
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
