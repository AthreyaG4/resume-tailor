const styles = {
  neutral: { bg: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0" },
  ghost:   { bg: "#f1f5f9", color: "#94a3b8", border: "1px solid #e2e8f0" },
  matched: { bg: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0" },
  missing: { bg: "#fff1f2", color: "#be123c", border: "1px solid #fecdd3" },
  dark:    { bg: "hsl(220 20% 18%)", color: "#f8fafc", border: "1px solid hsl(220 20% 18%)" },
};

export function SkillTag({ label, variant = "neutral" }) {
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
