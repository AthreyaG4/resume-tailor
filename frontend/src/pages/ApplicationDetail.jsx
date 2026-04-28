import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Loader2,
  MapPin,
  Sparkles,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  FileDown,
  Copy,
  Check,
  X,
  FileText,
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
  jd_parsing_node: { label: "Job description" },
  skill_match_node: { label: "Skill match" },
  project_selection_node: { label: "Project selection" },
  skill_selection_node: { label: "Skill selection" },
  execute_project_rewrite_node: { label: "Project rewrites" },
  experience_rewrite_node: { label: "Experience rewrites" },
  assemble_resume_node: { label: "Assembling resume" },
};

const SIDEBAR_ITEMS = [
  { node: "jd_parsing_node", label: "Job description" },
  { node: "skill_match_node", label: "Skill match" },
  { node: "project_selection_node", label: "Project selection" },
  { node: "skill_selection_node", label: "Skill selection" },
  { node: "execute_project_rewrite_node", label: "Project rewrites" },
  { node: "__review__", label: "Your review" },
  { node: "__complete__", label: "Resume ready" },
];

const TERMINAL_STATUSES = [
  "tailored",
  "interrupted",
  "failed",
  "applied",
  "interviewing",
  "rejected",
];

const POST_TAILOR_STATUSES = ["tailored", "applied", "interviewing", "rejected"];

// ─── Helpers ──────────────────────────────────────────────────────

function scoreColor(pct) {
  if (pct >= 70) return { text: "#15803d", bg: "#f0fdf4", border: "#bbf7d0", track: "#dcfce7", fill: "#10b981" };
  if (pct >= 40) return { text: "#b45309", bg: "#fffbeb", border: "#fde68a", track: "#fef9c3", fill: "#f59e0b" };
  return { text: "#be123c", bg: "#fff1f2", border: "#fecdd3", track: "#fff1f2", fill: "#f43f5e" };
}

// ─── Sidebar ──────────────────────────────────────────────────────

