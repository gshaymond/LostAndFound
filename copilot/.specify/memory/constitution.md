## Project Constitution

### Purpose
This constitution captures non-negotiable principles for code quality, testing, user experience (UX) consistency, and performance requirements that all contributors must follow.

---

## Principles

1. Code Quality
- Readability first: prefer clear, self-explanatory code over cleverness.
- Single Responsibility: modules/classes should have one well-defined purpose.
- Small, focused functions: aim for functions that fit on one screen and are easily testable.
- Typed surfaces: use static types where available (TypeScript, mypy, etc.) and enable strict compiler/linter rules.
- Linting & formatting: a shared linter and formatter must run in CI and be enforced via pre-commit hooks.
- Documentation: public APIs, complex algorithms, and configuration surfaces must have concise docs and usage examples.

2. Testing Standards
- Test-first mindset: where practical, write a test before implementing behavior (TDD encouraged).
- Coverage targets: aim for 80% unit coverage for critical modules and 60% overall as a minimum; use coverage metrics in CI.
- Test pyramid: prioritize fast unit tests, add integration tests for contracts, and E2E tests for core user flows.
- CI gates: all tests (unit + integration where applicable) must pass before merging to protected branches.
- Flaky test policy: flaky tests must be quarantined or fixed; no indefinite retries in CI without root-cause handling.
- Test data & isolation: tests must be hermetic; external calls should be mocked unless integration is explicit.

3. User Experience Consistency
- Design tokens & components: use a shared component library and design tokens for spacing, color, and typography.
- Accessibility: follow WCAG 2.1 AA standards for all public-facing UI; include basic a11y tests in CI.
- Copy consistency: use a single source for microcopy (e.g., locale files) and follow established voice/tone guidelines.
- Responsive-first: UIs must degrade gracefully across viewports; critical flows tested on common sizes.
- Error handling & messaging: present actionable, friendly error messages and surface clear recovery paths.
- Onboarding & defaults: sensible defaults and inline guidance must minimize friction for first-time users.

4. Performance Requirements
- Performance budgets: define budgets for first meaningful paint, Time-to-Interactive (TTI), and bundle sizes for each app.
- Load targets: aim for <2s TTFB for server responses and <3s on mobile networks for core pages.
- Resource limits: set max bundle sizes per entry point (e.g., 200KB gzipped baseline) and track regressions in CI.
- Caching & CDNs: use caching headers, CDNs, and immutable assets for static content.
- Backend SLAs: critical APIs should target 95th percentile latency thresholds (e.g., <200ms for read endpoints).
- Performance testing: include simple automated performance checks in CI and run periodic load tests for critical flows.

---

## Adoption, Enforcement & Metrics

- Pre-merge checks: linters, type checks, unit tests, and basic performance checks must run on every PR.
- PR checklist: each PR must include: purpose summary, test plan, docs if public API changes, and performance impact if relevant.
- Metrics and observability: instrument key flows with telemetry (latency, errors, usage) and define alerting thresholds.
- Exceptions: any deviation requires documented justification, an owner, and a sunset plan.
- Reviews: maintainers enforce these principles during code review; automated checks block merging when violations occur.

## Quick Compliance Checklist (for PRs)
- [ ] Lint and format passed
- [ ] Type checks passed
- [ ] Unit tests added/updated
- [ ] Integration/E2E tests where applicable
- [ ] Performance impact assessed
- [ ] Accessibility smoke-checked
- [ ] Documentation updated (public APIs, notable behavior)

## Governance & Amendments

This constitution is the authoritative guide for quality and non-functional requirements. Amendments require a short proposal, rationale, and a migration/rollout plan, and must be approved by project maintainers.

**Version**: 1.0.0 | **Ratified**: 2026-01-13 | **Last Amended**: 2026-01-13
