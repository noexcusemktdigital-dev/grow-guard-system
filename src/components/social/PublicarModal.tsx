// @ts-nocheck
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { reportError } from "@/lib/error-toast";
import { Share2, AlertCircle, Wifi, Instagram, Linkedin, Globe } from "lucide-react";
import { useSocialAccounts, usePublishPost, SocialAccount } from "@/hooks/useSocialAccounts";
import { useUserOrgId } from "@/hooks/useUserOrgId";

interface PublicarModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string | null;
}

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  google_ads: "Google Ads",
  tiktok: "TikTok",
};

function PlatformIcon({ platform }: { platform: string }) {
  if (platform === "instagram") return <Instagram className="w-4 h-4" />;
  if (platform === "linkedin") return <Linkedin className="w-4 h-4" />;
  return <Globe className="w-4 h-4" />;
}

export function PublicarModal({ open, onOpenChange, postId }: PublicarModalProps) {
  const [selectedAccountIds, setSelectedAccountIds] = useState<Set<string>>(new Set());
  const { data: orgIdData } = useUserOrgId();
  const orgId = orgIdData ?? null;

  const { data: accounts, isLoading: accountsLoading } = useSocialAccounts();
  const publishPost = usePublishPost();

  const activeAccounts = (accounts ?? []).filter(
    (a: SocialAccount) => a.status === "active",
  );

  const toggleAccount = (id: string) => {
    setSelectedAccountIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handlePublish = async () => {
    if (!postId || !orgId || selectedAccountIds.size === 0) return;

    let successCount = 0;
    let errorCount = 0;

    for (const accountId of selectedAccountIds) {
      try {
        await publishPost.mutateAsync({
          social_post_id: postId,
          org_id: orgId,
          account_id: accountId,
        });
        successCount++;
      } catch {
        errorCount++;
      }
    }

    if (successCount > 0) {
      toast.success(
        `Publicado em ${successCount} conta${successCount > 1 ? "s" : ""} com sucesso!`,
      );
    }
    if (errorCount > 0) {
      reportError(new Error(`Falha em ${errorCount} conta${errorCount > 1 ? "s" : ""}`), { title: `Erro ao publicar em ${errorCount} conta${errorCount > 1 ? "s" : ""}`, category: "social.publish_partial" });
    }

    setSelectedAccountIds(new Set());
    onOpenChange(false);
  };

  const handleClose = () => {
    setSelectedAccountIds(new Set());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            Publicar nas Redes
          </DialogTitle>
          <DialogDescription>
            Escolha em quais contas conectadas deseja publicar este post.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-2">
          {accountsLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          )}

          {!accountsLoading && activeAccounts.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <Wifi className="w-10 h-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                Nenhuma conta social conectada.
              </p>
              <p className="text-xs text-muted-foreground/70">
                Acesse <strong>Redes Sociais → Contas</strong> para conectar sua conta.
              </p>
            </div>
          )}

          {!accountsLoading &&
            activeAccounts.map((account: SocialAccount) => (
              <div
                key={account.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => toggleAccount(account.id)}
              >
                <Checkbox
                  checked={selectedAccountIds.has(account.id)}
                  onCheckedChange={() => toggleAccount(account.id)}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="text-muted-foreground">
                  <PlatformIcon platform={account.platform} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {account.account_name ??
                      account.account_username ??
                      PLATFORM_LABELS[account.platform] ??
                      account.platform}
                  </p>
                  {account.account_username && (
                    <p className="text-xs text-muted-foreground truncate">
                      @{account.account_username}
                    </p>
                  )}
                </div>
                <Badge variant="outline" className="text-[10px] shrink-0">
                  {PLATFORM_LABELS[account.platform] ?? account.platform}
                </Badge>
              </div>
            ))}

          {!accountsLoading && accounts && accounts.length > activeAccounts.length && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>
                {accounts.length - activeAccounts.length} conta
                {accounts.length - activeAccounts.length > 1 ? "s" : ""} desconectada
                {accounts.length - activeAccounts.length > 1 ? "s" : ""} — reconecte para
                publicar.
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={publishPost.isPending}>
            Cancelar
          </Button>
          <Button
            onClick={handlePublish}
            disabled={
              selectedAccountIds.size === 0 ||
              publishPost.isPending ||
              !postId
            }
          >
            {publishPost.isPending ? (
              <>
                <Share2 className="w-4 h-4 mr-2 animate-pulse" />
                Publicando…
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 mr-2" />
                Publicar ({selectedAccountIds.size})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
