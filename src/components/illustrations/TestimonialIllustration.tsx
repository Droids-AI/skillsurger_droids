export default function TestimonialIllustration() {
  return (
    <svg viewBox="0 0 360 360" className="w-64 h-64 sm:w-72 sm:h-72" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Speech bubble */}
      <path
        d="M70 70h190a20 20 0 0120 20v110a20 20 0 01-20 20H150l-40 36v-36H70a20 20 0 01-20-20V90a20 20 0 0120-20z"
        className="fill-white stroke-blue-200"
        strokeWidth="2"
      />
      {/* Stars */}
      {[0, 1, 2, 3, 4].map((i) => (
        <path
          key={i}
          transform={`translate(${100 + i * 32},110)`}
          d="M8 0l2.2 4.8 5.3.5-4 3.6 1.1 5.2L8 11.3 3.4 14.1l1.1-5.2-4-3.6 5.3-.5z"
          className="fill-yellow-400"
        />
      ))}
      {/* Quote lines */}
      <rect x="100" y="140" width="150" height="8" rx="4" className="fill-blue-100" />
      <rect x="100" y="158" width="120" height="8" rx="4" className="fill-blue-100" />
      <rect x="100" y="176" width="90" height="8" rx="4" className="fill-blue-100" />

      {/* Person avatar */}
      <g transform="translate(230,230)">
        <circle cx="40" cy="40" r="40" className="fill-indigo-100" />
        <circle cx="40" cy="30" r="14" className="fill-indigo-500" />
        <path d="M14 66a26 26 0 0152 0" className="fill-indigo-500" />
      </g>

      {/* Small rating badge */}
      <circle cx="90" cy="260" r="26" className="fill-blue-600" />
      <text x="90" y="267" textAnchor="middle" className="fill-white font-bold" fontSize="18">5.0</text>

      {/* Floating accents */}
      <circle cx="55" cy="140" r="5" className="fill-blue-300 opacity-70" />
      <circle cx="310" cy="120" r="6" className="fill-indigo-300 opacity-70" />
    </svg>
  );
}
