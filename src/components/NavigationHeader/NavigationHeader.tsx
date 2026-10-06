import { cx } from '../../lib/cx';
import { Link, useRouter } from '../../lib/router';
import { Brand } from '../Brand/Brand';
import styles from './NavigationHeader.module.css';

// Navigation / Header. "Lojas" and "Atendimento" have no destination yet, so they show
// but don't link anywhere.
export function NavigationHeader() {
  const { location } = useRouter();
  return (
    <header className={styles.header}>
      <div className={cx('container', styles.inner)}>
        <Link to="/" className={styles.home}>
          <Brand lockup="wordmark" tone="light" className={styles.logo} />
        </Link>
        <nav aria-label="Principal">
          <ul className={styles.list}>
            <li>
              <Link to="/" className={cx(styles.item, styles.current)} aria-current={location.pathname === '/' ? 'page' : 'true'}>
                Seminovos
              </Link>
            </li>
            <li>
              <span className={styles.item}>Lojas</span>
            </li>
            <li>
              <span className={styles.item}>Atendimento</span>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
