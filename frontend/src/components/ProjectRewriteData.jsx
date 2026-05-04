import { RewriteCarousel } from "./RewriteCarousel";

export function ProjectRewriteData({ data, jdKeywords }) {
  return (
    <RewriteCarousel
      items={data.rewritten_projects || []}
      renderTitle={(p) => p.title}
      getOriginalBullets={() => []}
      jdKeywords={jdKeywords}
      label="Project"
    />
  );
}
