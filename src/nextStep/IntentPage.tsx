import { useEffect, useId, useRef, useState, type FormEvent, type MouseEvent } from 'react';
import { Button, buttonClassName } from '../components/Button/Button';
import { CtaGroup } from '../components/CtaGroup/CtaGroup';
import { Icon } from '../components/Icon/Icon';
import { InputText } from '../components/InputText/InputText';
import { NavigationHeader } from '../components/NavigationHeader/NavigationHeader';
import { NextStepContext } from '../components/NextStepContext/NextStepContext';
import { vehicles, type Vehicle } from '../data/vehicles';
import { cx } from '../lib/cx';
import { Link, useRouter } from '../lib/router';
import { currentExploration, furtherExploration } from '../vehicle/exploration';
import {
  emptyFinancingFields,
  formatCpf,
  formatWhatsapp,
  validateFinancing,
  type FinancingErrors,
  type FinancingFields,
} from './financingForm';
import { findIntent, type Intent } from './intents';
import { sendRequest } from './request';
import styles from './NextStep.module.css';

const fieldOrder: (keyof FinancingFields)[] = ['name', 'whatsapp', 'cpf'];
const financing = findIntent('financiamento')!;

// What comes after "Continuar" in N1, at /veiculos/:id/proximo-passo/:intent. Financing
// is the one detailed flow (N2–N4 and the confirmation). The other intents stop at a
// short state that keeps vehicle and intent and leads back to the choice.
export function IntentPage({ id, intent }: { id: string; intent: string }) {
  const { navigate } = useRouter();
  const vehicle = vehicles.find((item) => item.id === id);
  const chosen = findIntent(intent);

  useEffect(() => {
    if (!vehicle) navigate('/', { replace: true });
    else if (!chosen) navigate(`/veiculos/${id}/proximo-passo`, { replace: true });
  }, [vehicle, chosen, id, navigate]);

  if (!vehicle || !chosen) return null;

  return (
    <>
      <NavigationHeader />
      <main className={cx('container', styles.main)}>
        {chosen.value === 'financiamento' ? (
          <Financing vehicle={vehicle} />
        ) : (
          <NotAvailableYet vehicle={vehicle} intent={chosen.value} context={chosen.context} />
        )}
      </main>
    </>
  );
}

// "Voltar e escolher outra opção": back to the choice as it was when the person came from
// it, otherwise the choice opens with this intent selected. The vehicle stays the same.
function useChooseAgain(vehicle: Vehicle, intent: Intent) {
  const { navigate } = useRouter();
  const href = `/veiculos/${vehicle.id}/proximo-passo?intencao=${intent}`;
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (window.history.state?.fromIntentChoice) window.history.back();
    else navigate(href);
  };
  return { href, onClick };
}

function NotAvailableYet({ vehicle, intent, context }: { vehicle: Vehicle; intent: Intent; context: string }) {
  const chooseAgain = useChooseAgain(vehicle, intent);
  const titleId = useId();

  return (
    <section className={styles.panel} aria-labelledby={titleId}>
      <NextStepContext vehicle={vehicle} intent={context} className={styles.context} />
      <p className={styles.eyebrow}>próximo passo</p>
      <h1 id={titleId} className={styles.title}>
        Essa opção ainda não pode ser concluída por aqui
      </h1>
      <p className={styles.text}>Por enquanto, só a simulação de financiamento pode ser pedida por aqui.</p>
      <a {...chooseAgain} className={buttonClassName('secondary', 'md', styles.fullWidth)}>
        Voltar e escolher outra opção
      </a>
    </section>
  );
}

// Once sent, the confirmation replaces the form for good, even after a reload or coming
// back to this page through history.
function Financing({ vehicle }: { vehicle: Vehicle }) {
  const [sent, setSent] = useState(() => Boolean(window.history.state?.nextStepRequest));
  return sent ? <Confirmation vehicle={vehicle} /> : <FinancingForm vehicle={vehicle} onSent={() => setSent(true)} />;
}

