export default function PartnershipIllustration() {
  return (
    <svg viewBox="0 0 360 360" className="w-64 h-64 sm:w-72 sm:h-72" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Interlocking rounded squares */}
      <rect x="60" y="110" width="140" height="140" rx="28" className="fill-blue-100" />
      <rect x="160" y="110" width="140" height="140" rx="28" className="fill-blue-600 opacity-90" />

      {/* Link circle in overlap */}
      <circle cx="180" cy="180" r="34" className="fill-white stroke-indigo-500" strokeWidth="6" />
      <path d="M168 180h24M180 168v24" className="stroke-indigo-500" strokeWidth="5" strokeLinecap="round" />

      {/* Upward growth arrow */}
      <g transform="translate(130,60)">
        <path d="M0 60L30 30l20 20 50-50" className="stroke-indigo-500" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M78 12h22v22" className="stroke-indigo-500" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>

      {/* Floating accents */}
      <circle cx="55" cy="270" r="6" className="fill-blue-300 opacity-70" />
      <circle cx="300" cy="270" r="5" className="fill-indigo-300 opacity-70" />
      <circle cx="300" cy="90" r="4" className="fill-blue-200 opacity-70" />
    </svg>
  );
}
