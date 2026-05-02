// @ts-nocheck
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Download, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { analytics } from '@/lib/analytics';
import { ANALYTICS_EVENTS } from '@/lib/analytics-events';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export function LGPDSettings() {
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  async function handleExport() {
    setExporting(true);
    analytics.track(ANALYTICS_EVENTS.DSR_EXPORT_REQUESTED);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('not_authenticated');

      const res = await fetch(`${SUPABASE_URL}/functions/v1/dsr-export-data`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-request-id': crypto.randomUUID(),
        },
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`export_failed: ${res.status} ${errBody}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meus-dados-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.success('Exportação concluída', {
        description: 'Seus dados foram baixados em JSON.',
      });
    } catch (err: any) {
      toast.error('Erro na exportação', {
        description: err?.message ?? 'Tente novamente em instantes.',
      });
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete() {
    if (confirmText !== 'EXCLUIR MINHA CONTA') {
      toast.error('Confirmação incorreta', {
        description: 'Digite exatamente "EXCLUIR MINHA CONTA"',
      });
      return;
    }
    setDeleting(true);
    analytics.track(ANALYTICS_EVENTS.DSR_DELETE_REQUESTED);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('not_authenticated');

      const res = await fetch(`${SUPABASE_URL}/functions/v1/dsr-delete-account`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-request-id': crypto.randomUUID(),
        },
        body: JSON.stringify({ confirm: 'DELETE_MY_ACCOUNT' }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.error ?? `delete_failed: ${res.status}`);
      }

      toast.success('Conta excluída', {
        description: 'Soft-delete aplicado. Hard-delete em 6 meses (LGPD).',
      });

      await supabase.auth.signOut();
      navigate('/auth');
    } catch (err: any) {
      toast.error('Erro na exclusão', {
        description: err?.message ?? 'Tente novamente.',
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Exportar dados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportar meus dados
          </CardTitle>
          <CardDescription>
            LGPD Art. 18 — Direito de portabilidade. Você recebe um JSON com perfil,
            memberships, leads, mensagens e logs de acesso vinculados à sua conta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleExport} disabled={exporting}>
            {exporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Solicitar exportação
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Excluir conta */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Excluir minha conta
          </CardTitle>
          <CardDescription>
            LGPD Art. 18 — Direito ao esquecimento. Sua conta e dados associados serão
            soft-deleted imediatamente. Hard-delete real após 6 meses (período de auditoria).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog onOpenChange={(open) => { if (!open) setConfirmText(''); }}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={deleting}>
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir minha conta
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação é IRREVERSÍVEL após 6 meses. Você perderá acesso imediatamente.
                  Para confirmar, digite <strong>EXCLUIR MINHA CONTA</strong> abaixo.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-2">
                <Label htmlFor="confirm-delete">Confirmação</Label>
                <Input
                  id="confirm-delete"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="EXCLUIR MINHA CONTA"
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setConfirmText('')}>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleting || confirmText !== 'EXCLUIR MINHA CONTA'}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    'Excluir definitivamente'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
