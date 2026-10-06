// A small history-based router. The app has two kinds of pages and the listing keeps its
// whole exploration state in the URL, so that's all routing needs to do:
// - push: going somewhere new starts at the top of the page;
// - replace: refining the listing updates the URL without adding history entries;
// - back/forward: the page comes back where it was scrolled.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type AnchorHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from 'react';

type Location = { pathname: string; search: string };
// initial: the page was loaded or reloaded here. pop: back/forward. Motion that explains
// an in-app move only runs on push; pop and initial land directly.
export type Navigation = 'initial' | 'push' | 'replace' | 'pop';

type NavigateOptions = { replace?: boolean; state?: Record<string, unknown> };

type Router = {
  location: Location;
  navigation: Navigation;
  navigate: (to: string, options?: NavigateOptions) => void;
};

const RouterContext = createContext<Router | null>(null);

const currentLocation = (): Location => ({ pathname: window.location.pathname, search: window.location.search });

export function RouterProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ location: Location; navigation: Navigation }>(() => ({
    location: currentLocation(),
    navigation: 'initial',
  }));

  useEffect(() => {
    window.history.scrollRestoration = 'manual';
    const onPopState = () => setState({ location: currentLocation(), navigation: 'pop' });
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((to: string, options?: NavigateOptions) => {
    if (options?.replace) {
      window.history.replaceState(window.history.state, '', to);
      setState({ location: currentLocation(), navigation: 'replace' });
      return;
    }
    // Remember where this page was scrolled, for when the person comes back to it.
    window.history.replaceState({ ...window.history.state, scrollY: window.scrollY }, '');
    window.history.pushState(options?.state ?? {}, '', to);
    setState({ location: currentLocation(), navigation: 'push' });
  }, []);

  // Runs after the new page has rendered, so the restored position exists.
  useLayoutEffect(() => {
    if (state.navigation === 'push') window.scrollTo(0, 0);
    if (state.navigation === 'pop' || state.navigation === 'initial') window.scrollTo(0, window.history.state?.scrollY ?? 0);
  }, [state]);

  const router = useMemo(
    () => ({ location: state.location, navigation: state.navigation, navigate }),
    [state.location, state.navigation, navigate],
  );
  return <RouterContext.Provider value={router}>{children}</RouterContext.Provider>;
}

export function useRouter() {
  const router = useContext(RouterContext);
  if (!router) throw new Error('useRouter needs a RouterProvider');
  return router;
}

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { to: string; state?: NavigateOptions['state'] };

// A plain link that navigates inside the app. Modified clicks (new tab, etc.) keep the
// browser's behavior.
export function Link({ to, state, onClick, ...props }: LinkProps) {
  const { navigate } = useRouter();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    navigate(to, { state });
  };

  return <a href={to} onClick={handleClick} {...props} />;
}
