export default function PipelineIllustration() {
  return (
    <svg viewBox="0 0 360 360" className="w-64 h-64 sm:w-72 sm:h-72" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Connecting path */}
      <path
        d="M90 260 C 130 220, 150 220, 175 190 S 230 130, 270 100"
        className="stroke-blue-200"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray="2 16"
        fill="none"
      />

      {/* Stage 1: Resume */}
      <g transform="translate(50,225) rotate(-6)">
        <rect width="110" height="80" rx="16" className="fill-white stroke-blue-200" strokeWidth="2" />
        <rect x="16" y="18" width="50" height="8" rx="4" className="fill-blue-600" />
        <rect x="16" y="34" width="70" height="6" rx="3" className="fill-blue-100" />
        <rect x="16" y="48" width="60" height="6" rx="3" className="fill-blue-100" />
        <circle cx="90" cy="20" r="10" className="fill-blue-600" />
      </g>

      {/* Stage 2: Tracker */}
      <g transform="translate(150,155) rotate(-4)">
        <rect width="120" height="80" rx="16" className="fill-white stroke-indigo-200" strokeWidth="2" />
        <rect x="14" y="16" width="92" height="10" rx="5" className="fill-indigo-100" />
        <rect x="14" y="34" width="60" height="10" rx="5" className="fill-indigo-500" />
        <rect x="14" y="52" width="76" height="10" rx="5" className="fill-indigo-100" />
      </g>

      {/* Stage 3: Interview */}
      <g transform="translate(230,70) rotate(-6)">
        <rect width="100" height="80" rx="16" className="fill-blue-600" />
        <circle cx="50" cy="34" r="16" className="fill-white" />
        <path d="M50 30v8M46 34h8" className="stroke-blue-600" strokeWidth="3" strokeLinecap="round" />
        <rect x="24" y="58" width="52" height="8" rx="4" className="fill-white opacity-80" />
      </g>

      {/* Floating accents */}
      <circle cx="60" cy="120" r="6" className="fill-blue-300 opacity-70" />
      <circle cx="300" cy="220" r="5" className="fill-indigo-300 opacity-70" />
      <circle cx="310" cy="290" r="7" className="fill-blue-200 opacity-70" />
    </svg>
  );
}
