import { db } from '@lmring/database';
import type { ZevalBaseModel } from '@lmring/database/schema';
import { zevalBaseModels } from '@lmring/database/schema';
import { NextResponse } from 'next/server';
import { logError } from '@/libs/error-logging';

// SCALE WARNING: LLM arena score raw values in the snapshot are in the ~0–25+
// range, not 0–1. Passing them through as-is; the display layer must be
// audited before these columns are rendered. See schema.ts for details.
function computeCodeArenaScore(row: ZevalBaseModel): number | null {
  const vals = [
    row.textToWebsiteScore,
    row.threejsScore,
    row.textToGameScore,
    row.p5AnimationScore,
    row.textToSvgScore,
    row.datavizScore,
    row.toneJsScore,
  ].filter((v): v is number => v !== null);
  if (vals.length === 0) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function toApiShape(row: ZevalBaseModel) {
  return {
    model_id: row.modelId,
    name: row.name,
    organization: row.organization,
    organization_id: row.organizationId,
    organization_country: row.organizationCountry,
    params: row.params,
    training_tokens: row.trainingTokens,
    context: row.context,
    canonical_model_id: row.canonicalModelId,
    is_moe: row.isMoe,
    multimodal: row.multimodal,
    release_date: row.releaseDate,
    announcement_date: row.announcementDate,
    license: row.license,
    knowledge_cutoff: row.knowledgeCutoff,
    input_price: row.inputPrice,
    output_price: row.outputPrice,
    throughput: row.throughput,
    latency: row.latency,
    aime_2025_score: row.aime2025Score,
    hle_score: row.hleScore,
    gpqa_score: row.gpqaScore,
    swe_bench_verified_score: row.sweBenchVerifiedScore,
    mmmu_score: row.mmmuScore,
    simpleqa_score: row.simpleqaScore,
    osworld_score: row.osworldScore,
    browsecomp_score: row.browsecompScore,
    toolathlon_score: row.toolathlonScore,
    terminal_bench_score: row.terminalBenchScore,
    tau_bench_retail_score: row.tauBenchRetailScore,
    arc_agi_v2_score: row.arcAgiV2Score,
    mmmlu_score: row.mmmluScore,
    charxiv_r_score: row.charxivRScore,
    mmmu_pro_score: row.mmmuProScore,
    screenspot_pro_score: row.screenspotProScore,
    mcp_atlas_score: row.mcpAtlasScore,
    frontiermath_score: row.frontiermathScore,
    mrcr_v2_score: row.mrcrV2Score,
    scicode_score: row.scicodeScore,
    apex_agents_score: row.apexAgentsScore,
    swe_bench_pro_score: row.sweBenchProScore,
    // Arena scores — raw, see SCALE WARNING above
    code_arena_score: computeCodeArenaScore(row),
    chat_arena_score: row.chatArenaScore,
    arena_raw_scores: {
      ...(row.chatArenaScore !== null && { 'chat-arena': row.chatArenaScore }),
      ...(row.textToWebsiteScore !== null && { 'text-to-website': row.textToWebsiteScore }),
      ...(row.threejsScore !== null && { threejs: row.threejsScore }),
      ...(row.textToGameScore !== null && { 'text-to-game': row.textToGameScore }),
      ...(row.p5AnimationScore !== null && { 'p5-animation': row.p5AnimationScore }),
      ...(row.textToSvgScore !== null && { 'text-to-svg': row.textToSvgScore }),
      ...(row.datavizScore !== null && { dataviz: row.datavizScore }),
      ...(row.toneJsScore !== null && { tonejs: row.toneJsScore }),
    },
  };
}

export async function GET() {
  try {
    const rows = await db.select().from(zevalBaseModels);
    return NextResponse.json(rows.map(toApiShape));
  } catch (error) {
    logError('GET /api/base-models error', error);
    return NextResponse.json({ error: 'Failed to fetch base models' }, { status: 500 });
  }
}
