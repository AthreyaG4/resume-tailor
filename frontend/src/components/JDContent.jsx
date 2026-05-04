import { MapPin, Briefcase, TrendingUp, Clock } from "lucide-react";
import { SkillTag } from "./ui/SkillTag";

function MetaChip({ icon, label, highlight = false }) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${
        highlight
          ? "bg-blue-50 border border-blue-200"
          : "bg-slate-50 border border-slate-200"
      }`}
    >
      <span
        className={`w-3 h-3 flex items-center shrink-0 ${highlight ? "text-blue-700" : "text-slate-400"}`}
      >
        {icon}
      </span>
      <span
        className={`text-xs font-semibold ${highlight ? "text-blue-700" : "text-slate-600"}`}
      >
        {label}
      </span>
    </div>
  );
}

function Section({ label, count, children, divider = true }) {
  return (
    <div className={divider ? "border-t border-slate-100 pt-3.5" : ""}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-slate-400">
          {label}
        </span>
        {count != null && (
          <span className="text-[11px] font-semibold text-slate-400">
            {count}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function TagRow({ items, variant }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((s) => (
        <SkillTag key={s} label={s} variant={variant} />
      ))}
    </div>
  );
}

export function JDContent({ data, appLocation, appEmpType }) {
  const jd = data.jd_json;
  if (!jd) return null;

  const mustHave = jd.must_have_qualifications || [];
  const niceToHave = jd.nice_to_have_qualifications || [];
  const technicalSkills = jd.technical_skills || [];
  const softSkills = jd.soft_skills || [];
  const keywords = jd.keywords || [];

  const location = appLocation || jd.location;
  const employmentType = appEmpType || jd.employment_type;

  const metaItems = [
    location && {
      icon: <MapPin size={12} />,
      label: location,
      highlight: false,
    },
    employmentType && {
      icon: <Briefcase size={12} />,
      label: employmentType,
      highlight: false,
    },
    jd.seniority_level && {
      icon: <TrendingUp size={12} />,
      label: jd.seniority_level,
      highlight: true,
    },
    jd.years_of_experience != null && {
      icon: <Clock size={12} />,
      label: `${jd.years_of_experience}+ yrs`,
      highlight: true,
    },
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-3.5">
      {metaItems.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {metaItems.map((item, i) => (
            <MetaChip
              key={i}
              icon={item.icon}
              label={item.label}
              highlight={item.highlight}
            />
          ))}
        </div>
      )}

      {mustHave.length > 0 && (
        <Section
          label="Must-have"
          count={`${mustHave.length} skills`}
          divider={false}
        >
          <TagRow items={mustHave} variant="green" />
        </Section>
      )}

      {niceToHave.length > 0 && (
        <Section label="Nice to have" count={`${niceToHave.length} skills`}>
          <TagRow items={niceToHave} variant="purple" />
        </Section>
      )}

      {technicalSkills.length > 0 && (
        <Section
          label="Technical skills"
          count={`${technicalSkills.length} skills`}
        >
          <TagRow items={technicalSkills} variant="blue" />
        </Section>
      )}

      {softSkills.length > 0 && (
        <Section label="Soft skills" count={`${softSkills.length} skills`}>
          <TagRow items={softSkills} variant="gray" />
        </Section>
      )}

      {keywords.length > 0 && (
        <Section label="Keywords" count={`${keywords.length}`}>
          <TagRow items={keywords} variant="amber" />
        </Section>
      )}
    </div>
  );
}
