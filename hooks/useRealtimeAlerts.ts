// Hook: useRealtimeAlerts
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export function useRealtimeAlerts(clientId: string) {
  const [alerts, setAlerts] = useState([])
  
  useEffect(() => {
    // Subscribe to alerts table
    const subscription = supabase
      .channel('alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alerts',
          filter: `client_id=eq.${clientId}`,
        },
        (payload) => {
          setAlerts(prev => [payload.new, ...prev])
          
          // Show toast notification
          if (payload.new.severity === 'critical') {
            showCriticalAlertNotification(payload.new)
          }
        }
      )
      .subscribe()
    
    return () => {
      subscription.unsubscribe()
    }
  }, [clientId])
  
  return alerts
}