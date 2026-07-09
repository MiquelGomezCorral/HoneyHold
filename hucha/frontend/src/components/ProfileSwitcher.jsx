import { useProfile } from '../context/ProfileContext.jsx';

// Segmented control in the top bar: switching profile swaps the active data
// scope — the views themselves never change.
export default function ProfileSwitcher() {
  const { profiles, profileId, setProfileId } = useProfile();
  if (!profiles?.length) return null;

  return (
    <div className="seg" role="group" aria-label="Profile">
      {profiles.map((p) => (
        <button
          key={p.id}
          type="button"
          className={p.id === profileId ? 'on' : ''}
          onClick={() => setProfileId(p.id)}
        >
          {p.display_name}
        </button>
      ))}
    </div>
  );
}
