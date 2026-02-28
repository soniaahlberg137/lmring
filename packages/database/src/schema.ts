import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  uniqueIndex,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  unique,
  uuid,
  type PgColumn,
} from 'drizzle-orm/pg-core';

// Model abilities JSON
export interface ModelAbilitiesJson {
  files?: boolean;
  functionCall?: boolean;
  imageOutput?: boolean;
  reasoning?: boolean;
  search?: boolean;
  structuredOutput?: boolean;
  video?: boolean;
  vision?: boolean;
}

// Response attachments
export interface ResponseAttachment {
  type: 'image' | 'audio' | 'video';
  key: string;
  mimeType: string;
  filename?: string;
  sizeBytes?: number;
  url?: string; // External URL for resources not stored in our storage (e.g., video URLs)
}

// Message attachments (user-uploaded files)
export interface MessageAttachment {
  type: 'image' | 'audio' | 'video' | 'file';
  fileId: string;
  mimeType: string;
  filename?: string;
  sizeBytes?: number;
}

// Enums
export const configSourceEnum = pgEnum('config_source', ['manual', 'cherry-studio', 'newapi']);
export const roleEnum = pgEnum('message_role', ['user', 'assistant', 'system']);
export const userRoleEnum = pgEnum('user_role', ['admin', 'user']);

// Comparison voting enums
export const comparisonTypeEnum = pgEnum('comparison_type', [
  'text',
  'image_gen',
  'video_gen',
  'tts',
  'stt',
]);
export const voteOutcomeEnum = pgEnum('vote_outcome', [
  'winner',
  'loser',
  'tie',
  'all_bad',
]);
export const userStatusEnum = pgEnum('user_status', ['active', 'disabled', 'pending']);

// WebDev enums
export const webdevStatusEnum = pgEnum('webdev_status', [
  'generating',
  'building',
  'ready',
  'error',
  'expired',
]);

// Users table
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull().unique(),
    emailVerified: boolean('email_verified').notNull().default(false),

    fullName: text('full_name').notNull(),
    username: text('username').unique(),
    avatarUrl: text('avatar_url'),

    role: userRoleEnum('role').default('user').notNull(),
    status: userStatusEnum('status').default('active').notNull(),

    githubId: text('github_id').unique(),
    googleId: text('google_id').unique(),
    linuxdoId: text('linuxdo_id').unique(),

    inviterId: uuid('inviter_id').references((): PgColumn => users.id),

    deletedAt: timestamp('deleted_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('users_email_idx').on(table.email),
    index('users_inviter_id_idx').on(table.inviterId),
    index('users_deleted_at_idx').on(table.deletedAt),
  ],
);

// User preferences
export const userPreferences = pgTable(
  'user_preferences',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull()
      .unique(),
    theme: text('theme').default('system'),
    language: text('language').default('en'),
    defaultModels: jsonb('default_models').$type<string[]>(),
    configSource: configSourceEnum('config_source').default('manual'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('user_preferences_user_id_idx').on(table.userId),
  ],
);

// API Keys
export const apiKeys = pgTable(
  'api_keys',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    providerName: text('provider_name').notNull(),
    encryptedKey: text('encrypted_key'),
    proxyUrl: text('proxy_url'),
    enabled: boolean('enabled').default(false).notNull(),
    configSource: configSourceEnum('config_source').default('manual'),
    isCustom: boolean('is_custom').default(false).notNull(),
    providerType: text('provider_type'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('api_keys_user_id_idx').on(table.userId),
    unique('api_keys_user_provider_unique').on(table.userId, table.providerName),
  ],
);

// User enabled models
export const userEnabledModels = pgTable(
  'user_enabled_models',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    apiKeyId: uuid('api_key_id')
      .references(() => apiKeys.id, { onDelete: 'cascade' })
      .notNull(),
    modelId: text('model_id').notNull(),
    enabled: boolean('enabled').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('user_enabled_models_user_id_idx').on(table.userId),
    index('user_enabled_models_api_key_id_idx').on(table.apiKeyId),
    unique('user_enabled_models_api_key_model_unique').on(table.apiKeyId, table.modelId),
  ],
);

export const userCustomModels = pgTable(
  'user_custom_models',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    apiKeyId: uuid('api_key_id')
      .references(() => apiKeys.id, { onDelete: 'cascade' })
      .notNull(),
    modelId: text('model_id').notNull(),
    displayName: text('display_name'),
    groupName: text('group_name'),
    abilities: jsonb('abilities').$type<ModelAbilitiesJson>(),
    supportsStreaming: boolean('supports_streaming'),
    priceCurrency: text('price_currency'),
    inputPrice: real('input_price'),
    outputPrice: real('output_price'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('user_custom_models_user_id_idx').on(table.userId),
    index('user_custom_models_api_key_id_idx').on(table.apiKeyId),
    unique('user_custom_models_api_key_model_unique').on(table.apiKeyId, table.modelId),
  ],
);

