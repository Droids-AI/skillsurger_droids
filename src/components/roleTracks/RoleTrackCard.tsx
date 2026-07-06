import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { RoleTrack } from '../../lib/constants/roleTracks';

interface RoleTrackCardProps {
  track: RoleTrack;
}

export default function RoleTrackCard({ track }: RoleTrackCardProps) {
  const Icon = track.icon;

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden flex flex-col h-full hover:shadow-xl transition-shadow duration-300">
      <div className="p-6 border-b border-gray-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-blue-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">{track.title}</h3>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
            Resume Keywords
          </p>
          <div className="flex flex-wrap gap-2">
            {track.resumeKeywords.slice(0, 4).map((kw) => (
              <span
                key={kw}
                className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
            Interview Focus
          </p>
          <p className="text-sm text-gray-700">{track.interviewFocusAreas.join(', ')}</p>
        </div>

        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
            Mock Interview
          </p>
          <p className="text-sm text-gray-700">{track.mockInterviewType}</p>
        </div>

        <div className="mb-6 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
            Job Switch Plan
          </p>
          <p className="text-sm text-gray-700">{track.jobSwitchPlanSummary}</p>
        </div>

        <Link
          to={track.seoLandingSlug ? `/${track.seoLandingSlug}` : '/free-resume-audit'}
          className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm mt-auto"
        >
          View Resume Example
          <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </div>
    </div>
  );
}
