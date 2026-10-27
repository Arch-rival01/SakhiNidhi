/**
 * SakhiNidhi High-Reliability Sound & Voice Engine
 * - Instant zero-latency Web Audio soundbox synthesizer (< 5ms)
 * - Auto-recovering AudioContext with mobile gesture unlock
 * - Fail-safe Text-To-Speech with synchronized playback & watchdog
 * - Spoken Amount Announcer (Soundbox style for transactions)
 * - Intelligent Voice Command Parser for Tribal SHG Accounting
 */

let cachedVoices = [];
let audioCtx = null;
let activeUtterance = null;
let isAudioUnlocked = false;

/**
 * Universal Mobile AudioContext with Auto-Recovery
 */
export function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  try {
    if (!audioCtx || audioCtx.state === 'closed') {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch (err) {
    console.warn('AudioContext notice:', err);
    return null;
  }
}

/**
 * Mobile Audio Hardware Unlock (Standard silent buffer technique)
 */
export function unlockAudio() {
  if (isAudioUnlocked) return;
  try {
    const ctx = getAudioContext();
    if (ctx) {
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
      isAudioUnlocked = true;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        cachedVoices = window.speechSynthesis.getVoices();
        window.speechSynthesis.resume();
      } catch {}
    }
  } catch (e) {
    console.warn('Unlock audio notice:', e);
  }
}

// Attach gesture unlock to common user interaction events
if (typeof window !== 'undefined') {
  const unlockEvents = ['touchstart', 'touchend', 'click', 'keydown', 'pointerdown'];
  const handleInteraction = () => {
    unlockAudio();
    if (isAudioUnlocked) {
      unlockEvents.forEach(evt => window.removeEventListener(evt, handleInteraction, { capture: true }));
    }
  };
  unlockEvents.forEach(evt => window.addEventListener(evt, handleInteraction, { capture: true, passive: true }));

  // Load voices asynchronously
  if ('speechSynthesis' in window) {
    try {
      cachedVoices = window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        try {
          cachedVoices = window.speechSynthesis.getVoices();
        } catch {}
      };
    } catch {}
  }
}

/**
 * Instant Web Audio Chime Generator (< 5ms zero latency, 100% offline, loud & clear)
 * Types: 'tap' | 'coin' | 'cash' | 'success' | 'error'
 */
export function playChime(type = 'tap') {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const render = () => {
      try {
        const now = ctx.currentTime;

        if (type === 'tap') {
          // Clean, snappy tactile click
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, now);
          osc.frequency.exponentialRampToValueAtTime(440, now + 0.05);
          gain.gain.setValueAtTime(0.20, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.05);
        } else if (type === 'coin') {
          // Bright metallic coin ping (E6 - 1318 Hz)
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(1318.51, now);
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.30, now + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.29);
        } else if (type === 'cash') {
          // Melodic 4-note payment soundbox chime (C5, E5, G5, C6)
          const notes = [523.25, 659.25, 783.99, 1046.50];
          notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            const t = now + i * 0.075;
            osc.frequency.setValueAtTime(freq, t);
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.32, t + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.39);
          });
        } else if (type === 'success') {
          // Ascending 3-tone cheerful arpeggio (A4, C#5, E5)
          const notes = [440, 554.37, 659.25, 880];
          notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            const t = now + i * 0.07;
            osc.frequency.setValueAtTime(freq, t);
            gain.gain.setValueAtTime(0.24, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.26);
          });
        } else if (type === 'error') {
          // Low warning alert tone
          [240, 180].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            const t = now + i * 0.12;
            osc.frequency.setValueAtTime(freq, t);
            gain.gain.setValueAtTime(0.20, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.19);
          });
        }
      } catch (e) {
        console.warn('Chime render error:', e);
      }
    };

    if (ctx.state === 'suspended') {
      ctx.resume().then(render).catch(() => {});
    } else {
      render();
    }
  } catch (err) {
    console.warn('Audio chime notice:', err);
  }
}

