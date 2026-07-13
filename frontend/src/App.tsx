import { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useProfile } from './context/ProfileContext.js';
import { useIsMobile } from './hooks/useIsMobile.js';
import NavBar from './components/NavBar.js';
import ProfileGate from './components/ProfileGate.js';
import TransactionModal from './features/transactions/TransactionModal.js';
import DashboardView from './features/dashboard/DashboardView.js';
import MonthlyView from './features/monthly/MonthlyView.js';
import TransactionsView from './features/transactions/TransactionsView.js';
import InboxView from './features/inbox/InboxView.js';
import MobileHome from './features/mobile/MobileHome.js';
import type { EntryType } from './types.js';

export default function App() {
  const { profiles, profileId, loadError } = useProfile();
  const isMobile = useIsMobile();
  const [modal, setModal] = useState<{ type: EntryType } | null>(null);

  if (loadError) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-6 text-center">
        <p>{`Can't reach the API (${loadError}).`}</p>
        <p className="text-muted text-sm">Is the backend container running? Try <code>docker compose up</code>, then reload.</p>
      </div>
    );
  }
  if (profiles === null) return <div className="min-h-dvh flex flex-col items-center justify-center p-6 text-center">Opening the books…</div>;
  if (!profileId) return <ProfileGate />;

  function openAdd(type: EntryType = 'expense') { setModal({ type }); }

  return (
    <>
      {isMobile ? (
        <MobileHome onAdd={openAdd} />
      ) : (
        <div>
          <NavBar onAdd={() => openAdd('expense')} />
          <main className="max-w-[1040px] mx-auto px-8 pb-24 pt-2.5">
            <Routes>
              <Route path="/" element={<DashboardView />} />
              <Route path="/monthly" element={<MonthlyView />} />
              <Route path="/transactions" element={<TransactionsView />} />
              <Route path="/inbox" element={<InboxView />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      )}

      {modal && <TransactionModal defaultType={modal.type} onClose={() => setModal(null)} />}
    </>
  );
}
