import { describe, it, expect } from 'vitest';
import { parseSpokenAmount, parseMeetingVoiceCommand } from './voice';

describe('Spoken Hindi/English Amount Parser', () => {
  it('parses numeric digits correctly', () => {
    expect(parseSpokenAmount('100')).toBe(100);
    expect(parseSpokenAmount('Rs 500')).toBe(500);
    expect(parseSpokenAmount('₹ 250')).toBe(250);
  });

  it('parses Devanagari numerals into digits', () => {
    expect(parseSpokenAmount('१००')).toBe(100);
    expect(parseSpokenAmount('५०')).toBe(50);
    expect(parseSpokenAmount('५०० रुपये')).toBe(500);
    expect(parseSpokenAmount('२५०')).toBe(250);
  });

  it('parses basic Hindi words into digits', () => {
    expect(parseSpokenAmount('sau')).toBe(100);
    expect(parseSpokenAmount('do sau')).toBe(200);
    expect(parseSpokenAmount('paanch sau')).toBe(500);
    expect(parseSpokenAmount('ek hazaar')).toBe(1000);
    expect(parseSpokenAmount('pachaas')).toBe(50);
    expect(parseSpokenAmount('सौ')).toBe(100);
    expect(parseSpokenAmount('दो सौ')).toBe(200);
    expect(parseSpokenAmount('पचास')).toBe(50);
    expect(parseSpokenAmount('पांच सौ')).toBe(500);
    expect(parseSpokenAmount('एक हजार')).toBe(1000);
  });

  it('handles colloquial terms like dedh sau and dhai sau', () => {
    expect(parseSpokenAmount('dedh sau')).toBe(150);
    expect(parseSpokenAmount('dhai sau')).toBe(250);
    expect(parseSpokenAmount('डेढ़ सौ')).toBe(150);
    expect(parseSpokenAmount('ढाई सौ')).toBe(250);
  });
});

describe('Intelligent Meeting Voice Command Parser', () => {
  const members = [
    { id: 1, name: 'Sita Hansda' },
    { id: 2, name: 'Parvati Murmu' },
    { id: 3, name: 'Malati Soren' }
  ];

  it('recognizes "all present" attendance commands', () => {
    const res1 = parseMeetingVoiceCommand('सब उपस्थित', members);
    expect(res1.type).toBe('ALL_PRESENT');

    const res2 = parseMeetingVoiceCommand('सभी हाज़िर', members);
    expect(res2.type).toBe('ALL_PRESENT');

    const res3 = parseMeetingVoiceCommand('all present', members);
    expect(res3.type).toBe('ALL_PRESENT');
  });

  it('recognizes member savings recording command ("सीता 100", "Parvati 200")', () => {
    const res1 = parseMeetingVoiceCommand('सीता 100', members);
    expect(res1.type).toBe('RECORD_SAVING');
    expect(res1.member.id).toBe(1);
    expect(res1.amount).toBe(100);

    const res2 = parseMeetingVoiceCommand('पार्वती पचास रुपये', members);
    expect(res2.type).toBe('RECORD_SAVING');
    expect(res2.member.id).toBe(2);
    expect(res2.amount).toBe(50);

    const res3 = parseMeetingVoiceCommand('malati 200', members);
    expect(res3.type).toBe('RECORD_SAVING');
    expect(res3.member.id).toBe(3);
    expect(res3.amount).toBe(200);
  });

  it('recognizes individual member attendance ("सीता उपस्थित", "पार्वती गैरहाजिर")', () => {
    const res1 = parseMeetingVoiceCommand('सीता उपस्थित', members);
    expect(res1.type).toBe('MEMBER_ATTENDANCE');
    expect(res1.member.id).toBe(1);
    expect(res1.status).toBe('present');

    const res2 = parseMeetingVoiceCommand('पार्वती अनुपस्थित', members);
    expect(res2.type).toBe('MEMBER_ATTENDANCE');
    expect(res2.member.id).toBe(2);
    expect(res2.status).toBe('absent');
  });

  it('recognizes meeting navigation commands ("अगला", "वापस")', () => {
    expect(parseMeetingVoiceCommand('अगला', members).type).toBe('NEXT_STEP');
    expect(parseMeetingVoiceCommand('next', members).type).toBe('NEXT_STEP');
    expect(parseMeetingVoiceCommand('पीछे', members).type).toBe('PREV_STEP');
    expect(parseMeetingVoiceCommand('मीटिंग पूरी', members).type).toBe('LOCK_MEETING');
  });
});


