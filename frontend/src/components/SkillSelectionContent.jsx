import { useState, useEffect } from "react";
import { SkillTag } from "./ui/SkillTag";

export function SkillSelectionContent({
  data,
  resumeJson,
  isEditable,
  onChange,
}) {
  const allSkills = resumeJson?.skills || [];
  const [selectedSet, setSelectedSet] = useState(
    () => new Set(data.selected_skills?.flatMap((cat) => cat.skills) || []),
  );

  useEffect(() => {
    if (!isEditable || !onChange) return;
    const updated = allSkills
      .map((cat) => ({
        category: cat.category,
        skills: (cat.skills || []).filter((s) => selectedSet.has(s)),
      }))
      .filter((cat) => cat.skills.length > 0);
    onChange(updated);
  }, [selectedSet, isEditable]);

  const skillCount = isEditable
    ? selectedSet.size
    : (data.selected_skills?.flatMap((c) => c.skills) || []).length;
  const categoryCount = isEditable
    ? (resumeJson?.skills || []).filter((cat) =>
        (cat.skills || []).some((s) => selectedSet.has(s)),
      ).length
    : (data.selected_skills || []).length;

  return (
    <div className="flex flex-col gap-3.5">
      <p className="text-xs font-medium text-slate-500">
        <span className="font-bold text-slate-950">{skillCount}</span> skills
        selected across{" "}
        <span className="font-bold text-slate-950">{categoryCount}</span>{" "}
        categories
      </p>
      {isEditable && (
        <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-slate-400">
          Click skills to toggle
        </p>
      )}
      {(isEditable ? allSkills : data.selected_skills || []).map((cat, i) => (
        <div key={i}>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-slate-400 mb-1.5">
            {cat.category}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {(cat.skills || []).map((s) => {
              if (isEditable) {
                const isSelected = selectedSet.has(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() =>
                      setSelectedSet((prev) => {
                        const next = new Set(prev);
                        next.has(s) ? next.delete(s) : next.add(s);
                        return next;
                      })
                    }
                    className={`inline-flex items-center px-2.5 py-[3px] rounded-full text-xs font-semibold leading-[18px] whitespace-nowrap cursor-pointer border-none transition-all duration-150 ${
                      isSelected
                        ? "bg-[hsl(220_20%_18%)] text-slate-50"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {s}
                  </button>
                );
              }
              return <SkillTag key={s} label={s} variant="dark" />;
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
