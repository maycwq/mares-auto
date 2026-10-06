// The financing request form (N2–N4): formatting that helps typing, and the validation
// that decides. Formatting never replaces validation.

export type FinancingFields = { name: string; whatsapp: string; cpf: string };
export type FinancingErrors = Partial<Record<keyof FinancingFields, string>>;

export const emptyFinancingFields: FinancingFields = { name: '', whatsapp: '', cpf: '' };

const digits = (value: string) => value.replace(/\D/g, '');

// "31999999999" → "(31) 99999-9999"; ten digits are a landline: "(31) 3333-3333".
export function formatWhatsapp(value: string) {
  const d = digits(value).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  const rest = d.slice(2);
  const split = d.length === 11 ? 5 : 4;
  return rest.length > split ? `(${d.slice(0, 2)}) ${rest.slice(0, split)}-${rest.slice(split)}` : `(${d.slice(0, 2)}) ${rest}`;
}

// "12345678909" → "123.456.789-09"
export function formatCpf(value: string) {
  const d = digits(value).slice(0, 11);
  return [d.slice(0, 3), d.slice(3, 6), d.slice(6, 9)].filter(Boolean).join('.') + (d.length > 9 ? `-${d.slice(9)}` : '');
}

// Eleven digits whose two check digits match the first nine.
export function isValidCpf(value: string) {
  const d = digits(value);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const check = (length: number) => {
    const sum = [...d.slice(0, length)].reduce((total, digit, index) => total + Number(digit) * (length + 1 - index), 0);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return check(9) === Number(d[9]) && check(10) === Number(d[10]);
}

// Area code plus number: ten or eleven digits.
export const isValidWhatsapp = (value: string) => /^\d{10,11}$/.test(digits(value));

export const errorMessages: Record<keyof FinancingFields, string> = {
  name: 'Informe seu nome.',
  whatsapp: 'Confira o WhatsApp e digite o DDD e o número.',
  cpf: 'Confira o CPF e digite os 11 números.',
};

export function validateFinancing(fields: FinancingFields): FinancingErrors {
  const errors: FinancingErrors = {};
  if (!fields.name.trim()) errors.name = errorMessages.name;
  if (!isValidWhatsapp(fields.whatsapp)) errors.whatsapp = errorMessages.whatsapp;
  if (!isValidCpf(fields.cpf)) errors.cpf = errorMessages.cpf;
  return errors;
}
