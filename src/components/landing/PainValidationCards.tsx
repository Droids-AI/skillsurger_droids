import { FileText, Briefcase, Video } from 'lucide-react';

const painPoints = [
  {
    icon: FileText,
    title: 'Scan & Improve CV Score',
    description:
      'Upload your resume and get an instant ATS score with actionable fixes to stand out',
    color: 'blue',
  },
  {
    icon: Briefcase,
    title: 'Find Job Matches That Fit YOU',
    description:
      'AI matches you with real jobs from 500+ companies based on your skills and goals',
    color: 'purple',
  },
  {
    icon: Video,
    title: 'Practice Mock Interviews & Get Feedback',
    description:
      'Record answers, get AI feedback on speech, confidence, and content—just like a real interview',
    color: 'indigo',
  },
];

export default function PainValidationCards() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900">
            What our AI shows you
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Everything you need to land your next job, powered by AI
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {painPoints.map((point, index) => {
            const Icon = point.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                <div className="mb-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                </div>

                <h3 className="text-xl font-semibold mb-3 text-gray-900">
                  {point.title}
                </h3>
                <p className="text-gray-600">{point.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
