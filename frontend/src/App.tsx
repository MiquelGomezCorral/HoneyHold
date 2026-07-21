import { useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useProfile } from './context/ProfileContext.js';
import { useIsMobile } from './hooks/useIsMobile.js';
import { I18nProvider, getPreferredLocale, localeFromPathname, useI18n, withLocalePath } from './i18n.js';
import NavBar from './components/NavBar.js';
import ProfileGate from './components/ProfileGate.js';
import TransactionModal from './features/transactions/TransactionModal.js';
import DashboardView from './features/dashboard/DashboardView.js';
import MonthlyView from './features/monthly/MonthlyView.js';
import TransactionsView from './features/transactions/TransactionsView.js';
import InboxView from './features/inbox/InboxView.js';
import MobileHome from './features/mobile/MobileHome.js';
import type { EntryType } from './types.js';
import type { Locale } from './i18n.js';

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const locale = localeFromPathname(location.pathname);

  if (!locale) {
    const nextPath = withLocalePath(getPreferredLocale(), location.pathname);
    return <Navigate to={`${nextPath}${location.search}${location.hash}`} replace />;
  }

  function setLocale(nextLocale: Locale) {
    const nextPath = withLocalePath(nextLocale, location.pathname);
    navigate(`${nextPath}${location.search}${location.hash}`);
  }

  return (
    <I18nProvider locale={locale} onLocaleChange={setLocale}>
      <LocalizedApp locale={locale} />
    </I18nProvider>
  );
}

function LocalizedApp({ locale }: { locale: Locale }) {
  const { profiles, profileId, loadError } = useProfile();
  const { t } = useI18n();
  const isMobile = useIsMobile();
  const [modal, setModal] = useState<{ type: EntryType } | null>(null);

  if (loadError) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-6 text-center">
        <p>{t('app.apiError', { error: loadError })}</p>
        <p className="text-muted text-sm">{t('app.apiHelp', { command: 'docker compose up' })}</p>
      </div>
    );
  }
  if (profiles === null) return <div className="min-h-dvh flex flex-col items-center justify-center p-6 text-center">{t('app.openingBooks')}</div>;
  if (!profileId) return <ProfileGate />;

  function openAdd(type: EntryType = 'expense') { setModal({ type }); }

  return (
    <>
      {isMobile ? (
        <MobileHome onAdd={openAdd} />
      ) : (
        <div>
          <NavBar locale={locale} onAdd={() => openAdd('expense')} />
          <main className="max-w-5xl mx-auto px-8 pb-24 pt-2.5">
            <Routes>
              <Route path={`/${locale}`} element={<DashboardView />} />
              <Route path={`/${locale}/monthly`} element={<MonthlyView />} />
              <Route path={`/${locale}/transactions`} element={<TransactionsView />} />
              <Route path={`/${locale}/inbox`} element={<InboxView />} />
              <Route path={`/${locale}/*`} element={<Navigate to={`/${locale}`} replace />} />
            </Routes>
          </main>
        </div>
      )}

      {modal && <TransactionModal defaultType={modal.type} onClose={() => setModal(null)} />}
    </>
  );
}
