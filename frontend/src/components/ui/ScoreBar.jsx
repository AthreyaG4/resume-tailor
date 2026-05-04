import { motion } from "framer-motion";

export function scoreColor(pct) {
  if (pct >= 70) return { text: "#15803d", bg: "#f0fdf4", border: "#bbf7d0", track: "#dcfce7", fill: "#10b981" };
  if (pct >= 40) return { text: "#b45309", bg: "#fffbeb", border: "#fde68a", track: "#fef9c3", fill: "#f59e0b" };
  return { text: "#be123c", bg: "#fff1f2", border: "#fecdd3", track: "#fff1f2", fill: "#f43f5e" };
}

export function ScoreBar({ label, value }) {
  const pct = Math.round(value * 100);
  const c = scoreColor(pct);
  return (
    <div className="mb-2.5">
      <div className="flex justify-between mb-[5px]">
        <span className="text-xs font-semibold text-slate-500">{label}</span>
        <span className="text-[13px] font-extrabold tracking-tight" style={{ color: c.fill }}>{pct}%</span>
      </div>
      <div className="h-[7px] rounded-full overflow-hidden" style={{ background: c.track }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
          className="h-full rounded-full"
          style={{ background: c.fill }}
        />
      </div>
    </div>
  );
}
