/**
 * Shield Module — 4 Parallel Agents
 * Crisis detection, competitor tracking, sentiment/narrative monitoring, response playbooks
 */
import { runAgents, buildClientContext } from '../agents';

export interface ShieldInput {
  client: { name: string; role?: string; company?: string; industry?: string };
  recentAlerts?: Array<{ type: string; severity: string; message: string; created_at: string }>;
  competitors?: Array<{ name: string; company?: string }>;
  mentionVolume?: { current: number; baseline: number; change_pct: number };
  currentSentiment?: number;
}

const SYS = (name: string) => `
You are a Senior Reputation Defense Strategist operating inside a real-time reputation intelligence and crisis monitoring system.

Your responsibility is to monitor, assess, and protect the public reputation of:
${name}

You operate with the mindset of a senior strategist at a top-tier crisis communications advisory firm.

Your analysis must be:
• evidence-driven and risk-calibrated
• specific and actionable
• professionally worded
• calm and non-alarmist
• appropriate for executive decision-making

You must never exaggerate risk or invent threats.
If signals are weak or uncertain, classify them as early-warning indicators — not active crises.

Always distinguish between:
• confirmed threats
• emerging signals
• background noise

When recommending actions, prioritise proportional responses.
Avoid language that could unnecessarily alarm the client.
Respond ONLY with valid JSON.
`.trim();

