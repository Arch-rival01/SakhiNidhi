import { describe, it, expect } from 'vitest';
import { parseSpokenAmount } from './voice';

describe('Spoken Hindi/English Amount Parser', () => {
  it('parses numeric digits correctly', () => {
    expect(parseSpokenAmount('100')).toBe(100);
    expect(parseSpokenAmount('Rs 500')).toBe(500);
    expect(parseSpokenAmount('₹ 250')).toBe(250);
  });

  it('parses basic Hindi words into digits', () => {
    expect(parseSpokenAmount('sau')).toBe(100);
    expect(parseSpokenAmount('do sau')).toBe(200);
    expect(parseSpokenAmount('paanch sau')).toBe(500);
    expect(parseSpokenAmount('ek hazaar')).toBe(1000);
    expect(parseSpokenAmount('pachaas')).toBe(50);
  });

  it('handles colloquial terms like dedh sau and dhai sau', () => {
    expect(parseSpokenAmount('dedh sau')).toBe(150);
    expect(parseSpokenAmount('dhai sau')).toBe(250);
  });
});

