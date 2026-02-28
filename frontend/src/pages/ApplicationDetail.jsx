import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import {
  CheckCircle2,
  Loader2,
  MapPin,
  Sparkles,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  FileDown,
} from "lucide-react";
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

// ─── Constants ────────────────────────────────────────────────────

const NODE_META = {
  jd_parsing_node: { label: "Parsing job description" },
  skill_match_node: { label: "Matching your skills" },
  project_selection_node: { label: "Selecting best projects" },
  skill_selection_node: { label: "Tailoring skill list" },
  project_rewrite_node: { label: "Rewriting project bullets" },
  experience_rewrite_node: {
    label: "Rewriting experience bullets",
  },
  assemble_resume_node: { label: "Assembling resume" },
};

const INTERRUPT_LABELS = {
  project_selection_node: "Review selected projects",
  skill_selection_node: "Review skill ordering",
  project_rewrite_node: "Review rewritten projects",
  experience_rewrite_node: "Review rewritten experience",
};

const TERMINAL_STATUSES = [
  "tailored",
  "interrupted",
  "failed",
  "applied",
  "interviewing",
  "rejected",
];

// ─── Skill tag ────────────────────────────────────────────────────

function SkillTag({ label, variant = "neutral" }) {
  const colors = {
    matched: "bg-emerald-50 text-emerald-700 border-emerald-200",
    missing: "bg-red-50 text-red-600 border-red-200",
    neutral: "bg-slate-50 text-slate-600 border-slate-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colors[variant]}`}
    >
      {label}
    </span>
  );
}

// ─── Score bar ────────────────────────────────────────────────────

function ScoreBar({ label, value }) {
  const pct = Math.round(value * 100);
  const color =
    pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-semibold text-slate-500">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  );
}

// ─── Bullet diff ──────────────────────────────────────────────────

