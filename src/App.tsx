import { ListingPage } from './listing/ListingPage';
import { RouterProvider, useRouter } from './lib/router';
import { NextStepShell } from './nextStep/NextStepShell';
import { VehiclePage } from './vehicle/VehiclePage';

function Routes() {
  const { location } = useRouter();
  const [, vehicleId, nextStep, intent] =
    location.pathname.match(/^\/veiculos\/([^/]+)(\/proximo-passo(?:\/([^/]+))?)?$/) ?? [];
  // One shell for the choice and what follows it, keyed by vehicle: the vehicle context
  // stays mounted while the region below it changes.
  if (vehicleId && nextStep) return <NextStepShell key={vehicleId} id={vehicleId} intent={intent} />;
  // Keyed by vehicle, so opening a similar one starts its gallery and disclosures fresh.
  if (vehicleId) return <VehiclePage key={vehicleId} id={vehicleId} />;
  return <ListingPage />;
}

export function App() {
  return (
    <RouterProvider>
      <Routes />
    </RouterProvider>
  );
}