function Sidebar({ steps, status, currentNode }) {
  const completedNodes = new Set(steps.map((s) => s.node));
  const isInterrupted = status === "interrupted";
  const isComplete = POST_TAILOR_STATUSES.includes(status);

  function getState(node) {
    if (node === "__review__") {
      if (isInterrupted) return "active";
      if (isComplete) return "done";
      return "pending";
    }
    if (node === "__complete__") {
      return isComplete ? "done" : "pending";
    }
    if (completedNodes.has(node)) return "done";
    if (node === currentNode) return "active";
    return "pending";
  }

  function scrollTo(node) {
    const el = document.getElementById(`step-${node}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <aside
      style={{ position: "sticky", top: 88 }}
      className="hidden lg:block self-start"
    >
      <p
        style={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#94a3b8",
          marginBottom: 14,
        }}
      >
        Progress
      </p>
      <div style={{ position: "relative" }}>
        {SIDEBAR_ITEMS.map((item, i) => {
          const state = getState(item.node);
          const isLast = i === SIDEBAR_ITEMS.length - 1;
          const nextState = !isLast ? getState(SIDEBAR_ITEMS[i + 1].node) : null;
          const spineGreen = state === "done" && nextState !== null;

          return (
            <div key={item.node} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              {/* Spine column */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 16 }}>
                {/* Dot */}
                {state === "done" && (
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", flexShrink: 0, marginTop: 3 }} />
                )}
                {state === "active" && (
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: "hsl(220 20% 20%)",
                      flexShrink: 0,
                      marginTop: 2,
                      boxShadow: "0 0 0 4px hsl(220 20% 20% / .12)",
                      transition: "box-shadow .25s",
                    }}
                  />
                )}
                {state === "pending" && (
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "transparent",
                      border: "1.5px solid #cbd5e1",
                      flexShrink: 0,
                      marginTop: 3,
                    }}
                  />
                )}
                {/* Connector */}
                {!isLast && (
                  <div
                    style={{
                      width: 1.5,
                      flexGrow: 1,
                      minHeight: 24,
                      background: spineGreen ? "#a7f3d0" : "#e2e8f0",
                      marginTop: 3,
                      marginBottom: 3,
                    }}
                  />
                )}
              </div>

              {/* Label */}
              <button
                onClick={() => scrollTo(item.node)}
                style={{
                  paddingTop: 1,
                  paddingBottom: isLast ? 0 : 20,
                  fontSize: 13,
                  fontWeight: state === "active" ? 700 : 500,
                  color:
                    state === "active"
                      ? "#0f172a"
                      : state === "done"
                      ? "#475569"
                      : "#94a3b8",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  padding: `1px 0 ${isLast ? 0 : 20}px`,
                  whiteSpace: "nowrap",
                }}
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

// ─── Score bar ────────────────────────────────────────────────────

function ScoreBar({ label, value }) {
  const pct = Math.round(value * 100);
  const c = scoreColor(pct);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: c.fill, letterSpacing: "-0.01em" }}>{pct}%</span>
      </div>
      <div style={{ height: 7, borderRadius: 99, background: c.track, overflow: "hidden" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
          style={{ height: "100%", borderRadius: 99, background: c.fill }}
        />
      </div>
    </div>
  );
}

// ─── Skill tag ────────────────────────────────────────────────────

function SkillTag({ label, variant = "neutral" }) {
  const styles = {
    neutral: { bg: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0" },
    ghost: { bg: "#f1f5f9", color: "#94a3b8", border: "1px solid #e2e8f0" },
    matched: { bg: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0" },
    missing: { bg: "#fff1f2", color: "#be123c", border: "1px solid #fecdd3" },
    dark: { bg: "hsl(220 20% 18%)", color: "#f8fafc", border: "1px solid hsl(220 20% 18%)" },
  };
  const s = styles[variant] || styles.neutral;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        lineHeight: "18px",
        whiteSpace: "nowrap",
        background: s.bg,
        color: s.color,
        border: s.border,
      }}
    >
      {label}
    </span>
  );
}

// ─── JD Content ───────────────────────────────────────────────────

function JDContent({ data }) {
  const jd = data.jd_json;
  if (!jd) return null;
  const mustHave = jd.must_have_qualifications || [];
  const niceToHave = jd.nice_to_have_qualifications || [];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {jd.location && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: 99,
            padding: "5px 12px",
            alignSelf: "flex-start",
          }}
        >
          <MapPin style={{ width: 13, height: 13, color: "#94a3b8", flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 500, color: "#475569" }}>{jd.location}</span>
        </div>
      )}

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#94a3b8" }}>
            Must-have
          </span>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>{mustHave.length} skills</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {mustHave.map((s) => <SkillTag key={s} label={s} variant="neutral" />)}
        </div>
      </div>

      <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#94a3b8" }}>
            Nice to have
          </span>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>{niceToHave.length} skills</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {niceToHave.map((s) => <SkillTag key={s} label={s} variant="ghost" />)}
        </div>
      </div>
    </div>
  );
}

// ─── Skill Match Content ──────────────────────────────────────────

function SkillMatchContent({ data }) {
  const r = data.skill_match_results;
  if (!r) return null;
  const overallPct = Math.round((r.final_score || 0) * 100);
  const c = scoreColor(overallPct);
  const matched = r.matched_must_have || [];
  const missing = r.missing_must_have || [];
  const total = matched.length + missing.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Summary card */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            background: c.bg,
            border: `1px solid ${c.border}`,
            borderRadius: 14,
            padding: "10px 16px",
            flexShrink: 0,
          }}
        >
          <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 28, color: c.text, lineHeight: 1 }}>
            {overallPct}%
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: c.text, opacity: 0.7 }}>overall match</div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.5 }}>
            <span style={{ fontWeight: 700, color: "#0f172a" }}>{matched.length}</span> of{" "}
            <span style={{ fontWeight: 700, color: "#0f172a" }}>{total}</span> must-have skills matched
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>
            {missing.length} skills missing from your resume
          </div>
        </div>
      </div>

      {/* Score bars */}
      <div style={{ background: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: 14, padding: "14px 16px" }}>
        <ScoreBar label="Must-have match" value={r.must_have_score || 0} />
        <ScoreBar label="Nice-to-have match" value={r.nice_to_have_score || 0} />
        <ScoreBar label="Overall score" value={r.final_score || 0} />
      </div>

      {/* Matched / Missing grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 14, padding: "12px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#15803d" }}>Matched</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#15803d", background: "#dcfce7", padding: "1px 7px", borderRadius: 99 }}>{matched.length}</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {matched.map((s) => <SkillTag key={s} label={s} variant="matched" />)}
          </div>
        </div>
        <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: 14, padding: "12px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#be123c" }}>Missing</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#be123c", background: "#ffe4e6", padding: "1px 7px", borderRadius: 99 }}>{missing.length}</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {missing.map((s) => <SkillTag key={s} label={s} variant="missing" />)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Project Selection Content ────────────────────────────────────

function ProjectSelectionContent({ data }) {
  const projects = data.selected_projects || [];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <p style={{ fontSize: 12, fontWeight: 500, color: "#64748b", marginBottom: 4 }}>
        {projects.length} projects selected for tailoring
      </p>
      {projects.map((p, i) => (
        <div
          key={i}
          style={{
            background: "#f8fafc",
            border: "1px solid hsl(220 10% 91%)",
            borderRadius: 14,
            padding: "13px 16px",
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              background: "hsl(220 20% 18%)",
              color: "#fff",
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {i + 1}
          </div>
          <div>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
              {p.title}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {(p.technologies || []).map((t) => <SkillTag key={t} label={t} variant="neutral" />)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Skill Selection Content ──────────────────────────────────────

function SkillSelectionContent({ data, resumeJson, isEditable, onChange }) {
  const allSkills = resumeJson?.skills || [];
  const [selectedSet, setSelectedSet] = useState(() =>
    new Set(data.selected_skills?.flatMap((cat) => cat.skills) || [])
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

  const skillCount = isEditable ? selectedSet.size : (data.selected_skills?.flatMap((c) => c.skills) || []).length;
  const categoryCount = isEditable
    ? (resumeJson?.skills || []).filter((cat) => (cat.skills || []).some((s) => selectedSet.has(s))).length
    : (data.selected_skills || []).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <p style={{ fontSize: 12, fontWeight: 500, color: "#64748b" }}>
        <span style={{ fontWeight: 700, color: "#0f172a" }}>{skillCount}</span> skills selected across{" "}
        <span style={{ fontWeight: 700, color: "#0f172a" }}>{categoryCount}</span> categories
      </p>
      {isEditable && (
        <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#94a3b8" }}>
          Click skills to toggle
        </p>
      )}
      {(isEditable ? allSkills : data.selected_skills || []).map((cat, i) => (
        <div key={i}>
          <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#94a3b8", marginBottom: 6 }}>
            {cat.category}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {(cat.skills || []).map((s) => {
              const isSelected = isEditable ? selectedSet.has(s) : true;
              if (isEditable) {
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setSelectedSet((prev) => {
                        const next = new Set(prev);
                        next.has(s) ? next.delete(s) : next.add(s);
                        return next;
                      });
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "3px 10px",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 600,
                      lineHeight: "18px",
                      whiteSpace: "nowrap",
                      cursor: "pointer",
                      border: "none",
                      background: isSelected ? "hsl(220 20% 18%)" : "#f1f5f9",
                      color: isSelected ? "#f8fafc" : "#94a3b8",
                      transition: "all .15s",
                    }}
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

// ─── Project Rewrite Data (read-only, in step history) ────────────

function ProjectRewriteData({ data, resumeJson }) {
  const origMap = Object.fromEntries(
    (resumeJson?.projects || []).map((p) => [p.title, p.bullets])
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {(data.rewritten_projects || []).map((p, i) => (
        <div key={i}>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
            {p.title}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#94a3b8", marginBottom: 6 }}>Original</p>
              {(origMap[p.title] || []).map((b, j) => (
                <div key={j} style={{ fontSize: 12, color: "#64748b", background: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: 11, padding: "8px 12px", marginBottom: 4, lineHeight: 1.6 }}>{b}</div>
              ))}
            </div>
            <div>
              <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#059669", marginBottom: 6 }}>Rewritten</p>
              {(p.bullets || []).map((b, j) => (
                <div key={j} style={{ fontSize: 12, color: "#1e293b", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 11, padding: "8px 12px", marginBottom: 4, lineHeight: 1.6 }}>{b}</div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Experience Rewrite Data ──────────────────────────────────────

function ExperienceRewriteData({ data, resumeJson }) {
  const origMap = Object.fromEntries(
    (resumeJson?.experience || []).map((e) => [e.company + e.role, e.bullets])
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {(data.rewritten_experience || []).map((e, i) => (
        <div key={i}>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
            {e.role} <span style={{ fontWeight: 400, color: "#64748b" }}>@ {e.company}</span>
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#94a3b8", marginBottom: 6 }}>Original</p>
              {(origMap[e.company + e.role] || []).map((b, j) => (
                <div key={j} style={{ fontSize: 12, color: "#64748b", background: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: 11, padding: "8px 12px", marginBottom: 4, lineHeight: 1.6 }}>{b}</div>
              ))}
            </div>
            <div>
              <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#059669", marginBottom: 6 }}>Rewritten</p>
              {(e.bullets || []).map((b, j) => (
                <div key={j} style={{ fontSize: 12, color: "#1e293b", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 11, padding: "8px 12px", marginBottom: 4, lineHeight: 1.6 }}>{b}</div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Node data renderer ───────────────────────────────────────────

function NodeDataRenderer({ node, data, resumeJson, isEditable, onSkillsChange }) {
  if (node === "jd_parsing_node") return <JDContent data={data} />;
  if (node === "skill_match_node") return <SkillMatchContent data={data} />;
  if (node === "project_selection_node") return <ProjectSelectionContent data={data} />;
  if (node === "skill_selection_node")
    return <SkillSelectionContent data={data} resumeJson={resumeJson} isEditable={isEditable} onChange={onSkillsChange} />;
  if (node === "execute_project_rewrite_node") return <ProjectRewriteData data={data} resumeJson={resumeJson} />;
  if (node === "experience_rewrite_node") return <ExperienceRewriteData data={data} resumeJson={resumeJson} />;
  return null;
}

// ─── Step row ─────────────────────────────────────────────────────

function StepRow({ step, isActive, resumeJson, isLast, onSkillsChange }) {
  const [collapsed, setCollapsed] = useState(false);
  const meta = NODE_META[step.node] || { label: step.label };
  const isEditableSkillStep = isLast && step.node === "skill_selection_node" && !isActive;

  return (
    <motion.div
      id={`step-${step.node}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      style={{ display: "flex", gap: 16, scrollMarginTop: 88 }}
    >
      {/* Icon column */}
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

      {/* Content */}
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
          {!isActive && step.data && !isEditableSkillStep && (
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
                <NodeDataRenderer
                  node={step.node}
                  data={step.data}
                  resumeJson={resumeJson}
                  isEditable={isEditableSkillStep}
                  onSkillsChange={onSkillsChange}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Project Carousel ─────────────────────────────────────────────

function ProjectCarousel({ interruptPayloads, resumeJson, onSubmit, isSubmitting }) {
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

  const current = interruptPayloads[idx];
  const project = current?.value?.rewritten_project;
  const origMap = Object.fromEntries(
    (resumeJson?.projects || []).map((p) => [p.title, p.bullets])
  );
  const originalBullets = project ? (origMap[project.title] || []) : [];
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
    if (next !== -1) {
      setTimeout(() => goTo(next), 300);
    }
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
      {/* Icon column */}
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
            background: "hsl(220 20% 95%)",
            border: "2px solid hsl(220 20% 78%)",
          }}
        >
          <AlertCircle style={{ width: 16, height: 16, color: "hsl(220 20% 40%)" }} />
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, paddingBottom: 20 }}>
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>Review rewritten projects</p>
            <p style={{ fontSize: 11, fontWeight: 500, color: "#94a3b8", marginTop: 2 }}>Approve each or request changes</p>
          </div>
          {/* Stepper dots */}
          <div style={{ display: "flex", gap: 5, alignItems: "center", paddingTop: 2 }}>
            {interruptPayloads.map((p, i) => {
              const d = decisions[p.id];
              const isActive = i === idx;
              const isApproved = d?.approved === true;
              const isRejected = d?.approved === false;
              return (
                <button
                  key={p.id}
                  onClick={() => goTo(i)}
                  style={{
                    width: isActive ? 20 : 8,
                    height: 8,
                    borderRadius: 99,
                    border: "none",
                    cursor: "pointer",
                    transition: "all .25s ease",
                    background: isActive
                      ? "hsl(220 20% 20%)"
                      : isApproved
                      ? "#10b981"
                      : isRejected
                      ? "#f43f5e"
                      : "#cbd5e1",
                    padding: 0,
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
            style={{
              background: "#fff",
              border: "1px solid hsl(220 10% 90%)",
              borderRadius: 20,
              boxShadow: "0 1px 8px -2px rgba(0,0,0,.06)",
              overflow: "hidden",
            }}
          >
            {/* Card header */}
            <div style={{ padding: "18px 20px 16px", borderBottom: "1px solid hsl(220 10% 95%)", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: "#0f172a", lineHeight: 1.25 }}>
                  {project?.title}
                </p>
                <p style={{ fontSize: 11, fontWeight: 500, color: "#94a3b8", marginTop: 2 }}>
                  Project {idx + 1} of {interruptPayloads.length}
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
                  style={{
                    width: 28, height: 28, borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc",
                    display: "flex", alignItems: "center", justifyContent: "center", cursor: idx === 0 ? "not-allowed" : "pointer",
                    opacity: idx === 0 ? 0.3 : 1,
                  }}
                >
                  <ChevronLeft style={{ width: 14, height: 14, color: "#475569" }} />
                </button>
                <button
                  onClick={() => idx < interruptPayloads.length - 1 && goTo(idx + 1)}
                  disabled={idx === interruptPayloads.length - 1}
                  style={{
                    width: 28, height: 28, borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc",
                    display: "flex", alignItems: "center", justifyContent: "center", cursor: idx === interruptPayloads.length - 1 ? "not-allowed" : "pointer",
                    opacity: idx === interruptPayloads.length - 1 ? 0.3 : 1,
                  }}
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
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 5, background: "none", border: "none",
                    cursor: "pointer", fontSize: 11, fontWeight: 600, color: showCompare ? "#0f172a" : "#94a3b8",
                  }}
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
                (project?.bullets || []).map((b, i) => (
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
                      boxSizing: "border-box", marginBottom: 12,
                      fontFamily: "inherit",
                    }}
                    onFocus={(e) => { e.target.style.borderColor = "hsl(220 20% 50%)"; }}
                    onBlur={(e) => { e.target.style.borderColor = "hsl(220 10% 88%)"; }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action row */}
            <div style={{ padding: "14px 20px 18px", borderTop: "1px solid hsl(220 10% 96%)", display: "flex", gap: 10 }}>
              <button
                onClick={handleApprove}
                style={{
                  flex: 1, height: 42, borderRadius: 12, border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  fontSize: 13, fontWeight: 700,
                  background: "hsl(220 20% 18%)", color: "#fff",
                  opacity: decision.approved === false ? 0.5 : 1,
                  boxShadow: decision.approved === true ? "0 1px 4px -1px hsl(220 20% 18% / .2)" : "none",
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

        {/* Submit button */}
        <div style={{ marginTop: 14 }}>
          <button
            onClick={handleSubmit}
            disabled={!allDecided || isSubmitting}
            style={{
              width: "100%", height: 44, borderRadius: 13, border: "none", cursor: allDecided ? "pointer" : "not-allowed",
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
              {pendingCount} project{pendingCount > 1 ? "s" : ""} still need review
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Single interrupt panel ───────────────────────────────────────

function SingleInterruptPanel({ node, interruptPayloads, onSubmit, isSubmitting, selectionData }) {
  const [feedback, setFeedback] = useState("");
  const panelRef = useRef(null);
  const label =
    node === "project_selection_review_node" ? "Review selected projects"
    : node === "skill_selection_review_node" ? "Review skill selection"
    : node === "experience_rewrite_review_node" ? "Review rewritten experience"
    : "Review this step";

  useEffect(() => {
    setTimeout(() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
  }, []);

  function handleSubmit(approved) {
    const response = {
      interrupt_id: interruptPayloads[0]?.id,
      approved,
      feedback: approved ? "" : feedback,
    };
    if (selectionData !== undefined) response.edited_skills = selectionData;
    onSubmit({ responses: [response] });
  }

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
        <p style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 12 }}>{label}</p>
        <div style={{ background: "#fff", border: "1px solid hsl(220 10% 91%)", borderRadius: 16, padding: "18px 20px", boxShadow: "0 1px 6px -2px rgba(0,0,0,.05)" }}>
          {node !== "skill_selection_review_node" && (
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Leave blank to approve, or describe what to change..."
              style={{
                width: "100%", minHeight: 80, background: "#fafafa",
                border: "1px solid hsl(220 10% 88%)", borderRadius: 12,
                padding: "10px 14px", fontSize: 13, color: "#0f172a",
                lineHeight: 1.55, resize: "none", outline: "none",
                boxSizing: "border-box", marginBottom: 12, fontFamily: "inherit",
              }}
            />
          )}
          <div style={{ display: "flex", gap: 10 }}>
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
            {node !== "skill_selection_review_node" && (
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

// ─── Complete banner ──────────────────────────────────────────────

function CompleteBanner({ pdfKey, latexContent }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!latexContent) return;
    await navigator.clipboard.writeText(latexContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <motion.div
      id="step-__complete__"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      style={{ scrollMarginTop: 88 }}
    >
      <div
        style={{
          background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 20,
          padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 40, height: 40, background: "#dcfce7", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Sparkles style={{ width: 20, height: 20, color: "#16a34a" }} />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#166534" }}>Resume tailored successfully</p>
            <p style={{ fontSize: 12, color: "#16a34a", marginTop: 2 }}>Your tailored resume is ready to download</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {latexContent && (
            <button
              onClick={handleCopy}
              style={{
                height: 38, padding: "0 14px", borderRadius: 12, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700,
                background: "#fff", color: "#15803d", border: "1px solid #bbf7d0",
              }}
            >
              {copied ? <Check style={{ width: 14, height: 14 }} /> : <Copy style={{ width: 14, height: 14 }} />}
              {copied ? "Copied!" : "Copy LaTeX"}
            </button>
          )}
          {pdfKey && (
            <button
              style={{
                height: 38, padding: "0 16px", borderRadius: 12, border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700,
                background: "#16a34a", color: "#fff",
              }}
            >
              <FileDown style={{ width: 14, height: 14 }} />
              Download PDF
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────

export default function ApplicationDetail() {
  const { id } = useParams();
  const { token } = useAuth();
  const { sendApplicationFeedback, updateApplicationStatus } = useApplications();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingSkillSelection, setPendingSkillSelection] = useState(null);

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

  useEffect(() => {
    if (
      application?.status === "interrupted" &&
      application?.current_node === "skill_selection_review_node"
    ) {
      const skillStep = [...(application.steps || [])].reverse().find((s) => s.node === "skill_selection_node");
      if (skillStep?.data?.selected_skills) setPendingSkillSelection(skillStep.data.selected_skills);
    } else {
      setPendingSkillSelection(null);
    }
  }, [application?.status, application?.current_node]);

  async function handleFeedback(feedback) {
    setIsSubmitting(true);
    try {
      await sendApplicationFeedback(feedback, id);
      const editedSkills = feedback.responses?.find((r) => r.edited_skills != null)?.edited_skills;
      setApplication((prev) => ({
        ...prev,
        status: "tailoring",
        current_node: null,
        interrupt_payloads: null,
        steps: editedSkills
          ? prev.steps.map((s) =>
              s.node === "skill_selection_node"
                ? { ...s, data: { ...s.data, selected_skills: editedSkills } }
                : s
            )
          : prev.steps,
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
  const hasActiveNode = current_node && isTailoring && !isInterrupted;

  const isProjectRewriteInterrupt =
    isInterrupted && current_node === "execute_project_rewrite_node";
  const interruptPayloads = application.interrupt_payloads || [];

  const lastStepIndex = steps.length - 1;

  const statusLabel = isInterrupted
    ? "Waiting for review"
    : isComplete
    ? "Complete"
    : isFailed
    ? "Failed"
    : "Tailoring...";

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
        style={{
          display: "grid",
          gridTemplateColumns: "260px 1fr",
          gap: 48,
          alignItems: "start",
        }}
        className="lg:grid block"
      >
        {/* Sidebar */}
        <Sidebar steps={steps} status={status} currentNode={current_node} />

        {/* Main column */}
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
            {steps.map((step, i) => {
              const isEditableLast =
                i === lastStepIndex &&
                isInterrupted &&
                !hasActiveNode &&
                current_node === "skill_selection_review_node";
              return (
                <StepRow
                  key={step.id}
                  step={step}
                  isActive={false}
                  resumeJson={resume_json}
                  isLast={isEditableLast}
                  onSkillsChange={
                    isEditableLast && step.node === "skill_selection_node"
                      ? setPendingSkillSelection
                      : undefined
                  }
                />
              );
            })}

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
              {isProjectRewriteInterrupt && interruptPayloads.length > 0 && (
                <ProjectCarousel
                  key="carousel"
                  interruptPayloads={interruptPayloads}
                  resumeJson={resume_json}
                  onSubmit={handleFeedback}
                  isSubmitting={isSubmitting}
                />
              )}
              {isInterrupted && !isProjectRewriteInterrupt && (
                <SingleInterruptPanel
                  key="interrupt"
                  node={current_node}
                  interruptPayloads={interruptPayloads}
                  onSubmit={handleFeedback}
                  isSubmitting={isSubmitting}
                  selectionData={
                    current_node === "skill_selection_review_node"
                      ? pendingSkillSelection
                      : undefined
                  }
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
