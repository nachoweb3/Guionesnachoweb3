# Contributing to Video Editor for TikTok/Reels

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect different viewpoints and experiences

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check existing issues. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce**
- **Expected behavior**
- **Actual behavior**
- **Screenshots** (if applicable)
- **Environment details** (OS, browser, versions)

### Suggesting Features

Feature suggestions are welcome! Please:

- Check if the feature already exists
- Clearly describe the feature and its benefits
- Provide examples of how it would work
- Consider implementation challenges

### Pull Requests

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make your changes**
   - Follow the coding standards
   - Add tests if applicable
   - Update documentation

4. **Commit your changes**
   ```bash
   git commit -m "Add amazing feature"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **Open a Pull Request**
   - Describe your changes
   - Reference related issues
   - Include screenshots for UI changes

## Development Setup

See README.md for detailed setup instructions.

## Coding Standards

### Python (Backend)

- Follow PEP 8
- Use type hints
- Document functions with docstrings
- Keep functions small and focused
- Write tests for new features

```python
def download_video(url: str) -> Dict[str, Any]:
    """Download video from YouTube.

    Args:
        url: YouTube video URL

    Returns:
        Dictionary with video metadata

    Raises:
        Exception: If download fails
    """
    pass
```

### JavaScript/React (Frontend)

- Use ES6+ features
- Follow Airbnb style guide
- Use functional components with hooks
- Keep components small and reusable
- Use meaningful variable names

```javascript
// Good
const VideoEditor = ({ videoData }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  return (
    <div className="video-editor">
      {/* Component content */}
    </div>
  );
};

// Bad
function comp(d) {
  const x = false;
  return <div>{d}</div>;
}
```

### CSS

- Use CSS variables for theming
- Follow BEM naming convention
- Keep styles modular and component-scoped
- Use mobile-first approach

```css
.video-editor {
  /* Component styles */
}

.video-editor__header {
  /* Element styles */
}

.video-editor--loading {
  /* Modifier styles */
}
```

## Testing

### Backend Tests
```bash
cd backend
pytest tests/
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Documentation

- Update README.md for significant changes
- Document new API endpoints
- Add JSDoc comments for complex functions
- Update DEPLOYMENT.md for infrastructure changes

## Commit Message Guidelines

Use clear, descriptive commit messages:

```
feat: Add video trimming feature
fix: Resolve audio sync issue
docs: Update API documentation
style: Format code with prettier
refactor: Simplify video processing logic
test: Add tests for download service
chore: Update dependencies
```

## Review Process

1. Automated tests must pass
2. Code review by maintainer
3. Address feedback
4. Approval and merge

## Getting Help

- Open an issue for questions
- Join our Discord/Slack (if available)
- Check existing documentation
- Review closed issues for similar problems

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project website (if applicable)

Thank you for contributing! 🎉
