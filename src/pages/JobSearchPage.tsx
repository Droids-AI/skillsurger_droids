import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { findJobOpportunities } from '../lib/careerServices';
import type { JobOpportunity } from '../lib/careerServices';
import { Briefcase, MapPin, Building, Clock, CircleDollarSign, Link as LinkIcon, AlertTriangle, Loader2, Search } from 'lucide-react';
import SEO from '../components/SEO';
import Button from '../components/Button';
import { supabase } from '../lib/supabase';

const JobSearchPage = () => {
  const [jobs, setJobs] = useState<JobOpportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobTitle, setJobTitle] = useState('');
  const [jobLocation, setJobLocation] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthStatus();
    const searchParams = new URLSearchParams(location.search);
    const titleParam = searchParams.get('title');
    const locationParam = searchParams.get('location');

    if (titleParam) {
      setJobTitle(titleParam);
      setJobLocation(locationParam || '');
      fetchJobs(titleParam, locationParam);
    } else {
      setLoading(false);
    }
  }, [location.search]);

  const checkAuthStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsLoggedIn(!!session?.user);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim()) {
      setError('Please enter a job title');
      return;
    }
    setError(null);
    const params = new URLSearchParams();
    params.set('title', jobTitle.trim());
    if (jobLocation.trim()) {
      params.set('location', jobLocation.trim());
    }
    navigate(`/job-search?${params.toString()}`);
    // The useEffect will handle fetching jobs when the URL changes
  };

  const handleApply = (job: JobOpportunity) => {
    if (!isLoggedIn) {
      navigate('/signup');
      return;
    }
    if (job.applicationUrl) {
      window.open(job.applicationUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const fetchJobs = async (title: string, loc: string | null) => {
    setLoading(true);
    setError(null);
    try {
      // We need to create a context object that matches what findJobOpportunities expects.
      // Since we only have title and location from the URL, we'll create a minimal context.
      const jobSearchContext = {
        jobTitle: title,
        location: { city: loc || '' },
        workPreferences: { remotePreference: 'no_preference' },
        // Add other properties with default values if needed by the function
        profile: { yearsOfExperience: 0 },
        countryCode: 'us' // Default to US, could be enhanced to detect from user profile
      };
      const opportunities = await findJobOpportunities(jobSearchContext);
      setJobs(opportunities);
    } catch (err) {
      setError('Failed to fetch job opportunities.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 pt-24">
      <SEO 
        title="Free Job Search | Skillsurger"
        description="Search for job opportunities that match your skills and interests"
        canonicalUrl="/job-search"
      />
      <div className="max-w-4xl mx-auto mb-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Free Job Search</h1>
        
        {/* Search Form */}
        <form onSubmit={handleSearch} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-2">
                Job Title *
              </label>
              <input
                type="text"
                id="jobTitle"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g., Software Engineer, Data Scientist"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div className="flex-1">
              <label htmlFor="jobLocation" className="block text-sm font-medium text-gray-700 mb-2">
                Location (Optional)
              </label>
              <input
                type="text"
                id="jobLocation"
                value={jobLocation}
                onChange={(e) => setJobLocation(e.target.value)}
                placeholder="e.g., New York, Remote"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-end">
              <Button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto px-8"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Search Jobs
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
        </div>
      ) : error ? (
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-10 px-4 sm:px-6 lg:px-8 bg-red-50 border-l-4 border-red-400">
            <div className="flex justify-center">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
            <p className="mt-3 text-lg text-red-700">{error}</p>
          </div>
        </div>
      ) : jobs.length > 0 ? (
        <div className="max-w-4xl mx-auto">
          <div className="mb-4">
            <p className="text-gray-600">Found {jobs.length} job{jobs.length !== 1 ? 's' : ''} matching your search</p>
          </div>
          <div className="space-y-6">
            {jobs.map((job, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-300">
                <div className="flex flex-col sm:flex-row justify-between">
                  <div className="flex-grow">
                    <h2 className="text-xl font-semibold text-blue-600">{job.title}</h2>
                    <div className="flex items-center text-gray-600 mt-2">
                      <Building className="h-5 w-5 mr-2" />
                      <span>{job.company}</span>
                    </div>
                    <div className="flex items-center text-gray-600 mt-1">
                      <MapPin className="h-5 w-5 mr-2" />
                      <span>{job.location}</span>
                    </div>
                  </div>
                  <div className="mt-4 sm:mt-0 sm:ml-4 flex-shrink-0">
                    <button
                      onClick={() => handleApply(job)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Apply
                      <LinkIcon className="ml-2 -mr-1 h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-gray-700">{job.description}</p>
                  {job.requirements && job.requirements.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-semibold text-gray-800">Requirements:</h4>
                      <ul className="list-disc list-inside mt-2 text-gray-600 space-y-1">
                        {job.requirements.map((req, i) => (
                          <li key={i}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500">
                    {job.type && <div className="flex items-center"><Briefcase className="h-4 w-4 mr-1.5" /> {job.type}</div>}
                    {job.salary && <div className="flex items-center"><CircleDollarSign className="h-4 w-4 mr-1.5" /> {job.salary}</div>}
                    {job.postedDate && <div className="flex items-center"><Clock className="h-4 w-4 mr-1.5" /> {job.postedDate}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : jobs.length === 0 && !loading && jobTitle ? (
        <div className="max-w-4xl mx-auto text-center py-10">
          <p className="text-lg text-gray-500">No jobs found matching your criteria.</p>
          <p className="text-sm text-gray-400 mt-2">Try adjusting your search terms or location.</p>
        </div>
      ) : null}
    </div>
  );
};

export default JobSearchPage; 