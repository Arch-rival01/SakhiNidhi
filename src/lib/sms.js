/**
 * SakhiNidhi SMS Reminders & Dispatcher Engine
 * Supports deep-linking (sms:+91...?...), queuing, and future Capacitor/Gateway plugins.
 */

/**
 * Format SMS text for meeting savings or loan repayment
 */
export function formatSmsMessage({
  type = 'due_reminder', // 'due_reminder' | 'overdue_alert' | 'meeting_notice'
  memberName,
  groupName = 'Sakhi Mandal',
  amount,
  dueDate,
  language = 'hi'
}) {
  const cleanName = memberName || 'Member';
  const cleanGroup = groupName || 'Sakhi Mandal';
  const amtStr = `₹${amount || 0}`;

  switch (language) {
    case 'sat': // Santhali
      if (type === 'overdue_alert') {
        return `ᱡᱚᱦᱟᱨ ${cleanName}, ${cleanGroup} ᱨᱮ ᱟᱢᱟᱜ ᱨᱤᱬ ${amtStr} ᱵᱟᱹᱠᱤ ᱢᱮᱱᱟᱜ-ᱟ ᱾ ᱫᱟᱭᱟᱠᱟᱛᱮ ᱦᱤᱞᱳᱜ ᱢᱤᱴᱤᱝ ᱨᱮ ᱡᱚᱢᱟᱭ ᱢᱮ ᱾`;
      }
      return `ᱡᱚᱦᱟᱨ ${cleanName}, ${cleanGroup} ᱢᱤᱴᱤᱝ ᱦᱤᱞᱳᱜ ${dueDate || 'ᱱᱚᱣᱟ ᱦᱟᱯᱛᱟ'} ᱨᱮ ᱟᱢᱟᱜ ᱵᱟᱪᱟᱣ ${amtStr} ᱡᱚᱢᱟ ᱦᱩᱭᱩᱜ-ᱟ ᱾`;

    case 'ho': // Ho
      if (type === 'overdue_alert') {
        return `जोहार ${cleanName}, ${cleanGroup} रे अमः लोन ${amtStr} बाकि मेनाः। दयकेते मितिंग रे जमाय मे।`;
      }
      return `जोहार ${cleanName}, ${cleanGroup} मितिंग ${dueDate || 'नेया हप्ता'} रे अमः बचत ${amtStr} जमाय मे।`;

    case 'mun': // Mundari
      if (type === 'overdue_alert') {
        return `जोहार ${cleanName}, ${cleanGroup} रे आमः ऋण ${amtStr} बाकी मेनाः। दया कते मीटिंग रे जमा एमे।`;
      }
      return `जोहार ${cleanName}, ${cleanGroup} मीटिंग रे आमः बचत ${amtStr} जमा एमे।`;

    case 'hi': // Hindi
    default:
      if (type === 'overdue_alert') {
        return `नमस्ते ${cleanName} जी, ${cleanGroup} में आपकी ₹${amount} की किस्त overdue है। कृपया अगली बैठक में इसे जमा करें। धन्यवाद।`;
      }
      if (type === 'meeting_notice') {
        return `नमस्ते ${cleanName} जी, ${cleanGroup} की साप्ताहिक बैठक ${dueDate || 'जल्द'} है। कृपया समय पर उपस्थित हों।`;
      }
      return `नमस्ते ${cleanName} जी, ${cleanGroup} में आपकी ₹${amount} की बचत/किस्त जमा करने की अंतिम तारीख ${dueDate || 'इस बैठक'} है।`;
  }
}

/**
 * Generates an OS-compatible SMS deep link
 */
export function getSmsDeepLink(phoneNumber, message) {
  const cleanPhone = (phoneNumber || '').replace(/[^\d+]/g, '');
  const encodedMsg = encodeURIComponent(message || '');
  
  // Use semicolon or question mark based on OS detection, or standard format
  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
  const separator = isIOS ? '&' : '?';
  
  return `sms:${cleanPhone}${separator}body=${encodedMsg}`;
}

/**
 * Dispatches an SMS. Currently opens deep link, can be swapped with Capacitor plugin.
 */
export function sendSmsNotification(phoneNumber, message) {
  const link = getSmsDeepLink(phoneNumber, message);
  if (typeof window !== 'undefined') {
    window.location.href = link;
  }
  return link;
}