/**
 * Backward compatibility alias
 */
export function warmUpAudio() {
  unlockAudio();
}

/**
 * Normalizes Devanagari numerals to standard digits (०-९ -> 0-9)
 */
function normalizeNumerals(str) {
  if (!str) return '';
  const devanagariMap = {
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
    '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
  };
  return String(str).replace(/[०-९]/g, d => devanagariMap[d] || d);
}

/**
 * Parses spoken Hindi/English number words or phrases into integer amounts.
 */
export function parseSpokenAmount(spokenText) {
  if (!spokenText) return null;

  let raw = normalizeNumerals(String(spokenText)).toLowerCase().trim();

  // 1. Direct number check (e.g. "500", "100 rupees", "₹ 200")
  const directDigits = raw.match(/\d+/g);
  if (directDigits && directDigits.length > 0) {
    const num = parseInt(directDigits.join(''), 10);
    if (!isNaN(num) && num > 0) return num;
  }

  // 2. Hindi & English words map
  const wordMap = {
    'shunya': 0, 'zero': 0, 'शून्य': 0,
    'ek': 1, 'one': 1, 'एक': 1,
    'do': 2, 'two': 2, 'दो': 2,
    'teen': 3, 'three': 3, 'तीन': 3,
    'chaar': 4, 'char': 4, 'four': 4, 'चार': 4,
    'paanch': 5, 'panch': 5, 'five': 5, 'पाँच': 5, 'पांच': 5,
    'chhe': 6, 'che': 6, 'six': 6, 'छह': 6, 'छ': 6,
    'saat': 7, 'seven': 7, 'सात': 7,
    'aath': 8, 'eight': 8, 'आठ': 8,
    'nau': 9, 'nine': 9, 'नौ': 9,
    'das': 10, 'ten': 10, 'दस': 10,
    'gyaarah': 11, 'eleven': 11, 'ग्यारह': 11,
    'baarah': 12, 'twelve': 12, 'बारह': 12,
    'terah': 13, 'thirteen': 13, 'तेरह': 13,
    'chaudah': 14, 'fourteen': 14, 'चौदह': 14,
    'pandrah': 15, 'fifteen': 15, 'पंद्रह': 15,
    'solah': 16, 'sixteen': 16, 'सोलह': 16,
    'satrah': 17, 'seventeen': 17, 'सत्रह': 17,
    'athaarah': 18, 'atharah': 18, 'eighteen': 18, 'अट्ठारह': 18,
    'unnees': 19, 'nineteen': 19, 'उन्नीस': 19,
    'bees': 20, 'twenty': 20, 'बीस': 20,
    'pachees': 25, 'pachis': 25, 'पच्चीस': 25,
    'tees': 30, 'thirty': 30, 'तीस': 30,
    'paithees': 35, 'paintis': 35, 'पैंतीस': 35,
    'chaalis': 40, 'chalis': 40, 'forty': 40, 'चालीस': 40,
    'pachaas': 50, 'pachas': 50, 'fifty': 50, 'पचास': 50,
    'saath': 60, 'sath': 60, 'sixty': 60, 'साठ': 60,
    'sattar': 70, 'seventy': 70, 'सत्तर': 70,
    'assi': 80, 'eighty': 80, 'अस्सी': 80,
    'nabbe': 90, 'ninety': 90, 'नब्बे': 90,
    'sau': 100, 'so': 100, 'hundred': 100, 'सौ': 100,
    'hazaar': 1000, 'hazar': 1000, 'thousand': 1000, 'हज़ार': 1000, 'हजार': 1000,
    'lakh': 100000, 'lac': 100000, 'लाख': 100000
  };

  // Colloquial compounds
  if (raw.includes('dedh sau') || raw.includes('derh sau') || raw.includes('डेढ़ सौ')) return 150;
  if (raw.includes('dhai sau') || raw.includes('ढाई सौ')) return 250;
  if (raw.includes('dedh hazaar') || raw.includes('डेढ़ हजार') || raw.includes('डेढ़ हज़ार')) return 1500;
  if (raw.includes('dhai hazaar') || raw.includes('ढाई हजार') || raw.includes('ढाई हज़ार')) return 2500;

  // Single exact word match (e.g. "sau", "सौ", "पचास")
  if (wordMap[raw] !== undefined) {
    return wordMap[raw];
  }

  let total = 0;
  const words = raw.split(/[\s,]+/);

  for (let i = 0; i < words.length; i++) {
    const w = words[i];

    if (w === 'sau' || w === 'so' || w === 'hundred' || w === 'सौ') {
      if (total === 0) total = 100;
      else total = total * 100;
    } else if (w === 'hazaar' || w === 'hazar' || w === 'thousand' || w === 'हज़ार' || w === 'हजार') {
      if (total === 0) total = 1000;
      else total = total * 1000;
    } else if (w === 'lakh' || w === 'lac' || w === 'लाख') {
      if (total === 0) total = 100000;
      else total = total * 100000;
    } else if (wordMap[w] !== undefined) {
      const nextW = words[i + 1];
      if (nextW === 'sau' || nextW === 'so' || nextW === 'hundred' || nextW === 'सौ') {
        total += wordMap[w] * 100;
        i++;
      } else if (nextW === 'hazaar' || nextW === 'hazar' || nextW === 'thousand' || nextW === 'हज़ार' || nextW === 'हजार') {
        total += wordMap[w] * 1000;
        i++;
      } else {
        total += wordMap[w];
      }
    }
  }

  return total > 0 ? total : null;
}

