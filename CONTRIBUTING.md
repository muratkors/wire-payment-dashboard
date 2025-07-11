
# Contributing to TreasuryStream Wire Payment Dashboard

Thank you for your interest in contributing to TreasuryStream! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Reporting Issues
- Use the GitHub issue tracker to report bugs
- Include detailed information about the issue
- Provide steps to reproduce the problem
- Include screenshots if applicable

### Suggesting Features
- Open an issue with the "feature request" label
- Describe the feature and its benefits
- Provide use cases and examples

### Code Contributions

#### Getting Started
1. Fork the repository
2. Clone your fork locally
3. Create a new branch for your feature/fix
4. Make your changes
5. Test your changes thoroughly
6. Submit a pull request

#### Development Setup
```bash
# Clone your fork
git clone https://github.com/yourusername/treasurystream.git
cd treasurystream

# Install dependencies
cd app
yarn install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Set up database
yarn prisma generate
yarn prisma db push
yarn prisma db seed

# Start development server
yarn dev
```

## 📝 Coding Standards

### TypeScript/JavaScript
- Use TypeScript for all new code
- Follow existing code style and patterns
- Use meaningful variable and function names
- Add JSDoc comments for complex functions
- Prefer functional components with hooks

### Database
- Use Prisma for all database operations
- Follow existing schema patterns
- Include proper indexes for performance
- Add migrations for schema changes

### UI/UX
- Follow existing design patterns
- Use Tailwind CSS for styling
- Ensure responsive design
- Test on multiple screen sizes
- Maintain accessibility standards

### Testing
- Write tests for new features
- Update existing tests when modifying code
- Ensure all tests pass before submitting PR
- Include both unit and integration tests

## 🔄 Pull Request Process

1. **Branch Naming**: Use descriptive branch names
   - `feature/payment-export`
   - `fix/allocation-calculation`
   - `docs/api-documentation`

2. **Commit Messages**: Use clear, descriptive commit messages
   - `feat: add payment export functionality`
   - `fix: resolve allocation calculation error`
   - `docs: update API documentation`

3. **Pull Request Description**
   - Describe what changes were made
   - Explain why the changes were necessary
   - Include screenshots for UI changes
   - Reference related issues

4. **Code Review**
   - Address all review comments
   - Update documentation if needed
   - Ensure CI/CD checks pass

## 🧪 Testing Guidelines

### Running Tests
```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run specific test file
yarn test payment.test.ts
```

### Test Coverage
- Aim for high test coverage
- Test both happy path and edge cases
- Include error handling tests
- Test database operations

### Test Types
- **Unit Tests**: Individual functions and components
- **Integration Tests**: API endpoints and database operations
- **E2E Tests**: Complete user workflows

## 📚 Documentation

### Code Documentation
- Add JSDoc comments for public APIs
- Document complex business logic
- Include examples in documentation
- Keep README.md updated

### API Documentation
- Document all API endpoints
- Include request/response examples
- Document error responses
- Update OpenAPI/Swagger specs

## 🚀 Release Process

### Version Numbering
We follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Checklist
- [ ] All tests pass
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version number bumped
- [ ] Database migrations tested
- [ ] Performance impact assessed

## 🛡 Security

### Reporting Security Issues
- Do not open public issues for security vulnerabilities
- Email security concerns to the maintainers
- Include detailed information about the vulnerability
- Allow time for the issue to be addressed before disclosure

### Security Best Practices
- Never commit sensitive data (API keys, passwords)
- Use environment variables for configuration
- Validate all user inputs
- Follow OWASP security guidelines
- Keep dependencies updated

## 📋 Code Review Checklist

### For Authors
- [ ] Code follows project standards
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No sensitive data in commits
- [ ] Performance impact considered
- [ ] Accessibility requirements met

### For Reviewers
- [ ] Code is readable and maintainable
- [ ] Logic is correct and efficient
- [ ] Tests cover the changes
- [ ] Security implications considered
- [ ] Documentation is adequate
- [ ] UI/UX is consistent

## 🎯 Areas for Contribution

### High Priority
- Performance optimizations
- Additional test coverage
- Documentation improvements
- Bug fixes and stability

### Medium Priority
- New payment processing features
- Enhanced reporting capabilities
- UI/UX improvements
- API enhancements

### Low Priority
- Code refactoring
- Developer tooling improvements
- Additional integrations
- Experimental features

## 💬 Communication

### Channels
- GitHub Issues: Bug reports and feature requests
- GitHub Discussions: General questions and ideas
- Pull Requests: Code review and collaboration

### Guidelines
- Be respectful and constructive
- Provide clear and detailed information
- Follow up on your contributions
- Help others when possible

## 📄 License

By contributing to TreasuryStream, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to TreasuryStream! Your efforts help make treasury operations more efficient and reliable.
