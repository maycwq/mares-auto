import type { FinancingFields } from './financingForm';
import type { Intent } from './intents';

// One request carries the form, the vehicle and the intent together, as the design asks.
// There is no backend yet, so sending only waits a moment, like a network call would,
// and hands back an id. Nothing is stored, personal data least of all.
export type NextStepRequest = { vehicleId: string; intent: Intent; fields: FinancingFields };

const LATENCY_MS = 700;

export function sendRequest(request: NextStepRequest): Promise<{ id: string }> {
  void request;
  return new Promise((resolve) => setTimeout(() => resolve({ id: crypto.randomUUID() }), LATENCY_MS));
}