/**
 * Intelligent Voice Command Parser for Meeting & Accounting
 * Recognizes member names, amounts, attendance, and navigation.
 */
export function parseMeetingVoiceCommand(spokenText, members = []) {
  if (!spokenText) return { type: 'UNKNOWN', raw: '' };

  const raw = normalizeNumerals(String(spokenText)).toLowerCase().trim();

  // 1. Navigation Commands
  if (raw.includes('अगला') || raw.includes('आगे') || raw.includes('next') || raw.includes('aage')) {
    return { type: 'NEXT_STEP' };
  }
  if (raw.includes('पीछे') || raw.includes('वापस') || raw.includes('back') || raw.includes('peeche')) {
    return { type: 'PREV_STEP' };
  }
  if (raw.includes('मीटिंग पूरी') || raw.includes('मीटिंग समाप्त') || raw.includes('लॉक') || raw.includes('lock')) {
    return { type: 'LOCK_MEETING' };
  }

  // 2. Attendance Commands: "All present"
  if (
    raw.includes('सब उपस्थित') || raw.includes('सभी उपस्थित') ||
    raw.includes('सब हाजिर') || raw.includes('सभी हाज़िर') ||
    raw.includes('all present') || raw.includes('sab present')
  ) {
    return {
      type: 'ALL_PRESENT',
      spokenFeedback: 'सभी सदस्य उपस्थित दर्ज किए गए।'
    };
  }

  // 3. Match Member Name against member roster
  let matchedMember = null;
  let memberNameInTranscript = '';

  for (const m of members) {
    const fullName = (m.name || '').toLowerCase();
    const parts = fullName.split(/\s+/);
    const firstName = parts[0];

    // Common transliterations
    const translits = {
      'sita': ['सीता', 'sita'],
      'parvati': ['पार्वती', 'parvati', 'parboti'],
      'malati': ['मालती', 'malati', 'malti'],
      'jasmani': ['जसमनी', 'jasmani', 'jasmi'],
      'sukurmani': ['सुकुरमनी', 'sukurmani', 'shukurmani'],
      'anita': ['अनिता', 'anita'],
      'sunita': ['सुनीता', 'sunita'],
      'geeta': ['गीता', 'geeta', 'gita']
    };

    const variants = translits[firstName] || [firstName, fullName];

    const foundVariant = variants.find(v => raw.includes(v.toLowerCase()));
    if (foundVariant) {
      matchedMember = m;
      memberNameInTranscript = foundVariant;
      break;
    }
  }

  // 4. If a member matched:
  if (matchedMember) {
    // Check for explicit attendance toggles for this member
    if (raw.includes('अनुपस्थित') || raw.includes('गैरहाजिर') || raw.includes('absent') || raw.includes('nahi')) {
      return {
        type: 'MEMBER_ATTENDANCE',
        member: matchedMember,
        status: 'absent',
        spokenFeedback: `${matchedMember.name} अनुपस्थित दर्ज हुई।`
      };
    }
    if (raw.includes('उपस्थित') || raw.includes('हाजिर') || raw.includes('हाज़िर') || raw.includes('present')) {
      return {
        type: 'MEMBER_ATTENDANCE',
        member: matchedMember,
        status: 'present',
        spokenFeedback: `${matchedMember.name} उपस्थित दर्ज हुई।`
      };
    }

    // Check for saving / amount for this member
    const amount = parseSpokenAmount(raw);
    if (amount) {
      return {
        type: 'RECORD_SAVING',
        member: matchedMember,
        amount,
        spokenFeedback: `${matchedMember.name} की बचत ${amount} रुपये दर्ज हो गई।`
      };
    }
  }

  // 5. Standalone amount (e.g. "100", "पचास", "दो सौ रुपये")
  const loneAmount = parseSpokenAmount(raw);
  if (loneAmount) {
    return {
      type: 'AMOUNT_ONLY',
      amount: loneAmount,
      spokenFeedback: `${loneAmount} रुपये`
    };
  }

  return { type: 'UNKNOWN', raw };
}

