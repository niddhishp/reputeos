/**
 * Shield Module — 4 Parallel Agents
 * Crisis detection, competitor tracking, sentiment monitoring, response strategy
 */
import { runAgents, buildClientContext } from '../agents';

export interface ShieldInput {
  client: { name: string; role?: string; company?: string; industry?: string };
  recentAlerts?: Array<{ type: string; severity: string; message: string; created_at: string }>;
  competitors?: Array<{ name: string; company?: string }>;
  mentionVolume?: { current: number; baseline: number; change_pct: number };
  currentSentiment?: number;
}

export function buildShieldAgents(input: ShieldInput) {
  const { client, recentAlerts, competitors, mentionVolume, currentSentiment } = input;
  const ctx = buildClientContext(client);
  const alertsCtx = recentAlerts?.length ? `\nRecent alerts: ${recentAlerts.slice(0,5).map(a => `${a.severity}: ${a.message}`).join(' | ')}` : '';
  const volumeCtx = mentionVolume ? `\nMention volume: ${mentionVolume.current} (${mentionVolume.change_pct > 0 ? '+' : ''}${mentionVolume.change_pct}% vs baseline ${mentionVolume.baseline})` : '';
  const sys = `You are a Senior Crisis Communications Strategist and Reputation Defence Expert. You are monitoring and protecting ${client.name}'s reputation in real time.\nBe specific, action-oriented, and risk-calibrated. Respond with ONLY valid JSON.`;

  return [
    {
      id: 'crisis_detection',
      label: 'Crisis Detection Agent',
      maxTokens: 1500,
      systemPrompt: `${sys}\nYour job: Assess current crisis risk level. Classify threats. Prioritise.`,
      userPrompt: `${ctx}${alertsCtx}${volumeCtx}\nSentiment: ${currentSentiment ?? 'unknown'}\n\nReturn JSON:\n{"crisis_detection":{"risk_level":"Critical|High|Moderate|Low|Clear","active_threats":[{"type":"e.g. Volume Spike|Sentiment Drop|Keyword Alert","severity":"Critical|High|Moderate|Low","description":"specific description","source":"where this is occurring","recommended_action":"immediate action"}],"monitoring_status":"Active|Degraded|Offline","early_warning_signals":["signal 1","signal 2"]}}`,
    },
    {
      id: 'competitor_intelligence',
      label: 'Competitor Tracker Agent',
      maxTokens: 1500,
      systemPrompt: `${sys}\nYour job: Track competitor reputation activity and identify share-of-voice threats and opportunities.`,
      userPrompt: `${ctx}\nCompetitors to track: ${competitors?.map(c => `${c.name}${c.company ? ` (${c.company})` : ''}`).join(', ') || 'identify top 3 peers in sector'}\n\nReturn JSON:\n{"competitor_intelligence":{"landscape_assessment":"paragraph on competitive reputation landscape","competitors":[{"name":"competitor name","recent_activity":"what they have been doing reputationally","threat_level":"High|Medium|Low","opportunity":"what ${client.name} can learn or counter"}],"share_of_voice_estimate":"${client.name}'s estimated share of voice vs peers","strategic_recommendation":"one action to improve competitive position"}}`,
    },
    {
      id: 'sentiment_trends',
      label: 'Sentiment Monitor Agent',
      maxTokens: 1200,
      systemPrompt: `${sys}\nYour job: Analyse sentiment trends, identify drift, and forecast trajectory.`,
      userPrompt: `${ctx}${volumeCtx}\nCurrent sentiment: ${currentSentiment ?? 'unknown'}${alertsCtx}\n\nReturn JSON:\n{"sentiment_trends":{"current_sentiment_score":${currentSentiment ?? 0},"trend":"Improving|Stable|Declining|Volatile","drift_detected":false,"narrative":"paragraph: what does the current sentiment picture tell us?","forecast":"what is the likely trajectory over next 30 days?","early_intervention":"if a trend is concerning, what should be done now before it escalates?"}}`,
    },
    {
      id: 'response_playbooks',
      label: 'Response Strategist Agent',
      maxTokens: 2000,
      systemPrompt: `${sys}\nYour job: Build specific, actionable crisis response playbooks for the most likely threat scenarios.`,
      userPrompt: `${ctx}${alertsCtx}\nIndustry: ${client.industry || 'unknown'}\n\nBuild 3-4 playbooks for the most likely crisis scenarios in ${client.industry || 'this sector'}.\n\nReturn JSON:\n{"response_playbooks":[{"scenario":"specific scenario e.g. Regulatory Investigation Leak","trigger":"what activates this playbook","severity":"Critical|High|Moderate","immediate_actions":["action within 1 hour","action within 4 hours"],"messaging_framework":{"acknowledge":"what to say","context":"what context to add","action":"what action to announce"},"channels":["which channels to activate"],"timeline":"how long this playbook runs"}]}`,
    },
  ];
}

export async function generateShieldIntelligenceAgentically(input: ShieldInput) {
  console.log('[Shield Agents] Starting 4 parallel agents for', input.client.name);
  const agents = buildShieldAgents(input);
  const { merged, totalDurationMs, failedAgents } = await runAgents(agents);
  console.log(`[Shield Agents] Done in ${totalDurationMs}ms. Failed: ${failedAgents.join(',') || 'none'}`);
  return merged;
}