// User model overrides
export const userModelOverrides = pgTable(
  'user_model_overrides',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    apiKeyId: uuid('api_key_id')
      .references(() => apiKeys.id, { onDelete: 'cascade' })
      .notNull(),
    modelId: text('model_id').notNull(),
    displayName: text('display_name'),
    groupName: text('group_name'),
    abilities: jsonb('abilities').$type<ModelAbilitiesJson>(),
    supportsStreaming: boolean('supports_streaming'),
    priceCurrency: text('price_currency'),
    inputPrice: real('input_price'),
    outputPrice: real('output_price'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('user_model_overrides_user_id_idx').on(table.userId),
    index('user_model_overrides_api_key_id_idx').on(table.apiKeyId),
    unique('user_model_overrides_api_key_model_unique').on(table.apiKeyId, table.modelId),
  ],
);

// Conversations
export const conversations = pgTable(
  'conversations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    title: text('title').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('conversations_user_id_idx').on(table.userId),
  ],
);

// Messages
export const messages = pgTable(
  'messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    conversationId: uuid('conversation_id')
      .references(() => conversations.id, { onDelete: 'cascade' })
      .notNull(),
    role: roleEnum('role').notNull(),
    content: text('content').notNull(),
    attachments: jsonb('attachments').$type<MessageAttachment[]>(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('messages_conversation_id_idx').on(table.conversationId),
  ],
);

// Model responses
export const modelResponses = pgTable(
  'model_responses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    messageId: uuid('message_id')
      .references(() => messages.id, { onDelete: 'cascade' })
      .notNull(),
    modelName: text('model_name').notNull(),
    providerName: text('provider_name').notNull(),
    responseContent: text('response_content').notNull(),
    attachments: jsonb('attachments').$type<ResponseAttachment[]>(),
    tokensUsed: integer('tokens_used'),
    responseTimeMs: integer('response_time_ms'),
    displayPosition: integer('display_position').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('model_responses_message_id_idx').on(table.messageId),
  ],
);

// Comparison votes
export const comparisonVotes = pgTable(
  'comparison_votes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    messageId: uuid('message_id')
      .references(() => messages.id, { onDelete: 'cascade' })
      .notNull(),
    comparisonType: comparisonTypeEnum('comparison_type').notNull(),
    votedAt: timestamp('voted_at', { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('comparison_votes_user_id_idx').on(table.userId),
    index('comparison_votes_message_id_idx').on(table.messageId),
    unique('comparison_votes_user_message_unique').on(table.userId, table.messageId),
  ],
);

// Comparison vote results
export const comparisonVoteResults = pgTable(
  'comparison_vote_results',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    comparisonVoteId: uuid('comparison_vote_id')
      .references(() => comparisonVotes.id, { onDelete: 'cascade' })
      .notNull(),
    modelResponseId: uuid('model_response_id')
      .references(() => modelResponses.id, { onDelete: 'cascade' })
      .notNull(),
    modelName: text('model_name').notNull(),
    providerName: text('provider_name').notNull(),
    outcome: voteOutcomeEnum('outcome').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('comparison_vote_results_vote_id_idx').on(table.comparisonVoteId),
    index('comparison_vote_results_model_response_id_idx').on(table.modelResponseId),
    unique('comparison_vote_results_vote_response_unique').on(
      table.comparisonVoteId,
      table.modelResponseId,
    ),
  ],
);

// Model comparison stats
export const modelComparisonStats = pgTable(
  'model_comparison_stats',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    modelName: text('model_name').notNull(),
    providerName: text('provider_name').notNull(),
    comparisonType: comparisonTypeEnum('comparison_type').notNull(),
    totalComparisons: integer('total_comparisons').default(0).notNull(),
    wins: integer('wins').default(0).notNull(),
    losses: integer('losses').default(0).notNull(),
    ties: integer('ties').default(0).notNull(),
    allBadCount: integer('all_bad_count').default(0).notNull(),
    eloRating: real('elo_rating').default(1500).notNull(),
    winRate: real('win_rate').default(0).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('model_comparison_stats_elo_idx').on(table.eloRating),
    index('model_comparison_stats_type_idx').on(table.comparisonType),
    unique('model_comparison_stats_unique').on(
      table.modelName,
      table.providerName,
      table.comparisonType,
    ),
  ],
);

// Files
export const files = pgTable(
  'files',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    filename: text('filename').notNull(),
    mimeType: text('mime_type').notNull(),
    storagePath: text('storage_path').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('files_user_id_idx').on(table.userId),
  ],
);

