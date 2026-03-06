/**
 * SRE Discovery Report Prompt
 * Produces a 10-section narrative intelligence report using Claude's own knowledge
 * supplemented by scan data.
 */

export interface DiscoveryReportInput {
  client: {
    name: string;
    role: string;
    company: string;
    industry: string;
    keywords: string[];
    linkedin_url?: string;
    bio?: string;                              // self-described biography — ground truth
    social_links?: Record<string, string>;     // verified social profiles
    known_works?: string[];                    // explicitly stated films/books/articles
  };
  total_mentions: number;
  top_mentions: Array<{
    source: string;
    title: string;
    snippet: string;
    sentiment: number;
    frame: string;
    url?: string;       // actual URL found — critical for grounding
    category?: string;  // search|news|video|social|academic etc
    date?: string;
  }>;
  sentiment: { positive: number; neutral: number; negative: number };
  frames: { expert: number; founder: number; leader: number; family: number; crisis: number; other: number };
  top_keywords: string[];
  crisis_signals: string[];
  archetype_hints: string[];
  lsi_preliminary: number;
}

export interface DiscoveryReport {
  generated_at?: string;
  profile_overview: {
    identity_headline: string;
    current_position: string;
    currently_known_for: string;
    primary_role: string;
    primary_context: string;
    age_generation: string;
    location: string;
    digital_presence_score: number;
    digital_presence_narrative: string;
  };
  professional_background: {
    summary: string;
    trajectory: Array<{ year: string; milestone: string; significance: string }>;
    key_achievements: string[];
    education: string;
    awards_recognition: string[];
  };
  recent_developments: {
    major_recent_event: string;
    strategic_context: string;
    news_items: Array<{ headline: string; source: string; significance: string }>;
  };
  search_reputation: {
    keyword_association_map: Array<{ keyword_cluster: string; percentage: number; dominant_signal: string; strategic_implication: string }>;
    identity_type: string;
    identity_diagnosis: string;
    search_split_narrative: string;
    query_analysis: Array<{ query: string; dominant_signal: string; insight: string }>;
  };
  media_framing: {
    primary_frame: string;
    how_described_in_domain_media: string;
    frame_distribution: { expert_thought_leader: number; business_operator: number; family_figure: number; personal_lifestyle: number; governance: number };
    sector_split: { sector_context: number; non_sector_context: number };
    media_language: { frequent_descriptors: string[]; rare_descriptors: string[] };
    framing_narrative: string;
    strategic_framing_insight: string;
  };
  social_and_thought_leadership: {
    overview_narrative: string;
    visibility_tier: string;
    linkedin: { followers: string; activity: string; positioning: string };
    twitter_x: { followers: string; activity: string; positioning: string };
    wikipedia: { exists: boolean; quality: string };
    conference_participation: string[];
    speaking_engagements: string[];
    op_eds: string[];
    ai_discoverability: string;
    ai_discoverability_narrative: string;
    thought_leadership_gap: string;
  };
  peer_comparison: {
    peers: Array<{ name: string; role: string; visibility_level: string; primary_frame: string; followers_approx: string; competitive_gap: string }>;
    competitive_positioning_narrative: string;
    relative_visibility: string;
  };
  key_questions: {
    identity_architecture: string;
    search_results_breakdown: string;
    expert_citation_vs_mention: string;
    thought_leadership_presence: string;
    competitive_position: string;
    crisis_association: string;
    global_positioning: string;
  };
  risk_assessment: {
    layers: Array<{ authority_layer: string; observable_signal: string; gap_severity: string; narrative: string }>;
    overall_risk_level: string;
    primary_risk_type: string;
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

export function buildDiscoveryReportPrompts(input: DiscoveryReportInput): {
  systemPrompt: string;
  userPrompt: string;
} {
  const { client, total_mentions, sentiment, frames, top_keywords, crisis_signals, lsi_preliminary } = input;

  const systemPrompt = `You are a Principal Reputation Strategist at a top-tier strategic communications firm (Edelman/Weber Shandwick/Adfactors-level). You produce SRE Discovery Reports for CEOs, founders, and executives.

CRITICAL RULES:
1. USE YOUR OWN KNOWLEDGE FIRST. Draw on everything you know about ${client.name}, ${client.company}, their industry, and their peers. Scan data is supplementary.
2. If scan data is sparse (high "other" frame, mostly neutral) — this IS the finding: Narrative Absence Risk. Diagnose it clearly.
3. NEVER be generic. Name real publications, real peer executives, real search queries.
4. Every number needs a sentence explaining what it means reputationally.
5. Diagnose, don't just describe. Answer: "So what? Why does this matter?"
6. Use precise SRE vocabulary: Narrative Absence Risk, Identity Diffusion, Authority Vacuum, Search Identity Split, Frame Drift, Thought Leadership Gap.
7. Quality standard: indistinguishable from a ₹50 lakh PR firm engagement. The client should feel "they know me better than I know myself."

Respond with ONLY a valid JSON object matching the exact schema requested. No markdown, no explanation.`;

  const dominantFrame = Object.entries(frames)
    .filter(([k]) => k !== 'other')
    .sort(([,a],[,b]) => b - a)[0]?.[0] ?? 'other';

  const userPrompt = `Generate a complete 10-section SRE Discovery Report for:

CLIENT: ${client.name}
ROLE: ${client.role} at ${client.company}
INDUSTRY: ${client.industry}
KEYWORDS: ${client.keywords.join(', ')}
${client.linkedin_url ? `LINKEDIN: ${client.linkedin_url}` : ''}

SCAN DATA (supplementary — use your own knowledge primarily):
- Total mentions found: ${total_mentions}
- LSI preliminary score: ${lsi_preliminary}/100
- Sentiment: ${sentiment.positive}% positive, ${sentiment.neutral}% neutral, ${sentiment.negative}% negative
- Dominant frame: ${dominantFrame} (${frames[dominantFrame as keyof typeof frames]}%)
- Top keywords: ${top_keywords.slice(0, 10).join(', ')}
- Crisis signals: ${crisis_signals.length > 0 ? crisis_signals.join('; ') : 'None detected'}

${sentiment.neutral > 70 || frames.other > 70 ? `DIAGNOSIS NOTE: High neutral sentiment (${sentiment.neutral}%) and high "other" frame (${frames.other}%) indicates NARRATIVE ABSENCE — the person's digital footprint is thin and unstructured. This is itself a critical finding worth diagnosing in depth.` : ''}

Return this exact JSON structure:
{
  "profile_overview": {
    "identity_headline": "one powerful phrase defining who they are",
    "current_position": "exact current role",
    "currently_known_for": "what they're primarily associated with today",
    "primary_role": "executive/founder/investor/etc",
    "primary_context": "business/family/civic/etc",
    "age_generation": "estimated age or generation (e.g. Gen X, early 40s)",
    "location": "city, country",
    "digital_presence_score": 0,
    "digital_presence_narrative": "2 sentences explaining the score"
  },
  "professional_background": {
    "summary": "2-3 sentence career overview",
    "trajectory": [
      {"year": "YYYY", "milestone": "what happened", "significance": "why it matters"}
    ],
    "key_achievements": ["specific achievement 1", "specific achievement 2"],
    "education": "degrees and institutions",
    "awards_recognition": ["award 1", "award 2"]
  },
  "recent_developments": {
    "major_recent_event": "most significant recent news or development",
    "strategic_context": "why this matters for their reputation",
    "news_items": [
      {"headline": "news item", "source": "publication name", "significance": "reputational impact"}
    ]
  },
  "search_reputation": {
    "keyword_association_map": [
      {"keyword_cluster": "e.g. Film / Cinema", "percentage": 45, "dominant_signal": "what this signals", "strategic_implication": "what this means for SRE"}
    ],
    "identity_type": "Business-Led|Family-Led|Achievement-Led|Mixed|Lifestyle-Led|Narrative-Absent",
    "identity_diagnosis": "2 sentences diagnosing the search identity situation",
    "search_split_narrative": "paragraph explaining what someone finds when they Google this person",
    "query_analysis": [
      {"query": "exact Google query someone would use", "dominant_signal": "what comes up", "insight": "strategic implication"}
    ]
  },
  "media_framing": {
    "primary_frame": "how media primarily frames them",
    "how_described_in_domain_media": "paragraph on domain media coverage",
    "frame_distribution": {"expert_thought_leader": 0, "business_operator": 0, "family_figure": 0, "personal_lifestyle": 0, "governance": 0},
    "sector_split": {"sector_context": 0, "non_sector_context": 0},
    "media_language": {"frequent_descriptors": ["word1", "word2"], "rare_descriptors": ["missing1", "missing2"]},
    "framing_narrative": "paragraph on media framing patterns",
    "strategic_framing_insight": "the key strategic insight about their framing"
  },
  "social_and_thought_leadership": {
    "overview_narrative": "paragraph on social presence",
    "visibility_tier": "High|Medium-High|Medium|Low|Minimal",
    "linkedin": {"followers": "estimate", "activity": "Active|Dormant|Absent", "positioning": "how they present on LinkedIn"},
    "twitter_x": {"followers": "estimate", "activity": "Active|Dormant|Absent", "positioning": "their X presence"},
    "wikipedia": {"exists": false, "quality": "None|Stub|Basic|Comprehensive"},
    "conference_participation": ["conference 1", "conference 2"],
    "speaking_engagements": ["event 1"],
    "op_eds": ["publication 1"],
    "ai_discoverability": "High|Medium|Low|Minimal",
    "ai_discoverability_narrative": "how AI tools describe this person",
    "thought_leadership_gap": "specific gap in thought leadership presence"
  },
  "peer_comparison": {
    "peers": [
      {"name": "Real Peer Name", "role": "their role", "visibility_level": "High|Medium|Low", "primary_frame": "how they're known", "followers_approx": "100K", "competitive_gap": "specific gap vs client"}
    ],
    "competitive_positioning_narrative": "paragraph comparing client to peers",
    "relative_visibility": "High|Medium-High|Medium|Medium-Low|Low vs peers"
  },
  "key_questions": {
    "identity_architecture": "Is ${client.name} known as X or Y? Answer specifically.",
    "search_results_breakdown": "Top 10 Google results — what % in what context?",
    "expert_citation_vs_mention": "Cited as expert or just mentioned? Evidence.",
    "thought_leadership_presence": "Any op-eds, papers, frameworks attributed to them?",
    "competitive_position": "Visibility vs named peers in their space?",
    "crisis_association": "Any negative content, controversies, or crisis associations?",
    "global_positioning": "Recognized internationally or India-only?"
  },
  "risk_assessment": {
    "layers": [
      {"authority_layer": "e.g. Professional Identity", "observable_signal": "what we observe", "gap_severity": "High|Moderate-High|Moderate|Low", "narrative": "1-2 sentences explaining the risk"}
    ],
    "overall_risk_level": "High|Moderate-High|Moderate|Low",
    "primary_risk_type": "Narrative Absence Risk|Identity Confusion Risk|Authority Vacuum|Visibility Deficit|Crisis Proximity|Frame Drift"
  },
  "reputation_diagnosis": {
    "headline": "one powerful diagnostic sentence — the single most important finding",
    "primary_risk_type": "same as above",
    "narrative": "3-4 sentences synthesizing the full picture — what is the core reputational situation?",
    "strengths": [
      {"title": "strength title", "description": "2 sentences with specific evidence"}
    ],
    "vulnerabilities": [
      {"title": "vulnerability title", "description": "2 sentences explaining the risk"}
    ],
    "opportunity_signal": "the single biggest SRE opportunity for this person",
    "sre_opportunity_rating": "Exceptional|High|Medium|Low"
  }
}`;

  return { systemPrompt, userPrompt };
}
