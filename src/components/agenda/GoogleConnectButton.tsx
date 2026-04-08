import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { useGoogleCalendarConnect } from "@/hooks/useGoogleCalendar";
import { toast } from "sonner";

interface GoogleConnectButtonProps {
  disabled?: boolean;
}

export default function GoogleConnectButton({ disabled }: GoogleConnectButtonProps) {
  const connectGoogle = useGoogleCalendarConnect();
  const [connecting, setConnecting] = useState(false);

  async function handleConnect() {
    setConnecting(true);
    try {
      const redirectUri = `${window.location.origin}${window.location.pathname}`;
      const url = await connectGoogle.mutateAsync(redirectUri);
      window.location.href = url;
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao conectar Google Agenda");
      setConnecting(false);
    }
  }

  return (
    <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={handleConnect} disabled={disabled || connecting}>
      <Calendar className="w-3.5 h-3.5" />
      {connecting ? "Conectando..." : "Conectar Google Agenda"}
    </Button>
  );
}
