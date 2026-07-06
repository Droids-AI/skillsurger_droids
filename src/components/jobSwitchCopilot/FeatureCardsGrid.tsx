import { jobSwitchCopilotFeatures } from '../../lib/constants/jobSwitchCopilotFeatures';

export default function FeatureCardsGrid() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {jobSwitchCopilotFeatures.map((feature) => {
        const Icon = feature.icon;
        return (
          <div
            key={feature.id}
            className="group p-6 bg-gray-50 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-100 transition-all duration-300 hover:-translate-y-1 h-full"
          >
            <div className="inline-flex p-3 rounded-lg bg-blue-100 text-blue-600 mb-4 group-hover:scale-110 transition-transform duration-300">
              <Icon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900">{feature.title}</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
          </div>
        );
      })}
    </div>
  );
}
