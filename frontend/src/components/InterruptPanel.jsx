import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  FileText,
  X,
} from "lucide-react";
import { ProjectSelectionContent } from "./ProjectSelectionContent";
import { SkillSelectionContent } from "./SkillSelectionContent";
import { ExperienceRewriteData } from "./ExperienceRewriteData";

const INTERRUPT_META = {
  project_selection_review_node:    { label: "Review selected projects" },
  skill_selection_review_node:      { label: "Review skill selection" },
  experience_rewrite_review_node:   { label: "Review rewritten experience" },
  execute_project_rewrite_node:     { label: "Review rewritten projects" },
  execute_experience_rewrite_node:  { label: "Review rewritten experience" },
};

// ─── Single interrupt panel ───────────────────────────────────────

function SinglePanel({ currentNode, interruptPayload, resumeJson, onSubmit, isSubmitting }) {
  const [feedback, setFeedback] = useState("");
  const [editedSkills, setEditedSkills] = useState(null);
  const panelRef = useRef(null);
  const payloadValue = interruptPayload?.value || {};
  const isSkillReview = currentNode === "skill_selection_review_node";

  useEffect(() => {
    setTimeout(() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
  }, []);

  function handleSubmit(approved) {
    const response = {
      interrupt_id: interruptPayload?.id,
      approved,
      feedback: approved ? "" : feedback,
    };
    if (isSkillReview && editedSkills !== null) {
      response.edited_skills = editedSkills;
    }
    onSubmit({ responses: [response] });
  }

  function renderContent() {
    if (currentNode === "project_selection_review_node") {
      return <ProjectSelectionContent data={payloadValue} />;
    }
    if (currentNode === "skill_selection_review_node") {
      return (
        <SkillSelectionContent
          data={payloadValue}
          resumeJson={resumeJson}
          isEditable={true}
          onChange={setEditedSkills}
        />
      );
    }
    if (currentNode === "experience_rewrite_review_node") {
      return <ExperienceRewriteData data={payloadValue} resumeJson={resumeJson} />;
    }
    return null;
  }

  const meta = INTERRUPT_META[currentNode] || { label: "Review this step" };

  return (
    <motion.div
      ref={panelRef}
      id="step-__review__"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35 }}
      style={{ display: "flex", gap: 16, scrollMarginTop: 88 }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: 36, height: 36, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: "hsl(220 20% 95%)", border: "2px solid hsl(220 20% 78%)" }}>
          <AlertCircle style={{ width: 16, height: 16, color: "hsl(220 20% 40%)" }} />
        </div>
      </div>

      <div style={{ flex: 1, paddingBottom: 20 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 12 }}>{meta.label}</p>
        <div style={{ background: "#fff", border: "1px solid hsl(220 10% 91%)", borderRadius: 16, padding: "18px 20px", boxShadow: "0 1px 6px -2px rgba(0,0,0,.05)" }}>
          {renderContent()}

          {!isSkillReview && (
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Leave blank to approve, or describe what to change..."
              style={{
                width: "100%", minHeight: 80, background: "#fafafa",
                border: "1px solid hsl(220 10% 88%)", borderRadius: 12,
                padding: "10px 14px", fontSize: 13, color: "#0f172a",
                lineHeight: 1.55, resize: "none", outline: "none",
                boxSizing: "border-box", marginTop: 16, marginBottom: 12, fontFamily: "inherit",
              }}
              onFocus={(e) => { e.target.style.borderColor = "hsl(220 20% 50%)"; }}
              onBlur={(e) => { e.target.style.borderColor = "hsl(220 10% 88%)"; }}
            />
          )}

          <div style={{ display: "flex", gap: 10, marginTop: isSkillReview ? 16 : 0 }}>
            <button
              onClick={() => handleSubmit(true)}
              disabled={isSubmitting}
              style={{
                flex: 1, height: 42, borderRadius: 12, border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                fontSize: 13, fontWeight: 700, background: "hsl(220 20% 18%)", color: "#fff",
              }}
            >
              {isSubmitting ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : <CheckCircle2 style={{ width: 14, height: 14 }} />}
              Looks good, continue
            </button>
            {!isSkillReview && (
              <button
                onClick={() => handleSubmit(false)}
                disabled={!feedback.trim() || isSubmitting}
                style={{
                  flex: 1, height: 42, borderRadius: 12, cursor: feedback.trim() ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  fontSize: 13, fontWeight: 600, background: "#fff", color: "#475569",
                  border: "1.5px solid hsl(220 10% 88%)", opacity: feedback.trim() ? 1 : 0.5,
                }}
              >
                Request changes
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Carousel panel (multi-interrupt) ────────────────────────────

function CarouselPanel({ type, interruptPayloads, resumeJson, onSubmit, isSubmitting }) {
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1);
  const [bumpKey, setBumpKey] = useState(0);
  const [decisions, setDecisions] = useState(() =>
    Object.fromEntries(
      interruptPayloads.map((p) => [p.id, { approved: null, feedback: "", showFeedback: false }])
    )
  );
  const [showCompare, setShowCompare] = useState(false);
  const feedbackRef = useRef(null);

  const isExperience = type === "experience";
  const current = interruptPayloads[idx];

  const item = isExperience
    ? current?.value?.rewritten_experience
    : current?.value?.rewritten_project;

  const itemTitle = isExperience
    ? (item ? `${item.role} @ ${item.company}` : "")
    : (item?.title ?? "");

  const itemLabel = isExperience ? "Experience" : "Project";

  const origMap = isExperience
    ? Object.fromEntries((resumeJson?.experience || []).map((e) => [e.company + e.role, e.bullets]))
    : Object.fromEntries((resumeJson?.projects || []).map((p) => [p.title, p.bullets]));

  const originalBullets = item
    ? (isExperience ? (origMap[item.company + item.role] || []) : (origMap[item.title] || []))
    : [];

  const decision = decisions[current?.id] || { approved: null, feedback: "", showFeedback: false };
  const allDecided = interruptPayloads.every((p) => decisions[p.id]?.approved !== null);
  const pendingCount = interruptPayloads.filter((p) => decisions[p.id]?.approved === null).length;

  function goTo(newIdx) {
    setDir(newIdx > idx ? 1 : -1);
    setIdx(newIdx);
    setBumpKey((k) => k + 1);
    setShowCompare(false);
  }

  function setDecision(id, patch) {
    setDecisions((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  function handleApprove() {
    setDecision(current.id, { approved: true, showFeedback: false });
    const next = interruptPayloads.findIndex((p, i) => i > idx && decisions[p.id]?.approved === null);
    if (next !== -1) setTimeout(() => goTo(next), 300);
  }

  function handleRequestChanges() {
    setDecision(current.id, { approved: false, showFeedback: true });
    setTimeout(() => feedbackRef.current?.focus(), 50);
  }

  function handleSubmit() {
    const responses = interruptPayloads.map((p) => ({
      interrupt_id: p.id,
      approved: decisions[p.id]?.approved ?? true,
      feedback: decisions[p.id]?.feedback || "",
    }));
    onSubmit({ responses });
  }

  const slideVariants = {
    enter: (d) => ({ x: d > 0 ? 24 : -24, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d) => ({ x: d > 0 ? -24 : 24, opacity: 0 }),
  };

  return (
    <div id="step-__review__" style={{ display: "flex", gap: 16, scrollMarginTop: 88 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: 36, height: 36, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: "hsl(220 20% 95%)", border: "2px solid hsl(220 20% 78%)" }}>
          <AlertCircle style={{ width: 16, height: 16, color: "hsl(220 20% 40%)" }} />
        </div>
      </div>

      <div style={{ flex: 1, paddingBottom: 20 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>Review rewritten {isExperience ? "experience" : "projects"}</p>
            <p style={{ fontSize: 11, fontWeight: 500, color: "#94a3b8", marginTop: 2 }}>Approve each or request changes</p>
          </div>
          {/* Stepper dots */}
          <div style={{ display: "flex", gap: 5, alignItems: "center", paddingTop: 2 }}>
            {interruptPayloads.map((p, i) => {
              const d = decisions[p.id];
              const isActive = i === idx;
              return (
                <button
                  key={p.id}
                  onClick={() => goTo(i)}
                  style={{
                    width: isActive ? 20 : 8, height: 8, borderRadius: 99, border: "none", cursor: "pointer",
                    transition: "all .25s ease", padding: 0,
                    background: isActive ? "hsl(220 20% 20%)" : d?.approved === true ? "#10b981" : d?.approved === false ? "#f43f5e" : "#cbd5e1",
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Card */}
        <AnimatePresence custom={dir} mode="wait">
          <motion.div
            key={bumpKey}
            custom={dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: "easeOut" }}
            style={{ background: "#fff", border: "1px solid hsl(220 10% 90%)", borderRadius: 20, boxShadow: "0 1px 8px -2px rgba(0,0,0,.06)", overflow: "hidden" }}
          >
            {/* Card header */}
            <div style={{ padding: "18px 20px 16px", borderBottom: "1px solid hsl(220 10% 95%)", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: "#0f172a", lineHeight: 1.25 }}>
                  {itemTitle}
                </p>
                <p style={{ fontSize: 11, fontWeight: 500, color: "#94a3b8", marginTop: 2 }}>
                  {itemLabel} {idx + 1} of {interruptPayloads.length}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {decision.approved === true && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#15803d", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 99, padding: "3px 10px" }}>Approved</span>
                )}
                {decision.approved === false && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#be123c", background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: 99, padding: "3px 10px" }}>Changes requested</span>
                )}
                <button
                  onClick={() => idx > 0 && goTo(idx - 1)}
                  disabled={idx === 0}
                  style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", cursor: idx === 0 ? "not-allowed" : "pointer", opacity: idx === 0 ? 0.3 : 1 }}
                >
                  <ChevronLeft style={{ width: 14, height: 14, color: "#475569" }} />
                </button>
                <button
                  onClick={() => idx < interruptPayloads.length - 1 && goTo(idx + 1)}
                  disabled={idx === interruptPayloads.length - 1}
                  style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", cursor: idx === interruptPayloads.length - 1 ? "not-allowed" : "pointer", opacity: idx === interruptPayloads.length - 1 ? 0.3 : 1 }}
                >
                  <ChevronRight style={{ width: 14, height: 14, color: "#475569" }} />
                </button>
              </div>
            </div>

            {/* Compare toggle */}
            {originalBullets.length > 0 && (
              <div style={{ padding: "10px 20px 0" }}>
                <button
                  onClick={() => setShowCompare((c) => !c)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, color: showCompare ? "#0f172a" : "#94a3b8" }}
                >
                  {showCompare ? <X style={{ width: 12, height: 12 }} /> : <FileText style={{ width: 12, height: 12 }} />}
                  {showCompare ? "Hide original" : "Compare with original"}
                </button>
              </div>
            )}

            {/* Bullets */}
            <div style={{ padding: "16px 20px" }}>
              {showCompare ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#94a3b8", marginBottom: 8 }}>Original</p>
                    {originalBullets.map((b, i) => (
                      <div key={i} style={{ fontSize: 13, color: "#64748b", background: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: 11, padding: "10px 14px", marginBottom: 5, lineHeight: 1.65 }}>{b}</div>
                    ))}
                  </div>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#059669", marginBottom: 8 }}>Rewritten</p>
                    {(project?.bullets || []).map((b, i) => (
                      <div key={i} style={{ fontSize: 13, color: "#1e293b", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 11, padding: "10px 14px", marginBottom: 5, lineHeight: 1.65 }}>{b}</div>
                    ))}
                  </div>
                </div>
              ) : (
                (item?.bullets || []).map((b, i) => (
                  <div key={i} style={{ fontSize: 13, color: "#1e293b", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 11, padding: "10px 14px", marginBottom: 5, lineHeight: 1.65 }}>{b}</div>
                ))
              )}
            </div>

            {/* Feedback textarea */}
            <AnimatePresence>
              {decision.showFeedback && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: "hidden", padding: "0 20px" }}
                >
                  <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#94a3b8", marginBottom: 6 }}>Describe what to change</p>
                  <textarea
                    ref={feedbackRef}
                    value={decision.feedback}
                    onChange={(e) => setDecision(current.id, { feedback: e.target.value })}
                    placeholder="What should be changed?"
                    style={{
                      width: "100%", minHeight: 80, background: "#fafafa",
                      border: "1px solid hsl(220 10% 88%)", borderRadius: 12,
                      padding: "10px 14px", fontSize: 13, color: "#0f172a",
                      lineHeight: 1.55, resize: "none", outline: "none",
                      boxSizing: "border-box", marginBottom: 12, fontFamily: "inherit",
                    }}
                    onFocus={(e) => { e.target.style.borderColor = "hsl(220 20% 50%)"; }}
                    onBlur={(e) => { e.target.style.borderColor = "hsl(220 10% 88%)"; }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Per-card action row */}
            <div style={{ padding: "14px 20px 18px", borderTop: "1px solid hsl(220 10% 96%)", display: "flex", gap: 10 }}>
              <button
                onClick={handleApprove}
                style={{
                  flex: 1, height: 42, borderRadius: 12, border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  fontSize: 13, fontWeight: 700,
                  background: "hsl(220 20% 18%)", color: "#fff",
                  opacity: decision.approved === false ? 0.5 : 1,
                  transition: "opacity .15s",
                }}
              >
                <CheckCircle2 style={{ width: 14, height: 14 }} />
                {decision.approved === true ? "Approved" : "Approve"}
              </button>
              <button
                onClick={handleRequestChanges}
                style={{
                  flex: 1, height: 42, borderRadius: 12, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  fontSize: 13, fontWeight: 600,
                  background: decision.approved === false ? "#fff1f2" : "#fff",
                  color: decision.approved === false ? "#be123c" : "#475569",
                  border: decision.approved === false ? "1.5px solid #fecdd3" : "1.5px solid hsl(220 10% 88%)",
                  opacity: decision.approved === true ? 0.5 : 1,
                  transition: "all .15s",
                }}
              >
                <X style={{ width: 14, height: 14 }} />
                Request changes
              </button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Submit all */}
        <div style={{ marginTop: 14 }}>
          <button
            onClick={handleSubmit}
            disabled={!allDecided || isSubmitting}
            style={{
              width: "100%", height: 44, borderRadius: 13, border: "none",
              cursor: allDecided ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              fontSize: 13, fontWeight: 700,
              background: allDecided ? "hsl(220 20% 18%)" : "hsl(220 10% 90%)",
              color: allDecided ? "#fff" : "#94a3b8",
              boxShadow: allDecided ? "0 4px 14px -3px hsl(220 20% 18% / .3)" : "none",
              transition: "all .2s",
            }}
          >
            {isSubmitting ? <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" /> : <CheckCircle2 style={{ width: 16, height: 16 }} />}
            Submit all reviews
          </button>
          {pendingCount > 0 && (
            <p style={{ fontSize: 11, fontWeight: 500, color: "#94a3b8", textAlign: "center", marginTop: 6 }}>
              {pendingCount} {isExperience ? "experience" : "project"}{pendingCount > 1 ? "s" : ""} still need review
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Public component ─────────────────────────────────────────────

export function InterruptPanel({ currentNode, interruptPayloads, resumeJson, onSubmit, isSubmitting }) {
  const carouselType =
    currentNode === "execute_project_rewrite_node" ? "project" :
    currentNode === "execute_experience_rewrite_node" ? "experience" :
    null;

  if (carouselType) {
    return (
      <CarouselPanel
        type={carouselType}
        interruptPayloads={interruptPayloads}
        resumeJson={resumeJson}
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
      />
    );
  }

  return (
    <SinglePanel
      currentNode={currentNode}
      interruptPayload={interruptPayloads[0]}
      resumeJson={resumeJson}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
    />
  );
}
