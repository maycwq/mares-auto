import { useEffect, useMemo, useRef, type MouseEvent, type ReactNode } from 'react';
import { Brand } from '../components/Brand/Brand';
import { buttonClassName } from '../components/Button/Button';
import { Disclosure } from '../components/Disclosure/Disclosure';
import { InfoTip } from '../components/InfoTip/InfoTip';
import { NavigationHeader } from '../components/NavigationHeader/NavigationHeader';
import { StatusBadge } from '../components/StatusBadge/StatusBadge';
import { TextLink } from '../components/TextLink/TextLink';
import { TrustItem } from '../components/TrustItem/TrustItem';
import { VehicleAttribute } from '../components/VehicleAttribute/VehicleAttribute';
import { VehicleCard } from '../components/VehicleCard/VehicleCard';
import { VehiclePrice } from '../components/VehiclePrice/VehiclePrice';
import { vehicles } from '../data/vehicles';
import { cx } from '../lib/cx';
import { formatKm, formatNumber, formatPrice } from '../lib/format';
import { Link, useRouter } from '../lib/router';
import { useArrival } from '../lib/useArrival';
import {
  colorLabel,
  conditionSummary,
  featuredEvidenceLabel,
  fipeComparison,
  fuelLabel,
  shownEvidence,
  transmissionLabel,
  trustItemText,
  trustSummary,
  vehicleEyebrow,
  vehicleTitle,
  vehicleVersion,
} from '../lib/vehicleText';
import { appliedFilters, findResults, parseListingState, vehicleCount } from '../listing/listingState';
import { currentExploration, furtherExploration } from './exploration';
import { Gallery } from './Gallery';
import { similarVehicles } from './similarVehicles';
import styles from './VehiclePage.module.css';

// Pairs left out when the vehicle doesn't have the data.
const attributes = (pairs: (false | undefined | { label: string; value: string })[]) =>
  pairs.filter((pair) => !!pair);

