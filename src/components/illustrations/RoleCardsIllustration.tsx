export default function RoleCardsIllustration() {
  return (
    <svg viewBox="0 0 360 360" className="w-64 h-64 sm:w-72 sm:h-72" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Back card */}
      <g transform="translate(70,90) rotate(-10)">
        <rect width="160" height="200" rx="18" className="fill-blue-50 stroke-blue-200" strokeWidth="2" />
        <circle cx="34" cy="36" r="16" className="fill-blue-200" />
        <rect x="60" y="28" width="70" height="14" rx="7" className="fill-blue-200" />
      </g>

      {/* Middle card */}
      <g transform="translate(95,75) rotate(2)">
        <rect width="160" height="200" rx="18" className="fill-white stroke-indigo-200" strokeWidth="2" />
        <circle cx="34" cy="36" r="16" className="fill-indigo-500" />
        <path d="M27 36l5 5 9-11" className="stroke-white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="60" y="28" width="76" height="14" rx="7" className="fill-indigo-100" />
        <rect x="24" y="70" width="112" height="8" rx="4" className="fill-gray-100" />
        <rect x="24" y="88" width="90" height="8" rx="4" className="fill-gray-100" />
        <rect x="24" y="120" width="60" height="20" rx="10" className="fill-blue-50" />
        <rect x="92" y="120" width="44" height="20" rx="10" className="fill-blue-50" />
      </g>

      {/* Front card */}
      <g transform="translate(120,110) rotate(10)">
        <rect width="150" height="180" rx="18" className="fill-blue-600" />
        <circle cx="32" cy="34" r="15" className="fill-white" />
        <path d="M26 34h12M32 28v12" className="stroke-blue-600" strokeWidth="2.5" strokeLinecap="round" />
        <rect x="56" y="26" width="70" height="14" rx="7" className="fill-white opacity-90" />
        <rect x="22" y="68" width="106" height="8" rx="4" className="fill-white opacity-40" />
        <rect x="22" y="86" width="80" height="8" rx="4" className="fill-white opacity-40" />
      </g>

      {/* Floating accents */}
      <circle cx="300" cy="90" r="6" className="fill-indigo-300 opacity-70" />
      <circle cx="55" cy="270" r="5" className="fill-blue-300 opacity-70" />
      <circle cx="310" cy="250" r="4" className="fill-blue-200 opacity-70" />
    </svg>
  );
}
