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
