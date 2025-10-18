-- SkillStash Registry Seed Data
-- Development seed data with realistic examples
-- Version: 1.0
-- Last Updated: 2025-10-18

-- =============================================================================
-- Authors
-- =============================================================================

INSERT INTO authors (id, username, email, github_url, website, bio, avatar_url, created_at, updated_at) VALUES
  ('author-001', 'claudedev', 'team@anthropic.com', 'https://github.com/anthropics', 'https://anthropic.com', 'Official Anthropic developer tools for Claude Code', 'https://github.com/anthropics.png', '2025-01-01T00:00:00Z', '2025-01-01T00:00:00Z'),
  ('author-002', 'devtools', 'hello@devtools.io', 'https://github.com/devtools', 'https://devtools.io', 'Building productivity tools for developers', 'https://github.com/devtools.png', '2025-01-15T00:00:00Z', '2025-01-15T00:00:00Z'),
  ('author-003', 'aiworkflows', 'contact@aiworkflows.dev', 'https://github.com/aiworkflows', 'https://aiworkflows.dev', 'AI-powered development workflows and automation', 'https://github.com/aiworkflows.png', '2025-02-01T00:00:00Z', '2025-02-01T00:00:00Z'),
  ('author-004', 'codeassist', 'info@codeassist.com', 'https://github.com/codeassist', 'https://codeassist.com', 'Code assistance and review automation tools', 'https://github.com/codeassist.png', '2025-02-15T00:00:00Z', '2025-02-15T00:00:00Z'),
  ('author-005', 'qatools', 'team@qatools.io', 'https://github.com/qatools', 'https://qatools.io', 'Quality assurance and testing automation', 'https://github.com/qatools.png', '2025-03-01T00:00:00Z', '2025-03-01T00:00:00Z');

-- =============================================================================
-- Plugins
-- =============================================================================

INSERT INTO plugins (id, name, description, long_description, author_id, repo_url, homepage_url, license, stars, downloads, status, is_verified, created_at, updated_at) VALUES
  (
    'plugin-001',
    'git-workflow',
    'Comprehensive git workflow skill with branch management and conventional commits',
    'A complete git workflow management skill that enforces branch-based development, conventional commits, and PR-based collaboration. Includes support for git-spice stacking and GitHub CLI integration.',
    'author-001',
    'https://github.com/anthropics/claude-git-workflow',
    'https://claude.ai/plugins/git-workflow',
    'MIT',
    1250,
    8500,
    'active',
    1,
    '2025-01-10T00:00:00Z',
    '2025-10-15T00:00:00Z'
  ),
  (
    'plugin-002',
    'code-review-agent',
    'Intelligent code review agent with comprehensive analysis capabilities',
    'An advanced code review agent that performs systematic analysis of code quality, security, performance, and architecture. Provides detailed feedback with actionable recommendations.',
    'author-004',
    'https://github.com/codeassist/code-review-agent',
    'https://codeassist.com/code-review',
    'Apache-2.0',
    950,
    5200,
    'active',
    1,
    '2025-02-20T00:00:00Z',
    '2025-10-10T00:00:00Z'
  ),
  (
    'plugin-003',
    'playwright-testing',
    'Browser automation and E2E testing with Playwright',
    'Complete browser automation toolkit built on Playwright. Supports cross-browser testing, visual regression, performance monitoring, and user simulation across Chrome, Firefox, Safari, and Edge.',
    'author-005',
    'https://github.com/qatools/playwright-testing',
    'https://qatools.io/playwright',
    'MIT',
    720,
    3800,
    'active',
    1,
    '2025-03-10T00:00:00Z',
    '2025-10-12T00:00:00Z'
  ),
  (
    'plugin-004',
    'documentation-generator',
    'Automated documentation generation from codebase',
    'Intelligent documentation generator that analyzes your codebase and creates comprehensive documentation including API references, architecture diagrams, and usage examples.',
    'author-002',
    'https://github.com/devtools/documentation-generator',
    'https://devtools.io/docs-gen',
    'MIT',
    680,
    4100,
    'active',
    0,
    '2025-04-01T00:00:00Z',
    '2025-10-05T00:00:00Z'
  ),
  (
    'plugin-005',
    'api-design-toolkit',
    'RESTful API design and development toolkit',
    'Complete toolkit for designing, implementing, and documenting RESTful APIs. Includes OpenAPI generation, endpoint scaffolding, and automated testing.',
    'author-002',
    'https://github.com/devtools/api-design-toolkit',
    'https://devtools.io/api-toolkit',
    'Apache-2.0',
    540,
    2900,
    'active',
    0,
    '2025-05-15T00:00:00Z',
    '2025-10-08T00:00:00Z'
  ),
  (
    'plugin-006',
    'database-schema-builder',
    'Visual database schema designer and migration generator',
    'Interactive database schema design tool with automatic migration generation for PostgreSQL, MySQL, SQLite, and other databases.',
    'author-003',
    'https://github.com/aiworkflows/db-schema-builder',
    'https://aiworkflows.dev/db-schema',
    'MIT',
    820,
    3600,
    'active',
    1,
    '2025-06-01T00:00:00Z',
    '2025-10-14T00:00:00Z'
  ),
  (
    'plugin-007',
    'performance-monitor',
    'Real-time application performance monitoring',
    'Comprehensive performance monitoring solution with real-time metrics, alerting, and optimization recommendations.',
    'author-003',
    'https://github.com/aiworkflows/performance-monitor',
    'https://aiworkflows.dev/perf-monitor',
    'Apache-2.0',
    430,
    1800,
    'active',
    0,
    '2025-07-10T00:00:00Z',
    '2025-10-01T00:00:00Z'
  ),
  (
    'plugin-008',
    'security-scanner',
    'Automated security vulnerability scanning',
    'Security scanning tool that identifies vulnerabilities, insecure dependencies, and potential security issues in your codebase.',
    'author-004',
    'https://github.com/codeassist/security-scanner',
    'https://codeassist.com/security',
    'Apache-2.0',
    1100,
    6200,
    'active',
    1,
    '2025-08-01T00:00:00Z',
    '2025-10-16T00:00:00Z'
  );

