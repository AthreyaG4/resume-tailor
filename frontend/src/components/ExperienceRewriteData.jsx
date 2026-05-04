import { RewriteCarousel } from "./RewriteCarousel";

export function ExperienceRewriteData({ data, resumeJson, jdKeywords }) {
  const origMap = Object.fromEntries(
    (resumeJson?.experience || []).map((e) => [e.company + e.role, e.bullets]),
  );
  return (
    <RewriteCarousel
      items={data.rewritten_experience || []}
      renderTitle={(e) => (
        <>
          {e.role}{" "}
          <span className="font-normal text-slate-400">@ {e.company}</span>
        </>
      )}
      getOriginalBullets={(e) => origMap[e.company + e.role] || []}
      jdKeywords={jdKeywords}
      label="Experience"
    />
  );
}
