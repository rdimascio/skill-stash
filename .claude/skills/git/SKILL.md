---
name: Git Workflow
description: Enforce branch-based workflow with conventional commits, frequent commits, and PR stacking using git-spice. Never push directly to main - always use feature branches and pull requests.
---

# Git Workflow

## Instructions

### Core Principles
- **Never push directly to main** - All work happens on feature branches
- **Always create PRs** - Use GitHub CLI (`gh pr create`) for all changes
- **Commit frequently** - Every 20-30 minutes or logical unit of work
- **Use conventional commits** - Format: `type(scope): description`
- **Stack dependent PRs** - Use git-spice (`gs`) when work depends on other PRs

### Rules

#### Commit Frequency
- Commit after completing each logical unit of work
- Never accumulate more than 30 minutes of work without committing
- Commit when switching between tasks or taking a break
- Push to feature branch frequently (every 3-5 commits)

#### Conventional Commits Format
Use this format for ALL commits:

```
<type>(<scope>): <description>
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code formatting (no logic change)
- `refactor` - Code restructuring (no behavior change)
- `test` - Adding or updating tests
- `chore` - Maintenance tasks (deps, config, etc)
- `perf` - Performance improvements

**Scopes (examples):**
- `api` - API worker
- `ingester` - ingester worker
- `cli` - CLI tool
- `web` - Web frontend
- `db` - Database
- `infra` - Infrastructure
- `ci` - CI/CD pipelines

#### Message Guidelines

**DO:**
- ✅ Keep to ONE sentence
- ✅ Use imperative mood ("add" not "added" or "adds")
- ✅ Be specific but concise
- ✅ Start with lowercase after the colon
- ✅ No period at the end

**DON'T:**
- ❌ Write paragraphs or multiple sentences
- ❌ Include implementation details
- ❌ Add bullet points or lists
- ❌ Exceed 72 characters total

#### Commit Message Examples

**Good commits:**
```bash
feat(api): add plugin search endpoint
fix(cli): resolve install path on Windows
docs(readme): update installation instructions
chore(deps): upgrade Next.js to 15.0.1
refactor(db): optimize plugin query with index
test(api): add tests for search endpoint
style(web): format components with Prettier
perf(api): cache plugin list in R2
```

**Bad commits (TOO LONG):**
```bash
# ❌ Multiple sentences
feat(api): add plugin search endpoint and also update the database schema

# ❌ Too detailed
feat(api): add plugin search endpoint with full-text search, pagination, filtering by category, and sorting options

# ❌ Paragraph in commit body
feat(api): add plugin search endpoint

This commit adds a new search endpoint that allows users to search
for plugins by name and description. It includes pagination support
and returns results sorted by relevance.
```

**How to fix - split into multiple commits:**
```bash
feat(db): add full-text search indexes to plugins table
feat(api): add plugin search endpoint
feat(api): add pagination to search results
feat(api): add category filtering to search
test(api): add search endpoint tests
```

### Git-Spice for Stacked PRs

When your work depends on another agent's unmerged PR, use git-spice to create a stack of dependent branches.

#### Essential Commands

**Create stacked branch:**
```bash
# Start from the branch you depend on
git checkout feat/foundation-work

# Create your branch on top
gs branch create feat/dependent-work -m "feat(scope): your changes"
```

**Navigate the stack:**
```bash
gs up      # Move up to parent branch
gs down    # Move down to child branch
```

**Update dependent branches:**
```bash
# After modifying a branch, sync all branches that depend on it
gs upstack restack

# Or commit and restack in one step
gs commit create -m "feat(scope): description"
```

**Track existing branch:**
```bash
# Add existing branch to git-spice tracking
gs branch track
```

#### Stacking Workflow

1. **Check out the dependency branch:**
   ```bash
   git checkout feat/api-foundation
   ```

2. **Create your stacked branch:**
   ```bash
   gs branch create feat/search-endpoint -m "feat(api): add search on top of foundation"
   ```

3. **Make changes and commit frequently:**
   ```bash
   git add src/search.ts
   gs commit create -m "feat(api): implement search logic"
   ```

4. **Push and create stacked PR:**
   ```bash
   git push -u origin feat/search-endpoint
   gh pr create --base feat/api-foundation --title "feat(api): add search endpoint" --body "Depends on #123"
   ```

5. **When parent branch changes, restack:**
   ```bash
   git checkout feat/api-foundation
   git pull
   gs down  # Move to your branch
   gs upstack restack  # Rebase on updated parent
   git push --force-with-lease
   ```

## Using GitHub CLI

### Setup (first time only)
```bash
# Install GitHub CLI
# macOS: brew install gh
# Linux: see https://github.com/cli/cli/blob/trunk/docs/install_linux.md
# Windows: winget install GitHub.cli

