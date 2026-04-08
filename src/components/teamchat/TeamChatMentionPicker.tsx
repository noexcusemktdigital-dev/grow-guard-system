import { useState, useRef, useEffect, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { TeamMember } from "@/hooks/useTeamChat";

interface Props {
  members: TeamMember[];
  query: string;
  onSelect: (member: TeamMember) => void;
  position: { top: number; left: number } | null;
  visible: boolean;
}

export function TeamChatMentionPicker({ members, query, onSelect, position, visible }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = members.filter((m) =>
    m.full_name.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 6);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!visible || !position || filtered.length === 0) return null;

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div
      ref={listRef}
      className="absolute z-50 bg-popover border border-border rounded-lg shadow-lg py-1 w-56 max-h-48 overflow-y-auto"
      style={{ bottom: position.top, left: position.left }}
    >
      {filtered.map((member, idx) => (
        <button
          key={member.user_id}
          className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent transition-colors ${idx === selectedIndex ? "bg-accent" : ""}`}
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(member);
          }}
          onMouseEnter={() => setSelectedIndex(idx)}
        >
          <Avatar className="h-5 w-5">
            <AvatarImage src={member.avatar_url || undefined} />
            <AvatarFallback className="text-[8px] bg-muted">{getInitials(member.full_name)}</AvatarFallback>
          </Avatar>
          <span className="truncate text-foreground">{member.full_name}</span>
        </button>
      ))}
    </div>
  );
}

/** Keyboard handler — call from parent's onKeyDown */
export function handleMentionKeyDown(
  e: React.KeyboardEvent,
  filteredCount: number,
  selectedIndex: number,
  setSelectedIndex: (i: number) => void,
  onConfirm: () => void
) {
  if (e.key === "ArrowDown") {
    e.preventDefault();
    setSelectedIndex(Math.min(selectedIndex + 1, filteredCount - 1));
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    setSelectedIndex(Math.max(selectedIndex - 1, 0));
  } else if (e.key === "Enter" || e.key === "Tab") {
    e.preventDefault();
    onConfirm();
  } else if (e.key === "Escape") {
    e.preventDefault();
  }
}

/** Parse text and return fragments with mentions highlighted */
export function renderWithMentions(text: string) {
  const mentionRegex = /@\[([^\]]+)\]/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <span key={match.index} className="font-semibold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-0.5 rounded">
        @{match[1]}
      </span>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}
