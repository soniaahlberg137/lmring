import { and, db, desc, eq, inArray } from '@lmring/database';
import { agents, benchmarkRuns } from '@lmring/database/schema';
import { NextResponse } from 'next/server';
import { logError } from '@/libs/error-logging';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') ?? 'models';

    if (type === 'agents') {
      const agentRows = await db.select().from(agents).orderBy(desc(agents.createdAt)).limit(100);

      if (agentRows.length === 0) {
        return NextResponse.json({ data: [], total_count: 0 });
      }

      const agentIds = agentRows.map((a) => a.id);

      // Maps HAL benchmark name → leaderboard score field
      const BENCHMARK_TO_SCORE_FIELD: Record<string, string> = {
        gaia: 'gaia_score',
        mmlu: 'mmlu_score',
        pubmedqa: 'pubmedqa_score',
        swebench_verified: 'swe_bench_verified_score',
        swebench_verified_mini: 'swe_bench_verified_score',
        taubench_retail: 'tau_bench_score',
        taubench_airline: 'tau_bench_score',
        corebench_easy: 'core_bench_score',
        corebench_medium: 'core_bench_score',
        corebench_hard: 'core_bench_score',
      };

      // Fetch completed runs ordered by completedAt desc so first hit per field is the latest
      const completedRuns = await db
        .select()
        .from(benchmarkRuns)
        .where(and(inArray(benchmarkRuns.agentId, agentIds), eq(benchmarkRuns.status, 'completed')))
        .orderBy(desc(benchmarkRuns.completedAt));

      // Collect agents that still have a pending/running run
      const evaluatingAgentIds = new Set<string>();
      const pendingRuns = await db
        .select({ agentId: benchmarkRuns.agentId })
        .from(benchmarkRuns)
        .where(
          and(
            inArray(benchmarkRuns.agentId, agentIds),
            inArray(benchmarkRuns.status, ['pending', 'running']),
          ),
        );
      for (const r of pendingRuns) evaluatingAgentIds.add(r.agentId);

      // Build agentId → { score_field: value } map
      const scoreMap = new Map<string, Record<string, number>>();
      for (const run of completedRuns) {
        const field = BENCHMARK_TO_SCORE_FIELD[run.benchmarkName];
        if (!field || run.score === null) continue;
        if (!scoreMap.has(run.agentId)) scoreMap.set(run.agentId, {});
        const scores = scoreMap.get(run.agentId)!;
        if (!(field in scores)) scores[field] = run.score; // keep latest per field
      }

      const data = agentRows.map((agent) => {
        const scores = scoreMap.get(agent.id) ?? {};
        const mcpTools = Array.isArray(agent.tools) ? agent.tools.map((t) => t.name) : null;
        return {
          model_id: `tessera-agent-${agent.id}`,
          name: agent.baseModel.includes('/') ? agent.baseModel.split('/')[1]! : agent.baseModel,
          agent_name: agent.name,
          domain: agent.domain,
          organization: 'Tessera Community',
          organization_id: 'tessera-community',
          organization_country: null,
          params: null,
          context: null,
          canonical_model_id: null,
          release_date: agent.createdAt.toISOString().split('T')[0],
          announcement_date: agent.createdAt.toISOString().split('T')[0],
          multimodal: false,
          license: 'Custom',
          knowledge_cutoff: null,
          input_price: null,
          output_price: null,
          throughput: null,
          latency: null,
          aime_2025_score: null,
          hle_score: null,
          gpqa_score: null,
          mmmu_score: null,
          swe_bench_verified_score: scores['swe_bench_verified_score'] ?? null,
          gaia_score: scores['gaia_score'] ?? null,
          mmlu_score: scores['mmlu_score'] ?? null,
          pubmedqa_score: scores['pubmedqa_score'] ?? null,
          tau_bench_score: scores['tau_bench_score'] ?? null,
          core_bench_score: scores['core_bench_score'] ?? null,
          code_arena_score: null,
          chat_arena_score: null,
          arena_raw_scores: null,
          description: agent.description ?? null,
          system_prompt: agent.systemPrompt ?? null,
          mcp_tools: mcpTools,
          is_evaluating: evaluatingAgentIds.has(agent.id),
        };
      });

      return NextResponse.json({ data, total_count: data.length });
    }

    return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 });
  } catch (error) {
    logError('GET /api/leaderboard error', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
