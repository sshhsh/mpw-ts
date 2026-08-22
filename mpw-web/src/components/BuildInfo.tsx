import { SiGithub } from '@icons-pack/react-simple-icons';

function BuildInfo() {
  return (
    <div className="build-info">
      <span>Commit {__COMMIT_SHA__}</span>
      <a
        href="https://github.com/sshhsh/mpw-ts"
        target="_blank"
        rel="noreferrer"
        aria-label="在 GitHub 查看源代码"
      >
        <SiGithub size={14} />
        <span>github.com/sshhsh/mpw-ts</span>
      </a>
    </div>
  );
}

export default BuildInfo;