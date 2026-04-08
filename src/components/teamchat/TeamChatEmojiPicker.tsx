import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const EMOJI_LIST = [
  "👍", "❤️", "😂", "🔥", "✅", "👏", "🎉", "😮",
  "😢", "🙏", "💪", "🤔", "👀", "💯", "⭐", "🚀",
];

interface Props {
  onSelect: (emoji: string) => void;
  trigger: React.ReactNode;
}

export function TeamChatEmojiPicker({ onSelect, trigger }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-auto p-2" side="top" align="start">
        <div className="grid grid-cols-8 gap-0.5">
          {EMOJI_LIST.map((emoji) => (
            <button
              key={emoji}
              onClick={() => { onSelect(emoji); setOpen(false); }}
              className="w-8 h-8 flex items-center justify-center text-lg hover:bg-muted rounded transition-transform hover:scale-110"
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
