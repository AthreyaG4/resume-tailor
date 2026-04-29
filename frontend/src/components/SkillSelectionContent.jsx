import { useState, useEffect } from "react";
import { SkillTag } from "./ui/SkillTag";

export function SkillSelectionContent({ data, resumeJson, isEditable, onChange }) {
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

  const skillCount = isEditable
    ? selectedSet.size
    : (data.selected_skills?.flatMap((c) => c.skills) || []).length;
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
              if (isEditable) {
                const isSelected = selectedSet.has(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() =>
                      setSelectedSet((prev) => {
                        const next = new Set(prev);
                        next.has(s) ? next.delete(s) : next.add(s);
                        return next;
                      })
                    }
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
