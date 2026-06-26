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

// Theme config persisted for user theme sync
export interface ThemeConfigJson {
  mode: 'light' | 'dark' | 'system';
  seedColor: {
    l: number;
    c: number;
    h: number;
  };
  presetName: string | null;
}

// Agent tools JSON
export interface AgentToolJson {
  name: string;
  type: 'mcp' | 'function' | 'skill';
  // MCP connection (required when type === 'mcp')
  transport?: 'sse' | 'stdio';
  url?: string;      // sse transport: SSE endpoint URL
  command?: string;  // stdio transport: executable to spawn
  args?: string[];   // stdio transport: arguments
  config?: Record<string, unknown>;
}

// Agent memory config JSON
export interface AgentMemoryConfigJson {
  type?: 'none' | 'short_term' | 'long_term' | 'external';
  provider?: string;
  config?: Record<string, unknown>;
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
    themeConfig: jsonb('theme_config').$type<ThemeConfigJson>(),
    language: text('language').default('en'),
    defaultModels: jsonb('default_models').$type<string[]>(),
    configSource: configSourceEnum('config_source').default('manual'),
    todayClearedAt: timestamp('today_cleared_at', { withTimezone: true }),
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
    content: text('content'),
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

// Agent domain enum
export const agentDomainEnum = pgEnum('agent_domain', [
  'coding',
  'customer-support',
  'research',
  'finance',
  'legal',
  'general',
]);

// Benchmark run status enum
export const benchmarkRunStatusEnum = pgEnum('benchmark_run_status', [
  'pending',
  'running',
  'completed',
  'failed',
]);

// Agents
export const agents = pgTable(
  'agents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    description: text('description'),
    baseModel: text('base_model').notNull(),
    domain: agentDomainEnum('domain').default('general').notNull(),
    systemPrompt: text('system_prompt'),
    tools: jsonb('tools').$type<AgentToolJson[]>(),
    memoryConfig: jsonb('memory_config').$type<AgentMemoryConfigJson>(),
    configContent: text('config_content'),
    submittedBy: uuid('submitted_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('agents_submitted_by_idx').on(table.submittedBy),
    index('agents_base_model_idx').on(table.baseModel),
    index('agents_domain_idx').on(table.domain),
  ],
);

// Benchmark runs — one row per (agent, benchmark) run, created when an agent is submitted
export const benchmarkRuns = pgTable(
  'benchmark_runs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    agentId: uuid('agent_id')
      .references(() => agents.id, { onDelete: 'cascade' })
      .notNull(),
    benchmarkName: text('benchmark_name').notNull(),
    status: benchmarkRunStatusEnum('status').default('pending').notNull(),
    halRunId: text('hal_run_id'),
    score: real('score'),
    error: text('error'),
    rawResults: jsonb('raw_results'),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('benchmark_runs_agent_id_idx').on(table.agentId),
    index('benchmark_runs_status_idx').on(table.status),
    index('benchmark_runs_benchmark_name_idx').on(table.benchmarkName),
  ],
);

// ── ZeroEval snapshot tables ──────────────────────────────────────────────────
// One-time snapshot of ZeroEval data (captured 2026-06-24).
// These tables replace the live fetch to api.zeroeval.com entirely.
// Do NOT add gaia_score / tau_bench_score / core_bench_score here — those were
// Tessera-invented fields that were never returned by ZeroEval.

