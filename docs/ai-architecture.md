# ReputeOS — Complete AI Architecture
# Which AI does what, and why, across all 6 modules

## THE CORE PRINCIPLE
Route every AI call through OpenRouter. One key. Cost-optimized per task.
- Bulk classification → DeepSeek V3 (~$0.001/1000 tokens)
- Reasoning/analysis → GPT-4o-mini (~$0.01/1000 tokens)  
- Long-form writing → Claude Sonnet 3.5 (~$0.015/1000 tokens)
- Fast summaries → Claude Haiku (~$0.00025/1000 tokens)
- Search-grounded → Perplexity Sonar (live web access, ~$0.005/query)

---

## MODULE 1: DISCOVER (62 sources)
STATUS: ✅ Built

### Data Collection Layer
- SerpAPI → Google (web/news/scholar/YT/KG/Bing) — structured JSON
- Exa.ai → Neural search (paywall bypass, academic, niche India media)
- NewsAPI + Guardian + NYT → Premium news APIs
- 10 Indian RSS feeds → ET/BS/Mint/FE/Moneycontrol/NDTV/Forbes/YourStory/Inc42/Lounge
- X API → Real-time Twitter mentions
- Reddit → India subreddits (free)
- Apify → LinkedIn/YouTube/Instagram scraping actors
- Firecrawl → SEBI/RBI/MCA/NCLT/CCI/Tofler/Zauba
- BSE/NSE/Wikipedia/HN/GitHub/Semantic Scholar → Free public APIs
- Podcast Index → Episode search

### AI Analysis Layer
| Task | Model | Reason |
|---|---|---|
| Sentiment scoring (all mentions) | DeepSeek V3 (batch 20) | Bulk classification, cheapest per token |
| Frame detection (expert/founder/crisis) | DeepSeek V3 (same batch) | Same call as sentiment |
| Archetype hints | GPT-4o-mini | Needs Jungian reasoning, not just classification |
| Executive summary | Claude Haiku | Fast, coherent summaries |
| Perplexity synthesis | Perplexity Sonar | Live web access for current context |

### Output
- discover_runs table: mentions[], sentiment_dist, frame_dist, top_keywords, archetype_hints
- lsi_runs table: preliminary LSI score
- Cost per scan: ~$0.15–0.25 total

---

## MODULE 2: DIAGNOSE
STATUS: ⬜ Needs build

### What it does
Takes discover_runs output → calculates LSI score with full breakdown →
NLP root cause analysis → Six Sigma gap identification → archetype assignment

### The LSI Calculation (Pure Math — No AI)
```
C1 Search Reputation (0–20): sentiment of top 30 Google results + professional frame %
C2 Media Framing (0–20): expert frame % in news + tier-1 source count + bylines
C3 Social Backlash (0–20): inverse of negative social signals + crisis frame absence
C4 Elite Discourse (0–15): academic citations + podcast appearances + LinkedIn depth
C5 Third-Party Validation (0–15): authority source mentions (Bloomberg/Reuters/etc)
C6 Crisis Moat (0–10): absence of regulatory/legal findings
Total: 0–100
```

### AI Analysis Layer
| Task | Model | Prompt focus |
|---|---|---|
| Root cause analysis (Fishbone + 5 Whys) | GPT-4o | Given LSI gaps, identify structural reputation weaknesses |
| Archetype assignment (54 archetypes) | GPT-4o | Score each archetype against sentiment/frame/keyword data |
| Character archetype (Jungian) | GPT-4o | Jungian analysis from public persona patterns |
| Business archetype assignment | GPT-4o-mini | Professional archetype from industry + role context |
| Gap narrative (what to fix first) | Claude Haiku | Clear executive summary of top 3 gaps |
| Influencer mapping (who to emulate) | Perplexity Sonar | "Who are the top 5 thought leaders in [industry] in India with [archetype]?" |

### Key: The 54-Archetype Scoring
GPT-4o receives:
- Client's sentiment distribution
- Frame distribution  
- Top keywords
- Industry + role
- LSI component scores
- Discovery summary

And scores all 54 archetypes (Jungian 12 + Professional 21 + Niche 21) on:
- Behavioral fit (does discovered persona match archetype traits?)
- Content opportunity (is there space in this archetype in their industry?)
- Authenticity (does their background support this archetype?)
- Differentiation (how saturated is this archetype in their space?)
- Followability potential (historical engagement rates for this archetype)

