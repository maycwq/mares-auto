import { ListingPage } from './listing/ListingPage';
import { RouterProvider, useRouter } from './lib/router';
import { VehiclePage } from './vehicle/VehiclePage';

function Routes() {
  const { location } = useRouter();
  const vehicleId = location.pathname.match(/^\/veiculos\/([^/]+)$/)?.[1];
  return vehicleId ? <VehiclePage id={vehicleId} /> : <ListingPage />;
}

export function App() {
  return (
    <RouterProvider>
      <Routes />
    </RouterProvider>
  );
}
