import { useParams, useNavigate } from "react-router";
import { useResume } from "../hooks/useResume";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { ArrowLeft, Plus, X } from "lucide-react";
import { toast } from "../components/ui/sonner";

// ─── Completeness ──────────────────────────────────────────────────────────────

const COMPLETION_FIELDS = [
  { key: "description", weight: 1 },
  { key: "technical_decisions", weight: 2 },
  { key: "challenges", weight: 2 },
  { key: "achievements", weight: 1, isList: true },
  { key: "role", weight: 1 },
];
const TOTAL_WEIGHT = COMPLETION_FIELDS.reduce((s, f) => s + f.weight, 0);

function getCompleteness(values) {
  let filled = 0;
  for (const f of COMPLETION_FIELDS) {
    const val = values[f.key];
    if (f.isList ? (val?.length ?? 0) > 0 : !!val) filled += f.weight;
  }
  return Math.round((filled / TOTAL_WEIGHT) * 100);
}

function getHint(values) {
  if (!values.technical_decisions && !values.challenges)
    return "Add technical decisions and hard problems for better AI output";
  if (!values.description) return "Add a description to complete the overview";
  if (!values.technical_decisions)
    return "Add technical decisions to signal seniority";
  if (!values.challenges)
    return "Add hard problems solved for stronger bullet points";
  if (!(values.achievements?.length > 0))
    return "Add key achievements to quantify your impact";
  if (!values.role)
    return "Add your role to give context to your contributions";
  return "Great — your project context is thorough";
}

// ─── Primitives ────────────────────────────────────────────────────────────────

function Badge({ variant }) {
  if (variant === "required")
    return (
      <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-green-100 text-green-700">
        Required
      </span>
    );
  if (variant === "recommended")
    return (
      <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">
        Recommended
      </span>
    );
  return (
    <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-slate-100 text-slate-400">
      Optional
    </span>
  );
}

