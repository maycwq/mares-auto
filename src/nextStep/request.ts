import { devTest } from '../lib/devTest';
import type { FinancingFields } from './financingForm';
import type { Intent } from './intents';

// One request carries the form, the vehicle and the intent together, as the design asks.
// There is no backend yet, so sending only waits as long as a network call would and
// hands back an id. Nothing is stored, personal data least of all. In development the
// wait can be changed and the request made to fail (README, "testar motion").
export type NextStepRequest = { vehicleId: string; intent: Intent; fields: FinancingFields };

const LATENCY_MS = 700;

export function sendRequest(request: NextStepRequest): Promise<{ id: string }> {
  void request;
  const { requestLatency = LATENCY_MS, requestFail } = devTest();
  return new Promise((resolve, reject) =>
    setTimeout(
      () => (requestFail ? reject(new Error('request failed')) : resolve({ id: crypto.randomUUID() })),
      requestLatency,
    ),
  );
}
