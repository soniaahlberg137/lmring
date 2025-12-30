-- Enable RLS policies for Supabase

-- 1. User private data tables

-- user_preferences
ALTER TABLE "user_preferences" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_preferences_select_own"
ON "user_preferences" FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = "user_id");

CREATE POLICY "user_preferences_insert_own"
ON "user_preferences" FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = "user_id");

CREATE POLICY "user_preferences_update_own"
ON "user_preferences" FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = "user_id")
WITH CHECK ((SELECT auth.uid()) = "user_id");

CREATE POLICY "user_preferences_delete_own"
ON "user_preferences" FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = "user_id");

-- api_keys
ALTER TABLE "api_keys" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "api_keys_select_own"
ON "api_keys" FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = "user_id");

CREATE POLICY "api_keys_insert_own"
ON "api_keys" FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = "user_id");

CREATE POLICY "api_keys_update_own"
ON "api_keys" FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = "user_id")
WITH CHECK ((SELECT auth.uid()) = "user_id");

CREATE POLICY "api_keys_delete_own"
ON "api_keys" FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = "user_id");

-- user_enabled_models
ALTER TABLE "user_enabled_models" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_enabled_models_select_own"
ON "user_enabled_models" FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = "user_id");

CREATE POLICY "user_enabled_models_insert_own"
ON "user_enabled_models" FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = "user_id");

CREATE POLICY "user_enabled_models_update_own"
ON "user_enabled_models" FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = "user_id")
WITH CHECK ((SELECT auth.uid()) = "user_id");

CREATE POLICY "user_enabled_models_delete_own"
ON "user_enabled_models" FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = "user_id");

-- user_custom_models
ALTER TABLE "user_custom_models" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_custom_models_select_own"
ON "user_custom_models" FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = "user_id");

CREATE POLICY "user_custom_models_insert_own"
ON "user_custom_models" FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = "user_id");

CREATE POLICY "user_custom_models_update_own"
ON "user_custom_models" FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = "user_id")
WITH CHECK ((SELECT auth.uid()) = "user_id");

CREATE POLICY "user_custom_models_delete_own"
ON "user_custom_models" FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = "user_id");

-- user_model_overrides
ALTER TABLE "user_model_overrides" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_model_overrides_select_own"
ON "user_model_overrides" FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = "user_id");

CREATE POLICY "user_model_overrides_insert_own"
ON "user_model_overrides" FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = "user_id");

CREATE POLICY "user_model_overrides_update_own"
ON "user_model_overrides" FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = "user_id")
WITH CHECK ((SELECT auth.uid()) = "user_id");

CREATE POLICY "user_model_overrides_delete_own"
ON "user_model_overrides" FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = "user_id");

-- conversations
ALTER TABLE "conversations" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversations_select_own"
ON "conversations" FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = "user_id");

CREATE POLICY "conversations_insert_own"
ON "conversations" FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = "user_id");

CREATE POLICY "conversations_update_own"
ON "conversations" FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = "user_id")
WITH CHECK ((SELECT auth.uid()) = "user_id");

CREATE POLICY "conversations_delete_own"
ON "conversations" FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = "user_id");

-- user_votes
ALTER TABLE "user_votes" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_votes_select_own"
ON "user_votes" FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = "user_id");

CREATE POLICY "user_votes_insert_own"
ON "user_votes" FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = "user_id");

CREATE POLICY "user_votes_update_own"
ON "user_votes" FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = "user_id")
WITH CHECK ((SELECT auth.uid()) = "user_id");

CREATE POLICY "user_votes_delete_own"
ON "user_votes" FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = "user_id");

-- files
ALTER TABLE "files" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "files_select_own"
ON "files" FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = "user_id");

CREATE POLICY "files_insert_own"
ON "files" FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = "user_id");

CREATE POLICY "files_update_own"
ON "files" FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = "user_id")
WITH CHECK ((SELECT auth.uid()) = "user_id");

CREATE POLICY "files_delete_own"
ON "files" FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = "user_id");

-- 2. Indirectly related tables

-- messages
ALTER TABLE "messages" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_select_own_conversations"
ON "messages" FOR SELECT
TO authenticated
USING (
  "conversation_id" IN (
    SELECT "id" FROM "conversations" WHERE "user_id" = (SELECT auth.uid())
  )
);

CREATE POLICY "messages_insert_own_conversations"
ON "messages" FOR INSERT
TO authenticated
WITH CHECK (
  "conversation_id" IN (
    SELECT "id" FROM "conversations" WHERE "user_id" = (SELECT auth.uid())
  )
);

