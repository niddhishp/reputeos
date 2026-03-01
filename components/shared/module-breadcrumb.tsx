// components/shared/module-breadcrumb.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

const MODULES = ['discover', 'diagnose', 'position', 'express', 'validate', 'shield'] as const;
type Module = (typeof MODULES)[number];

const MODULE_LABELS: Record<Module, string> = {
  discover: 'Discover', diagnose: 'Diagnose', position: 'Position',
  express: 'Express', validate: 'Validate', shield: 'Shield',
};

const GOLD = '#C9A84C';

export function ModuleBreadcrumb({ clientId, clientName }: { clientId: string; clientName: string }) {
  const pathname = usePathname();
  const currentModule = MODULES.find(m => pathname.includes(`/${m}`));
  const currentIdx = currentModule ? MODULES.indexOf(currentModule) : -1;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 4 }}>
      {/* Breadcrumb */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Link href="/dashboard/clients" style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', textDecoration: 'none', transition: 'color 150ms' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)' )}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}>
          Clients
        </Link>
        <ChevronRight style={{ width: 13, height: 13, color: 'rgba(255,255,255,0.15)' }} />
        <Link href={`/dashboard/clients/${clientId}`} style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', textDecoration: 'none', transition: 'color 150ms' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}>
          {clientName}
        </Link>
        {currentModule && (
          <>
            <ChevronRight style={{ width: 13, height: 13, color: 'rgba(255,255,255,0.15)' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>
              {MODULE_LABELS[currentModule]}
            </span>
          </>
        )}
      </nav>

      {/* Module progress dots */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {MODULES.map((module, idx) => (
          <Link key={module} href={`/dashboard/clients/${clientId}/${module}`} title={MODULE_LABELS[module]} style={{
            height: 6,
            width: module === currentModule ? 18 : 6,
            borderRadius: 6,
            backgroundColor: module === currentModule ? GOLD : idx < currentIdx ? '#10b981' : 'rgba(255,255,255,0.12)',
            transition: 'all 200ms',
            display: 'block',
          }} />
        ))}
      </div>
    </div>
  );
}
