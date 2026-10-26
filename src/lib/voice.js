/**
 * SakhiNidhi Voice Synthesis, Instant Audio Chimes & Speech Recognition Engine
 * Speech output in hi-IN / local audio fallback
 * Instant zero-latency Web Audio chime generator
 * Speech recognition with Hindi number parsing
 */

let cachedVoices = [];
let audioCtx = null;

// Initialize or return AudioContext
function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Instant Web Audio Chime Generator (< 5ms zero latency, no network, 100% offline)
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
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'cash' || type === 'coin') {
      // Pleasant dual-bell chime like a payment soundbox
      [523.25, 659.25, 783.99].forEach((freq, i) => {
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
      });
    } else if (type === 'success') {
      // Upward cheerful 3-tone arpeggio
      [440, 554.37, 659.25].forEach((freq, i) => {
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
      });
    } else if (type === 'error') {
      // Low dual warning buzz
      [220, 207].forEach((freq, i) => {
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
      });
    }
  } catch (err) {
    console.warn('Audio chime error:', err);
  }
}

/**
 * Pre-warm audio and TTS on first user interaction
 */
export function warmUpAudio() {
  getAudioContext();
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      cachedVoices = window.speechSynthesis.getVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
          cachedVoices = window.speechSynthesis.getVoices();
        };
      }
      window.speechSynthesis.resume();
    } catch {
      // Ignore
    }
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('touchstart', warmUpAudio, { once: true, passive: true });
  window.addEventListener('click', warmUpAudio, { once: true, passive: true });
}

/**
 * Parses spoken Hindi/English number words or phrases into integer amounts.
 */
export function parseSpokenAmount(spokenText) {
  if (!spokenText) return null;

  const raw = String(spokenText).toLowerCase().trim();

  // 1. Direct number check (e.g. "500", "100 rupees", "₹ 200")
  const directDigits = raw.match(/\d+/g);
  if (directDigits && directDigits.length > 0) {
    const num = parseInt(directDigits.join(''), 10);
    if (!isNaN(num) && num > 0) return num;
  }

  // 2. Hindi word dictionary
  const singleMap = {
    'shunya': 0, 'zero': 0,
    'ek': 1, 'one': 1,
    'do': 2, 'two': 2,
    'teen': 3, 'three': 3,
    'chaar': 4, 'char': 4, 'four': 4,
    'paanch': 5, 'panch': 5, 'five': 5,
    'chhe': 6, 'che': 6, 'six': 6,
    'saat': 7, 'seven': 7,
    'aath': 8, 'eight': 8,
    'nau': 9, 'nine': 9,
    'das': 10, 'ten': 10,
    'gyaarah': 11, 'eleven': 11,
    'baarah': 12, 'twelve': 12,
    'terah': 13, 'thirteen': 13,
    'chaudah': 14, 'fourteen': 14,
    'pandrah': 15, 'fifteen': 15,
    'solah': 16, 'sixteen': 16,
    'satrah': 17, 'seventeen': 17,
    'athaarah': 18, 'atharah': 18, 'eighteen': 18,
    'unnees': 19, 'nineteen': 19,
    'bees': 20, 'twenty': 20,
    'pachees': 25, 'pachis': 25,
    'tees': 30, 'thirty': 30,
    'paithees': 35, 'paintis': 35,
    'chaalis': 40, 'chalis': 40, 'forty': 40,
    'pachaas': 50, 'pachas': 50, 'fifty': 50,
    'saath': 60, 'sath': 60, 'sixty': 60,
    'sattar': 70, 'seventy': 70,
    'assi': 80, 'eighty': 80,
    'nabbe': 90, 'ninety': 90,
  };

  // Special colloquial compounds
  if (raw.includes('dedh sau') || raw.includes('derh sau')) return 150;
  if (raw.includes('dhai sau')) return 250;
  if (raw.includes('dedh hazaar')) return 1500;
  if (raw.includes('dhai hazaar')) return 2500;

  let total = 0;
  const words = raw.split(/[\s,]+/);

  for (let i = 0; i < words.length; i++) {
    const w = words[i];

    if (w === 'sau' || w === 'so' || w === 'hundred') {
      if (total === 0) total = 100;
      else total = total * 100;
    } else if (w === 'hazaar' || w === 'hazar' || w === 'thousand') {
      if (total === 0) total = 1000;
      else total = total * 1000;
    } else if (w === 'lakh' || w === 'lac') {
      if (total === 0) total = 100000;
      else total = total * 100000;
    } else if (singleMap[w] !== undefined) {
      const nextW = words[i + 1];
      if (nextW === 'sau' || nextW === 'so' || nextW === 'hundred') {
        total += singleMap[w] * 100;
        i++;
      } else if (nextW === 'hazaar' || nextW === 'hazar' || nextW === 'thousand') {
        total += singleMap[w] * 1000;
        i++;
      } else {
        total += singleMap[w];
      }
    }
  }

  return total > 0 ? total : null;
}

/**
 * Text-to-speech speaker helper
 * Speaks without freezing or lag using cached voices and resume() call
 */
export async function speak(text, options = {}) {
  const { lang = 'hi-IN', rate = 1.0, onEnd } = options;

  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }

  try {
    // Unfreeze speech synthesis engine (common Android WebView bug)
    window.speechSynthesis.resume();
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = 1.0;

    // Use cached voices or query
    const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      const targetLangPrefix = lang.split('-')[0];
      const match = voices.find(v => v.lang.startsWith(targetLangPrefix)) ||
                    voices.find(v => v.lang.includes('IN')) ||
                    voices[0];
      if (match) utterance.voice = match;
    }

    if (onEnd) {
      utterance.onend = onEnd;
      utterance.onerror = onEnd;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis error:', err);
    if (onEnd) onEnd();
  }
}

/**
 * Stop any ongoing speech
 */
export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore
    }
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
    } catch {
      // Ignore
    }
  }
}

/**
 * Initialise Speech Recognition for spoken amounts
 */
export function startVoiceRecognition({ onResult, onError, onEnd, lang = 'hi-IN' }) {
  const SpeechRecognition = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
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
      const transcript = event.results[0][0].transcript;
      const parsedAmount = parseSpokenAmount(transcript);
      if (onResult) {
        onResult({ transcript, amount: parsedAmount });
      }
    };

    recognition.onerror = (err) => {
      console.warn('SpeechRecognition error:', err);
      if (onError) onError(err.error || 'Mic error');
    };

    recognition.onend = () => {
      if (onEnd) onEnd();
    };

    recognition.start();
    return recognition;
  } catch (err) {
    console.error('Failed to start speech recognition:', err);
    if (onError) onError(err.message);
    return null;
  }
}