// Canonical LLM base models from GET /leaderboard/models/full?justCanonicals=true
export const zevalBaseModels = pgTable(
  'zeval_base_models',
  {
    // Identity
    modelId: text('model_id').primaryKey(),
    name: text('name').notNull(),
    organization: text('organization').notNull(),
    organizationId: text('organization_id').notNull(),
    organizationCountry: text('organization_country'),

    // Specs — params/trainingTokens use real to handle values > int32 (e.g. 671B params)
    params: real('params'),
    trainingTokens: real('training_tokens'),
    context: integer('context'),
    canonicalModelId: text('canonical_model_id'),
    isMoe: boolean('is_moe'),
    multimodal: boolean('multimodal').notNull().default(false),

    // Dates & meta — text preserves ZeroEval's exact format without timezone coercion
    releaseDate: text('release_date'),
    announcementDate: text('announcement_date').notNull(),
    license: text('license').notNull(),
    knowledgeCutoff: text('knowledge_cutoff'),

    // Pricing / performance
    inputPrice: text('input_price'),
    outputPrice: text('output_price'),
    throughput: text('throughput'),
    latency: text('latency'),

    // Benchmark scores — all 22 real ZeroEval fields, none invented by Tessera
    aime2025Score: real('aime_2025_score'),
    hleScore: real('hle_score'),
    gpqaScore: real('gpqa_score'),
    sweBenchVerifiedScore: real('swe_bench_verified_score'),
    mmmuScore: real('mmmu_score'),
    simpleqaScore: real('simpleqa_score'),
    osworldScore: real('osworld_score'),
    browsecompScore: real('browsecomp_score'),
    toolathlonScore: real('toolathlon_score'),
    terminalBenchScore: real('terminal_bench_score'),
    tauBenchRetailScore: real('tau_bench_retail_score'),
    arcAgiV2Score: real('arc_agi_v2_score'),
    mmmluScore: real('mmmlu_score'),
    charxivRScore: real('charxiv_r_score'),
    mmmuProScore: real('mmmu_pro_score'),
    screenspotProScore: real('screenspot_pro_score'),
    mcpAtlasScore: real('mcp_atlas_score'),
    frontiermathScore: real('frontiermath_score'),
    mrcrV2Score: real('mrcr_v2_score'),
    scicodeScore: real('scicode_score'),
    apexAgentsScore: real('apex_agents_score'),
    sweBenchProScore: real('swe_bench_pro_score'),

    // LLM arena scores — raw values from /magia/models/scores
    // SCALE WARNING: snapshot (2026-06-24) shows values in the ~0–25+ range
    // (e.g. text_to_svg_score=22.65, text_to_game_score=15.69). The legacy
    // calculateCodeArenaScore() assumed a 0–1 input and multiplied by ×100,
    // which would produce values ~100× too large. These are stored raw; the
    // display calculation must be audited before these columns are rendered.
    chatArenaScore: real('chat_arena_score'),
    textToWebsiteScore: real('text_to_website_score'),
    threejsScore: real('threejs_score'),
    textToGameScore: real('text_to_game_score'),
    p5AnimationScore: real('p5_animation_score'),
    textToSvgScore: real('text_to_svg_score'),
    datavizScore: real('dataviz_score'),
    toneJsScore: real('tonejs_score'),

    snapshottedAt: timestamp('snapshotted_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    index('zeval_base_models_org_id_idx').on(table.organizationId),
  ],
);

// Non-LLM arena leaderboard entries from GET /magia/arenas/{arena}/leaderboard
// Covers: text-to-image, image-to-image, text-to-video, image-to-video,
//         video-editing, text-to-speech, speech-to-text
export const zevalArenaEntries = pgTable(
  'zeval_arena_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    arena: text('arena').notNull(),

    // ZeroEval identifiers
    variantId: text('variant_id').notNull(),
    variantKey: text('variant_key').notNull(),
    variantMetadata: jsonb('variant_metadata'),
    modelId: text('model_id').notNull(),
    modelName: text('model_name').notNull(),
    organization: text('organization').notNull(),
    license: text('license'),
    isOpenSource: boolean('is_open_source').notNull().default(false),
    announcementDate: text('announcement_date'),

    // Ratings
    mu: real('mu').notNull(),
    sigma: real('sigma').notNull(),
    conservativeRating: real('conservative_rating').notNull(),
    ratingChange7d: real('rating_change_7d'),

    // Match stats
    matchesPlayed: integer('matches_played').notNull(),
    wins: integer('wins').notNull(),
    winRate: real('win_rate').notNull(),

    // Pricing / performance
    inputPrice: real('input_price'),
    outputPrice: real('output_price'),
    avgGenerationPrice: real('avg_generation_price'),
    pricedGenerations: integer('priced_generations'),
    throughputCps: real('throughput_cps'),
    avgTtfb: real('avg_ttfb'),

    // ZeroEval's own timestamps (text — preserves upstream ISO string exactly)
    zevalCreatedAt: text('zeval_created_at'),
    zevalUpdatedAt: text('zeval_updated_at'),

    snapshottedAt: timestamp('snapshotted_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    index('zeval_arena_entries_arena_idx').on(table.arena),
    index('zeval_arena_entries_model_id_idx').on(table.modelId),
    unique('zeval_arena_entries_arena_variant_unique').on(table.arena, table.variantId),
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
  submittedAgents: many(agents),
}));

export const agentsRelations = relations(agents, ({ one, many }) => ({
  submitter: one(users, {
    fields: [agents.submittedBy],
    references: [users.id],
  }),
  benchmarkRuns: many(benchmarkRuns),
}));

