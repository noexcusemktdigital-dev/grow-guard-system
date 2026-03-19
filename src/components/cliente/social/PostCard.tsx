import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, Video, Image, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { PostItem } from "@/hooks/useClientePosts";

interface PostCardProps {
  post: PostItem;
  selectionMode: boolean;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onClick: (post: PostItem) => void;
  onDelete: (id: string) => void;
}

export function PostCard({ post, selectionMode, isSelected, onToggleSelect, onClick, onDelete }: PostCardProps) {
  return (
    <Card
      className={`overflow-hidden group hover:shadow-md transition-shadow cursor-pointer relative ${selectionMode && isSelected ? "ring-2 ring-primary" : ""}`}
      onClick={() => {
        if (selectionMode) { onToggleSelect(post.id); return; }
        onClick(post);
      }}
    >
      {selectionMode && (
        <div className="absolute top-2 left-2 z-10" onClick={(e) => e.stopPropagation()}>
          <Checkbox checked={isSelected} onCheckedChange={() => onToggleSelect(post.id)} />
        </div>
      )}
      {!selectionMode && (
        <button
          className="absolute top-2 left-2 z-10 bg-destructive/90 text-destructive-foreground rounded-md p-1.5 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity"
          onClick={(e) => { e.stopPropagation(); onDelete(post.id); }}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
      {post.result_url ? (
        <div className="aspect-square bg-muted relative overflow-hidden">
          <img src={post.result_url} alt="" className="w-full h-full object-cover" />
          <Badge className="absolute top-2 right-2 text-[10px]" variant={post.status === "approved" ? "default" : "secondary"}>
            {post.status === "approved" ? "Aprovado" : "Pendente"}
          </Badge>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      ) : (
        <div className="aspect-square bg-muted flex items-center justify-center">
          {post.type === "video" ? <Video className="w-8 h-8 text-muted-foreground/40" /> : <Image className="w-8 h-8 text-muted-foreground/40" />}
        </div>
      )}
      <CardContent className="p-3 space-y-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="text-[10px]">{post.type === "video" ? "Vídeo" : "Arte"}</Badge>
          {post.format && <span>{post.format}</span>}
          <span className="ml-auto">{format(new Date(post.created_at), "dd/MM/yy")}</span>
        </div>
        <p className="text-sm line-clamp-2">{post.input_text}</p>
      </CardContent>
    </Card>
  );
}
