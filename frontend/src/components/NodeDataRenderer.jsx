import { JDContent } from "./JDContent";
import { SkillMatchContent } from "./SkillMatchContent";
import { ProjectSelectionContent } from "./ProjectSelectionContent";
import { SkillSelectionContent } from "./SkillSelectionContent";
import { ProjectRewriteData } from "./ProjectRewriteData";
import { ExperienceRewriteData } from "./ExperienceRewriteData";
import { SectionOrderContent } from "./SectionOrderContent";

export function NodeDataRenderer({
  node,
  data,
  resumeJson,
  jdKeywords,
  appLocation,
  appEmpType,
  isEditable,
  onSkillsChange,
}) {
  if (node === "jd_parsing_node")
    return (
      <JDContent
        data={data}
        appLocation={appLocation}
        appEmpType={appEmpType}
      />
    );
  if (node === "skill_match_node") return <SkillMatchContent data={data} />;
  if (node === "project_selection_node")
    return <ProjectSelectionContent data={data} />;
  if (node === "skill_selection_node")
    return (
      <SkillSelectionContent
        data={data}
        resumeJson={resumeJson}
        isEditable={isEditable}
        onChange={onSkillsChange}
      />
    );
  if (node === "execute_project_rewrite_node")
    return (
      <ProjectRewriteData
        data={data}
        resumeJson={resumeJson}
        jdKeywords={jdKeywords}
      />
    );
  if (node === "execute_experience_rewrite_node")
    return (
      <ExperienceRewriteData
        data={data}
        resumeJson={resumeJson}
        jdKeywords={jdKeywords}
      />
    );
  if (node === "section_order_node")
    return <SectionOrderContent data={data} readOnly />;
  if (node === "summary_generation_review_node")
    return (
      <p className="text-sm text-slate-700 leading-relaxed">{data?.summary}</p>
    );
  if (node === "cover_letter_node")
    return (
      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
        {data?.cover_letter}
      </p>
    );
  return null;
}
