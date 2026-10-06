import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { SEARCH_DEBOUNCE_MS } from '../lib/motion';
import { createSearchCommitter } from './searchCommitter';

// The search field answers every keystroke at once; the query it stands for is asked for
// once typing pauses for 160 ms. Enter and clearing ask right away. If the URL's query
// changes from somewhere else (back/forward), the field follows it and pending typing is
// dropped.
export function useSearchDraft(query: string, commit: (query: string) => void) {
  const [text, setText] = useState(query);
  const onCommit = useRef(commit);
  useLayoutEffect(() => {
    onCommit.current = commit;
  });
  const [committer] = useState(() =>
    createSearchCommitter(query, (value) => onCommit.current(value), SEARCH_DEBOUNCE_MS),
  );

  useEffect(() => {
    if (committer.follow(query)) setText(query);
  }, [committer, query]);

  useEffect(() => () => committer.dispose(), [committer]);

  return {
    text,
    change(value: string) {
      setText(value);
      committer.type(value);
    },
    submit: (value: string) => committer.submit(value),
    clear() {
      setText('');
      committer.submit('');
    },
  };
}
