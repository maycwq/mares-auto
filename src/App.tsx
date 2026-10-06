import { ListingPage } from './listing/ListingPage';
import { RouterProvider, useRouter } from './lib/router';
import { IntentPage } from './nextStep/IntentPage';
import { NextStepPage } from './nextStep/NextStepPage';
import { VehiclePage } from './vehicle/VehiclePage';

function Routes() {
  const { location } = useRouter();
  const [, vehicleId, nextStep, intent] =
    location.pathname.match(/^\/veiculos\/([^/]+)(\/proximo-passo(?:\/([^/]+))?)?$/) ?? [];
  if (vehicleId && intent) return <IntentPage key={`${vehicleId}/${intent}`} id={vehicleId} intent={intent} />;
  if (vehicleId && nextStep) return <NextStepPage id={vehicleId} />;
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
