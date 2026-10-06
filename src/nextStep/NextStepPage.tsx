import { useEffect, useId } from 'react';
import { Button } from '../components/Button/Button';
import { NavigationHeader } from '../components/NavigationHeader/NavigationHeader';
import { NextStepContext } from '../components/NextStepContext/NextStepContext';
import { Radio } from '../components/Radio/Radio';
import { vehicles } from '../data/vehicles';
import { cx } from '../lib/cx';
import { useRouter } from '../lib/router';
import { currentExploration, furtherExploration } from '../vehicle/exploration';
import { intents, parseIntent, type Intent } from './intents';
import styles from './NextStep.module.css';

// N1/N5: what to do with this vehicle, before any personal data. The intent lives in the
// URL, so a shortcut from the vehicle page arrives with it chosen and a reload keeps it.
export function NextStepPage({ id }: { id: string }) {
  const { location, navigate } = useRouter();
  const vehicle = vehicles.find((item) => item.id === id);
  const selected = parseIntent(location.search);
  const titleId = useId();

  useEffect(() => {
    if (!vehicle) navigate('/', { replace: true });
  }, [vehicle, navigate]);

  if (!vehicle) return null;

  const select = (intent: Intent) => navigate(`/veiculos/${id}/proximo-passo?intencao=${intent}`, { replace: true });

  const proceed = () => {
    if (!selected) return;
    navigate(`/veiculos/${id}/proximo-passo/${selected}`, {
      state: { ...furtherExploration(currentExploration()), fromIntentChoice: true },
    });
  };

  return (
    <>
      <NavigationHeader />
      <main className={cx('container', styles.main)}>
        <section className={styles.panel} aria-labelledby={titleId}>
          <NextStepContext vehicle={vehicle} className={styles.context} />
          <p className={styles.eyebrow}>próximo passo</p>
          <h1 id={titleId} className={styles.title}>
            Como quer continuar com este {vehicle.model}?
          </h1>
          <p className={styles.text}>
            Escolha como quer continuar. Pedimos apenas os dados necessários para a opção selecionada.
          </p>
          <div role="radiogroup" aria-labelledby={titleId} className={styles.intents}>
            {intents.map((intent) => (
              <Radio
                key={intent.value}
                name="intencao"
                value={intent.value}
                checked={selected === intent.value}
                onChange={() => select(intent.value)}
                label={intent.label}
                description={intent.detail(vehicle)}
                className={styles.intent}
              />
            ))}
          </div>
          {/* Disabled until there is a choice; it never explains itself through an error. */}
          <Button className={styles.fullWidth} disabled={!selected} onClick={proceed}>
            {selected ? 'Continuar' : 'Escolha uma opção'}
          </Button>
        </section>
      </main>
    </>
  );
}
