import React from 'react';
import { Users, PiggyBank, HandCoins, FileCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * StepBar: Visual step progress with recognizable tribal/finance icons.
 */
export default function StepBar({
  currentStep = 1,
  totalSteps = 4,
  steps = [
    { id: 1, key: 'step_attendance', icon: Users },
    { id: 2, key: 'step_savings', icon: PiggyBank },
    { id: 3, key: 'step_loans', icon: HandCoins },
    { id: 4, key: 'step_summary', icon: FileCheck },
  ],
  onStepClick
}) {
  const { t } = useTranslation();

  return (
    <div className="w-full bg-white border border-slate-200/80 rounded-2xl p-2.5 shadow-sm mb-4">
      <div className="flex items-center justify-between relative">
        {/* Track Line */}
        <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-slate-200 -z-0" />
        <div
          className="absolute left-6 top-1/2 -translate-y-1/2 h-1 bg-[#1B6B4A] transition-all duration-300 -z-0"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((s, idx) => {
          const Icon = s.icon;
          const isActive = currentStep === s.id;
          const isCompleted = currentStep > s.id;

          return (
            <button
              key={s.id}
              type="button"
              disabled={!onStepClick || (!isCompleted && !isActive)}
              onClick={() => onStepClick && onStepClick(s.id)}
              className="relative z-10 flex flex-col items-center group focus:outline-none"
            >
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm transition-all shadow-sm ${
                  isActive
                    ? 'bg-[#1B6B4A] text-white ring-4 ring-[#1B6B4A]/25 scale-110'
                    : isCompleted
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-slate-400 border-2 border-slate-300'
                }`}
              >
                <Icon className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span
                className={`text-[11px] font-bold mt-1.5 transition-colors max-w-[64px] text-center truncate ${
                  isActive ? 'text-[#1B6B4A]' : isCompleted ? 'text-slate-700' : 'text-slate-400'
                }`}
              >
                {t(`meeting.${s.key}`)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