export const benchmarkRunsRelations = relations(benchmarkRuns, ({ one }) => ({
  agent: one(agents, {
    fields: [benchmarkRuns.agentId],
    references: [agents.id],
  }),
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

// ZeroEval snapshot tables
export const zevalArenaEntries = pgTable(
  'zeval_arena_entries',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    arena: text('arena').notNull(),
    variantId: text('variant_id').notNull(),
    variantKey: text('variant_key').notNull(),
    variantMetadata: jsonb('variant_metadata'),
    modelId: text('model_id').notNull(),
    modelName: text('model_name').notNull(),
    organization: text('organization').notNull(),
    license: text('license'),
    isOpenSource: boolean('is_open_source').default(false).notNull(),
    announcementDate: text('announcement_date'),
    mu: real('mu').notNull(),
    sigma: real('sigma').notNull(),
    conservativeRating: real('conservative_rating').notNull(),
    ratingChange7d: real('rating_change_7d'),
    matchesPlayed: integer('matches_played').notNull(),
    wins: integer('wins').notNull(),
    winRate: real('win_rate').notNull(),
    inputPrice: real('input_price'),
    outputPrice: real('output_price'),
    avgGenerationPrice: real('avg_generation_price'),
    pricedGenerations: integer('priced_generations'),
    throughputCps: real('throughput_cps'),
    avgTtfb: real('avg_ttfb'),
    zevalCreatedAt: text('zeval_created_at'),
    zevalUpdatedAt: text('zeval_updated_at'),
    snapshottedAt: timestamp('snapshotted_at', { withTimezone: true }).notNull(),
  },
  (t) => [
    unique('zeval_arena_entries_arena_variant_unique').on(t.arena, t.variantId),
    index('zeval_arena_entries_arena_idx').on(t.arena),
    index('zeval_arena_entries_model_id_idx').on(t.modelId),
  ],
);

export const zevalBaseModels = pgTable(
  'zeval_base_models',
  {
    modelId: text('model_id').primaryKey().notNull(),
    name: text('name').notNull(),
    organization: text('organization').notNull(),
    organizationId: text('organization_id').notNull(),
    organizationCountry: text('organization_country'),
    params: real('params'),
    trainingTokens: real('training_tokens'),
    context: integer('context'),
    canonicalModelId: text('canonical_model_id'),
    isMoe: boolean('is_moe'),
    multimodal: boolean('multimodal').default(false).notNull(),
    releaseDate: text('release_date'),
    announcementDate: text('announcement_date').notNull(),
    license: text('license').notNull(),
    knowledgeCutoff: text('knowledge_cutoff'),
    inputPrice: text('input_price'),
    outputPrice: text('output_price'),
    throughput: text('throughput'),
    latency: text('latency'),
    aime2025Score: real('aime_2025_score'),
    hleScore: real('hle_score'),
    gpqaScore: real('gpqa_score'),
    sweBenchVerifiedScore: real('swe_bench_verified_score'),
    mmmuScore: real('mmmu_score'),
    simpleqaScore: real('simpleqa_score'),
    osworldScore: real('osworld_score'),
    browsecompScore: real('browsecomp_score'),
    toolathlonScore: real('toolathlon_score'),
    terminalBenchScore: real('terminal_bench_score'),
    tauBenchRetailScore: real('tau_bench_retail_score'),
    arcAgiV2Score: real('arc_agi_v2_score'),
    mmmluScore: real('mmmlu_score'),
    charxivRScore: real('charxiv_r_score'),
    mmmuProScore: real('mmmu_pro_score'),
    screenspotProScore: real('screenspot_pro_score'),
    mcpAtlasScore: real('mcp_atlas_score'),
    frontiermathScore: real('frontiermath_score'),
    mrcrV2Score: real('mrcr_v2_score'),
    scicodeScore: real('scicode_score'),
    apexAgentsScore: real('apex_agents_score'),
    sweBenchProScore: real('swe_bench_pro_score'),
    chatArenaScore: real('chat_arena_score'),
    textToWebsiteScore: real('text_to_website_score'),
    threejsScore: real('threejs_score'),
    textToGameScore: real('text_to_game_score'),
    p5AnimationScore: real('p5_animation_score'),
    textToSvgScore: real('text_to_svg_score'),
    datavizScore: real('dataviz_score'),
    toneJsScore: real('tonejs_score'),
    snapshottedAt: timestamp('snapshotted_at', { withTimezone: true }).notNull(),
  },
  (t) => [
    index('zeval_base_models_org_id_idx').on(t.organizationId),
  ],
);

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
export type Agent = typeof agents.$inferSelect;
export type NewAgent = typeof agents.$inferInsert;
export type BenchmarkRun = typeof benchmarkRuns.$inferSelect;
export type NewBenchmarkRun = typeof benchmarkRuns.$inferInsert;
export type BenchmarkRunStatus = (typeof benchmarkRunStatusEnum.enumValues)[number];
export type ZevalArenaEntry = typeof zevalArenaEntries.$inferSelect;
export type NewZevalArenaEntry = typeof zevalArenaEntries.$inferInsert;
export type ZevalBaseModel = typeof zevalBaseModels.$inferSelect;
export type NewZevalBaseModel = typeof zevalBaseModels.$inferInsert;

// Enum types
export type ComparisonType = (typeof comparisonTypeEnum.enumValues)[number];
export type VoteOutcome = (typeof voteOutcomeEnum.enumValues)[number];
export type WebDevStatus = (typeof webdevStatusEnum.enumValues)[number];
