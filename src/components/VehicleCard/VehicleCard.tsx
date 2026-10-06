import type { Vehicle } from '../../data/vehicles';
import { formatKm } from '../../lib/format';
import { Link } from '../../lib/router';
import { featuredEvidenceLabel, fuelLabel, storeName, transmissionLabel, vehicleTitle, vehicleVersion } from '../../lib/vehicleText';
import { StatusBadge } from '../StatusBadge/StatusBadge';
import { VehicleAttribute } from '../VehicleAttribute/VehicleAttribute';
import { VehicleImage } from '../VehicleImage/VehicleImage';
import { VehiclePrice } from '../VehiclePrice/VehiclePrice';
import styles from './VehicleCard.module.css';

type VehicleCardProps = {
  vehicle: Vehicle;
  href: string;
  // History state for the vehicle page, e.g. which listing it was opened from.
  linkState?: Record<string, unknown>;
};

// Vehicle / Card. Everything after the title comes from data and is left out when the
// data isn't there; the card just gets shorter.
export function VehicleCard({ vehicle, href, linkState }: VehicleCardProps) {
  const badge = featuredEvidenceLabel(vehicle);
  const attributes = [
    { label: 'ano', value: String(vehicle.year) },
    vehicle.km !== undefined && { label: 'km', value: formatKm(vehicle.km) },
    vehicle.transmission && { label: 'câmbio', value: transmissionLabel[vehicle.transmission] },
    vehicle.fuel && { label: 'combustível', value: fuelLabel[vehicle.fuel] },
  ].filter((attribute) => !!attribute);

  return (
    <article className={styles.card}>
      <VehicleImage src={vehicle.media[0]?.src} alt="" aspect="card" />
      <div className={styles.content}>
        <div className={styles.identity}>
          <h3 className={styles.title}>
            <Link to={href} state={linkState} className={styles.link}>
              {vehicleTitle(vehicle)}
            </Link>
          </h3>
          <p className={styles.version}>{vehicleVersion(vehicle)}</p>
        </div>
        {badge && <StatusBadge tone="success" label={badge} />}
        <dl className={styles.attributes}>
          {attributes.map((attribute) => (
            <VehicleAttribute key={attribute.label} label={attribute.label} value={attribute.value} />
          ))}
        </dl>
        <VehiclePrice price={vehicle.price} reference={vehicle.fipe?.value} />
        <p className={styles.store}>{storeName(vehicle.storeId)}</p>
      </div>
    </article>
  );
}
