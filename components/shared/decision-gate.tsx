// components/shared/decision-gate.tsx
// Soft warning — informs users but never blocks access
'use client';

import { useState } from 'react';
import { AlertTriangle, X, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface DecisionGateProps {
  // The module that should ideally be completed first
  requiredModule: string;
  // Where to send user if they want to complete it
  requiredHref: string;
  // Why it's recommended (shown in description)
  reason?: string;
  // Label for the client/profile context
  clientId: string;
}

export function DecisionGate({
  requiredModule,
  requiredHref,
  reason,
  clientId,
}: DecisionGateProps) {
  const [dismissed, setDismissed] = useState(false);
  const router = useRouter();

  if (dismissed) return null;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-amber-900">
            {requiredModule} recommended first
          </p>
          <p className="text-sm text-amber-700 mt-0.5">
            {reason ??
              `Completing ${requiredModule} first will give you better results here. You can still continue without it.`}
          </p>
          <div className="flex items-center gap-2 mt-3">
            <Button
              size="sm"
              variant="outline"
              className="border-amber-300 text-amber-900 hover:bg-amber-100"
              onClick={() => router.push(requiredHref)}
            >
              Go to {requiredModule}
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
            <button
              className="text-sm text-amber-600 hover:text-amber-800 underline"
              onClick={() => setDismissed(true)}
            >
              Continue anyway
            </button>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-400 hover:text-amber-600 p-0.5"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