function Section({ title, badge, hint, children }) {
  return (
    <div className="bg-white border border-slate-200/60 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        <Badge variant={badge} />
      </div>
      {hint && <p className="text-[11px] text-slate-400 mb-3">{hint}</p>}
      {children}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ProjectDetailPage() {
  const { index } = useParams();
  const navigate = useNavigate();
  const { resume, saveResume } = useResume();
  const [isSaving, setIsSaving] = useState(false);

  const projectIndex = parseInt(index, 10);
  const projects = resume?.resume_json?.projects ?? [];
  const project = projects[projectIndex];

  const form = useForm({ defaultValues: project ?? {} });

  const liveValues = form.watch();
  const technologies = liveValues.technologies ?? [];
  const achievements = liveValues.achievements ?? [];
  const pct = getCompleteness(liveValues);
  const hint = getHint(liveValues);

  const [newTech, setNewTech] = useState("");

  if (!project) {
    navigate("/resume");
    return null;
  }

  function addTech() {
    const t = newTech.trim();
    if (!t) return;
    form.setValue("technologies", [...technologies, t]);
    setNewTech("");
  }

  function removeTech(i) {
    form.setValue(
      "technologies",
      technologies.filter((_, idx) => idx !== i),
    );
  }

  function addAchievement() {
    form.setValue("achievements", [...achievements, ""]);
  }

  function updateAchievement(i, value) {
    const updated = [...achievements];
    updated[i] = value;
    form.setValue("achievements", updated);
  }

  function removeAchievement(i) {
    form.setValue(
      "achievements",
      achievements.filter((_, idx) => idx !== i),
    );
  }

  async function handleSave(data) {
    setIsSaving(true);
    try {
      const updatedProjects = [...projects];
      updatedProjects[projectIndex] = { ...data, achievements, technologies };
      await saveResume({ ...resume.resume_json, projects: updatedProjects });
      toast.success("Project saved");
    } catch {
      toast.error("Failed to save project");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <button
            onClick={() => navigate("/resume")}
            className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-700 transition-colors bg-transparent border-none cursor-pointer p-0 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Master resume
          </button>
          <h1 className="text-[22px] font-medium text-slate-900 leading-tight">
            {liveValues.title || "Untitled Project"}
          </h1>
        </div>
        <Button
          type="submit"
          form="project-detail-form"
          disabled={isSaving}
          className="btn-primary mt-1 shrink-0"
        >
          {isSaving ? "Saving..." : "Save project"}
        </Button>
      </div>

      {/* Completeness bar */}
      <div className="bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 mb-4 flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-medium text-slate-700">
            Profile completeness
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">{hint}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-32 h-[5px] bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: "#10b981" }}
            />
          </div>
          <span className="text-[12px] font-bold text-emerald-600 w-8 text-right tabular-nums">
            {pct}%
          </span>
        </div>
      </div>

      <form
        id="project-detail-form"
        onSubmit={form.handleSubmit(handleSave)}
        className="space-y-[10px]"
      >
        {/* Overview */}
        <Section
          title="Overview"
          badge="required"
          hint="What this project is — one paragraph a recruiter can skim in 10 seconds"
        >
          <div className="space-y-3">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-slate-600">Title</p>
              <Input {...form.register("title")} />
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-slate-600">Link</p>
              <Input
                {...form.register("link")}
                placeholder="GitHub repo, live URL, or demo..."
              />
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-slate-600">Description</p>
              <Textarea
                {...form.register("description")}
                placeholder="A plain English overview of what the project does and why you built it..."
                className="min-h-[90px] resize-vertical"
              />
            </div>
          </div>
        </Section>

        {/* Tech stack */}
        <Section
          title="Tech stack"
          badge="required"
          hint="Every tool, framework, language, and service — don't filter"
        >
          <div className="space-y-2">
            {technologies.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {technologies.map((t, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => removeTech(i)}
                      className="text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <Input
              value={newTech}
              onChange={(e) => setNewTech(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTech();
                }
              }}
              placeholder="Type a technology and press Enter..."
              className="w-full text-sm"
            />
          </div>
        </Section>

        {/* Technical decisions */}
        <Section
          title="Core technical decisions"
          badge="recommended"
          hint="Signals seniority — why this framework, what tradeoffs you considered, what you'd do differently"
        >
          <Textarea
            {...form.register("technical_decisions")}
            placeholder="e.g. Used Redis for session storage instead of the DB because we needed sub-millisecond reads. Chose Next.js over CRA for SSR to improve SEO..."
            className="min-h-[100px] resize-vertical"
          />
        </Section>

        {/* Hard problems */}
        <Section
          title="Hard problems solved"
          badge="recommended"
          hint="The messy stuff that wasn't in any tutorial — what broke, what edge cases you handled"
        >
          <Textarea
            {...form.register("challenges")}
            placeholder="e.g. Race condition in the payment flow when two users booked the same slot simultaneously. Took two days to reproduce reliably in staging..."
            className="min-h-[100px] resize-vertical"
          />
        </Section>

        {/* Achievements */}
        <Section
          title="Key achievements & metrics"
          badge="optional"
          hint="Specific outcomes — numbers, before/after comparisons, time saved"
        >
          <div className="space-y-2">
            {achievements.map((ach, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Input
                  value={ach}
                  onChange={(e) => updateAchievement(i, e.target.value)}
                  className="flex-1 text-sm"
                  placeholder="e.g. Reduced API latency by 40% after switching to connection pooling"
                />
                <button
                  type="button"
                  onClick={() => removeAchievement(i)}
                  className="text-slate-300 hover:text-red-400 transition-colors p-1 shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addAchievement}
              className="flex items-center gap-1 text-[12px] font-medium text-slate-400 hover:text-slate-700 transition-colors bg-transparent border-none cursor-pointer p-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Add achievement
            </button>
          </div>
        </Section>

        {/* Role & scope */}
        <Section
          title="Your role & scope"
          badge="optional"
          hint="Solo or team? How long? What did you personally own?"
        >
          <Textarea
            {...form.register("role")}
            placeholder="e.g. Led backend development in a team of 3. Personally owned the auth system and data pipeline..."
            className="min-h-[70px] resize-vertical"
          />
        </Section>
      </form>
    </div>
  );
}
