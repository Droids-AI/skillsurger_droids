import { ReactNode } from 'react';

interface IllustrationFrameProps {
  children: ReactNode;
  className?: string;
}

export default function IllustrationFrame({ children, className = '' }: IllustrationFrameProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <div className="absolute w-72 h-72 sm:w-80 sm:h-80 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full blur-2xl opacity-80" />
      <div className="absolute -top-6 -right-2 w-4 h-4 rounded-full bg-blue-300 opacity-70" />
      <div className="absolute top-10 -left-6 w-3 h-3 rounded-full bg-indigo-300 opacity-70" />
      <div className="absolute -bottom-4 right-10 w-5 h-5 rounded-full bg-blue-200 opacity-70" />
      <div className="relative drop-shadow-2xl">{children}</div>
    </div>
  );
}
