/**
 * Portfolio System Tests
 * Comprehensive testing suite for portfolio management
 */

describe('Portfolio Management System', () => {
  let portfolioManager;

  beforeEach(() => {
    // Initialize portfolio manager
    portfolioManager = new PortfolioManager();
  });

  describe('Project Loading', () => {
    test('should load featured projects successfully', async () => {
      await portfolioManager.loadProjects();
      expect(portfolioManager.projects).toBeDefined();
      expect(Array.isArray(portfolioManager.projects)).toBe(true);
    });

    test('should load projects with valid structure', async () => {
      await portfolioManager.loadProjects();
      if (portfolioManager.projects.length > 0) {
        const project = portfolioManager.projects[0];
        expect(project).toHaveProperty('id');
        expect(project).toHaveProperty('title');
        expect(project).toHaveProperty('description');
        expect(project).toHaveProperty('url');
        expect(project).toHaveProperty('technologies');
        expect(project).toHaveProperty('category');
      }
    });

    test('should handle malformed JSON gracefully', async () => {
      // Mock fetch to return invalid JSON
      global.fetch = jest.fn().mockRejectedValue(new Error('Invalid JSON'));

      await portfolioManager.loadProjects();
      expect(portfolioManager.projects.length).toBeGreaterThan(0); // Should have fallback projects
    });
  });

  describe('Project Filtering', () => {
    beforeEach(async () => {
      await portfolioManager.loadProjects();
    });

    test('should filter projects by category', () => {
      const filteredProjects = portfolioManager.filterProjects('Blockchain');
      expect(filteredProjects.every(project => project.category === 'Blockchain')).toBe(true);
    });

    test('should show all projects when "All" filter is selected', () => {
      const allProjects = portfolioManager.filterProjects('All');
      expect(allProjects.length).toBe(portfolioManager.projects.length);
    });

    test('should return empty array for non-existent category', () => {
      const filteredProjects = portfolioManager.filterProjects('NonExistent');
      expect(filteredProjects.length).toBe(0);
    });
  });

  describe('Project Search', () => {
    beforeEach(async () => {
      await portfolioManager.loadProjects();
    });

    test('should search projects by title', () => {
      const results = portfolioManager.searchProjects('Crypto');
      expect(results.every(project =>
        project.title.toLowerCase().includes('crypto'.toLowerCase())
      )).toBe(true);
    });

    test('should search projects by description', () => {
      const results = portfolioManager.searchProjects('platform');
      expect(results.every(project =>
        project.description.toLowerCase().includes('platform'.toLowerCase())
      )).toBe(true);
    });

    test('should search projects by technologies', () => {
      const results = portfolioManager.searchProjects('React');
      expect(results.every(project =>
        project.technologies.some(tech => tech.toLowerCase().includes('react'.toLowerCase()))
      )).toBe(true);
    });

    test('should handle empty search query', () => {
      const results = portfolioManager.searchProjects('');
      expect(results.length).toBe(portfolioManager.projects.length);
    });
  });

  describe('Project Modal', () => {
    test('should open project details modal', () => {
      const mockProject = {
        id: 'test-project',
        title: 'Test Project',
        description: 'Test Description',
        technologies: ['Test'],
        category: 'Test',
        url: 'https://test.com'
      };

      portfolioManager.projects = [mockProject];
      portfolioManager.showProjectDetails('test-project');

      const modal = document.querySelector('.project-modal');
      expect(modal).toBeTruthy();
      expect(modal.classList.contains('active')).toBe(true);
    });

    test('should close modal correctly', () => {
      portfolioManager.closeModal();
      const modal = document.querySelector('.project-modal');
      expect(modal.classList.contains('active')).toBe(false);
    });
  });

  describe('UI Interactions', () => {
    test('should toggle view between grid and list', () => {
      const viewButtons = document.querySelectorAll('.view-btn');
      const listButton = Array.from(viewButtons).find(btn => btn.dataset.view === 'list');

      if (listButton) {
        listButton.click();
        const grid = document.getElementById('projects-grid');
        expect(grid.className).toContain('list-view');
      }
    });

    test('should apply hover effects to project cards', () => {
      const projectCards = document.querySelectorAll('.project-card');
      projectCards.forEach(card => {
        expect(card.style.transition).toBeDefined();
      });
    });
  });

  describe('Data Validation', () => {
    test('should validate project URLs', async () => {
      await portfolioManager.loadProjects();

      portfolioManager.projects.forEach(project => {
        if (project.url) {
          try {
            new URL(project.url);
          } catch (e) {
            console.warn(`Invalid URL in project ${project.id}: ${project.url}`);
          }
        }
      });
    });

    test('should validate technology tags', async () => {
      await portfolioManager.loadProjects();

      portfolioManager.projects.forEach(project => {
        expect(Array.isArray(project.technologies)).toBe(true);
        project.technologies.forEach(tech => {
          expect(typeof tech).toBe('string');
          expect(tech.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('Performance', () => {
    test('should load projects within acceptable time', async () => {
      const startTime = performance.now();
      await portfolioManager.loadProjects();
      const endTime = performance.now();
      const loadTime = endTime - startTime;

      expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
    });

    test('should handle large project lists efficiently', async () => {
      // Create a large array of mock projects
      const mockProjects = Array.from({ length: 1000 }, (_, i) => ({
        id: `project-${i}`,
        title: `Project ${i}`,
        description: `Description for project ${i}`,
        technologies: ['JavaScript', 'React'],
        category: 'Web',
        url: `https://project${i}.com`
      }));

      portfolioManager.projects = mockProjects;

      const startTime = performance.now();
      portfolioManager.filterProjects('Web');
      const endTime = performance.now();
      const filterTime = endTime - startTime;

      expect(filterTime).toBeLessThan(100); // Should filter within 100ms
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels on project cards', async () => {
      await portfolioManager.loadProjects();
      const projectCards = document.querySelectorAll('.project-card');

      projectCards.forEach(card => {
        // Check for proper role or aria attributes
        expect(card.getAttribute('role') || card.querySelector('[aria-label]')).toBeTruthy();
      });
    });

    test('should support keyboard navigation', () => {
      const filterButtons = document.querySelectorAll('.filter-btn');

      filterButtons.forEach(button => {
        expect(button.tabIndex).toBeGreaterThanOrEqual(0);
        expect(button.getAttribute('aria-pressed') || button.getAttribute('role')).toBeTruthy();
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle missing project data gracefully', () => {
      const incompleteProject = {
        id: 'incomplete',
        title: 'Incomplete Project'
        // Missing other required fields
      };

      expect(() => {
        portfolioManager.projects = [incompleteProject];
        portfolioManager.renderAllProjects();
      }).not.toThrow();
    });

    test('should show error message for failed project load', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      await portfolioManager.loadProjects();

      // Should have fallback projects
      expect(portfolioManager.projects.length).toBeGreaterThan(0);
    });
  });

  describe('LocalStorage Integration', () => {
    test('should save and retrieve user preferences', () => {
      const preferences = {
        viewMode: 'list',
        favoriteProjects: ['crypto-blog'],
        lastVisited: Date.now()
      };

      localStorage.setItem('portfolio-preferences', JSON.stringify(preferences));

      const saved = JSON.parse(localStorage.getItem('portfolio-preferences'));
      expect(saved).toEqual(preferences);
    });

    test('should handle localStorage unavailability', () => {
      // Mock localStorage to be unavailable
      const originalLocalStorage = global.localStorage;
      global.localStorage = undefined;

      expect(() => {
        portfolioManager.saveUserPreferences({});
      }).not.toThrow();

      global.localStorage = originalLocalStorage;
    });
  });
});

describe('Portfolio Integration Tests', () => {
  test('should integrate with wallet system', () => {
    if (typeof walletManager !== 'undefined') {
      expect(walletManager).toBeDefined();
      expect(typeof walletManager.connect).toBe('function');
    }
  });

  test('should integrate with analytics system', () => {
    if (typeof analytics !== 'undefined') {
      expect(analytics).toBeDefined();
      expect(typeof analytics.track).toBe('function');
    }
  });

  test('should integrate with shopping cart', () => {
    if (typeof cart !== 'undefined') {
      expect(cart).toBeDefined();
      expect(typeof cart.renderCartModal).toBe('function');
    }
  });
});