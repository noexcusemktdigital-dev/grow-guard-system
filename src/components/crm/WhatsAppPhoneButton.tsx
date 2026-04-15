import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WhatsAppPhoneButtonProps {
  phone: string;
  size?: "xs" | "sm";
}

function formatWhatsAppUrl(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const number = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${number}`;
}

export function WhatsAppPhoneButton({ phone, size = "sm" }: WhatsAppPhoneButtonProps) {
  const isXs = size === "xs";
  return (
    <Button
      variant="ghost"
      size="sm"
      className={`${isXs ? "h-5 w-5 p-0" : "h-6 w-6 p-0"} text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10 shrink-0`}
      title="Abrir WhatsApp"
      onClick={(e) => {
        e.stopPropagation();
        window.open(formatWhatsAppUrl(phone), "_blank");
      }}
    >
      <MessageCircle className={isXs ? "w-3 h-3" : "w-3.5 h-3.5"} />
    </Button>
  );
}
