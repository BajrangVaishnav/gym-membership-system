import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { FitDeskProvider } from './store/useFitDeskStore';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { ToastContainer } from './components/ui/ToastContainer';

const LandingPage = React.lazy(() =>
  import('./pages/LandingPage').then((m) => ({ default: m.LandingPage }))
);
const DashboardOverview = React.lazy(() =>
  import('./pages/DashboardOverview').then((m) => ({ default: m.DashboardOverview }))
);
const MembersPage = React.lazy(() =>
  import('./pages/MembersPage').then((m) => ({ default: m.MembersPage }))
);
const PlansPage = React.lazy(() =>
  import('./pages/PlansPage').then((m) => ({ default: m.PlansPage }))
);
const AttendancePage = React.lazy(() =>
  import('./pages/AttendancePage').then((m) => ({ default: m.AttendancePage }))
);
const PaymentsPage = React.lazy(() =>
  import('./pages/PaymentsPage').then((m) => ({ default: m.PaymentsPage }))
);

function normalizeRoute(hashOrPath: string): string {
  const cleaned = hashOrPath.replace(/^#/, '') || '/';
  if (
    cleaned === '/' ||
    cleaned === '/dashboard' ||
    cleaned === '/dashboard/members' ||
    cleaned === '/dashboard/plans' ||
    cleaned === '/dashboard/attendance' ||
    cleaned === '/dashboard/payments'
  ) {
    return cleaned;
  }
  return '/';
}

function PageSkeleton() {
  return (
    <div className="space-y-4 p-6" aria-busy="true" aria-label="Loading view">
      <div className="h-8 w-56 animate-pulse rounded-xl bg-[#171D28]" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-[#171D28]" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-2xl bg-[#171D28]" />
    </div>
  );
}

export function App() {
  const [route, setRoute] = useState<string>(() =>
    normalizeRoute(window.location.hash || window.location.pathname)
  );

  useEffect(() => {
    const onHashChange = () => {
      setRoute(normalizeRoute(window.location.hash));
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = useCallback((target: string) => {
    const next = normalizeRoute(target);
    window.location.hash = next === '/' ? '' : `#${next}`;
    setRoute(next);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const isDashboard = route.startsWith('/dashboard');

  return (
    <FitDeskProvider>
      <Suspense fallback={<PageSkeleton />}>
        {!isDashboard ? (
          <LandingPage onNavigate={navigate} />
        ) : (
          <DashboardLayout currentRoute={route} onNavigate={navigate}>
            {route === '/dashboard' && <DashboardOverview onNavigate={navigate} />}
            {route === '/dashboard/members' && <MembersPage />}
            {route === '/dashboard/plans' && <PlansPage />}
            {route === '/dashboard/attendance' && <AttendancePage />}
            {route === '/dashboard/payments' && <PaymentsPage />}
          </DashboardLayout>
        )}
      </Suspense>
      <ToastContainer />
    </FitDeskProvider>
  );
}

export default App;
