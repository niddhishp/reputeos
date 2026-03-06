/**
 * Shield Pro — Legal Scan API
 *
 * Queries 6 legal signal categories:
 * 1. eCourts civil/criminal litigation
 * 2. SEBI regulatory orders
 * 3. MCA director/company records
 * 4. NCLT/NCLAT insolvency proceedings
 * 5. Enforcement actions (ED, CBI, IT)
 * 6. Media-sourced legal signals
 *
 * Uses SerpAPI (Google search engine) — no separate legal database subscription required.
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { callAI, parseAIJson } from '@/lib/ai/call';

interface LegalFinding {
  category: string;
  signal: string;
  severity: 'Clear' | 'Low' | 'Moderate' | 'High' | 'Critical';
  source: string;
  url?: string;
  date?: string;
  summary: string;
}

interface LegalScanResult {
  legal_risk_score: number;  // 0–100 (100 = completely clean)
  overall_status: 'Clean' | 'Minor Flags' | 'Material Risk' | 'Critical Exposure';
  scan_date: string;
  categories: {
    ecourts_litigation:   { status: string; findings: LegalFinding[]; score: number };
    sebi_regulatory:      { status: string; findings: LegalFinding[]; score: number };
    mca_corporate:        { status: string; findings: LegalFinding[]; score: number };
    nclt_insolvency:      { status: string; findings: LegalFinding[]; score: number };
    enforcement_actions:  { status: string; findings: LegalFinding[]; score: number };
    media_legal_signals:  { status: string; findings: LegalFinding[]; score: number };
  };
  clean_certificate: boolean;
  strategic_implications: string;
  recommended_actions: string[];
  disclaimer: string;
}

const SERPAPI_KEY = () => process.env.SERPAPI_KEY ?? process.env.SERP_API_KEY ?? '';

async function serpSearch(query: string): Promise<Array<{ title: string; snippet: string; link: string }>> {
  const key = SERPAPI_KEY();
  if (!key) return [];

  try {
    const params = new URLSearchParams({
      engine: 'google',
      q: query,
      num: '10',
      hl: 'en',
      gl: 'in',
      api_key: key,
    });
    const res = await fetch(`https://serpapi.com/search.json?${params}`, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) return [];
    const data = await res.json() as { organic_results?: Array<{ title: string; snippet: string; link: string }> };
    return data.organic_results?.slice(0, 8) ?? [];
  } catch {
    return [];
  }
}

function buildLegalQueries(name: string, company?: string) {
  const n  = `"${name}"`;
  const co = company ? `"${company}"` : '';

  return {
    ecourts: [
      `${n} court case India`,
      `${n} lawsuit India`,
      `${n} civil suit High Court`,
      `${n} criminal case India FIR`,
      co ? `${co} litigation court` : `${n} arbitration India`,
    ],
    sebi: [
      `${n} SEBI order`,
      `${n} SEBI notice India`,
      co ? `${co} SEBI enforcement` : `${n} securities violation India`,
      `${n} stock market violation India`,
    ],
    mca: [
      `${n} director MCA India`,
      `${n} company ROC filing`,
      co ? `${co} MCA company status` : `${n} struck off company director`,
      `${n} DIN director disqualified`,
    ],
    nclt: [
      `${n} NCLT insolvency`,
      `${n} NCLAT India`,
      co ? `${co} insolvency petition` : `${n} IBC filing India`,
      `${n} winding up petition India`,
    ],
    enforcement: [
      `${n} ED enforcement directorate`,
      `${n} income tax raid India`,
      `${n} CBI India`,
      `${n} money laundering India`,
      co ? `${co} enforcement action` : `${n} FEMA violation India`,
    ],
    media: [
      `${n} legal trouble India`,
      `${n} fraud allegation India`,
      `${n} controversy dispute India`,
      `${n} settlement legal India`,
      `${n} accused charged India`,
    ],
  };
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Check plan — Agency/Enterprise only
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('plan')
      .eq('id', user.id)
      .single();

    const plan = profile?.plan ?? 'solo';
    if (!['agency', 'enterprise'].includes(plan)) {
      return Response.json({
        error: 'Shield Pro requires Agency or Enterprise plan.',
        upgrade_url: '/pricing',
      }, { status: 403 });
    }

    const { clientId } = await req.json() as { clientId: string };
    if (!clientId) return Response.json({ error: 'clientId required' }, { status: 400 });

    // Fetch client
    const { data: client } = await supabase
      .from('clients')
      .select('id, name, company, role, industry')
      .eq('id', clientId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!client) return Response.json({ error: 'Client not found' }, { status: 404 });

    // Save scan as in_progress
    const { data: scanRow } = await supabase
      .from('legal_scans')
      .insert({ client_id: clientId, status: 'in_progress' })
      .select('id')
      .single();

    const scanId = scanRow?.id;

    // Run all query categories in parallel
    const queries = buildLegalQueries(client.name, client.company);

    const [eCourtsResults, sebiResults, mcaResults, ncltResults, enfResults, mediaResults] = await Promise.all([
      Promise.all(queries.ecourts.map(q => serpSearch(q))).then(r => r.flat()),
      Promise.all(queries.sebi.map(q => serpSearch(q))).then(r => r.flat()),
      Promise.all(queries.mca.map(q => serpSearch(q))).then(r => r.flat()),
      Promise.all(queries.nclt.map(q => serpSearch(q))).then(r => r.flat()),
      Promise.all(queries.enforcement.map(q => serpSearch(q))).then(r => r.flat()),
      Promise.all(queries.media.map(q => serpSearch(q))).then(r => r.flat()),
    ]);

    // Build evidence summary for AI analysis
    const evidenceSummary = {
      subject: `${client.name}${client.company ? ` (${client.company})` : ''}`,
      ecourts:    eCourtsResults.slice(0, 12).map(r => ({ title: r.title, snippet: r.snippet, url: r.link })),
      sebi:       sebiResults.slice(0, 10).map(r => ({ title: r.title, snippet: r.snippet, url: r.link })),
      mca:        mcaResults.slice(0, 10).map(r => ({ title: r.title, snippet: r.snippet, url: r.link })),
      nclt:       ncltResults.slice(0, 10).map(r => ({ title: r.title, snippet: r.snippet, url: r.link })),
      enforcement: enfResults.slice(0, 10).map(r => ({ title: r.title, snippet: r.snippet, url: r.link })),
      media:      mediaResults.slice(0, 12).map(r => ({ title: r.title, snippet: r.snippet, url: r.link })),
    };

    // AI analysis
    const aiResult = await callAI({
      systemPrompt: `You are a Legal Reputation Intelligence Analyst at a professional due diligence firm.

Your job is to analyse search results from 6 legal signal categories and produce a structured legal risk assessment for the subject.

EVIDENCE RULES:
1. Only report findings that are DIRECTLY about the named subject. Dismiss coincidental name matches.
2. Distinguish: confirmed legal exposure (found in results) vs absence of evidence (nothing found).
3. Absence of evidence = Clear for that category. This is a VALID and valuable finding.
4. For each finding, cite the actual source URL or publication from the results.
5. Never invent case numbers, order dates, or legal proceedings.
6. legal_risk_score: 100 = completely clean. Deduct per finding:
   - Critical finding: -25 to -40
   - High finding: -15 to -20
   - Moderate finding: -8 to -12
   - Low finding: -2 to -5
7. clean_certificate: true ONLY if all 6 categories are Clear.

Respond with ONLY valid JSON.`,
      userPrompt: `Analyse these legal scan results for: ${evidenceSummary.subject}

ECOURTS/LITIGATION RESULTS:
${JSON.stringify(evidenceSummary.ecourts, null, 1).slice(0, 2000)}

SEBI RESULTS:
${JSON.stringify(evidenceSummary.sebi, null, 1).slice(0, 1500)}

MCA RESULTS:
${JSON.stringify(evidenceSummary.mca, null, 1).slice(0, 1500)}

NCLT/INSOLVENCY RESULTS:
${JSON.stringify(evidenceSummary.nclt, null, 1).slice(0, 1500)}

ENFORCEMENT RESULTS:
${JSON.stringify(evidenceSummary.enforcement, null, 1).slice(0, 1500)}

MEDIA LEGAL SIGNALS:
${JSON.stringify(evidenceSummary.media, null, 1).slice(0, 2000)}

Return JSON:
{
  "legal_risk_score": 0,
  "overall_status": "Clean|Minor Flags|Material Risk|Critical Exposure",
  "categories": {
    "ecourts_litigation":  {"status":"Clear or description","findings":[{"category":"eCourts","signal":"what was found","severity":"Clear|Low|Moderate|High|Critical","source":"publication or site name","url":"actual url if found","date":"if available","summary":"what this means"}],"score":100},
    "sebi_regulatory":     {"status":"","findings":[],"score":100},
    "mca_corporate":       {"status":"","findings":[],"score":100},
    "nclt_insolvency":     {"status":"","findings":[],"score":100},
    "enforcement_actions": {"status":"","findings":[],"score":100},
    "media_legal_signals": {"status":"","findings":[],"score":100}
  },
  "clean_certificate": false,
  "strategic_implications": "paragraph: what this risk profile means for the subject's reputation, fundraising, board prospects, or media exposure",
  "recommended_actions": ["specific action 1", "specific action 2"],
  "disclaimer": "This report surfaces publicly available information only. It does not constitute legal advice. Consult a qualified legal professional for legal matters."
}`,
      json: true,
      maxTokens: 3000,
      timeoutMs: 90_000,
    });

    const scanResult = parseAIJson<LegalScanResult>(aiResult.content) as LegalScanResult;
    scanResult.scan_date = new Date().toISOString();

    // Save result
    await supabase
      .from('legal_scans')
      .update({
        status: 'completed',
        result: scanResult,
        completed_at: new Date().toISOString(),
      })
      .eq('id', scanId);

    return Response.json({ success: true, scanId, result: scanResult });

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[legal-scan] Error:', msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