-- =============================================================================
-- Plugin Versions
-- =============================================================================

INSERT INTO plugin_versions (id, plugin_id, version, changelog, breaking_changes, min_claude_version, published_at, is_latest) VALUES
  ('version-001', 'plugin-001', '2.1.0', 'Added git-spice integration for stacked PRs. Improved branch naming conventions. Enhanced commit message validation.', NULL, '1.0.0', '2025-10-15T00:00:00Z', 1),
  ('version-002', 'plugin-001', '2.0.0', 'Major rewrite with GitHub CLI integration. Added automatic PR creation. Conventional commits enforcement.', 'Changed configuration format from YAML to JSON', '1.0.0', '2025-08-01T00:00:00Z', 0),
  ('version-003', 'plugin-001', '1.5.0', 'Added commit frequency tracking. Improved error messages.', NULL, '0.9.0', '2025-05-10T00:00:00Z', 0),
  ('version-004', 'plugin-002', '1.3.0', 'Enhanced security analysis. Added performance profiling. Improved architecture review capabilities.', NULL, '1.0.0', '2025-10-10T00:00:00Z', 1),
  ('version-005', 'plugin-002', '1.2.0', 'Added support for TypeScript and Python. Improved code quality metrics.', NULL, '0.9.0', '2025-07-15T00:00:00Z', 0),
  ('version-006', 'plugin-003', '1.1.0', 'Added mobile device emulation. Improved cross-browser test coordination. Enhanced screenshot capture.', NULL, '1.0.0', '2025-10-12T00:00:00Z', 1),
  ('version-007', 'plugin-003', '1.0.0', 'Initial release with Chrome, Firefox, and Safari support.', NULL, '1.0.0', '2025-08-20T00:00:00Z', 0),
  ('version-008', 'plugin-004', '0.9.0', 'Beta release with API documentation and architecture diagrams.', NULL, '1.0.0', '2025-10-05T00:00:00Z', 1),
  ('version-009', 'plugin-005', '1.0.2', 'Bug fixes for OpenAPI generation. Improved endpoint validation.', NULL, '1.0.0', '2025-10-08T00:00:00Z', 1),
  ('version-010', 'plugin-006', '2.0.0', 'Complete rewrite with visual schema editor. Added migration rollback support.', 'Changed schema format to support visual editor', '1.0.0', '2025-10-14T00:00:00Z', 1),
  ('version-011', 'plugin-007', '0.8.0', 'Alpha release with basic monitoring capabilities.', NULL, '1.0.0', '2025-10-01T00:00:00Z', 1),
  ('version-012', 'plugin-008', '1.5.0', 'Added dependency vulnerability scanning. Enhanced OWASP Top 10 detection.', NULL, '1.0.0', '2025-10-16T00:00:00Z', 1);

-- =============================================================================
-- Plugin Tags
-- =============================================================================

