import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Link2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

// Job board accounts connected through Anchor's hosted sign-in. Hidden entirely until the
// backend flag FF_SKILLSURGER_CONNECT is on (the /sites call returns 404 while it is off).
// Connections stay "awaiting verification" until the ownership check is resolved; nothing is
// applied or sent on the user's behalf from here.

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/anchor-connect`;

interface Connection { site: string; status: string; connected_at: string }

const STATUS_TEXT: Record<string, string> = {
  pending_verification: 'Connected, awaiting verification',
  active: 'Connected',
  failed: 'Sign-in failed. Please reconnect',
};

const LANDING_TEXT: Record<string, { text: string; ok: boolean }> = {
  pending_verification: { text: 'Account connected. We will verify it before anything can be submitted for you.', ok: true },
  expired: { text: 'That connection link expired. Please try again.', ok: false },
  failed: { text: 'We could not connect that account. Please try again.', ok: false },
  invalid: { text: 'That connection link was not valid. Please try again.', ok: false },
  unavailable: { text: 'Job board connections are not available yet.', ok: false },
};

async function call(path: string, init: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Please sign in again');
  return fetch(`${FUNCTION_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${session.access_token}`,
    },
  });
}

export default function JobBoardConnections() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [enabled, setEnabled] = useState(false);
  const [sites, setSites] = useState<string[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const landing = searchParams.get('connect');

  async function load() {
    try {
      const response = await call('/sites');
      if (response.status === 404) { setEnabled(false); return; }
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || 'Could not load job boards');
      setSites(data.sites || []);
      setConnections(data.connections || []);
      setEnabled(true);
    } catch {
      setEnabled(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function connect(site: string) {
    setBusy(site); setError('');
    try {
      const response = await call('/start', { method: 'POST', body: JSON.stringify({ site }) });
      const data = await response.json();
      if (!response.ok || !data.redirect_url) throw new Error(data?.error?.message || 'Could not start the connection');
      window.location.assign(data.redirect_url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start the connection');
      setBusy(null);
    }
  }

  async function disconnect(site: string) {
    setBusy(site); setError('');
    try {
      const response = await call('/disconnect', { method: 'POST', body: JSON.stringify({ site }) });
      if (!response.ok) throw new Error('Could not disconnect');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not disconnect');
    } finally {
      setBusy(null);
    }
  }

  if (!enabled && !landing) return null;

  const dismissLanding = () => { searchParams.delete('connect'); setSearchParams(searchParams, { replace: true }); };
  const notice = landing ? LANDING_TEXT[landing] : undefined;

  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6" aria-labelledby="job-board-heading">
      <div className="flex items-center mb-1">
        <Link2 className="w-5 h-5 mr-2 text-blue-600" aria-hidden="true" />
        <h2 id="job-board-heading" className="text-lg font-semibold text-gray-900">Job board accounts</h2>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Connect a job board account through our secure sign-in partner. Skillsurger never sees your password, and nothing is submitted without your approval.
      </p>
      {notice && (
        <div role="status" className={`text-sm rounded-lg px-3 py-2 mb-3 flex justify-between gap-3 ${notice.ok ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-800'}`}>
          <span>{notice.text}</span>
          <button type="button" onClick={dismissLanding} className="underline">Dismiss</button>
        </div>
      )}
      {error && <p role="alert" className="text-sm text-red-600 mb-3">{error}</p>}
      {enabled && (
        <ul className="divide-y divide-gray-100">
          {sites.map(site => {
            const connection = connections.find(c => c.site === site && c.status !== 'deleted');
            return (
              <li key={site} className="py-3 flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{site}</p>
                  <p className="text-sm text-gray-600">{connection ? STATUS_TEXT[connection.status] || connection.status : 'Not connected'}</p>
                </div>
                {connection && connection.status !== 'failed' ? (
                  <button type="button" disabled={busy === site} onClick={() => void disconnect(site)}
                    className="text-sm border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50 disabled:opacity-50">
                    Disconnect
                  </button>
                ) : (
                  <button type="button" disabled={busy === site} onClick={() => void connect(site)}
                    className="text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-2 disabled:opacity-50">
                    {busy === site ? 'Opening…' : connection ? 'Reconnect' : 'Connect'}
                  </button>
                )}
              </li>
            );
          })}
          {sites.length === 0 && <li className="py-3 text-sm text-gray-500">No job boards are available yet.</li>}
        </ul>
      )}
    </section>
  );
}
