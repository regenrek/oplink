# How To Release oplink

This project ships via the Node script at `scripts/release.ts`. The script bumps versions across all packages in the monorepo, creates git commits and tags, and publishes packages to npm.

## Prerequisites
- Node 18+ (or Node 20+)
- pnpm (`corepack enable && corepack prepare pnpm@latest --activate` works too)
- npm auth: `npm whoami` works; 2FA ready if enabled
- Clean `main` branch with all changes committed and pushed to origin

## Project Structure
This is a monorepo with multiple packages:
- **Root** (`@instructa/oplink`): Private, version bumped but not published
- **@oplink/core** (`packages/oplink`): Published as public
- **oplink** (`packages/cli`): Published as public (CLI package)
- **@oplink/test-utils** (`packages/test-utils`): Version bumped but not published

## Prepare
- Ensure all changes are committed and pushed to `main`
- Run lint and tests to verify everything passes:
  - `pnpm lint`
  - `pnpm test:ci` (runs build + tests non-interactively)
- Update any user-facing documentation if needed

## Quick Release
- Patch/minor/major bump and publish:
  - `pnpm dlx tsx scripts/release.ts patch` (or `minor`/`major`)
  - Or use a specific version: `pnpm dlx tsx scripts/release.ts 0.1.0`
- The script will:
  - Ensure working tree is clean (fails if uncommitted changes exist)
  - Bump version in root `package.json` and all package `package.json` files
  - Create git commit: `chore: release vX.Y.Z`
  - Create git tag: `vX.Y.Z` with message `Release vX.Y.Z`
  - Push commit and tags to remote
  - Publish `@oplink/core` and `oplink` (CLI) to npm with `--access public`
  - Skip `@oplink/test-utils` (not configured for publishing)

## Sanity Checks (optional but recommended)
- Build locally before releasing:
  - `pnpm build` (builds all packages)
- Verify packages after publish:
  - Check npm pages: `https://www.npmjs.com/package/oplink` and `https://www.npmjs.com/package/@oplink/core`
  - Test installation: `npx oplink@latest --version`
  - Verify git tag exists: `git tag -l v*`

## GitHub Releases
The release script does not automatically create GitHub Releases. After publishing:
- Manually create a GitHub Release from the tag if needed
- Include release notes describing changes in the new version

## Prereleases / Dist-Tags
The current script doesn't support dist-tags. To publish a prerelease:
1. Run the release script normally to bump versions and create tags
2. Manually publish with a tag:
   - `pnpm -C packages/oplink publish --no-git-checks --tag alpha`
   - `pnpm -C packages/cli publish --no-git-checks --tag alpha`

## Rollback / Deprecation
- Prefer deprecation over unpublish:
  - `npm deprecate oplink@X.Y.Z "Reason…"`
  - `npm deprecate @oplink/core@X.Y.Z "Reason…"`
- Only unpublish if necessary and allowed (within 72 hours):
  - `npm unpublish oplink@X.Y.Z --force`
  - `npm unpublish @oplink/core@X.Y.Z --force`
- Create a follow-up patch release that fixes the issue

## Troubleshooting
- `npm ERR! code E403` or auth failures: run `npm login` and retry
- Working tree not clean: commit or stash changes before running release script
- Tag push rejected: pull/rebase or fast-forward `main`, then rerun
- Package build failures: ensure `pnpm build` succeeds before running release script

