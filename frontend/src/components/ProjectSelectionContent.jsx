import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { SkillTag } from "./ui/SkillTag";

function ProjectCard({ project, index, isSelected, reasoning, isEditable, onToggle }) {
  const selectedClass = "bg-white border border-emerald-200 border-l-[3px] border-l-emerald-500";
  const deselectedClass = "bg-slate-50 border border-slate-100 opacity-45 hover:opacity-60";

  return (
    <div
      onClick={isEditable ? () => onToggle(project.title) : undefined}
      className={`relative overflow-hidden rounded-xl transition-all duration-200 ${
        isEditable ? "cursor-pointer" : "cursor-default"
      } ${isSelected ? selectedClass : deselectedClass}`}
    >
      <div className="px-4 py-3.5">
        {/* Title + number */}
        <div className="flex items-start justify-between gap-3 mb-1.5">
          <p className="font-display text-sm font-bold text-slate-950 leading-[1.25]">
            {project.title}
          </p>
          <span className="text-[11px] font-extrabold tabular-nums text-slate-300 shrink-0 mt-0.5">
            {isSelected ? String(index).padStart(2, "0") : "—"}
          </span>
        </div>

        {/* Blockquote reasoning */}
        {reasoning && (
          <div className="border-l-2 border-slate-200 pl-3 mb-3">
            <p className="text-[12px] text-slate-400 leading-[1.55] line-clamp-2">
              {reasoning}
            </p>
          </div>
        )}

        {/* Tech tags */}
        <div className="flex flex-wrap gap-1.5">
          {(project.technologies || []).map((t) => (
            <SkillTag key={t} label={t} variant="neutral" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProjectSelectionContent({
  data,
  resumeJson,
  interruptId,
  onSubmit,
  isSubmitting,
  isEditable = false,
}) {
  const agentSelected = data.selected_projects || [];
  const agentTitles = new Set(agentSelected.map((p) => p.title));
  const allProjects = resumeJson?.projects || [];
  const notSelected = allProjects.filter((p) => !agentTitles.has(p.title));

  const [selected, setSelected] = useState(
    () => new Set(agentSelected.map((p) => p.title)),
  );

  const reasoningMap = Object.fromEntries(
    agentSelected.map((p) => [p.title, p.reasoning]),
  );

  function toggle(title) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(title) ? next.delete(title) : next.add(title);
      return next;
    });
  }

  function handleConfirm() {
    const selectedIndices = allProjects
      .map((p, i) => ({ title: p.title, i }))
      .filter(({ title }) => selected.has(title))
      .map(({ i }) => i);

    onSubmit({
      responses: [{ interrupt_id: interruptId, approved: true, feedback: "", selected_project_indices: selectedIndices }],
    });
  }

  // Reflowing 1-based index across both groups
  const allCards = [
    ...agentSelected,
    ...notSelected.map((p) => ({ ...p, reasoning: null })),
  ];
  let selIdx = 0;
  const indexMap = {};
  allCards.forEach((p) => {
    if (selected.has(p.title)) indexMap[p.title] = ++selIdx;
  });

  return (
    <div>
      {/* Agent-selected cards */}
      <div className="flex flex-col gap-3">
        {agentSelected.map((p) => (
          <ProjectCard
            key={p.title}
            project={p}
            index={indexMap[p.title] || 0}
            isSelected={selected.has(p.title)}
            reasoning={reasoningMap[p.title]}
            isEditable={isEditable}
            onToggle={toggle}
          />
        ))}
      </div>

      {/* Not-selected divider + cards — review mode only */}
      {isEditable && notSelected.length > 0 && (
        <>
          <div className="flex items-center gap-2 my-3">
            <div className="flex-1 h-px bg-slate-100" />
            <p className="text-[11px] font-semibold text-slate-400 shrink-0">
              Not selected by agent
            </p>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          <div className="flex flex-col gap-2">
            {notSelected.map((p) => (
              <ProjectCard
                key={p.title}
                project={p}
                index={indexMap[p.title] || 0}
                isSelected={selected.has(p.title)}
                reasoning={null}
                isEditable
                onToggle={toggle}
              />
            ))}
          </div>
        </>
      )}

      {/* Action bar — review mode only */}
      {isEditable && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
          <p className="text-[11px] font-medium text-slate-400">
            {selected.size > 0
              ? `${selected.size} project${selected.size !== 1 ? "s" : ""} will be included`
              : "Select at least one project to continue"}
          </p>
          <button
            onClick={handleConfirm}
            disabled={selected.size === 0 || isSubmitting}
            className={`h-9 px-4 rounded-xl text-sm font-bold flex items-center gap-1.5 border-none transition-all duration-150 ${
              selected.size === 0
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-[hsl(220_20%_18%)] text-white cursor-pointer"
            }`}
          >
            {isSubmitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
            Confirm selection
          </button>
        </div>
      )}
    </div>
  );
}
