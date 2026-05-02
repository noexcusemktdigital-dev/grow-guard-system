import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { analytics } from './analytics';

/**
 * Auto-track page views ao mudar de rota.
 * Inserir no App.tsx dentro do BrowserRouter.
 */
export function AnalyticsPageTracker() {
  const location = useLocation();
  useEffect(() => {
    analytics.page(location.pathname, { search: location.search });
  }, [location.pathname, location.search]);
  return null;
}
