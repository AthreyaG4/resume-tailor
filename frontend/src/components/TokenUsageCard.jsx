import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const NODE_DISPLAY = {
  jd_parsing_node: "JD parsing",
  skill_match_node: "Skill match",
  project_selection_node: "Project selection",
  skill_selection_node: "Skill selection",
  execute_project_rewrite_node: "Project rewrite",
  execute_experience_rewrite_node: "Experience rewrite",
  summary_generation_node: "Summary generation",
  cover_letter_node: "Cover letter",
};

const PRICING = {
  sonnet: { input: 3.0, output: 15.0, cache_read: 0.3 },
  opus: { input: 15.0, output: 75.0, cache_read: 1.5 },
  haiku: { input: 0.8, output: 4.0, cache_read: 0.08 },
  "gpt-5-mini": { input: 0.25, output: 2.0, cache_read: 0.025 },
  default: { input: 0.25, output: 2.0, cache_read: 0.025 },
};

function getPricing(model) {
  const m = (model || "").toLowerCase();
  if (m.includes("sonnet")) return PRICING.sonnet;
  if (m.includes("opus")) return PRICING.opus;
  if (m.includes("haiku")) return PRICING.haiku;
  if (m.includes("gpt-5-mini") || m.includes("gpt-5.4-mini") || m.includes("gpt-4o-mini"))
    return PRICING["gpt-5-mini"];
  return PRICING.default;
}

function modelLabel(model) {
  const m = (model || "").toLowerCase();
  if (m.includes("sonnet-4-6") || m.includes("sonnet-4.6")) return "Sonnet 4.6";
  if (m.includes("sonnet-4-5") || m.includes("sonnet-4.5")) return "Sonnet 4.5";
  if (m.includes("sonnet")) return "Sonnet";
  if (m.includes("opus-4-7") || m.includes("opus-4.7")) return "Opus 4.7";
  if (m.includes("opus")) return "Opus";
  if (m.includes("haiku")) return "Haiku";
  if (m.includes("gpt-5-mini") || m.includes("gpt-5.4-mini") || m.includes("gpt-4o-mini"))
    return "GPT-5-mini";
  return model || "—";
}

function rowCost(entry) {
  const prices = getPricing(entry.model);
  const cached = entry.cached_tokens || 0;
  const billableInput = Math.max(0, entry.input_tokens - cached);
  return (
    (billableInput / 1_000_000) * prices.input +
    (cached / 1_000_000) * prices.cache_read +
    (entry.output_tokens / 1_000_000) * prices.output
  );
}

function cacheSavings(entry) {
  const prices = getPricing(entry.model);
  const cached = entry.cached_tokens || 0;
  return (cached / 1_000_000) * (prices.input - prices.cache_read);
}

function fmt(n) {
  return n.toLocaleString();
}

function fmtCost(n) {
  return n < 0.0001 ? "<$0.0001" : `$${n.toFixed(4)}`;
}

export function TokenUsageCard({ tokenUsageLog }) {
  const [expanded, setExpanded] = useState(false);

  if (!tokenUsageLog || tokenUsageLog.length === 0) return null;

  const totalTokens = tokenUsageLog.reduce(
    (s, e) => s + e.input_tokens + e.output_tokens,
    0
  );
  const totalCached = tokenUsageLog.reduce(
    (s, e) => s + (e.cached_tokens || 0),
    0
  );
  const totalCost = tokenUsageLog.reduce((s, e) => s + rowCost(e), 0);
  const totalSavings = tokenUsageLog.reduce((s, e) => s + cacheSavings(e), 0);

  return (
    <div className="mt-3 rounded-2xl border border-[hsl(220_10%_91%)] bg-white overflow-hidden shadow-[0_1px_6px_-2px_rgba(0,0,0,0.05)]">
      {/* Header row — always visible */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-transparent border-none cursor-pointer text-left"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[13px] font-bold text-slate-700">
            {fmt(totalTokens)} tokens used
          </span>
          <span className="text-[12px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
            ~{fmtCost(totalCost)}
          </span>
          {totalCached > 0 && (
            <span className="text-[12px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
              {fmt(totalCached)} cached
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        )}
      </button>

      {/* Expandable table */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="border-t border-[hsl(220_10%_91%)]">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="text-slate-400 font-semibold uppercase tracking-wide text-[10px]">
                    <th className="text-left px-5 py-2.5">Node</th>
                    <th className="text-left px-3 py-2.5">Model</th>
                    <th className="text-right px-3 py-2.5">Tokens</th>
                    <th className="text-right px-3 py-2.5">Cache</th>
                    <th className="text-right px-5 py-2.5">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[hsl(220_10%_95%)]">
                  {tokenUsageLog.map((entry, i) => {
                    const base = NODE_DISPLAY[entry.node] || entry.node;
                    const name = entry.label ? `${base} · ${entry.label}` : base;
                    const cached = entry.cached_tokens || 0;
                    const cost = rowCost(entry);
                    return (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-5 py-2.5 text-slate-700 font-medium">
                          {name}
                        </td>
                        <td className="px-3 py-2.5 text-slate-400">
                          {modelLabel(entry.model)}
                        </td>
                        <td className="px-3 py-2.5 text-right text-slate-600 font-mono">
                          {fmt(entry.input_tokens + entry.output_tokens)}
                        </td>
                        <td className="px-3 py-2.5 text-right whitespace-nowrap">
                          {cached > 0 ? (
                            <span className="text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full font-mono text-[11px]">
                              {fmt(cached)} hit
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-5 py-2.5 text-right text-slate-600 font-mono">
                          {fmtCost(cost)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {totalSavings > 0.0001 && (
                <div className="px-5 py-3 border-t border-[hsl(220_10%_91%)] flex justify-between items-center">
                  <span className="text-[11px] text-slate-400">
                    {fmt(totalCached)} tokens served from cache · saved ~{fmtCost(totalSavings)}
                  </span>
                  <span className="text-[12px] font-bold text-slate-600">
                    {fmtCost(totalCost)} total
                  </span>
                </div>
              )}
              {totalSavings <= 0.0001 && (
                <div className="px-5 py-3 border-t border-[hsl(220_10%_91%)] flex justify-end">
                  <span className="text-[12px] font-bold text-slate-600">
                    {fmtCost(totalCost)} total
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
