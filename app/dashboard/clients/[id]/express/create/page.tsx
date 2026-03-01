/**
 * /express/create — redirects to /express
 * Content creation is now handled inline on the Express page.
 */
'use client';
import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function ExpressCreateRedirect() {
  const params = useParams();
  const router = useRouter();
  useEffect(() => {
    router.replace(`/dashboard/clients/${params.id}/express`);
  }, [params.id, router]);
  return null;
}
