/**
 * MASTER DISCOVERY REPORT METAPROMPT
 * ====================================
 * Instructs Claude 3.5 Sonnet to produce a full SRE-grade
 * narrative discovery report matching the quality of professional
 * PR agency outputs (Adfactors, Edelman, Weber Shandwick standard).
 *
 * Output mirrors the Avanti Birla deck structure:
 *   1. Profile Snapshot
 *   2. Social Standing
 *   3. Search Identity Analysis (query-by-query)
 *   4. Media Framing Report (12-month)
 *   5. Strategic Risk Layers Matrix
 *   6. Key Strategic Questions Answered
 *   7. Reputation Diagnosis (the "wow" conclusion)
 */

export interface DiscoveryReportProfile {
  name: string;
  role: string;
  company: string;
  industry: string;
  keywords: string[];
  linkedin_url?: string;
}

export interface DiscoveryReportInput {
  client: DiscoveryReportProfile;
  total_mentions: number;
  top_mentions: Array<{
    source: string;
    title: string;
    snippet: string;
    sentiment: number;
    frame: string;
  }>;
  sentiment: { positive: number; neutral: number; negative: number };
  frames: { expert: number; founder: number; leader: number; family: number; crisis: number; other: number };
  top_keywords: string[];
  crisis_signals: string[];
  archetype_hints: string[];
  lsi_preliminary: number;
}

export interface DiscoveryReport {
  generated_at: string;

  profile_snapshot: {
    identity_headline: string;
    summary: string;
    career_highlights: string[];
    digital_presence_score: number;
    digital_presence_narrative: string;
  };

  social_standing: {
    overview_narrative: string;
    visibility_tier: string;
    platform_breakdown: {
      linkedin: { followers: string; activity: string; positioning: string; dormant: boolean };
      twitter:  { followers: string; activity: string; positioning: string };
      wikipedia: { exists: boolean; quality: string; narrative: string };
      instagram: { followers: string; activity: string };
    };
    ai_discoverability: string;
    ai_discoverability_narrative: string;
  };

  search_identity: {
    identity_split: {
      business_leadership: number;
      family_context: number;
      personal_lifestyle: number;
      governance_institutional: number;
      other: number;
    };
    dominant_signal: string;
    query_analysis: Array<{
      query: string;
      dominant_signal: string;
      insight: string;
    }>;
    identity_diagnosis: string;
    identity_type: string;
  };

  media_framing: {
    primary_frame: string;
    frame_distribution: {
      expert_leader: number;
      business_operator: number;
      family_figure: number;
      governance: number;
      personal_lifestyle: number;
    };
    sector_split: { sector_context: number; non_sector_context: number };
    media_language: { frequent_descriptors: string[]; rare_descriptors: string[] };
    framing_narrative: string;
    strategic_framing_insight: string;
  };

  risk_assessment: {
    layers: Array<{
      authority_layer: string;
      observable_signal: string;
      gap_severity: string;
      narrative: string;
    }>;
    overall_risk_level: string;
    primary_risk_type: string;
  };

  strategic_questions: {
    identity_architecture: string;
    visibility_level: string;
    thought_leadership_gap: string;
    crisis_proximity: string;
    competitive_positioning: string;
    global_vs_india_positioning: string;
  };

  reputation_diagnosis: {
    headline: string;
    primary_risk_type: string;
    narrative: string;
    strengths: Array<{ title: string; description: string }>;
    vulnerabilities: Array<{ title: string; description: string }>;
    opportunity_signal: string;
    sre_opportunity_rating: string;
  };
}

/**
 * Returns the complete system + user prompt pair for Claude 3.5 Sonnet
 * to generate a full SRE discovery report.
 */
