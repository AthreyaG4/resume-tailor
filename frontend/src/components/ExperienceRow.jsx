import { ChevronRight, Trash2 } from "lucide-react";

const COMPLETION_FIELDS = [
  { key: "description", weight: 1 },
  { key: "seniority_ownership", weight: 2 },
  { key: "responsibilities", weight: 2, isList: true },
  { key: "technical_decisions", weight: 2 },
  { key: "achievements", weight: 2, isList: true },
  { key: "challenges_learnings", weight: 1 },
];
const TOTAL_WEIGHT = COMPLETION_FIELDS.reduce((s, f) => s + f.weight, 0);

export function getExperienceCompletion(exp) {
  let filled = 0;
  for (const f of COMPLETION_FIELDS) {
    const val = exp[f.key];
    if (f.isList ? (val?.length ?? 0) > 0 : !!val) filled += f.weight;
  }
  return Math.round((filled / TOTAL_WEIGHT) * 100);
}

function completionColor(pct) {
  if (pct < 33) return "#ef4444";
  if (pct < 66) return "#f59e0b";
  return "#10b981";
}

function dateRange(exp) {
  const parts = [exp.start_date, exp.end_date].filter(Boolean);
  return parts.length ? parts.join(" – ") : null;
}

export function ExperienceRow({ experience, onClick, onDelete }) {
  const pct = getExperienceCompletion(experience);
  const color = completionColor(pct);
  const range = dateRange(experience);

  return (
    <div className="group flex items-center gap-4 px-4 py-3.5 bg-white border border-[hsl(220_10%_92%)] rounded-2xl hover:border-slate-300 hover:shadow-[0_2px_8px_-3px_rgba(0,0,0,0.08)] transition-all">
      <button
        type="button"
        onClick={onClick}
        className="flex-1 min-w-0 flex items-center gap-4 text-left bg-transparent border-none cursor-pointer p-0"
      >
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-slate-900 truncate">
            {experience.role || "Untitled Role"}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5 truncate">
            {[experience.company, range].filter(Boolean).join(" · ")}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${pct}%`, background: color }}
            />
          </div>
          <span
            className="text-[11px] font-bold w-[72px] text-right"
            style={{ color }}
          >
            {pct}% complete
          </span>
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
        </div>
      </button>

      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="shrink-0 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
