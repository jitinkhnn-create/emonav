interface Props {
  active: boolean;
}

export default function ListeningIndicator({ active }: Props) {
  return (
    <div className="relative flex h-72 w-72 items-center justify-center">
      {/* Outermost pulse ring */}
      <span
        className={`absolute inset-0 rounded-full border-2 transition-colors duration-500 ${
          active ? 'border-greenBright/40 animate-pulse' : 'border-white/8'
        }`}
      />
      {/* Middle ring */}
      <span
        className={`absolute inset-8 rounded-full border transition-colors duration-500 ${
          active ? 'border-greenBright/25 animate-pulse' : 'border-white/6'
        }`}
        style={{ animationDelay: '200ms' }}
      />
      {/* Inner ring */}
      <span
        className={`absolute inset-16 rounded-full border transition-colors duration-500 ${
          active ? 'border-greenBright/18 animate-pulse' : 'border-white/4'
        }`}
        style={{ animationDelay: '400ms' }}
      />
      {/* Center circle with mic */}
      <span
        className={`relative flex h-28 w-28 items-center justify-center rounded-full transition-all duration-500 ${
          active
            ? 'bg-greenDeep border-2 border-greenBright/60 shadow-lg shadow-greenBright/20'
            : 'bg-white/6 border border-white/18'
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={`h-12 w-12 transition-colors duration-300 ${active ? 'text-greenPale' : 'text-textMuted'}`}
        >
          <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" />
          <path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 6.709v2.291h3a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h3v-2.291a6.751 6.751 0 0 1-6-6.709v-1.5A.75.75 0 0 1 6 10.5Z" />
        </svg>
      </span>
      {/* Status label */}
      <span
        className={`absolute bottom-2 text-sm font-medium tracking-widest transition-colors duration-300 ${
          active ? 'text-greenPale' : 'text-textMuted'
        }`}
      >
        {active ? 'Listening...' : 'Ready'}
      </span>
    </div>
  );
}
