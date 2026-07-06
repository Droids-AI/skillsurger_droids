import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

const gapItems = [
  { label: 'ATS Score', value: '62 / 100', tone: 'warning' as const },
  { label: 'Role-Fit Score', value: '71 / 100', tone: 'warning' as const },
  { label: 'Resume Structure', value: 'Non-standard section headings found', tone: 'error' as const },
  { label: 'Keyword Gaps', value: '6 missing keywords for target role', tone: 'error' as const },
  { label: 'Missing Impact Metrics', value: '4 of 6 bullet points lack numbers', tone: 'warning' as const },
  { label: 'Weak Bullet Points', value: '3 bullet points read as responsibilities, not impact', tone: 'error' as const },
  { label: 'LinkedIn Alignment', value: 'Headline does not match target role', tone: 'warning' as const },
];

const toneStyles: Record<string, { icon: typeof CheckCircle2; color: string }> = {
  good: { icon: CheckCircle2, color: 'text-green-600' },
  warning: { icon: AlertTriangle, color: 'text-yellow-600' },
  error: { icon: XCircle, color: 'text-red-600' },
};

interface ResumeAuditReportPreviewProps {
  compact?: boolean;
}

export default function ResumeAuditReportPreview({ compact = false }: ResumeAuditReportPreviewProps) {
  if (compact) {
    const topItems = gapItems.slice(1, 4);
    return (
      <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-300" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-300" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-300" />
          </div>
          <h3 className="font-semibold text-gray-700 text-sm">Resume Audit</h3>
          <span className="text-[10px] font-semibold uppercase tracking-wider bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full whitespace-nowrap">
            Sample
          </span>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-full border-4 border-yellow-400 flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-gray-900">62</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">ATS Score</p>
              <p className="text-xs text-gray-500">out of 100 — needs improvement</p>
            </div>
          </div>
          <div className="space-y-3">
            {topItems.map((item) => {
              const { icon: Icon, color } = toneStyles[item.tone];
              return (
                <div key={item.label} className="flex items-start gap-2">
                  <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${color}`} />
                  <p className="text-xs text-gray-600">{item.label}: {item.value}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-bold text-gray-900">Resume Audit Report Preview</h3>
        <span className="text-xs font-semibold uppercase tracking-wider bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
          Sample report — actual results vary
        </span>
      </div>

      <div className="p-6 space-y-4">
        {gapItems.map((item) => {
          const { icon: Icon, color } = toneStyles[item.tone];
          return (
            <div key={item.label} className="flex items-start gap-3">
              <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${color}`} />
              <div>
                <p className="font-semibold text-gray-900 text-sm">{item.label}</p>
                <p className="text-sm text-gray-600">{item.value}</p>
              </div>
            </div>
          );
        })}

        <div className="pt-4 border-t border-gray-200">
          <p className="font-semibold text-gray-900 text-sm mb-2">Priority Action Plan</p>
          <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
            <li>Rewrite top 3 bullet points around measurable impact</li>
            <li>Add 6 missing target-role keywords naturally into experience section</li>
            <li>Standardize section headings for ATS compatibility</li>
            <li>Update LinkedIn headline to match target role positioning</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
