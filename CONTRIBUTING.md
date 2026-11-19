# Contributing
- Branches: `feat/…`, `fix/…`, `chore/…`. Conventional Commits. Squash merges.
- Every PR must build, pass lint/typecheck/tests, update docs, and reference an issue.
- Never commit secrets.
- Escrow, settlement, disputes and bond changes need two maintainer reviews.

## Dependencies and lockfile policy

- `pnpm-lock.yaml` is committed, and CI installs with `--frozen-lockfile`. Do not edit the lockfile by hand. Change dependencies with `pnpm add` or `pnpm up <package>`, and commit the lockfile in the same PR as the `package.json` change.
- Some packages are pinned to exact versions in `package.json` (for example `next`, `react` and `@stellar/stellar-sdk`). Keep those pins exact and move them in a dedicated PR. Dependabot still proposes updates for them, so review each one as a version change, not a range change.
- Routine updates arrive as grouped PRs: Next with `eslint-config-next`, the Stellar packages, the test tooling, and weekly development-tooling bumps. Merge a group only when CI is green. If one member breaks, split the PR and merge the rest rather than merging the group as is.
- Security updates are never grouped with version updates. Review them as soon as they arrive.
- `@types/node` stays on major 24 to match the Node major that CI and the Docker image run on. Dependabot ignores its major updates; see `.github/dependabot.yml`.
