import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Users, Check, ArrowRight, ShieldCheck, Plus, Trash2, Landmark, ChevronRight, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { changeAppLanguage } from '../i18n/i18n';
import BigButton from '../components/BigButton';
import { db, logAudit } from '../lib/db';
import { loadDemoData } from '../lib/demoData';
import { syncNow } from '../lib/sync';
import { showToast } from '../components/Toast';
import { triggerHaptic, speak, playChime } from '../lib/voice';

export default function Onboarding({ onComplete }) {
  const { t, i18n } = useTranslation();
  const [step, setStep] = useState(1);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);
  const [existingGroups, setExistingGroups] = useState([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    async function fetchGroups() {
      try {
        setIsLoadingGroups(true);
        // Pull groups from Supabase so groups formed on other devices show up
        await syncNow().catch(() => {});
        const local = await db.groups.toArray();
        setExistingGroups(local);
        if (local.length === 0) {
          setShowCreateForm(true);
        }
      } catch (err) {
        console.warn('Error loading groups:', err);
      } finally {
        setIsLoadingGroups(false);
      }
    }
    fetchGroups();
  }, []);

  // Form states
  const [selectedLang, setSelectedLang] = useState(i18n.language || 'hi');
  const [groupName, setGroupName] = useState('');
  const [village, setVillage] = useState('');
  const [meetingDay, setMeetingDay] = useState('Thursday');
  const [weeklySaving, setWeeklySaving] = useState(100);
  const [interestRate, setInterestRate] = useState(2);
  const [lateFine, setLateFine] = useState(10);
  const [pin, setPin] = useState('1234');

  const [members, setMembers] = useState([
    { name: 'Sita Hansda', role: 'leader', phone: '+919835123401', avatarColor: '#1B6B4A' },
    { name: 'Parvati Murmu', role: 'treasurer', phone: '+919835123402', avatarColor: '#E8892B' },
    { name: 'Malati Soren', role: 'member', phone: '+919835123403', avatarColor: '#2563EB' }
  ]);
  const [newMemberName, setNewMemberName] = useState('');

  const handleLanguagePick = (langCode) => {
    setSelectedLang(langCode);
    changeAppLanguage(langCode);
    triggerHaptic('tap');
  };

  const handleLoadDemo = async () => {
    try {
      setIsLoadingDemo(true);
      triggerHaptic('success');
      await loadDemoData();
      showToast('डेमो डेटा सफलतापूर्वक लोड हो गया! (Demo Loaded)', 'success');
      speak('सखी मंडल का 3 महीने का रिकॉर्ड लोड हो गया है।');
      setTimeout(() => {
        onComplete();
      }, 800);
    } catch (err) {
      console.error(err);
      showToast('डेमो लोड करने में त्रुटि', 'error');
    } finally {
      setIsLoadingDemo(false);
    }
  };

  const handleAddMember = () => {
    if (!newMemberName.trim()) return;
    const colors = ['#1B6B4A', '#E8892B', '#2563EB', '#7C3AED', '#DB2777', '#059669'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    setMembers([...members, {
      name: newMemberName.trim(),
      role: 'member',
      phone: '+919800000000',
      avatarColor: randomColor
    }]);
    setNewMemberName('');
    triggerHaptic('tap');
  };

  const handleRemoveMember = (idx) => {
    setMembers(members.filter((_, i) => i !== idx));
    triggerHaptic('tap');
  };

  const handlePickGroup = (grp) => {
    playChime('cash');
    triggerHaptic('success');
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('sakhinidhi_selected_group_id', String(grp.id));
    }
    showToast(`${grp.name} खोला गया`, 'success');
    speak(`${grp.name} सखी मंडल खोला गया।`);
    onComplete(grp);
  };

  const handleFinishOnboarding = async () => {
    try {
      triggerHaptic('success');
      // Save group
      const finalGroupName = groupName.trim() || 'सखी मंडल';
      const finalVillage = village.trim() || 'झारखंड';
      const groupId = await db.groups.add({
        name: finalGroupName,
        village: finalVillage,
        meetingDay,
        weeklySaving: Number(weeklySaving) || 100,
        interestRate: Number(interestRate) || 2,
        lateFine: Number(lateFine) || 10,
        maxLoanMultiple: 3,
        pin: pin || '1234',
        createdAt: new Date().toISOString(),
        synced: false
      });

      // Save members
      for (const m of members) {
        await db.members.add({
          groupId,
          name: m.name,
          role: m.role,
          phone: m.phone || '+919835123400',
          avatarColor: m.avatarColor,
          active: true,
          joinedDate: new Date().toISOString(),
          synced: false
        });
      }

      await logAudit(groupId, 'ONBOARDING_COMPLETED', 'groups', groupId, { groupName, village, membersCount: members.length });
      
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('sakhinidhi_selected_group_id', String(groupId));
      }

      // Immediately push to Supabase Cloud so all other phones receive it!
      syncNow().catch(err => console.warn('Cloud sync error on onboarding:', err));

      showToast('समूह खाता तैयार हो गया!', 'success');
      speak('समूह खाता तैयार हो गया है।');
      onComplete({ id: groupId, name: finalGroupName, village: finalVillage });
    } catch (err) {
      console.error(err);
      showToast('सहेजने में त्रुटि', 'error');
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#FFF9F0] px-4 py-8 max-w-lg mx-auto flex flex-col justify-between">
      {/* Top Bar with Demo Button */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-[#1B6B4A] text-white flex items-center justify-center font-black text-xl shadow">
              ₹
            </div>
            <h1 className="font-black text-2xl text-[#1B6B4A]">सखीनिधि</h1>
          </div>

          <button
            type="button"
            onClick={handleLoadDemo}
            disabled={isLoadingDemo}
            className="flex items-center gap-1.5 bg-[#E8892B] hover:bg-[#d4781e] text-white px-3.5 py-2 rounded-2xl font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isLoadingDemo ? 'लोडिंग...' : 'Load Demo Data'}</span>
          </button>
        </div>

        {/* If existing groups exist and user has not clicked 'Create New', show Samiti Selection */}
        {existingGroups.length > 0 && !showCreateForm ? (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div>
              <h2 className="text-2xl font-black text-slate-800 mb-1">
                सखी मंडल चुनें (Select Your Samiti)
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-slate-500">
                क्लाउड या फोन में दर्ज समूह। जिस समिति का काम करना है उसे चुनें:
              </p>
            </div>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {existingGroups.map((grp) => (
                <div
                  key={grp.id}
                  onClick={() => handlePickGroup(grp)}
                  className="p-4 rounded-2xl border-2 border-emerald-500/40 bg-white hover:border-[#165A3E] hover:bg-emerald-50/50 shadow-sm transition-all cursor-pointer flex items-center justify-between gap-3 active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-[#165A3E] text-white flex items-center justify-center font-black text-lg flex-shrink-0 shadow-xs">
                      {grp.name?.charAt(0) || 'स'}
                    </div>
                    <div className="min-w-0">
                      <div className="font-extrabold text-base text-slate-900 truncate">
                        {grp.name}
                      </div>
                      <div className="text-xs text-slate-500 font-semibold truncate flex items-center gap-2">
                        <span>गांव: {grp.village || 'झारखंड'}</span>
                        <span>•</span>
                        <span className="text-emerald-700 font-bold">बैठक: {grp.meetingDay || 'Thursday'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[#165A3E] font-bold text-xs bg-emerald-100/90 px-3 py-2 rounded-xl flex-shrink-0">
                    <span>खोलें</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <BigButton
                onClick={() => {
                  playChime('tap');
                  setShowCreateForm(true);
                  setStep(1);
                }}
                icon={Plus}
                variant="secondary"
              >
                + नया सखी मंडल / समूह बनाएं
              </BigButton>
            </div>
          </motion.div>
        ) : (
          <>
            {/* Wizard Progress Dots */}
            <div className="flex items-center justify-between mb-6">
              {existingGroups.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>मौजूदा समूह देखें</span>
                </button>
              )}
              <div className="flex items-center justify-center gap-2 mx-auto">
                {[1, 2, 3, 4].map((s) => (
                  <div
                    key={s}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      step === s ? 'w-8 bg-[#1B6B4A]' : step > s ? 'w-4 bg-emerald-600' : 'w-2.5 bg-slate-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Step 1: Language */}
            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <h2 className="text-2xl font-black text-slate-800 mb-1">
                  अपनी भाषा चुनें (Select Language)
                </h2>
                <p className="text-sm font-semibold text-slate-500 mb-6">
                  जिसमें आप ऐप चलाना और सुनना चाहती हैं।
                </p>

                <div className="space-y-3 mb-8">
                  {[
                    { code: 'hi', title: 'हिन्दी (Hindi)', desc: 'हिंदी में चलाएं और सुनें' },
                    { code: 'sat', title: 'ᱥᱟᱱᱛᱟᱲᱤ (Santhali)', desc: 'ᱚᱞ ᱪᱤᱠᱤ ᱞᱤᱯᱤ ᱛᱮ ᱪᱟᱞᱟᱣ ᱢᱮ' },
                    { code: 'ho', title: 'ᱦᱳ (Ho)', desc: 'हो भाषा रे चलाओ मे' },
                    { code: 'mun', title: 'ᱢᱩᱱᱰᱟᱨᱤ (Mundari)', desc: 'मुण्डारी भाषा रे चलाओ मे' },
                    { code: 'en', title: 'English', desc: 'Use in English language' }
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handleLanguagePick(lang.code)}
                      className={`w-full p-4 rounded-2xl border-2 text-left flex items-center justify-between transition-all ${
                        selectedLang === lang.code
                          ? 'border-[#1B6B4A] bg-[#1B6B4A]/10 ring-2 ring-[#1B6B4A]'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="font-extrabold text-lg text-slate-800">{lang.title}</div>
                        <div className="text-xs text-slate-500 font-medium">{lang.desc}</div>
                      </div>
                      {selectedLang === lang.code && (
                        <div className="w-7 h-7 rounded-full bg-[#1B6B4A] text-white flex items-center justify-center">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <BigButton onClick={() => setStep(2)} icon={ArrowRight}>
                  {t('common.next')}
                </BigButton>
              </motion.div>
            )}

        {/* Step 2: Group Details */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-2xl font-black text-slate-800 mb-1">
              समूह की जानकारी (Group Details)
            </h2>
            <p className="text-sm font-semibold text-slate-500 mb-6">
              आपके स्वयं सहायता समूह के नियम।
            </p>

            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  समूह का नाम (Group Name)
                </label>
                <input
                  type="text"
                  placeholder="उदा. जय माँ सरना सखी मंडल"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full min-h-[52px] px-4 rounded-2xl border-2 border-slate-300 font-bold text-base sm:text-lg focus:border-[#1B6B4A] bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  गाँव / ब्लॉक (Village / Block)
                </label>
                <input
                  type="text"
                  placeholder="उदा. सुंदरनगर, पूर्वी सिंहभूम"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  className="w-full min-h-[52px] px-4 rounded-2xl border-2 border-slate-300 font-bold text-base sm:text-lg focus:border-[#1B6B4A] bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    साप्ताहिक बचत (Weekly Saving)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3.5 font-bold text-slate-500">₹</span>
                    <input
                      type="number"
                      value={weeklySaving}
                      onChange={(e) => setWeeklySaving(e.target.value)}
                      className="w-full min-h-[52px] pl-8 pr-3 rounded-2xl border-2 border-slate-300 font-bold text-lg bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    मासिक ब्याज % (Monthly Int.)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={interestRate}
                      onChange={(e) => setInterestRate(e.target.value)}
                      className="w-full min-h-[52px] px-4 rounded-2xl border-2 border-slate-300 font-bold text-lg bg-white"
                    />
                    <span className="absolute right-3 top-3.5 font-bold text-slate-500">%</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    देरी जुर्माना (Late Fine)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3.5 font-bold text-slate-500">₹</span>
                    <input
                      type="number"
                      value={lateFine}
                      onChange={(e) => setLateFine(e.target.value)}
                      className="w-full min-h-[52px] pl-8 pr-3 rounded-2xl border-2 border-slate-300 font-bold text-lg bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    बैठक का दिन (Meeting Day)
                  </label>
                  <select
                    value={meetingDay}
                    onChange={(e) => setMeetingDay(e.target.value)}
                    className="w-full min-h-[52px] px-3 rounded-2xl border-2 border-slate-300 font-bold text-base bg-white"
                  >
                    <option value="Thursday">गुरुवार (Thursday)</option>
                    <option value="Friday">शुक्रवार (Friday)</option>
                    <option value="Saturday">शनिवार (Saturday)</option>
                    <option value="Sunday">रविवार (Sunday)</option>
                    <option value="Monday">सोमवार (Monday)</option>
                    <option value="Tuesday">मंगलवार (Tuesday)</option>
                    <option value="Wednesday">बुधवार (Wednesday)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <BigButton onClick={() => setStep(1)} variant="secondary" fullWidth={false} className="w-1/3">
                {t('common.back')}
              </BigButton>
              <BigButton onClick={() => setStep(3)} icon={ArrowRight} className="flex-1">
                {t('common.next')}
              </BigButton>
            </div>
          </motion.div>
        )}

        {/* Step 3: Members */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-2xl font-black text-slate-800 mb-1">
              सदस्य सूची (Add Members)
            </h2>
            <p className="text-sm font-semibold text-slate-500 mb-4">
              कुल {members.length} महिला सदस्य जुड़े हैं।
            </p>

            {/* Quick Add input */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="सदस्य का नाम लिखें..."
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddMember()}
                className="flex-1 min-h-[52px] px-4 rounded-2xl border-2 border-slate-300 font-bold text-base bg-white"
              />
              <button
                type="button"
                onClick={handleAddMember}
                className="min-h-[52px] px-4 rounded-2xl bg-[#1B6B4A] text-white font-bold flex items-center justify-center shadow"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>

            {/* List */}
            <div className="space-y-2 mb-8 max-h-[300px] overflow-y-auto pr-1">
              {members.map((m, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm"
                      style={{ backgroundColor: m.avatarColor }}
                    >
                      {m.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-base">{m.name}</div>
                      <div className="text-xs text-slate-500">{m.role === 'leader' ? 'Leader' : m.role === 'treasurer' ? 'Treasurer' : 'Member'}</div>
                    </div>
                  </div>

                  {idx > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(idx)}
                      className="p-2 text-slate-400 hover:text-red-600 rounded-full"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <BigButton onClick={() => setStep(2)} variant="secondary" fullWidth={false} className="w-1/3">
                {t('common.back')}
              </BigButton>
              <BigButton onClick={() => setStep(4)} icon={ArrowRight} className="flex-1">
                {t('common.next')}
              </BigButton>
            </div>
          </motion.div>
        )}

        {/* Step 4: 4-digit PIN */}
        {step === 4 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="text-center mb-6">
              <div className="w-20 h-20 rounded-full bg-emerald-100 text-[#1B6B4A] flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-1">
                4-अंकों का गुप्त पिन (Treasurer PIN)
              </h2>
              <p className="text-sm font-semibold text-slate-500 max-w-xs mx-auto">
                बैठक लॉक करने और खाता सुरक्षित रखने के लिए। (डिफ़ॉल्ट: 1234)
              </p>
            </div>

            <div className="flex justify-center mb-8">
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-48 h-16 text-center text-4xl tracking-widest font-black rounded-2xl border-4 border-[#1B6B4A] bg-white shadow-inner focus:outline-none"
              />
            </div>

            <div className="flex gap-3">
              <BigButton onClick={() => setStep(3)} variant="secondary" fullWidth={false} className="w-1/3">
                {t('common.back')}
              </BigButton>
              <BigButton onClick={handleFinishOnboarding} icon={Check} className="flex-1">
                खाता शुरू करें (Get Started)
              </BigButton>
            </div>
          </motion.div>
        )}
          </>
        )}
      </div>

      {/* Footer Info */}
      <div className="text-center text-xs text-slate-400 mt-6">
        SakhiNidhi • Tribe 2026 Hackathon • 100% Free & Offline
      </div>
    </div>
  );
}

