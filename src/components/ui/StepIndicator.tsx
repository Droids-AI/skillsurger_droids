import { LucideIcon } from 'lucide-react';

interface StepIndicatorProps {
  number: string;
  title: string;
  description: string;
  icon: LucideIcon;
  isLast?: boolean;
}

export default function StepIndicator({
  number,
  title,
  description,
  icon: Icon,
  isLast = false,
}: StepIndicatorProps) {
  return (
    <div className="relative flex flex-col items-center text-center">
      {/* Connecting line for desktop */}
      {!isLast && (
        <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 transform translate-x-1/2 z-0" />
      )}

      {/* Step number circle */}
      <div className="relative z-10 w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mb-4 shadow-lg">
        <div className="text-white text-2xl font-bold">{number}</div>
      </div>

      {/* Icon */}
      <div className="mb-3">
        <Icon className="w-8 h-8 text-blue-600" />
      </div>

      {/* Content */}
      <h3 className="text-xl font-semibold mb-2 text-gray-900">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
