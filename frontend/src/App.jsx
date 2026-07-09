import { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useProfile } from './context/ProfileContext.jsx';
import { useIsMobile } from './hooks/useIsMobile.js';
import NavBar from './components/NavBar.jsx';
import ProfileGate from './components/ProfileGate.jsx';
import TransactionModal from './features/transactions/TransactionModal.jsx';
import DashboardView from './features/dashboard/DashboardView.jsx';
import TransactionsView from './features/transactions/TransactionsView.jsx';
import InboxView from './features/inbox/InboxView.jsx';
import MobileHome from './features/mobile/MobileHome.jsx';

export default function App() {
  const { profiles, profileId, loadError } = useProfile();
  const isMobile = useIsMobile();
  const [modal, setModal] = useState(null);

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

  const openAdd = (type = 'expense') => setModal({ type });

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
