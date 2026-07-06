export default function ResumeAuditIllustration() {
  return (
    <svg viewBox="0 0 360 360" className="w-64 h-64 sm:w-72 sm:h-72" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Document */}
      <rect x="80" y="50" width="170" height="230" rx="18" className="fill-white stroke-blue-200" strokeWidth="2" />
      <rect x="104" y="82" width="90" height="14" rx="7" className="fill-blue-600" />
      <rect x="104" y="112" width="120" height="8" rx="4" className="fill-blue-100" />
      <rect x="104" y="132" width="100" height="8" rx="4" className="fill-blue-100" />
      <rect x="104" y="152" width="110" height="8" rx="4" className="fill-blue-100" />
      <rect x="104" y="182" width="70" height="8" rx="4" className="fill-indigo-100" />
      <rect x="104" y="202" width="95" height="8" rx="4" className="fill-indigo-100" />
      <rect x="104" y="222" width="60" height="8" rx="4" className="fill-indigo-100" />

      {/* Check badges beside lines */}
      <circle cx="228" cy="116" r="8" className="fill-green-500" />
      <path d="M225 116l2 2 4-5" className="stroke-white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="228" cy="156" r="8" className="fill-green-500" />
      <path d="M225 156l2 2 4-5" className="stroke-white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Score badge */}
      <circle cx="255" cy="60" r="34" className="fill-indigo-600" />
      <text x="255" y="67" textAnchor="middle" className="fill-white font-bold" fontSize="24">92</text>

      {/* Magnifying glass */}
      <circle cx="270" cy="255" r="46" className="fill-white stroke-blue-600" strokeWidth="9" />
      <line x1="303" y1="288" x2="330" y2="315" className="stroke-blue-600" strokeWidth="13" strokeLinecap="round" />
      <path d="M250 255a20 20 0 0120-20" className="stroke-blue-300" strokeWidth="5" strokeLinecap="round" fill="none" />

      {/* Floating accents */}
      <circle cx="55" cy="300" r="6" className="fill-blue-300 opacity-70" />
      <circle cx="300" cy="180" r="5" className="fill-indigo-300 opacity-70" />
      <circle cx="60" cy="150" r="4" className="fill-blue-300 opacity-60" />
    </svg>
  );
}