INSERT INTO plugin_tags (id, plugin_id, tag, category) VALUES
  -- git-workflow tags
  ('tag-001', 'plugin-001', 'git', 'tool'),
  ('tag-002', 'plugin-001', 'version-control', 'feature'),
  ('tag-003', 'plugin-001', 'workflow', 'domain'),
  ('tag-004', 'plugin-001', 'github', 'platform'),

  -- code-review-agent tags
  ('tag-005', 'plugin-002', 'code-review', 'feature'),
  ('tag-006', 'plugin-002', 'quality', 'domain'),
  ('tag-007', 'plugin-002', 'security', 'feature'),
  ('tag-008', 'plugin-002', 'typescript', 'language'),
  ('tag-009', 'plugin-002', 'python', 'language'),

  -- playwright-testing tags
  ('tag-010', 'plugin-003', 'testing', 'domain'),
  ('tag-011', 'plugin-003', 'e2e', 'feature'),
  ('tag-012', 'plugin-003', 'playwright', 'tool'),
  ('tag-013', 'plugin-003', 'browser-automation', 'feature'),

  -- documentation-generator tags
  ('tag-014', 'plugin-004', 'documentation', 'domain'),
  ('tag-015', 'plugin-004', 'api-docs', 'feature'),
  ('tag-016', 'plugin-004', 'markdown', 'tool'),

  -- api-design-toolkit tags
  ('tag-017', 'plugin-005', 'api', 'domain'),
  ('tag-018', 'plugin-005', 'rest', 'feature'),
  ('tag-019', 'plugin-005', 'openapi', 'tool'),
  ('tag-020', 'plugin-005', 'nodejs', 'language'),

  -- database-schema-builder tags
  ('tag-021', 'plugin-006', 'database', 'domain'),
  ('tag-022', 'plugin-006', 'schema', 'feature'),
  ('tag-023', 'plugin-006', 'migration', 'feature'),
  ('tag-024', 'plugin-006', 'sql', 'language'),

  -- performance-monitor tags
  ('tag-025', 'plugin-007', 'performance', 'domain'),
  ('tag-026', 'plugin-007', 'monitoring', 'feature'),
  ('tag-027', 'plugin-007', 'metrics', 'feature'),

  -- security-scanner tags
  ('tag-028', 'plugin-008', 'security', 'domain'),
  ('tag-029', 'plugin-008', 'vulnerability', 'feature'),
  ('tag-030', 'plugin-008', 'scanning', 'feature'),
  ('tag-031', 'plugin-008', 'owasp', 'tool');

-- =============================================================================
-- Plugin Dependencies
-- =============================================================================

INSERT INTO plugin_dependencies (id, plugin_id, dependency_id, dependency_type, version_constraint) VALUES
  ('dep-001', 'plugin-002', 'plugin-008', 'optional', '^1.0.0'),
  ('dep-002', 'plugin-003', 'plugin-007', 'optional', '>=0.8.0'),
  ('dep-003', 'plugin-004', 'plugin-005', 'optional', '^1.0.0');

-- =============================================================================
-- Skills
-- =============================================================================

INSERT INTO skills (id, plugin_id, name, description, file_path, instructions, created_at) VALUES
  (
    'skill-001',
    'plugin-001',
    'git-workflow',
    'Comprehensive git workflow management with branch-based development',
    '.claude/skills/git/instructions.md',
    'Enforces branch-based workflow with conventional commits, frequent commits every 20-30 minutes, and GitHub CLI integration for PR management.',
    '2025-01-10T00:00:00Z'
  ),
  (
    'skill-002',
    'plugin-006',
    'database-design',
    'Visual database schema design and migration generation',
    '.claude/skills/database/instructions.md',
    'Interactive schema design with automatic migration generation for multiple database engines.',
    '2025-06-01T00:00:00Z'
  );

-- =============================================================================
-- Agents
-- =============================================================================

INSERT INTO agents (id, plugin_id, name, description, role, expertise, tools, instructions, created_at) VALUES
  (
    'agent-001',
    'plugin-002',
    'code-reviewer',
    'Systematic code review agent with comprehensive analysis',
    'Code Review Specialist',
    '["code-quality", "security", "performance", "architecture"]',
    '["static-analysis", "security-scanner", "performance-profiler"]',
    'Performs multi-step code review covering quality, security, performance, and architecture with actionable recommendations.',
    '2025-02-20T00:00:00Z'
  ),
  (
    'agent-002',
    'plugin-008',
    'security-analyst',
    'Security vulnerability analysis and remediation',
    'Security Specialist',
    '["vulnerability-scanning", "dependency-analysis", "threat-modeling"]',
    '["security-scanner", "dependency-checker", "owasp-analyzer"]',
    'Identifies security vulnerabilities, insecure dependencies, and potential security issues with remediation guidance.',
    '2025-08-01T00:00:00Z'
  );

