/**
 * Discovery Module — 10 Agents + Verification Layer + Synthesis
 *
 * FINAL ENTERPRISE ARCHITECTURE
 *
 * Pipeline
 *
 * 1 PRE-AGENT INTELLIGENCE COMPILER
 * 2 10 PARALLEL ANALYSIS AGENTS
 * 3 POST-AGENT VERIFICATION LAYER
 * 4 SYNTHESIS AGENT
 */

import { runAgents, runSynthesisAgent, buildClientContext, type Agent } from '../agents';
import type { DiscoveryReport, DiscoveryReportInput } from '@/app/api/discover/sources/discovery-report-prompt';

// Inferred return type of compileEvidence — used by synthesis function
type CompiledEvidenceGraph = ReturnType<typeof compileEvidence>;




/* ─────────────────────────────────────────────
ANTI-HALLUCINATION SYSTEM PROMPT
──────────────────────────────────────────── */

const SYS = (name: string, company: string) =>
`You are an Intelligence Analyst producing part of a discovery report.

Subject: ${name}
Context: ${company}

STRICT RULES

Use ONLY supplied evidence.

Evidence sources:
• compiled evidence graph
• scan results
• provided client profile

If something is not evidenced:

Say:
"not evidenced in the scan"
or
"limited coverage detected"

NEVER invent:

titles
events
companies
awards
articles
followers
statistics

Use calm neutral tone.

Prefer:

• "limited signals detected"
• "evidence suggests"
• "coverage appears concentrated"

Return ONLY JSON.
`;



/* ─────────────────────────────────────────────
INTELLIGENCE COMPILER
──────────────────────────────────────────── */

function compileEvidence(input: DiscoveryReportInput) {

const mentions = input.top_mentions || []

const domains:Record<string,number>={}
const sources:Record<string,number>={}
const categories:Record<string,number>={}
const keywords:Record<string,number>={}

const normalized:any[]=[]

for(const m of mentions){

const domain = m.url ? new URL(m.url).hostname.replace('www.','') : 'unknown'

domains[domain]=(domains[domain]||0)+1
sources[m.source||'unknown']=(sources[m.source||'unknown']||0)+1
categories[m.category||'search']=(categories[m.category||'search']||0)+1

const text = `${m.title||''} ${m.snippet||''}`.toLowerCase()

text.split(/\s+/).forEach(t=>{
if(t.length>3) keywords[t]=(keywords[t]||0)+1
})

normalized.push({
title:m.title,
url:m.url,
domain,
category:m.category||'search',
source:m.source||'unknown'
})

}

return{
total_results:mentions.length,
unique_domains:Object.keys(domains).length,
domain_distribution:domains,
source_distribution:sources,
category_distribution:categories,
top_keywords:Object.entries(keywords).sort((a,b)=>b[1]-a[1]).slice(0,15),
normalized_results:normalized
}

}



/* ─────────────────────────────────────────────
BUILD AGENTS
──────────────────────────────────────────── */

export function buildDiscoveryAgents(input: DiscoveryReportInput, compiled:any):Agent[]{

const ctx=buildClientContext(input.client)
const sys=SYS(input.client.name,input.client.company)

const fullContext=`
${ctx}

COMPILED EVIDENCE GRAPH
${JSON.stringify(compiled,null,2)}

RAW SCAN RESULTS
${JSON.stringify(input.top_mentions||[],null,2).slice(0,5000)}
`

return[


/* PROFILE */

{
id:'profile_overview',
label:'Profile Intelligence',
maxTokens:1200,
systemPrompt:sys,
userPrompt:`${fullContext}

Return JSON:

{
"profile_overview":{
"identity_headline":"",
"current_position":"",
"primary_role":"",
"location":"",
"digital_presence_summary":""
}
}`
},



/* CAREER */

{
id:'career_analysis',
label:'Career Analysis',
maxTokens:1500,
systemPrompt:sys,
userPrompt:`${fullContext}

Return JSON:

{
"career_analysis":{
"career_summary":"",
"trajectory":[],
"achievements":[]
}
}`
},



/* SEARCH */

{
id:'search_presence',
label:'Search Presence',
maxTokens:1400,
systemPrompt:sys,
userPrompt:`${fullContext}

Return JSON:

{
"search_presence":{
"search_visibility_level":"",
"dominant_associations":[],
"search_summary":""
}
}`
},



/* MEDIA */

{
id:'media_analysis',
label:'Media Analysis',
maxTokens:1400,
systemPrompt:sys,
userPrompt:`${fullContext}

Return JSON:

{
"media_analysis":{
"media_visibility":"",
"dominant_frames":[],
"media_summary":""
}
}`
},



/* SOCIAL */

{
id:'social_presence',
label:'Social Presence',
maxTokens:1400,
systemPrompt:sys,
userPrompt:`${fullContext}

Return JSON:

{
"social_presence":{
"platforms_detected":[],
"activity_level":"",
"social_summary":""
}
}`
},



/* THOUGHT */

{
id:'thought_leadership',
label:'Thought Leadership',
maxTokens:1400,
systemPrompt:sys,
userPrompt:`${fullContext}

Return JSON:

{
"thought_leadership":{
"signals_detected":[],
"thought_leadership_summary":""
}
}`
},



/* COMPETITION */

{
id:'competitive_positioning',
label:'Competitive Positioning',
maxTokens:1400,
systemPrompt:sys,
userPrompt:`${fullContext}

Return JSON:

{
"competitive_positioning":{
"relative_visibility":"",
"positioning_summary":""
}
}`
},



/* AUTHORITY */

{
id:'authority_signals',
label:'Authority Signals',
maxTokens:1400,
systemPrompt:sys,
userPrompt:`${fullContext}

Return JSON:

{
"authority_signals":{
"credibility_indicators":[],
"authority_summary":""
}
}`
},



/* NARRATIVE */

{
id:'narrative_opportunity',
label:'Narrative Opportunity',
maxTokens:1400,
systemPrompt:sys,
userPrompt:`${fullContext}

Return JSON:

{
"narrative_opportunity":{
"visibility_gaps":[],
"opportunities":[]
}
}`
},



/* RISK */

{
id:'risk_signals',
label:'Risk Signals',
maxTokens:1400,
systemPrompt:sys,
userPrompt:`${fullContext}

Return JSON:

{
"risk_signals":{
"sensitivity_indicators":[],
"risk_summary":""
}
}`
}

]

}



