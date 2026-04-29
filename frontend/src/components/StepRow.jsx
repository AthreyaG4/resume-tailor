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
  experience_rewrite_node: { label: "Experience rewrites" },
  assemble_resume_node: { label: "Assembling resume" },
};

export function StepRow({ step, isActive, resumeJson, isLast }) {
  const [collapsed, setCollapsed] = useState(false);
  const meta = NODE_META[step.node] || { label: step.label };

  return (
    <motion.div
      id={`step-${step.node}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      style={{ display: "flex", gap: 16, scrollMarginTop: 88 }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            background: isActive ? "hsl(220 20% 95%)" : "#ecfdf5",
            border: isActive ? "2px solid hsl(220 20% 78%)" : "2px solid #6ee7b7",
          }}
        >
          {isActive ? (
            <Loader2 style={{ width: 16, height: 16, color: "hsl(220 20% 40%)" }} className="animate-spin" />
          ) : (
            <CheckCircle2 style={{ width: 16, height: 16, color: "#10b981" }} />
          )}
        </div>
        {!isLast && (
          <div style={{ width: 1, flexGrow: 1, background: "hsl(220 10% 90%)", marginTop: 4, minHeight: 16 }} />
        )}
      </div>

      <div style={{ flex: 1, paddingBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 36, marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: isActive ? "hsl(220 20% 40%)" : "#1e293b", whiteSpace: "nowrap" }}>
              {meta.label}
            </span>
            {isActive && (
              <span
                style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(220 20% 50%)" }}
                className="animate-pulse"
              >
                Running…
              </span>
            )}
          </div>
          {!isActive && step.data && (
            <button
              onClick={() => setCollapsed((c) => !c)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0 }}
            >
              {collapsed ? <ChevronDown style={{ width: 15, height: 15 }} /> : <ChevronUp style={{ width: 15, height: 15 }} />}
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
              <div
                style={{
                  background: "#fff",
                  border: "1px solid hsl(220 10% 91%)",
                  borderRadius: 16,
                  padding: "18px 20px",
                  boxShadow: "0 1px 6px -2px rgba(0,0,0,.05)",
                }}
              >
                <NodeDataRenderer node={step.node} data={step.data} resumeJson={resumeJson} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
