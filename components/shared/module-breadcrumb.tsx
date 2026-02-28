// components/shared/module-breadcrumb.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const MODULES = ['discover', 'diagnose', 'position', 'express', 'validate', 'shield'] as const;
type Module = (typeof MODULES)[number];

const MODULE_LABELS: Record<Module, string> = {
  discover: 'Discover',
  diagnose: 'Diagnose',
  position: 'Position',
  express: 'Express',
  validate: 'Validate',
  shield: 'Shield',
};

interface ModuleBreadcrumbProps {
  clientId: string;
  clientName: string;
}

export function ModuleBreadcrumb({ clientId, clientName }: ModuleBreadcrumbProps) {
  const pathname = usePathname();

  const currentModule = MODULES.find((m) => pathname.includes(`/${m}`));
  const currentModuleIndex = currentModule ? MODULES.indexOf(currentModule) : -1;

  return (
    <div className="flex items-center justify-between flex-wrap gap-4">
      {/* Breadcrumb */}
      <nav className="flex items-center text-sm text-neutral-500 gap-1">
        <Link href="/dashboard/clients" className="hover:text-neutral-900 transition-colors">
          Clients
        </Link>
        <ChevronRight className="h-4 w-4 text-neutral-300" />
        <Link
          href={`/dashboard/clients/${clientId}`}
          className="hover:text-neutral-900 transition-colors"
        >
          {clientName}
        </Link>
        {currentModule && (
          <>
            <ChevronRight className="h-4 w-4 text-neutral-300" />
            <span className="text-neutral-900 font-medium">
              {MODULE_LABELS[currentModule]}
            </span>
          </>
        )}
      </nav>

      {/* Module progress dots */}
      <div className="flex items-center gap-1.5">
        {MODULES.map((module, index) => (
          <Link
            key={module}
            href={`/dashboard/clients/${clientId}/${module}`}
            title={MODULE_LABELS[module]}
            className={cn(
              'h-2 w-2 rounded-full transition-all',
              module === currentModule
                ? 'bg-blue-600 w-4'
                : index < currentModuleIndex
                ? 'bg-green-500'
                : 'bg-neutral-300 hover:bg-neutral-400'
            )}
          />
        ))}
      </div>
    </div>
  );
}
