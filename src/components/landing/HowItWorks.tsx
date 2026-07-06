import { Upload, ClipboardCheck, Edit, Mail, Video, TrendingUp } from 'lucide-react';
import StepIndicator from '../ui/StepIndicator';

const steps = [
  {
    number: '01',
    title: 'Upload',
    description: 'Upload your resume for a free audit',
    icon: Upload,
  },
  {
    number: '02',
    title: 'Audit',
    description: 'See ATS gaps, role-fit, and keyword issues',
    icon: ClipboardCheck,
  },
  {
    number: '03',
    title: 'Tailor',
    description: 'Tailor your resume and track applications',
    icon: Edit,
  },
  {
    number: '04',
    title: 'Outreach',
    description: 'Message recruiters with proven templates',
    icon: Mail,
  },
  {
    number: '05',
    title: 'Interview',
    description: 'Role-specific mock interview prep',
    icon: Video,
  },
  {
    number: '06',
    title: 'Improve',
    description: 'Iterate every week with a clear pipeline',
    icon: TrendingUp,
  },
];

export default function HowItWorks() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900">
            How Skillsurger Works
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Get job-ready in 6 simple steps
          </p>
        </div>

        {/* Desktop: single-row horizontal timeline */}
        <div className="hidden md:grid md:grid-cols-6 gap-4 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <StepIndicator
              key={index}
              number={step.number}
              title={step.title}
              description={step.description}
              icon={step.icon}
              isLast={index === steps.length - 1}
            />
          ))}
        </div>

        {/* Mobile: Vertical timeline */}
        <div className="md:hidden space-y-8 max-w-md mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
                  <div className="text-white text-lg font-bold">{step.number}</div>
                </div>
                {index < steps.length - 1 && (
                  <div className="w-0.5 h-16 bg-gradient-to-b from-blue-600 to-purple-600 my-2" />
                )}
              </div>
              <div className="flex-1 pt-3">
                <step.icon className="w-6 h-6 text-blue-600 mb-2" />
                <h3 className="text-lg font-semibold mb-1 text-gray-900">
                  {step.title}
                </h3>
                <p className="text-gray-600 text-sm">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