Returns top 3 recommendations with scores.

### API routes to build
- POST /api/lsi/calculate → Full LSI from discover_run_id
- POST /api/archetype/assign → 54-archetype scoring → top 3 recommendations
- POST /api/diagnose/root-cause → Fishbone + 5 Whys analysis
- POST /api/diagnose/influencer-map → Perplexity search for target influencers

---

## MODULE 3: POSITION
STATUS: ⬜ Needs build (archetype/assign route exists, needs enhancement)

### What it does
User selects archetype (informed by Diagnose) → AI generates full positioning strategy:
- Content pillars (5 themes, 12 posts each = 60/month plan)
- Signature lines (5 authentic statements)
- Influencer targeting strategy  
- Followability score prediction
- Archetype evolution timeline

### Influencer Discovery Flow
This is two-step: Search → Analyze

**Step 1: Find target influencers (Perplexity Sonar + SerpAPI)**
Prompt: "List 10 Indian [industry] professionals on LinkedIn who embody the [archetype] 
archetype and have 50K+ followers. Include their LinkedIn URL and content style."

SerpAPI then searches each name to get their actual content URLs.

**Step 2: Influencer DNA Analysis (GPT-4o — the KILLER FEATURE)**
Firecrawl scrapes their actual LinkedIn post / article.
GPT-4o receives the raw content and extracts:
```json
{
  "structure": { "hook": "...", "problem": "...", "solution": "...", "proof": "...", "cta": "..." },
  "style": { "sentenceLength": 12, "paragraphLength": 3, "activeVoice": 87, "pacing": "fast" },
  "emotionalTriggers": ["vulnerability", "urgency", "curiosity"],
  "authorityMarkers": ["presuppositions", "factive verbs", "quantified achievements"],
  "linguisticPatterns": { "transitions": [...], "rhetorical": [...] },
  "template": "REUSABLE TEMPLATE TEXT"
}
```

### AI Layer for Position Module
| Task | Model | Reason |
|---|---|---|
| Followability score prediction | GPT-4o-mini | Score 5 factors: uniqueness, resonance, opportunity, platform fit, historical |
| Content pillar generation | Claude Sonnet 3.5 | Best for strategic long-form output |
| Signature line creation | Claude Sonnet 3.5 | Nuanced brand voice writing |
| Influencer search | Perplexity Sonar | Live web search for current Indian thought leaders |
| Influencer DNA extraction | GPT-4o | Structural content analysis — needs reasoning |
| Template generation | Claude Sonnet 3.5 | Writing quality matters here |
| Positioning statement | Claude Sonnet 3.5 | Single sentence, highest stakes |
| Archetype evolution timeline | GPT-4o-mini | 6/12/18 month roadmap |

### API routes to build
- POST /api/archetype/predict-followability → 5-factor score (route exists, enhance)
- POST /api/position/content-pillars → 5 pillars × themes × formats
- POST /api/position/signature-lines → 5 authentic brand statements
- POST /api/influencer/search → Perplexity finds target influencers
- POST /api/influencer/analyze-dna → GPT-4o content DNA extraction (route exists)
- POST /api/position/evolution-plan → 18-month archetype evolution roadmap

---

## MODULE 4: EXPRESS
STATUS: ⬜ Needs full build (generate route exists but basic)

### What it does
Takes positioning strategy → generates content calibrated to archetype, platform, 
influencer template → validates NLP compliance → predicts performance

### Content Generation Flow
```
User selects: Platform + Topic + Template (optional)
       ↓
System assembles: Archetype profile + Content pillars + Voice characteristics
       ↓
Claude Sonnet generates: Draft content (platform-specific length/format)
       ↓
DeepSeek validates: NLP compliance (frame check, authority markers, voice consistency)
       ↓
GPT-4o-mini predicts: Performance score (engagement rate, reach estimate)
       ↓
User edits → saves to content_items
```

