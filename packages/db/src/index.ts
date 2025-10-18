// Export all schemas
export * from './schema';

// Export client
export * from './client';

// Export inferred types from schemas
import {
  plugins,
  pluginVersions,
  pluginTags,
  pluginDependencies,
  skills,
  agents,
  commands,
  mcpServers,
  authors,
  downloadStats
} from './schema';

// Plugin types
export type Plugin = typeof plugins.$inferSelect;
export type NewPlugin = typeof plugins.$inferInsert;

export type PluginVersion = typeof pluginVersions.$inferSelect;
export type NewPluginVersion = typeof pluginVersions.$inferInsert;

export type PluginTag = typeof pluginTags.$inferSelect;
export type NewPluginTag = typeof pluginTags.$inferInsert;

export type PluginDependency = typeof pluginDependencies.$inferSelect;
export type NewPluginDependency = typeof pluginDependencies.$inferInsert;

// Other types
export type Skill = typeof skills.$inferSelect;
export type NewSkill = typeof skills.$inferInsert;

export type Agent = typeof agents.$inferSelect;
export type NewAgent = typeof agents.$inferInsert;

export type Command = typeof commands.$inferSelect;
export type NewCommand = typeof commands.$inferInsert;

export type MCPServer = typeof mcpServers.$inferSelect;
export type NewMCPServer = typeof mcpServers.$inferInsert;

export type Author = typeof authors.$inferSelect;
export type NewAuthor = typeof authors.$inferInsert;

export type DownloadStats = typeof downloadStats.$inferSelect;
export type NewDownloadStats = typeof downloadStats.$inferInsert;
