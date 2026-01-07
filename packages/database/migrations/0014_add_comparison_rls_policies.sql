-- Enable RLS policies for comparison tables

-- 1. comparison_votes (Direct ownership - has user_id)
ALTER TABLE "comparison_votes" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comparison_votes_select_own"
ON "comparison_votes" FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = "user_id");

CREATE POLICY "comparison_votes_insert_own"
ON "comparison_votes" FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = "user_id");

CREATE POLICY "comparison_votes_update_own"
ON "comparison_votes" FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = "user_id")
WITH CHECK ((SELECT auth.uid()) = "user_id");

CREATE POLICY "comparison_votes_delete_own"
ON "comparison_votes" FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = "user_id");

-- 2. comparison_vote_results (Indirect ownership via comparison_votes)
ALTER TABLE "comparison_vote_results" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comparison_vote_results_select_own"
ON "comparison_vote_results" FOR SELECT
TO authenticated
USING (
  "comparison_vote_id" IN (
    SELECT "id" FROM "comparison_votes" WHERE "user_id" = (SELECT auth.uid())
  )
);

CREATE POLICY "comparison_vote_results_insert_own"
ON "comparison_vote_results" FOR INSERT
TO authenticated
WITH CHECK (
  "comparison_vote_id" IN (
    SELECT "id" FROM "comparison_votes" WHERE "user_id" = (SELECT auth.uid())
  )
);

CREATE POLICY "comparison_vote_results_update_own"
ON "comparison_vote_results" FOR UPDATE
TO authenticated
USING (
  "comparison_vote_id" IN (
    SELECT "id" FROM "comparison_votes" WHERE "user_id" = (SELECT auth.uid())
  )
)
WITH CHECK (
  "comparison_vote_id" IN (
    SELECT "id" FROM "comparison_votes" WHERE "user_id" = (SELECT auth.uid())
  )
);

CREATE POLICY "comparison_vote_results_delete_own"
ON "comparison_vote_results" FOR DELETE
TO authenticated
USING (
  "comparison_vote_id" IN (
    SELECT "id" FROM "comparison_votes" WHERE "user_id" = (SELECT auth.uid())
  )
);

-- 3. model_comparison_stats (Public read-only - aggregate data)
ALTER TABLE "model_comparison_stats" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "model_comparison_stats_select_all"
ON "model_comparison_stats" FOR SELECT
TO authenticated
USING (true);
