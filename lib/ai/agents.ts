/**
 * ReputeOS Multi-Agent Orchestrator
 *
 * Pattern:
 *   1. Define N agents (each with a focused prompt + bounded output schema)
 *   2. runAgents() fires all in parallel
 *   3. Results are typed, merged, and returned
 *   4. Optional synthesis agent receives all outputs for final narrative
 *
 * Each agent does ONE job well. No agent knows about others.
 * Synthesis agent gets a JSON summary of all agent outputs.
 */

import { callAI, parseAIJson } from './call';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Agent<T = Record<string, unknown>> {
  id: string;                  // e.g. 'profile_intelligence'
  label: string;               // e.g. 'Profile Intelligence Agent'
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;          // default 2500
  timeoutMs?: number;          // default 90_000
  temperature?: number;        // default 0.3
  model?: 'fast' | 'smart';    // default 'smart'
  fallback?: T;                // returned if agent fails
}

export interface AgentResult<T = Record<string, unknown>> {
  id: string;
  label: string;
  output: T;
  ok: boolean;
  error?: string;
  durationMs: number;
}

export interface RunAgentsResult<T = Record<string, unknown>> {
  results: AgentResult<T>[];
  merged: Partial<T>;           // all successful outputs merged (shallow)
  failedAgents: string[];
  totalDurationMs: number;
  allOk: boolean;
}

// ── Core Orchestrator ─────────────────────────────────────────────────────────

export async function runAgents<T = Record<string, unknown>>(
  agents: Agent<T>[]
): Promise<RunAgentsResult<T>> {
  const start = Date.now();

  console.log(`[Agents] Starting ${agents.length} agents in parallel: ${agents.map(a => a.id).join(', ')}`);

  const results: AgentResult<T>[] = await Promise.all(
    agents.map(async (agent): Promise<AgentResult<T>> => {
      const agentStart = Date.now();
      try {
        const result = await callAI({
          systemPrompt: agent.systemPrompt,
          userPrompt:   agent.userPrompt,
          json:         true,
          maxTokens:    agent.maxTokens  ?? 2500,
          timeoutMs:    agent.timeoutMs  ?? 90_000,
          temperature:  agent.temperature ?? 0.3,
          model:        agent.model      ?? 'smart',
        });

        const parsed = parseAIJson<T>(result.content);
        const durationMs = Date.now() - agentStart;
        console.log(`[Agents] ✓ ${agent.id} completed in ${durationMs}ms (${result.content.length} chars)`);

        return { id: agent.id, label: agent.label, output: parsed, ok: true, durationMs };
      } catch (e) {
        const durationMs = Date.now() - agentStart;
        const error = e instanceof Error ? e.message : String(e);
        console.error(`[Agents] ✗ ${agent.id} failed in ${durationMs}ms: ${error}`);

        return {
          id: agent.id,
          label: agent.label,
          output: (agent.fallback ?? {}) as T,
          ok: false,
          error,
          durationMs,
        };
      }
    })
  );

  // Merge all successful outputs
  const merged: Partial<T> = {};
  for (const r of results) {
    if (r.ok) Object.assign(merged as object, r.output);
  }

  const failedAgents = results.filter(r => !r.ok).map(r => r.id);
  const totalDurationMs = Date.now() - start;

  console.log(`[Agents] Done in ${totalDurationMs}ms. Failed: ${failedAgents.length > 0 ? failedAgents.join(', ') : 'none'}`);

  return {
    results,
    merged,
    failedAgents,
    totalDurationMs,
    allOk: failedAgents.length === 0,
  };
}

// ── Synthesis Agent ───────────────────────────────────────────────────────────
// Receives all agent outputs and produces a final synthesized narrative.

export async function runSynthesisAgent<T = Record<string, unknown>>(
  agentResults: AgentResult[],
  synthesisPrompt: {
    systemPrompt: string;
    buildUserPrompt: (agentOutputs: Record<string, unknown>) => string;
  },
  options?: { maxTokens?: number; timeoutMs?: number }
): Promise<T> {
  // Build a clean summary of all agent outputs for the synthesis prompt
  const agentOutputMap: Record<string, unknown> = {};
  for (const r of agentResults) {
    if (r.ok) agentOutputMap[r.id] = r.output;
  }

  const result = await callAI({
    systemPrompt: synthesisPrompt.systemPrompt,
    userPrompt:   synthesisPrompt.buildUserPrompt(agentOutputMap),
    json:         true,
    maxTokens:    options?.maxTokens  ?? 2000,
    timeoutMs:    options?.timeoutMs  ?? 90_000,
    temperature:  0.25, // synthesis should be consistent
    model:        'smart',
  });

  return parseAIJson<T>(result.content);
}

// ── Helper: Build client context string (shared across all modules) ───────────

export function buildClientContext(client: {
  name: string;
  role?: string;
  company?: string;
  industry?: string;
  keywords?: string[];
  linkedin_url?: string;
}): string {
  return [
    `Name: ${client.name}`,
    client.role     ? `Role: ${client.role}`             : '',
    client.company  ? `Company: ${client.company}`       : '',
    client.industry ? `Industry: ${client.industry}`     : '',
    client.keywords?.length ? `Keywords: ${client.keywords.join(', ')}` : '',
    client.linkedin_url ? `LinkedIn: ${client.linkedin_url}` : '',
  ].filter(Boolean).join('\n');
}
