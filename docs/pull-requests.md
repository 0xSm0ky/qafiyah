# Pull Requests

- Run lint/format/test through the task runner, not per-package.
- Commit messages: subject line only, max 200 characters, nothing else. No body, no bulleted explanation, no blank-line-separated paragraph, no `Co-authored-by` or any other AI-attribution line/signoff. If it doesn't fit in one line, the message is too long, not the subject wrong.
- Commit and push only as the identity this clone is configured with. Never pass `--author`, `git -c user.email=...`, or `GIT_AUTHOR_*`/`GIT_COMMITTER_*` variables, and never use `--no-verify` or `HUSKY=0` to get past the commit identity guard (`docs/development.md`, "Committing"). If it refuses, stop and ask.
