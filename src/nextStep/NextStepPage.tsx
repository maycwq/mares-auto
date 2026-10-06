import { useEffect, type MouseEvent } from 'react';
import { NavigationHeader } from '../components/NavigationHeader/NavigationHeader';
import { TextLink } from '../components/TextLink/TextLink';
import { vehicles } from '../data/vehicles';
import { cx } from '../lib/cx';
import { useRouter } from '../lib/router';
import { currentExploration } from '../vehicle/exploration';
import styles from './NextStepPage.module.css';

// Placeholder for the next step, which is built in its own branch. It exists so the
// vehicle page's entry points already lead somewhere real, carrying the vehicle (in the
// path) and the intent (?intencao=troca|financiamento).
export function NextStepPage({ id }: { id: string }) {
  const { navigate } = useRouter();
  const vehicle = vehicles.find((item) => item.id === id);
  const vehiclePath = `/veiculos/${id}`;

  useEffect(() => {
    if (!vehicle) navigate('/', { replace: true });
  }, [vehicle, navigate]);

  if (!vehicle) return null;

  const goBack = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    // Reached from the vehicle page, the previous entry is that page as it was left.
    if (currentExploration()) window.history.back();
    else navigate(vehiclePath);
  };

  return (
    <>
      <NavigationHeader />
      <main className={cx('container', styles.main)}>
        <TextLink href={vehiclePath} onClick={goBack}>
          ← Voltar ao veículo
        </TextLink>
        <h1 className={styles.title}>Como quer continuar com este {vehicle.model}?</h1>
      </main>
    </>
  );
}