export function buildShieldAgents(input: ShieldInput) {
  const { client, recentAlerts, competitors, mentionVolume, currentSentiment } = input;
  const ctx = buildClientContext(client);
  const alertsCtx = recentAlerts?.length
    ? `\nRecent alerts: ${recentAlerts.slice(0, 5).map(a => `[${a.severity}] ${a.message}`).join(' | ')}`
    : '';
  const volumeCtx = mentionVolume
    ? `\nMention volume: ${mentionVolume.current} (${mentionVolume.change_pct > 0 ? '+' : ''}${mentionVolume.change_pct}% vs baseline ${mentionVolume.baseline})`
    : '';
  const sys = SYS(client.name);

  return [

    /* ── AGENT 1: Crisis Detection ─────────────────────────────────── */
    {
      id: 'crisis_detection',
      label: 'Crisis Detection Agent',
      maxTokens: 1500,
      fallback: {
        crisis_detection: {
          risk_level: 'Clear',
          active_threats: [],
          risk_summary: 'No active threats detected. Analysis pending.',
          monitoring_status: 'Active',
          early_warning_signals: [],
        },
      },
      systemPrompt: `${sys}\n\nYour job: Assess current crisis risk level. Classify and prioritise threats. Distinguish confirmed threats from early warning signals from background noise.`,
      userPrompt: `${ctx}${alertsCtx}${volumeCtx}
Current sentiment: ${currentSentiment ?? 'unknown'}

Return JSON:
{"crisis_detection":{"risk_level":"Critical|High|Moderate|Low|Clear","active_threats":[{"type":"Volume Spike|Sentiment Drop|Keyword Alert|Media Attack|Regulatory Signal|Social Pile-on","severity":"Critical|High|Moderate|Low","description":"specific description of the threat","source":"where this signal is occurring","momentum":"Rising|Stable|Fading","recommended_action":"specific proportional action"}],"risk_summary":"paragraph: overall risk picture — what is the current state, what warrants attention","monitoring_status":"Active|Degraded|Offline","early_warning_signals":["specific signal worth watching — not yet a threat"]}}`,
    },

    /* ── AGENT 2: Competitor Intelligence ───────────────────────────── */
    {
      id: 'competitor_intelligence',
      label: 'Competitor Tracker Agent',
      maxTokens: 1500,
      fallback: {
        competitor_intelligence: {
          landscape_assessment: 'Competitor analysis pending.',
          competitors: [],
          share_of_voice_estimate: 'Insufficient data.',
          strategic_recommendation: 'Rescan to generate recommendations.',
        },
      },
      systemPrompt: `${sys}\n\nYour job: Monitor the competitive reputation landscape. Identify competitor visibility spikes, reputation-building campaigns, earned media wins, narrative framing advantages, and share-of-voice threats. Identify both threats to ${client.name}'s visibility and strategic opportunities. Never fabricate competitor actions.`,
      userPrompt: `${ctx}
Competitors to track: ${competitors?.map(c => `${c.name}${c.company ? ` (${c.company})` : ''}`).join(', ') || 'identify top 3-4 peers in sector'}

Return JSON:
{"competitor_intelligence":{"landscape_assessment":"paragraph: overall competitive reputation landscape in this sector","competitors":[{"name":"competitor name","recent_activity":"what they have been doing reputationally — media, content, partnerships, appearances","visibility_momentum":"Rising|Stable|Declining","threat_level":"High|Medium|Low","strategic_implication":"what this means for ${client.name}'s positioning","opportunity":"what ${client.name} can do in response or to differentiate"}],"share_of_voice_estimate":"${client.name}'s estimated share of voice vs peers in this sector","strategic_recommendation":"single most important competitive positioning action"}}`,
    },

    /* ── AGENT 3: Sentiment & Narrative Monitoring ───────────────────── */
    {
      id: 'sentiment_trends',
      label: 'Sentiment Monitor Agent',
      maxTokens: 1200,
      fallback: {
        sentiment_trends: {
          current_sentiment_score: currentSentiment ?? 0,
          trend: 'Stable',
          volatility_level: 'Low',
          drift_detected: false,
          dominant_narratives: [],
          narrative_analysis: 'Sentiment analysis pending.',
          forecast: 'Insufficient data for forecast.',
          early_intervention: 'No intervention required at this time.',
        },
      },
      systemPrompt: `${sys}\n\nYour role: Analyse sentiment and narrative direction. Focus not just on sentiment scores but on narrative drift — are the dominant narratives about this person shifting? Distinguish between temporary sentiment noise, sustained narrative drift, and coordinated criticism. Forecast likely trajectory over the next 30 days.`,
      userPrompt: `${ctx}${volumeCtx}
Current sentiment score: ${currentSentiment ?? 'unknown'}
${alertsCtx}

Return JSON:
{"sentiment_trends":{"current_sentiment_score":${currentSentiment ?? 0},"trend":"Improving|Stable|Declining|Volatile","volatility_level":"High|Medium|Low","drift_detected":false,"dominant_narratives":["narrative theme currently circulating — grounded in signals"],"narrative_analysis":"paragraph: what does the current sentiment and narrative picture tell us? What frames are gaining or losing ground?","forecast":"what is the likely trajectory over the next 30 days based on current signals?","early_intervention":"if any trend is concerning, what should be done NOW before it escalates?"}}`,
    },

    /* ── AGENT 4: Response Playbooks ────────────────────────────────── */
    {
      id: 'response_playbooks',
      label: 'Crisis Response Architect',
      maxTokens: 2500,
      fallback: {
        response_playbooks: [],
      },
      systemPrompt: `${sys}\n\nYou are the Crisis Response Architect. Your role is to design actionable response playbooks for the most plausible reputation threat scenarios.

Each playbook must include:
• clear activation trigger
• severity classification
• immediate response steps
• internal coordination actions
• external messaging guidance
• channel strategy
• escalation timeline

Playbooks should assume realistic operational timelines. Actions must be specific and executable. Avoid vague advice.`,
      userPrompt: `${ctx}${alertsCtx}
Industry: ${client.industry || 'not specified'}

Design 3-4 playbooks for the most plausible crisis scenarios in ${client.industry || 'this sector'}.

Return JSON:
{"response_playbooks":[{"scenario":"specific scenario name e.g. 'Regulatory Investigation Leak'","trigger":"what signal or event activates this playbook","severity":"Critical|High|Moderate","risk_description":"what is at stake if this scenario unfolds","immediate_actions":["action to take within 1 hour","action to take within 4 hours","action to take within 24 hours"],"internal_alignment":["specific internal team or function to align e.g. Legal","PR agency","Leadership"],"messaging_framework":{"acknowledge":"what to say publicly — honest, proportional acknowledgement","context":"what context to add to prevent misinterpretation","action":"what action to announce you are taking"},"channels":["which channels to activate e.g. press statement","LinkedIn post","direct media outreach"],"timeline":"how long this playbook runs from activation to resolution","success_indicator":"how you know the crisis is contained"}]}`,
    },

  ];
}

export async function generateShieldIntelligenceAgentically(input: ShieldInput) {
  console.log('[Shield Agents] Starting 4 parallel agents for', input.client.name);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const agents = buildShieldAgents(input) as any[];
  const { merged, totalDurationMs, failedAgents } = await runAgents(agents);
  console.log(`[Shield Agents] Done in ${totalDurationMs}ms. Failed: ${failedAgents.join(',') || 'none'}`);
  return merged;
}