# Authenticate
gh auth login
```

### Branch-Based Workflow

**CRITICAL: Never work directly on main. Always create a feature branch.**

#### 1. Create Feature Branch
```bash
# From main
git checkout main
git pull
git checkout -b feat/your-feature

# Or use git-spice for stacking
gs branch create feat/your-feature
```

#### 2. Check Status
```bash
gh repo view
git status
```

#### 3. Stage Changes
```bash
# Stage specific files
git add path/to/file

# Or stage all changes in current directory
git add .
```

#### 4. Commit Frequently
```bash
# Use conventional commit format
git commit -m "feat(api): add search endpoint"
git commit -m "fix(cli): handle missing config file"
git commit -m "docs(readme): add quick start section"

# Or use git-spice to commit and restack dependencies
gs commit create -m "feat(api): add search endpoint"
```

#### 5. Push to Feature Branch
```bash
# First time pushing a new branch
git push -u origin feat/your-feature

# Subsequent pushes
git push

# For force push (when rebasing/restacking)
git push --force-with-lease
```

#### 6. Create Pull Request
```bash
# Create PR targeting main
gh pr create --title "feat(api): add feature" --body "Description"

# For stacked PRs, specify base branch
gh pr create --base feat/parent-branch --title "feat(api): dependent work" --body "Depends on #123"

# Open in browser
gh pr create --web
```

### Branch Naming Convention
- `feat/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation
- `chore/description` - Maintenance
- `refactor/description` - Code refactoring

**Examples:**
- `feat/api-search`
- `fix/cli-windows-path`
- `docs/update-readme`
- `chore/upgrade-deps`

## Examples

### Example 1: Independent Feature
```bash
# Start from main
git checkout main
git pull

# Create feature branch
git checkout -b feat/search-endpoint

# Small, focused commits
git add src/handlers/search.ts
git commit -m "feat(api): add search handler skeleton"

git add src/lib/search.ts
git commit -m "feat(api): implement search query logic"

git add tests/search.test.ts
git commit -m "test(api): add search handler tests"

# Push to feature branch
git push -u origin feat/search-endpoint

# Create PR targeting main
gh pr create --title "feat(api): add plugin search endpoint" --body "Implements full-text search with pagination"
```

### Example 2: Stacked PRs (Dependent Work)
```bash
# Agent A creates foundation PR
git checkout main
git pull
git checkout -b feat/api-foundation
# ... make changes ...
git push -u origin feat/api-foundation
gh pr create --title "feat(api): add API foundation" --body "Base API structure"

# Agent B needs to build on Agent A's work (PR not merged yet)
git checkout feat/api-foundation
git pull origin feat/api-foundation

# Create stacked branch using git-spice
gs branch create feat/search-on-foundation -m "feat(api): add search on foundation"

# Make changes and commit
git add src/search.ts
gs commit create -m "feat(api): implement search logic"

# Push and create stacked PR
git push -u origin feat/search-on-foundation
gh pr create --base feat/api-foundation --title "feat(api): add search" --body "Depends on #123"

# When Agent A's PR is updated, restack Agent B's work
git checkout feat/api-foundation
git pull
gs down  # Navigate to feat/search-on-foundation
gs upstack restack  # Rebase on updated foundation
git push --force-with-lease
```

### Example 3: Quick Bug Fix
```bash
# Create fix branch from main
git checkout main
git pull
git checkout -b fix/cli-error-handling

# Fix and commit
git add src/lib/installer.ts
git commit -m "fix(cli): handle missing config file gracefully"

# Add test
git add tests/installer.test.ts
git commit -m "test(cli): add error handling tests"

# Push and create PR
git push -u origin fix/cli-error-handling
gh pr create --title "fix(cli): improve error handling" --body "Fixes #456"
```

