/**
 * SakhiNidhi Voice Synthesis & Speech Recognition Engine
 * Speech output in hi-IN / local audio fallback
 * Speech recognition with Hindi number parsing
 */

/**
 * Parses spoken Hindi/English number words or phrases into integer amounts.
 * Examples:
 * "sau" -> 100
 * "do sau" -> 200
 * "paanch sau" -> 500
 * "ek hazaar" -> 1000
 * "pachaas" -> 50
 * "dedh sau" -> 150
 * "dhai sau" -> 250
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
  let currentMultiplier = 1;

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
      // Lookahead: is next word 'sau' or 'hazaar'?
      const nextW = words[i + 1];
      if (nextW === 'sau' || nextW === 'so' || nextW === 'hundred') {
        total += singleMap[w] * 100;
        i++; // skip next word
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
 * Speaks in Hindi or target language using SpeechSynthesis or pre-recorded audio
 */
export async function speak(text, options = {}) {
  const { lang = 'hi-IN', rate = 0.9, onEnd } = options;

  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('SpeechSynthesis not supported on this platform');
    return;
  }

  // Cancel any running speech
  window.speechSynthesis.cancel();

  // Create utterance
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = rate; // Slightly slower for low-literacy clarity
  utterance.pitch = 1.0;

  // Attempt to select an Indian voice if available
  const voices = window.speechSynthesis.getVoices();
  const indianVoice = voices.find(v => v.lang.includes('hi') || v.lang.includes('IN'));
  if (indianVoice) {
    utterance.voice = indianVoice;
  }

  if (onEnd) {
    utterance.onend = onEnd;
  }

  window.speechSynthesis.speak(utterance);
}

/**
 * Stop any ongoing speech
 */
export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Haptic feedback helper
 */
export function triggerHaptic(type = 'success') {
  if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
    if (type === 'success') {
      navigator.vibrate([80, 50, 100]);
    } else if (type === 'error') {
      navigator.vibrate([200, 80, 200, 80, 300]);
    } else {
      navigator.vibrate(50);
    }
  }
}

/**
 * Initialise Speech Recognition for spoken amounts
 */
export function startVoiceRecognition({ onResult, onError, onEnd, lang = 'hi-IN' }) {
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

