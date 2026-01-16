# Contributing to LMRing

Thank you for considering contributing to LMRing! We appreciate your interest in helping make this project better. This document provides guidelines and information to make the contribution process smooth and effective.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Features](#suggesting-features)
  - [Submitting Pull Requests](#submitting-pull-requests)
- [Directory Structure](#directory-structure)
- [Development Setup](#development-setup)
  - [Requirements](#requirements)
  - [Installation](#installation)
  - [Development Commands](#development-commands)
- [Development Workflow](#development-workflow)
  - [Creating a Branch](#creating-a-branch)
  - [Making Changes](#making-changes)
  - [Commit Guidelines](#commit-guidelines)
- [Pull Request Guidelines](#pull-request-guidelines)
  - [PR Types](#pr-types)
  - [PR Requirements](#pr-requirements)
  - [PR Title Format](#pr-title-format)
  - [PR Checklist](#pr-checklist)
- [Testing](#testing)
  - [Unit Tests](#unit-tests)
  - [E2E Tests](#e2e-tests)
- [Code Style](#code-style)
- [Internationalization](#internationalization)
- [Database Migrations](#database-migrations)
- [Getting Help](#getting-help)

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md). We are committed to fostering a welcoming and inclusive environment for all contributors.

## How to Contribute

### Reporting Bugs

Found a bug? We'd love to hear about it! Please [create a bug report](https://github.com/llm-ring/lmring/issues/new?template=bug_report.yml) with the following information:

- **Package**: Which package is affected (`apps/web`, `packages/ai-hub`, etc.)
- **Deployment Mode**: SaaS, Self-hosted, or Both
- **Bug Description**: Clear description of the issue
- **Steps to Reproduce**: How can we reproduce the bug?
- **Expected vs Actual Behavior**: What should happen vs what actually happens
- **Environment**: Node.js version, pnpm version, OS, Browser
- **Logs/Screenshots**: Any relevant error messages or screenshots

### Suggesting Features

Have an idea for a new feature? [Submit a feature request](https://github.com/llm-ring/lmring/issues/new?template=feature_request.yml) including:

- **Related Package**: Which package should this feature be added to?
- **Problem Statement**: What problem does this solve?
- **Proposed Solution**: How would you like this to work?
- **Use Case**: Real-world scenario where this would help
- **Alternatives**: Other solutions you've considered

### Submitting Pull Requests

Ready to contribute code? Great! Please follow the [Development Workflow](#development-workflow) and [Pull Request Guidelines](#pull-request-guidelines) below.

## Directory Structure

```
lmring/
├── apps/
│   └── web/              # Next.js application
├── packages/
│   ├── ai-hub/           # AI provider integration
│   ├── auth/             # Authentication (Better-Auth)
│   ├── database/         # DrizzleORM schemas and migrations
│   ├── env/              # Environment variable validation
│   ├── i18n/             # Internationalization utilities
│   ├── model-depot/      # AI model definitions and metadata
│   ├── storage/          # File storage (S3, Supabase)
│   └── ui/               # Shared UI components (shadcn/ui)
├── .github/              # GitHub workflows and templates
├── docs/                 # Documentation
└── docker-compose.yml    # Docker configuration for self-hosting
```

## Development Setup

### Requirements

- **Node.js**: v24.11.1 or newer
- **pnpm**: v10.25.0 or newer
- **PostgreSQL**: For database (local or hosted)

### Installation

1. **Fork and clone the repository**

   ```bash
   git clone https://github.com/YOUR_USERNAME/lmring.git
   cd lmring
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Run database migrations**

   ```bash
   pnpm db:migrate
   ```

5. **Start the development server**

   ```bash
   pnpm dev
   ```

   The app will be available at [http://localhost:3000](http://localhost:3000).

### Development Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server with Turbopack |
| `pnpm build` | Build all packages |
| `pnpm lint` | Check for linting errors |
| `pnpm lint:fix` | Auto-fix linting errors |
| `pnpm check:types` | Run TypeScript type checking |
| `pnpm test` | Run unit tests |
| `pnpm test:e2e` | Run E2E tests |
| `pnpm db:generate` | Generate database migrations |
| `pnpm db:migrate` | Run database migrations |
| `pnpm db:studio` | Open Drizzle Studio |

## Development Workflow

### Creating a Branch

Always create a new branch for your changes. Use the following naming convention:

```
<type>/<feature-name>
```

**Types:**
- `feat/` - New feature
- `fix/` - Bug fix
- `refactor/` - Code refactoring
- `docs/` - Documentation changes
- `test/` - Test changes
- `chore/` - Maintenance tasks

**Examples:**
```bash
git checkout -b feat/add-model-comparison
git checkout -b fix/auth-redirect-issue
git checkout -b docs/update-readme
```

### Making Changes

1. Make your changes in the appropriate package or app
2. Write or update tests as needed
3. Ensure all tests pass locally
4. Update documentation if necessary

### Commit Guidelines

We use [Gitmoji](https://gitmoji.dev/) for commit message prefixes. Your commit messages should follow this format:

```
<gitmoji> <description>
```

**Common Gitmoji:**

| Emoji | Code | Description |
|-------|------|-------------|
| ✨ | `:sparkles:` | New feature |
| 🐛 | `:bug:` | Bug fix |
| ♻️ | `:recycle:` | Refactor code |
| 📝 | `:memo:` | Documentation |
| 🔧 | `:wrench:` | Configuration changes |
| ⬆️ | `:arrow_up:` | Upgrade dependencies |
| 🎨 | `:art:` | Improve code style/format |
| 🧪 | `:test_tube:` | Add or update tests |
| 🗑️ | `:wastebasket:` | Remove code/files |
| 🔒 | `:lock:` | Security fix |

**Examples:**
```bash
git commit -m "✨ feat: add dark mode toggle"
git commit -m "🐛 fix: resolve authentication redirect loop"
git commit -m "📝 docs: update contribution guidelines"
```

## Pull Request Guidelines

### PR Types

When submitting a PR, select the appropriate type:

| Type | Emoji | Description |
|------|-------|-------------|
| Feature | ✨ | New functionality |
| Bug Fix | 🐛 | Bug fixes |
| Refactor | ♻️ | Code refactoring |
| Documentation | 📝 | Documentation changes |
| CI/CD | 🔧 | CI/CD configuration |
| Dependencies | ⬆️ | Dependency updates |
| Style | 🎨 | Code style/formatting |
| Test | 🧪 | Test additions/updates |
| Chore | 🗑️ | Maintenance tasks |

### Affected Packages

In your PR description, indicate which packages are affected:

- `apps/web` - Main web application
- `packages/ai-hub` - AI provider integration
- `packages/auth` - Authentication
- `packages/database` - Database schemas
- `packages/env` - Environment validation
- `packages/i18n` - Internationalization
- `packages/model-depot` - AI model definitions
- `packages/storage` - File storage
- `packages/ui` - UI components

### PR Requirements

1. **Link related issue**: Reference the issue your PR addresses using `Closes #123`
2. **Keep PRs focused**: Each PR should address a single concern
3. **Include tests**: New features and bug fixes should include tests
4. **Update documentation**: If your changes affect user-facing behavior
5. **Follow code style**: Ensure linting and type checks pass
6. **Describe your changes**: Explain what the PR does and list main changes

### Testing Your Changes

Indicate how your changes were tested:

- [ ] Unit tests
- [ ] E2E tests
- [ ] Manual testing

### PR Title Format

PR titles should follow the same Gitmoji convention as commits:

```
✨ feat: Add user profile page
🐛 fix: Resolve API rate limiting issue
```

**Important:** PR titles starting with `✨ feat/` or `🐛 fix` trigger the release workflow.

### PR Checklist

Before submitting your PR, ensure:

- [ ] `pnpm lint:fix` passes
- [ ] `pnpm check:types` passes
- [ ] `pnpm test` passes (for affected packages)
- [ ] `pnpm build` passes
- [ ] Commit messages follow [Gitmoji convention](https://gitmoji.dev/)
- [ ] Documentation updated (if needed)
- [ ] PR description uses the [template](.github/PULL_REQUEST_TEMPLATE.md)

## Testing

### Unit Tests

We use [Vitest](https://vitest.dev/) for unit testing.

**Run tests for a specific package:**
```bash
# Web app
pnpm --filter @lmring/web test '[file-path-pattern]'

# Specific package
pnpm --filter @lmring/<package> test '[file-path-pattern]'
```

**Important:**
- Wrap file paths in single quotes
- Avoid running `pnpm test` without filters (runs all tests)
- Prefer `vi.spyOn` over `vi.mock` for better maintainability

### E2E Tests

We use [Playwright](https://playwright.dev/) for E2E testing.

```bash
pnpm test:e2e
```

## Code Style

We use [Biome](https://biomejs.dev/) for linting and formatting.

```bash
# Check for errors
pnpm lint

# Auto-fix errors
pnpm lint:fix
```

**Type Checking:**
```bash
# Check all packages
pnpm check:types

# Check specific package
pnpm --filter @lmring/<package> check:types
```

## Internationalization

LMRing supports three languages: English (en), French (fr), and Chinese (zh).

**Adding new translation keys:**

1. Add keys to all locale files:
   - `apps/web/src/locales/en.json`
   - `apps/web/src/locales/fr.json`
   - `apps/web/src/locales/zh.json`

2. Use the translation hook in components:
   ```tsx
   import { useTranslation } from 'react-i18next';

   const { t } = useTranslation();
   return <p>{t('your.translation.key')}</p>;
   ```

**Important:** Always add translations for all three locales when adding new keys.

## Database Migrations

We use [DrizzleORM](https://orm.drizzle.team/) for database management.

**Creating a migration:**

1. Modify the schema in `packages/database/src/schema/`
2. Generate the migration:
   ```bash
   pnpm db:generate
   ```
3. Review the generated migration in `packages/database/drizzle/`
4. Run the migration:
   ```bash
   pnpm db:migrate
   ```

**Viewing the database:**
```bash
pnpm db:studio
```

## Getting Help

If you need help or have questions:

- **Discord**: Join our [Discord community](https://discord.gg/JBbp362mv6)
- **GitHub Issues**: Open an issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for general questions

---

Thank you for contributing to LMRing! Your contributions help make LLM comparison accessible to everyone.