/**
 * Sanitizes and adapts text for Text-to-Speech across multiple languages.
 * Critical: Mobile TTS engines crash or stall when given unsupported Ol Chiki (Santhali),
 * Ho, or Mundari script characters. This function ensures smooth speech without errors.
 */
export function sanitizeSpokenText(text, lang = 'hi') {
  if (!text) return '';
  let str = String(text);

  // If text contains Ol Chiki script (U+1C50 to U+1C7F)
  if (/[\u1C50-\u1C7F]/.test(str)) {
    const numbers = str.match(/\d+/g);
    if (numbers && numbers.length > 0) {
      return `सखीनिधि। राशि ${numbers.join(' ')} रुपये।`;
    }
    return 'सखीनिधि मोबाइल रिकॉर्ड।';
  }

  // Remove markdown formatting and raw symbols that make TTS glitch
  str = str.replace(/[*_#`~>]/g, ' ').replace(/\s+/g, ' ').trim();

  return str;
}

/**
 * High-Reliability Text-To-Speech with Multi-Language Safety & Android WebView GC Protection
 */
export async function speak(text, options = {}) {
  const { lang = 'hi-IN', rate = 1.0, onEnd } = options;

  if (!text) {
    if (onEnd) onEnd();
    return;
  }

  // 1. Sanitize text for multi-language safety
  const cleanText = sanitizeSpokenText(text, lang);
  if (!cleanText) {
    if (onEnd) onEnd();
    return;
  }

  // Ensure AudioContext is warm
  unlockAudio();

  // Play an instant soundbox chime alongside spoken text so feedback is 100% audible immediately
  playChime('tap');

  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onEnd) onEnd();
    return;
  }

  try {
    // Cancel any previous speech
    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
    } catch {}

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = rate;
    utterance.pitch = 1.0;

    // Retain global reference so Android WebView GC doesn't abort speech mid-sentence
    activeUtterance = utterance;

    // Find best available matching voice
    let voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) {
      try {
        cachedVoices = window.speechSynthesis.getVoices();
        voices = cachedVoices;
      } catch {}
    }

    // Determine target language:
    // If language is tribal ('sat', 'ho', 'mun'), map to 'hi-IN' which is supported by Indian TTS engines
    const normalizedLang = ['sat', 'ho', 'mun'].includes(lang) ? 'hi-IN' : lang;

    let selectedVoice = null;
    let targetLang = normalizedLang;

    if (voices && voices.length > 0) {
      const targetPrefix = normalizedLang.split('-')[0].toLowerCase();
      const matchHindi = voices.find(v => v.lang.toLowerCase().startsWith('hi'));
      const matchIndian = voices.find(v => v.lang.toLowerCase().includes('in'));
      const defaultVoice = voices.find(v => v.default) || voices[0];

      if (targetPrefix === 'hi' && matchHindi) {
        selectedVoice = matchHindi;
        targetLang = matchHindi.lang;
      } else if (matchIndian) {
        selectedVoice = matchIndian;
        targetLang = matchIndian.lang;
      } else if (defaultVoice) {
        selectedVoice = defaultVoice;
        targetLang = defaultVoice.lang;
      }
    }

    utterance.lang = targetLang;
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    let finished = false;
    const cleanup = () => {
      if (finished) return;
      finished = true;
      activeUtterance = null;
      if (onEnd) {
        try { onEnd(); } catch {}
      }
    };

    utterance.onend = cleanup;
    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis notice:', e);
      cleanup();
    };

    // Watchdog timer: on Android WebView, if onend never fires, ensure UI is unblocked
    const watchdogDuration = Math.max(3000, cleanText.length * 150);
    setTimeout(() => {
      if (!finished) {
        cleanup();
      }
    }, watchdogDuration);

    // Call synchronously inside user gesture call stack
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis notice:', err);
    activeUtterance = null;
    if (onEnd) onEnd();
  }
}

