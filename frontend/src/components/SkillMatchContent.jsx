import { useState } from "react";
import { motion } from "framer-motion";
import { SkillTag } from "./ui/SkillTag";

// ─── Helpers ──────────────────────────────────────────────────────

function ringColor(pct) {
  if (pct >= 70) return { fill: "#10b981", track: "#d1fae5" };
  if (pct >= 40) return { fill: "#f59e0b", track: "#fef3c7" };
  return { fill: "#f43f5e", track: "#ffe4e6" };
}

function barColor(pct) {
  if (pct >= 70) return "#10b981";
  if (pct >= 40) return "#f59e0b";
  return "#f43f5e";
}

function verdict(pct, missingMustCount) {
  if (pct >= 70)
    return {
      title: "Strong match",
      sub:
        missingMustCount === 0
          ? "All must-have requirements met"
          : `${missingMustCount} must-have requirement${missingMustCount !== 1 ? "s" : ""} missing`,
    };
  if (pct >= 40)
    return {
      title: "Partial match",
      sub: `${missingMustCount} must-have requirement${missingMustCount !== 1 ? "s" : ""} missing from your resume`,
    };
  return {
    title: "Significant gaps detected",
    sub: `${missingMustCount} must-have requirement${missingMustCount !== 1 ? "s" : ""} missing from your resume`,
  };
}

// ─── Score ring ───────────────────────────────────────────────────

function ScoreRing({ pct }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const c = ringColor(pct);
  return (
    <svg width="92" height="92" viewBox="0 0 92 92" className="shrink-0">
      <circle
        cx="46"
        cy="46"
        r={r}
        fill="none"
        stroke={c.track}
        strokeWidth="8"
      />
      <motion.circle
        cx="46"
        cy="46"
        r={r}
        fill="none"
        stroke={c.fill}
        strokeWidth="8"
        strokeLinecap="round"
        transform="rotate(-90 46 46)"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ * (1 - pct / 100) }}
        transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
      />
      <text
        x="46"
        y="44"
        textAnchor="middle"
        fontFamily="'Playfair Display', serif"
        fontWeight="900"
        fontSize="17"
        fill={c.fill}
      >
        {pct}%
      </text>
      <text
        x="46"
        y="57"
        textAnchor="middle"
        fontSize="9"
        fontWeight="700"
        letterSpacing="0.06em"
        fill="#94a3b8"
      >
        MATCH
      </text>
    </svg>
  );
}

// ─── Mini bar ─────────────────────────────────────────────────────

function MiniBar({ label, value }) {
  const pct = Math.round(value * 100);
  const color = barColor(pct);
  return (
    <div className="flex items-center gap-2.5 mb-[7px]">
      <span className="text-[11px] font-semibold text-slate-500 w-[88px] shrink-0">
        {label}
      </span>
      <div className="flex-1 h-[5px] rounded-full bg-slate-100 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
      <span
        className="text-[11px] font-extrabold w-[30px] text-right"
        style={{ color }}
      >
        {pct}%
      </span>
    </div>
  );
}

// ─── Pill with tooltip ────────────────────────────────────────────

function Pill({ label, variant, evidence }) {
  const [visible, setVisible] = useState(false);
  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <SkillTag label={label} variant={variant} />
      {visible && evidence && (
        <div className="absolute bottom-[calc(100%+7px)] left-1/2 -translate-x-1/2 bg-slate-800 text-slate-50 text-[11px] font-medium leading-[1.5] px-2.5 py-1.5 rounded-lg max-w-[260px] text-center pointer-events-none z-20 shadow-[0_4px_16px_rgba(0,0,0,0.18)] whitespace-normal">
          {evidence}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-slate-800" />
        </div>
      )}
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────

const TABS = [
  {
    key: "must",
    label: "Must-have",
    matchedField: "matched_must_have",
    missingField: "missing_must_have",
    missingVariant: "missing",
  },
  {
    key: "nice",
    label: "Nice-to-have",
    matchedField: "matched_nice_to_have",
    missingField: "missing_nice_to_have",
    missingVariant: "amber",
  },
  {
    key: "tech",
    label: "Technical",
    matchedField: "matched_technical",
    missingField: "missing_technical",
    missingVariant: "gray",
  },
];

const MISSING_LABEL_COLOR = {
  must: "text-rose-700",
  nice: "text-amber-700",
  tech: "text-slate-500",
};

export function SkillMatchContent({ data }) {
  const r = data.skill_match_results;
  if (!r) return null;

  const [activeTab, setActiveTab] = useState("must");

  const overallPct = Math.round((r.final_score || 0) * 100);
  const missingMustCount = (r.missing_must_have || []).length;
  const v = verdict(overallPct, missingMustCount);

  const tab = TABS.find((t) => t.key === activeTab);
  const matched = r[tab.matchedField] || [];
  const missing = r[tab.missingField] || [];

  const evidenceMap = data.match_evidence || {};

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <ScoreRing pct={overallPct} />
        <div className="flex-1">
          <div className="text-base font-extrabold text-slate-950 mb-0.5">
            {v.title}
          </div>
          <div className="text-[13px] text-slate-500 mb-3">{v.sub}</div>
          <MiniBar label="Must-have" value={r.must_have_score || 0} />
          <MiniBar label="Nice-to-have" value={r.nice_to_have_score || 0} />
          <MiniBar label="Technical" value={r.tech_score || 0} />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-100">
        <div className="flex gap-0.5">
          {TABS.map((t) => {
            const tMatched = (r[t.matchedField] || []).length;
            const tTotal = tMatched + (r[t.missingField] || []).length;
            const isActive = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`bg-transparent border-none border-b-2 -mb-px px-3.5 py-2 flex items-center gap-1.5 text-xs cursor-pointer transition-colors duration-150 ${
                  isActive
                    ? "border-slate-900 font-bold text-slate-950"
                    : "border-transparent font-medium text-slate-400"
                }`}
              >
                {t.label}
                <span
                  className={`text-[11px] font-bold ${isActive ? "text-slate-500" : "text-slate-300"}`}
                >
                  {tMatched}/{tTotal}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex flex-col gap-3">
        {matched.length > 0 && (
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-emerald-700 mb-2">
              Matched
            </div>
            <div className="flex flex-wrap gap-1.5">
              {matched.map((s) => (
                <Pill
                  key={s}
                  label={s}
                  variant="matched"
                  evidence={evidenceMap[s]}
                />
              ))}
            </div>
          </div>
        )}

        {missing.length > 0 && (
          <div>
            <div
              className={`text-[11px] font-extrabold uppercase tracking-[0.1em] mb-2 ${MISSING_LABEL_COLOR[tab.key]}`}
            >
              Missing
            </div>
            <div className="flex flex-wrap gap-1.5">
              {missing.map((s) => (
                <SkillTag key={s} label={s} variant={tab.missingVariant} />
              ))}
            </div>
          </div>
        )}

        {matched.length === 0 && missing.length === 0 && (
          <div className="text-xs text-slate-400 text-center py-4">
            No data for this category
          </div>
        )}
      </div>
    </div>
  );
}
