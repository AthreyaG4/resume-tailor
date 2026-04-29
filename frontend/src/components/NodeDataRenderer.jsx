import { JDContent } from "./JDContent";
import { SkillMatchContent } from "./SkillMatchContent";
import { ProjectSelectionContent } from "./ProjectSelectionContent";
import { SkillSelectionContent } from "./SkillSelectionContent";
import { ProjectRewriteData } from "./ProjectRewriteData";
import { ExperienceRewriteData } from "./ExperienceRewriteData";

export function NodeDataRenderer({ node, data, resumeJson, isEditable, onSkillsChange }) {
  if (node === "jd_parsing_node") return <JDContent data={data} />;
  if (node === "skill_match_node") return <SkillMatchContent data={data} />;
  if (node === "project_selection_node") return <ProjectSelectionContent data={data} />;
  if (node === "skill_selection_node")
    return <SkillSelectionContent data={data} resumeJson={resumeJson} isEditable={isEditable} onChange={onSkillsChange} />;
  if (node === "execute_project_rewrite_node") return <ProjectRewriteData data={data} resumeJson={resumeJson} />;
  if (node === "execute_experience_rewrite_node") return <ExperienceRewriteData data={data} resumeJson={resumeJson} />;
  return null;
}
