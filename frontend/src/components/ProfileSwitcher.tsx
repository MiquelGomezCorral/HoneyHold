import { useProfile } from '../context/ProfileContext.js';
import SegmentedControl from './SegmentedControl.js';

export default function ProfileSwitcher() {
  const { profiles, profileId, setProfileId } = useProfile();
  if (!profiles?.length) return null;

  return (
    <SegmentedControl
      ariaLabel="Profile"
      items={profiles.map((p) => ({ value: String(p.id), label: p.display_name }))}
      value={String(profileId)}
      onChange={(v) => setProfileId(Number(v))}
    />
  );
}
