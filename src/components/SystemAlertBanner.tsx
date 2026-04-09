// OPS-005: System alert banner — shows dismissible banners for system health issues
import { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { useSystemHealth } from '@/hooks/useSystemHealth'
import { useUserOrgId } from '@/hooks/useUserOrgId'

export function SystemAlertBanner() {
  const { data: orgId } = useUserOrgId()
  const { data: alerts } = useSystemHealth(orgId ?? '')
  const [dismissed, setDismissed] = useState<Set<number>>(new Set())

  if (!alerts || alerts.length === 0) return null

  const visible = alerts.filter((_, i) => !dismissed.has(i))
  if (visible.length === 0) return null

  return (
    <div className="space-y-1">
      {visible.map((alert, i) => (
        <div
          key={i}
          className={`flex items-center gap-3 px-4 py-2 text-sm border rounded-lg ${
            alert.type === 'error'
              ? 'bg-destructive/5 border-destructive/20 text-destructive'
              : alert.type === 'warning'
              ? 'bg-amber-500/5 border-amber-500/20 text-amber-700 dark:text-amber-400'
              : 'bg-blue-500/5 border-blue-500/20 text-blue-700 dark:text-blue-400'
          }`}
        >
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="flex-1 text-xs font-medium">{alert.message}</span>
          <button
            onClick={() => setDismissed((prev) => new Set(prev).add(i))}
            className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
            aria-label="Fechar alerta"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
