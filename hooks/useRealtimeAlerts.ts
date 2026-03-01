// hooks/useRealtimeAlerts.ts
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'

interface Alert {
  id: string
  type: string
  severity: 'info' | 'warning' | 'critical'
  title: string
  message: string
  timestamp: string
  status: 'new' | 'acknowledged' | 'resolved'
}

export function useRealtimeAlerts(clientId: string) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const { toast } = useToast()

  const handleNewAlert = useCallback((payload: { new: Record<string, unknown> }) => {
    const raw = payload.new
    const newAlert: Alert = {
      id: raw.id as string,
      type: raw.type as string,
      severity: raw.severity as Alert['severity'],
      title: raw.title as string,
      message: (raw.message as string) ?? '',
      timestamp: raw.created_at as string,
      status: (raw.status as Alert['status']) ?? 'new',
    }

    setAlerts(prev => [newAlert, ...prev])

    if (newAlert.severity === 'critical') {
      toast({
        title: '🚨 Critical Alert',
        description: newAlert.title,
        variant: 'destructive',
      })
    }
  }, [toast])

  useEffect(() => {
    const subscription = supabase
      .channel(`alerts-${clientId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alerts',
          filter: `client_id=eq.${clientId}`,
        },
        handleNewAlert
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [clientId, handleNewAlert])

  return alerts
}
