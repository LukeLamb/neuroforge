# Contributing to NeuroForge

Thanks for your interest in contributing to NeuroForge! This document provides guidelines for contributing to the platform.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/neuroforge.git`
3. Install dependencies: `pnpm install`
4. Copy environment template: `cp .env.example .env.local`
5. Set up your PostgreSQL database and update `.env.local`
6. Run migrations: `pnpm drizzle-kit push`
7. Start dev server: `pnpm dev`

## Development

- **Framework:** Next.js 15 with App Router
- **Language:** TypeScript (strict mode)
- **API:** tRPC for type-safe endpoints
- **Database:** PostgreSQL with Drizzle ORM
- **Styling:** Tailwind CSS 4.0

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes with clear commit messages
3. Ensure `pnpm lint` and `pnpm type-check` pass
4. Submit a PR with a description of what changed and why

## Code Style

- Use TypeScript strict mode
- Follow existing patterns in the codebase
- Keep components focused and composable
- Use tRPC procedures for all API endpoints

## Reporting Issues

Open an issue on GitHub with:
- A clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Your environment (OS, Node version, browser)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
