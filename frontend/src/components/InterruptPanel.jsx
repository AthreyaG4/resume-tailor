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
import { SectionOrderContent } from "./SectionOrderContent";
import { BulletCard } from "./BulletCard";
import { CertificationPublicationContent } from "./CertificationPublicationContent";

const INTERRUPT_META = {
  project_selection_review_node: { label: "Review selected projects" },
  skill_selection_review_node: { label: "Review skill selection" },
  experience_rewrite_review_node: { label: "Review rewritten experience" },
  execute_project_rewrite_node: { label: "Review rewritten projects" },
  execute_experience_rewrite_node: { label: "Review rewritten experience" },
  certification_selection_review_node: { label: "Review certifications & publications" },
  summary_generation_review_node: { label: "Review generated summary" },
  section_order_node: { label: "Section order" },
  cover_letter_review_node: { label: "Cover letter" },
};

// ─── Single interrupt panel ───────────────────────────────────────

function SinglePanel({
  currentNode,
  interruptPayload,
  resumeJson,
  onSubmit,
  isSubmitting,
}) {
  const [feedback, setFeedback] = useState("");
  const [editedSkills, setEditedSkills] = useState(null);
  const panelRef = useRef(null);
  const payloadValue = interruptPayload?.value || {};
  const isSkillReview = currentNode === "skill_selection_review_node";
  const isProjectReview = currentNode === "project_selection_review_node";
  const isSectionOrder = currentNode === "section_order_node";
  const isCertPubReview = currentNode === "certification_selection_review_node";
  const isSummaryReview = currentNode === "summary_generation_review_node";
  const isCoverLetterReview = currentNode === "cover_letter_review_node";

  useEffect(() => {
    setTimeout(
      () =>
        panelRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        }),
      100,
    );
  }, []);

  function handleSubmit(approved) {
    const response = {
      interrupt_id: interruptPayload?.id,
      approved,
      feedback: approved ? "" : feedback,
    };
    if (isSkillReview && editedSkills !== null)
      response.edited_skills = editedSkills;
    onSubmit({ responses: [response] });
  }

  function renderContent() {
    if (isProjectReview)
      return (
        <ProjectSelectionContent
          data={payloadValue}
          resumeJson={resumeJson}
          interruptId={interruptPayload?.id}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          isEditable
        />
      );
    if (currentNode === "skill_selection_review_node")
      return (
        <SkillSelectionContent
          data={payloadValue}
          resumeJson={resumeJson}
          isEditable
          onChange={setEditedSkills}
        />
      );
    if (currentNode === "experience_rewrite_review_node")
      return (
        <ExperienceRewriteData data={payloadValue} resumeJson={resumeJson} />
      );
    if (isSectionOrder)
      return (
        <SectionOrderContent
          data={payloadValue}
          interruptId={interruptPayload?.id}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
        />
      );
    if (isCertPubReview)
      return (
        <CertificationPublicationContent
          data={payloadValue}
          interruptId={interruptPayload?.id}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
        />
      );
    if (isSummaryReview)
      return (
        <div className="mb-1">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-slate-400 mb-2">
            Generated Summary
          </p>
          <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
            {payloadValue.summary}
          </p>
        </div>
      );
    if (isCoverLetterReview)
      return (
        <div className="mb-1">
          <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
            {payloadValue.message}
          </p>
        </div>
      );
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
      className="flex gap-4 scroll-mt-[88px]"
    >
      <div className="flex flex-col items-center">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[hsl(220_20%_95%)] border-2 border-[hsl(220_20%_78%)]">
          <AlertCircle className="w-4 h-4 text-[hsl(220_20%_40%)]" />
        </div>
      </div>

      <div className="flex-1 pb-5">
        <p className="text-sm font-bold text-slate-800 mb-3">{meta.label}</p>
        <div className="bg-white border border-[hsl(220_10%_91%)] rounded-2xl p-[18px_20px] shadow-[0_1px_6px_-2px_rgba(0,0,0,0.05)]">
          {renderContent()}

          {!isProjectReview && !isSkillReview && !isSectionOrder && !isCertPubReview && !isCoverLetterReview && (
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Leave blank to approve, or describe what to change..."
              className="w-full min-h-[80px] bg-[#fafafa] border border-[hsl(220_10%_88%)] rounded-xl px-3.5 py-2.5 text-sm text-slate-950 leading-[1.55] resize-none outline-none box-border mt-4 mb-3 font-[inherit] focus:border-[hsl(220_20%_50%)]"
            />
          )}

          {isCoverLetterReview && (
            <div className="flex gap-2.5 mt-4">
              <button
                onClick={() => handleSubmit(true)}
                disabled={isSubmitting}
                className="flex-1 h-[42px] rounded-xl border-none cursor-pointer flex items-center justify-center gap-1.5 text-sm font-bold bg-[hsl(220_20%_18%)] text-white"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                Yes
              </button>
              <button
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting}
                className="flex-1 h-[42px] rounded-xl flex items-center justify-center gap-1.5 text-sm font-semibold bg-white text-slate-600 border-[1.5px] border-[hsl(220_10%_88%)] cursor-pointer"
              >
                No
              </button>
            </div>
          )}

          {!isProjectReview && !isSectionOrder && !isCertPubReview && !isCoverLetterReview && (
            <div className={`flex gap-2.5 ${isSkillReview ? "mt-4" : ""}`}>
              <button
                onClick={() => handleSubmit(true)}
                disabled={isSubmitting}
                className="flex-1 h-[42px] rounded-xl border-none cursor-pointer flex items-center justify-center gap-1.5 text-sm font-bold bg-[hsl(220_20%_18%)] text-white"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                Looks good, continue
              </button>
              {!isSkillReview && (
                <button
                  onClick={() => handleSubmit(false)}
                  disabled={!feedback.trim() || isSubmitting}
                  className={`flex-1 h-[42px] rounded-xl flex items-center justify-center gap-1.5 text-sm font-semibold bg-white text-slate-600 border-[1.5px] border-[hsl(220_10%_88%)] transition-opacity ${!feedback.trim() ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  Request changes
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Carousel panel (multi-interrupt) ────────────────────────────

function CarouselPanel({
  type,
  interruptPayloads,
  resumeJson,
  jdKeywords,
  onSubmit,
  isSubmitting,
}) {
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1);
  const [bumpKey, setBumpKey] = useState(0);
  const [decisions, setDecisions] = useState(() =>
    Object.fromEntries(
      interruptPayloads.map((p) => [
        p.id,
        { approved: null, feedback: "", showFeedback: false },
      ]),
    ),
  );
  const [showCompare, setShowCompare] = useState(false);
  const feedbackRef = useRef(null);

  const isExperience = type === "experience";
  const current = interruptPayloads[idx];
  const item = isExperience
    ? current?.value?.rewritten_experience
    : current?.value?.rewritten_project;
  const itemTitle = isExperience
    ? item
      ? `${item.role} @ ${item.company}`
      : ""
    : (item?.title ?? "");
  const itemLabel = isExperience ? "Experience" : "Project";

  const origMap = isExperience
    ? Object.fromEntries(
        (resumeJson?.experience || []).map((e) => [
          e.company + e.role,
          e.bullets,
        ]),
      )
    : Object.fromEntries(
        (resumeJson?.projects || []).map((p) => [p.title, p.bullets]),
      );

  const originalBullets = item
    ? isExperience
      ? origMap[item.company + item.role] || []
      : origMap[item.title] || []
    : [];

  const decision = decisions[current?.id] || {
    approved: null,
    feedback: "",
    showFeedback: false,
  };
  const allDecided = interruptPayloads.every(
    (p) => decisions[p.id]?.approved !== null,
  );
  const pendingCount = interruptPayloads.filter(
    (p) => decisions[p.id]?.approved === null,
  ).length;

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
    const next = interruptPayloads.findIndex(
      (p, i) => i > idx && decisions[p.id]?.approved === null,
    );
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

  const navBtnClass = (disabled) =>
    `w-7 h-7 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center transition-opacity ${disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`;

  return (
    <div id="step-__review__" className="flex gap-4 scroll-mt-[88px]">
      <div className="flex flex-col items-center">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[hsl(220_20%_95%)] border-2 border-[hsl(220_20%_78%)]">
          <AlertCircle className="w-4 h-4 text-[hsl(220_20%_40%)]" />
        </div>
      </div>

      <div className="flex-1 pb-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3.5">
          <div>
            <p className="text-sm font-bold text-slate-800">
              Review rewritten {isExperience ? "experience" : "projects"}
            </p>
            <p className="text-[11px] font-medium text-slate-400 mt-0.5">
              Approve each or request changes
            </p>
          </div>
          {/* Stepper dots */}
          <div className="flex gap-1.5 items-center pt-0.5">
            {interruptPayloads.map((p, i) => {
              const d = decisions[p.id];
              const isActive = i === idx;
              return (
                <button
                  key={p.id}
                  onClick={() => goTo(i)}
                  className="rounded-full border-none cursor-pointer p-0 transition-all duration-200"
                  style={{
                    width: isActive ? 20 : 8,
                    height: 8,
                    background: isActive
                      ? "hsl(220 20% 20%)"
                      : d?.approved === true
                        ? "#10b981"
                        : d?.approved === false
                          ? "#f43f5e"
                          : "#cbd5e1",
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
            className="bg-white border border-[hsl(220_10%_90%)] rounded-[20px] shadow-[0_1px_8px_-2px_rgba(0,0,0,0.06)] overflow-hidden"
          >
            {/* Card header */}
            <div className="px-5 pt-[18px] pb-4 border-b border-[hsl(220_10%_95%)] flex items-start justify-between">
              <div>
                <p className="font-display text-lg font-bold text-slate-950 leading-[1.25]">
                  {itemTitle}
                </p>
                <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                  {itemLabel} {idx + 1} of {interruptPayloads.length}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {decision.approved === true && (
                  <span className="text-[11px] font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-[3px]">
                    Approved
                  </span>
                )}
                {decision.approved === false && (
                  <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-full px-2.5 py-[3px]">
                    Changes requested
                  </span>
                )}
                <button
                  onClick={() => idx > 0 && goTo(idx - 1)}
                  disabled={idx === 0}
                  className={navBtnClass(idx === 0)}
                >
                  <ChevronLeft className="w-3.5 h-3.5 text-slate-600" />
                </button>
                <button
                  onClick={() =>
                    idx < interruptPayloads.length - 1 && goTo(idx + 1)
                  }
                  disabled={idx === interruptPayloads.length - 1}
                  className={navBtnClass(idx === interruptPayloads.length - 1)}
                >
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                </button>
              </div>
            </div>

            {/* Compare toggle */}
            {originalBullets.length > 0 && (
              <div className="px-5 pt-2.5">
                <button
                  onClick={() => setShowCompare((c) => !c)}
                  className={`inline-flex items-center gap-1.5 bg-transparent border-none cursor-pointer text-[11px] font-semibold ${showCompare ? "text-slate-950" : "text-slate-400"}`}
                >
                  {showCompare ? (
                    <X className="w-3 h-3" />
                  ) : (
                    <FileText className="w-3 h-3" />
                  )}
                  {showCompare ? "Hide original" : "Compare with original"}
                </button>
              </div>
            )}

            {/* Bullets */}
            <div className="px-5 py-4">
              {showCompare ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-slate-400 mb-2">
                      Original
                    </p>
                    {originalBullets.map((b, i) => (
                      <div
                        key={i}
                        className="text-sm text-slate-500 bg-slate-50 border border-slate-100 rounded-[11px] px-3.5 py-2.5 mb-1.5 leading-[1.65]"
                      >
                        {b}
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-emerald-600 mb-2">
                      Rewritten
                    </p>
                    {(item?.bullets || []).map((b, i) => (
                      <BulletCard
                        key={i}
                        bullet={b}
                        index={i}
                        keywords={jdKeywords}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                (item?.bullets || []).map((b, i) => (
                  <BulletCard
                    key={i}
                    bullet={b}
                    index={i}
                    originalText={originalBullets[i]}
                    keywords={jdKeywords}
                  />
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
                  className="overflow-hidden px-5"
                >
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-slate-400 mb-1.5">
                    Describe what to change
                  </p>
                  <textarea
                    ref={feedbackRef}
                    value={decision.feedback}
                    onChange={(e) =>
                      setDecision(current.id, { feedback: e.target.value })
                    }
                    placeholder="What should be changed?"
                    className="w-full min-h-[80px] bg-[#fafafa] border border-[hsl(220_10%_88%)] rounded-xl px-3.5 py-2.5 text-sm text-slate-950 leading-[1.55] resize-none outline-none box-border mb-3 font-[inherit] focus:border-[hsl(220_20%_50%)]"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Per-card actions */}
            <div className="px-5 pb-[18px] pt-3.5 border-t border-[hsl(220_10%_96%)] flex gap-2.5">
              <button
                onClick={handleApprove}
                className={`flex-1 h-[42px] rounded-xl border-none cursor-pointer flex items-center justify-center gap-1.5 text-sm font-bold bg-[hsl(220_20%_18%)] text-white transition-opacity duration-150 ${decision.approved === false ? "opacity-50" : "opacity-100"}`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {decision.approved === true ? "Approved" : "Approve"}
              </button>
              <button
                onClick={handleRequestChanges}
                className={`flex-1 h-[42px] rounded-xl cursor-pointer flex items-center justify-center gap-1.5 text-sm font-semibold border-[1.5px] transition-all duration-150 ${
                  decision.approved === false
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : "bg-white text-slate-600 border-[hsl(220_10%_88%)]"
                } ${decision.approved === true ? "opacity-50" : "opacity-100"}`}
              >
                <X className="w-3.5 h-3.5" />
                Request changes
              </button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Submit all */}
        <div className="mt-3.5">
          <button
            onClick={handleSubmit}
            disabled={!allDecided || isSubmitting}
            className={`w-full h-11 rounded-[13px] border-none flex items-center justify-center gap-2 text-sm font-bold transition-all duration-200 ${
              allDecided
                ? "bg-[hsl(220_20%_18%)] text-white cursor-pointer shadow-[0_4px_14px_-3px_hsl(220_20%_18%/0.3)]"
                : "bg-[hsl(220_10%_90%)] text-slate-400 cursor-not-allowed"
            }`}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            Submit all reviews
          </button>
          {pendingCount > 0 && (
            <p className="text-[11px] font-medium text-slate-400 text-center mt-1.5">
              {pendingCount} {isExperience ? "experience" : "project"}
              {pendingCount > 1 ? "s" : ""} still need review
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Public component ─────────────────────────────────────────────

export function InterruptPanel({
  currentNode,
  interruptPayloads,
  resumeJson,
  jdKeywords,
  onSubmit,
  isSubmitting,
}) {
  const carouselType =
    currentNode === "execute_project_rewrite_node"
      ? "project"
      : currentNode === "execute_experience_rewrite_node"
        ? "experience"
        : null;

  if (carouselType) {
    return (
      <CarouselPanel
        type={carouselType}
        interruptPayloads={interruptPayloads}
        resumeJson={resumeJson}
        jdKeywords={jdKeywords}
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
