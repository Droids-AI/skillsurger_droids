export default function CollegesIllustration() {
  return (
    <svg viewBox="0 0 360 360" className="w-64 h-64 sm:w-72 sm:h-72" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Graduation cap */}
      <g transform="translate(90,60)">
        <path d="M90 0l90 38-90 38-90-38z" className="fill-blue-600" />
        <path d="M40 56v40c0 14 22 26 50 26s50-12 50-26V56" className="fill-indigo-500" />
        <line x1="176" y1="38" x2="176" y2="88" className="stroke-blue-600" strokeWidth="5" strokeLinecap="round" />
        <circle cx="176" cy="94" r="7" className="fill-blue-600" />
      </g>

      {/* Bar chart */}
      <g transform="translate(70,190)">
        <rect x="0" y="60" width="34" height="70" rx="8" className="fill-blue-100" />
        <rect x="52" y="34" width="34" height="96" rx="8" className="fill-indigo-300" />
        <rect x="104" y="8" width="34" height="122" rx="8" className="fill-blue-600" />
        <rect x="156" y="46" width="34" height="84" rx="8" className="fill-indigo-200" />
      </g>

      {/* Floating accents */}
      <circle cx="55" cy="130" r="6" className="fill-blue-300 opacity-70" />
      <circle cx="300" cy="150" r="5" className="fill-indigo-300 opacity-70" />
      <circle cx="290" cy="260" r="7" className="fill-blue-200 opacity-70" />
    </svg>
  );
}