export function buildDiscoveryReportPrompts(input: DiscoveryReportInput): {
  systemPrompt: string;
  userPrompt: string;
} {
  const { client, total_mentions, top_mentions, sentiment, frames, top_keywords, crisis_signals, lsi_preliminary } = input;

  const topMentionsSample = top_mentions
    .slice(0, 25)
    .map((m, i) => `[${i + 1}] SOURCE: ${m.source} | FRAME: ${m.frame} | SENTIMENT: ${m.sentiment > 0.2 ? 'positive' : m.sentiment < -0.2 ? 'negative' : 'neutral'}\nTITLE: ${m.title}\nSNIPPET: ${m.snippet.slice(0, 200)}`)
    .join('\n\n');

  const dominantFrame = Object.entries(frames).sort(([,a],[,b]) => b - a)[0][0];
  const totalFrames = Object.values(frames).reduce((a, b) => a + b, 0) || 1;

  const systemPrompt = `You are a Principal Reputation Strategist at a top-tier strategic communications firm (think Edelman, Weber Shandwick, Adfactors PR). You have 20 years of experience building, protecting, and engineering the reputations of CEOs, board members, family business heirs, and public figures across India and globally.

You are producing a Strategic Reputation Engineering (SRE) Discovery Report — the foundational document that a PR agency delivers to a prospective client before beginning any reputation programme. This report must:

1. READ LIKE A PREMIUM ADVISORY DOCUMENT — not a dashboard. Every number must be accompanied by a sentence explaining what it means for the client's reputation.

2. BE SPECIFIC, NEVER GENERIC — Name actual publications, actual competitor names, actual phrases used in media. "ET, Mint, and Bloomberg" is better than "leading business publications."

3. TELL A COHERENT STORY — The best SRE reports have a through-line: who this person IS vs who they APPEAR TO BE, and what the gap means.

4. USE PRECISE REPUTATION LANGUAGE — Terms like "Narrative Absence Risk," "Identity Diffusion," "Authority Vacuum," "Adjacent Reputational Exposure," "Visibility Gap," "Search Identity Split," "Discovery Layer" are correct and expected.

5. DIAGNOSE, DON'T JUST DESCRIBE — Every section should answer: "So what? Why does this matter to the client?"

REPORT STRUCTURE — You must generate all 7 sections with the exact JSON schema provided. Do not skip any section. Do not add sections not in the schema.

QUALITY BENCHMARK — Your output should be indistinguishable from a report produced by a senior strategist at a major PR firm billing ₹50 lakh for this engagement. The client should feel, upon reading this, that you understand their reputation situation better than they do themselves.

EVIDENCE RULES:
- When you have actual data from search results, cite it specifically ("Forbes covered the acquisition as…")
- When you are using your general knowledge about this person/industry, do so confidently but accurately
- For small/private figures with limited data, extrapolate intelligently from industry patterns
- NEVER fabricate specific statistics you don't have (e.g., don't invent a follower count if not provided)
- Use "approximately," "estimated," "typically" when precision is not available

OUTPUT: Return ONLY a valid JSON object matching this exact schema. No preamble, no explanation, no markdown fences.

JSON SCHEMA:
{
  "generated_at": "ISO timestamp string",
  "profile_snapshot": {
    "identity_headline": "string — one phrase that defines who they are at their best (e.g., 'EV Transformation Leader Redefining Indian Mobility')",
    "summary": "string — 2–3 sentences. The executive-level read on who this person is, what they've built, and where they stand.",
    "career_highlights": ["string", "string", "string", "string"],
    "digital_presence_score": "number 0-100",
    "digital_presence_narrative": "string — 1-2 sentences explaining what the score means in practical terms"
  },
  "social_standing": {
    "overview_narrative": "string — 2-3 sentences on the overall digital visibility picture",
    "visibility_tier": "string — one of: High / Medium-High / Medium / Low / Minimal",
    "platform_breakdown": {
      "linkedin": {"followers": "string", "activity": "string — Active / Dormant / Absent", "positioning": "string — how they appear on LinkedIn", "dormant": "boolean"},
      "twitter": {"followers": "string", "activity": "string — Active / Dormant / Absent", "positioning": "string"},
      "wikipedia": {"exists": "boolean", "quality": "string — Comprehensive / Basic / Stub / Absent", "narrative": "string — what this means for search authority"},
      "instagram": {"followers": "string", "activity": "string"}
    },
    "ai_discoverability": "string — High / Medium / Low / Minimal",
    "ai_discoverability_narrative": "string — What do ChatGPT / Perplexity / Google AI say about this person? Is there structured content for AI to interpret?"
  },
  "search_identity": {
    "identity_split": {
      "business_leadership": "number (% of mentions framing them as a business leader)",
      "family_context": "number (% framing them in family/lineage context)",
      "personal_lifestyle": "number (% personal/lifestyle coverage)",
      "governance_institutional": "number (% governance, board, institutional roles)",
      "other": "number"
    },
    "dominant_signal": "string — what dominates when you search this person's name",
    "query_analysis": [
      {"query": "string — the actual search query e.g. '\"Name\"'", "dominant_signal": "string — what results show", "insight": "string — strategic implication"},
      {"query": "string", "dominant_signal": "string", "insight": "string"},
      {"query": "string", "dominant_signal": "string", "insight": "string"},
      {"query": "string", "dominant_signal": "string", "insight": "string"}
    ],
    "identity_diagnosis": "string — 2 sentences. The definitive statement on who Google thinks this person is today vs who they want to be.",
    "identity_type": "string — one of: Business-Led / Family-Led / Achievement-Led / Mixed / Lifestyle-Led / Crisis-Led"
  },
  "media_framing": {
    "primary_frame": "string — the single dominant lens through which media sees this person",
    "frame_distribution": {
      "expert_leader": "number — %",
      "business_operator": "number — %",
      "family_figure": "number — %",
      "governance": "number — %",
      "personal_lifestyle": "number — %"
    },
    "sector_split": {
      "sector_context": "number — % of coverage that is relevant to their industry",
      "non_sector_context": "number — % that is personal/family/lifestyle"
    },
    "media_language": {
      "frequent_descriptors": ["string — actual phrases/terms used by media", "string", "string"],
      "rare_descriptors": ["string — phrases they SHOULD be associated with but aren't", "string", "string"]
    },
    "framing_narrative": "string — 3-4 sentences. Explain the media framing situation, what drives it, and what it costs the client.",
    "strategic_framing_insight": "string — the single most important strategic observation about their media framing"
  },
  "risk_assessment": {
    "layers": [
      {
        "authority_layer": "string — e.g. 'Business Leadership Visibility'",
        "observable_signal": "string — specific, evidenced signal",
        "gap_severity": "string — High / Moderate-High / Moderate / Low",
        "narrative": "string — why this matters"
      }
    ],
    "overall_risk_level": "string — High / Moderate-High / Moderate / Low",
    "primary_risk_type": "string — the headline risk type: 'Narrative Absence Risk' / 'Identity Confusion Risk' / 'Sentiment Volatility Risk' / 'Authority Vacuum Risk' / 'Crisis Proximity Risk' / 'Visibility Deficit Risk'"
  },
  "strategic_questions": {
    "identity_architecture": "string — answer: Who are they, really, in the eyes of the internet?",
    "visibility_level": "string — answer: How visible are they compared to peers in their sector?",
    "thought_leadership_gap": "string — answer: Is there an op-ed / speaking / media presence? What's missing?",
    "crisis_proximity": "string — answer: Any crisis signals, negative associations, or adjacent risks?",
    "competitive_positioning": "string — answer: How do they compare to 2-3 named peers?",
    "global_vs_india_positioning": "string — answer: Are they known globally or only in India?"
  },
  "reputation_diagnosis": {
    "headline": "string — one powerful diagnostic sentence (e.g. 'Current risk is not negative reputation — it is Narrative Absence Risk')",
    "primary_risk_type": "string — e.g. 'Narrative Absence Risk'",
    "narrative": "string — 3-4 sentences that synthesise the full picture. This is the 'so what' of the whole report. Make it memorable.",
    "strengths": [
      {"title": "string", "description": "string — specific, evidenced strength"},
      {"title": "string", "description": "string"},
      {"title": "string", "description": "string"}
    ],
    "vulnerabilities": [
      {"title": "string", "description": "string — specific, evidenced vulnerability"},
      {"title": "string", "description": "string"},
      {"title": "string", "description": "string"}
    ],
    "opportunity_signal": "string — the single best strategic opportunity for this person's reputation engineering",
    "sre_opportunity_rating": "string — Exceptional / High / Medium / Low"
  }
}`;

  const userPrompt = `Generate a complete SRE Discovery Report for the following individual.

=== CLIENT PROFILE ===
Name: ${client.name}
Role: ${client.role || 'Not specified'}
Company: ${client.company || 'Not specified'}
Industry: ${client.industry || 'Not specified'}
Key Keywords: ${client.keywords?.join(', ') || 'None provided'}
LinkedIn: ${client.linkedin_url || 'Not provided'}

=== SCAN DATA ===
Total Mentions Found: ${total_mentions}
Preliminary LSI Score: ${lsi_preliminary}/100

Sentiment Distribution:
- Positive: ${sentiment.positive}%
- Neutral: ${sentiment.neutral}%
- Negative: ${sentiment.negative}%

Frame Distribution (% of ${total_mentions} mentions):
- Expert/Authority: ${frames.expert}% (${Math.round(frames.expert * totalFrames / 100)} mentions)
- Founder/Builder: ${frames.founder}% (${Math.round(frames.founder * totalFrames / 100)} mentions)
- Leader/Visionary: ${frames.leader}% (${Math.round(frames.leader * totalFrames / 100)} mentions)
- Family/Legacy: ${frames.family}% (${Math.round(frames.family * totalFrames / 100)} mentions)
- Crisis/Controversy: ${frames.crisis}% (${Math.round(frames.crisis * totalFrames / 100)} mentions)
- Other: ${frames.other}%

Dominant Frame: ${dominantFrame}

Top Keywords from Mentions: ${top_keywords.join(', ')}

${crisis_signals.length > 0 ? `⚠️ CRISIS SIGNALS DETECTED:\n${crisis_signals.join('\n')}` : 'No crisis signals detected.'}

=== TOP 25 MENTIONS (ranked by relevance) ===
${topMentionsSample || 'No mentions captured in this scan.'}

=== YOUR TASK ===
Using ALL of the above data PLUS your knowledge of ${client.name}, ${client.company || ''}, and the ${client.industry || 'relevant'} industry in India, generate the complete SRE Discovery Report JSON.

CRITICAL INSTRUCTIONS:
1. The query_analysis section MUST include 4 specific search queries a researcher would actually run for "${client.name}" — analyse what each query reveals about their search identity
2. The risk_assessment.layers MUST include at least 8 authority layers (match the depth of a professional SRE risk audit)
3. The reputation_diagnosis.headline MUST be a single, punchy sentence that captures the entire situation — this is what the client will remember
4. Every "narrative" field must be written in the voice of a senior PR strategist, not a data analyst
5. The frame_distribution percentages must sum to approximately 100
6. The identity_split percentages must sum to 100
7. If ${client.name} is a notable public figure, use your knowledge to make this specific to them — do NOT write generic copy
8. Return ONLY the JSON object, no other text`;

  return { systemPrompt, userPrompt };
}