/* ─────────────────────────────────────────────
POST AGENT VERIFICATION LAYER
──────────────────────────────────────────── */

function verifyAgentOutputs(outputs:Record<string,any>,compiled:any){

const evidenceText = JSON.stringify(compiled).toLowerCase()

const verification:any={}

for(const [agent,result] of Object.entries(outputs)){

const text = JSON.stringify(result).toLowerCase()

const unsupported:string[]=[]

text.split(/\s+/).forEach(word=>{
if(word.length>12 && !evidenceText.includes(word)){
unsupported.push(word)
}
})

verification[agent]={
unsupported_terms:unsupported.slice(0,10),
verification_status:unsupported.length>5?'review':'ok'
}

}

return verification

}



/* ─────────────────────────────────────────────
SYNTHESIS
──────────────────────────────────────────── */

export async function runDiscoverySynthesis(
  agentOutputs: Record<string, unknown>,
  client: DiscoveryReportInput['client'],
  input: DiscoveryReportInput,
  compiledGraph?: CompiledEvidenceGraph
): Promise<Pick<DiscoveryReport, 'risk_assessment' | 'reputation_diagnosis'>> {
  const graph = compiledGraph ?? compileEvidence(input);

  return runSynthesisAgent(
    Object.entries(agentOutputs).map(([id, output]) => ({
      id,
      label: id,
      output: (output ?? {}) as Record<string, unknown>,
      ok: true,
      durationMs: 0,
    })),
    {
      systemPrompt: `You are the Lead Discovery Analyst synthesising the final report for ${client.name}.

You have outputs from 10 specialist agents plus a compiled evidence graph.

Important rules:
• Use calm strategic language
• Do not introduce new facts
• Ground conclusions in agent outputs and compiled evidence only
• If evidence is limited, say so without sounding accusatory
• Prefer language of opportunity, concentration, development, and visibility over harsh diagnosis

Return ONLY valid JSON.`,
      buildUserPrompt: (outputs) => `COMPILED EVIDENCE GRAPH:
${JSON.stringify(graph, null, 2).slice(0, 6000)}

AGENT INTELLIGENCE:
${JSON.stringify(outputs, null, 2).slice(0, 9000)}

Return JSON:
{
  "risk_assessment": {
    "layers": [],
    "overall_risk_level": "",
    "primary_risk_type": ""
  },
  "reputation_diagnosis": {
    "headline": "",
    "narrative": "",
    "strengths": [],
    "vulnerabilities": [],
    "opportunity_signal": "",
    "sre_opportunity_rating": ""
  }
}`
    },
    { maxTokens: 2800, timeoutMs: 90_000 }
  ) as Promise<Pick<DiscoveryReport, 'risk_assessment' | 'reputation_diagnosis'>>;
}

/* ─────────────────────────────────────────────
ORCHESTRATOR
──────────────────────────────────────────── */

export async function generateDiscoveryReportAgentically(input:DiscoveryReportInput):Promise<DiscoveryReport>{

console.log('Compiling evidence')

const compiled = compileEvidence(input)

console.log('Running agents')

const agents = buildDiscoveryAgents(input,compiled)

const {merged,failedAgents,totalDurationMs}=await runAgents(agents)

console.log('Verifying outputs')

const verification = verifyAgentOutputs(merged,compiled)

console.log('Synthesising report')

const synthesis = await runDiscoverySynthesis(merged as Record<string,unknown>, input.client, input, compiled)

return{
...(merged as Partial<DiscoveryReport>),
...synthesis,
generated_at:new Date().toISOString()
} as DiscoveryReport

}
