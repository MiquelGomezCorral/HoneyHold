import { useProfile } from '../context/ProfileContext.jsx';

// First-load screen: pick who is keeping the books. No passwords by design —
// a profile is a data scope, not an identity.
export default function ProfileGate() {
  const { profiles, setProfileId } = useProfile();

  return (
    <div className="gate">
      <span className="wordmark gate-mark">
        hucha<span className="dot">.</span>
      </span>
      <p className="gate-lead">Who is keeping the books?</p>
      <div className="gate-choices">
        {profiles.map((p) => (
          <button key={p.id} type="button" onClick={() => setProfileId(p.id)}>
            {p.display_name}
          </button>
        ))}
      </div>
      <p className="gate-note">You can switch profiles any time from the top bar.</p>
    </div>
  );
}
