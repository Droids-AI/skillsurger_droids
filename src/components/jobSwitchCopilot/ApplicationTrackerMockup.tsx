interface TrackerRow {
  company: string;
  resumeVersion: string;
  status: string;
  statusColor: string;
  recruiterContacted: string;
  followUpDate: string;
  interviewStage: string;
  notes: string;
}

const sampleRows: TrackerRow[] = [
  {
    company: 'TechCorp Solutions',
    resumeVersion: 'v3 — Backend focus',
    status: 'Interviewing',
    statusColor: 'bg-blue-100 text-blue-700',
    recruiterContacted: 'Yes',
    followUpDate: 'Jul 10',
    interviewStage: 'Round 2 — System Design',
    notes: 'Strong fit, asked for salary expectations',
  },
  {
    company: 'CloudScale Inc',
    resumeVersion: 'v2 — Cloud/DevOps',
    status: 'Applied',
    statusColor: 'bg-gray-100 text-gray-700',
    recruiterContacted: 'No',
    followUpDate: 'Jul 8',
    interviewStage: '—',
    notes: 'Follow up via LinkedIn if no response',
  },
  {
    company: 'DataFlow Systems',
    resumeVersion: 'v3 — Backend focus',
    status: 'Offer',
    statusColor: 'bg-green-100 text-green-700',
    recruiterContacted: 'Yes',
    followUpDate: '—',
    interviewStage: 'Completed',
    notes: 'Negotiating compensation',
  },
  {
    company: 'NimbusTech',
    resumeVersion: 'v1 — Generic',
    status: 'Rejected',
    statusColor: 'bg-red-100 text-red-700',
    recruiterContacted: 'Yes',
    followUpDate: '—',
    interviewStage: 'Round 1 — Screening',
    notes: 'Role required more cloud experience',
  },
];

interface ApplicationTrackerMockupProps {
  compact?: boolean;
}

export default function ApplicationTrackerMockup({ compact = false }: ApplicationTrackerMockupProps) {
  if (compact) {
    const rows = sampleRows.slice(0, 3);
    return (
      <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-300" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-300" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-300" />
          </div>
          <h3 className="font-semibold text-gray-700 text-sm">Application Tracker</h3>
          <span className="text-[10px] font-semibold uppercase tracking-wider bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full whitespace-nowrap">
            Sample
          </span>
        </div>
        <div className="divide-y divide-gray-100">
          {rows.map((row) => (
            <div key={row.company} className="px-5 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{row.company}</p>
                <p className="text-xs text-gray-500 truncate">{row.interviewStage}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${row.statusColor}`}>
                {row.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-bold text-gray-900">Application Tracker</h3>
        <span className="text-xs font-semibold uppercase tracking-wider bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
          Sample data — illustrative preview
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-200">
              <th className="px-4 py-3 font-medium whitespace-nowrap">Company</th>
              <th className="px-4 py-3 font-medium whitespace-nowrap">Resume Version</th>
              <th className="px-4 py-3 font-medium whitespace-nowrap">Status</th>
              <th className="px-4 py-3 font-medium whitespace-nowrap">Recruiter Contacted</th>
              <th className="px-4 py-3 font-medium whitespace-nowrap">Follow-up Date</th>
              <th className="px-4 py-3 font-medium whitespace-nowrap">Interview Stage</th>
              <th className="px-4 py-3 font-medium whitespace-nowrap">Notes</th>
            </tr>
          </thead>
          <tbody>
            {sampleRows.map((row) => (
              <tr key={row.company} className="border-b border-gray-100 last:border-0">
                <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{row.company}</td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{row.resumeVersion}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${row.statusColor}`}>
                    {row.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{row.recruiterContacted}</td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{row.followUpDate}</td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{row.interviewStage}</td>
                <td className="px-4 py-3 text-gray-500 max-w-xs">{row.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