function FinancingForm({ vehicle, onSent }: { vehicle: Vehicle; onSent: () => void }) {
  const chooseAgain = useChooseAgain(vehicle, 'financiamento');
  const [fields, setFields] = useState(emptyFinancingFields);
  const [errors, setErrors] = useState<FinancingErrors>({});
  const [sending, setSending] = useState(false);
  const inputs = useRef<Partial<Record<keyof FinancingFields, HTMLInputElement | null>>>({});
  const titleId = useId();

  // A field with an error is checked again as it changes, so the error goes away as soon
  // as the value is right. The other fields are left as they are.
  const change = (field: keyof FinancingFields, value: string) => {
    const next = { ...fields, [field]: value };
    setFields(next);
    if (errors[field]) setErrors({ ...errors, [field]: validateFinancing(next)[field] });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (sending) return;
    const found = validateFinancing(fields);
    setErrors(found);
    const firstInvalid = fieldOrder.find((field) => found[field]);
    if (firstInvalid) {
      inputs.current[firstInvalid]?.focus();
      return;
    }
    setSending(true);
    const { id } = await sendRequest({ vehicleId: vehicle.id, intent: 'financiamento', fields });
    // Only the request id is kept with this history entry; the personal data is not.
    window.history.replaceState({ ...window.history.state, nextStepRequest: { id } }, '');
    onSent();
  };

  return (
    <section className={styles.panel} aria-labelledby={titleId}>
      <NextStepContext vehicle={vehicle} intent={financing.context} className={styles.context} />
      <p className={styles.eyebrow}>simulação</p>
      <h1 id={titleId} className={styles.title}>
        Peça condições para este {vehicle.model}
      </h1>
      <p className={styles.text}>
        Informe seu nome e WhatsApp para a loja entrar em contato. O CPF é necessário para consultar as condições de
        financiamento.
      </p>
      <form className={styles.form} noValidate onSubmit={submit} aria-busy={sending || undefined}>
        <InputText
          ref={(element) => {
            inputs.current.name = element;
          }}
          label="Nome"
          name="name"
          autoComplete="name"
          placeholder="Como devemos chamar você?"
          value={fields.name}
          error={errors.name}
          onChange={(event) => change('name', event.target.value)}
        />
        <InputText
          ref={(element) => {
            inputs.current.whatsapp = element;
          }}
          label="WhatsApp"
          name="whatsapp"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="(31) 99999-9999"
          value={fields.whatsapp}
          error={errors.whatsapp}
          onChange={(event) => change('whatsapp', formatWhatsapp(event.target.value))}
        />
        <div className={styles.cpf}>
          <InputText
            ref={(element) => {
              inputs.current.cpf = element;
            }}
            label="CPF"
            name="cpf"
            inputMode="numeric"
            placeholder="000.000.000-00"
            value={fields.cpf}
            error={errors.cpf}
            onChange={(event) => change('cpf', formatCpf(event.target.value))}
          />
          {/* Why the CPF is asked, right next to it. */}
          <p className={styles.note}>o CPF será usado somente para esta solicitação de financiamento.</p>
        </div>
        <CtaGroup layout="stack">
          {/* aria-disabled while sending: the button keeps focus and a second submit is ignored. */}
          <Button type="submit" aria-disabled={sending || undefined}>
            Pedir simulação
          </Button>
          <a {...chooseAgain} className={buttonClassName('secondary')}>
            Voltar e escolher outra opção
          </a>
        </CtaGroup>
      </form>
    </section>
  );
}

function Confirmation({ vehicle }: { vehicle: Vehicle }) {
  const title = useRef<HTMLHeadingElement>(null);

  // The form that had focus is gone; reading continues from the result.
  useEffect(() => title.current?.focus(), []);

  return (
    <section className={cx(styles.panel, styles.success)} aria-labelledby="confirmation-title">
      <Icon name="check" />
      <p className={styles.successEyebrow}>pedido enviado</p>
      <h1 id="confirmation-title" ref={title} tabIndex={-1} className={styles.title}>
        A simulação foi solicitada para este {vehicle.model}
      </h1>
      <p className={styles.body}>
        A loja já recebeu este {vehicle.model} e sua solicitação de financiamento. No próximo contato, você não precisa
        repetir essas informações.
      </p>
      <NextStepContext vehicle={vehicle} intent={financing.context} />
      <Link
        to={`/veiculos/${vehicle.id}`}
        state={furtherExploration(currentExploration())}
        className={buttonClassName('secondary', 'md', styles.fullWidth)}
      >
        Voltar ao veículo
      </Link>
    </section>
  );
}
