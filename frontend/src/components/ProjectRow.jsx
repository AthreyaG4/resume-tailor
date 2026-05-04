import { ChevronRight, Trash2 } from "lucide-react";

const COMPLETION_FIELDS = [
  { key: "description", weight: 1 },
  { key: "technical_decisions", weight: 2 },
  { key: "challenges", weight: 2 },
  { key: "achievements", weight: 1, isList: true },
  { key: "role", weight: 1 },
];
const TOTAL_WEIGHT = COMPLETION_FIELDS.reduce((s, f) => s + f.weight, 0);

export function getProjectCompletion(project) {
  let filled = 0;
  for (const f of COMPLETION_FIELDS) {
    const val = project[f.key];
    if (f.isList ? (val?.length ?? 0) > 0 : !!val) filled += f.weight;
  }
  return Math.round((filled / TOTAL_WEIGHT) * 100);
}

function completionColor(pct) {
  if (pct < 33) return "#ef4444";
  if (pct < 66) return "#f59e0b";
  return "#10b981";
}

export function ProjectRow({ project, onClick, onDelete }) {
  const pct = getProjectCompletion(project);
  const color = completionColor(pct);
  const chips = project.technologies?.slice(0, 3) ?? [];
  const extra = (project.technologies?.length ?? 0) - 3;

  return (
    <div className="group flex items-center gap-4 px-4 py-3.5 bg-white border border-[hsl(220_10%_92%)] rounded-2xl hover:border-slate-300 hover:shadow-[0_2px_8px_-3px_rgba(0,0,0,0.08)] transition-all">
      {/* Clickable area */}
      <button
        type="button"
        onClick={onClick}
        className="flex-1 min-w-0 flex items-center gap-4 text-left bg-transparent border-none cursor-pointer p-0"
      >
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-slate-900 truncate">
            {project.title || "Untitled Project"}
          </p>
          {chips.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {chips.map((t) => (
                <span
                  key={t}
                  className="text-[11px] font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full"
                >
                  {t}
                </span>
              ))}
              {extra > 0 && (
                <span className="text-[11px] font-medium px-2 py-0.5 bg-slate-100 text-slate-400 rounded-full">
                  +{extra}
                </span>
              )}
            </div>
          )}
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

      {/* Delete button */}
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
