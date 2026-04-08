import type { TeamMember } from "@/hooks/useTeamChat";

interface ReactionGroup {
  emoji: string;
  userIds: string[];
  count: number;
}

interface Props {
  reactions: ReactionGroup[];
  currentUserId: string;
  members: TeamMember[];
  onToggle: (emoji: string) => void;
}

export function TeamChatReactions({ reactions, currentUserId, members, onToggle }: Props) {
  const getUserName = (userId: string) =>
    members.find((m) => m.user_id === userId)?.full_name || "Usuário";

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {reactions.map((r) => {
        const isMine = r.userIds.includes(currentUserId);
        const names = r.userIds.map(getUserName).join(", ");
        return (
          <button
            key={r.emoji}
            onClick={() => onToggle(r.emoji)}
            title={names}
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs transition-colors border ${
              isMine
                ? "bg-primary/10 border-primary/30 text-primary"
                : "bg-muted border-border text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <span>{r.emoji}</span>
            <span className="font-medium">{r.count}</span>
          </button>
        );
      })}
    </div>
  );
}
