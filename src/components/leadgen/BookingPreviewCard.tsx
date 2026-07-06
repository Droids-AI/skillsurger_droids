import { Calendar, Clock, CheckCircle2 } from 'lucide-react';

export default function BookingPreviewCard() {
  return (
    <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-300" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-300" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-300" />
        </div>
        <h3 className="font-semibold text-gray-700 text-sm">Career Diagnosis Call</h3>
        <span className="text-[10px] font-semibold uppercase tracking-wider bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full whitespace-nowrap">
          Sample
        </span>
      </div>
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Thursday, 10 July</p>
            <p className="text-xs text-gray-500">Preferred slot</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Weekday evenings</p>
            <p className="text-xs text-gray-500">20-30 minutes</p>
          </div>
        </div>
        <div className="flex items-center gap-2 pt-3 border-t border-gray-100 text-green-700">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">Call request received</p>
        </div>
      </div>
    </div>
  );
}
