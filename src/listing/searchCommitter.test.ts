import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSearchCommitter } from './searchCommitter';

function setup(initial = '') {
  const commits: string[] = [];
  const committer = createSearchCommitter(initial, (query) => commits.push(query), 160);
  return { committer, commits };
}

describe('search committer', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('asks once, 160 ms after the last keystroke', () => {
    const { committer, commits } = setup();
    for (const value of ['c', 'ci', 'civ', 'civi', 'civic']) {
      committer.type(value);
      vi.advanceTimersByTime(100);
    }
    expect(commits).toEqual([]);
    vi.advanceTimersByTime(60);
    expect(commits).toEqual(['civic']);
  });

  it('asks right away on Enter, and not again when the pause ends', () => {
    const { committer, commits } = setup();
    committer.type('onix');
    committer.submit('onix');
    expect(commits).toEqual(['onix']);
    vi.advanceTimersByTime(500);
    expect(commits).toEqual(['onix']);
  });

  it('treats an empty field as clearing, right away', () => {
    const { committer, commits } = setup('onix');
    committer.type('oni');
    committer.type('');
    expect(commits).toEqual(['']);
    vi.advanceTimersByTime(500);
    expect(commits).toEqual(['']);
  });

  it('never asks for the query already applied', () => {
    const { committer, commits } = setup('onix');
    committer.type('onix');
    vi.advanceTimersByTime(200);
    committer.submit('onix');
    expect(commits).toEqual([]);
  });

  it('drops pending typing when the query changes from elsewhere', () => {
    const { committer, commits } = setup('onix');
    committer.type('onix pl');
    expect(committer.follow('hb20')).toBe(true);
    vi.advanceTimersByTime(500);
    expect(commits).toEqual([]);
    expect(committer.follow('hb20')).toBe(false);
  });
});
