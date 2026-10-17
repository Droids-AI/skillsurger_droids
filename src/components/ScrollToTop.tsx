import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      // Pages load on demand, so the target may appear a moment after navigation.
      let frame = 0;
      const deadline = Date.now() + 3000;
      const tryScroll = () => {
        const target = document.getElementById(decodeURIComponent(hash.slice(1)));
        if (target) target.scrollIntoView();
        else if (Date.now() < deadline) frame = requestAnimationFrame(tryScroll);
      };
      frame = requestAnimationFrame(tryScroll);
      return () => cancelAnimationFrame(frame);
    }
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' as ScrollBehavior
    });
  }, [pathname, hash]);

  return null;
}
