import { useProfile } from '../context/ProfileContext.js';
import { useI18n } from '../i18n.js';
import SegmentedControl from './SegmentedControl.js';

export default function ProfileSwitcher() {
  const { profiles, profileId, setProfileId } = useProfile();
  const { t } = useI18n();
  if (!profiles?.length) return null;

  return (
    <SegmentedControl
      ariaLabel={t('common.profile')}
      items={profiles.map((p) => ({ value: String(p.id), label: p.display_name }))}
      value={String(profileId)}
      onChange={(v) => setProfileId(Number(v))}
    />
  );
}