function BulletDiff({ original = [], rewritten = [] }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Original
        </p>
        <ul className="space-y-1.5">
          {original.map((b, i) => (
            <li
              key={i}
              className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 leading-relaxed border border-slate-100"
            >
              {b}
            </li>
          ))}
        </ul>
      </div>
      <div className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">
          Rewritten
        </p>
        <ul className="space-y-1.5">
          {rewritten.map((b, i) => (
            <li
              key={i}
              className="text-xs text-slate-700 bg-emerald-50 rounded-lg px-3 py-2 leading-relaxed border border-emerald-100"
            >
              {b}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── Node data renderers ──────────────────────────────────────────

function JDData({ data }) {
  const jd = data.jd_json;
  if (!jd) return null;
  return (
    <div className="space-y-4">
      {jd.location && (
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <MapPin className="w-4 h-4 text-slate-400" />
          {jd.location}
        </div>
      )}
      <div className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Must-have
        </p>
        <div className="flex flex-wrap gap-1.5">
          {jd.must_have_qualifications?.map((s) => (
            <SkillTag key={s} label={s} />
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Nice to have
        </p>
        <div className="flex flex-wrap gap-1.5">
          {jd.nice_to_have_qualifications?.map((s) => (
            <SkillTag key={s} label={s} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SkillMatchData({ data }) {
  const r = data.skill_match_results;
  if (!r) return null;
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <ScoreBar label="Must-have match" value={r.must_have_score} />
        <ScoreBar label="Nice-to-have match" value={r.nice_to_have_score} />
        <ScoreBar label="Overall score" value={r.final_score} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">
            Matched
          </p>
          <div className="flex flex-wrap gap-1.5">
            {r.matched_must_have?.map((s) => (
              <SkillTag key={s} label={s} variant="matched" />
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-red-400">
            Missing
          </p>
          <div className="flex flex-wrap gap-1.5">
            {r.missing_must_have?.map((s) => (
              <SkillTag key={s} label={s} variant="missing" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjectSelectionData({ data }) {
  return (
    <div className="space-y-3">
      {data.selected_projects?.map((p, i) => (
        <div
          key={i}
          className="rounded-xl border border-border/60 p-4 bg-white space-y-2"
        >
          <p className="font-bold text-sm tracking-tight">{p.title}</p>
          {p.description && (
            <p className="text-xs text-slate-500 leading-relaxed">
              {p.description}
            </p>
          )}
          <div className="flex flex-wrap gap-1">
            {p.technologies?.map((t) => (
              <SkillTag key={t} label={t} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SkillsSelectionData({ data }) {
  return (
    <div className="space-y-3">
      {data.selected_skills?.map((cat, i) => (
        <div key={i} className="space-y-1.5">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {cat.category}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {cat.skills?.map((s) => (
              <SkillTag key={s} label={s} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ProjectRewriteData({ data, resumeJson }) {
  const origMap = Object.fromEntries(
    (resumeJson?.projects || []).map((p) => [p.title, p.bullets]),
  );
  return (
    <div className="space-y-6">
      {data.rewritten_projects?.map((p, i) => (
        <div key={i} className="space-y-2">
          <p className="font-bold text-sm tracking-tight">{p.title}</p>
          <BulletDiff original={origMap[p.title] || []} rewritten={p.bullets} />
        </div>
      ))}
    </div>
  );
}

function ExperienceRewriteData({ data, resumeJson }) {
  const origMap = Object.fromEntries(
    (resumeJson?.experience || []).map((e) => [e.company + e.role, e.bullets]),
  );
  return (
    <div className="space-y-6">
      {data.rewritten_experience?.map((e, i) => (
        <div key={i} className="space-y-2">
          <p className="font-bold text-sm tracking-tight">
            {e.role}{" "}
            <span className="font-normal text-slate-500">@ {e.company}</span>
          </p>
          <BulletDiff
            original={origMap[e.company + e.role] || []}
            rewritten={e.bullets}
          />
        </div>
      ))}
    </div>
  );
}

function NodeDataRenderer({ node, data, resumeJson }) {
  if (node === "jd_parsing_node") return <JDData data={data} />;
  if (node === "skill_match_node") return <SkillMatchData data={data} />;
  if (node === "project_selection_node")
    return <ProjectSelectionData data={data} />;
  if (node === "skill_selection_node")
    return <SkillsSelectionData data={data} />;
  if (node === "project_rewrite_node")
    return <ProjectRewriteData data={data} resumeJson={resumeJson} />;
  if (node === "experience_rewrite_node")
    return <ExperienceRewriteData data={data} resumeJson={resumeJson} />;
  return null;
}

// ─── Step row ─────────────────────────────────────────────────────

function StepRow({ step, isActive, resumeJson, isLast }) {
  const [collapsed, setCollapsed] = useState(false);
  const meta = NODE_META[step.node] || { label: step.label };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex gap-4"
    >
      <div className="flex flex-col items-center">
        <div
          className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-sm
          ${isActive ? "bg-primary/10 border-2 border-primary/30" : "bg-emerald-50 border-2 border-emerald-200"}`}
        >
          {isActive ? (
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          )}
        </div>
        {!isLast && (
          <div className="w-0.5 flex-1 bg-border/40 mt-2 min-h-[16px]" />
        )}
      </div>

      <div className="flex-1 pb-5">
        <div className="flex items-center justify-between mb-2 min-h-[36px]">
          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-bold tracking-tight ${isActive ? "text-primary" : "text-slate-700"}`}
            >
              {meta.label}
            </span>
            {isActive && (
              <span className="text-[10px] font-black uppercase tracking-widest text-primary/60 animate-pulse">
                Running...
              </span>
            )}
          </div>
          {!isActive && step.data && (
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              {collapsed ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
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
              <Card className="border-border/50 bg-white/60 backdrop-blur-sm rounded-2xl">
                <CardContent className="p-4">
                  <NodeDataRenderer
                    node={step.node}
                    data={step.data}
                    resumeJson={resumeJson}
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Interrupt panel ──────────────────────────────────────────────

function InterruptPanel({ node, onSubmit, isSubmitting }) {
  const [feedback, setFeedback] = useState("");
  const label = INTERRUPT_LABELS[node] || "Review this step";
  const panelRef = useRef(null);

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

  return (
    <motion.div
      ref={panelRef}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35 }}
      className="pl-[52px]"
    >
      <Card className="border-primary/20 bg-primary/5 rounded-2xl shadow-sm">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-primary" />
            <p className="font-bold text-sm text-primary">{label}</p>
          </div>
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Leave blank to approve, or describe what to change..."
            className="min-h-[80px] text-sm rounded-xl border-border/60 resize-none"
          />
          <div className="flex gap-3">
            <Button
              onClick={() => onSubmit({ approved: true, feedback: "" })}
              disabled={isSubmitting}
              className="flex-1 btn-primary rounded-xl font-bold"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              Looks good, continue
            </Button>
            <Button
              onClick={() => onSubmit({ approved: false, feedback })}
              disabled={!feedback.trim() || isSubmitting}
              variant="outline"
              className="flex-1 rounded-xl font-bold border-border/60"
            >
              Request changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Complete banner ──────────────────────────────────────────────

function CompleteBanner({ pdfKey }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="pl-[52px]"
    >
      <Card className="border-emerald-200 bg-emerald-50 rounded-2xl">
        <CardContent className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-bold text-sm text-emerald-800">
                Resume tailored successfully
              </p>
              <p className="text-xs text-emerald-600">
                Your tailored resume is ready to download
              </p>
            </div>
          </div>
          {pdfKey && (
            <Button className="rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white">
              <FileDown className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────

export default function ApplicationDetail() {
  const { id } = useParams();
  const { token } = useAuth();
  const { sendApplicationFeedback, updateApplicationStatus } =
    useApplications();

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
      if (app && !TERMINAL_STATUSES.includes(app.status)) {
        startPolling();
      }
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

  const {
    steps = [],
    status,
    current_node,
    pdf_key,
    resume_json,
  } = application;

  const POST_TAILOR_STATUSES = [
    "tailored",
    "applied",
    "interviewing",
    "rejected",
  ];

  const isInterrupted = status === "interrupted";
  const isComplete = POST_TAILOR_STATUSES.includes(status);
  const isFailed = status === "failed";
  const isTailoring = status === "tailoring";

  const statusColor = isInterrupted
    ? "bg-amber-50 text-amber-700 border-amber-200"
    : isComplete
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : isFailed
        ? "bg-red-50 text-red-600 border-red-200"
        : "bg-primary/10 text-primary border-primary/20";

  const statusLabel = isInterrupted
    ? "Waiting for review"
    : isComplete
      ? "Complete"
      : isFailed
        ? "Failed"
        : "Tailoring...";

  // total items in timeline = completed steps + active node (if running)
  const hasActiveNode = current_node && isTailoring && !isInterrupted;
  const totalItems =
    steps.length +
    (hasActiveNode ? 1 : 0) +
    (isInterrupted || isComplete || isFailed ? 1 : 0);
  let itemIndex = 0;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
      {/* header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-black tracking-tight">
            {application.title || "Application"}
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            {application.company_name || application.job_id}
          </p>
        </div>
        <span
          className={`text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${statusColor}`}
        >
          {statusLabel}
        </span>
      </div>

      {POST_TAILOR_STATUSES.includes(application.status) && (
        <Select
          value={application.status}
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
      )}

      {/* timeline */}
      <div>
        {steps.map((step, i) => {
          itemIndex++;
          return (
            <StepRow
              key={step.id}
              step={step}
              isActive={false}
              resumeJson={resume_json}
              isLast={itemIndex === totalItems}
            />
          );
        })}

        <AnimatePresence>
          {hasActiveNode && (
            <StepRow
              key="active"
              step={{
                node: current_node,
                label: NODE_META[current_node]?.label,
                data: null,
              }}
              isActive={true}
              resumeJson={resume_json}
              isLast={!isInterrupted && !isComplete && !isFailed}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isInterrupted && (
            <InterruptPanel
              key="interrupt"
              node={current_node}
              onSubmit={handleFeedback}
              isSubmitting={isSubmitting}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isComplete && <CompleteBanner key="complete" pdfKey={pdf_key} />}
        </AnimatePresence>

        <AnimatePresence>
          {isFailed && (
            <motion.div
              key="failed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="pl-[52px]"
            >
              <Card className="border-red-200 bg-red-50 rounded-2xl">
                <CardContent className="p-5 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <p className="text-sm font-bold text-red-700">
                    Something went wrong. Please try again.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
