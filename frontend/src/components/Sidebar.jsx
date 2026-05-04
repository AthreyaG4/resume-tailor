const SIDEBAR_ITEMS = [
  { node: "jd_parsing_node", label: "Job description" },
  { node: "skill_match_node", label: "Skill match" },
  { node: "project_selection_node", label: "Project selection" },
  { node: "skill_selection_node", label: "Skill selection" },
  { node: "execute_project_rewrite_node", label: "Project rewrites" },
  { node: "execute_experience_rewrite_node", label: "Experience rewrites" },
  { node: "certification_selection_review_node", label: "Certs & publications" },
  { node: "summary_generation_review_node", label: "Summary" },
  { node: "section_order_node", label: "Section order" },
  { node: "cover_letter_review_node", label: "Cover letter" },
  { node: "cover_letter_node", label: "Generating cover letter" },
  { node: "__complete__", label: "Resume ready" },
];

const POST_TAILOR_STATUSES = [
  "tailored",
  "applied",
  "interviewing",
  "rejected",
];

// Maps backend-only current_node values to their sidebar display counterpart.
// These nodes run but are not represented as sidebar items directly.
const NODE_ALIAS_MAP = {
  project_selection_review_node: "project_selection_node",
  skill_selection_review_node: "skill_selection_node",
  summary_generation_node: "summary_generation_review_node",
};

export function Sidebar({ steps, status, currentNode }) {
  const completedNodes = new Set(steps.map((s) => s.node));
  const isComplete = POST_TAILOR_STATUSES.includes(status);
  const effectiveCurrentNode = NODE_ALIAS_MAP[currentNode] ?? currentNode;

  function getState(node) {
    if (node === "__complete__") return isComplete ? "done" : "pending";
    if (node === effectiveCurrentNode) return "active";
    if (completedNodes.has(node)) return "done";
    return "pending";
  }

  function scrollTo(node) {
    const el = document.getElementById(`step-${node}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <aside className="hidden lg:block self-start sticky top-[88px]">
      <p className="text-[11px] font-extrabold tracking-[0.12em] uppercase text-slate-400 mb-3.5">
        Progress
      </p>
      <div className="relative">
        {SIDEBAR_ITEMS.map((item, i) => {
          const state = getState(item.node);
          const isLast = i === SIDEBAR_ITEMS.length - 1;
          const nextState = !isLast
            ? getState(SIDEBAR_ITEMS[i + 1].node)
            : null;
          const spineGreen = state === "done" && nextState !== null;

          return (
            <div key={item.node} className="flex gap-3 items-start">
              <div className="flex flex-col items-center w-4">
                {state === "done" && (
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-[3px]" />
                )}
                {state === "active" && (
                  <div className="w-2.5 h-2.5 rounded-full bg-[hsl(220_20%_20%)] shrink-0 mt-0.5 shadow-[0_0_0_4px_hsl(220_20%_20%/0.12)] transition-shadow duration-200" />
                )}
                {state === "pending" && (
                  <div className="w-2 h-2 rounded-full bg-transparent border-[1.5px] border-slate-300 shrink-0 mt-[3px]" />
                )}
                {!isLast && (
                  <div
                    className={`w-[1.5px] grow min-h-6 mt-[3px] mb-[3px] ${spineGreen ? "bg-emerald-200" : "bg-slate-200"}`}
                  />
                )}
              </div>
              <button
                onClick={() => scrollTo(item.node)}
                className={`bg-transparent border-none cursor-pointer text-left whitespace-nowrap text-sm pt-[1px] ${isLast ? "pb-0" : "pb-5"} ${
                  state === "active"
                    ? "font-bold text-slate-950"
                    : state === "done"
                      ? "font-medium text-slate-600"
                      : "font-medium text-slate-400"
                }`}
              >
                {item.label}
              </button>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
