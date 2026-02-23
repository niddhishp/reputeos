// app/api/lsi/calculate/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { 
  calculateComponent1, 
  calculateComponent2,
  calculateComponent3,
  calculateComponent4,
  calculateComponent5,
  calculateComponent6,
  calculateSixSigmaBaseline,
  identifyGaps 
} from '@/lib/lsi/formulas';

const requestSchema = z.object({
  clientId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request
    const body = await request.json();
    const { clientId } = requestSchema.parse(body);

    // Verify client ownership
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .eq('user_id', user.id)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Fetch latest discover run data
    const { data: discoverData, error: discoverError } = await supabase
      .from('discover_runs')
      .select('*')
      .eq('client_id', clientId)
      .eq('status', 'completed')
      .order('run_date', { ascending: false })
      .limit(1)
      .single();

    if (discoverError || !discoverData) {
      return NextResponse.json(
        { error: 'No discovery data available. Run DISCOVER first.' }, 
        { status: 400 }
      );
    }

    // Calculate all 6 components
    const c1 = calculateComponent1(discoverData);
    const c2 = calculateComponent2(discoverData);
    const c3 = calculateComponent3(discoverData);
    const c4 = calculateComponent4(discoverData);
    const c5 = calculateComponent5(discoverData);
    const c6 = calculateComponent6(discoverData);

    const totalLSI = Math.round((c1 + c2 + c3 + c4 + c5 + c6) * 10) / 10;

    // Calculate Six Sigma statistics
    const historicalRuns = await supabase
      .from('lsi_runs')
      .select('total_score')
      .eq('client_id', clientId)
      .order('run_date', { ascending: false })
      .limit(20);

    const historicalScores = historicalRuns.data?.map(r => r.total_score) || [];
    const stats = calculateSixSigmaBaseline([...historicalScores, totalLSI]);

    // Identify gaps
    const targetScores = { c1: 16, c2: 16, c3: 16, c4: 12, c5: 12, c6: 8 };
    const gaps = identifyGaps(
      { c1, c2, c3, c4, c5, c6 }, 
      targetScores
    );

    // Save to database
    const { data: lsiRun, error: insertError } = await supabase
      .from('lsi_runs')
      .insert({
        client_id: clientId,
        total_score: totalLSI,
        components: { c1, c2, c3, c4, c5, c6 },
        inputs: discoverData.mentions,
        stats,
        gaps,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to save LSI run:', insertError);
      return NextResponse.json(
        { error: 'Failed to save calculation' }, 
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      totalLSI,
      components: { c1, c2, c3, c4, c5, c6 },
      stats,
      gaps,
      runId: lsiRun.id,
    });

  } catch (error) {
    console.error('LSI Calculation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors }, 
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}