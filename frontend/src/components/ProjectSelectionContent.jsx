import { SkillTag } from "./ui/SkillTag";

export function ProjectSelectionContent({ data }) {
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
