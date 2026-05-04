import { useState, useMemo } from "react";
import { GripHorizontal, Loader2, CheckCircle2 } from "lucide-react";

const REQUIRED = new Set(["experience", "projects", "skills"]);

export function SectionOrderContent({ data, interruptId, onSubmit, isSubmitting, readOnly = false }) {
  const [sections, setSections] = useState(() => data.sections.map((s) => ({ ...s })));
  const [dragIdx, setDragIdx] = useState(null);
  const [dropIdx, setDropIdx] = useState(null);

  const initialHasContent = useMemo(
    () => Object.fromEntries(data.sections.map((s) => [s.id, s.visible || REQUIRED.has(s.id)])),
    [],
  );

  function handleDragStart(e, i) {
    if (readOnly) return;
    e.dataTransfer.effectAllowed = "move";
    setDragIdx(i);
  }

  function handleDragOver(e, i) {
    if (readOnly) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (i !== dropIdx) setDropIdx(i);
  }

  function handleDrop(e, i) {
    if (readOnly) return;
    e.preventDefault();
    if (dragIdx === null || dragIdx === i) return;
    const reordered = [...sections];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(i, 0, moved);
    setSections(reordered);
    setDragIdx(null);
    setDropIdx(null);
  }

  function handleDragEnd() {
    setDragIdx(null);
    setDropIdx(null);
  }

  function toggleVisible(id) {
    if (readOnly) return;
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s)),
    );
  }

  function handleConfirm() {
    onSubmit({
      responses: [{ interrupt_id: interruptId, approved: true, section_order: sections }],
    });
  }

  let counter = 0;
  const sectionsWithNum = sections.map((s) => {
    if (s.visible) counter++;
    return { ...s, displayNum: s.visible ? counter : "—" };
  });
  const visibleCount = counter;

  return (
    <div>
      <div className="mb-4">
        <p className="text-sm font-bold text-slate-800">Section order</p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          {readOnly ? `${visibleCount} section${visibleCount !== 1 ? "s" : ""} visible` : "Drag to reorder · toggle to show or hide"}
        </p>
      </div>

      <div className="space-y-1.5">
        {sectionsWithNum.map((section, i) => {
          const isRequired = REQUIRED.has(section.id);
          const hasContent = initialHasContent[section.id];
          const canToggle = !readOnly && !isRequired && hasContent;
          const isDragOver = !readOnly && dropIdx === i && dragIdx !== null && dragIdx !== i;
          const isDragging = !readOnly && dragIdx === i;

          return (
            <div
              key={section.id}
              draggable={!readOnly}
              onDragStart={(e) => handleDragStart(e, i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDrop={(e) => handleDrop(e, i)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all select-none ${
                readOnly
                  ? section.visible
                    ? "border-slate-200 bg-white"
                    : "border-slate-100 bg-slate-50"
                  : isDragging
                    ? "opacity-40 border-slate-200 bg-white cursor-grab"
                    : isDragOver
                      ? "border-l-[3px] border-l-emerald-500 border-t-slate-200 border-r-slate-200 border-b-slate-200 bg-emerald-50/30 cursor-grab"
                      : section.visible
                        ? "border-slate-200 bg-white cursor-grab active:cursor-grabbing"
                        : "border-slate-100 bg-slate-50 cursor-grab active:cursor-grabbing"
              }`}
            >
              <GripHorizontal
                className={`w-4 h-4 shrink-0 ${readOnly ? "opacity-0" : section.visible ? "text-slate-300" : "text-slate-200"}`}
              />

              <span
                className={`w-5 text-center text-[12px] font-bold tabular-nums shrink-0 ${
                  section.visible ? "text-slate-500" : "text-slate-300"
                }`}
              >
                {section.displayNum}
              </span>

              <span
                className={`flex-1 text-sm font-medium ${
                  section.visible ? "text-slate-800" : "text-slate-400"
                }`}
              >
                {section.label}
              </span>

              {isRequired ? (
                <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-slate-800 text-white shrink-0">
                  always shown
                </span>
              ) : (
                <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-slate-100 text-slate-400 shrink-0">
                  optional
                </span>
              )}

              <button
                type="button"
                disabled={!canToggle}
                onClick={() => canToggle && toggleVisible(section.id)}
                className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${
                  !canToggle ? "cursor-not-allowed opacity-40" : "cursor-pointer"
                } ${section.visible ? "bg-emerald-500" : "bg-slate-300"}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    section.visible ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>

      {!readOnly && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-[12px] font-medium text-slate-400">
            {visibleCount} section{visibleCount !== 1 ? "s" : ""} visible
          </p>
          <button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="h-[38px] px-5 rounded-xl border-none cursor-pointer flex items-center gap-1.5 text-sm font-bold bg-[hsl(220_20%_18%)] text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
            Confirm &amp; generate PDF
          </button>
        </div>
      )}
    </div>
  );
}
