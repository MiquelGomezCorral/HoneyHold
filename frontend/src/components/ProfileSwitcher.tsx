import { useProfile } from '../context/ProfileContext.js';

export default function ProfileSwitcher() {
  const { profiles, profileId, setProfileId } = useProfile();
  if (!profiles?.length) return null;

  return (
    <div className="inline-flex gap-0.5 p-0.5 border border-hairline rounded-[10px]" role="group" aria-label="Profile">
      {profiles.map((p) => (
        <button
          key={p.id}
          type="button"
          className={
            `border-0 bg-transparent px-3 py-[6px] rounded-lg text-muted font-medium text-sm cursor-pointer transition-colors hover:text-ink${
              p.id === profileId ? ' bg-accent-soft text-ink font-semibold' : ''
            }`
          }
          onClick={() => setProfileId(p.id)}
        >
          {p.display_name}
        </button>
      ))}
    </div>
  );
}