### Platform-Specific Formats
| Platform | Length | Format | Special |
|---|---|---|---|
| LinkedIn long-form | 800–1200 words | Narrative arc | Hook in line 1 (before "see more") |
| LinkedIn short post | 150–300 words | 1-2 punch | Question ending |
| X/Twitter thread | 10–15 tweets | Numbered | Hook tweet + value tweets + CTA |
| Op-ed (ET/Mint/Bloomberg) | 600–900 words | Argument structure | Thesis + 3 points + call to action |
| Whitepaper | 1500–2500 words | Research format | Abstract + sections + conclusion |
| Keynote outline | Bullet structure | Story arc | Opening hook + 3 acts + close |

### AI Layer for Express Module
| Task | Model | Reason |
|---|---|---|
| Content generation | Claude Sonnet 3.5 | Best writing quality for thought leadership |
| Archetype voice calibration (system prompt) | Pre-built prompts | No AI cost — just prompt engineering |
| NLP compliance check | DeepSeek V3 | Fast keyword/pattern check, cheap |
| Frame detection (avoid/target) | DeepSeek V3 | Same call as compliance |
| Authority marker detection | DeepSeek V3 | Pattern matching, not reasoning |
| Voice consistency score | DeepSeek V3 | Compare against archetype voice profile |
| Performance prediction | GPT-4o-mini | Feature extraction + heuristic scoring |
| Optimization suggestions | GPT-4o-mini | "Change X to improve by Y%" |
| Regenerate with different angle | Claude Sonnet 3.5 | Full rewrite with new instruction |

### NLP Compliance Checks (DeepSeek V3)
```
✅ Frame check: "expert"/"leader" frames present, "family"/"legacy" frames absent
✅ Authority markers: 2+ presuppositions, factive verbs, quantified achievements  
✅ Archetype alignment: keyword overlap with archetype profile >75%
✅ Sentiment target: within ±0.1 of positioning target
✅ Voice consistency: authoritative/analytical/accessible scores vs targets
✅ Platform compliance: word count, formatting, hook quality
```

### API routes to build
- POST /api/content/generate → Claude Sonnet with archetype system prompt
- POST /api/content/validate-nlp → DeepSeek NLP checks (route exists, enhance)
- POST /api/content/predict-performance → GPT-4o-mini feature scoring
- POST /api/content/batch-generate → Generate 5 posts for content calendar

---

## MODULE 5: VALIDATE
STATUS: ⬜ Needs build

### What it does
Re-runs discovery scan → compares new LSI vs baseline → statistical significance →
frame shift analysis → before/after proof → board report generation

### The Math (No AI)
```
T-test: Is LSI improvement statistically significant? (p < 0.05 = yes)
Cohen's d: Effect size (0.2=small, 0.5=medium, 0.8=large)
UCL/LCL: Upper/Lower Control Limits (baseline mean ± 3σ)
Frame shift: Before vs after frame distribution %
```

### AI Layer for Validate Module
| Task | Model | Reason |
|---|---|---|
| Board report narrative | Claude Sonnet 3.5 | Professional, board-ready prose |
| Before/after story generation | Claude Sonnet 3.5 | Compelling case study narrative |
| Statistical significance explanation | Claude Haiku | Plain English for non-technical readers |
| PowerPoint content generation | Claude Haiku | Slide copy — short, punchy |
| Component insight narrative | Claude Haiku | "Your C2 improved because..." |
| Investor pitch supplement | Claude Sonnet 3.5 | High-stakes writing quality |

### Report Generation
PDF: jsPDF — client-side, no AI
PPTX: PptxGenJS — server-side, no AI
Content: Claude Sonnet writes the narrative sections
Charts: Recharts renders in browser → screenshot for PDF

### API routes to build
- POST /api/validate/rescan → Trigger new discover_run + LSI calculation
- POST /api/validate/significance → T-test + Cohen's d calculation (pure math)
- POST /api/validate/frame-shift → Compare frame distributions
- POST /api/export/pdf → jsPDF report
- POST /api/export/pptx → PptxGenJS deck
- POST /api/export/board-report → Claude Sonnet narrative + export

---

## MODULE 6: SHIELD
STATUS: ⬜ Needs build

### What it does
24/7 monitoring (via Vercel Cron) → crisis detection → competitor tracking →
automated alert → response playbook generation

