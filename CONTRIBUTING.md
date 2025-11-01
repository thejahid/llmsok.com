# Contributing to LLM.txt Mastery

We welcome contributions to make LLM.txt Mastery even better! This document outlines how to contribute to the project.

## 🎯 Ways to Contribute

- **Bug Reports**: Found a bug? Report it in the issues
- **Feature Requests**: Have an idea for improvement? We'd love to hear it
- **Code Contributions**: Submit pull requests for bug fixes or new features
- **Documentation**: Help improve our documentation
- **Testing**: Help test new features and report issues

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database
- OpenAI API key

### Local Development
1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/llm-txt-mastery.git
   cd llm-txt-mastery
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Set up environment variables:
   ```bash
   DATABASE_URL=your_postgresql_connection_string
   OPENAI_API_KEY=your_openai_api_key
   ```
5. Initialize database:
   ```bash
   npm run db:push
   ```
6. Start development server:
   ```bash
   npm run dev
   ```

## 📝 Code Style

### Frontend (React/TypeScript)
- Use TypeScript for all new code
- Follow React best practices and hooks patterns
- Use Tailwind CSS for styling
- Prefer shadcn/ui components over custom components
- Use TanStack Query for server state management

### Backend (Express/TypeScript)
- Use TypeScript with strict mode
- Follow RESTful API conventions
- Use Drizzle ORM for database operations
- Implement proper error handling
- Add input validation with Zod schemas

### Database
- Use Drizzle ORM for all database operations
- Run `npm run db:push` to apply schema changes
- Never write raw SQL migrations
- Follow naming conventions for tables and columns

## 🔍 Testing

### Manual Testing
- Test all user flows from URL input to file generation
- Verify sitemap discovery works with various websites
- Check content analysis quality and accuracy
- Test file generation and download functionality

### Automated Testing
- Unit tests for utility functions
- Integration tests for API endpoints
- Component tests for React components

## 📋 Pull Request Process

1. **Create a Branch**: Create a feature branch from main
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**: Implement your feature or fix
   - Follow the code style guidelines
   - Add appropriate comments
   - Update documentation if needed

3. **Test Changes**: Ensure your changes work correctly
   - Test manually with real websites
   - Check that all existing functionality still works
   - Verify no TypeScript errors

4. **Commit Changes**: Use descriptive commit messages
   ```bash
   git commit -m "feat: add support for XML sitemap parsing"
   ```

5. **Push Branch**: Push to your fork
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create Pull Request**: Open a PR with:
   - Clear description of changes
   - Screenshots/videos if UI changes
   - Testing instructions
   - Reference to related issues

## 🐛 Bug Reports

When reporting bugs, please include:
- **Description**: Clear description of the issue
- **Steps to Reproduce**: Detailed steps to recreate the bug
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Environment**: Browser, OS, Node.js version
- **Website URL**: If analyzing a specific website caused the issue

## 💡 Feature Requests

For feature requests, please provide:
- **Problem**: What problem does this solve?
- **Solution**: Describe your proposed solution
- **Alternatives**: Any alternative solutions considered
- **Use Cases**: Real-world scenarios where this would be helpful

## 📚 Documentation

Help improve our documentation:
- Fix typos or unclear instructions
- Add examples or use cases
- Update API documentation
- Improve code comments

## 🌟 Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Follow the project's technical standards

## 🔧 Architecture Overview

### Frontend (`/client`)
- React 18 with TypeScript
- Tailwind CSS + shadcn/ui
- TanStack Query for state management
- Wouter for routing

### Backend (`/server`)
- Express.js with TypeScript
- RESTful API design
- Drizzle ORM for database
- OpenAI integration

### Shared (`/shared`)
- Common schemas and types
- Shared validation logic
- Database schema definitions

## 🚀 Deployment

The project is designed for Replit deployment:
- Single command deployment
- Environment variable management
- PostgreSQL database integration
- Static file serving

## 📞 Getting Help

- **Issues**: Use GitHub issues for bugs and feature requests
- **Discussions**: Use GitHub discussions for questions
- **Code Review**: All PRs require review before merging

Thank you for contributing to LLM.txt Mastery! 🙏