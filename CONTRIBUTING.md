# Contributing to homebridge-leviton

Thank you for your interest in contributing! This guide will help you get started.

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/homebridge-leviton.git
   cd homebridge-leviton
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

## Development Workflow

### Running Tests

```bash
npm test              # Run all tests with coverage
npm run lint          # Check code style
npm run lint:fix      # Auto-fix style issues
```

### Code Style

- Use `const`/`let`, never `var`
- Use async/await over raw Promises
- Add JSDoc comments for public functions
- Follow existing code patterns

### Making Changes

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your changes
3. Add/update tests
4. Ensure all tests pass: `npm test`
5. Ensure linting passes: `npm run lint`
6. Commit with a descriptive message

### Commit Messages

Follow conventional commits:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `test:` - Test changes
- `refactor:` - Code refactoring

Example: `feat: add support for new dimmer model XYZ`

## Pull Request Process

1. Update documentation if needed
2. Update CHANGELOG.md with your changes
3. Ensure CI passes (tests, linting)
4. Request review from maintainers

### PR Checklist

- [ ] Tests added/updated
- [ ] Linting passes
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Descriptive PR title

## Adding Device Support

See [DEVELOPMENT.md](DEVELOPMENT.md#adding-new-device-support) for details on adding support for new Leviton devices.

## Reporting Bugs

Use the GitHub issue template. Include:
- Homebridge version
- Plugin version
- Node.js version
- Steps to reproduce
- Expected vs actual behavior
- Relevant logs (with sensitive data redacted)

## Feature Requests

Open an issue with:
- Clear description of the feature
- Use case / why it's needed
- Any implementation ideas

## Questions?

Open a discussion on GitHub or check existing issues.

---

Thank you for contributing! 🎉