// Shared results
export const sharedResults = pgTable(
  'shared_results',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    conversationId: uuid('conversation_id')
      .references(() => conversations.id, { onDelete: 'cascade' })
      .notNull(),
    shareToken: text('share_token').notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
  },
  (table) => [
    index('shared_results_share_token_idx').on(table.shareToken),
    index('shared_results_conversation_id_idx').on(table.conversationId),
  ],
);

// WebDev sessions
export const webdevSessions = pgTable(
  'webdev_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    conversationId: uuid('conversation_id')
      .references(() => conversations.id, { onDelete: 'set null' }),
    prompt: text('prompt').notNull(),
    status: webdevStatusEnum('status').default('generating').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('webdev_sessions_user_id_idx').on(table.userId),
    index('webdev_sessions_conversation_id_idx').on(table.conversationId),
  ],
);

// WebDev responses (one per model per session)
export const webdevResponses = pgTable(
  'webdev_responses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
      .references(() => webdevSessions.id, { onDelete: 'cascade' })
      .notNull(),
    modelId: text('model_id').notNull(),
    keyId: uuid('key_id').notNull(),
    iterationId: uuid('iteration_id').references(() => webdevIterations.id, { onDelete: 'set null' }),
    status: webdevStatusEnum('status').default('generating').notNull(),
    files: jsonb('files').$type<Record<string, string>>(),
    sandboxId: text('sandbox_id'),
    previewUrl: text('preview_url'),
    generatedCode: text('generated_code'),
    error: text('error'),
    tokensUsed: integer('tokens_used'),
    responseTimeMs: integer('response_time_ms'),
    displayPosition: integer('display_position').default(0).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    snapshotId: text('snapshot_id'),
    snapshotExpiresAt: timestamp('snapshot_expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('webdev_responses_session_id_idx').on(table.sessionId),
    index('webdev_responses_sandbox_id_idx').on(table.sandboxId),
    index('webdev_responses_snapshot_id_idx').on(table.snapshotId),
  ],
);

// WebDev iterations (prompt history within a session for refine/iterate)
export const webdevIterations = pgTable(
  'webdev_iterations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
      .references(() => webdevSessions.id, { onDelete: 'cascade' })
      .notNull(),
    prompt: text('prompt').notNull(),
    version: integer('version').default(1).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('webdev_iterations_session_id_idx').on(table.sessionId),
    uniqueIndex('webdev_iterations_session_version_idx').on(table.sessionId, table.version),
  ],
);

// Session table
export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    token: text('token').notNull().unique(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('session_user_id_idx').on(table.userId),
  ],
);

// Account table
export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    accessToken: text('access_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
    refreshToken: text('refresh_token'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
    idToken: text('id_token'),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('account_user_id_idx').on(table.userId),
    unique('account_provider_account_unique').on(
      table.providerId,
      table.accountId,
    ),
  ],
);

// Verification table
export const verification = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('verification_identifier_idx').on(table.identifier),
  ],
);

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  preferences: one(userPreferences),
  apiKeys: many(apiKeys),
  enabledModels: many(userEnabledModels),
  customModels: many(userCustomModels),
  modelOverrides: many(userModelOverrides),
  conversations: many(conversations),
  comparisonVotes: many(comparisonVotes),
  files: many(files),
  sessions: many(session),
  accounts: many(account),
  webdevSessions: many(webdevSessions),
}));

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id],
  }),
}));

export const apiKeysRelations = relations(apiKeys, ({ one, many }) => ({
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
  enabledModels: many(userEnabledModels),
  customModels: many(userCustomModels),
  modelOverrides: many(userModelOverrides),
}));

export const userEnabledModelsRelations = relations(userEnabledModels, ({ one }) => ({
  user: one(users, {
    fields: [userEnabledModels.userId],
    references: [users.id],
  }),
  apiKey: one(apiKeys, {
    fields: [userEnabledModels.apiKeyId],
    references: [apiKeys.id],
  }),
}));

export const userCustomModelsRelations = relations(userCustomModels, ({ one }) => ({
  user: one(users, {
    fields: [userCustomModels.userId],
    references: [users.id],
  }),
  apiKey: one(apiKeys, {
    fields: [userCustomModels.apiKeyId],
    references: [apiKeys.id],
  }),
}));

