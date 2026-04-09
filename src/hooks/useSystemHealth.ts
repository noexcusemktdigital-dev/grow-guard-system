// OPS-005: System health monitoring hook
// Polls for recent errors in audit_logs and edge function failures

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface SystemAlert {
  type: 'error' | 'warning' | 'info'
  message: string
  count: number
  lastSeen: string
}

export const useSystemHealth = (orgId: string) => {
  return useQuery({
    queryKey: ['system_health', orgId],
    queryFn: async (): Promise<SystemAlert[]> => {
      // Check for recent failed automations (last 24h, error_count >= 3)
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { data: failedAutomations } = await supabase
        .from('crm_automation_queue')
        .select('id, error_count, updated_at')
        .eq('organization_id', orgId)
        .gte('error_count', 3)
        .gte('updated_at', since)

      const alerts: SystemAlert[] = []

      if (failedAutomations && failedAutomations.length > 0) {
        alerts.push({
          type: 'error',
          message: `${failedAutomations.length} automação${failedAutomations.length > 1 ? 'ões' : ''} falharam nas últimas 24h`,
          count: failedAutomations.length,
          lastSeen: (failedAutomations[0] as { updated_at?: string | null }).updated_at ?? new Date().toISOString(),
        })
      }

      return alerts
    },
    staleTime: 5 * 60 * 1000, // 5min
    refetchInterval: 5 * 60 * 1000,
    enabled: !!orgId,
  })
}
