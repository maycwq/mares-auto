import { SLOW_THRESHOLD_MS } from '../lib/motion';

// idle: what's on screen is the last set asked for. pending: a set is on its way and the
// previous one stays readable. slow: the wait passed the threshold and is worth saying.
// failed: the last request failed; the previous set stays and the failure is said.
export type StockStatus = 'idle' | 'pending' | 'slow' | 'failed';

type Load<C, R> = (key: string, criteria: C, signal: AbortSignal) => R | Promise<R>;

// One request at a time, by revision: a new request aborts the previous one when it can
// and, whatever happens to the old promise, only the latest revision may publish.
export function createStockRequester<C, R>(
  load: Load<C, R>,
  publish: (key: string, criteria: C, results: R) => void,
  setStatus: (status: StockStatus) => void,
) {
  let revision = 0;
  let controller: AbortController | undefined;
  let slowTimer: ReturnType<typeof setTimeout> | undefined;

  const stop = () => {
    revision += 1;
    controller?.abort();
    clearTimeout(slowTimer);
  };

  return {
    request(key: string, criteria: C) {
      stop();
      const current = revision;
      controller = new AbortController();
      const result = load(key, criteria, controller.signal);
      if (!(result instanceof Promise)) {
        publish(key, criteria, result);
        setStatus('idle');
        return;
      }
      setStatus('pending');
      slowTimer = setTimeout(() => current === revision && setStatus('slow'), SLOW_THRESHOLD_MS);
      result.then(
        (results) => {
          if (current !== revision) return;
          clearTimeout(slowTimer);
          publish(key, criteria, results);
          setStatus('idle');
        },
        () => {
          if (current !== revision) return;
          clearTimeout(slowTimer);
          setStatus('failed');
        },
      );
    },
    // Back to what's already published (or leaving the page): nothing pending may publish.
    cancel() {
      stop();
      setStatus('idle');
    },
  };
}
