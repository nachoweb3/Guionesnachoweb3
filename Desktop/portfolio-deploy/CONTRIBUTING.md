# Contributing to Nacho Portfolio

First off, thank you for considering contributing to this project! It's people like you that make this portfolio even better.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Style Guidelines](#style-guidelines)
- [Commit Messages](#commit-messages)

## Code of Conduct

This project and everyone participating in it is governed by respect and professionalism. By participating, you are expected to uphold this code.

### Our Standards

- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues. When you are creating a bug report, please include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples to demonstrate the steps**
- **Describe the behavior you observed and what you expected**
- **Include screenshots if possible**
- **Include your environment details** (browser, OS, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Use a clear and descriptive title**
- **Provide a detailed description of the suggested enhancement**
- **Provide specific examples to demonstrate the enhancement**
- **Describe the current behavior and expected behavior**
- **Explain why this enhancement would be useful**

### Pull Requests

- Fill in the required template
- Do not include issue numbers in the PR title
- Follow the JavaScript style guide
- Include thoughtful commit messages
- Document new code
- End all files with a newline
- Test your changes thoroughly

## Development Setup

1. **Fork the repository**
   ```bash
   git clone https://github.com/your-username/portfolio-deploy.git
   cd portfolio-deploy
   ```

2. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Install dependencies** (if applicable)
   ```bash
   npm install
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Make your changes**
   - Write clean, maintainable code
   - Follow the existing code style
   - Add comments where necessary
   - Test thoroughly

6. **Test your changes**
   ```bash
   # Test locally
   npm start
   # Open http://localhost:8000

   # Test crypto payment features on testnet
   npm run test:payments
   ```

## Pull Request Process

1. **Update documentation** for any changes
2. **Update the README.md** if needed
3. **Ensure all tests pass**
4. **Request review** from maintainers
5. **Address review comments** promptly
6. **Squash commits** before merge (if requested)

### PR Title Format

```
type(scope): Brief description

Examples:
feat(payments): Add BTC payment support
fix(wallet): Resolve MetaMask connection issue
docs(readme): Update installation instructions
style(css): Improve mobile responsiveness
```

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Breaking change (fix or feature causing existing functionality to break)
- [ ] Documentation update

## How Has This Been Tested?
Describe the tests performed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review performed
- [ ] Code commented where necessary
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added for new features
- [ ] All tests pass
```

## Style Guidelines

### JavaScript Style Guide

- Use **ES6+ features** where appropriate
- Use **const** and **let** instead of var
- Use **arrow functions** for callbacks
- Use **template literals** instead of string concatenation
- Use **async/await** instead of callbacks
- Add **JSDoc comments** for functions
- Keep functions **small and focused**
- Use **meaningful variable names**

#### Example

```javascript
/**
 * Process crypto payment transaction
 * @param {Object} paymentData - Payment information
 * @param {string} paymentData.currency - Crypto currency (ETH, BTC, etc.)
 * @param {number} paymentData.amount - Amount in USD
 * @param {string} paymentData.walletAddress - Recipient wallet
 * @returns {Promise<Object>} Transaction result
 */
async function processCryptoPayment(paymentData) {
  try {
    const { currency, amount, walletAddress } = paymentData;

    // Validate inputs
    if (!currency || !amount || !walletAddress) {
      throw new Error('Missing required payment data');
    }

    // Process payment
    const transaction = await initiateTransaction({
      currency,
      amount,
      to: walletAddress
    });

    return {
      success: true,
      txHash: transaction.hash,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Payment processing error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
```

### CSS Style Guide

- Use **CSS variables** for colors and spacing
- Follow **BEM naming convention**
- Keep selectors **simple and specific**
- Use **mobile-first approach**
- Group related properties
- Add comments for complex styles

#### Example

```css
/* Component: Payment Modal */
.payment-modal {
  /* Layout */
  display: flex;
  flex-direction: column;

  /* Positioning */
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);

  /* Box model */
  width: 90%;
  max-width: 500px;
  padding: var(--spacing-lg);

  /* Visual */
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
}

.payment-modal__header {
  margin-bottom: var(--spacing-md);
  font-size: var(--font-xl);
  font-weight: 700;
}

.payment-modal__body {
  flex: 1;
  overflow-y: auto;
}

/* Responsive */
@media (min-width: 768px) {
  .payment-modal {
    width: 500px;
  }
}
```

### HTML Style Guide

- Use **semantic HTML5** elements
- Include **proper meta tags**
- Add **alt text** for images
- Use **ARIA labels** for accessibility
- Keep **indentation consistent** (2 spaces)
- Close all tags properly

## Commit Messages

### Format

```
type(scope): Subject line (max 50 chars)

Body: More detailed explanation (wrap at 72 chars)
- Why this change is needed
- How it addresses the issue
- Any side effects

Footer: References to issues, breaking changes
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Build process, dependencies, etc.

### Examples

```bash
feat(payments): Add Bitcoin payment support

- Integrated Bitcoin wallet connection
- Added BTC price conversion
- Implemented transaction verification

Closes #123

---

fix(wallet): Resolve MetaMask connection timeout

The connection was timing out due to improper promise handling.
Now using async/await pattern with proper error handling.

Fixes #456

---

docs(readme): Update crypto payment setup instructions

Added detailed steps for configuring crypto payments
including smart contract deployment and API keys.
```

## Testing Guidelines

### What to Test

- New features functionality
- Bug fixes verification
- Cross-browser compatibility
- Mobile responsiveness
- Wallet connections (MetaMask, WalletConnect)
- Payment flows
- Form validations
- Error handling

### Testing Checklist

- [ ] Desktop browsers (Chrome, Firefox, Safari, Edge)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)
- [ ] Different screen sizes (320px to 1920px)
- [ ] Dark and light mode
- [ ] Wallet connections work
- [ ] Payment flows complete successfully
- [ ] Forms validate correctly
- [ ] No console errors
- [ ] Performance is acceptable
- [ ] Accessibility requirements met

## Questions?

Feel free to reach out:
- **Email**: nacho@portfolio.com
- **Telegram**: @nacho_digital
- **Discord**: Join our community

Thank you for contributing! 🚀
