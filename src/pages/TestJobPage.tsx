import { useState, type FormEvent } from 'react';
import SEO from '../components/SEO';

// First-party test job for the Anchor pilot. Submissions go only to Skillsurger's private test inbox,
// and only for an approved automated test run. Field ids/names are the reviewed task's selectors.
const FN = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/skillsurger-test-board`;

export default function TestJobPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<{ reference: string; actionId: string } | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      const response = await fetch(FN, { method: 'POST', headers: { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY }, body: new FormData(event.currentTarget) });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.confirmation_reference) setReceipt({ reference: data.confirmation_reference, actionId: data.action_id });
      else setError(data.error === 'not_an_authorized_test_application'
        ? 'This test form only accepts approved Skillsurger test applications.'
        : 'Could not submit. Check the fields and try again.');
    } catch { setError('Could not submit. Try again.'); }
    finally { setBusy(false); }
  }

  const input = 'mt-1 w-full rounded-md border border-gray-300 px-3 py-2';
  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <SEO title="Test job | Skillsurger" description="Internal test job for Skillsurger's application automation." canonicalUrl="/qa/test-job" noIndex={true} />
      <div className="container mx-auto px-4 py-10">
        <div className="mx-auto max-w-2xl rounded-lg bg-white p-6 shadow">
          <p className="mb-3 rounded bg-amber-50 px-3 py-2 text-sm text-amber-900">Internal test job. Not a real vacancy: applications here stay inside Skillsurger and reach no employer.</p>
          <h1 className="text-2xl font-bold">QA Test Role (Skillsurger internal)</h1>
          <p className="mt-1 text-gray-600">Skillsurger · Remote · Test posting</p>
          <p className="mt-4 text-gray-700">This posting exists to check that approved applications are filled in and submitted correctly. Apply with your approved CV.</p>

          {receipt ? (
            <div id="result" role="status" className="mt-6 rounded bg-green-50 p-4 text-green-900">
              <p id="receipt" data-receipt={receipt.reference} data-action-id={receipt.actionId}>Application received. Reference: <strong>{receipt.reference}</strong></p>
            </div>
          ) : (
            <form id="application" onSubmit={(e) => void submit(e)} className="mt-6 space-y-4">
              <input type="hidden" id="idempotency-key" name="idempotency_key" />
              <label className="block text-sm font-medium">Full name<input id="full-name" name="full_name" required className={input} /></label>
              <label className="block text-sm font-medium">Email<input id="email" name="email" type="email" required className={input} /></label>
              <label className="block text-sm font-medium">Phone<input id="phone" name="phone" required className={input} /></label>
              <label className="block text-sm font-medium">Cover note<textarea id="cover-note" name="cover_note" rows={5} className={input} /></label>
              <label className="block text-sm font-medium">CV (PDF)<input id="resume" name="resume" type="file" accept="application/pdf" required className="mt-1 block w-full text-sm" /></label>
              {error && <p className="text-sm text-red-700">{error}</p>}
              <button id="submit-application" type="submit" disabled={busy} className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-60">{busy ? 'Submitting…' : 'Submit application'}</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
