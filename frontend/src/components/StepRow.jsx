import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { NodeDataRenderer } from "./NodeDataRenderer";

const NODE_META = {
  jd_parsing_node: { label: "Job description" },
  skill_match_node: { label: "Skill match" },
  project_selection_node: { label: "Project selection" },
  skill_selection_node: { label: "Skill selection" },
  execute_project_rewrite_node: { label: "Project rewrites" },
  execute_experience_rewrite_node: { label: "Experience rewrites" },
  certification_selection_review_node: { label: "Certifications & publications" },
  summary_generation_node: { label: "Writing summary" },
  summary_generation_review_node: { label: "Summary" },
  section_order_node: { label: "Section order" },
  cover_letter_review_node: { label: "Cover letter" },
  cover_letter_node: { label: "Generating cover letter" },
  assemble_resume_node: { label: "Assembling resume" },
};

export function StepRow({
  step,
  isActive,
  resumeJson,
  jdKeywords,
  appLocation,
  appEmpType,
  isLast,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const meta = NODE_META[step.node] || { label: step.label };

  return (
    <motion.div
      id={`step-${step.node}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex gap-4 scroll-mt-[88px]"
    >
      <div className="flex flex-col items-center">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            isActive
              ? "bg-[hsl(220_20%_95%)] border-2 border-[hsl(220_20%_78%)]"
              : "bg-emerald-50 border-2 border-emerald-300"
          }`}
        >
          {isActive ? (
            <Loader2 className="w-4 h-4 text-[hsl(220_20%_40%)] animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          )}
        </div>
        {!isLast && (
          <div className="w-px grow bg-[hsl(220_10%_90%)] mt-1 min-h-4" />
        )}
      </div>

      <div className="flex-1 pb-5">
        <div className="flex items-center justify-between min-h-9 mb-2">
          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-bold whitespace-nowrap ${isActive ? "text-[hsl(220_20%_40%)]" : "text-slate-800"}`}
            >
              {meta.label}
            </span>
            {isActive && (
              <span className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[hsl(220_20%_50%)] animate-pulse">
                Running…
              </span>
            )}
            {!isActive && (step.input_tokens > 0 || step.output_tokens > 0) && (
              <span className="text-[11px] text-slate-400 font-mono">
                {(step.input_tokens + step.output_tokens).toLocaleString()} tokens
              </span>
            )}
          </div>
          {!isActive && step.data && (
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="bg-transparent border-none cursor-pointer text-slate-400 p-0"
            >
              {collapsed ? (
                <ChevronDown className="w-[15px] h-[15px]" />
              ) : (
                <ChevronUp className="w-[15px] h-[15px]" />
              )}
            </button>
          )}
        </div>

        <AnimatePresence>
          {!isActive && step.data && !collapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white border border-[hsl(220_10%_91%)] rounded-2xl p-[18px_20px] shadow-[0_1px_6px_-2px_rgba(0,0,0,0.05)]">
                <NodeDataRenderer
                  node={step.node}
                  data={step.data}
                  resumeJson={resumeJson}
                  jdKeywords={jdKeywords}
                  appLocation={appLocation}
                  appEmpType={appEmpType}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
