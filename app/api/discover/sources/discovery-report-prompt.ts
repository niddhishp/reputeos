/**
 * SRE Discovery Report — Master Metaprompt v3
 * =============================================
 * Produces a 10-section intelligence report.
 * Claude MUST use its own training knowledge as the primary source.
 * Scan data is supplementary signal, not the foundation.
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
  top_mentions: Array<{ source: string; title: string; snippet: string; sentiment: number; frame: string; }>;
  sentiment: { positive: number; neutral: number; negative: number };
  frames: { expert: number; founder: number; leader: number; family: number; crisis: number; other: number };
  top_keywords: string[];
  crisis_signals: string[];
  archetype_hints: string[];
  lsi_preliminary: number;
}

export interface DiscoveryReport {
  generated_at: string;
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
    media_coverage_patterns: string;
    news_items: Array<{ headline: string; source: string; significance: string }>;
  };
  search_reputation: {
    keyword_association_map: Array<{ keyword_cluster: string; percentage: number; dominant_signal: string; strategic_implication: string }>;
    query_analysis: Array<{ query: string; dominant_signal: string; top_results_type: string; insight: string }>;
    identity_type: string;
    identity_diagnosis: string;
    search_split_narrative: string;
  };
  media_framing: {
    primary_frame: string;
    how_described_in_domain_media: string;
    coverage_context: Array<{ publication_type: string; publications: string[]; coverage_angle: string; tone: string }>;
    frame_distribution: { expert_thought_leader: number; business_operator: number; family_figure: number; personal_lifestyle: number; governance: number };
    sector_split: { sector_context: number; non_sector_context: number };
    media_language: { frequent_descriptors: string[]; rare_descriptors: string[] };
    framing_narrative: string;
    strategic_framing_insight: string;
  };
  social_and_thought_leadership: {
    overview_narrative: string;
    visibility_tier: string;
    linkedin: { followers: string; activity: string; positioning: string; dormant: boolean; content_themes: string[] };
    twitter_x: { followers: string; activity: string; positioning: string };
    wikipedia: { exists: boolean; quality: string; narrative: string };
    other_platforms: string;
    conference_participation: string[];
    speaking_engagements: string[];
    op_eds: string[];
    tv_interviews: string[];
    podcast_appearances: string[];
    academic_institutional: string[];
    ai_discoverability: string;
    ai_discoverability_narrative: string;
    thought_leadership_gap: string;
  };
  peer_comparison: {
    peers: Array<{ name: string; role: string; visibility_level: string; primary_frame: string; followers_approx: string; thought_leadership_score: string; competitive_gap: string }>;
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

export function buildDiscoveryReportPrompts(input: DiscoveryReportInput): { systemPrompt: string; userPrompt: string } {
  const { client, total_mentions, top_mentions, sentiment, frames, top_keywords, crisis_signals, lsi_preliminary } = input;

  // Interpret scan quality for the AI
  const scanIsLight = frames.other > 60 || total_mentions < 30;
  const scanQualityNote = scanIsLight
    ? `NOTE: The automated scan returned thin data (${frames.other}% "other" frame, ${total_mentions} mentions). This is a SIGNAL, not a limitation — it means this person's digital footprint is nascent. YOU MUST use your own training knowledge about the person, their company, and their industry as the PRIMARY source. The scan data is secondary context only.`
    : `The scan returned usable data. Use it alongside your own knowledge.`;

  const mentionSample = top_mentions.slice(0, 15).map((m, i) =>
    `[${i+1}] ${m.source} | FRAME:${m.frame} | SENTIMENT:${m.sentiment > 0.2 ? '+' : m.sentiment < -0.2 ? '-' : '~'}\n    ${m.title}\n    ${m.snippet.slice(0,150)}`
  ).join('\n');

  const systemPrompt = `You are a Principal Reputation Strategist — 20 years at Adfactors, Edelman, and Weber Shandwick. You have engineered the reputations of India's top CEOs, founders, and public figures. You are producing a Strategic Reputation Engineering (SRE) Discovery Report: the foundational intelligence document that opens every engagement.

This report must make the client feel: "They know me better than anyone — I need to work with them."

════════════════════════════════════════
RULE 1 — YOUR KNOWLEDGE IS PRIMARY
════════════════════════════════════════
${scanQualityNote}

For EVERY person you analyse:
• Draw on everything you know about them, their company, industry, competitors, and Indian/global business context
• If the person is not globally famous, use what you know about their role, company stage, sector dynamics, and typical profiles of people in their position
• Fill gaps intelligently — a founder of a film-tech company in India has a knowable profile even if not widely covered
• Never produce generic placeholder text. Every sentence must be specific to THIS person.

════════════════════════════════════════
RULE 2 — DIAGNOSE, DON'T DESCRIBE
════════════════════════════════════════
Numbers mean nothing without interpretation. Examples of wrong vs right:

WRONG: "Expert frame: 4%"
RIGHT: "Only 4% of digital mentions frame ${client.name} as an authority figure — meaning a first-time Google visitor reads them as a private individual, not a professional voice worth following."

WRONG: "96% neutral sentiment"
RIGHT: "96% neutral sentiment is a Narrative Absence signal — the internet has no strong opinion about ${client.name} because they have not yet created enough signal to form one. This is actually the highest-value SRE intervention type: a blank canvas with upside."

WRONG: "LinkedIn activity: low"
RIGHT: "Despite running a company in the competitive film-tech and AI space, ${client.name}'s LinkedIn is largely dormant — meaning every investor, partner, or journalist who searches their name finds no professional narrative. A competitor with equivalent credentials but an active LinkedIn voice wins every first impression."

════════════════════════════════════════
RULE 3 — SCAN DATA INTERPRETATION
════════════════════════════════════════
When "other" frame dominates (>60%):
→ Means mentions are passing references (forum posts, directories, lists), not primary coverage
→ The subject lacks a structured digital identity
→ Diagnosis: Narrative Absence Risk or Identity Nascency
→ This is actually the best SRE opportunity — tell them that clearly

When neutral sentiment dominates (>80%):
→ Not bad — just no established narrative
→ Neither advocate nor detractor base built
→ First-mover advantage in framing available

When total mentions are low (<50):
→ Low discovery index, not low reputation
→ The internet hasn't yet mapped this person
→ Opportunity: build the narrative before others define it

════════════════════════════════════════
RULE 4 — SPECIFICITY STANDARDS
════════════════════════════════════════
• Named peers only (never "a peer in their space")
• Named publications (ET, Mint, Forbes India, TechCrunch India, YourStory, Inc42)
• Real search queries (exactly what someone would type)
• Real career milestones with approximate years
• Real industry context (funding environment, sector dynamics, competitive landscape)
• Real platform follower ranges based on your knowledge

════════════════════════════════════════
RULE 5 — OUTPUT FORMAT
════════════════════════════════════════
Return ONLY valid JSON. No markdown, no preamble, no explanation. The JSON must match the schema exactly.

For film/creative industry professionals: use YourStory, Film Companion, FICCI Frames, OTT platform news as publication context
For tech/AI founders: use Inc42, YourStory, TechCrunch, Product Hunt, LinkedIn thought leadership
For executives: use ET, Mint, Business Standard, Forbes India, Bloomberg Quint
For family business heirs: use Business Today, Forbes India, Hurun, family group press releases`;

  const userPrompt = `Generate a complete SRE Discovery Report for:

NAME: ${client.name}
ROLE: ${client.role || 'Founder / Executive — infer from company and industry'}
COMPANY: ${client.company || 'Independent — infer from keywords'}
INDUSTRY: ${client.industry || 'Infer from keywords and name context'}
KEYWORDS: ${client.keywords?.join(', ') || 'None provided'}
LINKEDIN: ${client.linkedin_url || 'Not provided'}

═══════════════════════════════════════
AUTOMATED SCAN RESULTS — INTERPRET CAREFULLY
═══════════════════════════════════════
The scan searched 62+ sources using keyword matching and NLP frame classification.

Mentions found: ${total_mentions}
Preliminary LSI: ${lsi_preliminary}/100
Sentiment: Positive ${sentiment.positive}% | Neutral ${sentiment.neutral}% | Negative ${sentiment.negative}%
Frames: Expert ${frames.expert}% | Founder ${frames.founder}% | Leader ${frames.leader}% | Family ${frames.family}% | Crisis ${frames.crisis}% | Other/Uncategorised ${frames.other}%
Keywords detected: ${top_keywords.slice(0, 15).join(', ') || 'None — person has very thin structured web presence'}
${crisis_signals.length > 0 ? 'CRISIS SIGNALS: ' + crisis_signals.slice(0, 5).join('; ') : 'No crisis signals found.'}

HOW TO INTERPRET THESE NUMBERS:
${frames.other > 60 ? '— "Other" frame at ' + frames.other + '%: This person is mentioned in passing on the web but not as the central subject of content. They appear in comment sections, lists, social posts — not in dedicated articles or expert citations. This is a NARRATIVE ABSENCE signal. It is your most important finding.' : ''}
${sentiment.neutral > 65 ? '— Neutral sentiment at ' + sentiment.neutral + '%: No strong opinion-based coverage. Mostly factual/passing mentions. The public has no formed view of this person. This is an AUTHORITY VACUUM signal.' : ''}
${total_mentions < 50 ? '— Low mention volume (' + total_mentions + '): Very limited digital footprint. Do not let this constrain your report. This IS the finding — and you should describe it richly and specifically.' : ''}

THE GOLDEN RULE: If the scan returned thin data, that thinness IS the SRE opportunity. The narrative territory is unclaimed. The person who claims it first wins. Frame your report around that opportunity.

Sample mentions captured (use as signals only — not gospel):
${mentionSample || 'No structured mentions captured. Rely entirely on your training knowledge.'}

═══════════════════════════════════════
WHAT YOUR 10-SECTION REPORT MUST DELIVER
═══════════════════════════════════════

SECTION 1 — PROFILE OVERVIEW:
Who is ${client.name} today? Write their identity_headline as a single punchy phrase (not generic). 
The "currently_known_for" field must be an HONEST assessment — what does the internet actually 
associate them with, not what they want to be known for. Digital presence score 0–100 with a 
practical explanation of what that number means for their career.

SECTION 2 — PROFESSIONAL BACKGROUND:
Build a career trajectory with REAL dates and milestones. For each milestone include why it mattered 
to their public reputation, not just what happened. If you don't know exact dates, use approximate 
ranges. Include real achievements — even if private/small-scale.

SECTION 3 — RECENT DEVELOPMENTS:
What is the most strategically significant recent development for their reputation? Could be a 
product launch, media appearance, company milestone, or — importantly — a NOTABLE ABSENCE 
(no press coverage of a major business milestone is itself a finding).

SECTION 4 — SEARCH REPUTATION (KEYWORD ASSOCIATION MAP):
This must be built from your knowledge of what Google actually shows for "${client.name}", 
not from the scan's frame percentages. Think: if you Googled "${client.name}" right now, what 
would dominate? LinkedIn? News? Their company's site? Personal blog? Social media? Nothing?

Map it into clusters with realistic percentages that sum to 100%. Label each cluster by what 
topic it represents (Films, AI/Tech, Books, Company PR, Personal Social, etc).

Also generate 4 specific Google search queries someone might actually run for this person 
— what would you find?

SECTION 5 — MEDIA FRAMING:
How is ${client.name} described when media covers them? What language do journalists use?
Which publications have covered them (name specifically — ET, Mint, The Hindu, Forbes India, 
TechCrunch India, trade magazines, etc.)? If no media has covered them, that is the finding 
— use "Narrative Absence" language.

SECTION 6 — SOCIAL & THOUGHT LEADERSHIP:
Check every channel. LinkedIn activity? Twitter/X? Wikipedia page? Conference talks? Published 
op-eds in named publications? TV interviews? Podcasts? Name SPECIFIC examples if known. 
If nothing exists, say so clearly — that gap IS the analysis.

SECTION 7 — PEER COMPARISON:
Name 3–5 REAL people who operate in the same professional space as ${client.name}. Don't use 
generic "Industry Leader A" — use actual named individuals who your training data knows about.
Compare visibility, LinkedIn following, media coverage, thought leadership output specifically.

SECTION 8 — KEY QUESTIONS (7 answers, all specific):
Q1 Identity Architecture: Is ${client.name} known as [Primary Identity] or [Secondary Identity]? 
   Be declarative. If genuinely unknown, say "The internet has not yet formed a clear identity 
   association for this person."
Q2 Search results: What % of Google results appear in what context?
Q3 Expert cited vs mentioned: Are they quoted as an expert source, or only mentioned in passing?
Q4 Thought leadership: Name what exists or state specifically what is absent
Q5 Competitive position: Compare to 2 named peers with specific visibility data
Q6 Crisis: Any negative content, controversies, adjacent risk signals?
Q7 Global reach: India-only, regional, or global recognition?

SECTION 9 — RISK ASSESSMENT (8 authority layers minimum):
Real layers to include: Business Leadership Visibility, Thought Leadership Voice, 
Expert Citation Rate, Social Platform Authority, Wikipedia/Search Anchor, 
Conference/Speaking Presence, Op-Ed/Publishing Record, AI Discoverability, 
Crisis Proximity, Competitive Visibility Gap

SECTION 10 — REPUTATION DIAGNOSIS:
The headline must be specific to ${client.name}. It should capture their precise situation 
in one sentence. Like: "A filmmaker-turned-technologist with genuine intellectual range but 
a near-invisible public narrative — the market does not yet know what to make of Niddhish Puuzhakkal."

The narrative (4–5 sentences) must synthesise everything: the gap between who they are and 
how they appear online, why that gap exists, what it costs them, and why now is the moment 
to close it.

Return ONLY the JSON object. No other text.`;

  return { systemPrompt, userPrompt };
}
