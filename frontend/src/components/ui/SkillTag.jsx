const variants = {
  neutral: "bg-slate-50 text-slate-600 border border-slate-200",
  ghost:   "bg-slate-100 text-slate-400 border border-slate-300",
  matched: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  missing: "bg-rose-50 text-rose-700 border border-rose-200",
  dark:    "bg-[hsl(220_20%_18%)] text-slate-50 border border-[hsl(220_20%_18%)]",
  green:   "bg-emerald-50 text-emerald-700 border border-emerald-200",
  purple:  "bg-violet-50 text-violet-700 border border-violet-300",
  blue:    "bg-blue-50 text-blue-700 border border-blue-200",
  gray:    "bg-slate-50 text-slate-500 border border-slate-300",
  amber:   "bg-amber-50 text-amber-700 border border-amber-200",
};

export function SkillTag({ label, variant = "neutral" }) {
  const cls = variants[variant] || variants.neutral;
  return (
    <span className={`inline-flex items-center px-2.5 py-[3px] rounded-full text-xs font-semibold leading-[18px] whitespace-nowrap ${cls}`}>
      {label}
    </span>
  );
}
