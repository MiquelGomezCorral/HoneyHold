import { useProfile } from '../context/ProfileContext.js';
import { useI18n } from '../i18n.js';
import Button from './Button.js';
import ThemeToggle from './ThemeToggle.js';

export default function ProfileGate() {
  const { profiles, setProfileId } = useProfile();
  const { t } = useI18n();

  return (
    <div className="relative min-h-dvh flex flex-col items-center justify-center p-6 text-center">
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>
      <span className="font-display font-semibold text-3xl tracking-[-0.02em]">
        HoneyHold<span className="text-accent">.</span>
      </span>
      <p className="my-[14px] mb-7 text-muted">{t('profileGate.question')}</p>
      <div className="flex gap-3 flex-wrap justify-center">
        {profiles?.map((p) => (
          <Button key={p.id} variant="outline" onClick={() => setProfileId(p.id)}>
            {p.display_name}
          </Button>
        ))}
      </div>
      <p className="mt-[26px] text-xs text-muted">{t('profileGate.hint')}</p>
    </div>
  );
}
