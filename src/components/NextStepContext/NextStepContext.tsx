import type { Vehicle } from '../../data/vehicles';
import { cx } from '../../lib/cx';
import { formatPrice } from '../../lib/format';
import { vehicleTitle } from '../../lib/vehicleText';
import { VehicleImage } from '../VehicleImage/VehicleImage';
import styles from './NextStepContext.module.css';

type NextStepContextProps = {
  vehicle: Vehicle;
  // How the chosen intent reads ("simulação de financiamento"). Without one, the context
  // says there's still a choice to make.
  intent?: string;
  className?: string;
};

// Vehicle / Next-step Context. Which car and which action the next step is about; it
// comes from the vehicle and the chosen intent, never from copy repeated on the screen.
export function NextStepContext({ vehicle, intent, className }: NextStepContextProps) {
  return (
    <div className={cx(styles.context, className)}>
      <VehicleImage src={vehicle.media[0]?.src} alt="" aspect="card" className={styles.thumb} />
      <div className={styles.content}>
        <p className={styles.label}>veículo</p>
        <p className={styles.title}>{vehicleTitle(vehicle)}</p>
        <p className={styles.price}>{formatPrice(vehicle.price)}</p>
        <p className={styles.intent}>{intent ?? 'escolha como quer continuar'}</p>
      </div>
    </div>
  );
}
