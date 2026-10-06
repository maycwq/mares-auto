// When typed text becomes a query: once typing pauses for `delay` ms. Enter and clearing
// (an empty field included) ask right away, and the same query is never asked twice. A
// query that changes from elsewhere (back/forward) drops pending typing.
export function createSearchCommitter(initial: string, commit: (query: string) => void, delay: number) {
  let committed = initial;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const now = (value: string) => {
    clearTimeout(timer);
    if (value === committed) return;
    committed = value;
    commit(value);
  };

  return {
    type(value: string) {
      clearTimeout(timer);
      if (value === '') now('');
      else timer = setTimeout(() => now(value), delay);
    },
    submit: now,
    // The URL's query, after any change. Returns whether it came from elsewhere.
    follow(query: string) {
      if (query === committed) return false;
      clearTimeout(timer);
      committed = query;
      return true;
    },
    dispose: () => clearTimeout(timer),
  };
}
