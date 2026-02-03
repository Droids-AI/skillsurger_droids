import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface GradientCardProps {
  children: ReactNode;
  className?: string;
  gradient?: 'blue-purple' | 'purple-blue' | 'blue' | 'purple';
  hover?: boolean;
}

export default function GradientCard({
  children,
  className,
  gradient = 'blue-purple',
  hover = true,
}: GradientCardProps) {
  const gradientClasses = {
    'blue-purple': 'bg-gradient-to-br from-blue-600 to-purple-600',
    'purple-blue': 'bg-gradient-to-br from-purple-600 to-blue-600',
    blue: 'bg-gradient-to-br from-blue-600 to-blue-700',
    purple: 'bg-gradient-to-br from-purple-600 to-purple-700',
  };

  return (
    <div
      className={cn(
        'rounded-lg p-6 shadow-lg',
        gradientClasses[gradient],
        hover && 'transition-all duration-300 hover:shadow-xl hover:scale-105',
        className
      )}
    >
      {children}
    </div>
  );
}
