import { useParams, useNavigate } from "react-router";
import { useResume } from "../hooks/useResume";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { ArrowLeft, Plus, X, User } from "lucide-react";
import { toast } from "../components/ui/sonner";
import { getExperienceCompletion } from "../components/ExperienceRow";

// ─── Completeness ──────────────────────────────────────────────────────────────

const COMPLETION_FIELDS = [
  { key: "description", weight: 1 },
  { key: "seniority_ownership", weight: 2 },
  { key: "responsibilities", weight: 2, isList: true },
  { key: "technical_decisions", weight: 2 },
  { key: "achievements", weight: 2, isList: true },
  { key: "challenges_learnings", weight: 1 },
];
const TOTAL_WEIGHT = COMPLETION_FIELDS.reduce((s, f) => s + f.weight, 0);

function getHint(values) {
  if (!values.description)
    return "Add a role description so the AI understands your context";
  if (!values.seniority_ownership && !values.technical_decisions)
    return "Add seniority context and technical decisions for stronger bullets";
  if (!values.seniority_ownership)
    return "Add seniority & ownership to frame your contributions correctly";
  if (!(values.responsibilities?.length > 0))
    return "Add key responsibilities to ground the bullet generation";
  if (!values.technical_decisions)
    return "Add technical decisions to signal engineering depth";
  if (!(values.achievements?.length > 0))
    return "Add achievements with numbers for the strongest possible bullets";
  if (!values.challenges_learnings)
    return "Add challenges & learnings to complete the profile";
  return "Great — this experience is well documented";
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

function ListInput({ items, onChange, placeholder, addLabel }) {
  function update(i, value) {
    const updated = [...items];
    updated[i] = value;
    onChange(updated);
  }
  function remove(i) {
    onChange(items.filter((_, idx) => idx !== i));
  }
  function add() {
    onChange([...items, ""]);
  }

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 items-center">
          <Input
            value={item}
            onChange={(e) => update(i, e.target.value)}
            className="flex-1 text-sm"
            placeholder={placeholder}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="text-slate-300 hover:text-red-400 transition-colors p-1 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="flex items-center gap-1 text-[12px] font-medium text-slate-400 hover:text-slate-700 transition-colors bg-transparent border-none cursor-pointer p-0"
      >
        <Plus className="w-3.5 h-3.5" />
        {addLabel}
      </button>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

const EMP_TYPES = ["Full-time", "Part-time", "Contract", "Internship"];

export default function ExperienceDetailPage() {
  const { index } = useParams();
  const navigate = useNavigate();
  const { resume, saveResume } = useResume();
  const [isSaving, setIsSaving] = useState(false);

  const expIndex = parseInt(index, 10);
  const experiences = resume?.resume_json?.experience ?? [];
  const experience = experiences[expIndex];

  const form = useForm({ defaultValues: experience ?? {} });

  const liveValues = form.watch();
  const technologies = liveValues.technologies ?? [];
  const responsibilities = liveValues.responsibilities ?? [];
  const achievements = liveValues.achievements ?? [];
  const pct = getExperienceCompletion(liveValues);
  const hint = getHint(liveValues);

  const [newTech, setNewTech] = useState("");

  if (!experience) {
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

  const subtitle = [experience.company, experience.start_date && experience.end_date
    ? `${experience.start_date} – ${experience.end_date}`
    : experience.start_date || experience.end_date]
    .filter(Boolean)
    .join(" · ");

  async function handleSave(data) {
    setIsSaving(true);
    try {
      const updated = [...experiences];
      updated[expIndex] = {
        ...data,
        technologies,
        responsibilities,
        achievements,
      };
      await saveResume({ ...resume.resume_json, experience: updated });
      toast.success("Experience saved");
    } catch {
      toast.error("Failed to save experience");
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
            {liveValues.role || "Untitled Role"}
          </h1>
          {subtitle && (
            <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        <Button
          type="submit"
          form="experience-detail-form"
          disabled={isSaving}
          className="btn-primary mt-1 shrink-0"
        >
          {isSaving ? "Saving..." : "Save experience"}
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
        id="experience-detail-form"
        onSubmit={form.handleSubmit(handleSave)}
        className="space-y-[10px]"
      >
        {/* Section 1 — Role overview */}
        <Section
          title="Role overview"
          badge="required"
          hint="The basics that anchor every bullet the AI writes"
        >
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-slate-600">Company</p>
                <Input {...form.register("company")} />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-slate-600">Role title</p>
                <Input {...form.register("role")} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-slate-600">Location</p>
                <Input {...form.register("location")} />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-slate-600">Start date</p>
                <Input {...form.register("start_date")} placeholder="Jan 2022" />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-slate-600">End date</p>
                <Input
                  {...form.register("end_date")}
                  placeholder="Present"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-slate-600">
                  Employment type
                </p>
                <select
                  {...form.register("emp_type")}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Select...</option>
                  {EMP_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-slate-600">Industry</p>
                <Input
                  {...form.register("industry")}
                  placeholder="e.g. Fintech, Healthcare"
                />
              </div>
            </div>
          </div>
        </Section>

        {/* Section 2 — Role description */}
        <Section
          title="Role description"
          badge="required"
          hint="Plain English — what did the team do, what were you responsible for?"
        >
          <Textarea
            {...form.register("description")}
            placeholder="e.g. Joined as the second backend engineer on a fintech startup. Responsible for the payments infrastructure, internal tooling, and API integrations..."
            className="min-h-[90px] resize-vertical"
          />
        </Section>

        {/* Section 3 — Seniority & ownership */}
        <Section
          title="Seniority & ownership"
          badge="recommended"
          hint="Shapes how bullets are framed — IC vs lead, owned vs contributed"
        >
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
              <User className="w-4 h-4 text-blue-500" />
            </div>
            <Textarea
              {...form.register("seniority_ownership")}
              placeholder="e.g. Individual contributor in a team of 6. Owned the entire data pipeline end to end. Led 2 junior devs on the reporting module..."
              className="min-h-[70px] resize-vertical flex-1"
            />
          </div>
        </Section>

        {/* Section 4 — Key responsibilities */}
        <Section
          title="Key responsibilities"
          badge="recommended"
          hint="What did you actually do day to day? One responsibility per row"
        >
          <ListInput
            items={responsibilities}
            onChange={(v) => form.setValue("responsibilities", v)}
            placeholder="e.g. Designed and maintained the core payment processing API"
            addLabel="Add responsibility"
          />
        </Section>

        {/* Section 5 — Technical decisions & challenges */}
        <Section
          title="Technical decisions & challenges"
          badge="recommended"
          hint="The why behind your choices and the hard problems you solved"
        >
          <Textarea
            {...form.register("technical_decisions")}
            placeholder="e.g. Chose event-driven architecture over REST polling to handle webhook fan-out at scale. Spent a week debugging a race condition in distributed locks..."
            className="min-h-[100px] resize-vertical"
          />
        </Section>

        {/* Section 6 — Achievements & impact */}
        <Section
          title="Achievements & impact"
          badge="recommended"
          hint="Numbers, before/after comparisons, time saved, business impact. Most important field for strong bullets."
        >
          <ListInput
            items={achievements}
            onChange={(v) => form.setValue("achievements", v)}
            placeholder="e.g. Reduced P95 latency from 800ms to 120ms after rewriting the query layer"
            addLabel="Add achievement"
          />
        </Section>

        {/* Section 7 — Technologies */}
        <Section
          title="Technologies used"
          badge="required"
          hint="Full list including internal tools — don't filter"
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

        {/* Section 8 — Challenges & learnings */}
        <Section
          title="Challenges & learnings"
          badge="optional"
          hint="What was hard, what surprised you, what would you do differently"
        >
          <Textarea
            {...form.register("challenges_learnings")}
            placeholder="e.g. Underestimated the complexity of migrating live traffic. Would have used feature flags from day one instead of a big-bang cutover..."
            className="min-h-[80px] resize-vertical"
          />
        </Section>
      </form>
    </div>
  );
}