CREATE POLICY "messages_update_own_conversations"
ON "messages" FOR UPDATE
TO authenticated
USING (
  "conversation_id" IN (
    SELECT "id" FROM "conversations" WHERE "user_id" = (SELECT auth.uid())
  )
)
WITH CHECK (
  "conversation_id" IN (
    SELECT "id" FROM "conversations" WHERE "user_id" = (SELECT auth.uid())
  )
);

CREATE POLICY "messages_delete_own_conversations"
ON "messages" FOR DELETE
TO authenticated
USING (
  "conversation_id" IN (
    SELECT "id" FROM "conversations" WHERE "user_id" = (SELECT auth.uid())
  )
);

-- model_responses
ALTER TABLE "model_responses" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "model_responses_select_own_conversations"
ON "model_responses" FOR SELECT
TO authenticated
USING (
  "message_id" IN (
    SELECT m."id" FROM "messages" m
    JOIN "conversations" c ON m."conversation_id" = c."id"
    WHERE c."user_id" = (SELECT auth.uid())
  )
);

CREATE POLICY "model_responses_insert_own_conversations"
ON "model_responses" FOR INSERT
TO authenticated
WITH CHECK (
  "message_id" IN (
    SELECT m."id" FROM "messages" m
    JOIN "conversations" c ON m."conversation_id" = c."id"
    WHERE c."user_id" = (SELECT auth.uid())
  )
);

CREATE POLICY "model_responses_update_own_conversations"
ON "model_responses" FOR UPDATE
TO authenticated
USING (
  "message_id" IN (
    SELECT m."id" FROM "messages" m
    JOIN "conversations" c ON m."conversation_id" = c."id"
    WHERE c."user_id" = (SELECT auth.uid())
  )
)
WITH CHECK (
  "message_id" IN (
    SELECT m."id" FROM "messages" m
    JOIN "conversations" c ON m."conversation_id" = c."id"
    WHERE c."user_id" = (SELECT auth.uid())
  )
);

CREATE POLICY "model_responses_delete_own_conversations"
ON "model_responses" FOR DELETE
TO authenticated
USING (
  "message_id" IN (
    SELECT m."id" FROM "messages" m
    JOIN "conversations" c ON m."conversation_id" = c."id"
    WHERE c."user_id" = (SELECT auth.uid())
  )
);

-- 3. Public read-only tables

-- model_rankings
ALTER TABLE "model_rankings" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "model_rankings_select_all"
ON "model_rankings" FOR SELECT
TO authenticated
USING (true);

-- 4. Shared data tables

-- shared_results
ALTER TABLE "shared_results" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shared_results_select_own_conversations"
ON "shared_results" FOR SELECT
TO authenticated
USING (
  "conversation_id" IN (
    SELECT "id" FROM "conversations" WHERE "user_id" = (SELECT auth.uid())
  )
);

CREATE POLICY "shared_results_insert_own_conversations"
ON "shared_results" FOR INSERT
TO authenticated
WITH CHECK (
  "conversation_id" IN (
    SELECT "id" FROM "conversations" WHERE "user_id" = (SELECT auth.uid())
  )
);

CREATE POLICY "shared_results_delete_own_conversations"
ON "shared_results" FOR DELETE
TO authenticated
USING (
  "conversation_id" IN (
    SELECT "id" FROM "conversations" WHERE "user_id" = (SELECT auth.uid())
  )
);

-- 5. Auth system tables (Better-Auth)

-- users
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own"
ON "users" FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = "id");

-- session
ALTER TABLE "session" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "session_select_own"
ON "session" FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = "user_id");

CREATE POLICY "session_insert_own"
ON "session" FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = "user_id");

CREATE POLICY "session_update_own"
ON "session" FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = "user_id")
WITH CHECK ((SELECT auth.uid()) = "user_id");

CREATE POLICY "session_delete_own"
ON "session" FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = "user_id");

-- account
ALTER TABLE "account" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "account_select_own"
ON "account" FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = "user_id");

CREATE POLICY "account_insert_own"
ON "account" FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = "user_id");

CREATE POLICY "account_update_own"
ON "account" FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = "user_id")
WITH CHECK ((SELECT auth.uid()) = "user_id");

CREATE POLICY "account_delete_own"
ON "account" FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = "user_id");

-- verification
ALTER TABLE "verification" ENABLE ROW LEVEL SECURITY;
