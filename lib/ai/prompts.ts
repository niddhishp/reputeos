/**
 * AI Prompts for ReputeOS
 * 
 * This module contains all AI prompts used throughout the application.
 * Centralizing prompts makes them easier to maintain and iterate on.
 */

import { ContentPlatform } from '@/types/content';
import { PersonalArchetype } from '@/types/archetype';

// =============================================================================
// Content Generation Prompts
// =============================================================================

export interface ContentGenerationContext {
  archetype: PersonalArchetype;
  contentPillars: string[];
  voiceCharacteristics: {
    tone: string;
    formality: string;
    sentenceStyle: string;
    vocabularyLevel: string;
  };
  topic: string;
  platform: ContentPlatform;
  targetAudience?: string;
  keyPoints?: string[];
  callToAction?: string;
}

/**
 * Build system prompt for content generation
 */
export function buildContentSystemPrompt(context: ContentGenerationContext): string {
  const {
    archetype,
    contentPillars,
    voiceCharacteristics,
    targetAudience = 'professional audience',
  } = context;

  return `You are an elite executive ghostwriter specializing in personal branding and thought leadership content.

ARCHETYPE: ${archetype}
This archetype shapes how the content should feel and what emotional response it should evoke.

CONTENT PILLARS: ${contentPillars.join(', ')}
All content must align with one or more of these pillars.

VOICE CHARACTERISTICS:
- Tone: ${voiceCharacteristics.tone}
- Formality: ${voiceCharacteristics.formality}
- Sentence Style: ${voiceCharacteristics.sentenceStyle}
- Vocabulary Level: ${voiceCharacteristics.vocabularyLevel}

TARGET AUDIENCE: ${targetAudience}

GUIDELINES:
1. Write in first person as if the executive is speaking directly
2. Avoid generic business platitudes and buzzwords
3. Include specific insights, stories, or examples
4. Make it authentic and personal
5. End with a clear takeaway or question to engage readers
6. Match the platform's native format and style
7. Maintain consistency with the defined voice characteristics

Do not use phrases like "In today's fast-paced world" or "In conclusion" unless specifically appropriate for the archetype.`;
}

/**
 * Build user prompt for content generation
 */
export function buildContentUserPrompt(context: ContentGenerationContext): string {
  const {
    topic,
    platform,
    keyPoints = [],
    callToAction,
  } = context;

  const platformGuidelines: Record<ContentPlatform, string> = {
    linkedin: 'Write a professional LinkedIn post (150-300 words). Use short paragraphs, bullet points where appropriate, and 3-5 relevant hashtags at the end.',
    twitter: 'Write a Twitter/X thread (5-10 tweets). Each tweet must be under 280 characters. Number the tweets (1/10, 2/10, etc.). Make it punchy and shareable.',
    medium: 'Write a Medium-style article (800-1200 words). Use a compelling headline, subheadings, and a narrative structure. Include a strong opening hook.',
    op_ed: 'Write an opinion editorial (600-900 words). Take a clear stance, support with evidence, and address counterarguments. Professional newspaper style.',
    keynote: 'Write keynote speech content (1500-2000 words). Include stage directions in [brackets]. Structure with opening hook, 3 main points, and memorable closing.',
  };

  let prompt = `TOPIC: ${topic}

PLATFORM: ${platform}
${platformGuidelines[platform]}`;

  if (keyPoints.length > 0) {
    prompt += `\n\nKEY POINTS TO INCLUDE:\n${keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}`;
  }

  if (callToAction) {
    prompt += `\n\nCALL TO ACTION: ${callToAction}`;
  }

  prompt += `\n\nGenerate the content now, following all guidelines and maintaining the voice characteristics.`;

  return prompt;
}

// =============================================================================
// NLP Compliance Analysis Prompts
// =============================================================================

export interface NLPAnalysisContext {
  content: string;
  platform: ContentPlatform;
}

