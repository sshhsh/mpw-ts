import { SiGithub } from "@icons-pack/react-simple-icons";
import { useLanguage } from "../lib/useLanguage";

function BuildInfo() {
  const { t } = useLanguage();
  return (
    <div className="build-info">
      <span>Commit {__COMMIT_SHA__}</span>
      <a
        href="https://github.com/sshhsh/mpw-ts"
        target="_blank"
        rel="noreferrer"
        aria-label={t("build.source")}
      >
        <SiGithub size={14} />
        <span>github.com/sshhsh/mpw-ts</span>
      </a>
    </div>
  );
}

export default BuildInfo;
