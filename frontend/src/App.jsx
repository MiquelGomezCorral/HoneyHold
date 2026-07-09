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
  const [modal, setModal] = useState(null); // { type: 'income' | 'expense' } | null

  if (loadError) {
    return (
      <div className="boot">
        <p>Can't reach the API ({loadError}).</p>
        <p className="empty">Is the backend container running? Try <code>docker compose up</code>, then reload.</p>
      </div>
    );
  }
  if (profiles === null) return <div className="boot">Opening the books…</div>;
  if (!profileId) return <ProfileGate />;

  const openAdd = (type = 'expense') => setModal({ type });

  return (
    <>
      {isMobile ? (
        // Mobile is deliberately radical: the balance and fast entry, nothing else.
        <MobileHome onAdd={openAdd} />
      ) : (
        <div className="shell">
          <NavBar onAdd={() => openAdd('expense')} />
          <main className="page">
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
