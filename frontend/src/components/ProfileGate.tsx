import { useProfile } from '../context/ProfileContext.js';
import Button from './Button.js';

export default function ProfileGate() {
  const { profiles, setProfileId } = useProfile();

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-6 text-center">
      <span className="font-display font-semibold text-[34px] tracking-[-0.02em]">
        HoneyHold<span className="text-accent">.</span>
      </span>
      <p className="my-[14px] mb-7 text-muted">Who is keeping the books?</p>
      <div className="flex gap-3 flex-wrap justify-center">
        {profiles?.map((p) => (
          <Button key={p.id} variant="outline" onClick={() => setProfileId(p.id)}>
            {p.display_name}
          </Button>
        ))}
      </div>
      <p className="mt-[26px] text-[13px] text-muted">You can switch profiles any time from the top bar.</p>
    </div>
  );
}
