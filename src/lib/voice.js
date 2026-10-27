/**
 * SakhiNidhi Resilient Voice Engine & Intelligent Hindi Speech Command Processor
 * - Zero-latency Web Audio chime generator with state recovery and fail-safe guards
 * - Crash-proof Text-To-Speech with persistent utterance reference (fixes Android WebView GC bug)
 * - Intelligent Voice Command Parser for Tribal SHG Accounting (names + amounts + attendance + navigation)
 */

let cachedVoices = [];
let audioCtx = null;
let activeUtterance = null; // Prevent Android WebView GC bug from killing active speech

/**
 * Safe AudioContext singleton with automatic re-instantiation if closed/interrupted
 */
function getAudioContext() {
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
    console.warn('AudioContext init notice:', err);
    return null;
  }
}

/**
 * Instant Web Audio Chime Generator (< 5ms zero latency, 100% offline, crash-proof)
 * Types: 'cash' | 'success' | 'tap' | 'error' | 'coin'
 */
export function playChime(type = 'tap') {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (type === 'tap') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'cash' || type === 'coin') {
      // Pleasant dual-bell chime like a payment soundbox
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + i * 0.08);
          gain.gain.setValueAtTime(0, now + i * 0.08);
          gain.gain.linearRampToValueAtTime(0.18, now + i * 0.08 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.08);
          osc.stop(now + i * 0.08 + 0.36);
        } catch {}
      });
    } else if (type === 'success') {
      // Upward cheerful 3-tone arpeggio
      [440, 554.37, 659.25].forEach((freq, i) => {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.09);
          gain.gain.setValueAtTime(0.15, now + i * 0.09);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.09);
          osc.stop(now + i * 0.09 + 0.26);
        } catch {}
      });
    } else if (type === 'error') {
      // Low dual warning buzz
      [220, 207].forEach((freq, i) => {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, now + i * 0.12);
          gain.gain.setValueAtTime(0.12, now + i * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.18);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.12);
          osc.stop(now + i * 0.12 + 0.19);
        } catch {}
      });
    }
  } catch (err) {
    console.warn('Audio chime notice:', err);
  }
}

/**
 * Pre-warm audio and speech synthesis on first user interaction
 */
export function warmUpAudio() {
  getAudioContext();
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      cachedVoices = window.speechSynthesis.getVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
          try {
            cachedVoices = window.speechSynthesis.getVoices();
          } catch {}
        };
      }
      window.speechSynthesis.resume();
    } catch {}
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('touchstart', warmUpAudio, { once: true, passive: true });
  window.addEventListener('click', warmUpAudio, { once: true, passive: true });
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
 * Text-to-speech speaker helper with Android WebView GC protection & watchdog
 */
export async function speak(text, options = {}) {
  const { lang = 'hi-IN', rate = 1.0, onEnd } = options;

  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onEnd) onEnd();
    return;
  }

  try {
    // Cancel any previous speech
    try {
      window.speechSynthesis.cancel();
    } catch {}

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = 1.0;

    // Retain global reference so Android WebView GC doesn't abort speech mid-sentence
    activeUtterance = utterance;

    // Use cached voices or query
    const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      const targetLangPrefix = lang.split('-')[0];
      const match = voices.find(v => v.lang.startsWith(targetLangPrefix)) ||
                    voices.find(v => v.lang.includes('IN')) ||
                    voices[0];
      if (match) utterance.voice = match;
    }

    const cleanup = () => {
      activeUtterance = null;
      if (onEnd) {
        try { onEnd(); } catch {}
      }
    };

    utterance.onend = cleanup;
    utterance.onerror = cleanup;

    // Tiny 40ms timeout ensures Android WebView speech engine cleans up previously canceled speech
    setTimeout(() => {
      try {
        window.speechSynthesis.resume();
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('TTS speak notice:', e);
        cleanup();
      }
    }, 40);
  } catch (err) {
    console.warn('Speech synthesis notice:', err);
    activeUtterance = null;
    if (onEnd) onEnd();
  }
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

