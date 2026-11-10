import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Video } from 'lucide-react';
import { supabase } from '../lib/supabase';

// Status of each saved job, set by the user. Nothing here is applied or sent automatically.
const STATUSES = [
  { value: 'saved', label: 'Saved' },
  { value: 'applied', label: 'Applied' },
  { value: 'interviewing', label: 'Interviewing' },
  { value: 'offer', label: 'Offer' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
] as const;
type Status = typeof STATUSES[number]['value'];

interface TrackedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  status: Status;
  status_updated_at: string | null;
  created_at: string;
}

const formatDate = (value: string) => new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

export default function ApplicationTracker() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<TrackedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  async function load() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error: loadError } = await supabase
        .from('saved_jobs')
        .select('id, title, company, location, status, status_updated_at, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (loadError) throw loadError;
      setJobs((data || []) as TrackedJob[]);
      setError('');
    } catch {
      setError('Could not load your saved jobs. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    const refresh = () => { void load(); };
    window.addEventListener('saved-jobs-changed', refresh);
    return () => window.removeEventListener('saved-jobs-changed', refresh);
  }, []);

  async function updateStatus(job: TrackedJob, status: Status) {
    const previous = jobs;
    const now = new Date().toISOString();
    setSavingId(job.id);
    setJobs(current => current.map(item => item.id === job.id ? { ...item, status, status_updated_at: now } : item));
    const { error: saveError } = await supabase.from('saved_jobs').update({ status, status_updated_at: now }).eq('id', job.id);
    if (saveError) {
      setJobs(previous);
      setError('Could not update that status. Please try again.');
    } else {
      setError('');
    }
    setSavingId(null);
  }

  if (loading) return null;

  const counts = STATUSES.map(s => ({ ...s, count: jobs.filter(job => job.status === s.value).length }));

  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6" aria-labelledby="application-tracker-heading">
      <div className="flex items-center mb-1">
        <ClipboardList className="w-5 h-5 mr-2 text-blue-600" aria-hidden="true" />
        <h2 id="application-tracker-heading" className="text-lg font-semibold text-gray-900">My applications</h2>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Track each saved job as you apply. You update the status yourself; nothing is applied for you.
      </p>

      {error && <p role="alert" className="text-sm text-red-600 mb-3">{error}</p>}

      {jobs.length === 0 ? (
        <p className="text-sm text-gray-500">No saved jobs yet. Use <strong>Find Jobs Based on Profile</strong> below and click <strong>Save Job</strong> to start tracking.</p>
      ) : (
        <>
          <ul className="flex flex-wrap gap-2 mb-4" aria-label="Applications by status">
            {counts.filter(s => s.count > 0).map(s => (
              <li key={s.value} className="text-xs font-medium bg-gray-100 text-gray-700 rounded-full px-3 py-1">
                {s.label}: {s.count}
              </li>
            ))}
          </ul>
          <ul className="divide-y divide-gray-100">
            {jobs.map(job => (
              <li key={job.id} className="py-3 flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{job.title}</p>
                  <p className="text-sm text-gray-600 truncate">
                    {job.company}{job.location ? ` · ${job.location}` : ''} · {job.status_updated_at ? `updated ${formatDate(job.status_updated_at)}` : `saved ${formatDate(job.created_at)}`}
                  </p>
                </div>
                {job.status === 'interviewing' && (
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard?section=mentorship')}
                    className="inline-flex items-center text-sm text-blue-700 hover:text-blue-800 font-medium"
                  >
                    <Video className="w-4 h-4 mr-1" aria-hidden="true" />
                    Practise this interview
                  </button>
                )}
                <label className="sr-only" htmlFor={`status-${job.id}`}>Status for {job.title} at {job.company}</label>
                <select
                  id={`status-${job.id}`}
                  value={job.status}
                  disabled={savingId === job.id}
                  onChange={event => void updateStatus(job, event.target.value as Status)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