export const userModelOverridesRelations = relations(userModelOverrides, ({ one }) => ({
  user: one(users, {
    fields: [userModelOverrides.userId],
    references: [users.id],
  }),
  apiKey: one(apiKeys, {
    fields: [userModelOverrides.apiKeyId],
    references: [apiKeys.id],
  }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  user: one(users, {
    fields: [conversations.userId],
    references: [users.id],
  }),
  messages: many(messages),
  sharedResults: many(sharedResults),
  webdevSessions: many(webdevSessions),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  modelResponses: many(modelResponses),
  comparisonVotes: many(comparisonVotes),
}));

export const modelResponsesRelations = relations(modelResponses, ({ one, many }) => ({
  message: one(messages, {
    fields: [modelResponses.messageId],
    references: [messages.id],
  }),
  comparisonVoteResults: many(comparisonVoteResults),
}));

export const comparisonVotesRelations = relations(comparisonVotes, ({ one, many }) => ({
  user: one(users, {
    fields: [comparisonVotes.userId],
    references: [users.id],
  }),
  message: one(messages, {
    fields: [comparisonVotes.messageId],
    references: [messages.id],
  }),
  results: many(comparisonVoteResults),
}));

export const comparisonVoteResultsRelations = relations(comparisonVoteResults, ({ one }) => ({
  comparisonVote: one(comparisonVotes, {
    fields: [comparisonVoteResults.comparisonVoteId],
    references: [comparisonVotes.id],
  }),
  modelResponse: one(modelResponses, {
    fields: [comparisonVoteResults.modelResponseId],
    references: [modelResponses.id],
  }),
}));

export const sharedResultsRelations = relations(sharedResults, ({ one }) => ({
  conversation: one(conversations, {
    fields: [sharedResults.conversationId],
    references: [conversations.id],
  }),
}));

export const webdevSessionsRelations = relations(webdevSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [webdevSessions.userId],
    references: [users.id],
  }),
  conversation: one(conversations, {
    fields: [webdevSessions.conversationId],
    references: [conversations.id],
  }),
  responses: many(webdevResponses),
  iterations: many(webdevIterations),
}));

export const webdevResponsesRelations = relations(webdevResponses, ({ one }) => ({
  session: one(webdevSessions, {
    fields: [webdevResponses.sessionId],
    references: [webdevSessions.id],
  }),
  iteration: one(webdevIterations, {
    fields: [webdevResponses.iterationId],
    references: [webdevIterations.id],
  }),
}));

export const webdevIterationsRelations = relations(webdevIterations, ({ one, many }) => ({
  session: one(webdevSessions, {
    fields: [webdevIterations.sessionId],
    references: [webdevSessions.id],
  }),
  responses: many(webdevResponses),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(users, {
    fields: [session.userId],
    references: [users.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(users, {
    fields: [account.userId],
    references: [users.id],
  }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type NewUserPreferences = typeof userPreferences.$inferInsert;
export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type ModelResponse = typeof modelResponses.$inferSelect;
export type NewModelResponse = typeof modelResponses.$inferInsert;
export type File = typeof files.$inferSelect;
export type NewFile = typeof files.$inferInsert;
export type SharedResult = typeof sharedResults.$inferSelect;
export type NewSharedResult = typeof sharedResults.$inferInsert;
export type Session = typeof session.$inferSelect;
export type NewSession = typeof session.$inferInsert;
export type Account = typeof account.$inferSelect;
export type NewAccount = typeof account.$inferInsert;
export type Verification = typeof verification.$inferSelect;
export type NewVerification = typeof verification.$inferInsert;
export type UserEnabledModel = typeof userEnabledModels.$inferSelect;
export type NewUserEnabledModel = typeof userEnabledModels.$inferInsert;
export type UserCustomModel = typeof userCustomModels.$inferSelect;
export type NewUserCustomModel = typeof userCustomModels.$inferInsert;
export type UserModelOverride = typeof userModelOverrides.$inferSelect;
export type NewUserModelOverride = typeof userModelOverrides.$inferInsert;
export type ComparisonVote = typeof comparisonVotes.$inferSelect;
export type NewComparisonVote = typeof comparisonVotes.$inferInsert;
export type ComparisonVoteResult = typeof comparisonVoteResults.$inferSelect;
export type NewComparisonVoteResult = typeof comparisonVoteResults.$inferInsert;
export type ModelComparisonStat = typeof modelComparisonStats.$inferSelect;
export type NewModelComparisonStat = typeof modelComparisonStats.$inferInsert;
export type WebDevSession = typeof webdevSessions.$inferSelect;
export type NewWebDevSession = typeof webdevSessions.$inferInsert;
export type WebDevResponse = typeof webdevResponses.$inferSelect;
export type NewWebDevResponse = typeof webdevResponses.$inferInsert;
export type WebDevIteration = typeof webdevIterations.$inferSelect;
export type NewWebDevIteration = typeof webdevIterations.$inferInsert;

// Enum types
export type ComparisonType = (typeof comparisonTypeEnum.enumValues)[number];
export type VoteOutcome = (typeof voteOutcomeEnum.enumValues)[number];
export type WebDevStatus = (typeof webdevStatusEnum.enumValues)[number];
