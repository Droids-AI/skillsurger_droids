import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { toolsItems, platformItems, companyItems } from '../lib/constants/navigation';
import { supabase } from '../lib/supabase';

interface MobileNavigationProps { isOpen: boolean; onClose: () => void; }

export default function MobileNavigation({ isOpen, onClose }: MobileNavigationProps) {
  const location = useLocation();
  const panel = useRef<HTMLDivElement>(null);
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSignedIn(!!session));
    return () => subscription.unsubscribe();
  }, []);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => { close.current(); }, [location.pathname, location.search]);
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close.current();
      if (event.key === 'Tab') {
        const items = panel.current?.querySelectorAll<HTMLElement>('a, button');
        if (!items?.length) return;
        const first = items[0], last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', keydown);
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', keydown); previous?.focus({ preventScroll: true }); };
  }, [isOpen]);
  return <div
    aria-hidden={!isOpen}
    {...(!isOpen ? { inert: '' } : {})}
    className={`fixed inset-0 z-[60] overflow-hidden lg:hidden transition-[visibility] duration-0 motion-reduce:delay-0 ${isOpen ? 'visible delay-0' : 'invisible delay-300 pointer-events-none'}`}
  >
    <div className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ease-in-out motion-reduce:transition-none ${isOpen ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />
    <div ref={panel} id="mobile-navigation" role="dialog" aria-modal="true" aria-label="Main menu" className={`absolute inset-y-0 right-0 w-80 max-w-full bg-white shadow-xl overflow-y-auto transform will-change-transform transition-transform duration-300 ease-in-out motion-reduce:transition-none ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-xl font-bold">Menu</h2>
        <button onClick={onClose} aria-label="Close menu" className="p-2 rounded-lg hover:bg-gray-100"><X /></button>
      </div>
      <nav className="p-4" aria-label="Mobile navigation">
        <Link to="/" onClick={onClose} className="block px-3 py-3 font-semibold">Home</Link>
        <Link to="/job-search-bootcamp" onClick={onClose} className="block px-3 py-3 font-semibold rounded-lg hover:bg-blue-50 text-gray-800">Job Switch Copilot</Link>
        {[{ label: 'Platform', items: platformItems }, { label: 'Tools', items: toolsItems }, { label: 'Company', items: companyItems }].map(group => <div key={group.label} className="mb-5">
          <h3 className="px-3 py-2 text-xs uppercase tracking-wider text-gray-500 font-bold">{group.label}</h3>
          {group.items.map(item => <Link key={item.href} to={item.href} onClick={onClose} className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-blue-50 text-gray-800"><item.icon className="w-5 h-5 text-blue-600" />{item.label}</Link>)}
        </div>)}
        {signedIn ? (
          <Link to="/dashboard" onClick={onClose} className="block py-3 text-center bg-blue-600 text-white font-semibold rounded-lg">Dashboard</Link>
        ) : (
          <>
            <Link to="/login" onClick={onClose} className="block py-3 text-center border rounded-lg">Log in</Link>
            <Link to="/signup" onClick={onClose} className="block py-3 mt-3 text-center bg-blue-600 text-white rounded-lg">Get Started</Link>
          </>
        )}
      </nav>
    </div>
  </div>;
}