/**
 * Spoken Amount Announcer (Paytm / Soundbox style)
 * e.g. speakAmount(100) -> plays 'cash' chime and announces "100 रुपये"
 */
export function speakAmount(amount, prefix = '') {
  playChime('cash');
  triggerHaptic('success');
  const num = Number(amount) || 0;
  const spoken = prefix ? `${prefix} ${num} रुपये` : `${num} रुपये`;
  speak(spoken);
}

/**
 * Stop any ongoing speech
 */
export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      activeUtterance = null;
      window.speechSynthesis.cancel();
    } catch {}
  }
}

/**
 * Haptic feedback helper
 */
export function triggerHaptic(type = 'success') {
  if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
    try {
      if (type === 'success') {
        navigator.vibrate([60, 40, 80]);
      } else if (type === 'error') {
        navigator.vibrate([150, 60, 150]);
      } else {
        navigator.vibrate(30);
      }
    } catch {}
  }
}

/**
 * Speech Recognition Wrapper
 */
export function startVoiceRecognition({ onResult, onError, onEnd, lang = 'hi-IN' }) {
  if (typeof window === 'undefined') return null;
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    if (onError) onError('Speech recognition not supported in this browser. Please use the keypad.');
    return null;
  }

  try {
    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      try {
        const transcript = event.results[0][0].transcript;
        const parsedAmount = parseSpokenAmount(transcript);
        if (onResult) {
          onResult({ transcript, amount: parsedAmount });
        }
      } catch (err) {
        if (onError) onError(err.message);
      }
    };

    recognition.onerror = (err) => {
      console.warn('SpeechRecognition notice:', err);
      if (onError) onError(err.error || 'Mic error');
    };

    recognition.onend = () => {
      if (onEnd) onEnd();
    };

    recognition.start();
    return recognition;
  } catch (err) {
    console.warn('Failed to start speech recognition:', err);
    if (onError) onError(err.message);
    return null;
  }
}

