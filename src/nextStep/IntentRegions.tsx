import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type MouseEvent } from 'react';
import { Button, buttonClassName } from '../components/Button/Button';
import { CtaGroup } from '../components/CtaGroup/CtaGroup';
import { Icon } from '../components/Icon/Icon';
import { InlineError } from '../components/InlineError/InlineError';
import { useInlineErrorMotion } from '../components/InlineError/useInlineErrorMotion';
import { InputText } from '../components/InputText/InputText';
import type { Vehicle } from '../data/vehicles';
import { Link } from '../lib/router';
import { currentExploration, furtherExploration } from '../vehicle/exploration';
import {
  emptyFinancingFields,
  formatCpf,
  formatWhatsapp,
  validateFinancing,
  type FinancingErrors,
  type FinancingFields,
} from './financingForm';
import { sendRequest } from './request';
import styles from './NextStep.module.css';

const fieldOrder: (keyof FinancingFields)[] = ['name', 'whatsapp', 'cpf'];
const sendFailedMessage = 'Não foi possível enviar sua solicitação. Tente de novo.';

// The regions after "Continuar" in N1, shown below the vehicle context by NextStepShell.

// "Voltar e escolher outra opção", as a link the shell builds.
export type ChooseAgain = { href: string; onClick: (event: MouseEvent<HTMLAnchorElement>) => void };

export function NotAvailableYet({ titleId, chooseAgain }: { titleId: string; chooseAgain: ChooseAgain }) {
  return (
    <>
      <p className={styles.eyebrow}>próximo passo</p>
      <h1 id={titleId} className={styles.title} tabIndex={-1}>
        Essa opção ainda não está disponível por aqui
      </h1>
      {/* The one way forward from here, so it's the primary action. */}
      <a {...chooseAgain} className={buttonClassName('primary', 'md', styles.fullWidth)}>
        Voltar e escolher outra opção
      </a>
    </>
  );
}

type FinancingFormProps = { vehicle: Vehicle; titleId: string; chooseAgain: ChooseAgain; onSent: () => void };

// N2–N4. Once sent, the confirmation takes its place for good, even after a reload or
// coming back to this page through history.
export function FinancingForm({ vehicle, titleId, chooseAgain, onSent }: FinancingFormProps) {
  const [fields, setFields] = useState(emptyFinancingFields);
  const [errors, setErrors] = useState<FinancingErrors>({});
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const failure = useInlineErrorMotion(failed ? sendFailedMessage : undefined);
  const inputs = useRef<Partial<Record<keyof FinancingFields, HTMLInputElement | null>>>({});
  // One request at a time, and an answer that arrives after the person left this page
  // changes nothing: the history entry it would write belongs to another page by then.
  const pending = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // A field with an error is checked again as it changes, so the error goes away as soon
  // as the value is right. The other fields are left as they are.
  const change = (field: keyof FinancingFields, value: string) => {
    const next = { ...fields, [field]: value };
    setFields(next);
    if (errors[field]) setErrors({ ...errors, [field]: validateFinancing(next)[field] });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (pending.current) return;
    const found = validateFinancing(fields);
    setErrors(found);
    const firstInvalid = fieldOrder.find((field) => found[field]);
    if (firstInvalid) {
      inputs.current[firstInvalid]?.focus();
      return;
    }
    pending.current = true;
    setSending(true);
    setFailed(false);
    try {
      const { id } = await sendRequest({ vehicleId: vehicle.id, intent: 'financiamento', fields });
      if (!mounted.current) return;
      // Only the request id is kept with this history entry; the personal data is not.
      window.history.replaceState({ ...window.history.state, nextStepRequest: { id } }, '');
      onSent();
    } catch {
      // Nothing was sent: the values stay, the button is back and nothing retries alone.
      if (mounted.current) setFailed(true);
    } finally {
      pending.current = false;
      if (mounted.current) setSending(false);
    }
  };

  return (
    <>
      <p className={styles.eyebrow}>simulação</p>
      <h1 id={titleId} className={styles.title} tabIndex={-1}>
        Peça condições para este {vehicle.model}
      </h1>
      <p className={styles.text}>
        Informe seu nome e WhatsApp para a loja entrar em contato. O CPF é necessário para consultar as condições de
        financiamento.
      </p>
      <form className={styles.form} noValidate onSubmit={submit} aria-busy={sending || undefined}>
        <p role="status" className="visually-hidden">
          {sending ? 'Enviando solicitação' : ''}
        </p>
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
        {failure.shown && (
          <div ref={failure.slot} className={styles.failure} role="alert" aria-hidden={failed ? undefined : true}>
            <div className={styles.failureMessage}>
              <InlineError message={failure.shown} />
            </div>
          </div>
        )}
        <CtaGroup layout="stack">
          {/* aria-disabled while sending: the button keeps focus and a second submit is
              ignored. Both labels share one cell, so the button keeps its size. */}
          <Button type="submit" aria-disabled={sending || undefined}>
            <span className={styles.submitLabels}>
              <span aria-hidden={sending || undefined}>Pedir simulação</span>
              <span aria-hidden={!sending || undefined}>Enviando solicitação</span>
            </span>
          </Button>
          <a {...chooseAgain} className={buttonClassName('secondary')}>
            Voltar e escolher outra opção
          </a>
        </CtaGroup>
      </form>
    </>
  );
}

// The confirmation: what happened first, then the vehicle it's about, then the way back.
export function ConfirmationLead({ vehicle, titleId }: { vehicle: Vehicle; titleId: string }) {
  const title = useRef<HTMLHeadingElement>(null);

  // The form that had focus is gone; reading continues from the result.
  useLayoutEffect(() => title.current?.focus({ preventScroll: true }), []);

  return (
    <>
      <Icon name="check" />
      <p className={styles.successEyebrow}>pedido enviado</p>
      <h1 id={titleId} ref={title} tabIndex={-1} className={styles.title}>
        A simulação foi solicitada para este {vehicle.model}
      </h1>
      <p className={styles.body}>
        A loja já recebeu este {vehicle.model} e sua solicitação de financiamento. No próximo contato, você não precisa
        repetir essas informações.
      </p>
    </>
  );
}

export function ConfirmationLinks({ vehicle }: { vehicle: Vehicle }) {
  return (
    <Link
      to={`/veiculos/${vehicle.id}`}
      state={furtherExploration(currentExploration())}
      className={buttonClassName('secondary', 'md', styles.fullWidth)}
    >
      Voltar ao veículo
    </Link>
  );
}
