// @ts-nocheck
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { useGoogleCalendarConnect } from "@/hooks/useGoogleCalendar";
import { reportError } from "@/lib/error-toast";

interface GoogleConnectButtonProps {
  disabled?: boolean;
  portal?: string;
}

export default function GoogleConnectButton({ disabled, portal }: GoogleConnectButtonProps) {
  const connectGoogle = useGoogleCalendarConnect(portal);
  const [connecting, setConnecting] = useState(false);

  async function handleConnect() {
    setConnecting(true);
    try {
      const url = await connectGoogle.mutateAsync();
      window.location.href = url;
    } catch (e: unknown) {
      reportError(e, { title: "Erro ao conectar Google Agenda", category: "agenda.google_connect" });
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
