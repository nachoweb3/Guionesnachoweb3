module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:8000', 'http://localhost:8000/portfolio', 'http://localhost:8000/contact'],
      startServerCommand: 'npm start',
      startServerReadyPattern: 'Server started',
      startServerReadyTimeout: 30000,
      numberOfRuns: 3
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.85 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['warn', { minScore: 0.85 }],
        'categories:seo': ['warn', { minScore: 0.80 }],
        'categories:pwa': 'off'
      }
    },
    upload: {
      target: 'temporary-public-storage'
    }
  }
};