-- =============================================================================
-- Commands
-- =============================================================================

INSERT INTO commands (id, plugin_id, name, description, file_path, handler, parameters, examples, created_at) VALUES
  (
    'cmd-001',
    'plugin-004',
    'generate-docs',
    'Generate comprehensive documentation from codebase',
    '.claude/commands/generate-docs.md',
    'generateDocs',
    '[{"name": "output", "type": "string", "description": "Output directory for generated docs", "required": false, "default": "./docs"}]',
    '[{"description": "Generate docs in default location", "command": "/generate-docs"}, {"description": "Generate docs in custom location", "command": "/generate-docs --output ./documentation"}]',
    '2025-04-01T00:00:00Z'
  ),
  (
    'cmd-002',
    'plugin-003',
    'run-e2e-tests',
    'Execute end-to-end tests with Playwright',
    '.claude/commands/run-e2e-tests.md',
    'runE2ETests',
    '[{"name": "browser", "type": "string", "description": "Browser to test (chrome, firefox, safari, edge)", "required": false, "default": "chrome"}, {"name": "headless", "type": "boolean", "description": "Run in headless mode", "required": false, "default": true}]',
    '[{"description": "Run tests in Chrome headless", "command": "/run-e2e-tests"}, {"description": "Run tests in Firefox with UI", "command": "/run-e2e-tests --browser firefox --headless false"}]',
    '2025-03-10T00:00:00Z'
  );

-- =============================================================================
-- MCP Servers
-- =============================================================================

INSERT INTO mcp_servers (id, plugin_id, name, description, transport, command, config, capabilities, created_at) VALUES
  (
    'mcp-001',
    'plugin-003',
    'playwright-server',
    'Playwright browser automation MCP server',
    'stdio',
    'npx @skillstash/playwright-mcp',
    '{"browsers": ["chromium", "firefox", "webkit"], "timeout": 30000}',
    '["tools", "resources"]',
    '2025-03-10T00:00:00Z'
  ),
  (
    'mcp-002',
    'plugin-007',
    'performance-monitor-server',
    'Real-time performance monitoring MCP server',
    'http',
    NULL,
    '{"port": 3000, "metrics": ["cpu", "memory", "network"]}',
    '["tools", "resources", "prompts"]',
    '2025-07-10T00:00:00Z'
  );

-- =============================================================================
-- Download Stats
-- =============================================================================

INSERT INTO download_stats (id, plugin_id, date, download_count, unique_users, source) VALUES
  -- git-workflow stats (last 7 days)
  ('stat-001', 'plugin-001', '2025-10-18', 245, 180, 'cli'),
  ('stat-002', 'plugin-001', '2025-10-18', 85, 65, 'web'),
  ('stat-003', 'plugin-001', '2025-10-17', 220, 165, 'cli'),
  ('stat-004', 'plugin-001', '2025-10-16', 210, 158, 'cli'),
  ('stat-005', 'plugin-001', '2025-10-15', 195, 145, 'cli'),

  -- code-review-agent stats (last 7 days)
  ('stat-006', 'plugin-002', '2025-10-18', 180, 125, 'cli'),
  ('stat-007', 'plugin-002', '2025-10-18', 60, 45, 'web'),
  ('stat-008', 'plugin-002', '2025-10-17', 165, 110, 'cli'),
  ('stat-009', 'plugin-002', '2025-10-16', 170, 115, 'cli'),

  -- playwright-testing stats (last 7 days)
  ('stat-010', 'plugin-003', '2025-10-18', 120, 85, 'cli'),
  ('stat-011', 'plugin-003', '2025-10-17', 110, 78, 'cli'),
  ('stat-012', 'plugin-003', '2025-10-16', 105, 72, 'cli'),

  -- security-scanner stats (last 7 days)
  ('stat-013', 'plugin-008', '2025-10-18', 210, 145, 'cli'),
  ('stat-014', 'plugin-008', '2025-10-18', 95, 68, 'web'),
  ('stat-015', 'plugin-008', '2025-10-17', 200, 138, 'cli'),
  ('stat-016', 'plugin-008', '2025-10-16', 195, 132, 'cli');
