module.exports = {
  ci: {
    collect: {
      staticDistDir: './packages/web/dist',
      numberOfRuns: 3,
      startServerCommand: 'npm run preview --workspace=packages/web',
      startServerReadyPattern: 'Local:.*http://localhost:[0-9]+',
      startServerReadyTimeout: 30000,
      url: [
        'http://localhost:4173',
        'http://localhost:4173/search',
        'http://localhost:4173/library',
        'http://localhost:4173/playlist',
      ],
    },
    upload: {
      target: 'filesystem',
      outputDir: './lighthouse-reports',
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
        'categories:pwa': ['warn', { minScore: 0.8 }],
      },
    },
  },
};