### Crisis Detection (Vercel Cron — every 4 hours)
```
Fetch recent X mentions → DeepSeek V3 sentiment
Fetch recent news → NewsAPI + Google News (SerpAPI)
Calculate: mention volume vs 7-day baseline
Detect: volume spike (>3x baseline) OR sentiment drop (<-0.5) OR crisis keywords
If triggered: write to alerts table → Supabase Realtime → UI alert → Resend email
```

### Crisis Keywords (India-specific)
```
Regulatory: "SEBI notice", "ED raid", "CBI investigation", "RBI penalty", "MCA show cause"
Legal: "FIR filed", "arrested", "court summons", "NCLT petition", "insolvency"
Corporate: "fraud", "embezzlement", "misappropriation", "corporate governance"
Social: "boycott", "controversy", "scandal", "exposed", "leaked"
Financial: "defaults", "NPAs", "debt restructuring", "promoter pledge"
```

### AI Layer for Shield Module
| Task | Model | Reason |
|---|---|---|
| Crisis sentiment (real-time) | DeepSeek V3 | Cheapest, fast, runs every 4 hours |
| Crisis severity classification | DeepSeek V3 | Low/Medium/High/Critical |
| Response playbook generation | GPT-4o | Needs strategic reasoning |
| Draft response statements | Claude Sonnet 3.5 | High stakes writing |
| Competitor content analysis | GPT-4o-mini | Summarize competitor positioning |
| Competitor LSI estimation | GPT-4o-mini | Estimate from public signals |
| Alert narrative | Claude Haiku | Clear, urgent one-paragraph summary |

### Vercel Cron Configuration (vercel.json)
```json
{
  "crons": [
    { "path": "/api/cron/crisis-monitor", "schedule": "0 */4 * * *" },
    { "path": "/api/cron/lsi-weekly", "schedule": "0 6 * * 1" },
    { "path": "/api/cron/competitor-scan", "schedule": "0 8 * * 1" }
  ]
}
```

### API routes to build
- GET /api/cron/crisis-monitor → Runs every 4h, checks all active clients
- GET /api/cron/lsi-weekly → Monday 6am, recalculates LSI for all clients  
- POST /api/shield/playbook → GPT-4o response strategy for alert type
- POST /api/shield/draft-response → Claude Sonnet public statement draft
- POST /api/shield/add-competitor → Add competitor to tracking
- GET /api/shield/competitor-analysis → GPT-4o-mini competitor LSI estimate

---

## TOTAL COST MODEL (per active client per month)

| Activity | Frequency | Cost |
|---|---|---|
| Full 62-source scan | Monthly or on-demand | $0.15–0.25 |
| Crisis monitoring | Every 4h (180×/month) | $0.02–0.05 |
| Weekly LSI recalculation | 4×/month | $0.10–0.20 |
| Content generation (20 pieces) | Monthly | $0.30–0.60 |
| Board report | Monthly | $0.05–0.10 |
| Competitor scan (5 competitors) | Weekly | $0.20–0.40 |
| **Total per client per month** | | **~$0.82–1.60** |

At your pricing ($2,000–5,000/month per client), AI costs are <0.1% of revenue.

---

## BUILD ORDER (what to build next)

1. **DIAGNOSE page + LSI API** — Foundation for everything else
2. **POSITION page + archetype wizard** — Core value prop
3. **Influencer search + DNA** — Killer differentiator  
4. **EXPRESS page + content generation** — Revenue-generating feature
5. **VALIDATE page + board report** — Proof of ROI for clients
6. **SHIELD + Cron tasks** — Retention feature (clients stay for monitoring)

---

## WHAT'S WRONG WITH THE N8N WORKFLOWS

Phase 3 (Archetype): Uses GPT-4 for everything — correct model, but no routing optimization
Phase 4 (Strategy): Uses GPT-4 for calendar/charter/channels — correct, but should be Claude Sonnet
Phase 5 (Content): JSON parse error in file — workflow may be corrupt
Phase 6 (Validation): GPT-4 for sentiment — should be DeepSeek V3 (10x cheaper for bulk)
Phase 7 (Crisis): Not using streaming/Realtime — should write directly to Supabase alerts table

The n8n workflows are REPLACEABLE — each phase maps directly to a Next.js API route.
No n8n subscription needed. Vercel Cron + API routes do the same job.