export function VehiclePage({ id }: { id: string }) {
  const { navigate } = useRouter();
  const vehicle = vehicles.find((item) => item.id === id);
  // Opened from a card or a similar vehicle, its identification settles in; the photo
  // is already there.
  const summary = useRef<HTMLDivElement>(null);
  useArrival(summary, '[data-identity]');

  // The exploration this vehicle was opened from. Opened directly, it's the whole stock.
  const exploration = currentExploration();
  const listingSearch = exploration?.listingSearch ?? '';
  const listing = useMemo(() => parseListingState(listingSearch), [listingSearch]);
  const results = useMemo(() => findResults(listing), [listing]);
  const filters = appliedFilters(listing.filters);

  useEffect(() => {
    if (!vehicle) navigate('/', { replace: true });
  }, [vehicle, navigate]);

  if (!vehicle) return null;

  // Only "voltar" when there is a listing to go back to. Opened directly, the person was
  // never there, so the same link offers the whole stock instead.
  const backLabel = exploration
    ? `Voltar para ${vehicleCount(results.length)}`
    : `Ver todos os ${vehicleCount(results.length)}`;
  const backHref = `/${listingSearch}`;
  const goBack = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    // Going back through history returns to the exact exploration, scroll included, even
    // after a few similar vehicles.
    if (exploration) window.history.go(-exploration.listingDistance);
    else navigate('/');
  };

  // State for every link that goes one page further: similar vehicles and the next step.
  const onward = furtherExploration(exploration);
  const nextStep = (intent?: string) => `/veiculos/${vehicle.id}/proximo-passo${intent ? `?intencao=${intent}` : ''}`;

  // Evidence. What gets featured is decided in the data: the badge is the listing card's
  // featuredEvidence, and the summary lists summaryEvidence below it, the first one
  // highlighted. Narrow screens keep only that first one in the summary, and the trust
  // section lists everything else, so both breakpoints carry the same evidence (V1, V2).
  const badge = featuredEvidenceLabel(vehicle);
  const evidence = shownEvidence(vehicle);
  const summaryEvidence = (vehicle.summaryEvidence ?? [])
    .map((type) => evidence.find((item) => item.type === type))
    .filter((item) => item !== undefined);
  const lead = summaryEvidence[0];
  const trustOnWideOnly = evidence.every((item) => item === lead);

  const condition = conditionSummary(vehicle);
  const features = vehicle.features?.join(' · ');
  const similar = similarVehicles(vehicle, results);

  return (
    <>
      <NavigationHeader />
      <main className={cx('container', styles.main)}>
        <div className={styles.context}>
          <TextLink href={backHref} onClick={goBack}>
            {exploration ? `← ${backLabel}` : backLabel}
          </TextLink>
          {filters.map((label) => (
            <StatusBadge key={label} label={label} className={styles.wideOnly} />
          ))}
        </div>

        <div className={styles.hero}>
          <Gallery vehicle={vehicle} />

          <div ref={summary} className={styles.summary}>
            <p data-identity className={styles.eyebrow}>
              {vehicleEyebrow(vehicle)}
            </p>
            <h1 data-identity className={styles.title}>
              {vehicleTitle(vehicle)}
            </h1>
            <p data-identity className={styles.version}>
              {vehicleVersion(vehicle)}
            </p>
            {badge && <StatusBadge tone="success" label={badge} />}
            <dl className={styles.summaryAttributes}>
              {attributes([
                { label: 'ano', value: String(vehicle.year) },
                vehicle.km !== undefined && { label: 'quilometragem', value: formatKm(vehicle.km) },
                vehicle.transmission && { label: 'câmbio', value: transmissionLabel[vehicle.transmission] },
                vehicle.fuel && { label: 'combustível', value: fuelLabel[vehicle.fuel] },
              ]).map((pair) => (
                <VehicleAttribute key={pair.label} {...pair} />
              ))}
            </dl>
            <hr className={cx(styles.divider, styles.wideOnly)} />
            <div className={styles.priceGroup}>
              {/* First mention of the Tabela FIPE on the page: full name and a short explanation. */}
              <VehiclePrice
                price={vehicle.price}
                context="detail"
                reference={
                  vehicle.fipe && (
                    <>
                      Tabela FIPE: {formatPrice(vehicle.fipe.value)}
                      <InfoTip label="O que é a Tabela FIPE?">referência de preço médio de veículos no Brasil</InfoTip>
                    </>
                  )
                }
              />
              {vehicle.fipe && <p className={styles.priceNote}>{fipeComparison(vehicle)}</p>}
            </div>
            {summaryEvidence.length > 0 && (
              <ul className={styles.summaryEvidence}>
                {summaryEvidence.map((item) => (
                  <li key={item.type} className={cx(item !== lead && styles.wideOnly)}>
                    <TrustItem {...trustItemText(item)} emphasis={item === lead ? 'highlighted' : 'default'} />
                  </li>
                ))}
              </ul>
            )}
            <Link to={nextStep()} state={onward} className={buttonClassName('primary', 'md', styles.cta)}>
              Escolher próximo passo
            </Link>
            <p className={styles.note}>Seus dados só são pedidos depois que você escolher como quer continuar.</p>
          </div>
        </div>

        {evidence.length > 0 && (
          <>
            <hr className={cx(styles.divider, trustOnWideOnly && styles.wideOnly)} />
            <section className={cx(styles.trust, trustOnWideOnly && styles.wideOnly)} aria-labelledby="trust-title">
              <div className={styles.sectionHeader}>
                <h2 id="trust-title" className={styles.sectionTitle}>
                  O que já dá para conferir
                </h2>
                <p className={cx(styles.sectionText, styles.wideOnly)}>{trustSummary(evidence)}</p>
              </div>
              <ul className={styles.trustList}>
                {evidence.map((item) => (
                  <li key={item.type} className={cx(item === lead && styles.wideOnly)}>
                    <TrustItem {...trustItemText(item)} emphasis={item === lead ? 'highlighted' : 'default'} />
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}

        <hr className={styles.divider} />
        <section className={cx(styles.section, styles.details)} aria-labelledby="details-title">
          <h2 id="details-title" className={styles.sectionTitle}>
            Detalhes do veículo
          </h2>
          <dl className={styles.detailAttributes}>
            {attributes([
              { label: 'ano', value: String(vehicle.year) },
              vehicle.km !== undefined && { label: 'km', value: formatNumber(vehicle.km) },
              vehicle.transmission && { label: 'câmbio', value: transmissionLabel[vehicle.transmission] },
              vehicle.fuel && { label: 'combustível', value: fuelLabel[vehicle.fuel] },
              vehicle.color && { label: 'cor', value: colorLabel[vehicle.color] },
              vehicle.doors !== undefined && { label: 'portas', value: String(vehicle.doors) },
            ]).map((pair) => (
              <VehicleAttribute key={pair.label} {...pair} />
            ))}
          </dl>
          {condition && (
            <Disclosure title="Condição e documentação" defaultExpanded>
              <p className={styles.disclosureText}>{condition}</p>
            </Disclosure>
          )}
          {features && (
            <Disclosure title="Itens e conforto">
              <p className={styles.disclosureText}>{features}</p>
            </Disclosure>
          )}
        </section>

        <hr className={styles.divider} />
        <section className={cx(styles.section, styles.commercial)} aria-labelledby="commercial-title">
          <div className={styles.sectionHeader}>
            <h2 id="commercial-title" className={styles.sectionTitle}>
              Se este carro fizer sentido
            </h2>
            <p className={cx(styles.sectionText, styles.wideOnly)}>
              Use seu carro na troca ou consulte o financiamento deste {vehicle.model}.
            </p>
          </div>
          <ul className={styles.shortcuts}>
            <li>
              <CommercialShortcut to={nextStep('troca')} state={onward} title="Usar seu carro na troca">
                Comece avaliando seu carro para usá-lo na troca deste {vehicle.model}.
              </CommercialShortcut>
            </li>
            <li>
              <CommercialShortcut to={nextStep('financiamento')} state={onward} title="Entender o financiamento">
                Consulte as condições de financiamento deste {vehicle.model}. Pedimos informações adicionais apenas
                quando necessário.
              </CommercialShortcut>
            </li>
          </ul>
        </section>

        <hr className={styles.divider} />
        <section className={cx(styles.section, styles.similar)} aria-labelledby="similar-title">
          <div className={styles.similarHeader}>
            <div className={styles.similarCopy}>
              <h2 id="similar-title" className={styles.sectionTitle}>
                Ainda comparando?
              </h2>
              {exploration && <SimilarText filtered={filters.length > 0} hasSimilar={similar.length > 0} />}
            </div>
            <a href={backHref} onClick={goBack} className={buttonClassName('secondary', 'md', styles.similarBack)}>
              {backLabel}
            </a>
          </div>
          {similar.length > 0 && (
            <ul className={styles.similarList}>
              {similar.map((other, position) => (
                // Two on narrow screens, three on desktop, as in V2 and V1.
                <li key={other.id} className={cx(position > 1 && styles.wideOnly)}>
                  <VehicleCard
                    vehicle={other}
                    href={`/veiculos/${other.id}`}
                    linkState={onward}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      {/* Only V1 has a footer; mobile screens don't, and that is still an open point. */}
      <footer className={cx('container', styles.footer, styles.wideOnly)}>
        <Brand lockup="wordmark" tone="dark" className={styles.footerLogo} />
      </footer>
    </>
  );
}

type CommercialShortcutProps = {
  to: string;
  state: ReturnType<typeof furtherExploration>;
  title: string;
  children: ReactNode;
};

// "Usar seu carro na troca" and "Entender o financiamento" continue with this vehicle,
// opening the next step with that intent. One link per card, stretched over it.
function CommercialShortcut({ to, state, title, children }: CommercialShortcutProps) {
  return (
    <div className={styles.shortcut}>
      <Link to={to} state={state} className={styles.shortcutLink}>
        {title}
      </Link>
      <p className={styles.shortcutText}>{children}</p>
    </div>
  );
}

// "Seus filtros continuam aplicados" only when there are filters, and the similar options
// are only mentioned when there are some. Mobile keeps the first sentence (V2). Without a
// listing behind the page there are no results to go back to, so there is no text.
function SimilarText({ filtered, hasSimilar }: { filtered: boolean; hasSimilar: boolean }) {
  const resume = hasSimilar ? 'Volte aos resultados ou veja opções semelhantes.' : 'Volte aos resultados.';
  return (
    <p className={cx(styles.sectionText, !filtered && styles.wideOnly)}>
      {filtered && 'Seus filtros continuam aplicados. '}
      <span className={styles.wideOnly}>{resume}</span>
    </p>
  );
}

