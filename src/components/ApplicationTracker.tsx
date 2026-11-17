import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ClipboardList, Video } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ApplicationPipeline from './ApplicationPipeline';

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

const STATUS_STYLE: Record<Status, string> = {
  saved: 'border-gray-300 bg-white text-gray-800',
  applied: 'border-blue-300 bg-blue-50 text-blue-800',
  interviewing: 'border-violet-300 bg-violet-50 text-violet-800',
  offer: 'border-green-300 bg-green-50 text-green-800',
  rejected: 'border-red-200 bg-red-50 text-red-700',
  withdrawn: 'border-gray-200 bg-gray-50 text-gray-500',
};

const formatDate = (value: string) => new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

export default function ApplicationTracker() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<TrackedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

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
        Track each saved job, review your CV and approve applications. Browser submissions require a supported board and your explicit approval; other applications stay manual.
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
          <ul className="space-y-3">
            {jobs.map(job => {
              const open = openId === job.id;
              return (
              <li key={job.id} className={`rounded-xl border transition-colors ${open ? 'border-blue-200 bg-blue-50/30 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
               <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-900" title={job.title}>{job.title}</p>
                  <p className="truncate text-sm text-gray-600" title={job.company}>
                    {job.company}{job.location ? ` · ${job.location}` : ''} · {job.status_updated_at ? `updated ${formatDate(job.status_updated_at)}` : `saved ${formatDate(job.created_at)}`}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 md:flex-nowrap md:shrink-0">
                  {job.status === 'interviewing' && (
                    <button
                      type="button"
                      onClick={() => navigate(`/dashboard?section=mentorship&job=${encodeURIComponent(job.id)}`)}
                      className="inline-flex min-h-10 items-center rounded-lg px-2 text-sm font-medium text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                    >
                      <Video className="mr-1 h-4 w-4" aria-hidden="true" />
                      Practise this interview
                    </button>
                  )}
                  <label className="sr-only" htmlFor={`status-${job.id}`}>Status for {job.title} at {job.company}</label>
                  <div className="relative w-36 shrink-0">
                    <select
                      id={`status-${job.id}`}
                      value={job.status}
                      disabled={savingId === job.id}
                      onChange={event => void updateStatus(job, event.target.value as Status)}
                      className={`min-h-10 w-full cursor-pointer appearance-none rounded-lg border py-2 pl-3 pr-9 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-wait disabled:opacity-60 ${STATUS_STYLE[job.status]}`}
                    >
                      {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60" aria-hidden="true" />
                  </div>
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={`pipeline-${job.id}`}
                    onClick={() => setOpenId(open ? null : job.id)}
                    className={`inline-flex min-h-10 w-44 shrink-0 items-center justify-center gap-1 rounded-lg border px-3 text-sm font-medium transition-colors ${open ? 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50' : 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700'}`}
                  >
                    {open ? 'Hide' : 'Prepare application'}
                    <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
                  </button>
                </div>
               </div>
               {open && <div id={`pipeline-${job.id}`} className="border-t border-blue-100 px-4 pb-4"><ApplicationPipeline job={job} /></div>}
              </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
