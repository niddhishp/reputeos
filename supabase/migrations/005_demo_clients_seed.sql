-- ============================================================
-- DEMO CLIENT SEED DATA  (corrected column names)
-- Run in Supabase SQL Editor
-- Auto-detects your user_id from auth.users
-- ============================================================

DO $$
DECLARE
  v_user_id UUID;
  c1_id UUID := gen_random_uuid();
  c2_id UUID := gen_random_uuid();
  c3_id UUID := gen_random_uuid();
BEGIN
  -- Use the most recently created user (you)
  SELECT id INTO v_user_id FROM auth.users ORDER BY created_at DESC LIMIT 1;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No users found. Are you logged in to Supabase?';
  END IF;
  RAISE NOTICE 'Creating demo data for user %', v_user_id;

  -- ── CLIENT 1: Priya Sharma ──────────────────────────────────────────────
  INSERT INTO clients (id, user_id, name, company, role, industry, linkedin_url, keywords, baseline_lsi, target_lsi, status)
  VALUES (
    c1_id, v_user_id, 'Priya Sharma', 'Infosys', 'Chief Sustainability Officer',
    'Technology / ESG', 'https://linkedin.com/in/priya-sharma-cso',
    ARRAY['sustainability','ESG','climate tech','Infosys','net zero'], 52, 78, 'active'
  ) ON CONFLICT DO NOTHING;

  INSERT INTO discover_runs (
    client_id, status, progress, sources_total, sources_completed,
    total_mentions, sentiment_summary, frame_distribution,
    archetype_hints, analysis_summary, started_at, completed_at
  ) VALUES (
    c1_id, 'completed', 100, 62, 58, 247,
    '{"positive":68,"neutral":22,"negative":10,"average":0.42}'::jsonb,
    '{"expert":45,"founder":12,"leader":28,"family":5,"crisis":2,"other":8}'::jsonb,
    ARRAY['Sage','Caregiver','Ecosystem Builder'],
    'Priya Sharma has a strong positive reputation profile with 247 mentions across major Indian and global media. She is primarily framed as an expert voice on sustainability and ESG. No crisis signals detected.',
    NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days' + INTERVAL '4 minutes'
  );

  INSERT INTO lsi_runs (client_id, total_score, components, stats, gaps, run_date)
  VALUES (
    c1_id, 52,
    '{"c1":13,"c2":11,"c3":14,"c4":7,"c5":5,"c6":2}'::jsonb,
    '{"mean":0.42,"stddev":0.18,"ucl":0.78,"lcl":0.06}'::jsonb,
    '[{"component":"Third-Party Validation","gap":10,"priority":1},{"component":"Elite Discourse","gap":8,"priority":2},{"component":"Search Reputation","gap":7,"priority":3}]'::jsonb,
    NOW() - INTERVAL '14 days'
  );

  INSERT INTO positioning (
    client_id, mode, personal_archetype, business_archetype,
    archetype_confidence, followability_score, followability_factors,
    positioning_statement, content_pillars, signature_lines, target_influencers,
    root_cause_insights, strategic_insights
  ) VALUES (
    c1_id, 'personal_and_business', 'Sage', 'Ecosystem Builder', 87, 74,
    '{"uniqueness":72,"emotionalResonance":68,"contentOpportunity":82,"platformFit":78,"historicalPerformance":70}'::jsonb,
    'Priya Sharma is India''s leading voice on corporate sustainability — a Sage who translates complex ESG frameworks into boardroom-ready strategy that drives measurable business value.',
    '[{"name":"ESG Strategy & Metrics","themes":["net zero roadmaps","BRSR reporting","carbon accounting"],"frequency":"2x per week","formats":["LinkedIn article","data post"]},{"name":"Boardroom Climate Leadership","themes":["executive accountability","sustainability governance","TCFD"],"frequency":"1x per week","formats":["op-ed","Twitter thread"]},{"name":"Industry Transformation Stories","themes":["case studies","sector benchmarks","green innovation"],"frequency":"1x per week","formats":["whitepaper","keynote outline"]}]'::jsonb,
    ARRAY[
      'Translating net zero ambition into operational reality — one quarter at a time.',
      'The most undervalued ESG metric is the one your board hasn''t asked about yet.',
      'Sustainability isn''t a cost centre. It''s the only growth strategy that compounds.'
    ],
    '[{"name":"Mahindra Kulasekaran","archetype":"Ecosystem Builder","platforms":["LinkedIn","Twitter"],"strategy":"Study how he bridges technical depth with executive storytelling"},{"name":"Shailesh Haribhakti","archetype":"Sage","platforms":["LinkedIn","ET"],"strategy":"Mirror his use of data to validate qualitative ESG arguments"}]'::jsonb,
    ARRAY[
      'Media coverage is strong but concentrated in 3-4 outlets. Needs diversification to tier-1 international media.',
      'Expert frame dominates (45%) but Elite Discourse score (7/15) is the biggest gap — needs more speaking slots at Davos-tier events.',
      'LinkedIn posts average 2x/month vs optimal 6x/month for this archetype.'
    ],
    ARRAY[
      'Prioritise 2 international conference keynotes in next 90 days to lift Elite Discourse score by 6-8 points.',
      'Publish 1 op-ed per month in FT, Bloomberg, or WSJ to build third-party validation score.',
      'Increase LinkedIn cadence to 3x/week using the Sage archetype template: insight → data → implication → action.'
    ]
  ) ON CONFLICT DO NOTHING;

  -- ── CLIENT 2: Arjun Mehta ───────────────────────────────────────────────
  INSERT INTO clients (id, user_id, name, company, role, industry, linkedin_url, keywords, baseline_lsi, target_lsi, status)
  VALUES (
    c2_id, v_user_id, 'Arjun Mehta', 'Razorpay', 'Co-Founder & CEO',
    'Fintech / Payments', 'https://linkedin.com/in/arjunmehta-razorpay',
    ARRAY['fintech','payments','Razorpay','startup','founder','UPI'], 67, 85, 'active'
  ) ON CONFLICT DO NOTHING;

  INSERT INTO discover_runs (
    client_id, status, progress, sources_total, sources_completed,
    total_mentions, sentiment_summary, frame_distribution,
    archetype_hints, analysis_summary, started_at, completed_at
  ) VALUES (
    c2_id, 'completed', 100, 62, 61, 891,
    '{"positive":78,"neutral":14,"negative":8,"average":0.61}'::jsonb,
    '{"expert":22,"founder":52,"leader":18,"family":3,"crisis":1,"other":4}'::jsonb,
    ARRAY['Hero','Ruler','Maverick CEO'],
    'Arjun Mehta commands one of the strongest founder reputation profiles in Indian fintech with 891 total mentions. His narrative is dominated by the founder frame (52%) with consistently positive sentiment. Coverage spans Economic Times, TechCrunch, Bloomberg, and YourStory.',
    NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days' + INTERVAL '5 minutes'
  );

  INSERT INTO lsi_runs (client_id, total_score, components, stats, gaps, run_date)
  VALUES (
    c2_id, 67,
    '{"c1":17,"c2":15,"c3":16,"c4":10,"c5":7,"c6":2}'::jsonb,
    '{"mean":0.61,"stddev":0.14,"ucl":0.89,"lcl":0.33}'::jsonb,
    '[{"component":"Third-Party Validation","gap":8,"priority":1},{"component":"Crisis Moat","gap":8,"priority":2},{"component":"Elite Discourse","gap":5,"priority":3}]'::jsonb,
    NOW() - INTERVAL '7 days'
  );

  INSERT INTO positioning (
    client_id, mode, personal_archetype, business_archetype,
    archetype_confidence, followability_score, followability_factors,
    positioning_statement, content_pillars, signature_lines, target_influencers,
    root_cause_insights, strategic_insights
  ) VALUES (
    c2_id, 'personal_and_business', 'Hero', 'Maverick CEO', 91, 83,
    '{"uniqueness":88,"emotionalResonance":85,"contentOpportunity":79,"platformFit":86,"historicalPerformance":77}'::jsonb,
    'Arjun Mehta is the face of India''s fintech revolution — a Hero who built the payment infrastructure for 500M+ Indians and is now engineering the next chapter of financial inclusion.',
    '[{"name":"Building at Scale","themes":["product decisions","engineering culture","startup scaling"],"frequency":"2x per week","formats":["LinkedIn post","Twitter thread"]},{"name":"India Fintech Macro","themes":["UPI growth","credit access","digital India"],"frequency":"2x per week","formats":["op-ed","data post"]},{"name":"Founder Operating System","themes":["hiring","fundraising","board dynamics"],"frequency":"1x per week","formats":["LinkedIn article","keynote"]}]'::jsonb,
    ARRAY[
      'We didn''t build Razorpay. We built the infrastructure so 8 million businesses could build their future.',
      'The question was never whether India would go digital. The question was who would build the pipes.',
      'Every startup failure I''ve watched had the same root cause: they optimised for metrics instead of building for trust.'
    ],
    '[{"name":"Kunal Shah","archetype":"Maverick CEO","platforms":["Twitter","LinkedIn"],"strategy":"Study how he converts macro insights into founder credibility — contrarian takes that age well"},{"name":"Nithin Kamath","archetype":"Hero","platforms":["Twitter","LinkedIn"],"strategy":"Mirror his radical transparency about numbers and failures — creates asymmetric trust"}]'::jsonb,
    ARRAY[
      'Crisis Moat score (2/10) is the most critical gap — zero crisis preparedness despite high public profile.',
      'Third-party validation score (7/15) is weak relative to media volume — needs academic citations and government endorsements.',
      'Founder frame (52%) may be limiting strategic positioning as the company scales beyond startup phase.'
    ],
    ARRAY[
      'Build crisis response playbook immediately — a company at Series F+ is a target. One tweet storm can move the stock.',
      'Transition narrative from "founder who built" to "leader who is building India''s financial OS".',
      'Seek 2-3 government advisory roles in next 6 months — RBI Fintech Committee, NPCI board, or DPIIT taskforce.'
    ]
  ) ON CONFLICT DO NOTHING;

  -- ── CLIENT 3: Kavitha Nair ──────────────────────────────────────────────
  INSERT INTO clients (id, user_id, name, company, role, industry, linkedin_url, keywords, baseline_lsi, target_lsi, status)
  VALUES (
    c3_id, v_user_id, 'Kavitha Nair', 'Apollo Hospitals', 'Group Medical Director',
    'Healthcare / MedTech', 'https://linkedin.com/in/kavithanair-apollo',
    ARRAY['healthcare','Apollo Hospitals','medical','patient care','healthcare innovation'], 38, 65, 'active'
  ) ON CONFLICT DO NOTHING;

  INSERT INTO discover_runs (
    client_id, status, progress, sources_total, sources_completed,
    total_mentions, sentiment_summary, frame_distribution,
    archetype_hints, analysis_summary, started_at, completed_at
  ) VALUES (
    c3_id, 'completed', 100, 62, 44, 89,
    '{"positive":55,"neutral":35,"negative":10,"average":0.28}'::jsonb,
    '{"expert":38,"founder":4,"leader":20,"family":18,"crisis":6,"other":14}'::jsonb,
    ARRAY['Caregiver','Sage','Academic Practitioner'],
    'Kavitha Nair has a moderate but underdeveloped reputation profile with only 89 mentions. The family frame (18%) is unusually high for a medical professional, diluting her expert positioning. Significant upside — her credentials exceed her digital footprint by a wide margin.',
    NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '3 minutes'
  );

  INSERT INTO lsi_runs (client_id, total_score, components, stats, gaps, run_date)
  VALUES (
    c3_id, 38,
    '{"c1":8,"c2":9,"c3":10,"c4":5,"c5":4,"c6":2}'::jsonb,
    '{"mean":0.28,"stddev":0.22,"ucl":0.72,"lcl":-0.16}'::jsonb,
    '[{"component":"Search Reputation","gap":12,"priority":1},{"component":"Media Framing","gap":11,"priority":2},{"component":"Third-Party Validation","gap":11,"priority":3}]'::jsonb,
    NOW() - INTERVAL '2 days'
  );

  INSERT INTO positioning (
    client_id, mode, personal_archetype, business_archetype,
    archetype_confidence, followability_score, followability_factors,
    positioning_statement, content_pillars, signature_lines, target_influencers,
    root_cause_insights, strategic_insights
  ) VALUES (
    c3_id, 'personal_only', 'Sage', NULL, 78, 61,
    '{"uniqueness":74,"emotionalResonance":58,"contentOpportunity":88,"platformFit":52,"historicalPerformance":33}'::jsonb,
    'Dr. Kavitha Nair is India''s foremost authority on outcome-driven oncology — a Sage who bridges cutting-edge clinical evidence with the practical realities of delivering world-class care at scale.',
    '[{"name":"Clinical Evidence & Outcomes","themes":["survival rates","treatment protocols","evidence-based medicine"],"frequency":"2x per week","formats":["LinkedIn article","data post"]},{"name":"India Healthcare System","themes":["access gaps","tier-2 cities","health insurance"],"frequency":"1x per week","formats":["op-ed","Twitter thread"]},{"name":"Medical Leadership","themes":["doctor burnout","hospital management","talent in healthcare"],"frequency":"1x per week","formats":["LinkedIn post","keynote"]}]'::jsonb,
    ARRAY[
      'The most dangerous gap in Indian healthcare is not equipment or funding. It is the 11-minute average consultation.',
      'Every outcome data point I publish is a patient who agreed their story should help the next one.',
      'I have operated on 4,000 patients. The ones who did best had something in common: they understood their treatment.'
    ],
    '[{"name":"Dr. Devi Shetty","archetype":"Sage","platforms":["LinkedIn","ET"],"strategy":"Study how he frames clinical complexity as accessible narrative without losing authority"},{"name":"Dr. Naresh Trehan","archetype":"Ruler","platforms":["LinkedIn"],"strategy":"Mirror his use of outcome statistics to build unassailable expert positioning"}]'::jsonb,
    ARRAY[
      'Family frame (18%) is diluting expert positioning — needs reframing to institutional outcomes.',
      'Only 89 mentions despite 20+ years of credentials — massive untapped upside from zero thought leadership investment.',
      'Zero conference keynotes in last 24 months — single biggest driver of low Elite Discourse score (5/15).'
    ],
    ARRAY[
      'Immediate win: publish 1 outcomes study on LinkedIn with actual Apollo data — will drive 3-5x current mention volume.',
      'Target FICCI Health Summit keynote and CMAAO conference — both have 6-month lead times, act now.',
      'Reframe all patient stories from personal praise to institutional protocol success — shifts family frame to expert frame.'
    ]
  ) ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Done. Demo clients created for user %', v_user_id;
END $$;
