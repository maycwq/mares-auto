import { useEffect, useId, useReducer, useRef, type MouseEvent, type ReactNode } from 'react';
import { NavigationHeader } from '../components/NavigationHeader/NavigationHeader';
import { NextStepContext } from '../components/NextStepContext/NextStepContext';
import { vehicles } from '../data/vehicles';
import { cx } from '../lib/cx';
import { useRouter } from '../lib/router';
import { useArrival } from '../lib/useArrival';
import { currentExploration, furtherExploration } from '../vehicle/exploration';
import { IntentChoice } from './IntentChoice';
import { ConfirmationLead, ConfirmationLinks, FinancingForm, NotAvailableYet, type ChooseAgain } from './IntentRegions';
import { findIntent, parseIntent, type Intent } from './intents';
import { useRegionTransition, type RegionMotion } from './useRegionTransition';
import styles from './NextStep.module.css';

// The next step for one vehicle, at /veiculos/:id/proximo-passo (N1, the choice) and
// /veiculos/:id/proximo-passo/:intent (what comes after "Continuar"). It's one panel: the
// vehicle context stays put while the region around it changes, so moving between the
// choice, a form and its confirmation never rebuilds the vehicle. Financing is the one
// detailed flow (N2–N4 and the confirmation); the other intents stop at a short state
// that keeps vehicle and intent and leads back to the choice.
export function NextStepShell({ id, intent }: { id: string; intent?: string }) {
  const { location, navigate } = useRouter();
  const vehicle = vehicles.find((item) => item.id === id);
  const chosen = intent === undefined ? undefined : findIntent(intent);
  const panel = useRef<HTMLElement>(null);
  const pending = useRef<RegionMotion>(undefined);
  const titleId = useId();
  // The confirmation belongs to the history entry the request was sent from, so it
  // survives a reload and coming back through history.
  const [, refresh] = useReducer((count: number) => count + 1, 0);
  const sent = chosen?.value === 'financiamento' && Boolean(window.history.state?.nextStepRequest);
  const regionKey = !chosen ? 'choice' : chosen.value !== 'financiamento' ? `unavailable:${chosen.value}` : sent ? 'sent' : 'form';

  useRegionTransition(panel, regionKey, pending);
  // From the vehicle page, the options settle in; the vehicle context is already there.
  useArrival(panel, ':scope > [data-region]');

  useEffect(() => {
    if (!vehicle) navigate('/', { replace: true });
    else if (intent !== undefined && !chosen) navigate(`/veiculos/${id}/proximo-passo`, { replace: true });
  }, [vehicle, intent, chosen, id, navigate]);

  if (!vehicle || (intent !== undefined && !chosen)) return null;

  const proceed = (selected: Intent) => {
    pending.current = 'forward';
    navigate(`/veiculos/${id}/proximo-passo/${selected}`, {
      state: { ...furtherExploration(currentExploration()), fromIntentChoice: true },
    });
  };

  // "Voltar e escolher outra opção": back to the choice as it was when the person came
  // from it, otherwise the choice opens with this intent selected. The vehicle stays.
  const chooseAgain = (from: Intent): ChooseAgain => ({
    href: `/veiculos/${id}/proximo-passo?intencao=${from}`,
    onClick: (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      pending.current = 'back';
      if (window.history.state?.fromIntentChoice) window.history.back();
      else navigate(`/veiculos/${id}/proximo-passo?intencao=${from}`);
    },
  });

  const onSent = () => {
    pending.current = 'success';
    refresh();
  };

  let lead: ReactNode = null;
  let body: ReactNode;
  if (!chosen) {
    body = <IntentChoice vehicle={vehicle} selected={parseIntent(location.search)} titleId={titleId} onProceed={proceed} />;
  } else if (chosen.value !== 'financiamento') {
    body = <NotAvailableYet titleId={titleId} chooseAgain={chooseAgain(chosen.value)} />;
  } else if (sent) {
    lead = <ConfirmationLead vehicle={vehicle} titleId={titleId} />;
    body = <ConfirmationLinks vehicle={vehicle} />;
  } else {
    body = <FinancingForm vehicle={vehicle} titleId={titleId} chooseAgain={chooseAgain('financiamento')} onSent={onSent} />;
  }

  return (
    <>
      <NavigationHeader />
      <main className={cx('container', styles.main)}>
        <section ref={panel} className={cx(styles.panel, sent && styles.success)} aria-labelledby={titleId}>
          {lead && (
            <div key={`${regionKey}:lead`} data-region className={styles.region}>
              {lead}
            </div>
          )}
          {/* The same element in every region, so it never reloads its photo or moves
              without motion. */}
          <div key="context" data-context>
            <NextStepContext vehicle={vehicle} intent={chosen?.context} className={cx(!sent && styles.context)} />
          </div>
          <div key={regionKey} data-region className={styles.region}>
            {body}
          </div>
        </section>
      </main>
    </>
  );
}