export interface NLPAnalysisResult {
  score: number;
  violations: Array<{
    type: string;
    text: string;
    suggestion: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  strengths: string[];
  improvements: string[];
}

/**
 * Build prompt for NLP compliance analysis
 */
export function buildNLPAnalysisPrompt(context: NLPAnalysisContext): string {
  const { content, platform } = context;

  return `Analyze the following ${platform} content for NLP (Natural Language Processing) compliance and engagement optimization.

CONTENT TO ANALYZE:
"""
${content}
"""

Evaluate the content on these dimensions:
1. CLARITY: Is the message clear and easy to understand?
2. SPECIFICITY: Does it avoid vague generalizations?
3. EMOTIONAL RESONANCE: Will it connect with readers emotionally?
4. ACTIONABILITY: Does it provide clear takeaways or next steps?
5. AUTHENTICITY: Does it sound genuine and personal?
6. ENGAGEMENT POTENTIAL: Will it encourage likes, comments, and shares?
7. PLATFORM FIT: Is it optimized for ${platform}?

Provide your analysis in this JSON format:
{
  "score": <number 0-100>,
  "violations": [
    {
      "type": "clarity|specificity|emotion|action|authenticity|engagement|platform",
      "text": "the problematic text",
      "suggestion": "how to improve it",
      "severity": "low|medium|high"
    }
  ],
  "strengths": ["what works well"],
  "improvements": ["specific suggestions for improvement"]
}`;
}

// =============================================================================
// Influencer DNA Analysis Prompts
// =============================================================================

export interface DNAAnalysisContext {
  contentSamples: string[];
  platform: ContentPlatform;
}

export interface DNAAnalysisResult {
  archetype: PersonalArchetype;
  voiceCharacteristics: {
    tone: string;
    formality: string;
    sentenceStyle: string;
    vocabularyLevel: string;
  };
  contentPillars: string[];
  recurringThemes: string[];
  writingPatterns: string[];
  emotionalTriggers: string[];
}

/**
 * Build prompt for influencer DNA analysis
 */
export function buildDNAAnalysisPrompt(context: DNAAnalysisContext): string {
  const { contentSamples, platform } = context;

  return `Analyze the following content samples from a ${platform} influencer to extract their "content DNA" - the unique characteristics that define their personal brand.

CONTENT SAMPLES:
${contentSamples.map((sample, i) => `--- SAMPLE ${i + 1} ---\n${sample}`).join('\n\n')}

Analyze and extract:
1. PERSONAL ARCHETYPE: What archetype best describes this creator? (e.g., Visionary, Mentor, Disruptor, Storyteller, Analyst, etc.)
2. VOICE CHARACTERISTICS:
   - Tone (e.g., authoritative, conversational, inspirational)
   - Formality level (casual, professional, academic)
   - Sentence style (short and punchy, flowing and descriptive, technical)
   - Vocabulary level (simple, sophisticated, industry-specific)
3. CONTENT PILLARS: What are the 3-5 recurring topics or themes?
4. RECURRING THEMES: What ideas or concepts appear frequently?
5. WRITING PATTERNS: What structural or stylistic patterns do you notice?
6. EMOTIONAL TRIGGERS: What emotions does the content typically evoke?

Provide your analysis in this JSON format:
{
  "archetype": "string",
  "voiceCharacteristics": {
    "tone": "string",
    "formality": "string",
    "sentenceStyle": "string",
    "vocabularyLevel": "string"
  },
  "contentPillars": ["string"],
  "recurringThemes": ["string"],
  "writingPatterns": ["string"],
  "emotionalTriggers": ["string"]
}`;
}

// =============================================================================
// LSI Gap Analysis Prompts
// =============================================================================

export interface LSIGapContext {
  currentScores: {
    c1: number;
    c2: number;
    c3: number;
    c4: number;
    c5: number;
    c6: number;
  };
  targetScores: {
    c1: number;
    c2: number;
    c3: number;
    c4: number;
    c5: number;
    c6: number;
  };
  clientName: string;
  industry: string;
}

export interface GapRecommendation {
  component: string;
  currentScore: number;
  targetScore: number;
  gap: number;
  priority: number;
  actions: string[];
  timeline: string;
}

/**
 * Build prompt for LSI gap analysis
 */
export function buildLSIGapPrompt(context: LSIGapContext): string {
  const { currentScores, targetScores, clientName, industry } = context;

  const componentNames: Record<string, string> = {
    c1: 'Search Reputation',
    c2: 'Media Framing',
    c3: 'Social Backlash',
    c4: 'Elite Discourse',
    c5: 'Third-Party Validation',
    c6: 'Crisis Moat',
  };

  const gaps = Object.keys(currentScores).map(key => ({
    component: key,
    name: componentNames[key],
    current: currentScores[key as keyof typeof currentScores],
    target: targetScores[key as keyof typeof targetScores],
    gap: targetScores[key as keyof typeof targetScores] - currentScores[key as keyof typeof currentScores],
  }));

  return `Analyze the LSI (Legitimacy & Sentiment Index) gaps for ${clientName} in the ${industry} industry and provide strategic recommendations.

CURRENT SCORES:
${gaps.map(g => `- ${g.name}: ${g.current}/${g.target} (gap: ${g.gap})`).join('\n')}

COMPONENT DEFINITIONS:
- Search Reputation: Google results sentiment & frame distribution
- Media Framing: Journalist quotes & expert positioning
- Social Backlash: Social media sentiment & volume
- Elite Discourse: Industry leader mentions & citations
- Third-Party Validation: Awards, rankings & analyst coverage
- Crisis Moat: Resilience & narrative defense

For each component with a gap > 0, provide:
1. Priority ranking (1 = highest)
2. Specific, actionable recommendations
3. Realistic timeline for improvement
4. Expected impact

Provide your analysis in this JSON format:
{
  "recommendations": [
    {
      "component": "string",
      "currentScore": number,
      "targetScore": number,
      "gap": number,
      "priority": number,
      "actions": ["string"],
      "timeline": "string",
      "expectedImpact": "string"
    }
  ],
  "overallStrategy": "string"
}`;
}

// =============================================================================
// Discover Mentions Analysis Prompts
// =============================================================================

export interface MentionAnalysisContext {
  mentions: Array<{
    source: string;
    snippet: string;
    url?: string;
  }>;
  clientName: string;
}

export interface MentionAnalysisResult {
  overallSentiment: 'positive' | 'neutral' | 'negative';
  sentimentScore: number;
  frames: Array<{
    frame: string;
    count: number;
    examples: string[];
  }>;
  keyThemes: string[];
  risks: string[];
  opportunities: string[];
}

/**
 * Build prompt for mentions analysis
 */
export function buildMentionsAnalysisPrompt(context: MentionAnalysisContext): string {
  const { mentions, clientName } = context;

  return `Analyze the following online mentions of ${clientName} to extract sentiment, framing, and strategic insights.

MENTIONS:
${mentions.map((m, i) => `--- MENTION ${i + 1} ---
Source: ${m.source}
${m.url ? `URL: ${m.url}` : ''}
Snippet: ${m.snippet}`).join('\n\n')}

Analyze and provide:
1. OVERALL SENTIMENT: positive, neutral, or negative (with score -1 to 1)
2. FRAMES: What narrative frames are being used? (e.g., expert, family person, disruptor, etc.)
3. KEY THEMES: What topics appear most frequently?
4. RISKS: Any potential reputation risks identified?
5. OPPORTUNITIES: Any opportunities for reputation enhancement?

Provide your analysis in this JSON format:
{
  "overallSentiment": "positive|neutral|negative",
  "sentimentScore": number,
  "frames": [
    {
      "frame": "string",
      "count": number,
      "examples": ["string"]
    }
  ],
  "keyThemes": ["string"],
  "risks": ["string"],
  "opportunities": ["string"]
}`;
}
