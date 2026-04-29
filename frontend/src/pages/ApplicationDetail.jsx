import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, AlertCircle } from "lucide-react";
import { useParams } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { useApplications } from "../hooks/useApplications";
import * as api from "../api/applications";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Sidebar } from "../components/Sidebar";
import { StepRow } from "../components/StepRow";
import { CompleteBanner } from "../components/CompleteBanner";
import { InterruptPanel } from "../components/InterruptPanel";

// ─── Constants ────────────────────────────────────────────────────

const NODE_META = {
  jd_parsing_node: { label: "Job description" },
  skill_match_node: { label: "Skill match" },
  project_selection_node: { label: "Project selection" },
  skill_selection_node: { label: "Skill selection" },
  execute_project_rewrite_node: { label: "Project rewrites" },
  experience_rewrite_node: { label: "Experience rewrites" },
  assemble_resume_node: { label: "Assembling resume" },
};

const TERMINAL_STATUSES = ["tailored", "interrupted", "failed", "applied", "interviewing", "rejected"];
const POST_TAILOR_STATUSES = ["tailored", "applied", "interviewing", "rejected"];

// ─── Main component ───────────────────────────────────────────────

export default function ApplicationDetail() {
  const { id } = useParams();
  const { token } = useAuth();
  const { sendApplicationFeedback, updateApplicationStatus } = useApplications();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const intervalRef = useRef(null);

  async function fetchApplication() {
    try {
      const data = await api.getApplication(token, id);
      setApplication(data);
      return data;
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function startPolling() {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(async () => {
      const app = await fetchApplication();
      if (app && TERMINAL_STATUSES.includes(app.status)) {
        clearInterval(intervalRef.current);
      }
    }, 2000);
  }

  useEffect(() => {
    if (!id || !token) return;
    fetchApplication().then((app) => {
      if (app && !TERMINAL_STATUSES.includes(app.status)) startPolling();
    });
    return () => clearInterval(intervalRef.current);
  }, [id, token]);

  async function handleFeedback(feedback) {
    setIsSubmitting(true);
    try {
      await sendApplicationFeedback(feedback, id);
      setApplication((prev) => ({
        ...prev,
        status: "tailoring",
        current_node: null,
        interrupt_payloads: null,
      }));
      startPolling();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary/20" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="flex h-[80vh] items-center justify-center text-muted-foreground">
        Application not found.
      </div>
    );
  }

  const { steps = [], status, current_node, pdf_key, resume_json } = application;

  const isInterrupted = status === "interrupted";
  const isComplete = POST_TAILOR_STATUSES.includes(status);
  const isFailed = status === "failed";
  const isTailoring = status === "tailoring";
  const hasActiveNode = current_node && isTailoring;

  const interruptPayloads = application.interrupt_payloads || [];

  const statusLabel = isInterrupted ? "Waiting for review" : isComplete ? "Complete" : isFailed ? "Failed" : "Tailoring...";
  const statusStyle = isInterrupted
    ? { bg: "#fffbeb", color: "#b45309", border: "#fde68a" }
    : isComplete
    ? { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" }
    : isFailed
    ? { bg: "#fff1f2", color: "#be123c", border: "#fecdd3" }
    : { bg: "hsl(220 20% 96%)", color: "hsl(220 20% 40%)", border: "hsl(220 20% 85%)" };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 32px 80px" }}>
      <div
        style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 48, alignItems: "start" }}
        className="lg:grid block"
      >
        <Sidebar steps={steps} status={status} currentNode={current_node} />

        <div style={{ maxWidth: 760 }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
            <div>
              <h1
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontWeight: 900,
                  fontSize: 32,
                  letterSpacing: "-0.02em",
                  color: "#0f172a",
                  lineHeight: 1.1,
                  margin: 0,
                }}
              >
                {application.title || "Application"}
              </h1>
              <p style={{ fontSize: 13, fontWeight: 500, color: "#64748b", marginTop: 4 }}>
                {application.company_name || application.job_id}
              </p>
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                padding: "5px 14px",
                borderRadius: 99,
                background: statusStyle.bg,
                color: statusStyle.color,
                border: `1px solid ${statusStyle.border}`,
                whiteSpace: "nowrap",
                flexShrink: 0,
                marginTop: 4,
              }}
            >
              {statusLabel}
            </span>
          </div>

          {/* Status selector */}
          {POST_TAILOR_STATUSES.includes(status) && (
            <div style={{ marginBottom: 24 }}>
              <Select
                value={status}
                onValueChange={(value) => {
                  updateApplicationStatus(id, value);
                  setApplication((prev) => ({ ...prev, status: value }));
                }}
              >
                <SelectTrigger className="w-44 rounded-xl border-border/60 text-sm font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="tailored">Tailored</SelectItem>
                  <SelectItem value="applied">Applied</SelectItem>
                  <SelectItem value="interviewing">Interviewing</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Timeline */}
          <div>
            {steps.map((step, i) => (
              <StepRow
                key={step.id}
                step={step}
                isActive={false}
                resumeJson={resume_json}
                isLast={i === steps.length - 1 && !hasActiveNode && !isInterrupted}
              />
            ))}

            <AnimatePresence>
              {hasActiveNode && (
                <StepRow
                  key="active"
                  step={{ node: current_node, label: NODE_META[current_node]?.label, data: null }}
                  isActive={true}
                  resumeJson={resume_json}
                  isLast={true}
                />
              )}
            </AnimatePresence>

            <AnimatePresence>
              {isInterrupted && interruptPayloads.length > 0 && (
                <InterruptPanel
                  key="interrupt"
                  currentNode={current_node}
                  interruptPayloads={interruptPayloads}
                  resumeJson={resume_json}
                  onSubmit={handleFeedback}
                  isSubmitting={isSubmitting}
                />
              )}
            </AnimatePresence>

            <AnimatePresence>
              {isComplete && (
                <CompleteBanner key="complete" pdfKey={pdf_key} latexContent={application.latex} />
              )}
            </AnimatePresence>

            <AnimatePresence>
              {isFailed && (
                <motion.div
                  key="failed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ display: "flex", gap: 16 }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: "#fff1f2", border: "2px solid #fecdd3", flexShrink: 0 }}>
                    <AlertCircle style={{ width: 16, height: 16, color: "#be123c" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: 16, padding: "18px 20px" }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#be123c" }}>Something went wrong. Please try again.</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
