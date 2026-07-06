export default function BookingIllustration() {
  return (
    <svg viewBox="0 0 360 360" className="w-64 h-64 sm:w-72 sm:h-72" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Calendar body */}
      <rect x="60" y="80" width="200" height="180" rx="18" className="fill-white stroke-blue-200" strokeWidth="2" />
      <rect x="60" y="80" width="200" height="46" rx="18" className="fill-blue-600" />
      <rect x="60" y="108" width="200" height="18" className="fill-blue-600" />
      <rect x="92" y="66" width="10" height="28" rx="5" className="fill-indigo-500" />
      <rect x="218" y="66" width="10" height="28" rx="5" className="fill-indigo-500" />

      {/* Grid dots representing days */}
      {[0, 1, 2, 3, 4, 5].map((row) =>
        [0, 1, 2, 3, 4].map((col) => {
          const isHighlighted = row === 2 && col === 2;
          return (
            <circle
              key={`${row}-${col}`}
              cx={92 + col * 32}
              cy={150 + row * 18}
              r={isHighlighted ? 12 : 5}
              className={isHighlighted ? 'fill-blue-600' : 'fill-blue-100'}
            />
          );
        })
      )}

      {/* Clock overlapping bottom-right */}
      <circle cx="270" cy="270" r="46" className="fill-white stroke-indigo-500" strokeWidth="8" />
      <path d="M270 270V244M270 270l18 14" className="stroke-indigo-500" strokeWidth="6" strokeLinecap="round" />

      {/* Floating accents */}
      <circle cx="50" cy="270" r="6" className="fill-blue-300 opacity-70" />
      <circle cx="300" cy="90" r="5" className="fill-indigo-300 opacity-70" />
    </svg>
  );
}
