import { useEffect, useState } from 'react';

const QUERY = '(max-width: 640px)';

// Mobile gets a radically simplified shell (balance + fast entry),
// so the switch lives in JS, not just CSS.
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(QUERY).matches);

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    const onChange = (e) => setIsMobile(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return isMobile;
}
