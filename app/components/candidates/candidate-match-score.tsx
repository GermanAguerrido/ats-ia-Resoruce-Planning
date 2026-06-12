export function CandidateMatchScore({ score }: { score: number }) {
    const label =
      score >= 85
        ? "Excellent"
        : score >= 70
        ? "Strong"
        : score >= 55
        ? "Potential"
        : "Low";
  
    const color =
      score >= 85
        ? "bg-emerald-500 text-emerald-400"
        : score >= 70
        ? "bg-yellow-500 text-yellow-400"
        : score >= 55
        ? "bg-orange-500 text-orange-400"
        : "bg-red-500 text-red-400";
  
    const [barColor, textColor] = color.split(" ");
  
    return (
      <div className="w-28">
        <div className="flex items-center justify-between">
          <span className={`text-sm font-semibold ${textColor}`}>{score}%</span>
          <span className="text-xs text-zinc-500">{label}</span>
        </div>
  
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full ${barColor}`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
    );
  }