### Example 4: Multiple Related Changes
```bash
# If changes are tightly coupled, commit together
git add src/api/search.ts src/api/types.ts
git commit -m "feat(api): add search types and implementation"

# But prefer splitting if possible
git add src/api/types.ts
git commit -m "feat(api): add search request and response types"

git add src/api/search.ts
git commit -m "feat(api): implement search handler"
```

## Commit Size Guidelines

### Too Small (avoid)
```bash
# ❌ Too granular
git commit -m "feat(api): add import statement"
git commit -m "feat(api): add function signature"
git commit -m "feat(api): add function body"
```

### Just Right
```bash
# ✅ Logical units
git commit -m "feat(api): add search endpoint handler"
git commit -m "feat(api): add search query validation"
git commit -m "test(api): add search endpoint tests"
```

### Too Large (split it)
```bash
# ❌ Too much in one commit
# Don't commit: entire feature + tests + docs + refactoring all at once

# ✅ Split into logical commits
git commit -m "feat(api): add search endpoint"
git commit -m "test(api): add search tests"
git commit -m "docs(api): document search endpoint"
git commit -m "refactor(api): extract search query builder"
```

## Pre-Commit Checklist

Before every commit, ask yourself:

1. ✅ Does this commit do ONE thing?
2. ✅ Is the message under 72 characters?
3. ✅ Did I use conventional commit format?
4. ✅ Is the description clear and imperative?
5. ✅ Would this make sense in the git log?

## Viewing History

```bash
# See recent commits
git log --oneline -10

# See commits by author
git log --author="agent-name" --oneline

# See commits for specific file
git log --oneline -- path/to/file

# Beautiful tree view
git log --oneline --graph --all --decorate
```

## Fixing Mistakes

### Amend Last Commit (if not pushed)
```bash
# Fix typo in last commit message
git commit --amend -m "feat(api): add search endpoint"

# Add forgotten file to last commit
git add forgotten-file.ts
git commit --amend --no-edit
```

### Undo Last Commit (keep changes)
```bash
git reset --soft HEAD~1
# Now re-commit properly
```

## Best Practices Summary

1. **Never push to main** - All work happens on feature branches
2. **Always create PRs** - Use `gh pr create` for all changes
3. **Commit frequently** - Every 20-30 minutes of work
4. **One sentence only** - No exceptions for commit messages
5. **Use conventional commits** - Always include type and scope
6. **Imperative mood** - "add" not "added"
7. **Push to feature branch** - Push frequently to your branch
8. **Use git-spice for stacking** - When work depends on unmerged PRs
9. **Small, focused commits** - One logical change per commit
10. **Test before committing** - Make sure it works

## Integration with Development Workflow

### Example Development Session
```bash
# Start work from main
git checkout main
git pull
git checkout -b feat/api-search

# 10 minutes: write search handler
git add src/handlers/search.ts
git commit -m "feat(api): add search handler skeleton"
git push -u origin feat/api-search

# 20 minutes: implement search logic
git add src/lib/search.ts
git commit -m "feat(api): implement full-text search logic"
git push

# 15 minutes: add tests
git add tests/search.test.ts
git commit -m "test(api): add search handler tests"
git push

# 10 minutes: update docs
git add docs/api.md
git commit -m "docs(api): document search endpoint"
git push

# Create PR (targets main by default)
gh pr create --title "feat(api): add plugin search" --body "Implements full-text search with tests and documentation"
```

## Critical Requirements

### NEVER Push Directly to Main
- **All work happens on feature branches**
- **All changes go through pull requests**
- **Main branch is protected**

### Always Use Branches
- Create a feature branch for every task
- Use descriptive branch names with type prefix
- Push branches to remote regularly

### Use git-spice for Dependencies
- When your work depends on unmerged PRs, use `gs branch create`
- Keep stacks in sync with `gs upstack restack`
- Create stacked PRs with proper base branches

### Commit Best Practices
- **Commit early, commit often** (every 20-30 minutes)
- **One sentence, one purpose** (< 72 characters)
- **Use conventional commits** (type(scope): description)
- **Push to feature branch regularly**

This is not just good practice - **it's required for the project**. All agents must follow this workflow consistently.