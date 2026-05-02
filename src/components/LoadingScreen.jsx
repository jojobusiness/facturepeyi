export default function LoadingScreen({ message = "Chargement..." }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-5">
        <div className="relative w-14 h-14">
          <div className="w-14 h-14 rounded-2xl bg-[#0d1b3e] flex items-center justify-center">
            <span className="text-emerald-400 font-black text-xl">F</span>
          </div>
          <svg
            className="absolute -inset-1.5 w-17 h-17 animate-spin"
            style={{ width: "68px", height: "68px", top: "-3px", left: "-3px", position: "absolute" }}
            viewBox="0 0 68 68"
            fill="none"
          >
            <circle cx="34" cy="34" r="30" stroke="#e5e7eb" strokeWidth="3" />
            <path
              d="M34 4 a30 30 0 0 1 26 15"
              stroke="#10b981"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div className="text-center">
          <div className="font-black text-[#0d1b3e] text-lg tracking-tight">Factur'Peyi</div>
          <div className="text-sm text-gray-400 mt-1">{message}</div>
        </div>
      </div>
    </div>
  );
}
