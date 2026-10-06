import { Button } from '../components/Button/Button';
import { Radio } from '../components/Radio/Radio';
import type { Vehicle } from '../data/vehicles';
import { cx } from '../lib/cx';
import { useRouter } from '../lib/router';
import { intents, type Intent } from './intents';
import styles from './NextStep.module.css';

type IntentChoiceProps = {
  vehicle: Vehicle;
  selected: Intent | undefined;
  titleId: string;
  onProceed: (selected: Intent) => void;
};

// N1/N5: what to do with this vehicle, before any personal data. The intent lives in the
// URL, so a shortcut from the vehicle page arrives with it chosen and a reload keeps it.
export function IntentChoice({ vehicle, selected, titleId, onProceed }: IntentChoiceProps) {
  const { navigate } = useRouter();
  const select = (intent: Intent) =>
    navigate(`/veiculos/${vehicle.id}/proximo-passo?intencao=${intent}`, { replace: true });

  return (
    <>
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
      {/* Disabled until there is a choice; it never explains itself through an error. It
          proceeds with the intent selected at the moment it's pressed. */}
      <Button
        className={cx(styles.fullWidth, styles.continue)}
        disabled={!selected}
        onClick={() => selected && onProceed(selected)}
      >
        {selected ? 'Continuar' : 'Escolha uma opção'}
      </Button>
    </>
  );
}
