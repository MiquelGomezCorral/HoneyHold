import Icon from './Icon.js';


export default function HoneyHoldLogo({ setAboutOpen }: { setAboutOpen: (open: boolean) => void }) {
  return (
    <button className="flex items-center gap-2 cursor-pointer transition-[transform] duration-300 active:duration-75 active:scale-95" onClick={() => setAboutOpen(true)}>
      <Icon type="color" src="bee" title="HoneyHold" className="h-7 w-auto dark:hidden" />
      <Icon type="color" src="bee-accent-dark-blue" title="HoneyHold" className="h-7 w-auto hidden dark:block" />
      <span className="font-display font-semibold text-xl tracking-[-0.02em]">
        HoneyHold
        <span className="text-accent">.</span>
      </span>
    </button>
  );
}