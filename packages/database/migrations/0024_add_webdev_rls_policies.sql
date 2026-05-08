-- Enable RLS policies for webdev tables and verification
--
-- Architecture Overview:
-- - App connects via DATABASE_URL using the postgres role (BYPASSES RLS)
-- - All webdev API routes use the Drizzle `db` instance with manual user_id checks
-- - RLS here is defense-in-depth: protects against future Supabase Client usage
--   from anon/authenticated roles, and silences Supabase Security Advisor errors
--
-- Strategy:
-- - verification: RLS enabled with NO policies (deny all to anon/authenticated;
--   Better-Auth bypasses via postgres role)
-- - webdev_sessions: direct ownership via user_id
-- - webdev_responses / webdev_iterations: indirect ownership via session_id
--

-- 1. verification (Better-Auth internal table, no user-facing access)
ALTER TABLE "verification" ENABLE ROW LEVEL SECURITY;

-- 2. webdev_sessions (Direct ownership - has user_id)
ALTER TABLE "webdev_sessions" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webdev_sessions_select_own"
ON "webdev_sessions" FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = "user_id");

CREATE POLICY "webdev_sessions_insert_own"
ON "webdev_sessions" FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = "user_id");

CREATE POLICY "webdev_sessions_update_own"
ON "webdev_sessions" FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = "user_id")
WITH CHECK ((SELECT auth.uid()) = "user_id");

CREATE POLICY "webdev_sessions_delete_own"
ON "webdev_sessions" FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = "user_id");

-- 3. webdev_responses (Indirect ownership via webdev_sessions)
ALTER TABLE "webdev_responses" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webdev_responses_select_own"
ON "webdev_responses" FOR SELECT
TO authenticated
USING (
  "session_id" IN (
    SELECT "id" FROM "webdev_sessions" WHERE "user_id" = (SELECT auth.uid())
  )
);

CREATE POLICY "webdev_responses_insert_own"
ON "webdev_responses" FOR INSERT
TO authenticated
WITH CHECK (
  "session_id" IN (
    SELECT "id" FROM "webdev_sessions" WHERE "user_id" = (SELECT auth.uid())
  )
);

CREATE POLICY "webdev_responses_update_own"
ON "webdev_responses" FOR UPDATE
TO authenticated
USING (
  "session_id" IN (
    SELECT "id" FROM "webdev_sessions" WHERE "user_id" = (SELECT auth.uid())
  )
)
WITH CHECK (
  "session_id" IN (
    SELECT "id" FROM "webdev_sessions" WHERE "user_id" = (SELECT auth.uid())
  )
);

CREATE POLICY "webdev_responses_delete_own"
ON "webdev_responses" FOR DELETE
TO authenticated
USING (
  "session_id" IN (
    SELECT "id" FROM "webdev_sessions" WHERE "user_id" = (SELECT auth.uid())
  )
);

-- 4. webdev_iterations (Indirect ownership via webdev_sessions)
ALTER TABLE "webdev_iterations" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webdev_iterations_select_own"
ON "webdev_iterations" FOR SELECT
TO authenticated
USING (
  "session_id" IN (
    SELECT "id" FROM "webdev_sessions" WHERE "user_id" = (SELECT auth.uid())
  )
);

CREATE POLICY "webdev_iterations_insert_own"
ON "webdev_iterations" FOR INSERT
TO authenticated
WITH CHECK (
  "session_id" IN (
    SELECT "id" FROM "webdev_sessions" WHERE "user_id" = (SELECT auth.uid())
  )
);

CREATE POLICY "webdev_iterations_update_own"
ON "webdev_iterations" FOR UPDATE
TO authenticated
USING (
  "session_id" IN (
    SELECT "id" FROM "webdev_sessions" WHERE "user_id" = (SELECT auth.uid())
  )
)
WITH CHECK (
  "session_id" IN (
    SELECT "id" FROM "webdev_sessions" WHERE "user_id" = (SELECT auth.uid())
  )
);

CREATE POLICY "webdev_iterations_delete_own"
ON "webdev_iterations" FOR DELETE
TO authenticated
USING (
  "session_id" IN (
    SELECT "id" FROM "webdev_sessions" WHERE "user_id" = (SELECT auth.uid())
  )
);
