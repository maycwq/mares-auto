import { describe, expect, it } from 'vitest';
import { photoChange } from './useGalleryIndex';

describe('photo change', () => {
  it('slides one photo along for the previous/next controls', () => {
    expect(photoChange(2, 3, true, false)).toBe('next');
    expect(photoChange(3, 2, true, false)).toBe('prev');
  });

  it('crossfades a thumbnail, even to the neighbouring photo', () => {
    expect(photoChange(0, 1, false, false)).toBe('crossfade');
    expect(photoChange(0, 3, false, false)).toBe('crossfade');
  });

  it('crossfades a jump of more than one photo and quick repeated steps', () => {
    expect(photoChange(0, 2, true, false)).toBe('crossfade');
    expect(photoChange(1, 2, true, true)).toBe('crossfade');
  });
});
