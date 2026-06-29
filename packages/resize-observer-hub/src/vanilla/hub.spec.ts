import { describe, expect, it } from 'vitest';
import { normalizeOptions } from './hub.ts';

describe('normalizeOptions', () => {
  it('normalizes missing options to content-box', () => {
    expect(normalizeOptions()).toEqual({ box: 'content-box' });
    expect(normalizeOptions(null)).toEqual({ box: 'content-box' });
    expect(normalizeOptions({})).toEqual({ box: 'content-box' });
    expect(normalizeOptions({ box: undefined })).toEqual({ box: 'content-box' });
  });

  it('keeps supported box values', () => {
    expect(normalizeOptions({ box: 'content-box' })).toEqual({ box: 'content-box' });
    expect(normalizeOptions({ box: 'border-box' })).toEqual({ box: 'border-box' });
    expect(normalizeOptions({ box: 'device-pixel-content-box' })).toEqual({
      box: 'device-pixel-content-box',
    });
  });

  it('normalizes unsupported box values to content-box', () => {
    expect(normalizeOptions({ box: 'CONTENT-BOX' })).toEqual({ box: 'content-box' });
    expect(normalizeOptions({ box: 'borderBox' })).toEqual({ box: 'content-box' });
    expect(normalizeOptions({ box: 1 })).toEqual({ box: 'content-box' });
  });
});
