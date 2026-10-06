import type { Vehicle } from '../data/vehicles';

// The four ways to continue with a vehicle (N1), in the design's order. The slug is what
// goes in the URL (?intencao=financiamento, /proximo-passo/financiamento). `context` is
// how Vehicle / Next-step Context names the intent once it's chosen. Only financing has a
// detailed flow; the other three stop at a short "not available here yet" state.
export const intents = [
  {
    value: 'duvida',
    label: 'Tirar uma dúvida',
    detail: () => 'receba retorno da loja sobre este carro',
    context: 'tirar uma dúvida',
  },
  {
    value: 'visita',
    label: 'Agendar visita',
    detail: () => 'combine dia e horário para ver o veículo',
    context: 'agendar visita',
  },
  {
    value: 'troca',
    label: 'Avaliar meu carro',
    detail: () => 'comece a troca usando seu carro como referência',
    context: 'avaliar meu carro',
  },
  {
    value: 'financiamento',
    label: 'Simular financiamento',
    detail: (vehicle: Vehicle) => `peça condições para este ${vehicle.model}`,
    context: 'simulação de financiamento',
  },
] as const;

export type Intent = (typeof intents)[number]['value'];

export const findIntent = (value: string | null | undefined) => intents.find((intent) => intent.value === value);

export const parseIntent = (search: string): Intent | undefined =>
  findIntent(new URLSearchParams(search).get('intencao'))?.value;
